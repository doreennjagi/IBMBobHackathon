import { useTheme } from '@/theme/useTheme'

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  return (
    <button
      type="button"
      className={`sl-theme-toggle ${className ?? ''}`}
      onClick={toggleTheme}
      aria-pressed={isDark}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
    >
      <span aria-hidden>{isDark ? '☀️' : '🌙'}</span>
      <span className="sl-theme-toggle__text">{isDark ? 'Light' : 'Dark'}</span>
    </button>
  )
}
