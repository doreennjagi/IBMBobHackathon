/**
 * Legacy placeholder route.
 */

import { ThemeToggle } from '@components/layout/ThemeToggle'

export default function Dashboard() {
  return (
    <div className="sl-dashboard" style={{ paddingTop: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <ThemeToggle />
      </div>
      <h1 style={{ fontFamily: 'var(--sl-font-serif)', fontSize: '1.75rem' }}>SubLeech legacy</h1>
      <p style={{ color: 'var(--sl-muted)', fontWeight: 600 }}>Use the main app at / and /dashboard.</p>
    </div>
  )
}
