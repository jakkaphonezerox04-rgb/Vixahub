"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Globe, Plus, Settings, Eye, Trash2, Calendar, Users, Activity, DollarSign, MoreVertical, LayoutDashboard, Loader2 } from "lucide-react"
import { getUserWebsites, deleteWebsite } from "@/lib/firebase-websites"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/contexts/toast-context"

export default function MyWebsitesPage() {
  const [isVisible, setIsVisible] = useState(false)
  const [selectedWebsite, setSelectedWebsite] = useState<string | null>(null)
  const [websites, setWebsites] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user, loading } = useAuth()
  const { showSuccess, showError } = useToast()

  useEffect(() => {
    setIsVisible(true)
  }, [])

  // Debug log
  useEffect(() => {
    console.log('[MY-WEBSITES] Auth state:', { userId: user?.id, loading })
  }, [user, loading])

  // Load user's websites from Firebase
  useEffect(() => {
    let isMounted = true
    
    const loadWebsites = async () => {
      // รอจนกว่า auth จะโหลดเสร็จ
      if (loading) {
        console.log('[MY-WEBSITES] Auth still loading, waiting...')
        return
      }

      if (!user || !user.id) {
        console.log('[MY-WEBSITES] No user or user.id available', { user, loading })
        if (isMounted) {
          setWebsites([])
          setIsLoading(false)
        }
        return
      }

      try {
        console.log('[MY-WEBSITES] Loading websites for user:', user.id)
        setIsLoading(true)
        const userWebsites = await getUserWebsites(user.id)
        console.log('[MY-WEBSITES] Loaded websites:', userWebsites.length, 'websites')
        if (isMounted) {
          setWebsites(userWebsites)
        }
      } catch (error) {
        console.error("[MY-WEBSITES] Error loading websites:", error)
        if (isMounted) {
          setWebsites([])
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }
    
    loadWebsites()
    
    // Cleanup function
    return () => {
      isMounted = false
    }
  }, [user, loading])

  // Reload websites when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user && user.id) {
        console.log('[MY-WEBSITES] Page visible, reloading websites')
        setIsLoading(true)
        getUserWebsites(user.id).then(userWebsites => {
          console.log('[MY-WEBSITES] Reloaded websites:', userWebsites.length, 'websites')
          setWebsites(userWebsites)
          setIsLoading(false)
        }).catch(error => {
          console.error("[MY-WEBSITES] Error reloading websites:", error)
          setIsLoading(false)
        })
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [user])

  // Force reload on router navigation
  useEffect(() => {
    if (user && user.id && isVisible) {
      const timer = setTimeout(() => {
        console.log('[MY-WEBSITES] Force reloading on navigation')
        setIsLoading(true)
        getUserWebsites(user.id).then(userWebsites => {
          console.log('[MY-WEBSITES] Force reloaded:', userWebsites.length, 'websites')
          setWebsites(userWebsites)
          setIsLoading(false)
        }).catch(error => {
          console.error("[MY-WEBSITES] Error force reloading:", error)
          setIsLoading(false)
        })
      }, 500)
      
      return () => clearTimeout(timer)
    }
  }, [isVisible, user])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-green-400 bg-green-400/20"
      case "expired":
        return "text-red-400 bg-red-400/20"
      case "suspended":
        return "text-yellow-400 bg-yellow-400/20"
      default:
        return "text-gray-400 bg-gray-400/20"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "ใช้งานได้"
      case "expired":
        return "หมดอายุ"
      case "suspended":
        return "ระงับ"
      default:
        return "ไม่ทราบสถานะ"
    }
  }

  const handleDeleteWebsite = async (websiteId: string) => {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบเว็บไซต์นี้?")) {
      return
    }

    try {
      const result = await deleteWebsite(websiteId)
      if (result.success) {
        // Reload websites
        if (user && user.id) {
          const userWebsites = await getUserWebsites(user.id)
          setWebsites(userWebsites)
        }
        setSelectedWebsite(null)
        showSuccess("ลบเว็บไซต์สำเร็จ", "เว็บไซต์ของคุณถูกลบออกจากระบบแล้ว")
      } else {
        showError("เกิดข้อผิดพลาด", result.error || "ไม่สามารถลบเว็บไซต์ได้")
      }
    } catch (error) {
      console.error("Error deleting website:", error)
      showError("เกิดข้อผิดพลาด", "กรุณาลองใหม่อีกครั้ง")
    }
  }

  return (
    <div className="space-y-6">


      {/* Stats Overview */}
      <div
        className={`transform transition-all duration-1000 delay-200 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
        }`}
      >
        <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">สรุปภาพรวม</h2>
            <Link href="/user-dashboard/websites/create" className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors">
              สร้างเว็บไซต์ใหม่
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">{websites.length}</div>
              <div className="text-gray-400 text-sm">เว็บไซต์ทั้งหมด</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">
                {websites.filter((w) => w.status === "active").length}
              </div>
              <div className="text-gray-400 text-sm">ใช้งานได้</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400 mb-2">
                {websites.reduce((sum, w) => sum + w.visitors, 0).toLocaleString()}
              </div>
              <div className="text-gray-400 text-sm">ผู้เยี่ยมชมรวม</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-400 mb-2">
                ฿{websites.reduce((sum, w) => sum + w.revenue, 0).toLocaleString()}
              </div>
              <div className="text-gray-400 text-sm">รายได้รวม</div>
            </div>
          </div>
        </div>
      </div>

      {/* Websites Grid */}
      <div
        className={`transform transition-all duration-1000 delay-400 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
        }`}
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            <span className="ml-3 text-white">กำลังโหลดเว็บไซต์...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {websites.map((website) => (
            <div
              key={website.id}
              className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-xl overflow-hidden hover:scale-[1.02] hover:border-purple-500/30 transition-all duration-300 group"
            >
              {/* Website Thumbnail */}
              <div className="relative h-48 bg-gray-800/50 overflow-hidden">
                <img
                  src={website.thumbnail || "/placeholder.svg"}
                  alt={website.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                <div className="absolute top-4 right-4">
                  <span className={`px-3 py-1 rounded-xl-full text-xs font-medium backdrop-blur-sm ${getStatusColor(website.status)}`}>
                    {getStatusText(website.status)}
                  </span>
                </div>
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-black/60 backdrop-blur-sm text-white rounded-xl-full text-xs font-medium">
                    {website.plan}
                  </span>
                </div>
              </div>

              {/* Website Info */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">{website.name}</h3>
                    <p className="text-purple-400 text-sm font-medium">{website.url}</p>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setSelectedWebsite(selectedWebsite === website.id ? null : website.id)}
                      className="p-2 rounded-xl hover:bg-gray-700/50 transition-colors"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </button>

                    {selectedWebsite === website.id && (
                      <div className="absolute right-0 top-full mt-2 w-48 bg-gray-800/95 backdrop-blur-sm border border-gray-700/50 rounded-xl-xl shadow-xl z-50">
                        <div className="p-2">
                          <Link href={`/${website.slug}`} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-gray-300 hover:text-white hover:bg-gray-700/50 transition-colors">
                            <Eye className="w-4 h-4" />
                            ดูเว็บไซต์
                          </Link>
                          <Link href={`/${website.slug}/dashboard`} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-gray-300 hover:text-white hover:bg-gray-700/50 transition-colors">
                            <LayoutDashboard className="w-4 h-4" />
                            เข้าสู่ Dashboard
                          </Link>
                          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-gray-300 hover:text-white hover:bg-gray-700/50 transition-colors">
                            <Settings className="w-4 h-4" />
                            ตั้งค่า
                          </button>
                          <hr className="my-2 border-gray-700/50" />
                          <button 
                            onClick={() => handleDeleteWebsite(website.id)}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-600/20 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            ลบเว็บไซต์
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-gray-400 text-sm mb-4">{website.description}</p>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-3 bg-gray-800/30 rounded-xl">
                    <p className="text-xl font-bold text-white">
                      {website.visitors.toLocaleString()}
                    </p>
                    <p className="text-gray-400 text-xs">ผู้เยี่ยมชม</p>
                  </div>
                  <div className="text-center p-3 bg-gray-800/30 rounded-xl">
                    <p className="text-xl font-bold text-white">
                      ฿{website.revenue.toLocaleString()}
                    </p>
                    <p className="text-gray-400 text-xs">รายได้</p>
                  </div>
                </div>

                {/* Dates */}
                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>สร้าง: {website.createdDate}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>หมดอายุ: {website.expiryDate}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-3 gap-2">
                  <Link href={`/${website.slug}`} className="flex items-center justify-center gap-1 px-3 py-2 bg-purple-600/20 border border-purple-500/30 text-purple-400 rounded-xl hover:bg-purple-600/30 hover:border-purple-500/50 transition-all duration-300 text-sm">
                    <Eye className="w-4 h-4" />
                    ดู
                  </Link>
                  <Link href={`/${website.slug}/dashboard`} className="flex items-center justify-center gap-1 px-3 py-2 bg-blue-600/20 border border-blue-500/30 text-blue-400 rounded-xl hover:bg-blue-600/30 hover:border-blue-500/50 transition-all duration-300 text-sm">
                    <LayoutDashboard className="w-4 h-4" />
                    User
                  </Link>
                  <button className="flex items-center justify-center gap-1 px-3 py-2 bg-gray-600/20 border border-gray-500/30 text-gray-400 rounded-xl hover:bg-gray-600/30 hover:border-gray-500/50 transition-all duration-300 text-sm">
                    <Settings className="w-4 h-4" />
                    ตั้งค่า
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>

      {/* Empty State (if no websites) */}
      {websites.length === 0 && (
        <div
          className={`transform transition-all duration-1000 delay-600 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
        >
          <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-xl p-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl-xl flex items-center justify-center mx-auto mb-4">
              <Globe className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">ยังไม่มีเว็บไซต์</h3>
            <p className="text-gray-400 mb-6">เริ่มต้นสร้างเว็บไซต์แรกของคุณวันนี้</p>
            <button className="group relative flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-600/50 hover:border-purple-500/50 text-white rounded-xl-xl transition-all duration-300 hover:scale-105 mx-auto overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <Plus className="w-5 h-5 relative z-10" />
              <span className="relative z-10">สร้างเว็บไซต์ใหม่</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
