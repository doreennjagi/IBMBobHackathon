/**
 * Design tokens for the SubLeech dashboard UI layer.
 * Values map to CSS custom properties on `.sl-dashboard` (see `src/styles/neo-brutalist.css`).
 * Use these in Emotion `styled` rules via `var(--sl-*)` for easy light/dark theming.
 */

export const slTheme = {
  /** Page canvas behind cards */
  bgPage: 'var(--sl-bg-page)',
  /** Primary card surface */
  cardBg: 'var(--sl-card-bg)',
  /** Hero stat: total spend */
  statPurpleStart: 'var(--sl-stat-purple-start)',
  statPurpleEnd: 'var(--sl-stat-purple-end)',
  /** Hero stat: subscription count */
  statTealStart: 'var(--sl-stat-teal-start)',
  statTealEnd: 'var(--sl-stat-teal-end)',
  /** Hero stat: savings */
  statGoldStart: 'var(--sl-stat-gold-start)',
  statGoldEnd: 'var(--sl-stat-gold-end)',
  hike: 'var(--sl-hike)',
  savings: 'var(--sl-savings)',
  warn: 'var(--sl-warn)',
  active: 'var(--sl-active)',
  zombie: 'var(--sl-zombie)',
  text: 'var(--sl-text)',
  textMuted: 'var(--sl-text-muted)',
  border: 'var(--sl-border)',
  shadowCard: 'var(--sl-shadow-card)',
  shadowLift: 'var(--sl-shadow-lift)',
  radiusCard: '12px',
  radiusButton: '8px',
} as const

export type CardVariant = 'default' | 'highlighted' | 'danger'
export type StatVariant = 'purple' | 'teal' | 'gold'
export type DashboardPillId = 'all' | 'hikes' | 'unused' | 'active'
