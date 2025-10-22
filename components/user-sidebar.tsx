"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  Globe,
  Plus,
  CreditCard,
  Monitor,
  Settings,
  ChevronDown,
  ChevronRight,
  Crown,
  ChevronLeft
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useLanguage } from "@/contexts/language-context"
import Logo from "./logo"

interface UserSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function UserSidebar({ isOpen, onClose }: UserSidebarProps) {
  const pathname = usePathname()
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState(false)
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const { user } = useAuth()
  const { t } = useLanguage()

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

  const menuItems = [
    {
      title: t("dashboard"),
      icon: Home,
      href: "/user-dashboard",
      badge: null,
    },
    {
      title: t("rentWebsite"),
      icon: Globe,
      href: "/user-dashboard/websites",
      badge: null,
      submenu: [
        {
          title: t("createWebsite"),
          icon: Plus,
          href: "/user-dashboard/websites/create",
          badge: null,
        },
        {
          title: t("topup"),
          icon: CreditCard,
          href: "/user-dashboard/topup",
          badge: null,
        },
        {
          title: t("myWebsites"),
          icon: Monitor,
          href: "/user-dashboard/my-websites",
          badge: null,
        },
      ],
    },
  ]

  const bottomMenuItems = [
    {
      title: t("settings"),
      icon: Settings,
      href: "/user-dashboard/settings",
      badge: null,
    },
  ]

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
            <div className={`transition-all duration-300 ${collapsed ? "lg:hidden" : ""}`}>
              <h3 className="text-white font-medium">{user?.name || "User"}</h3>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {menuItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              const hasSubmenu = item.submenu && item.submenu.length > 0
              const isExpanded = expandedMenu === item.title

              return (
                <div key={item.title}>
                  {hasSubmenu ? (
                    <button
                      onClick={() => setExpandedMenu(isExpanded ? null : item.title)}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group relative ${
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
                      <ChevronLeft
                        className={`w-4 h-4 ml-auto transition-transform duration-300 ${
                          isExpanded ? "-rotate-90" : "rotate-180"
                        } ${collapsed ? "lg:hidden" : ""}`}
                      />
                    </button>
                  ) : (
                    <Link
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
                  )}

                  {/* Submenu */}
                  {hasSubmenu && isExpanded && !collapsed && (
                    <div className="ml-6 mt-2 space-y-1">
                      {item.submenu?.map((subItem) => {
                        const isSubActive = pathname === subItem.href
                        const SubIcon = subItem.icon

                        return (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-300 group ${
                              isSubActive
                                ? "bg-purple-600/20 text-purple-400 border-l-2 border-purple-500"
                                : "text-gray-400 hover:text-white hover:bg-gray-700/30"
                            }`}
                          >
                            <SubIcon className="w-4 h-4" />
                            <span className="text-sm font-medium">{subItem.title}</span>
                            {subItem.badge && (
                              <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                                {subItem.badge}
                              </span>
                            )}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
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
                </Link>
              )
            })}
          </div>


        </div>
      </div>
    </>
  )
}
