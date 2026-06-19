// @purpose Verifies the Conductor-compatible backend workflow against a real git repo.
// @role    Rust E2E tests for import, create/setup, file copy, archive, and dirty rejection.
// @deps    sqlx, git CLI, use cases, shared DTOs, std fs/process
// @gotcha  Tests create throwaway repos under the OS temp directory and never touch real workspaces.
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::time::{SystemTime, UNIX_EPOCH};

use sqlx::sqlite::SqlitePoolOptions;

use crate::shared::dto::conductor::ImportConductorProjectsInput;
use crate::shared::dto::projects::{
    ArchivePolicyDto, CreateProjectInput, ProjectCommandsDto, RemoveProjectInput,
    UpdateProjectSettingsInput,
};
use crate::shared::dto::workspaces::{
    ArchivePolicyChoiceDto, ArchiveWorkspaceInput, CreateWorkspaceInput, RefreshProjectInput,
    WorkspaceLifecycleStatusDto, WorkspaceOperationStatusDto,
};
use crate::use_cases::projects::{
    create_project, import_conductor_projects, list_worktree_projects, remove_project,
    update_project_settings,
};
use crate::use_cases::workspaces::{archive_workspace, create_workspace, refresh_project};

#[test]
fn conductor_backend_flow_import_create_archive_and_reject_dirty_remove() {
    tauri::async_runtime::block_on(async {
        let fixture = Fixture::new("grove e2e backend flow");
        let db = SqlitePoolOptions::new()
            .max_connections(1)
            .connect("sqlite::memory:")
            .await
            .expect("in-memory sqlite should open");
        sqlx::migrate!("./migrations")
            .run(&db)
            .await
            .expect("migrations should run");

        let repo_path = fixture.path("source repo");
        let conductor_root = fixture.path("conductor workspaces");
        let repo_workspace_root = conductor_root.join("source repo");
        let imported_workspace = repo_workspace_root.join("imported workspace");
        let custom_workspace_root = fixture.path("custom workspaces").join("source repo");
        let log_root = fixture.path("operation logs");

        create_repo(&repo_path);
        let canonical_repo_path = repo_path
            .canonicalize()
            .expect("repo path should canonicalize");
        fs::create_dir_all(&repo_workspace_root).expect("workspace root should be created");
        run_git(
            &repo_path,
            &[
                "worktree",
                "add",
                "-b",
                "imported/existing",
                imported_workspace.to_str().unwrap(),
                "main",
            ],
        );

        let imported = import_conductor_projects::run(
            &db,
            ImportConductorProjectsInput {
                workspace_root: Some(conductor_root.to_string_lossy().to_string()),
            },
        )
        .await
        .expect("import should succeed");
        assert_eq!(imported.len(), 1);
        assert_eq!(imported[0].workspaces.len(), 2);
        assert!(imported[0]
            .workspaces
            .iter()
            .any(|workspace| workspace.path == canonical_repo_path.to_string_lossy().to_string()));

        let project_id = list_worktree_projects::run(&db)
            .await
            .expect("projects should list")[0]
            .project
            .id
            .clone();

        update_project_settings::run(
            &db,
            UpdateProjectSettingsInput {
                project_id: project_id.clone(),
                workspace_root: custom_workspace_root.to_string_lossy().to_string(),
                archive_policy: ArchivePolicyDto::Ask,
                commands: ProjectCommandsDto {
                    setup: "printf 'setup:%s|%s' \"$CONDUCTOR_WORKSPACE_NAME\" \"$CONDUCTOR_DEFAULT_BRANCH\""
                        .into(),
                    archive: "printf 'archive:%s' \"$CONDUCTOR_WORKSPACE_NAME\"".into(),
                },
            },
        )
        .await
        .expect("settings should persist");

        let created = create_workspace::run(
            &db,
            CreateWorkspaceInput {
                project_id: project_id.clone(),
                name: "feature workspace".into(),
                branch: "feature/new".into(),
                base_branch: "main".into(),
                run_setup: true,
            },
            log_root.clone(),
        )
        .await
        .expect("workspace should be created");
        let created_path = PathBuf::from(&created.path);
        assert!(created_path.join(".env.local").exists());
        assert!(created_path.join("secrets/dev.local").exists());

        let setup_log = latest_operation_log(&db, "create").await;
        assert!(fs::read_to_string(setup_log)
            .expect("setup log should be readable")
            .contains("setup:feature workspace|main"));

        let hidden = archive_workspace::run(
            &db,
            ArchiveWorkspaceInput {
                workspace_id: created.id.clone(),
                policy: Some(ArchivePolicyChoiceDto::Hide),
                remember_policy: true,
            },
            log_root.clone(),
        )
        .await
        .expect("hide archive should succeed");
        assert!(matches!(
            hidden.lifecycle_status,
            WorkspaceLifecycleStatusDto::Hidden
        ));
        assert!(created_path.exists());
        let archive_log = latest_operation_log(&db, "archive").await;
        assert!(fs::read_to_string(archive_log)
            .expect("archive log should be readable")
            .contains("archive:feature workspace"));

        let removable = create_workspace::run(
            &db,
            CreateWorkspaceInput {
                project_id: project_id.clone(),
                name: "remove workspace".into(),
                branch: "feature/remove".into(),
                base_branch: "main".into(),
                run_setup: false,
            },
            log_root.clone(),
        )
        .await
        .expect("removable workspace should be created");
        let removable_path = PathBuf::from(&removable.path);
        archive_workspace::run(
            &db,
            ArchiveWorkspaceInput {
                workspace_id: removable.id,
                policy: Some(ArchivePolicyChoiceDto::RemoveWorktree),
                remember_policy: false,
            },
            log_root.clone(),
        )
        .await
        .expect("clean remove_worktree should succeed");
        assert!(!removable_path.exists());

        let dirty = create_workspace::run(
            &db,
            CreateWorkspaceInput {
                project_id,
                name: "dirty workspace".into(),
                branch: "feature/dirty".into(),
                base_branch: "main".into(),
                run_setup: false,
            },
            log_root,
        )
        .await
        .expect("dirty workspace should be created");
        let dirty_path = PathBuf::from(&dirty.path);
        fs::write(dirty_path.join("README.md"), "changed").expect("tracked file should change");
        let result = archive_workspace::run(
            &db,
            ArchiveWorkspaceInput {
                workspace_id: dirty.id,
                policy: Some(ArchivePolicyChoiceDto::RemoveWorktree),
                remember_policy: false,
            },
            fixture.path("dirty operation logs"),
        )
        .await;
        assert!(result.is_err());
        assert!(dirty_path.exists());
    });
}

