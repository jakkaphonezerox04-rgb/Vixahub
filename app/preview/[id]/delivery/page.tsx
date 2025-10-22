"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ClonedSiteAuthProvider, useClonedSiteAuth } from "@/contexts/cloned-site-auth-context"
import Link from "next/link"
import { Home, FileText, Truck, MessageSquare, Settings, LogOut, Calendar, Camera, Send, X, ZoomIn, Users, ShieldCheck } from "lucide-react"
import { collection, addDoc, serverTimestamp, doc, getDoc, onSnapshot } from "firebase/firestore"
import { firestore } from "@/lib/firebase"
import { sendDeliveryWebhook } from "@/lib/webhook"

interface DeliveryFormData {
  senderName: string
  houseName: string
  deliveryDate: string
  deliveryType: string
  screenshot?: string
}

const defaultDeliveryTypeOptions = [
  "ส่งเงิน",
  "ส่งของ",
  "ส่งเอกสาร",
  "ส่งพัสดุ",
  "อื่นๆ"
]

interface SiteSettings {
  websiteName?: string
  logoImageUrl?: string
  themeAccentColor?: string
  deliveryWebhookUrl?: string
  deliveryTypes?: string[]
}

function ClonedSiteDeliveryForm() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { user, logout, checkSession } = useClonedSiteAuth()
  const [siteName, setSiteName] = useState<string>("")
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [showImageModal, setShowImageModal] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [deliveryTypeOptions, setDeliveryTypeOptions] = useState<string[]>(defaultDeliveryTypeOptions)
  
  const [formData, setFormData] = useState<DeliveryFormData>({
    senderName: "",
    houseName: "",
    deliveryDate: "",
    deliveryType: "",
    screenshot: undefined
  })

  useEffect(() => {
    const checkAuth = async () => {
      const sessionUser = await checkSession(params.id)
      if (!sessionUser) {
        router.push(`/preview/${params.id}/login`)
        return
      }
      
      setFormData(prev => ({
        ...prev,
        senderName: sessionUser.username,
        houseName: ""
      }))
      
      // Load settings
      await loadSettings()
      
      setIsLoading(false)
    }
    checkAuth()
  }, [params.id, checkSession, router])

  const loadSettings = async () => {
    try {
      console.log("📥 กำลังโหลด Settings จาก:", `cloned_sites/${params.id}/settings/site_settings`)
      const settingsRef = doc(firestore, `cloned_sites/${params.id}/settings`, 'site_settings')
      const settingsDoc = await getDoc(settingsRef)
      
      if (settingsDoc.exists()) {
        const settings = settingsDoc.data() as SiteSettings
        console.log("✅ Settings พบแล้ว:", settings)
        console.log("   - deliveryTypes:", settings.deliveryTypes)
        console.log("   - deliveryWebhookUrl:", settings.deliveryWebhookUrl)
        
        // บันทึก settings ทั้งหมด
        setSiteSettings(settings)
        
        if (settings.deliveryTypes && Array.isArray(settings.deliveryTypes) && settings.deliveryTypes.length > 0) {
          console.log("✅ อัปเดต deliveryTypeOptions เป็น:", settings.deliveryTypes)
          setDeliveryTypeOptions(settings.deliveryTypes)
        } else {
          console.log("⚠️ ไม่พบ deliveryTypes หรือเป็น array ว่าง")
        }
      } else {
        console.log("❌ ไม่พบ Settings document")
      }
    } catch (error) {
      console.error("❌ Error loading settings:", error)
    }
  }

  useEffect(() => {
    try {
      const raw = localStorage.getItem("websites")
      const list = raw ? JSON.parse(raw) : []
      const found = list.find((s: any) => s.id === params.id)
      if (found) {
        setSiteName(found.name)
      }
    } catch {
      setSiteName("เว็บไซต์")
    }
  }, [params.id])

  const handleLogout = () => {
    logout()
    router.push(`/preview/${params.id}/login`)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const resizeImage = (dataUrl: string, maxWidth: number, maxHeight: number, quality: number = 0.7): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        let { width, height } = img
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height
            height = maxHeight
          }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height)
          resolve(canvas.toDataURL('image/jpeg', quality))
        }
      }
      img.src = dataUrl
    })
  }

  const handleScreenCapture = async () => {
    if (!navigator.mediaDevices?.getDisplayMedia) {
      setMessage({ type: 'error', text: 'เบราว์เซอร์ของคุณไม่รองรับการแคปหน้าจอ' })
      return
    }

    setIsCapturing(true)
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ 
        video: { mediaSource: 'screen' } as any
      })
      
      const video = document.createElement('video')
      video.srcObject = stream
      
      video.onloadedmetadata = async () => {
        video.play()
        
        // Wait a bit for video to be ready
        await new Promise(resolve => setTimeout(resolve, 500))
        
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          
          // Stop all tracks
          stream.getTracks().forEach(track => track.stop())
          
          // Resize and compress
          const dataUrl = canvas.toDataURL('image/png')
          const resizedUrl = await resizeImage(dataUrl, 800, 600, 0.8)
          
          setCapturedImage(resizedUrl)
          setFormData(prev => ({
            ...prev,
            screenshot: resizedUrl
          }))
          
          setMessage({ type: 'success', text: 'จับภาพหน้าจอสำเร็จ!' })
          setTimeout(() => setMessage(null), 3000)
        }
        
        setIsCapturing(false)
      }
    } catch (error) {
      console.error("Screen capture error:", error)
      setMessage({ type: 'error', text: 'การแชร์หน้าจอถูกยกเลิก' })
      setIsCapturing(false)
    }
  }

  const handleRemoveImage = () => {
    setCapturedImage(null)
    setFormData(prev => ({
      ...prev,
      screenshot: undefined
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (!formData.senderName || !formData.deliveryDate || !formData.deliveryType) {
      setMessage({ type: 'error', text: 'กรุณากรอกข้อมูลให้ครบถ้วน' })
      return
    }

    setIsSubmitting(true)

    try {
      const deliveryRecordsRef = collection(firestore, `cloned_sites/${params.id}/delivery_records`)
      await addDoc(deliveryRecordsRef, {
        userId: user?.id,
        username: user?.username || formData.senderName,
        senderName: formData.senderName,
        houseName: formData.houseName || "",
        deliveryDate: formData.deliveryDate,
        deliveryType: formData.deliveryType,
        screenshot: formData.screenshot || "",
        status: "completed",
        createdAt: serverTimestamp(),
        siteId: params.id
      })

      // Send webhook notification
      if (siteSettings.deliveryWebhookUrl) {
        console.log("🔔 กำลังส่ง Delivery Webhook...")
        try {
          await sendDeliveryWebhook(siteSettings.deliveryWebhookUrl, {
            username: formData.senderName,
            houseName: formData.houseName,
            deliveryDate: formData.deliveryDate,
            deliveryType: formData.deliveryType,
            screenshot: formData.screenshot,
            websiteName: siteSettings.websiteName,
            themeColor: siteSettings.themeAccentColor
          })
          console.log("✅ ส่ง Delivery Webhook สำเร็จ!")
        } catch (webhookError) {
          console.error("⚠️ ส่ง Delivery Webhook ไม่สำเร็จ:", webhookError)
          // Don't fail the whole operation if webhook fails
        }
      } else {
        console.log("⚠️ ไม่มี Delivery Webhook URL ข้ามการส่ง Webhook")
      }

      setMessage({ type: 'success', text: 'ยืนยันการส่งของสำเร็จ!' })
      
      // Reset form
      setFormData({
        senderName: user?.username || "",
        houseName: "",
        deliveryDate: "",
        deliveryType: "",
        screenshot: undefined
      })
      setCapturedImage(null)

      setTimeout(() => {
        setMessage(null)
      }, 3000)
    } catch (error) {
      console.error("Error submitting delivery record:", error)
      setMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการส่งข้อมูล' })
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
              href={`/preview/${params.id}/dashboard`}
              className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-xl transition-all duration-300"
            >
              <Home className="w-5 h-5" />
              <span>เมนูหลัก</span>
            </Link>
            <Link
              href={`/preview/${params.id}/leave`}
              className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-xl transition-all duration-300"
            >
              <FileText className="w-5 h-5" />
              <span>แจ้งลา</span>
            </Link>
            <Link
              href={`/preview/${params.id}/delivery`}
              className="flex items-center gap-3 px-4 py-3 text-white bg-blue-600/20 border border-blue-500/30 rounded-xl hover:bg-blue-600/30 transition-all duration-300"
            >
              <Truck className="w-5 h-5" />
              <span>ส่งของ</span>
            </Link>
            <Link
              href={`/preview/${params.id}/report`}
              className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-xl transition-all duration-300"
            >
              <MessageSquare className="w-5 h-5" />
              <span>รายงาน</span>
            </Link>
            <Link
              href={`/preview/${params.id}/members`}
              className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-xl transition-all duration-300"
            >
              <Users className="w-5 h-5" />
              <span>สมาชิกภายในบ้าน</span>
            </Link>
            {user?.role === 'admin' && (
              <Link
                href={`/preview/${params.id}/admin`}
                className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-xl transition-all duration-300"
              >
                <ShieldCheck className="w-5 h-5" />
                <span>แผงควบคุม Admin</span>
              </Link>
            )}
            <Link
              href={`/preview/${params.id}/settings`}
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
                <Truck className="w-8 h-8 text-green-400" />
                ส่งของ
              </h2>
              <p className="text-gray-400">กรอกแบบฟอร์มส่งของและแนบหลักฐาน</p>
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
              <h3 className="text-xl font-bold text-white mb-6 text-center">กรอกแบบฟอร์มส่งของ</h3>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Sender Name */}
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    ชื่อคนส่ง
                  </label>
                  <input
                    type="text"
                    name="senderName"
                    value={formData.senderName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    readOnly
                  />
                </div>

                {/* House Name */}
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

                {/* Delivery Date */}
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    วันที่ส่งของ
                  </label>
                  <input
                    type="date"
                    name="deliveryDate"
                    value={formData.deliveryDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    required
                  />
                </div>

                {/* Delivery Type */}
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    ประเภทการส่ง
                  </label>
                  <select
                    name="deliveryType"
                    value={formData.deliveryType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    required
                  >
                    <option value="" disabled>กรุณาเลือกประเภท</option>
                    {deliveryTypeOptions.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {/* Screenshot Capture */}
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-3">
                    แคปหน้าจอ (ไม่บังคับ)
                  </label>
                  
                  {!capturedImage ? (
                    <button
                      type="button"
                      onClick={handleScreenCapture}
                      disabled={isCapturing}
                      className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gray-800/50 border border-gray-600/50 text-gray-300 rounded-xl hover:bg-gray-700/50 hover:border-gray-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Camera className="w-5 h-5" />
                      {isCapturing ? 'กำลังแคป...' : 'กดเพื่อแคปหน้าจอ'}
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-400">ภาพตัวอย่าง (คลิกเพื่อดูภาพขยาย):</p>
                      <div className="relative group">
                        <img
                          src={capturedImage}
                          alt="Screenshot preview"
                          onClick={() => setShowImageModal(true)}
                          className="w-full rounded-xl border-2 border-gray-600/50 cursor-pointer hover:border-blue-500/50 transition-all duration-300"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl flex items-center justify-center">
                          <ZoomIn className="w-8 h-8 text-white" />
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="absolute top-2 right-2 p-2 bg-red-600/80 hover:bg-red-600 text-white rounded-xl transition-all duration-300"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white font-medium rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <Send className="w-5 h-5" />
                  {isSubmitting ? 'กำลังส่ง...' : 'ยืนยันการส่งของ'}
                </button>
              </form>
            </div>
          </div>
        </main>
      </div>

      {/* Image Modal */}
      {showImageModal && capturedImage && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] p-4"
          onClick={() => setShowImageModal(false)}
        >
          <div className="relative max-w-7xl max-h-[90vh]">
            <img
              src={capturedImage}
              alt="Full size screenshot"
              className="max-w-full max-h-[90vh] object-contain rounded-xl"
            />
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 p-3 bg-red-600/80 hover:bg-red-600 text-white rounded-xl transition-all duration-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-8 py-4 px-6 text-center text-gray-400 border-t border-gray-700/50">
        <p>© {new Date().getFullYear()} {siteName} - Powered by VIXAHUB</p>
      </footer>
    </div>
  )
}

export default function ClonedSiteDeliveryFormPage() {
  return (
    <ClonedSiteAuthProvider>
      <ClonedSiteDeliveryForm />
    </ClonedSiteAuthProvider>
  )
}


