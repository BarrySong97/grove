/**
 * @purpose English translation resources for Grove.
 * @role    Inline i18next resource bundle for the default UI language.
 * @deps    i18next resource shape
 * @gotcha  Keep keys stable; UI tests may query accessible labels.
 */
export const enUS = {
  common: {
    cancel: 'Cancel',
    close: 'Close',
    confirm: 'Confirm'
  },
  empty: {
    headline: 'Import from Conductor or Add Project',
    importFromConductor: 'Import from Conductor',
    or: 'or',
    addProject: 'Add Project',
    howItWorks: 'How it works'
  },
  footer: {
    language: 'Language',
    languageSystem: 'Auto',
    languageZhCn: '中',
    languageEnUs: 'EN',
    quit: 'Quit'
  },
  header: {
    addProject: 'Add project…',
    counts: '{{worktrees}} worktrees · {{projects}} projects',
    settings: 'Settings'
  },
  actions: {
    archiveWorktree: 'Archive Worktree…',
    commands: 'Commands',
    copyWorktreePath: 'Copy Worktree Path',
    editCommands: 'Edit Setup/Archive…',
    more: 'More…',
    moveDown: 'Move down',
    moveToTop: 'Move to top',
    moveUp: 'Move up',
    newWorktree: 'New worktree',
    open: 'Open',
    openIn: 'Open in {{target}}',
    openInTerminal: 'Open in Terminal',
    projectSettings: 'Project settings',
    recovery: 'Recovery',
    retry: 'Retry',
    revealInFinder: 'Reveal in Finder',
    viewLog: 'View Log'
  },
  worktree: {
    failedSubtitle: 'Failed · open actions for log or retry',
    from: 'from',
    primaryBranch: 'primary branch',
    runningSetup: 'Running setup…',
    archiving: 'Archiving…',
    failed: 'Failed',
    showLess: 'Show less',
    showAll: 'Show all worktrees ({{count}} more)'
  },
  newWorktree: {
    basePrefix: 'from',
    placeholder: 'feature-name'
  },
  projectSettings: {
    sections: {
      project: 'Project',
      commands: 'Commands',
      danger: 'Danger Zone'
    },
    workspaceRoot: {
      label: 'Workspace root',
      ariaLabel: 'Workspace root',
      required: 'Workspace root is required'
    },
    archive: {
      label: 'Archive',
      useGlobal: 'Use global default',
      ask: 'Ask every time',
      hide: 'Hide in Grove only',
      removeWorktree: 'Delete worktree when safe'
    },
    commands: {
      setupName: 'Setup',
      setupDesc: 'runs after a worktree is created',
      archiveName: 'Archive',
      archiveDesc: 'runs before a worktree is removed'
    },
    removeProject: {
      label: 'Remove project',
      button: 'Remove Project…',
      help: 'Removes Grove registration; the main repository directory is never deleted.'
    }
  },
  sheets: {
    archive: {
      title: 'Archive workspace',
      hide: 'Hide in Grove only',
      remove: 'Delete git worktree directory when safe'
    },
    removeProject: {
      title: 'Remove project',
      confirm: 'Remove Project',
      base: 'Grove will remove this project registration. The main repository directory is never deleted.',
      deleteWorktrees: ' Clean managed worktree directories will also be archived and removed.',
      groveOnly: ' Worktree directories will be left untouched.'
    },
    log: {
      title: 'Operation log',
      empty: 'No log output.'
    }
  },
  toast: {
    addedProject: 'Added project · {{project}} · {{path}}',
    addProjectCanceled: 'No project folder selected',
    addProjectFailed: 'Add project failed',
    addingProject: 'Adding project · {{project}} · {{path}}',
    archive: 'Archive · {{project}}/{{branch}}',
    archiveFailed: 'Archive failed · {{project}}/{{branch}}',
    create: 'Create · {{project}}/{{name}}',
    createFailed: 'Create failed · {{project}}/{{name}}',
    importConductorFailed: 'Import from Conductor failed',
    importingConductor: 'Importing Conductor workspaces',
    loadProjectsFailed: 'Unable to load Grove projects',
    loadSettingsFailed: 'Unable to load Grove settings',
    noConductorWorkspaces: 'No Conductor workspaces found',
    noOperationLog: 'No operation log is available for this workspace',
    openFailed: 'Open failed · {{project}}/{{branch}}',
    readLogFailed: 'Unable to read operation log',
    removeProject: 'Remove project · {{project}}',
    removeProjectFailed: 'Remove project failed · {{project}}',
    retry: 'Retry · {{project}}/{{branch}}',
    retryFailed: 'Retry failed · {{project}}/{{branch}}',
    saveAppSettingsFailed: 'Save app settings failed',
    saveProjectSettings: 'Saving project settings',
    saveProjectSettingsFailed: 'Save project settings failed'
  },
  settings: {
    title: 'Settings',
    subtitle: 'Application preferences',
    sections: {
      general: 'General',
      open: 'Open',
      workflows: 'Workflows',
      updates: 'Updates'
    },
    language: {
      label: 'Language',
      ariaLabel: 'Application language',
      system: 'System',
      zhCn: '中文',
      enUs: 'English'
    },
    newProjectPosition: {
      label: 'New project',
      ariaLabel: 'New project list position',
      first: 'Top of list',
      last: 'Bottom of list'
    },
    hoverQuickOpen: {
      label: 'Hover quick open',
      help: 'Choose which apps appear as quick-open buttons when hovering a worktree.'
    },
    archive: {
      label: 'Archive',
      ariaLabel: 'Default archive workspace behavior',
      ask: 'Ask every time',
      hide: 'Hide in Grove only',
      removeWorktree: 'Delete worktree when safe'
    },
    removeProject: {
      label: 'Remove Project',
      ariaLabel: 'Remove project behavior',
      groveOnly: 'Only remove from Grove',
      deleteWorktrees: 'Also delete clean worktrees',
      help: 'Project removal never deletes the main repository directory.'
    },
    updates: {
      label: 'Software update',
      check: 'Check for updates',
      checking: 'Checking…',
      upToDate: 'Grove is up to date.',
      available: 'Version {{version}} is available.',
      install: 'Install & restart',
      downloading: 'Downloading… {{progress}}%',
      installing: 'Installing…',
      version: 'Version'
    }
  },
  updater: {
    available: 'Update',
    availableTooltip: 'Grove {{version}} is available — click to install and restart',
    downloading: 'Updating… {{progress}}%',
    installing: 'Restarting…',
    error: 'Update failed',
    errorTooltip: 'Update failed — click to retry'
  }
}