#[test]
fn manual_add_project_registers_selected_git_repo() {
    tauri::async_runtime::block_on(async {
        let fixture = Fixture::new("grove manual add project");
        let db = SqlitePoolOptions::new()
            .max_connections(1)
            .connect("sqlite::memory:")
            .await
            .expect("in-memory sqlite should open");
        sqlx::migrate!("./migrations")
            .run(&db)
            .await
            .expect("migrations should run");

        let older_repo_path = fixture.path("zeta repo");
        create_repo(&older_repo_path);

        create_project::run(
            &db,
            CreateProjectInput {
                root_path: older_repo_path.to_string_lossy().to_string(),
            },
        )
        .await
        .expect("older manual project registration should succeed");

        let repo_path = fixture.path("alpha repo");
        create_repo(&repo_path);
        let canonical_repo_path = repo_path
            .canonicalize()
            .expect("repo path should canonicalize");

        let project = create_project::run(
            &db,
            CreateProjectInput {
                root_path: repo_path.to_string_lossy().to_string(),
            },
        )
        .await
        .expect("manual project registration should succeed");

        assert_eq!(project.name, "alpha repo");
        assert_eq!(project.root_path, canonical_repo_path.to_string_lossy());
        assert_eq!(project.default_branch, "main");
        assert!(project.workspace_root.ends_with("alpha repo"));

        let listed = list_worktree_projects::run(&db)
            .await
            .expect("registered projects should list");
        assert_eq!(listed.len(), 2);
        assert_eq!(listed[0].project.id, project.id);
        assert_eq!(listed[0].project.name, "alpha repo");
        assert_eq!(listed[1].project.name, "zeta repo");
        assert_eq!(listed[0].commands.setup, "");
        assert_eq!(listed[0].workspaces.len(), 1);
        let root_workspace = &listed[0].workspaces[0];
        assert_eq!(root_workspace.name, "alpha repo");
        assert_eq!(root_workspace.branch, "main");
        assert_eq!(root_workspace.base_branch, None);
        assert_eq!(
            root_workspace.path,
            canonical_repo_path.to_string_lossy().to_string()
        );
    });
}

