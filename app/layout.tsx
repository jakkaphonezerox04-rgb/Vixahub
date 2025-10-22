import type React from "react"
import type { Metadata } from "next"
import { Kanit } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { ThemeProvider } from "@/contexts/theme-context"
import { LanguageProvider } from "@/contexts/language-context"
import { ToastProvider } from "@/contexts/toast-context"
import { disableConsoleCompletely } from "@/lib/disable-console"
import ConsoleDisabler from "@/components/console-disabler"

const kanit = Kanit({ 
  subsets: ["latin", "thai"],
  weight: ["300", "400", "500", "600", "700"]
})

export const metadata: Metadata = {
  title: "VIXAHUB - AI Platform",
  description: "บริการระบบจัดการทีมเพื่อเพิ่มประสิทธิภาพสูงสุด",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Disable console logs to prevent debugging information from showing in F12
  if (typeof window !== 'undefined') {
    disableConsoleCompletely()
  }

  return (
    <html lang="th">
      <head>
        {/* Console disabling is handled by ConsoleDisabler component */}
      </head>
      <body className={kanit.className}>
        <ConsoleDisabler />
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <ToastProvider>
                {children}
              </ToastProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
