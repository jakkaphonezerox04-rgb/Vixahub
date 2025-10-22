"use client"
import { useState } from "react"
import { Menu, Search, Bell, User, Settings, LogOut } from "lucide-react"

interface DashboardHeaderProps {
  onMenuClick: () => void
}

export default function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)

  const notifications = [
    { id: 1, title: "New team member joined", time: "2 min ago", unread: true },
    { id: 2, title: "Project deadline approaching", time: "1 hour ago", unread: true },
    { id: 3, title: "Task completed by John", time: "3 hours ago", unread: false },
  ]

  return (
    <header className="bg-gradient-to-r from-gray-900/50 to-gray-800/30 backdrop-blur-sm border-b border-gray-700/50 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left Side */}
        <div className="flex items-center gap-4">
          <button onClick={onMenuClick} className="lg:hidden p-2 rounded-xl hover:bg-gray-700/50 transition-colors">
            <Menu className="w-5 h-5 text-gray-400" />
          </button>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 w-64"
            />
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl hover:bg-gray-700/50 transition-colors"
            >
              <Bell className="w-5 h-5 text-gray-400" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-gray-800/95 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-xl z-50">
                <div className="p-4 border-b border-gray-700/50">
                  <h3 className="text-white font-medium">Notifications</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border-b border-gray-700/30 hover:bg-gray-700/30 transition-colors ${
                        notification.unread ? "bg-purple-600/10" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-white text-sm">{notification.title}</p>
                          <p className="text-gray-400 text-xs mt-1">{notification.time}</p>
                        </div>
                        {notification.unread && <div className="w-2 h-2 bg-purple-500 rounded-full mt-1"></div>}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4">
                  <button className="w-full text-center text-purple-400 hover:text-purple-300 text-sm transition-colors">
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-700/50 transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-white text-sm font-medium">Admin User</p>
                <p className="text-gray-400 text-xs">admin@vixahub.com</p>
              </div>
            </button>

            {/* User Dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-gray-800/95 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-xl z-50">
                <div className="p-2">
                  <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-gray-300 hover:text-white hover:bg-gray-700/50 transition-colors">
                    <User className="w-4 h-4" />
                    Profile
                  </button>
                  <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-gray-300 hover:text-white hover:bg-gray-700/50 transition-colors">
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                  <hr className="my-2 border-gray-700/50" />
                  <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-gray-300 hover:text-white hover:bg-red-600/20 transition-colors">
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