#[test]
fn archive_missing_workspace_hides_record_without_path_error() {
    tauri::async_runtime::block_on(async {
        let fixture = Fixture::new("grove archive missing workspace");
        let db = migrated_db().await;
        let repo_path = fixture.path("source repo");
        create_repo(&repo_path);
        let project = create_project::run(
            &db,
            CreateProjectInput {
                root_path: repo_path.to_string_lossy().to_string(),
            },
        )
        .await
        .expect("project should register");
        let workspace_root = fixture.path("workspaces").join("source repo");
        set_project_settings(
            &db,
            &project.id,
            &workspace_root,
            ProjectCommandsDto {
                setup: String::new(),
                archive: "printf should-not-run".into(),
            },
        )
        .await;
        let workspace = create_workspace::run(
            &db,
            CreateWorkspaceInput {
                project_id: project.id.clone(),
                name: "missing workspace".into(),
                branch: "feature/missing".into(),
                base_branch: "main".into(),
                run_setup: false,
            },
            fixture.path("logs"),
        )
        .await
        .expect("workspace should create");
        let workspace_path = PathBuf::from(&workspace.path);
        fs::remove_dir_all(&workspace_path).expect("workspace should be deleted externally");

        refresh_project::run(
            &db,
            RefreshProjectInput {
                project_id: project.id.clone(),
            },
        )
        .await
        .expect("refresh should tolerate the missing workspace");
        let stale = list_worktree_projects::run(&db)
            .await
            .expect("projects should list after refresh")[0]
            .workspaces
            .iter()
            .find(|item| item.id == workspace.id)
            .expect("stale workspace record should remain")
            .clone();
        assert!(matches!(
            stale.lifecycle_status,
            WorkspaceLifecycleStatusDto::Stale
        ));

        let hidden = archive_workspace::run(
            &db,
            ArchiveWorkspaceInput {
                workspace_id: workspace.id,
                policy: Some(ArchivePolicyChoiceDto::RemoveWorktree),
                remember_policy: false,
            },
            fixture.path("archive logs"),
        )
        .await
        .expect("archive should clean up missing workspace records");

        assert!(matches!(
            hidden.lifecycle_status,
            WorkspaceLifecycleStatusDto::Hidden
        ));
        assert!(!workspace_path.exists());
        let cleanup_log = latest_operation_log(&db, "archive").await;
        assert!(fs::read_to_string(cleanup_log)
            .expect("cleanup log should be readable")
            .contains("hiding Grove workspace record"));
    });
}

#[test]
fn archive_rejects_project_root_workspace() {
    tauri::async_runtime::block_on(async {
        let fixture = Fixture::new("grove archive root workspace");
        let db = migrated_db().await;
        let repo_path = fixture.path("source repo");
        create_repo(&repo_path);
        let project = create_project::run(
            &db,
            CreateProjectInput {
                root_path: repo_path.to_string_lossy().to_string(),
            },
        )
        .await
        .expect("project should register");
        let root_workspace = list_worktree_projects::run(&db)
            .await
            .expect("projects should list")[0]
            .workspaces[0]
            .clone();

        let result = archive_workspace::run(
            &db,
            ArchiveWorkspaceInput {
                workspace_id: root_workspace.id,
                policy: Some(ArchivePolicyChoiceDto::Hide),
                remember_policy: false,
            },
            fixture.path("archive logs"),
        )
        .await;

        assert!(result.is_err());
        assert!(repo_path.exists());
        let listed = list_worktree_projects::run(&db)
            .await
            .expect("projects should remain listed");
        assert_eq!(listed[0].project.id, project.id);
        assert!(matches!(
            listed[0].workspaces[0].lifecycle_status,
            WorkspaceLifecycleStatusDto::Active
        ));
    });
}

