"use client"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  Users,
  FolderOpen,
  CheckSquare,
  Calendar,
  BarChart3,
  Settings,
  User,
  LogOut,
  ChevronLeft,
  Crown,
  MessageSquare,
  Bell,
} from "lucide-react"
import Logo from "./logo"

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

const menuItems = [
  {
    title: "Dashboard",
    icon: Home,
    href: "/dashboard",
    badge: null,
  },
  {
    title: "Team Management",
    icon: Users,
    href: "/dashboard/team",
    badge: "3",
  },
  {
    title: "Projects",
    icon: FolderOpen,
    href: "/dashboard/projects",
    badge: null,
  },
  {
    title: "Tasks",
    icon: CheckSquare,
    href: "/dashboard/tasks",
    badge: "12",
  },
  {
    title: "Calendar",
    icon: Calendar,
    href: "/dashboard/calendar",
    badge: null,
  },
  {
    title: "Messages",
    icon: MessageSquare,
    href: "/dashboard/messages",
    badge: "5",
  },
  {
    title: "Reports",
    icon: BarChart3,
    href: "/dashboard/reports",
    badge: null,
  },
]

const bottomMenuItems = [
  {
    title: "Notifications",
    icon: Bell,
    href: "/dashboard/notifications",
    badge: "2",
  },
  {
    title: "Settings",
    icon: Settings,
    href: "/dashboard/settings",
    badge: null,
  },
  {
    title: "Profile",
    icon: User,
    href: "/dashboard/profile",
    badge: null,
  },
]

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <>
      <div
        className={`fixed lg:relative inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-gray-900/95 to-gray-800/95 backdrop-blur-sm border-r border-gray-700/50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 ${collapsed ? "lg:w-20" : "lg:w-64"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
          <div className={`transition-all duration-300 ${collapsed ? "lg:hidden" : ""}`}>
            <Logo size="md" showText={true} />
          </div>
          <div
            className={`transition-all duration-300 ${collapsed ? "lg:flex lg:justify-center lg:w-full" : "lg:hidden"}`}
          >
            <Logo size="md" showText={false} />
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-2 rounded-xl hover:bg-gray-700/50 transition-colors"
          >
            <ChevronLeft
              className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`}
            />
          </button>
          <button onClick={onClose} className="lg:hidden p-2 rounded-xl hover:bg-gray-700/50 transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* User Info */}
        <div className="p-6 border-b border-gray-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div className={`transition-all duration-300 ${collapsed ? "lg:hidden" : ""}`}>
              <h3 className="text-white font-medium">Admin User</h3>
              <p className="text-gray-400 text-sm">FAMILY SYSTEM</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {menuItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group relative ${
                    isActive
                      ? "bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-white border border-purple-500/30"
                      : "text-gray-300 hover:text-white hover:bg-gray-700/50"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 transition-colors ${isActive ? "text-purple-400" : "text-gray-400 group-hover:text-white"}`}
                  />
                  <span className={`font-medium transition-all duration-300 ${collapsed ? "lg:hidden" : ""}`}>
                    {item.title}
                  </span>
                  {item.badge && (
                    <span
                      className={`ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full transition-all duration-300 ${collapsed ? "lg:hidden" : ""}`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 to-pink-500 rounded-r"></div>
                  )}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Bottom Menu */}
        <div className="p-4 border-t border-gray-700/50">
          <div className="space-y-2 mb-4">
            {bottomMenuItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group relative ${
                    isActive
                      ? "bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-white border border-purple-500/30"
                      : "text-gray-300 hover:text-white hover:bg-gray-700/50"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 transition-colors ${isActive ? "text-purple-400" : "text-gray-400 group-hover:text-white"}`}
                  />
                  <span className={`font-medium transition-all duration-300 ${collapsed ? "lg:hidden" : ""}`}>
                    {item.title}
                  </span>
                  {item.badge && (
                    <span
                      className={`ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full transition-all duration-300 ${collapsed ? "lg:hidden" : ""}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>

          {/* Logout Button */}
          <button className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-red-600/20 transition-all duration-300 group">
            <LogOut className="w-5 h-5 text-gray-400 group-hover:text-red-400" />
            <span className={`font-medium transition-all duration-300 ${collapsed ? "lg:hidden" : ""}`}>Logout</span>
          </button>
        </div>
      </div>
    </>
  )
}
