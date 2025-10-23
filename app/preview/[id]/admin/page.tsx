"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ClonedSiteAuthProvider, useClonedSiteAuth } from "@/contexts/cloned-site-auth-context"
import Link from "next/link"
import { 
  Home, FileText, Truck, MessageSquare, Settings, LogOut, Users, 
  ShieldCheck, BarChart3, UserPlus, Trash2, Check, X, Edit2, Plus,
  Save, Palette, List, DollarSign, Shield, Building, Swords, Webhook, RefreshCw
} from "lucide-react"
import { 
  collection, getDocs, doc, updateDoc, deleteDoc, addDoc, 
  serverTimestamp, query, where, Timestamp, getDoc, setDoc, onSnapshot
} from "firebase/firestore"
import { firestore } from "@/lib/firebase"
 

// Interfaces
interface SiteSettings {
  websiteName: string
  backgroundColor: string
  textColor: string
  themeAccentColor: string
  backgroundImageUrl: string
  logoImageUrl: string
  webhookUrl: string
  deliveryWebhookUrl: string
  reportWebhookUrl: string
  fineWebhookUrl: string
  leaveTypes: string[]
  deliveryTypes: string[]
  fineList: { name: string; amount: number }[]
}

interface User {
  id: string
  username: string
  email: string
  role: string
  createdAt: any
}

interface LeaveRequest {
  id: string
  username: string
  userId: string
  leaveTypes: string[]
  startDate: string
  endDate: string
  reason: string
  status: string
  createdAt: any
}

interface FineRecord {
  id: string
  memberName: string
  fineItem: string
  amount: number
  reason: string
  status: string
  staffUser: string
  timestamp: any
}

interface DeliveryRecord {
  id: string
  username: string
  deliveryType: string
  deliveryDate: string
  screenshot?: string
  createdAt: any
}

interface Report {
  id: string
  username: string
  subject: string
  details: string
  createdAt: any
}

interface Stats {
  totalUsers: number
  leaveRequestsToday: number
  pendingLeaveRequests: number
  totalFines: number
  unpaidFines: number
  deliveryRecords: number
  reports: number
}

