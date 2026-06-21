'use client'

import { Accordion } from '@heroui/react'
import { ChevronDown } from 'lucide-react'

const ITEMS: { title: string; content: string }[] = [
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

/** Objection-handling FAQ, built on the shared HeroUI Accordion. */
export function Faq() {
  return (
    <section className="mx-auto max-w-[820px] px-8 pt-[110px]">
      <h2 className="text-[clamp(24px,3vw,32px)] font-[670] leading-[1.1] -tracking-[0.7px] text-balance">
        Questions worth asking.
      </h2>

      <Accordion className="mt-8 w-full">
        {ITEMS.map((item, index) => (
          <Accordion.Item key={index}>
            <Accordion.Heading>
              <Accordion.Trigger className="text-[17px] font-[640] -tracking-[0.3px]">
                {item.title}
                <Accordion.Indicator>
                  <ChevronDown />
                </Accordion.Indicator>
              </Accordion.Trigger>
            </Accordion.Heading>
            <Accordion.Panel>
              <Accordion.Body className="text-[15.5px] leading-[1.6] text-ink-2">
                {item.content}
              </Accordion.Body>
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion>
    </section>
  )
}
