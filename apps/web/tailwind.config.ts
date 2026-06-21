import type { Config } from 'tailwindcss'

export default {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    // Shared @grove/ui components use Tailwind classes too — scan them so utilities
    // like `inset-0` (used only in BottomSheet) actually get generated.
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"',
          '"SF Pro Display"', '"Helvetica Neue"', 'Helvetica', 'sans-serif',
        ],
        mono: ['"SF Mono"', 'ui-monospace', '"JetBrains Mono"', 'Menlo', 'monospace'],
      },
      colors: {
        // Accent palette is driven by CSS vars on :root so the whole site can
        // re-tint from one place (see index.css + the theme switcher).
        grn: {
          DEFAULT: 'var(--grn)',
          bright: 'var(--grn-bright)',
          deep: 'var(--grn-deep)',
          ink: 'var(--grn-ink)',
        },
        ink: {
          DEFAULT: '#181a1e',
          2: '#565b64',
          3: '#8a8f99',
        },
        canvas: '#f7f7f4',
        panel: '#ffffff',
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.04), 0 10px 26px rgba(0,0,0,0.03)',
        'card-hover': '0 2px 4px rgba(0,0,0,0.05), 0 16px 36px rgba(0,0,0,0.06)',
        float: '0 2px 4px rgba(0,0,0,0.04), 0 24px 56px rgba(0,0,0,0.08)',
        menu:
          'inset 0 0.5px 0 rgba(255,255,255,0.7), 0 0 0 0.5px rgba(0,0,0,0.05), 0 24px 60px rgba(0,0,0,0.18), 0 6px 16px rgba(0,0,0,0.10)',
      },
    },
  },
  plugins: [],
} satisfies Config
