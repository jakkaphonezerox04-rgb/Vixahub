"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ClonedSiteAuthProvider, useClonedSiteAuth } from "@/contexts/cloned-site-auth-context"
import Link from "next/link"
import { Home, FileText, Truck, MessageSquare, Settings, LogOut, Calendar, Send, Users, ShieldCheck } from "lucide-react"
import { collection, addDoc, serverTimestamp, doc, getDoc, onSnapshot } from "firebase/firestore"
import { firestore } from "@/lib/firebase"
import { sendLeaveRequestWebhook } from "@/lib/webhook"

interface LeaveFormData {
  name: string
  houseName: string
  leaveTypes: string[]
  startDate: string
  endDate: string
  reason: string
}

const defaultLeaveTypeOptions = [
  "ลาป่วย",
  "ลากิจ",
  "ลาพักร้อน",
  "ลาคลอด",
  "ลาอื่นๆ"
]

interface SiteSettings {
  websiteName?: string
  logoImageUrl?: string
  themeAccentColor?: string
  webhookUrl?: string
  leaveTypes?: string[]
}

function ClonedSiteLeaveForm() {
  const params = useParams<{ slug: string }>()
  const router = useRouter()
  const { user, logout, checkSession } = useClonedSiteAuth()
  const [siteName, setSiteName] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [leaveTypeOptions, setLeaveTypeOptions] = useState<string[]>(defaultLeaveTypeOptions)
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({})
  
  const [formData, setFormData] = useState<LeaveFormData>({
    name: "",
    houseName: "",
    leaveTypes: [],
    startDate: "",
    endDate: "",
    reason: ""
  })

  useEffect(() => {
    let unsubscribeSettings: (() => void) | null = null
    
    const checkAuth = async () => {
      const sessionUser = await checkSession(params.slug)
      if (!sessionUser) {
        router.push(`/${params.slug}/login`)
        return
      }

      // Check if user has house/group assigned (except admin)
      if (sessionUser.role !== 'admin' && !sessionUser.houseName) {
        router.push(`/${params.slug}/dashboard`)
        return
      }
      
      // Auto-fill user data
      setFormData(prev => ({
        ...prev,
        name: sessionUser.username,
        houseName: sessionUser.houseName || ""
      }))
      
      // Load settings with Real-time listener
      unsubscribeSettings = await loadSettings()
      
      setIsLoading(false)
    }
    checkAuth()
    
    // Cleanup function
    return () => {
      if (unsubscribeSettings) {
        unsubscribeSettings()
      }
    }
  }, [params.slug, checkSession, router])

  const loadSettings = async () => {
    try {
      console.log("📥 กำลังโหลด Settings จาก:", `cloned_sites/${params.slug}/settings/site_settings`)
      const settingsRef = doc(firestore, `cloned_sites/${params.slug}/settings`, 'site_settings')
      
      // ใช้ onSnapshot สำหรับ Real-time updates
      const unsubscribe = onSnapshot(settingsRef, (settingsDoc) => {
        if (settingsDoc.exists()) {
          const settings = settingsDoc.data() as SiteSettings
          console.log("🔄 Settings อัพเดทแล้ว (Real-time):", settings)
          console.log("   - leaveTypes:", settings.leaveTypes)
          console.log("   - webhookUrl:", settings.webhookUrl)
        
          // บันทึก settings ทั้งหมด
          setSiteSettings(settings)
          
          if (settings.leaveTypes && Array.isArray(settings.leaveTypes) && settings.leaveTypes.length > 0) {
            console.log("✅ อัปเดต leaveTypeOptions เป็น:", settings.leaveTypes)
            setLeaveTypeOptions(settings.leaveTypes)
          } else {
            console.log("⚠️ ไม่พบ leaveTypes หรือเป็น array ว่าง")
          }
        } else {
          console.log("❌ ไม่พบ Settings document")
        }
      })
      
      // Return unsubscribe function for cleanup
      return unsubscribe
    } catch (error) {
      console.error("❌ Error loading settings:", error)
      return () => {} // Return empty function on error
    }
  }

  // Load site name from Firestore
  useEffect(() => {
    const loadSiteName = async () => {
      try {
        const { getWebsiteBySlug } = await import("@/lib/firebase-websites")
        const website = await getWebsiteBySlug(params.slug)
        if (website) {
          setSiteName(website.name)
        }
      } catch (error) {
        console.error("Error loading site:", error)
        setSiteName("เว็บไซต์")
      }
    }
    loadSiteName()
  }, [params.slug])

  // Activity Logging Functions
  const getClientIP = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json')
      const data = await response.json()
      return data.ip
    } catch (error) {
      console.error('Error getting IP:', error)
      return 'Unknown'
    }
  }

  const logActivity = async (userId: string, username: string, userRole: string, houseName: string | undefined, action: string, details: string) => {
    try {
      const ipAddress = await getClientIP()
      const logData = {
        userId,
        username,
        userRole,
        houseName: houseName || '',
        action,
        details,
        ipAddress,
        timestamp: serverTimestamp(),
        siteSlug: params.slug
      }
      
      await addDoc(collection(firestore, `cloned_sites/${params.slug}/activity_logs`), logData)
    } catch (error) {
      console.error('Error logging activity:', error)
    }
  }

  const handleLogout = () => {
    logout()
    router.push(`/${params.slug}/login`)
  }

  const handleCheckboxChange = (type: string) => {
    setFormData(prev => ({
      ...prev,
      leaveTypes: prev.leaveTypes.includes(type)
        ? prev.leaveTypes.filter(t => t !== type)
        : [...prev.leaveTypes, type]
    }))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    // Validation
    if (!formData.name || formData.leaveTypes.length === 0 || !formData.startDate || 
        !formData.endDate || !formData.reason.trim()) {
      setMessage({ type: 'error', text: 'กรุณากรอกข้อมูลให้ครบถ้วน' })
      return
    }

    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      setMessage({ type: 'error', text: 'วันที่สิ้นสุดต้องมากกว่าหรือเท่ากับวันที่เริ่มต้น' })
      return
    }

    setIsSubmitting(true)

    try {
      // Save to Firestore
      const leaveRequestsRef = collection(firestore, `cloned_sites/${params.slug}/leave_requests`)
      const leaveData = {
        userId: user?.id,
        username: formData.name,
        houseName: formData.houseName || "",
        leaveTypes: formData.leaveTypes,
        startDate: formData.startDate,
        endDate: formData.endDate,
        reason: formData.reason,
        status: "pending",
        createdAt: serverTimestamp(),
        siteId: params.slug
      }
      
      console.log("📝 กำลังบันทึกคำขอลา:", leaveData)
      console.log("📍 Path:", `cloned_sites/${params.slug}/leave_requests`)
      
      const docRef = await addDoc(leaveRequestsRef, leaveData)
      
      console.log("✅ บันทึกสำเร็จ! Document ID:", docRef.id)

      // Log activity
      await logActivity(user.id, user.username, user.role, user.houseName, 'create_leave_request', `ส่งคำขอลา: ${formData.leaveTypes.join(', ')} วันที่ ${formData.startDate} - ${formData.endDate}`)

      // Send webhook notification
      if (siteSettings.webhookUrl) {
        console.log("🔔 กำลังส่ง Webhook...")
        try {
          await sendLeaveRequestWebhook(siteSettings.webhookUrl, {
            username: formData.name,
            houseName: formData.houseName,
            leaveTypes: formData.leaveTypes,
            startDate: formData.startDate,
            endDate: formData.endDate,
            reason: formData.reason,
            websiteName: siteSettings.websiteName,
            logoUrl: siteSettings.logoImageUrl,
            themeColor: siteSettings.themeAccentColor
          })
          console.log("✅ ส่ง Webhook สำเร็จ!")
        } catch (webhookError) {
          console.error("⚠️ ส่ง Webhook ไม่สำเร็จ:", webhookError)
          // Don't fail the whole operation if webhook fails
        }
      } else {
        console.log("⚠️ ไม่มี Webhook URL ข้ามการส่ง Webhook")
      }

      setMessage({ type: 'success', text: 'ส่งคำขอลาสำเร็จ!' })
      
      // Reset form
      setFormData({
        name: user?.username || "",
        houseName: "",
        leaveTypes: [],
        startDate: "",
        endDate: "",
        reason: ""
      })

      // Auto hide success message after 3 seconds
      setTimeout(() => {
        setMessage(null)
      }, 3000)
    } catch (error) {
      console.error("Error submitting leave request:", error)
      setMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการส่งคำขอ' })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-blue-950">
        <div className="text-white text-lg">กำลังโหลด...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-blue-950">
      {/* Header */}
      <header className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-white">{siteName}</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-300">
                สวัสดีคุณ, <span className="font-bold text-blue-400">{user.username}</span>
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-xl transition-all duration-300 border border-red-500/30"
              >
                <LogOut className="w-4 h-4" />
                ออกจากระบบ
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 min-h-[calc(100vh-4rem)] bg-gray-900/30 backdrop-blur-sm border-r border-gray-700/50 p-6">
          <nav className="space-y-2">
            <Link
              href={`/${params.slug}/dashboard`}
              className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-xl transition-all duration-300"
            >
              <Home className="w-5 h-5" />
              <span>เมนูหลัก</span>
            </Link>
            <Link
              href={`/${params.slug}/leave`}
              className="flex items-center gap-3 px-4 py-3 text-white bg-blue-600/20 border border-blue-500/30 rounded-xl hover:bg-blue-600/30 transition-all duration-300"
            >
              <FileText className="w-5 h-5" />
              <span>แจ้งลา</span>
            </Link>
            <Link
              href={`/${params.slug}/delivery`}
              className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-xl transition-all duration-300"
            >
              <Truck className="w-5 h-5" />
              <span>ส่งของ</span>
            </Link>
            <Link
              href={`/${params.slug}/report`}
              className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-xl transition-all duration-300"
            >
              <MessageSquare className="w-5 h-5" />
              <span>รายงาน</span>
            </Link>
            <Link
              href={`/${params.slug}/members`}
              className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-xl transition-all duration-300"
            >
              <Users className="w-5 h-5" />
              <span>สมาชิกภายในบ้าน</span>
            </Link>
            {user?.role === 'admin' && (
              <Link
                href={`/${params.slug}/admin`}
                className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-xl transition-all duration-300"
              >
                <ShieldCheck className="w-5 h-5" />
                <span>แผงควบคุม Admin</span>
              </Link>
            )}
            <Link
              href={`/${params.slug}/settings`}
              className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-xl transition-all duration-300"
            >
              <Settings className="w-5 h-5" />
              <span>ตั้งค่า</span>
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-3xl mx-auto">
            {/* Page Title */}
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <FileText className="w-8 h-8 text-blue-400" />
                แจ้งลา
              </h2>
              <p className="text-gray-400">กรอกแบบฟอร์มแจ้งลาของคุณ</p>
            </div>

            {/* Message Alert */}
            {message && (
              <div className={`mb-6 p-4 rounded-xl border ${
                message.type === 'success' 
                  ? 'bg-green-600/20 border-green-500/30 text-green-400' 
                  : 'bg-red-600/20 border-red-500/30 text-red-400'
              }`}>
                {message.text}
              </div>
            )}

            {/* Form Card */}
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8">
              <h3 className="text-xl font-bold text-white mb-6 text-center">กรอกแบบฟอร์มแจ้งลา</h3>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name Field */}
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    ชื่อ
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    readOnly
                  />
                </div>

                {/* House Name Field */}
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    ชื่อบ้าน (ถ้ามี)
                  </label>
                  <input
                    type="text"
                    name="houseName"
                    value={formData.houseName}
                    onChange={handleInputChange}
                    placeholder="กรอกชื่อบ้าน"
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  />
                </div>

                {/* Leave Types */}
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-3">
                    ประเภทการลา
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {leaveTypeOptions.map((type) => (
                      <label
                        key={type}
                        className={`flex items-center gap-2 px-4 py-3 rounded-xl border cursor-pointer transition-all duration-300 ${
                          formData.leaveTypes.includes(type)
                            ? 'bg-blue-600/20 border-blue-500/50 text-blue-400'
                            : 'bg-gray-800/30 border-gray-600/50 text-gray-300 hover:bg-gray-800/50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.leaveTypes.includes(type)}
                          onChange={() => handleCheckboxChange(type)}
                          className="w-4 h-4 rounded-xl border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      วันที่เริ่มลา
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      วันที่สิ้นสุด
                    </label>
                    <input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                      required
                    />
                  </div>
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    เหตุผล
                  </label>
                  <textarea
                    name="reason"
                    value={formData.reason}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="ระบุเหตุผลในการลา..."
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 resize-none"
                    required
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <Send className="w-5 h-5" />
                  {isSubmitting ? 'กำลังส่ง...' : 'ส่งคำขอลา'}
                </button>
              </form>
            </div>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="mt-8 py-4 px-6 text-center text-gray-400 border-t border-gray-700/50">
        <p>© {new Date().getFullYear()} {siteName} - Powered by VIXAHUB</p>
      </footer>
    </div>
  )
}

export default function ClonedSiteLeaveFormPage() {
  return (
    <ClonedSiteAuthProvider>
      <ClonedSiteLeaveForm />
    </ClonedSiteAuthProvider>
  )
}


