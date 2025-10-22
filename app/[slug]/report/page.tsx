"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ClonedSiteAuthProvider, useClonedSiteAuth } from "@/contexts/cloned-site-auth-context"
import Link from "next/link"
import { Home, FileText, Truck, MessageSquare, Settings, LogOut, Send, AlertCircle, Users, ShieldCheck } from "lucide-react"
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore"
import { firestore } from "@/lib/firebase"
import { sendReportWebhook } from "@/lib/webhook"

interface ReportFormData {
  reporterName: string
  subject: string
  details: string
}

interface SiteSettings {
  websiteName?: string
  logoImageUrl?: string
  reportWebhookUrl?: string
}

function ClonedSiteReportForm() {
  const params = useParams<{ slug: string }>()
  const router = useRouter()
  const { user, logout, checkSession } = useClonedSiteAuth()
  const [siteName, setSiteName] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({})
  
  const [formData, setFormData] = useState<ReportFormData>({
    reporterName: "",
    subject: "",
    details: ""
  })

  useEffect(() => {
    const checkAuth = async () => {
      const sessionUser = await checkSession(params.slug)
      if (!sessionUser) {
        router.push(`/${params.slug}/login`)
        return
      }
      
      setFormData(prev => ({
        ...prev,
        reporterName: sessionUser.username
      }))
      
      // Load settings
      await loadSettings()
      
      setIsLoading(false)
    }
    checkAuth()
  }, [params.slug, checkSession, router])

  const loadSettings = async () => {
    try {
      console.log("📥 กำลังโหลด Settings จาก:", `cloned_sites/${params.slug}/settings/site_settings`)
      const settingsRef = doc(firestore, `cloned_sites/${params.slug}/settings`, 'site_settings')
      const settingsDoc = await getDoc(settingsRef)
      
      if (settingsDoc.exists()) {
        const settings = settingsDoc.data() as SiteSettings
        console.log("✅ Settings พบแล้ว:", settings)
        console.log("   - reportWebhookUrl:", settings.reportWebhookUrl)
        
        // บันทึก settings ทั้งหมด
        setSiteSettings(settings)
      } else {
        console.log("❌ ไม่พบ Settings document")
      }
    } catch (error) {
      console.error("❌ Error loading settings:", error)
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

  const handleLogout = () => {
    logout()
    router.push(`/${params.slug}/login`)
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
    if (!formData.subject.trim() || !formData.details.trim()) {
      setMessage({ type: 'error', text: 'กรุณากรอกข้อมูลให้ครบถ้วน' })
      return
    }

    if (formData.subject.trim().length < 3) {
      setMessage({ type: 'error', text: 'หัวข้อต้องมีอย่างน้อย 3 ตัวอักษร' })
      return
    }

    if (formData.details.trim().length < 10) {
      setMessage({ type: 'error', text: 'รายละเอียดต้องมีอย่างน้อย 10 ตัวอักษร' })
      return
    }

    setIsSubmitting(true)

    try {
      // Save to Firestore
      const reportsRef = collection(firestore, `cloned_sites/${params.slug}/reports`)
      await addDoc(reportsRef, {
        userId: user?.id,
        username: user?.username || formData.reporterName,
        reporterName: formData.reporterName,
        subject: formData.subject.trim(),
        details: formData.details.trim(),
        status: "pending",
        createdAt: serverTimestamp(),
        siteId: params.slug
      })

      // Send webhook notification
      if (siteSettings.reportWebhookUrl) {
        console.log("🔔 กำลังส่ง Report Webhook...")
        try {
          await sendReportWebhook(siteSettings.reportWebhookUrl, {
            username: formData.reporterName,
            group: user?.role,
            houseName: "",
            subject: formData.subject.trim(),
            details: formData.details.trim(),
            websiteName: siteSettings.websiteName,
            logoUrl: siteSettings.logoImageUrl
          })
          console.log("✅ ส่ง Report Webhook สำเร็จ!")
        } catch (webhookError) {
          console.error("⚠️ ส่ง Report Webhook ไม่สำเร็จ:", webhookError)
          // Don't fail the whole operation if webhook fails
        }
      } else {
        console.log("⚠️ ไม่มี Report Webhook URL ข้ามการส่ง Webhook")
      }

      setMessage({ type: 'success', text: 'ส่งรายงานสำเร็จ! ขอบคุณสำหรับข้อมูล' })
      
      // Reset form
      setFormData({
        reporterName: user?.username || "",
        subject: "",
        details: ""
      })

      // Auto hide success message after 3 seconds
      setTimeout(() => {
        setMessage(null)
      }, 3000)
    } catch (error) {
      console.error("Error submitting report:", error)
      setMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการส่งรายงาน' })
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
              className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-xl transition-all duration-300"
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
              className="flex items-center gap-3 px-4 py-3 text-white bg-blue-600/20 border border-blue-500/30 rounded-xl hover:bg-blue-600/30 transition-all duration-300"
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
                <MessageSquare className="w-8 h-8 text-yellow-400" />
                รายงาน
              </h2>
              <p className="text-gray-400">แจ้งปัญหาหรือส่งรายงานให้ทีมงาน</p>
            </div>

            {/* Message Alert */}
            {message && (
              <div className={`mb-6 p-4 rounded-xl border flex items-start gap-3 ${
                message.type === 'success' 
                  ? 'bg-green-600/20 border-green-500/30 text-green-400' 
                  : 'bg-red-600/20 border-red-500/30 text-red-400'
              }`}>
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{message.text}</span>
              </div>
            )}

            {/* Info Card */}
            <div className="mb-6 p-4 bg-blue-600/10 border border-blue-500/30 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-300">
                  <p className="font-medium mb-1">💡 เคล็ดลับในการส่งรายงาน</p>
                  <ul className="space-y-1 text-blue-200">
                    <li>• ระบุหัวข้อที่ชัดเจน</li>
                    <li>• แนบรายละเอียดที่เกี่ยวข้อง</li>
                    <li>• ทีมงานจะตรวจสอบภายใน 24-48 ชั่วโมง</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Form Card */}
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8">
              <h3 className="text-xl font-bold text-white mb-6 text-center">ส่งรายงาน</h3>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Reporter Name (readonly) */}
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    ผู้รายงาน
                  </label>
                  <input
                    type="text"
                    value={formData.reporterName}
                    className="w-full px-4 py-3 bg-gray-800/30 border border-gray-600/30 rounded-xl text-gray-400 cursor-not-allowed"
                    readOnly
                  />
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    หัวข้อรายงาน <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    placeholder="หัวข้อเรื่องที่ต้องการรายงาน"
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-300"
                    maxLength={100}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.subject.length}/100 ตัวอักษร
                  </p>
                </div>

                {/* Details */}
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    รายละเอียดรายงาน <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    name="details"
                    value={formData.details}
                    onChange={handleInputChange}
                    rows={8}
                    placeholder="กรอกรายละเอียดทั้งหมด... ยิ่งละเอียดมากยิ่งดี"
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-300 resize-none"
                    maxLength={1000}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.details.length}/1000 ตัวอักษร
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-yellow-600 to-yellow-700 text-white font-medium rounded-xl hover:from-yellow-700 hover:to-yellow-800 transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <Send className="w-5 h-5" />
                  {isSubmitting ? 'กำลังส่ง...' : 'ส่งรายงาน'}
                </button>
              </form>
            </div>

            {/* Additional Info */}
            <div className="mt-6 p-4 bg-gray-900/30 border border-gray-700/30 rounded-xl">
              <p className="text-sm text-gray-400 text-center">
                📧 หากเร่งด่วน สามารถติดต่อแอดมินได้โดยตรงที่อีเมล: support@example.com
              </p>
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

export default function ClonedSiteReportFormPage() {
  return (
    <ClonedSiteAuthProvider>
      <ClonedSiteReportForm />
    </ClonedSiteAuthProvider>
  )
}


