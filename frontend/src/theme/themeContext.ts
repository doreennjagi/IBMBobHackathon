import { createContext } from 'react'

export type SlTheme = 'light' | 'dark'

export type ThemeContextValue = {
  theme: SlTheme
  setTheme: (t: SlTheme) => void
  toggleTheme: () => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)
