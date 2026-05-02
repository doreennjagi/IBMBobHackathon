import { ThemeToggle } from '@components/layout/ThemeToggle'

/** Reports placeholder */
export default function Reports() {
  return (
    <div className="sl-dashboard" style={{ paddingTop: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <ThemeToggle />
      </div>
      <h1 style={{ fontFamily: 'var(--sl-font-serif)', fontSize: '1.75rem' }}>Reports</h1>
      <p style={{ color: 'var(--sl-muted)', fontWeight: 600 }}>Coming soon.</p>
    </div>
  )
}
