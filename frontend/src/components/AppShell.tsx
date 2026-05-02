/**
 * Minimal shell: skip link + main outlet (each page supplies its own chrome).
 */

import { Link, Outlet } from 'react-router-dom'

export default function AppShell() {
  return (
    <>
      <Link to="#main-content" className="sl-skip">
        Skip to content
      </Link>
      <main id="main-content" className="sl-main">
        <Outlet />
      </main>
    </>
  )
}
