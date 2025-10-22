"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ClonedSiteAuthProvider, useClonedSiteAuth } from "@/contexts/cloned-site-auth-context"
import { ClonedSiteLayout, SiteLogo } from "@/components/cloned-site-layout"
import ClonedSiteRouteGuard from "@/components/cloned-site-route-guard"
import Link from "next/link"
import { Home, FileText, Truck, MessageSquare, Settings, LogOut, User, Users, ShieldCheck, Shield, AlertTriangle } from "lucide-react"
import { collection, getDocs, query, where, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore"
import { firestore } from "@/lib/firebase"
import { getWebsiteBySlug } from "@/lib/firebase-websites"

interface DashboardStats {
  totalLeaveRequests: number
  totalFineAmount: number
  totalDeliveryRecords: number
  totalReportRecords: number
}

interface LeaveFormData {
  leaveTypes: string[]
  startDate: string
  endDate: string
  reason: string
}

interface DeliveryFormData {
  deliveryType: string
  deliveryDate: string
  screenshot?: string
}

interface ReportFormData {
  title: string
  description: string
  priority: string
}

function ClonedSiteUserDashboard() {
  const params = useParams<{ slug: string }>()
  const router = useRouter()
  const { user, logout, checkSession } = useClonedSiteAuth()
  const [siteName, setSiteName] = useState<string>("")
  const [stats, setStats] = useState<DashboardStats>({
    totalLeaveRequests: 0,
    totalFineAmount: 0,
    totalDeliveryRecords: 0,
    totalReportRecords: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'leave' | 'delivery' | 'report' | 'members'>('dashboard')
  const [leaveTypes, setLeaveTypes] = useState<string[]>([])
  const [deliveryTypes, setDeliveryTypes] = useState<string[]>([])
  const [leaveFormData, setLeaveFormData] = useState<LeaveFormData>({
    leaveTypes: [],
    startDate: '',
    endDate: '',
    reason: ''
  })
  const [deliveryFormData, setDeliveryFormData] = useState<DeliveryFormData>({
    deliveryType: '',
    deliveryDate: '',
    screenshot: ''
  })
  const [isRecording, setIsRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([])
  const [reportFormData, setReportFormData] = useState<ReportFormData>({
    title: '',
    description: '',
    priority: 'medium'
  })
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [recentActivities, setRecentActivities] = useState<any[]>([])

  // Load site information from Firebase
  useEffect(() => {
    const loadSite = async () => {
      try {
        const website = await getWebsiteBySlug(params.slug)
        if (website) {
          setSiteName(website.name)
        } else {
          router.push("/")
        }
      } catch (error) {
        console.error("Error loading site:", error)
        router.push("/")
      }
    }
    loadSite()
  }, [params.slug, router])

  useEffect(() => {
    if (!siteName) return

    // Check if user is logged in
    const checkAuth = async () => {
      console.log('[DASHBOARD] Checking session for slug:', params.slug)
      const sessionUser = await checkSession(params.slug)
      console.log('[DASHBOARD] Session user:', sessionUser)
      
      if (!sessionUser) {
        console.log('[DASHBOARD] No session, redirecting to login')
        router.push(`/${params.slug}/login`)
        return
      }
      
      // Load real data from Firebase
      await loadDashboardStats(sessionUser)
      await loadFormData()
      setIsLoading(false)
    }
    checkAuth()
  }, [siteName, params.slug, checkSession, router])

  const loadDashboardStats = async (currentUser: any) => {
    try {
      // Load leave requests for current user
      const leaveRequestsRef = collection(firestore, `cloned_sites/${params.slug}/leave_requests`)
      const leaveQuery = query(leaveRequestsRef, where("userId", "==", currentUser.id))
      const leaveSnapshot = await getDocs(leaveQuery)
      
      // Load fine records for current user
      const fineRecordsRef = collection(firestore, `cloned_sites/${params.slug}/fine_records`)
      const fineQuery = query(fineRecordsRef, where("memberName", "==", currentUser.username))
      const fineSnapshot = await getDocs(fineQuery)
      
      let totalFineAmount = 0
      fineSnapshot.forEach((doc) => {
        const data = doc.data()
        totalFineAmount += data.amount || 0
      })
      
      // Load delivery records for current user
      const deliveryRecordsRef = collection(firestore, `cloned_sites/${params.slug}/delivery_records`)
      const deliveryQuery = query(deliveryRecordsRef, where("userId", "==", currentUser.id))
      const deliverySnapshot = await getDocs(deliveryQuery)
      
      // Load reports for current user
      const reportsRef = collection(firestore, `cloned_sites/${params.slug}/reports`)
      const reportsQuery = query(reportsRef, where("userId", "==", currentUser.id))
      const reportsSnapshot = await getDocs(reportsQuery)
      
      setStats({
        totalLeaveRequests: leaveSnapshot.size,
        totalFineAmount: totalFineAmount,
        totalDeliveryRecords: deliverySnapshot.size,
        totalReportRecords: reportsSnapshot.size,
      })
    } catch (error) {
      console.error("Error loading dashboard stats:", error)
      setStats({
        totalLeaveRequests: 0,
        totalFineAmount: 0,
        totalDeliveryRecords: 0,
        totalReportRecords: 0,
      })
    }
  }

  const loadFormData = async () => {
    try {
      // Load leave types and delivery types from admin settings
      const settingsRef = doc(firestore, `cloned_sites/${params.slug}/settings`, 'site_settings')
      const settingsSnapshot = await getDoc(settingsRef)
      
      if (settingsSnapshot.exists()) {
        const settingsData = settingsSnapshot.data()
        console.log('Settings data loaded:', settingsData)
        
        if (settingsData.leaveTypes && Array.isArray(settingsData.leaveTypes)) {
          setLeaveTypes(settingsData.leaveTypes)
          console.log('Leave types loaded:', settingsData.leaveTypes)
        }
        
        if (settingsData.deliveryTypes && Array.isArray(settingsData.deliveryTypes)) {
          setDeliveryTypes(settingsData.deliveryTypes)
          console.log('Delivery types loaded:', settingsData.deliveryTypes)
        }
      } else {
        console.log('No settings document found')
      }
    } catch (error) {
      console.error("Error loading form data:", error)
    }
  }

  const startScreenRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: 'screen' },
        audio: true
      })
      
      const recorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      })
      
      const chunks: Blob[] = []
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }
      
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' })
        const reader = new FileReader()
        reader.onload = () => {
          setDeliveryFormData(prev => ({ 
            ...prev, 
            screenshot: reader.result as string 
          }))
        }
        reader.readAsDataURL(blob)
        setRecordedChunks([])
      }
      
      recorder.start()
      setMediaRecorder(recorder)
      setIsRecording(true)
      setRecordedChunks(chunks)
      
    } catch (error) {
      console.error('Error starting screen recording:', error)
      alert('ไม่สามารถเริ่มบันทึกหน้าจอได้ กรุณาลองใหม่อีกครั้ง')
    }
  }

  const stopScreenRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop()
      mediaRecorder.stream.getTracks().forEach(track => track.stop())
      setIsRecording(false)
      setMediaRecorder(null)
    }
  }

  const handleLogout = () => {
    logout()
    router.push(`/${params.slug}/login`)
  }

  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    setIsSubmitting(true)
    setMessage(null)

    try {
      const leaveData = {
        userId: user?.id || '',
        username: user?.username || '',
        houseName: user?.houseName || '',
        leaveTypes: leaveFormData.leaveTypes,
        startDate: leaveFormData.startDate,
        endDate: leaveFormData.endDate,
        reason: leaveFormData.reason,
        status: 'pending',
        createdAt: serverTimestamp()
      }

      const leaveRequestsRef = collection(firestore, `cloned_sites/${params.slug}/leave_requests`)
      await addDoc(leaveRequestsRef, leaveData)

      setMessage({ type: 'success', text: 'ส่งคำขอลาสำเร็จ!' })
      setLeaveFormData({ leaveTypes: [], startDate: '', endDate: '', reason: '' })
      await loadDashboardStats(user)
    } catch (error) {
      console.error("Error submitting leave request:", error)
      setMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการส่งคำขอลา' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeliverySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    setIsSubmitting(true)
    setMessage(null)

    try {
      const deliveryData = {
        userId: user?.id || '',
        username: user?.username || '',
        houseName: user?.houseName || '',
        deliveryType: deliveryFormData.deliveryType,
        deliveryDate: deliveryFormData.deliveryDate,
        screenshot: deliveryFormData.screenshot || '',
        createdAt: serverTimestamp()
      }

      const deliveryRecordsRef = collection(firestore, `cloned_sites/${params.slug}/delivery_records`)
      await addDoc(deliveryRecordsRef, deliveryData)

      // Log activity
      await logActivity(user?.id || '', user?.username || '', user?.role || '', user?.houseName || '', 'create_delivery', `ส่งของ: ${deliveryFormData.deliveryType} วันที่ ${deliveryFormData.deliveryDate}`)

      // Send webhook notification
      const settingsRef = doc(firestore, `cloned_sites/${params.slug}/settings`, 'site_settings')
      const settingsSnapshot = await getDoc(settingsRef)
      
      if (settingsSnapshot.exists()) {
        const siteSettings = settingsSnapshot.data()
        
        if (siteSettings.deliveryWebhookUrl) {
          console.log("🔔 กำลังส่ง Delivery Webhook...")
          try {
            const { sendDeliveryWebhook } = await import('@/lib/webhook')
            await sendDeliveryWebhook(siteSettings.deliveryWebhookUrl, {
              username: user?.username || '',
              houseName: user?.houseName || '',
              deliveryDate: deliveryFormData.deliveryDate,
              deliveryType: deliveryFormData.deliveryType,
              screenshot: deliveryFormData.screenshot || '',
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
      }

      setMessage({ type: 'success', text: 'ส่งข้อมูลการส่งของสำเร็จ!' })
      setDeliveryFormData({ deliveryType: '', deliveryDate: '', screenshot: '' })
      await loadDashboardStats(user)
    } catch (error) {
      console.error("Error submitting delivery:", error)
      setMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการส่งข้อมูลการส่งของ' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    setIsSubmitting(true)
    setMessage(null)

    try {
      const reportData = {
        userId: user?.id || '',
        username: user?.username || '',
        houseName: user?.houseName || '',
        title: reportFormData.title,
        description: reportFormData.description,
        priority: reportFormData.priority,
        status: 'pending',
        createdAt: serverTimestamp()
      }

      const reportsRef = collection(firestore, `cloned_sites/${params.slug}/reports`)
      await addDoc(reportsRef, reportData)

      setMessage({ type: 'success', text: 'ส่งรายงานสำเร็จ!' })
      setReportFormData({ title: '', description: '', priority: 'medium' })
      await loadDashboardStats(user)
    } catch (error) {
      console.error("Error submitting report:", error)
      setMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการส่งรายงาน' })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading || !user || !siteName) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-blue-950">
        <div className="text-white text-lg">กำลังโหลด...</div>
      </div>
    )
  }

  return (
    <ClonedSiteRouteGuard requireAuth={true}>
      <ClonedSiteLayout slug={params.slug}>
        {/* Header */}
        <header className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-700/50 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <SiteLogo slug={params.slug} className="w-10 h-10" />
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
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                activeTab === 'dashboard'
                  ? 'text-white bg-blue-600/20 border border-blue-500/30'
                  : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <Home className="w-5 h-5" />
              <span>เมนูหลัก</span>
            </button>
            <button
              onClick={() => setActiveTab('leave')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                activeTab === 'leave'
                  ? 'text-white bg-blue-600/20 border border-blue-500/30'
                  : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <FileText className="w-5 h-5" />
              <span>แจ้งลา</span>
            </button>
            <button
              onClick={() => setActiveTab('delivery')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                activeTab === 'delivery'
                  ? 'text-white bg-blue-600/20 border border-blue-500/30'
                  : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <Truck className="w-5 h-5" />
              <span>ส่งของ</span>
            </button>
            <button
              onClick={() => setActiveTab('report')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                activeTab === 'report'
                  ? 'text-white bg-blue-600/20 border border-blue-500/30'
                  : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <MessageSquare className="w-5 h-5" />
              <span>รายงาน</span>
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                activeTab === 'members'
                  ? 'text-white bg-blue-600/20 border border-blue-500/30'
                  : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <Users className="w-5 h-5" />
              <span>สมาชิกภายในบ้าน</span>
            </button>
            {user?.role === 'staff' && (
              <Link
                href={`/${params.slug}/staff`}
                className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-xl transition-all duration-300"
              >
                <Shield className="w-5 h-5" />
                <span>เมนู Staff</span>
              </Link>
            )}
            {user?.role === 'admin' && (
              <Link
                href={`/${params.slug}/admin`}
                className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-xl transition-all duration-300"
              >
                <ShieldCheck className="w-5 h-5" />
                <span>แผงควบคุม Admin</span>
              </Link>
            )}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Dashboard Tab Content */}
            {activeTab === 'dashboard' && (
              <>
                {/* Page Title */}
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">เมนูหลัก</h2>
                  <p className="text-gray-400">ภาพรวมข้อมูลและสถิติของคุณ</p>
                </div>

            {/* Warning for users without house/group */}
            {user.role !== 'admin' && !user.houseName && (
              <div className="bg-yellow-600/20 border border-yellow-500/30 rounded-xl p-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-yellow-600/30 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-yellow-400 mb-1">รอการกำหนดบ้าน/กลุ่ม</h3>
                    <p className="text-yellow-200">
                      คุณยังไม่ได้รับกำหนดให้อยู่ในบ้าน/กลุ่มใดๆ กรุณาติดต่อ Admin เพื่อขอให้กำหนดบ้าน/กลุ่มให้คุณ
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Stats Overview */}
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">ภาพรวม</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Stat Card 1 */}
                <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6 text-center hover:scale-105 transition-transform duration-300">
                  <div className="text-4xl font-bold text-blue-400 mb-2">
                    {stats.totalLeaveRequests}
                  </div>
                  <div className="text-gray-300 text-sm">คำขอลาทั้งหมด</div>
                </div>

                {/* Stat Card 2 */}
                <div className="bg-gradient-to-br from-red-600/20 to-red-800/20 backdrop-blur-sm border border-red-500/30 rounded-xl p-6 text-center hover:scale-105 transition-transform duration-300">
                  <div className="text-4xl font-bold text-red-400 mb-2">
                    ฿{stats.totalFineAmount.toLocaleString()}
                  </div>
                  <div className="text-gray-300 text-sm">ค่าปรับทั้งหมด</div>
                </div>

                {/* Stat Card 3 */}
                <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 backdrop-blur-sm border border-green-500/30 rounded-xl p-6 text-center hover:scale-105 transition-transform duration-300">
                  <div className="text-4xl font-bold text-green-400 mb-2">
                    {stats.totalDeliveryRecords}
                  </div>
                  <div className="text-gray-300 text-sm">รายการส่งของ</div>
                </div>

                {/* Stat Card 4 */}
                <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 backdrop-blur-sm border border-yellow-500/30 rounded-xl p-6 text-center hover:scale-105 transition-transform duration-300">
                  <div className="text-4xl font-bold text-yellow-400 mb-2">
                    {stats.totalReportRecords}
                  </div>
                  <div className="text-gray-300 text-sm">รายการรายงาน</div>
                </div>
              </div>
            </div>

            {/* User Information */}
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">ข้อมูลของคุณ</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-xl border border-gray-700/30">
                    <User className="w-5 h-5 text-blue-400" />
                    <div>
                      <div className="text-sm text-gray-400">ชื่อผู้ใช้</div>
                      <div className="text-white font-medium">{user.username}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-xl border border-gray-700/30">
                    <Users className="w-5 h-5 text-green-400" />
                    <div>
                      <div className="text-sm text-gray-400">อีเมล</div>
                      <div className="text-white font-medium">{user.email}</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-xl border border-gray-700/30">
                    <div className="w-5 h-5 text-purple-400">📱</div>
                    <div>
                      <div className="text-sm text-gray-400">เบอร์โทรศัพท์</div>
                      <div className="text-white font-medium">{user.phone || "ไม่ระบุ"}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-xl border border-gray-700/30">
                    <div className="w-5 h-5 text-yellow-400">🎯</div>
                    <div>
                      <div className="text-sm text-gray-400">สถานะ</div>
                      <div className="text-white font-medium">{user.role || "สมาชิก"}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <Link href={`/${params.slug}/fine-details`} className="inline-block w-full md:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 hover:scale-105 hover:shadow-lg text-center">
                  ดูรายละเอียดค่าปรับของฉัน
                </Link>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">กิจกรรมล่าสุด</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-white font-medium">ส่งคำขอลา</div>
                      <div className="text-sm text-gray-400">2 วันที่แล้ว</div>
                    </div>
                  </div>
                  <span className="text-xs px-3 py-1 bg-green-600/20 text-green-400 rounded-full border border-green-500/30">
                    อนุมัติ
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-600/20 border border-green-500/30 flex items-center justify-center">
                      <Truck className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <div className="text-white font-medium">ส่งของสำเร็จ</div>
                      <div className="text-sm text-gray-400">5 วันที่แล้ว</div>
                    </div>
                  </div>
                  <span className="text-xs px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full border border-blue-500/30">
                    สำเร็จ
                  </span>
                </div>
              </div>
            </div>
              </>
            )}

            {/* Form Tabs */}
        {activeTab === 'leave' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white mb-6">📝 แจ้งลา</h2>
            
            {/* Message */}
            {message && (
              <div className={`p-4 rounded-xl ${
                message.type === 'success' 
                  ? 'bg-green-600/20 border border-green-500/30 text-green-400' 
                  : 'bg-red-600/20 border border-red-500/30 text-red-400'
              }`}>
                {message.text}
              </div>
            )}

            {/* Leave Form */}
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8">
              <form onSubmit={handleLeaveSubmit} className="space-y-6">
                {/* Leave Types */}
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    ประเภทการลา <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={leaveFormData.leaveTypes[0] || ''}
                    onChange={(e) => setLeaveFormData(prev => ({ 
                      ...prev, 
                      leaveTypes: e.target.value ? [e.target.value] : [] 
                    }))}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-blue-500"
                    required
                  >
                    <option value="">เลือกประเภทการลา</option>
                    {leaveTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      วันที่เริ่มลา <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="date"
                      value={leaveFormData.startDate}
                      onChange={(e) => setLeaveFormData(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      วันที่สิ้นสุดลา <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="date"
                      value={leaveFormData.endDate}
                      onChange={(e) => setLeaveFormData(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    เหตุผล <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={leaveFormData.reason}
                    onChange={(e) => setLeaveFormData(prev => ({ ...prev, reason: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-blue-500"
                    placeholder="ระบุเหตุผลในการลา"
                    rows={3}
                    required
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      กำลังส่ง...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      ส่งคำขอลา
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'delivery' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white mb-6">🚚 ส่งของ</h2>
            
            {/* Message */}
            {message && (
              <div className={`p-4 rounded-xl ${
                message.type === 'success' 
                  ? 'bg-green-600/20 border border-green-500/30 text-green-400' 
                  : 'bg-red-600/20 border border-red-500/30 text-red-400'
              }`}>
                {message.text}
              </div>
            )}

            {/* Delivery Form */}
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8">
              <form onSubmit={handleDeliverySubmit} className="space-y-6">
                {/* Delivery Type */}
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    ประเภทการส่งของ <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={deliveryFormData.deliveryType}
                    onChange={(e) => setDeliveryFormData(prev => ({ ...prev, deliveryType: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-blue-500"
                    required
                  >
                    <option value="">เลือกประเภทการส่งของ</option>
                    {deliveryTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {/* Delivery Date */}
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    วันที่ส่งของ <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={deliveryFormData.deliveryDate}
                    onChange={(e) => setDeliveryFormData(prev => ({ ...prev, deliveryDate: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                {/* Media Capture */}
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    หลักฐาน (ไม่บังคับ)
                  </label>
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* Screenshot Button */}
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const stream = await navigator.mediaDevices.getDisplayMedia({
                              video: { mediaSource: 'screen' }
                            })
                            const video = document.createElement('video')
                            video.srcObject = stream
                            video.play()
                            
                            video.addEventListener('loadedmetadata', () => {
                              const canvas = document.createElement('canvas')
                              canvas.width = video.videoWidth
                              canvas.height = video.videoHeight
                              const ctx = canvas.getContext('2d')
                              ctx?.drawImage(video, 0, 0)
                              
                              const screenshot = canvas.toDataURL('image/png')
                              setDeliveryFormData(prev => ({ ...prev, screenshot }))
                              
                              stream.getTracks().forEach(track => track.stop())
                            })
                          } catch (error) {
                            console.error('Error capturing screen:', error)
                            alert('ไม่สามารถ capture หน้าจอได้ กรุณาลองใหม่อีกครั้ง')
                          }
                        }}
                        className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        แคปหน้าจอ
                      </button>
                      
                      {/* Screen Recording Button */}
                      <button
                        type="button"
                        onClick={isRecording ? stopScreenRecording : startScreenRecording}
                        className={`px-4 py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
                          isRecording 
                            ? 'bg-red-600 hover:bg-red-700 text-white' 
                            : 'bg-purple-600 hover:bg-purple-700 text-white'
                        }`}
                      >
                        {isRecording ? (
                          <>
                            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                            หยุดบันทึก
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            บันทึกวิดีโอ
                          </>
                        )}
                      </button>
                      
                      {/* File Upload Button */}
                      <input
                        type="file"
                        accept="image/*,video/*"
                        capture="environment"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            const reader = new FileReader()
                            reader.onload = (e) => {
                              setDeliveryFormData(prev => ({ 
                                ...prev, 
                                screenshot: e.target?.result as string 
                              }))
                            }
                            reader.readAsDataURL(file)
                          }
                        }}
                        className="hidden"
                        id="file-upload"
                      />
                      <label
                        htmlFor="file-upload"
                        className="px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        เลือกไฟล์
                      </label>
                    </div>
                    
                    {deliveryFormData.screenshot && (
                      <div className="mt-2">
                        {deliveryFormData.screenshot.startsWith('data:video/') ? (
                          <video 
                            src={deliveryFormData.screenshot} 
                            controls
                            className="w-full max-w-xs h-32 object-cover rounded-lg border border-gray-600"
                          />
                        ) : (
                          <img 
                            src={deliveryFormData.screenshot} 
                            alt="Media preview" 
                            className="w-full max-w-xs h-32 object-cover rounded-lg border border-gray-600"
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => setDeliveryFormData(prev => ({ ...prev, screenshot: '' }))}
                          className="mt-2 text-red-400 hover:text-red-300 text-sm"
                        >
                          ลบไฟล์
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      กำลังส่ง...
                    </>
                  ) : (
                    <>
                      <Truck className="w-4 h-4" />
                      ส่งข้อมูลการส่งของ
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'report' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white mb-6">📋 รายงาน</h2>
            
            {/* Message */}
            {message && (
              <div className={`p-4 rounded-xl ${
                message.type === 'success' 
                  ? 'bg-green-600/20 border border-green-500/30 text-green-400' 
                  : 'bg-red-600/20 border border-red-500/30 text-red-400'
              }`}>
                {message.text}
              </div>
            )}

            {/* Report Form */}
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8">
              <form onSubmit={handleReportSubmit} className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    หัวข้อรายงาน <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={reportFormData.title}
                    onChange={(e) => setReportFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-blue-500"
                    placeholder="ระบุหัวข้อรายงาน"
                    required
                  />
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    ระดับความสำคัญ <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={reportFormData.priority}
                    onChange={(e) => setReportFormData(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-blue-500"
                    required
                  >
                    <option value="low">ต่ำ</option>
                    <option value="medium">ปานกลาง</option>
                    <option value="high">สูง</option>
                    <option value="urgent">ด่วน</option>
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    รายละเอียด <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={reportFormData.description}
                    onChange={(e) => setReportFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-blue-500"
                    placeholder="ระบุรายละเอียดของปัญหา"
                    rows={4}
                    required
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full px-6 py-3 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      กำลังส่ง...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-4 h-4" />
                      ส่งรายงาน
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white mb-6">👥 สมาชิกภายในบ้าน</h2>
            
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">สมาชิกภายในบ้าน</h3>
                <p className="text-gray-400 mb-6">
                  ดูรายชื่อสมาชิกในบ้าน/กลุ่ม: <span className="text-yellow-400 font-semibold">{user?.houseName || 'ไม่ระบุ'}</span>
                </p>
                <p className="text-gray-500 text-sm">
                  ฟีเจอร์นี้จะถูกย้ายมาเป็น tab ในหน้าหลักเร็วๆ นี้
                </p>
              </div>
            </div>
          </div>
        )}
          </div>
        </main>
      </div>

        {/* Footer */}
        <footer className="mt-8 py-4 px-6 text-center text-gray-400 border-t border-gray-700/50">
          <p>© {new Date().getFullYear()} {siteName} - Powered by VIXAHUB</p>
        </footer>
      </ClonedSiteLayout>
    </ClonedSiteRouteGuard>
  )
}

export default function ClonedSiteUserDashboardPage() {
  return (
    <ClonedSiteAuthProvider>
      <ClonedSiteUserDashboard />
    </ClonedSiteAuthProvider>
  )
}
