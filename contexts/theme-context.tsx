"use client"
import { createContext, useContext, useState, useEffect } from "react"
import type React from "react"

interface ThemeContextType {
  theme: "dark" | "light"
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<"dark" | "light">("dark")

  useEffect(() => {
    // Check if user has a saved theme preference
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem("vixahub_theme") as "dark" | "light" | null
      if (savedTheme) {
        setTheme(savedTheme)
      } else {
        // Check system preference
        const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
        setTheme(systemPrefersDark ? "dark" : "light")
      }
    }
  }, [])

  useEffect(() => {
    // Apply theme to document
    if (typeof window !== 'undefined') {
      document.documentElement.classList.remove("dark", "light")
      document.documentElement.classList.add(theme)
      localStorage.setItem("vixahub_theme", theme)
    }
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"))
  }

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