#[test]
fn failed_setup_marks_workspace_failed() {
    tauri::async_runtime::block_on(async {
        let fixture = Fixture::new("grove failed setup");
        let db = SqlitePoolOptions::new()
            .max_connections(1)
            .connect("sqlite::memory:")
            .await
            .expect("in-memory sqlite should open");
        sqlx::migrate!("./migrations")
            .run(&db)
            .await
            .expect("migrations should run");

        let repo_path = fixture.path("source repo");
        create_repo(&repo_path);
        let project = create_project::run(
            &db,
            CreateProjectInput {
                root_path: repo_path.to_string_lossy().to_string(),
            },
        )
        .await
        .expect("manual project registration should succeed");

        update_project_settings::run(
            &db,
            UpdateProjectSettingsInput {
                project_id: project.id.clone(),
                workspace_root: fixture
                    .path("custom workspaces")
                    .join("source repo")
                    .to_string_lossy()
                    .to_string(),
                archive_policy: ArchivePolicyDto::Ask,
                commands: ProjectCommandsDto {
                    setup: "exit 7".into(),
                    archive: String::new(),
                },
            },
        )
        .await
        .expect("settings should persist");

        let result = create_workspace::run(
            &db,
            CreateWorkspaceInput {
                project_id: project.id.clone(),
                name: "broken setup".into(),
                branch: "broken-setup".into(),
                base_branch: "main".into(),
                run_setup: true,
            },
            fixture.path("operation logs"),
        )
        .await;

        assert!(result.is_err());
        let listed = list_worktree_projects::run(&db)
            .await
            .expect("projects should list after failed setup");
        let workspace = listed[0]
            .workspaces
            .iter()
            .find(|workspace| workspace.name == "broken setup")
            .expect("failed workspace row should remain visible");
        assert!(matches!(
            workspace.operation_status,
            WorkspaceOperationStatusDto::Failed
        ));
    });
}

#[test]
fn remove_project_grove_only_keeps_worktree_directories() {
    tauri::async_runtime::block_on(async {
        let fixture = Fixture::new("grove remove project only");
        let db = migrated_db().await;
        let repo_path = fixture.path("source repo");
        create_repo(&repo_path);
        let project = create_project::run(
            &db,
            CreateProjectInput {
                root_path: repo_path.to_string_lossy().to_string(),
            },
        )
        .await
        .expect("project should register");
        let workspace_root = fixture.path("workspaces").join("source repo");
        set_project_settings(
            &db,
            &project.id,
            &workspace_root,
            ProjectCommandsDto {
                setup: String::new(),
                archive: "printf archive".into(),
            },
        )
        .await;
        let workspace = create_workspace::run(
            &db,
            CreateWorkspaceInput {
                project_id: project.id.clone(),
                name: "keep workspace".into(),
                branch: "feature/keep".into(),
                base_branch: "main".into(),
                run_setup: false,
            },
            fixture.path("logs"),
        )
        .await
        .expect("workspace should create");
        let workspace_path = PathBuf::from(&workspace.path);
        set_remove_project_behavior(&db, "grove_only").await;

        remove_project::run(
            &db,
            RemoveProjectInput {
                project_id: project.id.clone(),
            },
            fixture.path("remove logs"),
        )
        .await
        .expect("project should be removed from Grove only");

        assert!(workspace_path.exists());
        assert!(repo_path.exists());
        assert!(list_worktree_projects::run(&db)
            .await
            .expect("projects should list")
            .is_empty());
    });
}

