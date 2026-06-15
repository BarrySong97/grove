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
    ArchivePolicyDto, ProjectCommandsDto, UpdateProjectSettingsInput,
};
use crate::shared::dto::workspaces::{
    ArchivePolicyChoiceDto, ArchiveWorkspaceInput, CreateWorkspaceInput,
    WorkspaceLifecycleStatusDto,
};
use crate::use_cases::projects::{
    import_conductor_projects, list_worktree_projects, update_project_settings,
};
use crate::use_cases::workspaces::{archive_workspace, create_workspace};

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
        assert_eq!(imported[0].workspaces.len(), 1);

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
                    run: "pnpm dev".into(),
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
                policy: ArchivePolicyChoiceDto::Hide,
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
                policy: ArchivePolicyChoiceDto::RemoveWorktree,
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
                policy: ArchivePolicyChoiceDto::RemoveWorktree,
                remember_policy: false,
            },
            fixture.path("dirty operation logs"),
        )
        .await;
        assert!(result.is_err());
        assert!(dirty_path.exists());
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
