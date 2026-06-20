// @purpose Reads Conductor project configuration files.
// @role    Filesystem/config adapter used by import and create workspace use cases.
// @deps    serde_json, toml, std fs/path, project DTOs, shared errors
// @gotcha  Each script field is resolved across .conductor/settings(.local).toml > repo conductor.json > global ~/.conductor/settings.toml; a higher file missing a script key falls through to a lower file instead of shadowing it.
use std::fs;
use std::path::{Path, PathBuf};

use serde_json::Value as JsonValue;
use toml::{Table as TomlTable, Value as TomlValue};

use crate::shared::dto::errors::{AppError, AppResult};
use crate::shared::dto::projects::ConfigSourceDto;

#[derive(Debug, Clone)]
pub(crate) struct ResolvedProjectConfig {
    pub source: ConfigSourceDto,
    pub setup_command: Option<String>,
    pub archive_command: Option<String>,
    pub run_command: Option<String>,
    pub file_include_globs: Vec<String>,
}

pub(crate) fn read_project_config(repo_path: &Path) -> AppResult<ResolvedProjectConfig> {
    resolve_project_config(repo_path, user_settings_path())
}

fn resolve_project_config(
    repo_path: &Path,
    user_settings: Option<PathBuf>,
) -> AppResult<ResolvedProjectConfig> {
    // Conductor splits config across files: `.conductor/settings(.local).toml`
    // carries repo prefs (e.g. scripts.run_mode), while `conductor.json` carries
    // the setup/run/archive commands. Read every present source in precedence
    // order (highest first) and merge per field, so a higher file that lacks a
    // given script key falls through to a lower file instead of shadowing it.
    let mut layers: Vec<ResolvedProjectConfig> = Vec::new();

    let local_settings = repo_path.join(".conductor").join("settings.local.toml");
    if local_settings.exists() {
        layers.push(read_settings_toml(
            &local_settings,
            ConfigSourceDto::ConductorSettings,
        )?);
    }

    let shared_settings = repo_path.join(".conductor").join("settings.toml");
    if shared_settings.exists() {
        layers.push(read_settings_toml(
            &shared_settings,
            ConfigSourceDto::ConductorSettings,
        )?);
    }

    let conductor_json = repo_path.join("conductor.json");
    if conductor_json.exists() {
        layers.push(read_conductor_json(&conductor_json)?);
    }

    if let Some(user_settings) = user_settings.filter(|path| path.exists()) {
        layers.push(read_settings_toml(
            &user_settings,
            ConfigSourceDto::ConductorSettings,
        )?);
    }

    let source = layers
        .first()
        .map(|layer| layer.source.clone())
        .unwrap_or(ConfigSourceDto::None);

    let mut merged = ResolvedProjectConfig {
        source,
        setup_command: None,
        archive_command: None,
        run_command: None,
        file_include_globs: Vec::new(),
    };
    for layer in layers {
        merged.setup_command = merged.setup_command.take().or(layer.setup_command);
        merged.archive_command = merged.archive_command.take().or(layer.archive_command);
        merged.run_command = merged.run_command.take().or(layer.run_command);
        if merged.file_include_globs.is_empty() {
            merged.file_include_globs = layer.file_include_globs;
        }
    }

    Ok(merged)
}

pub(crate) fn read_user_workspace_root() -> AppResult<Option<PathBuf>> {
    let Some(path) = user_settings_path().filter(|path| path.exists()) else {
        return Ok(None);
    };
    let content = fs::read_to_string(&path)?;
    let value = content
        .parse::<TomlTable>()
        .map_err(|error| AppError::ConfigParseFailed {
            message: format!("Failed to parse {}: {error}", path.display()),
        })?;
    Ok(get_toml_string_from_table(
        &value,
        &[
            "workspace_location",
            "workspaceLocation",
            "workspace_root",
            "workspaceRoot",
        ],
    )
    .map(PathBuf::from))
}

