import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'

import { ThemeContext, type SlTheme } from './themeContext'

const STORAGE_KEY = 'subleech-theme'

function readStoredTheme(): SlTheme {
  if (typeof window === 'undefined') {
    return 'light'
  }
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw === 'dark' || raw === 'light') {
    return raw
  }
  if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<SlTheme>(readStoredTheme)

  useEffect(() => {
    document.documentElement.dataset.slTheme = theme
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const setTheme = useCallback((t: SlTheme) => {
    setThemeState(t)
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState((t) => (t === 'light' ? 'dark' : 'light'))
  }, [])

  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme, setTheme, toggleTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