#[test]
fn remove_project_deletes_multiple_clean_managed_worktrees() {
    tauri::async_runtime::block_on(async {
        let fixture = Fixture::new("grove remove project worktrees");
        let db = migrated_db().await;
        let repo_path = fixture.path("source repo");
        create_repo(&repo_path);
        let project = create_project::run(
            &db,
            CreateProjectInput {
                root_path: repo_path.to_string_lossy().to_string(),
            },
        )
        .await
        .expect("project should register");
        let workspace_root = fixture.path("workspaces").join("source repo");
        set_project_settings(
            &db,
            &project.id,
            &workspace_root,
            ProjectCommandsDto {
                setup: String::new(),
                archive: "printf 'archive:%s\\n' \"$CONDUCTOR_WORKSPACE_NAME\"".into(),
            },
        )
        .await;

        let first = create_workspace::run(
            &db,
            CreateWorkspaceInput {
                project_id: project.id.clone(),
                name: "alpha workspace".into(),
                branch: "feature/alpha".into(),
                base_branch: "main".into(),
                run_setup: false,
            },
            fixture.path("logs"),
        )
        .await
        .expect("first workspace should create");
        let second = create_workspace::run(
            &db,
            CreateWorkspaceInput {
                project_id: project.id.clone(),
                name: "beta workspace".into(),
                branch: "feature/beta".into(),
                base_branch: "main".into(),
                run_setup: false,
            },
            fixture.path("logs"),
        )
        .await
        .expect("second workspace should create");
        let first_path = PathBuf::from(&first.path);
        let second_path = PathBuf::from(&second.path);
        set_remove_project_behavior(&db, "delete_worktrees").await;

        remove_project::run(
            &db,
            RemoveProjectInput {
                project_id: project.id.clone(),
            },
            fixture.path("remove logs"),
        )
        .await
        .expect("clean managed worktrees should be removed");

        assert!(!first_path.exists());
        assert!(!second_path.exists());
        assert!(repo_path.exists());
        assert!(list_worktree_projects::run(&db)
            .await
            .expect("projects should list")
            .is_empty());
    });
}

#[test]
fn remove_project_dirty_workspace_blocks_all_deletion() {
    tauri::async_runtime::block_on(async {
        let fixture = Fixture::new("grove remove project dirty");
        let db = migrated_db().await;
        let repo_path = fixture.path("source repo");
        create_repo(&repo_path);
        let project = create_project::run(
            &db,
            CreateProjectInput {
                root_path: repo_path.to_string_lossy().to_string(),
            },
        )
        .await
        .expect("project should register");
        let workspace_root = fixture.path("workspaces").join("source repo");
        set_project_settings(
            &db,
            &project.id,
            &workspace_root,
            ProjectCommandsDto {
                setup: String::new(),
                archive: "exit 99".into(),
            },
        )
        .await;

        let clean = create_workspace::run(
            &db,
            CreateWorkspaceInput {
                project_id: project.id.clone(),
                name: "clean workspace".into(),
                branch: "feature/clean".into(),
                base_branch: "main".into(),
                run_setup: false,
            },
            fixture.path("logs"),
        )
        .await
        .expect("clean workspace should create");
        let dirty = create_workspace::run(
            &db,
            CreateWorkspaceInput {
                project_id: project.id.clone(),
                name: "dirty workspace".into(),
                branch: "feature/dirty-remove".into(),
                base_branch: "main".into(),
                run_setup: false,
            },
            fixture.path("logs"),
        )
        .await
        .expect("dirty workspace should create");
        let clean_path = PathBuf::from(&clean.path);
        let dirty_path = PathBuf::from(&dirty.path);
        fs::write(dirty_path.join("README.md"), "dirty").expect("tracked file should change");
        set_remove_project_behavior(&db, "delete_worktrees").await;

        let result = remove_project::run(
            &db,
            RemoveProjectInput {
                project_id: project.id.clone(),
            },
            fixture.path("remove logs"),
        )
        .await;

        assert!(result.is_err());
        assert!(clean_path.exists());
        assert!(dirty_path.exists());
        assert_eq!(
            list_worktree_projects::run(&db)
                .await
                .expect("project should remain")
                .len(),
            1
        );
    });
}