fn read_settings_toml(path: &Path, source: ConfigSourceDto) -> AppResult<ResolvedProjectConfig> {
    let content = fs::read_to_string(path)?;
    let value = content
        .parse::<TomlTable>()
        .map_err(|error| AppError::ConfigParseFailed {
            message: format!("Failed to parse {}: {error}", path.display()),
        })?;

    let scripts = value.get("scripts");
    Ok(ResolvedProjectConfig {
        source,
        setup_command: get_toml_string(scripts, "setup"),
        archive_command: get_toml_string(scripts, "archive"),
        run_command: get_toml_string(scripts, "run"),
        file_include_globs: get_toml_string_array(&value, "file_include_globs"),
    })
}

fn read_conductor_json(path: &Path) -> AppResult<ResolvedProjectConfig> {
    let content = fs::read_to_string(path)?;
    let value = serde_json::from_str::<JsonValue>(&content).map_err(|error| {
        AppError::ConfigParseFailed {
            message: format!("Failed to parse {}: {error}", path.display()),
        }
    })?;

    let scripts = value.get("scripts");
    Ok(ResolvedProjectConfig {
        source: ConfigSourceDto::ConductorJson,
        setup_command: get_json_string(scripts, "setup"),
        archive_command: get_json_string(scripts, "archive"),
        run_command: get_json_string(scripts, "run"),
        file_include_globs: get_json_string_array(&value, "file_include_globs"),
    })
}

fn get_toml_string(parent: Option<&TomlValue>, key: &str) -> Option<String> {
    parent
        .and_then(|value| value.get(key))
        .and_then(TomlValue::as_str)
        .map(str::to_string)
}

fn get_toml_string_from_table(parent: &TomlTable, keys: &[&str]) -> Option<String> {
    keys.iter()
        .find_map(|key| parent.get(*key).and_then(TomlValue::as_str))
        .map(str::to_string)
}

fn get_toml_string_array(parent: &TomlTable, key: &str) -> Vec<String> {
    parent
        .get(key)
        .and_then(TomlValue::as_array)
        .map(|items| {
            items
                .iter()
                .filter_map(TomlValue::as_str)
                .map(str::to_string)
                .collect()
        })
        .unwrap_or_default()
}

fn get_json_string(parent: Option<&JsonValue>, key: &str) -> Option<String> {
    parent
        .and_then(|value| value.get(key))
        .and_then(JsonValue::as_str)
        .map(str::to_string)
}

fn get_json_string_array(parent: &JsonValue, key: &str) -> Vec<String> {
    parent
        .get(key)
        .and_then(JsonValue::as_array)
        .map(|items| {
            items
                .iter()
                .filter_map(JsonValue::as_str)
                .map(str::to_string)
                .collect()
        })
        .unwrap_or_default()
}

