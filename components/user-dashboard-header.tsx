"use client"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Menu, Bell, User, Settings, LogOut, ChevronDown, Wallet } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useLanguage } from "@/contexts/language-context"
import ThemeToggle from "./theme-toggle"
import ProfilePopup from "./profile-popup"

interface UserDashboardHeaderProps {
  onMenuClick: () => void
}

export default function UserDashboardHeader({ onMenuClick }: UserDashboardHeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfilePopup, setShowProfilePopup] = useState(false)
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const { user, logout } = useAuth()
  const { t } = useLanguage()
  const router = useRouter()
  const notificationRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Load profile image from localStorage
  useEffect(() => {
    const savedImage = localStorage.getItem('userProfileImage')
    if (savedImage) {
      setProfileImage(savedImage)
    }
  }, [])

  // Listen for profile image updates
  useEffect(() => {
    const handleStorageChange = () => {
      const savedImage = localStorage.getItem('userProfileImage')
      setProfileImage(savedImage)
    }

    window.addEventListener('storage', handleStorageChange)
    
    // Also listen for custom event when image is updated in the same tab
    const handleProfileUpdate = () => {
      const savedImage = localStorage.getItem('userProfileImage')
      setProfileImage(savedImage)
    }
    
    window.addEventListener('profileImageUpdated', handleProfileUpdate)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('profileImageUpdated', handleProfileUpdate)
    }
  }, [])

  const notifications = [
    { id: 1, title: "เว็บไซต์ของคุณพร้อมใช้งานแล้ว", time: "2 นาทีที่แล้ว", unread: true },
    { id: 2, title: "การเติมเงินสำเร็จ ฿500", time: "1 ชั่วโมงที่แล้ว", unread: true },
    { id: 3, title: "เว็บไซต์หมดอายุใน 7 วัน", time: "3 ชั่วโมงที่แล้ว", unread: false },
  ]

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  return (
    <>
      <header className="bg-gray-900/50 dark:bg-gray-900/50 bg-white/80 backdrop-blur-sm border-b border-gray-700/50 dark:border-gray-700/50 border-gray-300/50 px-6 py-4 relative z-40">
        <div className="flex items-center justify-between">
          {/* Left Side */}
          <div className="flex items-center gap-4">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-xl hover:bg-gray-700/50 dark:hover:bg-gray-700/50 hover:bg-gray-200/50 transition-colors"
            >
              <Menu className="w-5 h-5 text-gray-400 dark:text-gray-400 text-gray-600" />
            </button>


          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications)
                  setShowUserMenu(false)
                }}
                className="relative p-2 rounded-xl hover:bg-gray-700/50 dark:hover:bg-gray-700/50 hover:bg-gray-200/50 transition-colors"
              >
                <Bell className="w-5 h-5 text-gray-400 dark:text-gray-400 text-gray-600" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-gray-800/95 dark:bg-gray-800/95 bg-white/95 backdrop-blur-sm border border-gray-700/50 dark:border-gray-700/50 border-gray-300/50 rounded-xl shadow-xl z-[100]">
                  <div className="p-4 border-b border-gray-700/50 dark:border-gray-700/50 border-gray-300/50">
                    <h3 className="text-white dark:text-white text-gray-900 font-medium">การแจ้งเตือน</h3>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 border-b border-gray-700/30 dark:border-gray-700/30 border-gray-300/30 hover:bg-gray-700/30 dark:hover:bg-gray-700/30 hover:bg-gray-100/50 transition-colors ${
                          notification.unread ? "bg-purple-600/10" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-white dark:text-white text-gray-900 text-sm">{notification.title}</p>
                            <p className="text-gray-400 dark:text-gray-400 text-gray-600 text-xs mt-1">
                              {notification.time}
                            </p>
                          </div>
                          {notification.unread && <div className="w-2 h-2 bg-purple-500 rounded-full mt-1"></div>}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-4">
                    <button className="w-full text-center text-purple-400 hover:text-purple-300 text-sm transition-colors">
                      ดูการแจ้งเตือนทั้งหมด
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => {
                  setShowUserMenu(!showUserMenu)
                  setShowNotifications(false)
                }}
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-700/50 dark:hover:bg-gray-700/50 hover:bg-gray-200/50 transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center overflow-hidden">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-4 h-4 text-white" />
                  )}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-white dark:text-white text-gray-900 text-sm font-medium">{user?.name || "User"}</p>
                  <p className="text-gray-400 dark:text-gray-400 text-gray-600 text-xs">
                    {user?.email || "user@example.com"}
                  </p>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-400 text-gray-600" />
              </button>

              {/* User Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-gray-800/95 dark:bg-gray-800/95 bg-white/95 backdrop-blur-sm border border-gray-700/50 dark:border-gray-700/50 border-gray-300/50 rounded-xl shadow-xl z-[100]">
                  <div className="p-2">
                    <button 
                      onClick={() => {
                        setShowProfilePopup(true)
                        setShowUserMenu(false)
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-gray-300 dark:text-gray-300 text-gray-700 hover:text-white dark:hover:text-white hover:text-gray-900 hover:bg-gray-700/50 dark:hover:bg-gray-700/50 hover:bg-gray-100/50 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      {t("profile")}
                    </button>
                    <button 
                      onClick={() => {
                        router.push('/user-dashboard/settings')
                        setShowUserMenu(false)
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-gray-300 dark:text-gray-300 text-gray-700 hover:text-white dark:hover:text-white hover:text-gray-900 hover:bg-gray-700/50 dark:hover:bg-gray-700/50 hover:bg-gray-100/50 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      {t("settings")}
                    </button>
                    <hr className="my-2 border-gray-700/50 dark:border-gray-700/50 border-gray-300/50" />
                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-gray-300 dark:text-gray-300 text-gray-700 hover:text-white dark:hover:text-white hover:text-gray-900 hover:bg-red-600/20 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      {t("logout")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Backdrop for mobile dropdowns */}
      {(showNotifications || showUserMenu) && (
        <div
          className="fixed inset-0 bg-black/20 z-[90] md:hidden"
          onClick={() => {
            setShowNotifications(false)
            setShowUserMenu(false)
          }}
        />
      )}

      {/* Profile Popup */}
      <ProfilePopup 
        isOpen={showProfilePopup} 
        onClose={() => setShowProfilePopup(false)} 
      />
    </>
  )
}