async fn latest_operation_log(db: &sqlx::SqlitePool, kind: &str) -> PathBuf {
    let (log_path,): (String,) = sqlx::query_as(
        r#"
        SELECT log_path
        FROM operations
        WHERE kind = ?1 AND log_path IS NOT NULL
        ORDER BY started_at DESC
        LIMIT 1
        "#,
    )
    .bind(kind)
    .fetch_one(db)
    .await
    .expect("operation log row should exist");
    PathBuf::from(log_path)
}

async fn migrated_db() -> sqlx::SqlitePool {
    let db = SqlitePoolOptions::new()
        .max_connections(1)
        .connect("sqlite::memory:")
        .await
        .expect("in-memory sqlite should open");
    sqlx::migrate!("./migrations")
        .run(&db)
        .await
        .expect("migrations should run");
    db
}

async fn set_project_settings(
    db: &sqlx::SqlitePool,
    project_id: &str,
    workspace_root: &Path,
    commands: ProjectCommandsDto,
) {
    update_project_settings::run(
        db,
        UpdateProjectSettingsInput {
            project_id: project_id.to_string(),
            workspace_root: workspace_root.to_string_lossy().to_string(),
            archive_policy: ArchivePolicyDto::UseGlobal,
            commands,
        },
    )
    .await
    .expect("settings should persist");
}

async fn set_remove_project_behavior(db: &sqlx::SqlitePool, behavior: &str) {
    sqlx::query(
        r#"
        INSERT INTO app_settings (key, value)
        VALUES ('remove_project_behavior', ?1)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
        "#,
    )
    .bind(behavior)
    .execute(db)
    .await
    .expect("remove project behavior should persist");
}

fn create_repo(repo_path: &Path) {
    fs::create_dir_all(repo_path).expect("repo dir should be created");
    run(Command::new("git")
        .arg("init")
        .arg("-b")
        .arg("main")
        .arg(repo_path));
    run_git(
        repo_path,
        &["config", "user.email", "grove@example.invalid"],
    );
    run_git(repo_path, &["config", "user.name", "Grove Test"]);

    fs::create_dir_all(repo_path.join(".conductor")).expect("conductor config dir should exist");
    fs::create_dir_all(repo_path.join("secrets")).expect("secret dir should exist");
    fs::write(repo_path.join("README.md"), "hello").expect("README should be written");
    fs::write(
        repo_path.join(".gitignore"),
        ".env*\nsecrets/*.local\nsetup.env\n",
    )
    .expect("gitignore should be written");
    fs::write(repo_path.join(".env.local"), "TOKEN=local").expect("env should be written");
    fs::write(repo_path.join("secrets/dev.local"), "SECRET=local")
        .expect("secret should be written");
    fs::write(
        repo_path.join(".conductor/settings.toml"),
        "file_include_globs = [\".env*\", \"secrets/*.local\"]\n[scripts]\nrun = \"pnpm dev\"\n",
    )
    .expect("settings should be written");

    run_git(
        repo_path,
        &["add", "README.md", ".gitignore", ".conductor/settings.toml"],
    );
    run_git(repo_path, &["commit", "-m", "initial"]);
}

fn run_git(repo_path: &Path, args: &[&str]) {
    let mut command = Command::new("git");
    command.arg("-C").arg(repo_path).args(args);
    run(&mut command);
}

fn run(command: &mut Command) {
    let output = command.output().expect("command should spawn");
    assert!(
        output.status.success(),
        "command failed\nstdout:\n{}\nstderr:\n{}",
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );
}

struct Fixture {
    root: PathBuf,
}

impl Fixture {
    fn new(name: &str) -> Self {
        let millis = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("system time should be after epoch")
            .as_millis();
        let root = std::env::temp_dir().join(format!("{name}-{millis}"));
        fs::create_dir_all(&root).expect("fixture root should be created");
        Self { root }
    }

    fn path(&self, child: &str) -> PathBuf {
        self.root.join(child)
    }
}

impl Drop for Fixture {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.root);
    }
}
