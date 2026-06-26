// @purpose Lists git branches that can be used as a new workspace base.
// @role    Read-only workspace use case for local and remote-tracking branch selection.
// @deps    project repository, git worktree repository, workspace DTOs
// @gotcha  This reads existing refs only; it does not fetch from remotes or mutate git state.
use std::path::Path;

use sqlx::SqlitePool;

use crate::infrastructure::db::repositories::projects_repository;
use crate::infrastructure::git::worktree_repository;
use crate::shared::dto::errors::AppResult;
use crate::shared::dto::workspaces::ListBaseBranchesInput;

pub(crate) async fn run(pool: &SqlitePool, input: ListBaseBranchesInput) -> AppResult<Vec<String>> {
    let project = projects_repository::get_project(pool, &input.project_id).await?;
    let branches = worktree_repository::list_base_branches(Path::new(&project.root_path))?;
    Ok(order_base_branches(&project.default_branch, branches))
}

fn order_base_branches(default_branch: &str, branches: Vec<String>) -> Vec<String> {
    let remote_default = format!("origin/{default_branch}");
    let mut ordered = Vec::with_capacity(branches.len());

    push_if_present(&mut ordered, &branches, &remote_default);
    push_if_present(&mut ordered, &branches, default_branch);

    let mut remaining = branches
        .into_iter()
        .filter(|branch| !ordered.iter().any(|known| known == branch))
        .collect::<Vec<_>>();
    remaining.sort_by(|left, right| {
        branch_sort_group(left)
            .cmp(&branch_sort_group(right))
            .then_with(|| left.cmp(right))
    });
    ordered.extend(remaining);
    ordered
}

fn push_if_present(ordered: &mut Vec<String>, branches: &[String], branch: &str) {
    if branches.iter().any(|known| known == branch) {
        ordered.push(branch.to_string());
    }
}

fn branch_sort_group(branch: &str) -> u8 {
    if branch.contains('/') {
        1
    } else {
        0
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn prefers_origin_default_then_local_default() {
        let branches = vec![
            "feature/local".to_string(),
            "main".to_string(),
            "origin/feature/remote".to_string(),
            "origin/main".to_string(),
        ];

        assert_eq!(
            order_base_branches("main", branches),
            vec![
                "origin/main".to_string(),
                "main".to_string(),
                "feature/local".to_string(),
                "origin/feature/remote".to_string()
            ]
        );
    }
}