function ClonedSiteAdmin() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { user, logout, checkSession } = useClonedSiteAuth()
  const [siteName, setSiteName] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [activeTab, setActiveTab] = useState<'dashboard' | 'settings' | 'users' | 'leaves' | 'delivery' | 'reports' | 'fines'>('dashboard')
  
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    leaveRequestsToday: 0,
    pendingLeaveRequests: 0,
    totalFines: 0,
    unpaidFines: 0,
    deliveryRecords: 0,
    reports: 0
  })
  
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    websiteName: "",
    backgroundColor: "#1a0170",
    textColor: "#ffffff",
    themeAccentColor: "#ff00ff",
    backgroundImageUrl: "",
    logoImageUrl: "",
    webhookUrl: "",
    deliveryWebhookUrl: "",
    reportWebhookUrl: "",
    fineWebhookUrl: "",
    leaveTypes: ["ลาป่วย", "ลากิจ", "ลาพักร้อน"],
    deliveryTypes: ["อาหาร", "อุปกรณ์", "เอกสาร"],
    fineList: []
  })

  const [users, setUsers] = useState<User[]>([])
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [fineRecords, setFineRecords] = useState<FineRecord[]>([])
  const [deliveryRecords, setDeliveryRecords] = useState<DeliveryRecord[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Form states
  
  const [newLeaveType, setNewLeaveType] = useState('')
  const [newDeliveryType, setNewDeliveryType] = useState('')
  const [newFine, setNewFine] = useState({ name: '', amount: 0 })
  const [editingUser, setEditingUser] = useState<User | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      const sessionUser = await checkSession(params.id)
      if (!sessionUser) {
        router.push(`/preview/${params.id}/login`)
        return
      }
      
      if (sessionUser.role !== 'admin') {
        alert('คุณไม่มีสิทธิ์เข้าถึงหน้านี้')
        router.push(`/preview/${params.id}/dashboard`)
        return
      }
      
      await loadAllData()
      setIsLoading(false)
    }
    checkAuth()
  }, [params.id, checkSession, router])

  // Real-time listeners for data changes
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      console.log("⏸️ Real-time listeners ยังไม่เริ่ม (รอ user หรือไม่ใช่ admin)")
      return
    }

    console.log("🎧 เริ่ม Real-time listeners สำหรับ site:", params.id)
    const unsubscribers: (() => void)[] = []

    // Listen to users changes
    const usersUnsubscribe = onSnapshot(
      collection(firestore, `cloned_sites/${params.id}/users`),
      (snapshot) => {
        console.log("👥 Users อัปเดต! จำนวน:", snapshot.size)
        loadUsers()
        loadStats()
        setLastRefresh(new Date())
      },
      (error) => {
        console.error("❌ Users listener error:", error)
      }
    )
    unsubscribers.push(usersUnsubscribe)

    // Listen to leave requests changes
    const leavesUnsubscribe = onSnapshot(
      collection(firestore, `cloned_sites/${params.id}/leave_requests`),
      (snapshot) => {
        console.log("📝 Leave Requests อัปเดต! จำนวน:", snapshot.size)
        loadLeaveRequests()
        loadStats()
        setLastRefresh(new Date())
      },
      (error) => {
        console.error("❌ Leave Requests listener error:", error)
      }
    )
    unsubscribers.push(leavesUnsubscribe)

    // Listen to fine records changes
    const finesUnsubscribe = onSnapshot(
      collection(firestore, `cloned_sites/${params.id}/fine_records`),
      (snapshot) => {
        console.log("💰 Fine Records อัปเดต! จำนวน:", snapshot.size)
        loadFineRecords()
        loadStats()
        setLastRefresh(new Date())
      },
      (error) => {
        console.error("❌ Fine Records listener error:", error)
      }
    )
    unsubscribers.push(finesUnsubscribe)

    // Listen to delivery records changes
    const deliveryUnsubscribe = onSnapshot(
      collection(firestore, `cloned_sites/${params.id}/delivery_records`),
      (snapshot) => {
        console.log("🚚 Delivery Records อัปเดต! จำนวน:", snapshot.size)
        loadDeliveryRecords()
        loadStats()
        setLastRefresh(new Date())
      },
      (error) => {
        console.error("❌ Delivery Records listener error:", error)
      }
    )
    unsubscribers.push(deliveryUnsubscribe)

    // Listen to reports changes
    const reportsUnsubscribe = onSnapshot(
      collection(firestore, `cloned_sites/${params.id}/reports`),
      (snapshot) => {
        console.log("📢 Reports อัปเดต! จำนวน:", snapshot.size)
        loadReports()
        loadStats()
        setLastRefresh(new Date())
      },
      (error) => {
        console.error("❌ Reports listener error:", error)
      }
    )
    unsubscribers.push(reportsUnsubscribe)

    // Listen to settings changes
    const settingsUnsubscribe = onSnapshot(
      doc(firestore, `cloned_sites/${params.id}/settings`, 'site_settings'),
      (snapshot) => {
        console.log("⚙️ Settings อัปเดต!")
        loadSettings()
        setLastRefresh(new Date())
      },
      (error) => {
        console.error("❌ Settings listener error:", error)
      }
    )
    unsubscribers.push(settingsUnsubscribe)

    // Cleanup all listeners on unmount
    return () => {
      console.log("🔇 ปิด Real-time listeners")
      unsubscribers.forEach(unsubscribe => unsubscribe())
    }
  }, [params.id, user])

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

  const loadAllData = async () => {
    await Promise.all([
      loadSettings(),
      loadUsers(),
      loadLeaveRequests(),
      loadFineRecords(),
      loadDeliveryRecords(),
      loadReports(),
      loadStats()
    ])
  }

  const loadSettings = async () => {
    try {
      const settingsRef = doc(firestore, `cloned_sites/${params.id}/settings`, 'site_settings')
      const settingsDoc = await getDoc(settingsRef)
      
      if (settingsDoc.exists()) {
        const data = settingsDoc.data()
        setSiteSettings(prev => ({ ...prev, ...data as Partial<SiteSettings> }))
        console.log("✅ Settings โหลดสำเร็จ:", data)
      } else {
        // Create default settings if not exists
        console.log("⚠️ ไม่พบ Settings, กำลังสร้างค่าเริ่มต้น...")
        const defaultSettings: SiteSettings = {
          websiteName: "เว็บไซต์ของฉัน",
          backgroundColor: "#1a0170",
          textColor: "#ffffff",
          themeAccentColor: "#ff00ff",
          backgroundImageUrl: "",
          logoImageUrl: "",
          webhookUrl: "",
          deliveryWebhookUrl: "",
          reportWebhookUrl: "",
          fineWebhookUrl: "",
          leaveTypes: ["ลาป่วย", "ลากิจ", "ลาพักร้อน", "ลาคลอด"],
          deliveryTypes: ["ส่งเงิน", "ส่งของ", "ส่งเอกสาร", "ส่งพัสดุ"],
          fineList: [
            { name: "วิ่งแก้บน", amount: 500 },
            { name: "ขาดประชุม", amount: 1000 }
          ]
        }
        
        await setDoc(settingsRef, defaultSettings)
        setSiteSettings(defaultSettings)
        console.log("✅ สร้าง Settings เริ่มต้นสำเร็จ!")
      }
    } catch (error) {
      console.error("❌ Error loading settings:", error)
    }
  }

  const saveSettings = async () => {
    try {
      console.log("💾 กำลังบันทึก Settings...")
      console.log("   - Path:", `cloned_sites/${params.id}/settings/site_settings`)
      console.log("   - Data:", siteSettings)
      console.log("   - leaveTypes:", siteSettings.leaveTypes)
      console.log("   - deliveryTypes:", siteSettings.deliveryTypes)
      
      // ใช้ API route แทนการเรียก Firestore โดยตรง
      const { savePreviewSettingsWithRetry } = await import('@/lib/api-retry')
      const result = await savePreviewSettingsWithRetry(params.id, siteSettings)
      
      if (result.success) {
        console.log("✅ บันทึก Settings สำเร็จ!")
        setMessage({ type: 'success', text: result.message || 'บันทึกการตั้งค่าสำเร็จ' })
      } else {
        throw new Error(result.error || 'Unknown error')
      }
    } catch (error) {
      console.error("❌ Error saving settings:", error)
      setMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการบันทึก' })
    }
  }

  const loadUsers = async () => {
    try {
      const usersRef = collection(firestore, `cloned_sites/${params.id}/users`)
      const snapshot = await getDocs(usersRef)
      const usersList: User[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        usersList.push({
          id: doc.id,
          username: data.username || "",
          email: data.email || "",
          role: data.role || "member",
          createdAt: data.createdAt
        })
      })
      setUsers(usersList)
    } catch (error) {
      console.error("Error loading users:", error)
    }
  }

  const loadLeaveRequests = async () => {
    try {
      console.log("📥 กำลังโหลด Leave Requests จาก:", `cloned_sites/${params.id}/leave_requests`)
      const leavesRef = collection(firestore, `cloned_sites/${params.id}/leave_requests`)
      const snapshot = await getDocs(leavesRef)
      console.log("📊 พบ Leave Requests:", snapshot.size, "รายการ")
      
      const leavesList: LeaveRequest[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        console.log("  - Document:", doc.id, data)
        leavesList.push({
          id: doc.id,
          username: data.username || "",
          userId: data.userId || "",
          leaveTypes: data.leaveTypes || [],
          startDate: data.startDate || "",
          endDate: data.endDate || "",
          reason: data.reason || "",
          status: data.status || "pending",
          createdAt: data.createdAt
        })
      })
      leavesList.sort((a, b) => {
        const timeA = a.createdAt?.toDate?.() || new Date(0)
        const timeB = b.createdAt?.toDate?.() || new Date(0)
        return timeB.getTime() - timeA.getTime()
      })
      setLeaveRequests(leavesList)
      console.log("✅ Leave Requests โหลดเสร็จ, แสดง:", leavesList.length, "รายการ")
    } catch (error) {
      console.error("❌ Error loading leave requests:", error)
    }
  }

  const loadFineRecords = async () => {
    try {
      const finesRef = collection(firestore, `cloned_sites/${params.id}/fine_records`)
      const snapshot = await getDocs(finesRef)
      const finesList: FineRecord[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        finesList.push({
          id: doc.id,
          memberName: data.memberName || "",
          fineItem: data.fineItem || "",
          amount: data.amount || 0,
          reason: data.reason || "",
          status: data.status || "ยังไม่ชำระ",
          staffUser: data.staffUser || "System",
          timestamp: data.timestamp || data.createdAt
        })
      })
      finesList.sort((a, b) => {
        const timeA = a.timestamp?.toDate?.() || new Date(0)
        const timeB = b.timestamp?.toDate?.() || new Date(0)
        return timeB.getTime() - timeA.getTime()
      })
      setFineRecords(finesList)
    } catch (error) {
      console.error("Error loading fine records:", error)
    }
  }

  const loadDeliveryRecords = async () => {
    try {
      console.log("📥 กำลังโหลด Delivery Records...")
      const deliveryRef = collection(firestore, `cloned_sites/${params.id}/delivery_records`)
      const snapshot = await getDocs(deliveryRef)
      console.log("📊 พบ Delivery Records:", snapshot.size, "รายการ")
      
      const deliveryList: DeliveryRecord[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        deliveryList.push({
          id: doc.id,
          username: data.username || "",
          deliveryType: data.deliveryType || "",
          deliveryDate: data.deliveryDate || "",
          screenshot: data.screenshot || "",
          createdAt: data.createdAt
        })
      })
      deliveryList.sort((a, b) => {
        const timeA = a.createdAt?.toDate?.() || new Date(0)
        const timeB = b.createdAt?.toDate?.() || new Date(0)
        return timeB.getTime() - timeA.getTime()
      })
      setDeliveryRecords(deliveryList)
      console.log("✅ Delivery Records โหลดเสร็จ, แสดง:", deliveryList.length, "รายการ")
    } catch (error) {
      console.error("❌ Error loading delivery records:", error)
    }
  }

  const loadReports = async () => {
    try {
      console.log("📥 กำลังโหลด Reports...")
      const reportsRef = collection(firestore, `cloned_sites/${params.id}/reports`)
      const snapshot = await getDocs(reportsRef)
      console.log("📊 พบ Reports:", snapshot.size, "รายการ")
      
      const reportsList: Report[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        reportsList.push({
          id: doc.id,
          username: data.username || "",
          subject: data.subject || "",
          details: data.details || "",
          createdAt: data.createdAt
        })
      })
      reportsList.sort((a, b) => {
        const timeA = a.createdAt?.toDate?.() || new Date(0)
        const timeB = b.createdAt?.toDate?.() || new Date(0)
        return timeB.getTime() - timeA.getTime()
      })
      setReports(reportsList)
      console.log("✅ Reports โหลดเสร็จ, แสดง:", reportsList.length, "รายการ")
    } catch (error) {
      console.error("❌ Error loading reports:", error)
    }
  }

  const loadStats = async () => {
    try {
      const usersSnapshot = await getDocs(collection(firestore, `cloned_sites/${params.id}/users`))
      const leavesSnapshot = await getDocs(collection(firestore, `cloned_sites/${params.id}/leave_requests`))
      const finesSnapshot = await getDocs(collection(firestore, `cloned_sites/${params.id}/fine_records`))
      const deliverySnapshot = await getDocs(collection(firestore, `cloned_sites/${params.id}/delivery_records`))
      const reportsSnapshot = await getDocs(collection(firestore, `cloned_sites/${params.id}/reports`))

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      let leavesToday = 0
      let pendingLeaves = 0
      leavesSnapshot.forEach((doc) => {
        const data = doc.data()
        const createdAt = data.createdAt?.toDate?.() || new Date(0)
        if (createdAt >= today) leavesToday++
        if (data.status === 'pending') pendingLeaves++
      })

      let totalFineAmount = 0
      let unpaidFineAmount = 0
      finesSnapshot.forEach((doc) => {
        const data = doc.data()
        totalFineAmount += data.amount || 0
        if (data.status !== 'ชำระแล้ว') {
          unpaidFineAmount += data.amount || 0
        }
      })

      setStats({
        totalUsers: usersSnapshot.size,
        leaveRequestsToday: leavesToday,
        pendingLeaveRequests: pendingLeaves,
        totalFines: totalFineAmount,
        unpaidFines: unpaidFineAmount,
        deliveryRecords: deliverySnapshot.size,
        reports: reportsSnapshot.size
      })
    } catch (error) {
      console.error("Error loading stats:", error)
    }
  }

  const handleLogout = () => {
    logout()
    router.push(`/preview/${params.id}/login`)
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    setMessage(null)
    try {
      await loadAllData()
      setMessage({ type: 'success', text: 'รีเฟรชข้อมูลสำเร็จ!' })
      setTimeout(() => setMessage(null), 2000)
    } catch (error) {
      console.error("Error refreshing data:", error)
      setMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการรีเฟรชข้อมูล' })
    } finally {
      setIsRefreshing(false)
    }
  }

  

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      await updateDoc(doc(firestore, `cloned_sites/${params.id}/users`, userId), {
        role: newRole
      })
      setMessage({ type: 'success', text: 'อัปเดต Role สำเร็จ' })
      await loadUsers()
    } catch (error) {
      console.error("Error updating role:", error)
      setMessage({ type: 'error', text: 'เกิดข้อผิดพลาด' })
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('ต้องการลบผู้ใช้นี้หรือไม่?')) return
    
    try {
      await deleteDoc(doc(firestore, `cloned_sites/${params.id}/users`, userId))
      setMessage({ type: 'success', text: 'ลบผู้ใช้สำเร็จ' })
      await loadUsers()
      await loadStats()
    } catch (error) {
      console.error("Error deleting user:", error)
      setMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการลบผู้ใช้' })
    }
  }

  const handleApproveLeave = async (leaveId: string) => {
    try {
      await updateDoc(doc(firestore, `cloned_sites/${params.id}/leave_requests`, leaveId), {
        status: 'approved'
      })
      setMessage({ type: 'success', text: 'อนุมัติคำขอสำเร็จ' })
      await loadLeaveRequests()
      await loadStats()
    } catch (error) {
      console.error("Error approving leave:", error)
      setMessage({ type: 'error', text: 'เกิดข้อผิดพลาด' })
    }
  }

  const handleRejectLeave = async (leaveId: string) => {
    try {
      await updateDoc(doc(firestore, `cloned_sites/${params.id}/leave_requests`, leaveId), {
        status: 'rejected'
      })
      setMessage({ type: 'success', text: 'ปฏิเสธคำขอสำเร็จ' })
      await loadLeaveRequests()
      await loadStats()
    } catch (error) {
      console.error("Error rejecting leave:", error)
      setMessage({ type: 'error', text: 'เกิดข้อผิดพลาด' })
    }
  }

  const handleToggleFineStatus = async (fineId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ชำระแล้ว' ? 'ยังไม่ชำระ' : 'ชำระแล้ว'
    try {
      await updateDoc(doc(firestore, `cloned_sites/${params.id}/fine_records`, fineId), {
        status: newStatus
      })
      setMessage({ type: 'success', text: `เปลี่ยนสถานะเป็น ${newStatus}` })
      await loadFineRecords()
      await loadStats()
    } catch (error) {
      console.error("Error updating fine status:", error)
      setMessage({ type: 'error', text: 'เกิดข้อผิดพลาด' })
    }
  }

  const handleAddLeaveType = () => {
    if (!newLeaveType.trim()) return
    if (siteSettings.leaveTypes.includes(newLeaveType.trim())) {
      setMessage({ type: 'error', text: 'มีประเภทการลานี้อยู่แล้ว' })
      return
    }
    setSiteSettings(prev => ({
      ...prev,
      leaveTypes: [...prev.leaveTypes, newLeaveType.trim()]
    }))
    setNewLeaveType('')
  }

  const handleRemoveLeaveType = (type: string) => {
    setSiteSettings(prev => ({
      ...prev,
      leaveTypes: prev.leaveTypes.filter(t => t !== type)
    }))
  }

  const handleAddDeliveryType = () => {
    if (!newDeliveryType.trim()) return
    if (siteSettings.deliveryTypes.includes(newDeliveryType.trim())) {
      setMessage({ type: 'error', text: 'มีประเภทการส่งของนี้อยู่แล้ว' })
      return
    }
    setSiteSettings(prev => ({
      ...prev,
      deliveryTypes: [...prev.deliveryTypes, newDeliveryType.trim()]
    }))
    setNewDeliveryType('')
  }

  const handleRemoveDeliveryType = (type: string) => {
    setSiteSettings(prev => ({
      ...prev,
      deliveryTypes: prev.deliveryTypes.filter(t => t !== type)
    }))
  }

  const handleAddFine = () => {
    if (!newFine.name.trim() || newFine.amount <= 0) {
      setMessage({ type: 'error', text: 'กรุณากรอกข้อมูลให้ครบถ้วน' })
      return
    }
    setSiteSettings(prev => ({
      ...prev,
      fineList: [...prev.fineList, { name: newFine.name.trim(), amount: newFine.amount }]
    }))
    setNewFine({ name: '', amount: 0 })
  }

  const handleRemoveFine = (index: number) => {
    setSiteSettings(prev => ({
      ...prev,
      fineList: prev.fineList.filter((_, i) => i !== index)
    }))
  }

  const formatDate = (timestamp: any) => {
    try {
      const date = timestamp?.toDate?.() || new Date(timestamp || 0)
      return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return "N/A"
    }
  }

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-purple-950">
        <div className="text-white text-lg">กำลังโหลด...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-purple-950">
      {/* Header */}
      <header className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <ShieldCheck className="w-8 h-8 text-purple-400" />
              <h1 className="text-xl font-bold text-white">แผงควบคุมแอดมิน - {siteName}</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex flex-col items-end">
                <span className="text-gray-300">
                  <span className="font-bold text-purple-400">{user.username}</span>
                </span>
                <span className="text-xs text-gray-500">
                  อัปเดต: {lastRefresh.toLocaleTimeString('th-TH')}
                </span>
              </div>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-xl transition-all duration-300 border border-blue-500/30 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                รีเฟรช
              </button>
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
              <span>กลับหน้าหลัก</span>
            </Link>
            
            {['dashboard', 'settings', 'users', 'leaves', 'delivery', 'reports', 'fines'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                  activeTab === tab
                    ? 'text-white bg-purple-600/20 border border-purple-500/30'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                {tab === 'dashboard' && <BarChart3 className="w-5 h-5" />}
                {tab === 'settings' && <Settings className="w-5 h-5" />}
                {tab === 'users' && <Users className="w-5 h-5" />}
                {tab === 'leaves' && <FileText className="w-5 h-5" />}
                {tab === 'delivery' && <Truck className="w-5 h-5" />}
                {tab === 'reports' && <MessageSquare className="w-5 h-5" />}
                {tab === 'fines' && <DollarSign className="w-5 h-5" />}
                <span>
                  {tab === 'dashboard' && 'ภาพรวม'}
                  {tab === 'settings' && 'ตั้งค่าเว็บ'}
                  {tab === 'users' && 'จัดการผู้ใช้'}
                  {tab === 'leaves' && 'คำขอลา'}
                  {tab === 'delivery' && 'การส่งของ'}
                  {tab === 'reports' && 'รายงาน'}
                  {tab === 'fines' && 'ค่าปรับ'}
                </span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
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

            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-white mb-6">ภาพรวมระบบ</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border border-blue-500/30 rounded-xl p-6">
                    <Users className="w-8 h-8 text-blue-400 mb-2" />
                    <p className="text-sm text-blue-300">ผู้ใช้ทั้งหมด</p>
                    <p className="text-3xl font-bold text-white mt-2">{stats.totalUsers}</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 border border-green-500/30 rounded-xl p-6">
                    <FileText className="w-8 h-8 text-green-400 mb-2" />
                    <p className="text-sm text-green-300">คำขอลาวันนี้</p>
                    <p className="text-3xl font-bold text-white mt-2">{stats.leaveRequestsToday}</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 border border-yellow-500/30 rounded-xl p-6">
                    <FileText className="w-8 h-8 text-yellow-400 mb-2" />
                    <p className="text-sm text-yellow-300">คำขอรอตรวจสอบ</p>
                    <p className="text-3xl font-bold text-white mt-2">{stats.pendingLeaveRequests}</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-red-600/20 to-red-800/20 border border-red-500/30 rounded-xl p-6">
                    <DollarSign className="w-8 h-8 text-red-400 mb-2" />
                    <p className="text-sm text-red-300">ค่าปรับค้างชำระ</p>
                    <p className="text-3xl font-bold text-white mt-2">฿{stats.unpaidFines.toLocaleString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
                    <Truck className="w-8 h-8 text-purple-400 mb-2" />
                    <p className="text-sm text-gray-300">รายการส่งของ</p>
                    <p className="text-2xl font-bold text-white mt-2">{stats.deliveryRecords}</p>
                  </div>
                  
                  <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
                    <MessageSquare className="w-8 h-8 text-purple-400 mb-2" />
                    <p className="text-sm text-gray-300">รายงานทั้งหมด</p>
                    <p className="text-2xl font-bold text-white mt-2">{stats.reports}</p>
                  </div>
                  
                  <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
                    <DollarSign className="w-8 h-8 text-purple-400 mb-2" />
                    <p className="text-sm text-gray-300">ค่าปรับทั้งหมด</p>
                    <p className="text-2xl font-bold text-white mt-2">฿{stats.totalFines.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-white mb-6">ตั้งค่าหน้าเว็บ</h2>
                
                {/* Website Settings */}
                <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Palette className="w-5 h-5" />
                    การตั้งค่าพื้นฐาน
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">ชื่อเว็บไซต์</label>
                      <input
                        type="text"
                        value={siteSettings.websiteName}
                        onChange={(e) => setSiteSettings({ ...siteSettings, websiteName: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-800/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">URL รูปพื้นหลัง</label>
                      <input
                        type="text"
                        value={siteSettings.backgroundImageUrl}
                        onChange={(e) => setSiteSettings({ ...siteSettings, backgroundImageUrl: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-800/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">URL รูปโลโก้</label>
                      <input
                        type="text"
                        value={siteSettings.logoImageUrl}
                        onChange={(e) => setSiteSettings({ ...siteSettings, logoImageUrl: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-800/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">สีข้อความ</label>
                      <input
                        type="color"
                        value={siteSettings.textColor}
                        onChange={(e) => setSiteSettings({ ...siteSettings, textColor: e.target.value })}
                        className="w-full h-10 bg-gray-800/50 border border-gray-600 rounded-xl cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">สีพื้นหลัง</label>
                      <input
                        type="color"
                        value={siteSettings.backgroundColor}
                        onChange={(e) => setSiteSettings({ ...siteSettings, backgroundColor: e.target.value })}
                        className="w-full h-10 bg-gray-800/50 border border-gray-600 rounded-xl cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">สีธีมหลัก</label>
                      <input
                        type="color"
                        value={siteSettings.themeAccentColor}
                        onChange={(e) => setSiteSettings({ ...siteSettings, themeAccentColor: e.target.value })}
                        className="w-full h-10 bg-gray-800/50 border border-gray-600 rounded-xl cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Leave Types */}
                <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <List className="w-5 h-5" />
                    จัดการประเภทการลา
                  </h3>
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      value={newLeaveType}
                      onChange={(e) => setNewLeaveType(e.target.value)}
                      placeholder="เพิ่มประเภทการลาใหม่"
                      className="flex-1 px-4 py-2 bg-gray-800/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-purple-500"
                    />
                    <button
                      onClick={handleAddLeaveType}
                      className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-all flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      เพิ่ม
                    </button>
                  </div>
                  <div className="space-y-2">
                    {siteSettings.leaveTypes.map((type, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-800/30 p-3 rounded-xl">
                        <span className="text-white">{type}</span>
                        <button
                          onClick={() => handleRemoveLeaveType(type)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delivery Types */}
                <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Truck className="w-5 h-5" />
                    จัดการประเภทการส่งของ
                  </h3>
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      value={newDeliveryType}
                      onChange={(e) => setNewDeliveryType(e.target.value)}
                      placeholder="เพิ่มประเภทการส่งของใหม่"
                      className="flex-1 px-4 py-2 bg-gray-800/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-purple-500"
                    />
                    <button
                      onClick={handleAddDeliveryType}
                      className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-all flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      เพิ่ม
                    </button>
                  </div>
                  <div className="space-y-2">
                    {siteSettings.deliveryTypes.map((type, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-800/30 p-3 rounded-xl">
                        <span className="text-white">{type}</span>
                        <button
                          onClick={() => handleRemoveDeliveryType(type)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Fine List */}
                <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    จัดการรายการปรับ
                  </h3>
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      value={newFine.name}
                      onChange={(e) => setNewFine({ ...newFine, name: e.target.value })}
                      placeholder="ชื่อรายการปรับ"
                      className="flex-1 px-4 py-2 bg-gray-800/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-purple-500"
                    />
                    <input
                      type="number"
                      value={newFine.amount || ''}
                      onChange={(e) => setNewFine({ ...newFine, amount: parseInt(e.target.value) || 0 })}
                      placeholder="จำนวนเงิน"
                      className="w-32 px-4 py-2 bg-gray-800/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-purple-500"
                    />
                    <button
                      onClick={handleAddFine}
                      className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-all flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      เพิ่ม
                    </button>
                  </div>
                  <div className="space-y-2">
                    {siteSettings.fineList.map((fine, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-800/30 p-3 rounded-xl">
                        <span className="text-white">{fine.name} (฿{fine.amount.toLocaleString()})</span>
                        <button
                          onClick={() => handleRemoveFine(index)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Webhooks */}
                <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Webhook className="w-5 h-5" />
                    ตั้งค่า Webhook
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">Webhook URL คำขอลา</label>
                      <input
                        type="text"
                        value={siteSettings.webhookUrl}
                        onChange={(e) => setSiteSettings({ ...siteSettings, webhookUrl: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-800/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">Webhook URL การส่งของ</label>
                      <input
                        type="text"
                        value={siteSettings.deliveryWebhookUrl}
                        onChange={(e) => setSiteSettings({ ...siteSettings, deliveryWebhookUrl: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-800/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">Webhook URL การรายงาน</label>
                      <input
                        type="text"
                        value={siteSettings.reportWebhookUrl}
                        onChange={(e) => setSiteSettings({ ...siteSettings, reportWebhookUrl: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-800/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">Webhook URL การแจ้งปรับ</label>
                      <input
                        type="text"
                        value={siteSettings.fineWebhookUrl}
                        onChange={(e) => setSiteSettings({ ...siteSettings, fineWebhookUrl: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-800/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={saveSettings}
                  className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  บันทึกการตั้งค่าทั้งหมด
                </button>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-white mb-6">จัดการผู้ใช้งาน</h2>
                
            

                {/* Users List */}
                <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">ผู้ใช้ทั้งหมด ({users.length})</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-800/50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">Username</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">Email</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">Role</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">วันที่สมัคร</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">จัดการ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700/30">
                        {users.map((u) => (
                          <tr key={u.id} className="hover:bg-gray-800/30 transition-colors">
                            <td className="px-6 py-4 text-sm text-white">{u.username}</td>
                            <td className="px-6 py-4 text-sm text-gray-300">{u.email}</td>
                            <td className="px-6 py-4">
                              <select
                                value={u.role}
                                onChange={(e) => handleUpdateUserRole(u.id, e.target.value)}
                                className="px-3 py-1 bg-gray-800 border border-gray-600 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500"
                              >
                                <option value="member">Member</option>
                                <option value="admin">Admin</option>
                              </select>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-400">{formatDate(u.createdAt)}</td>
                            <td className="px-6 py-4">
                              <button
                                onClick={() => handleDeleteUser(u.id)}
                                disabled={u.id === user.id}
                                className="flex items-center gap-1 px-3 py-1 bg-red-600/20 text-red-400 rounded-xl hover:bg-red-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                              >
                                <Trash2 className="w-3 h-3" />
                                ลบ
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Leave Requests Tab */}
            {activeTab === 'leaves' && (
              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-white mb-6">คำขอลา ({leaveRequests.length})</h2>
                
                <div className="space-y-4">
                  {leaveRequests.map((leave) => (
                    <div key={leave.id} className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-white">{leave.username}</h3>
                          <p className="text-sm text-gray-400">{formatDate(leave.createdAt)}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          leave.status === 'approved' 
                            ? 'bg-green-600/20 text-green-400 border border-green-500/30'
                            : leave.status === 'rejected'
                            ? 'bg-red-600/20 text-red-400 border border-red-500/30'
                            : 'bg-yellow-600/20 text-yellow-400 border border-yellow-500/30'
                        }`}>
                          {leave.status === 'approved' ? 'อนุมัติ' : leave.status === 'rejected' ? 'ปฏิเสธ' : 'รอตรวจสอบ'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-400">ประเภท</p>
                          <p className="text-sm text-white">{leave.leaveTypes.join(', ')}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">ระยะเวลา</p>
                          <p className="text-sm text-white">{leave.startDate} - {leave.endDate}</p>
                        </div>
                      </div>
                      <div className="mb-4">
                        <p className="text-xs text-gray-400">เหตุผล</p>
                        <p className="text-sm text-gray-300">{leave.reason}</p>
                      </div>
                      {leave.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApproveLeave(leave.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600/20 text-green-400 rounded-xl hover:bg-green-600/30 transition-all border border-green-500/30"
                          >
                            <Check className="w-4 h-4" />
                            อนุมัติ
                          </button>
                          <button
                            onClick={() => handleRejectLeave(leave.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600/20 text-red-400 rounded-xl hover:bg-red-600/30 transition-all border border-red-500/30"
                          >
                            <X className="w-4 h-4" />
                            ปฏิเสธ
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {leaveRequests.length === 0 && (
                    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-12 text-center">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400">ไม่มีคำขอลา</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Delivery Tab */}
            {activeTab === 'delivery' && (
              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-white mb-6">ประวัติการส่งของ ({deliveryRecords.length})</h2>
                
                <div className="space-y-4">
                  {deliveryRecords.map((delivery) => (
                    <div key={delivery.id} className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
                      <h3 className="text-lg font-bold text-white mb-2">{delivery.username}</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-400">ประเภท</p>
                          <p className="text-sm text-white">{delivery.deliveryType}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">วันที่ส่ง</p>
                          <p className="text-sm text-white">{delivery.deliveryDate}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-xs text-gray-400">บันทึกเมื่อ</p>
                          <p className="text-sm text-gray-300">{formatDate(delivery.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {deliveryRecords.length === 0 && (
                    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-12 text-center">
                      <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400">ไม่มีประวัติการส่งของ</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && (
              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-white mb-6">ประวัติการรายงาน ({reports.length})</h2>
                
                <div className="space-y-4">
                  {reports.map((report) => (
                    <div key={report.id} className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
                      <h3 className="text-lg font-bold text-white mb-2">{report.username}</h3>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-gray-400">หัวข้อ</p>
                          <p className="text-sm text-white">{report.subject}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">รายละเอียด</p>
                          <p className="text-sm text-gray-300">{report.details}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">บันทึกเมื่อ</p>
                          <p className="text-sm text-gray-400">{formatDate(report.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {reports.length === 0 && (
                    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-12 text-center">
                      <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400">ไม่มีประวัติการรายงาน</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Fines Tab */}
            {activeTab === 'fines' && (
              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-white mb-6">ประวัติการปรับ ({fineRecords.length})</h2>
                
                <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-800/50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">สมาชิก</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">รายการ</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">จำนวน</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">เหตุผล</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">สถานะ</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">วันที่</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">จัดการ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700/30">
                        {fineRecords.map((fine) => (
                          <tr key={fine.id} className="hover:bg-gray-800/30 transition-colors">
                            <td className="px-6 py-4 text-sm text-white">{fine.memberName}</td>
                            <td className="px-6 py-4 text-sm text-gray-300">{fine.fineItem}</td>
                            <td className="px-6 py-4 text-sm font-semibold text-red-400">฿{fine.amount.toLocaleString()}</td>
                            <td className="px-6 py-4 text-sm text-gray-400">{fine.reason || '-'}</td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                fine.status === 'ชำระแล้ว'
                                  ? 'bg-green-600/20 text-green-400 border border-green-500/30'
                                  : 'bg-red-600/20 text-red-400 border border-red-500/30'
                              }`}>
                                {fine.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-400">{formatDate(fine.timestamp)}</td>
                            <td className="px-6 py-4">
                              <button
                                onClick={() => handleToggleFineStatus(fine.id, fine.status)}
                                className={`px-3 py-1 rounded-xl text-xs font-medium transition-all ${
                                  fine.status === 'ชำระแล้ว'
                                    ? 'bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600/30 border border-yellow-500/30'
                                    : 'bg-green-600/20 text-green-400 hover:bg-green-600/30 border border-green-500/30'
                                }`}
                              >
                                {fine.status === 'ชำระแล้ว' ? 'ยกเลิกชำระ' : 'ชำระแล้ว'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {fineRecords.length === 0 && (
                    <div className="p-12 text-center">
                      <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400">ไม่มีรายการค่าปรับ</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default function ClonedSiteAdminPage() {
  return (
    <ClonedSiteAuthProvider>
      <ClonedSiteAdmin />
    </ClonedSiteAuthProvider>
  )
}
