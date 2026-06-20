// @purpose Exposes git command adapters for Grove backend workflows.
// @role    Infrastructure barrel for git worktree and status repositories.
// @deps    worktree_repository
// @gotcha  Git command output is source-of-truth input but still needs parsing/validation.
pub(crate) mod status_repository;
pub(crate) mod worktree_repository;
