"use client"
import { useState, useEffect } from "react"
import type React from "react"
import UserSidebar from "./user-sidebar"
import UserDashboardHeader from "./user-dashboard-header"

interface UserDashboardLayoutProps {
  children: React.ReactNode
}

export default function UserDashboardLayout({ children }: UserDashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.05),transparent_50%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.05),transparent_50%)] bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.1),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(147,51,234,0.05),transparent_50%)] dark:bg-[radial-gradient(circle_at_bottom_right,rgba(147,51,234,0.05),transparent_50%)] bg-[radial-gradient(circle_at_bottom_right,rgba(147,51,234,0.1),transparent_50%)]"></div>

      <div className="relative z-10 flex h-screen">
        {/* Sidebar */}
        <UserSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <UserDashboardHeader onMenuClick={() => setSidebarOpen(true)} />

          {/* Page Content */}
          <main
            className={`flex-1 overflow-y-auto p-6 transform transition-all duration-1000 ${
              isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
            }`}
          >
            {children}
          </main>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  )
}
