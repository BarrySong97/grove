// @purpose Groups Rust types shared by presentation, use cases, and infrastructure.
// @role    Shared backend module root for DTOs and typed command errors.
// @deps    dto
// @gotcha  DTOs exported to TypeScript must stay browser-safe; docs/spark/2026-06-15-grove-conductor-worktree-backend-design.md
pub(crate) mod dto;
