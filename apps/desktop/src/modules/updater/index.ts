/**
 * @purpose Re-exports the public Updater module surface.
 * @role    Feature module barrel consumed by the app shell.
 * @deps    ./UpdateBadge, ./useUpdater
 * @gotcha  Keep exports narrow; docs/modules/updater/README.md
 */
export * from './UpdateBadge'
export * from './useUpdater'
