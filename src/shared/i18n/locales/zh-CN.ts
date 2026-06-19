/**
 * @purpose Simplified Chinese translation resources for Grove.
 * @role    Inline i18next resource bundle for Chinese UI.
 * @deps    i18next resource shape
 * @gotcha  Keep keys stable; UI tests may query accessible labels.
 */
export const zhCN = {
  common: {
    cancel: '取消',
    close: '关闭',
    confirm: '确认'
  },
  empty: {
    headline: '从 Conductor 导入或添加项目',
    importFromConductor: '从 Conductor 导入',
    or: '或',
    addProject: '添加项目',
    howItWorks: '使用说明'
  },
  footer: {
    language: '语言',
    languageSystem: '自动',
    languageZhCn: '中',
    languageEnUs: 'EN',
    quit: '退出'
  },
  header: {
    addProject: '添加项目…',
    counts: '{{worktrees}} 个 worktree · {{projects}} 个项目',
    settings: '设置'
  },
  actions: {
    archiveWorktree: '归档 Worktree…',
    commands: '命令',
    copyWorktreePath: '复制 Worktree 路径',
    editCommands: '编辑 Setup/Archive…',
    more: '更多…',
    moveDown: '下移',
    moveToTop: '移到顶部',
    moveUp: '上移',
    newWorktree: '新建 worktree',
    open: '打开',
    openIn: '用 {{target}} 打开',
    openInTerminal: '用 Terminal 打开',
    projectSettings: '项目设置',
    recovery: '恢复',
    retry: '重试',
    revealInFinder: '在 Finder 中显示',
    viewLog: '查看日志'
  },
  worktree: {
    failedSubtitle: '失败 · 打开操作查看日志或重试',
    from: '来自',
    primaryBranch: '主分支',
    runningSetup: '正在执行 setup…',
    archiving: '正在归档…',
    failed: '失败',
    showLess: '收起',
    showAll: '显示全部 worktree（还有 {{count}} 个）'
  },
  newWorktree: {
    basePrefix: '基于',
    placeholder: 'feature-name'
  },
  projectSettings: {
    sections: {
      project: '项目',
      commands: '命令',
      danger: '危险操作'
    },
    workspaceRoot: {
      label: 'Workspace 根目录',
      ariaLabel: 'Workspace 根目录',
      required: 'Workspace 根目录不能为空'
    },
    archive: {
      label: '归档',
      useGlobal: '使用全局默认',
      ask: '每次询问',
      hide: '只在 Grove 隐藏',
      removeWorktree: '安全时删除 worktree'
    },
    commands: {
      setupName: 'Setup',
      setupDesc: 'worktree 创建后执行',
      archiveName: 'Archive',
      archiveDesc: 'worktree 移除前执行'
    },
    removeProject: {
      label: '移除项目',
      button: '移除项目…',
      help: '只移除 Grove 登记；主仓库目录永远不会被删除。'
    }
  },
  sheets: {
    archive: {
      title: '归档 workspace',
      hide: '只在 Grove 隐藏',
      remove: '安全时删除 git worktree 目录'
    },
    removeProject: {
      title: '移除项目',
      confirm: '移除项目',
      base: 'Grove 会移除这个项目登记。主仓库目录永远不会被删除。',
      deleteWorktrees: ' 干净的受管 worktree 目录也会先归档再移除。',
      groveOnly: ' Worktree 目录会保持不变。'
    },
    log: {
      title: '操作日志',
      empty: '没有日志输出。'
    }
  },
  toast: {
    addProjectFailed: '添加项目失败',
    addingProject: '正在添加项目',
    archive: '正在归档 · {{project}}/{{branch}}',
    archiveFailed: '归档失败 · {{project}}/{{branch}}',
    create: '正在创建 · {{project}}/{{name}}',
    createFailed: '创建失败 · {{project}}/{{name}}',
    importConductorFailed: '从 Conductor 导入失败',
    importingConductor: '正在导入 Conductor workspaces',
    loadProjectsFailed: '无法加载 Grove 项目',
    loadSettingsFailed: '无法加载 Grove 设置',
    noConductorWorkspaces: '没有找到 Conductor workspaces',
    noOperationLog: '这个 workspace 没有可用的操作日志',
    openFailed: '打开失败 · {{project}}/{{branch}}',
    readLogFailed: '无法读取操作日志',
    removeProject: '正在移除项目 · {{project}}',
    removeProjectFailed: '移除项目失败 · {{project}}',
    retry: '正在重试 · {{project}}/{{branch}}',
    retryFailed: '重试失败 · {{project}}/{{branch}}',
    saveAppSettingsFailed: '保存应用设置失败',
    saveProjectSettings: '正在保存项目设置',
    saveProjectSettingsFailed: '保存项目设置失败'
  },
  settings: {
    title: '设置',
    subtitle: '应用偏好',
    sections: {
      general: '通用',
      open: '打开',
      workflows: '工作流',
      ghostty: 'Ghostty'
    },
    language: {
      label: '语言',
      ariaLabel: '应用语言',
      system: '跟随系统',
      zhCn: '中文',
      enUs: 'English'
    },
    hoverQuickOpen: {
      label: '悬停快捷打开',
      help: '选择悬停 worktree 时显示哪些 app 作为快捷打开按钮。'
    },
    archive: {
      label: '归档',
      ariaLabel: '默认归档 workspace 行为',
      ask: '每次询问',
      hide: '只在 Grove 隐藏',
      removeWorktree: '安全时删除 worktree'
    },
    removeProject: {
      label: '移除项目',
      ariaLabel: '移除项目行为',
      groveOnly: '只从 Grove 移除',
      deleteWorktrees: '同时删除干净的 worktree',
      help: '移除项目永远不会删除主仓库目录。'
    },
    ghostty: {
      tabsAriaLabel: '在标签页中打开 Ghostty workspace',
      tabsTitle: '在标签页中打开 workspace',
      tabsHelp: '尽量复用当前 Ghostty 窗口'
    }
  }
}
