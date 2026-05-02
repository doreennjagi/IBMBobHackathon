import { Link } from 'react-router-dom'

import { ThemeToggle } from '@components/layout/ThemeToggle'

function LogoMark() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden>
      <path
        d="M18 2C10 2 4 9 4 17c0 8 7 14 14 17 7-3 14-9 14-17C32 9 26 2 18 2z"
        fill="#ff4d3d"
        stroke="#0a0a0a"
        strokeWidth="2"
      />
      <text
        x="18"
        y="22"
        textAnchor="middle"
        fontSize="14"
        fontWeight="800"
        fill="#fff"
        fontFamily="system-ui, sans-serif"
      >
        S
      </text>
    </svg>
  )
}

export interface SiteHeaderProps {
  homeLink?: boolean
}

export function SiteHeader({ homeLink = true }: SiteHeaderProps) {
  const logo = (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
      <LogoMark />
      <span style={{ fontFamily: 'var(--sl-font-serif)', fontWeight: 700, fontSize: '1.15rem' }}>SubLeech</span>
    </span>
  )
  return (
    <header className="sl-site-header">
      <div>{homeLink ? <Link to="/" className="sl-link">{logo}</Link> : logo}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
      <nav className="sl-nav" aria-label="Site">
        <a href="#how">How it works</a>
        <a href="#about">About</a>
        <Link to="/">Receipts</Link>
        <Link to="/dashboard">Dashboard</Link>
        <a href="#faq">FAQ</a>
      </nav>
        <ThemeToggle />
      </div>
    </header>
  )
}