fn user_settings_path() -> Option<PathBuf> {
    std::env::var_os("HOME")
        .map(PathBuf::from)
        .map(|home| home.join(".conductor").join("settings.toml"))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::{SystemTime, UNIX_EPOCH};

    #[test]
    fn extracts_toml_scripts() {
        let value = "[scripts]\nsetup = \"pnpm install\"\narchive = \"./archive.sh\"\n"
            .parse::<TomlTable>()
            .expect("toml fixture should parse");
        let scripts = value.get("scripts");
        assert_eq!(
            get_toml_string(scripts, "setup").as_deref(),
            Some("pnpm install")
        );
        assert_eq!(
            get_toml_string(scripts, "archive").as_deref(),
            Some("./archive.sh")
        );
        assert_eq!(get_toml_string(scripts, "run"), None);
    }

    #[test]
    fn extracts_toml_file_include_globs() {
        let value = "file_include_globs = [\".env*\", \"config/*.local\"]"
            .parse::<TomlTable>()
            .expect("toml fixture should parse");
        assert_eq!(
            get_toml_string_array(&value, "file_include_globs"),
            vec![".env*".to_string(), "config/*.local".to_string()]
        );
    }

    #[test]
    fn reads_legacy_conductor_json() {
        let fixture = Fixture::new("conductor-json");
        let config_path = fixture.path().join("conductor.json");
        fs::write(
            &config_path,
            r#"{
              "scripts": {
                "setup": "pnpm install",
                "archive": "./archive.sh",
                "run": "pnpm dev"
              },
              "file_include_globs": [".env*", "config/*.local"]
            }"#,
        )
        .expect("json config should be written");

        let config = read_conductor_json(&config_path).expect("json config should parse");
        assert!(matches!(config.source, ConfigSourceDto::ConductorJson));
        assert_eq!(config.setup_command.as_deref(), Some("pnpm install"));
        assert_eq!(config.archive_command.as_deref(), Some("./archive.sh"));
        assert_eq!(config.run_command.as_deref(), Some("pnpm dev"));
        assert_eq!(
            config.file_include_globs,
            vec![".env*".to_string(), "config/*.local".to_string()]
        );
    }

    #[test]
    fn settings_toml_takes_precedence_over_conductor_json() {
        let fixture = Fixture::new("config-precedence");
        fs::create_dir_all(fixture.path().join(".conductor"))
            .expect("config dir should be created");
        fs::write(
            fixture.path().join(".conductor/settings.toml"),
            "[scripts]\nsetup = \"from settings\"\n",
        )
        .expect("settings should be written");
        fs::write(
            fixture.path().join("conductor.json"),
            r#"{"scripts":{"setup":"from json"}}"#,
        )
        .expect("json config should be written");

        let config = read_project_config(fixture.path()).expect("settings should parse");
        assert!(matches!(config.source, ConfigSourceDto::ConductorSettings));
        assert_eq!(config.setup_command.as_deref(), Some("from settings"));
    }

    #[test]
    fn conductor_json_wins_over_global_user_settings() {
        let fixture = Fixture::new("json-over-global");
        fs::write(
            fixture.path().join("conductor.json"),
            r#"{"scripts":{"setup":"from json","archive":"from json archive"}}"#,
        )
        .expect("json config should be written");

        let global = Fixture::new("global-settings");
        let global_settings = global.path().join("settings.toml");
        fs::write(&global_settings, "[scripts]\nsetup = \"from global\"\n")
            .expect("global settings should be written");

        let config = resolve_project_config(fixture.path(), Some(global_settings))
            .expect("config should resolve");
        assert!(matches!(config.source, ConfigSourceDto::ConductorJson));
        assert_eq!(config.setup_command.as_deref(), Some("from json"));
        assert_eq!(config.archive_command.as_deref(), Some("from json archive"));
    }

    #[test]
    fn settings_local_without_scripts_falls_through_to_conductor_json() {
        // Real Conductor layout: settings.local.toml only carries scripts.run_mode,
        // while conductor.json holds the actual setup/archive/run commands.
        let fixture = Fixture::new("local-no-scripts");
        fs::create_dir_all(fixture.path().join(".conductor"))
            .expect("config dir should be created");
        fs::write(
            fixture.path().join(".conductor/settings.local.toml"),
            "[scripts]\nrun_mode = \"concurrent\"\n",
        )
        .expect("local settings should be written");
        fs::write(
            fixture.path().join("conductor.json"),
            r#"{"scripts":{"setup":"pnpm install","archive":"pnpm archive","run":"bash scripts/dev.sh"}}"#,
        )
        .expect("json config should be written");

        let config = resolve_project_config(fixture.path(), None).expect("config should resolve");
        assert_eq!(config.setup_command.as_deref(), Some("pnpm install"));
        assert_eq!(config.archive_command.as_deref(), Some("pnpm archive"));
        assert_eq!(config.run_command.as_deref(), Some("bash scripts/dev.sh"));
    }

    #[test]
    fn falls_back_to_global_user_settings_without_repo_config() {
        let fixture = Fixture::new("global-fallback");
        let global = Fixture::new("global-only");
        let global_settings = global.path().join("settings.toml");
        fs::write(&global_settings, "[scripts]\nsetup = \"from global\"\n")
            .expect("global settings should be written");

        let config = resolve_project_config(fixture.path(), Some(global_settings))
            .expect("config should resolve");
        assert!(matches!(config.source, ConfigSourceDto::ConductorSettings));
        assert_eq!(config.setup_command.as_deref(), Some("from global"));
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
            let root = std::env::temp_dir().join(format!("grove-{name}-{millis}"));
            fs::create_dir_all(&root).expect("fixture root should be created");
            Self { root }
        }

        fn path(&self) -> &Path {
            &self.root
        }
    }

    impl Drop for Fixture {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.root);
        }
    }
}
