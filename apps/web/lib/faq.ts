/**
 * FAQ content, shared between the rendered accordion (components/home/Faq.tsx)
 * and the FAQPage JSON-LD (components/shared/JsonLd.tsx) so the two never drift.
 */
export const FAQ_ITEMS: { title: string; content: string }[] = [
  {
    title: 'Does Grove touch my git history?',
    content:
      'No. Grove drives standard git worktree commands under the hood. Your main checkout, branches, and history stay exactly as git left them — Grove just makes the worktrees easy to live with.',
  },
  {
    title: 'How is this different from running git worktree myself?',
    content:
      'git worktree is powerful but fiddly: long paths, manual dependency setup, and no overview of what exists. Grove gives every worktree a home in your menu bar, runs setup for you, and opens it in your editor or terminal in one click.',
  },
  {
    title: 'Is it free?',
    content:
      'Grove is free to download while in preview. (Confirm final wording before launch.)',
  },
]
