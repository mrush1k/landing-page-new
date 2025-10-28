"use client"

import { createContext, useContext } from 'react'

// No-op ThemeProvider to disable dark-mode and theme toggling while preserving API
interface ThemeContextType {
  primaryColor: string
  colorScheme: 'light' | 'dark' | 'system'
  setPrimaryColor: (color: string) => void
  setColorScheme: (scheme: 'light' | 'dark' | 'system') => void
  applyTheme: (color: string) => void
  loadThemePreferences: () => Promise<void>
  saveThemePreferences: () => Promise<void>
}

const defaultContext: ThemeContextType = {
  primaryColor: '#0066CC',
  colorScheme: 'light',
  setPrimaryColor: () => {},
  setColorScheme: () => {},
  applyTheme: () => {},
  loadThemePreferences: async () => {},
  saveThemePreferences: async () => {}
}

const ThemeContext = createContext<ThemeContextType>(defaultContext)

export function useTheme() {
  return useContext(ThemeContext)
}

interface ThemeProviderProps {
  children: React.ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  // Intentionally do not mutate document.documentElement or localStorage
  // The provider exists only to satisfy existing imports and calls to useTheme()
  return <ThemeContext.Provider value={defaultContext}>{children}</ThemeContext.Provider>
}