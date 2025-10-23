"use client"
import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { ClonedSiteAuthProvider, useClonedSiteAuth } from "@/contexts/cloned-site-auth-context"
import Link from "next/link"
import { 
  Home, FileText, Truck, MessageSquare, Settings, LogOut, Users, 
  ShieldCheck, BarChart3, UserPlus, Trash2, Check, X, Edit2, Plus,
  Save, Palette, List, DollarSign, Shield, Building, Swords, Webhook, RefreshCw
} from "lucide-react"
import { SiteLogo } from "@/components/cloned-site-layout"
import { 
  collection, getDocs, doc, updateDoc, deleteDoc, addDoc, 
  serverTimestamp, query, where, Timestamp, getDoc, setDoc, onSnapshot, orderBy, limit
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

interface InviteCode {
  id: string
  code: string
  maxUses: number
  usedCount: number
  expiresAt: any
  createdBy: string
  createdAt: any
  isActive: boolean
}

interface ActivityLog {
  id: string
  userId: string
  username: string
  userRole: string
  houseName?: string
  action: string
  details: string
  ipAddress: string
  timestamp: any
  siteSlug: string
}

interface User {
  id: string
  username: string
  email: string
  role: string
  houseName?: string
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
  const params = useParams<{ slug: string }>()
  const router = useRouter()
  const { user, logout, checkSession } = useClonedSiteAuth()
  const [siteName, setSiteName] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [activeTab, setActiveTab] = useState<'dashboard' | 'settings' | 'users' | 'leaves' | 'delivery' | 'reports' | 'fines' | 'invites' | 'staff-reports' | 'fine-items' | 'logs' | 'leave-types' | 'delivery-types'>('dashboard')
  
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
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([])
  const [staffReports, setStaffReports] = useState<any[]>([])
  const [fineItems, setFineItems] = useState<any[]>([])
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Form states
  
  const [newLeaveType, setNewLeaveType] = useState('')
  const [newDeliveryType, setNewDeliveryType] = useState('')
  const [newInviteCode, setNewInviteCode] = useState({ 
    code: '', 
    maxUses: 1, 
    expiresInDays: 7 
  })
  const [newFine, setNewFine] = useState({ name: '', amount: 0 })
  const [newFineItem, setNewFineItem] = useState({ name: '', amount: 0, description: '' })
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editingHouseName, setEditingHouseName] = useState<{ [key: string]: string | undefined }>({})
  const houseSaveTimers = useRef<{ [key: string]: any }>({})
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [logFilter, setLogFilter] = useState<'all' | 'admin' | 'staff' | 'member'>('all')
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; itemId: string; itemName: string; itemType: string }>({
    show: false,
    itemId: '',
    itemName: '',
    itemType: ''
  })

  useEffect(() => {
    const checkAuth = async () => {
      console.log('[ADMIN] Starting auth check for slug:', params.slug)
      const sessionUser = await checkSession(params.slug)
      console.log('[ADMIN] Session user:', sessionUser)
      
      if (!sessionUser) {
        console.log('[ADMIN] No session found, redirecting to login')
        router.push(`/${params.slug}/login`)
        return
      }
      
      console.log('[ADMIN] User role:', sessionUser.role)
      if (sessionUser.role !== 'admin') {
        console.log('[ADMIN] User is not admin, redirecting to dashboard')
        alert('คุณไม่มีสิทธิ์เข้าถึงหน้านี้ (role: ' + sessionUser.role + ')')
        router.push(`/${params.slug}/dashboard`)
        return
      }
      
      console.log('[ADMIN] Auth passed, loading data...')
      await loadAllData()
      setIsLoading(false)
    }
    checkAuth()
  }, [params.slug, checkSession, router])

  // Real-time listeners for data changes
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      console.log("⏸️ Real-time listeners ยังไม่เริ่ม (รอ user หรือไม่ใช่ admin)")
      return
    }

    console.log("🎧 เริ่ม Real-time listeners สำหรับ site:", params.slug)
    const unsubscribers: (() => void)[] = []

    // Listen to users changes
    const usersUnsubscribe = onSnapshot(
      collection(firestore, `cloned_sites/${params.slug}/users`),
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
      collection(firestore, `cloned_sites/${params.slug}/leave_requests`),
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
      collection(firestore, `cloned_sites/${params.slug}/fine_records`),
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
      collection(firestore, `cloned_sites/${params.slug}/delivery_records`),
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
      collection(firestore, `cloned_sites/${params.slug}/reports`),
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
      doc(firestore, `cloned_sites/${params.slug}/settings`, 'site_settings'),
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
  }, [params.slug, user])

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

  const loadAllData = async () => {
    await Promise.all([
      loadSettings(),
      loadUsers(),
      loadLeaveRequests(),
      loadFineRecords(),
      loadDeliveryRecords(),
      loadReports(),
      loadInviteCodes(),
      loadStaffReports(),
      loadFineItems(),
      loadStats(),
      loadActivityLogs()
    ])
  }

  const loadSettings = async () => {
    try {
      const { loadSiteDataWithRetry } = await import('@/lib/api-retry')
      const result = await loadSiteDataWithRetry(params.slug, 'settings')
      
      if (result.success && result.data.settings) {
        setSiteSettings(prev => ({ ...prev, ...result.data.settings as Partial<SiteSettings> }))
        console.log("✅ Settings โหลดสำเร็จ:", result.data.settings)
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
        
        // ใช้ API route สำหรับบันทึก settings เริ่มต้น
        const { saveSiteSettingsWithRetry } = await import('@/lib/api-retry')
        await saveSiteSettingsWithRetry(params.slug, defaultSettings)
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
      console.log("   - Path:", `cloned_sites/${params.slug}/settings/site_settings`)
      console.log("   - Data:", siteSettings)
      console.log("   - leaveTypes:", siteSettings.leaveTypes)
      console.log("   - deliveryTypes:", siteSettings.deliveryTypes)
      
      // ใช้ API route แทนการเรียก Firestore โดยตรง
      const { saveSiteSettingsWithRetry } = await import('@/lib/api-retry')
      const result = await saveSiteSettingsWithRetry(params.slug, siteSettings)
      
      if (result.success) {
        console.log("✅ บันทึก Settings สำเร็จ!")
        setMessage({ type: 'success', text: result.message || 'บันทึกการตั้งค่าสำเร็จ' })
        
        // อัปเดต siteName ใน state
        if (result.data?.websiteName) {
          setSiteName(result.data.websiteName)
        }
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
      const { loadSiteDataWithRetry } = await import('@/lib/api-retry')
      const result = await loadSiteDataWithRetry(params.slug, 'users')
      
      if (result.success && result.data.users) {
        setUsers(result.data.users)
        console.log("✅ Users โหลดสำเร็จ:", result.data.users.length, "users")
      }
    } catch (error) {
      console.error("Error loading users:", error)
    }
  }

  const loadLeaveRequests = async () => {
    try {
      console.log("📥 กำลังโหลด Leave Requests จาก:", `cloned_sites/${params.slug}/leave_requests`)
      const { loadSiteDataWithRetry } = await import('@/lib/api-retry')
      const result = await loadSiteDataWithRetry(params.slug, 'leave_requests')
      
      if (result.success && result.data.leaveRequests) {
        const leavesList = result.data.leaveRequests
        console.log("📊 พบ Leave Requests:", leavesList.length, "รายการ")
        
        // Sort by createdAt (newest first)
        leavesList.sort((a: any, b: any) => {
          const timeA = a.createdAt?.toDate?.() || new Date(0)
          const timeB = b.createdAt?.toDate?.() || new Date(0)
          return timeB.getTime() - timeA.getTime()
        })
        
        setLeaveRequests(leavesList)
        console.log("✅ Leave Requests โหลดเสร็จ, แสดง:", leavesList.length, "รายการ")
      }
    } catch (error) {
      console.error("❌ Error loading leave requests:", error)
    }
  }

  const loadFineRecords = async () => {
    try {
      const finesRef = collection(firestore, `cloned_sites/${params.slug}/fine_records`)
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
      const deliveryRef = collection(firestore, `cloned_sites/${params.slug}/delivery_records`)
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
      const reportsRef = collection(firestore, `cloned_sites/${params.slug}/reports`)
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

  const loadInviteCodes = async () => {
    try {
      console.log("📥 กำลังโหลด Invite Codes...")
      const inviteCodesRef = collection(firestore, `cloned_sites/${params.slug}/invite_codes`)
      const snapshot = await getDocs(inviteCodesRef)
      console.log("📊 พบ Invite Codes:", snapshot.size, "รายการ")
      
      const inviteCodesList: InviteCode[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        inviteCodesList.push({
          id: doc.id,
          code: data.code || "",
          maxUses: data.maxUses || 1,
          usedCount: data.usedCount || 0,
          expiresAt: data.expiresAt,
          createdBy: data.createdBy || "",
          createdAt: data.createdAt,
          isActive: data.isActive !== false
        })
      })
      inviteCodesList.sort((a, b) => {
        const timeA = a.createdAt?.toDate?.() || new Date(0)
        const timeB = b.createdAt?.toDate?.() || new Date(0)
        return timeB.getTime() - timeA.getTime()
      })
      setInviteCodes(inviteCodesList)
      console.log("✅ Invite Codes โหลดเสร็จ, แสดง:", inviteCodesList.length, "รายการ")
    } catch (error) {
      console.error("❌ Error loading invite codes:", error)
    }
  }

  const loadStaffReports = async () => {
    try {
      console.log("📥 กำลังโหลด Staff Reports...")
      const reportsRef = collection(firestore, `cloned_sites/${params.slug}/reports`)
      const q = query(reportsRef, orderBy('createdAt', 'desc'), limit(50))
      const snapshot = await getDocs(q)
      console.log("📊 พบ Staff Reports:", snapshot.size, "รายการ")
      
      const reportsList: any[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        reportsList.push({
          id: doc.id,
          title: data.title || "",
          category: data.category || "",
          description: data.description || "",
          priority: data.priority || "medium",
          targetMember: data.targetMember || null,
          reporterName: data.reporterName || "",
          status: data.status || "pending",
          createdAt: data.createdAt,
          timestamp: data.timestamp || 0,
          attachments: data.attachments || []
        })
      })
      setStaffReports(reportsList)
      console.log("✅ Staff Reports โหลดเสร็จ, แสดง:", reportsList.length, "รายการ")
    } catch (error) {
      console.error("❌ Error loading staff reports:", error)
    }
  }

  const loadFineItems = async () => {
    try {
      console.log("📥 กำลังโหลด Fine Items...")
      const fineItemsRef = collection(firestore, `cloned_sites/${params.slug}/fine_items`)
      const q = query(fineItemsRef, orderBy('createdAt', 'desc'))
      const snapshot = await getDocs(q)
      console.log("📊 พบ Fine Items:", snapshot.size, "รายการ")
      
      const itemsList: any[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        itemsList.push({
          id: doc.id,
          name: data.name || "",
          amount: data.amount || 0,
          description: data.description || "",
          isActive: data.isActive !== false,
          createdAt: data.createdAt
        })
      })
      setFineItems(itemsList)
      console.log("✅ Fine Items โหลดเสร็จ, แสดง:", itemsList.length, "รายการ")
    } catch (error) {
      console.error("❌ Error loading fine items:", error)
    }
  }

  const loadStats = async () => {
    try {
      const usersSnapshot = await getDocs(collection(firestore, `cloned_sites/${params.slug}/users`))
      const leavesSnapshot = await getDocs(collection(firestore, `cloned_sites/${params.slug}/leave_requests`))
      const finesSnapshot = await getDocs(collection(firestore, `cloned_sites/${params.slug}/fine_records`))
      const deliverySnapshot = await getDocs(collection(firestore, `cloned_sites/${params.slug}/delivery_records`))
      const reportsSnapshot = await getDocs(collection(firestore, `cloned_sites/${params.slug}/reports`))

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
    router.push(`/${params.slug}/login`)
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
      const { updateSiteDataWithRetry } = await import('@/lib/api-retry')
      const result = await updateSiteDataWithRetry(params.slug, 'updateUserRole', { 
        userId, 
        newRole 
      })
      
      if (result.success) {
        setMessage({ type: 'success', text: result.message })
        await loadUsers()
      } else {
        throw new Error(result.error || 'Unknown error')
      }
    } catch (error) {
      console.error("Error updating role:", error)
      setMessage({ type: 'error', text: 'เกิดข้อผิดพลาด' })
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('ต้องการลบผู้ใช้นี้หรือไม่?')) return
    
    try {
      const { updateSiteDataWithRetry } = await import('@/lib/api-retry')
      const result = await updateSiteDataWithRetry(params.slug, 'deleteUser', { userId })
      
      if (result.success) {
        setMessage({ type: 'success', text: result.message })
        await loadUsers()
        await loadStats()
      } else {
        throw new Error(result.error || 'Unknown error')
      }
    } catch (error) {
      console.error("Error deleting user:", error)
      setMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการลบผู้ใช้' })
    }
  }

  const handleApproveLeave = async (leaveId: string) => {
    try {
      const { updateSiteDataWithRetry } = await import('@/lib/api-retry')
      const result = await updateSiteDataWithRetry(params.slug, 'approveLeave', { leaveId })
      
      if (result.success) {
        setMessage({ type: 'success', text: result.message })
        await loadLeaveRequests()
        await loadStats()
      } else {
        throw new Error(result.error || 'Unknown error')
      }
    } catch (error) {
      console.error("Error approving leave:", error)
      setMessage({ type: 'error', text: 'เกิดข้อผิดพลาด' })
    }
  }

  const handleRejectLeave = async (leaveId: string) => {
    try {
      const { updateSiteDataWithRetry } = await import('@/lib/api-retry')
      const result = await updateSiteDataWithRetry(params.slug, 'rejectLeave', { leaveId })
      
      if (result.success) {
        setMessage({ type: 'success', text: result.message })
        await loadLeaveRequests()
        await loadStats()
      } else {
        throw new Error(result.error || 'Unknown error')
      }
    } catch (error) {
      console.error("Error rejecting leave:", error)
      setMessage({ type: 'error', text: 'เกิดข้อผิดพลาด' })
    }
  }

  const handleToggleFineStatus = async (fineId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ชำระแล้ว' ? 'ยังไม่ชำระ' : 'ชำระแล้ว'
    try {
      const { updateSiteDataWithRetry } = await import('@/lib/api-retry')
      const result = await updateSiteDataWithRetry(params.slug, 'toggleFineStatus', { 
        fineId, 
        newStatus 
      })
      
      if (result.success) {
        setMessage({ type: 'success', text: result.message })
        await loadFineRecords()
        await loadStats()
      } else {
        throw new Error(result.error || 'Unknown error')
      }
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

  const generateInviteCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  const handleCreateInviteCode = async () => {
    try {
      if (!newInviteCode.code.trim()) {
        setMessage({ type: 'error', text: 'กรุณากรอกรหัสเชิญ' })
        return
      }

      // ตรวจสอบว่ารหัสเชิญซ้ำหรือไม่
      const existingCode = inviteCodes.find(code => code.code === newInviteCode.code.trim())
      if (existingCode) {
        setMessage({ type: 'error', text: 'รหัสเชิญนี้มีอยู่แล้ว' })
        return
      }

      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + newInviteCode.expiresInDays)

      await addDoc(collection(firestore, `cloned_sites/${params.slug}/invite_codes`), {
        code: newInviteCode.code.trim(),
        maxUses: newInviteCode.maxUses,
        usedCount: 0,
        expiresAt: expiresAt,
        createdBy: user?.username || 'admin',
        createdAt: serverTimestamp(),
        isActive: true
      })

      setMessage({ type: 'success', text: 'สร้างรหัสเชิญสำเร็จ' })
      setNewInviteCode({ code: '', maxUses: 1, expiresInDays: 7 })
      await loadInviteCodes()
    } catch (error) {
      console.error("Error creating invite code:", error)
      setMessage({ type: 'error', text: 'เกิดข้อผิดพลาด' })
    }
  }

  const handleToggleInviteCode = async (inviteId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(firestore, `cloned_sites/${params.slug}/invite_codes`, inviteId), {
        isActive: !currentStatus
      })
      setMessage({ type: 'success', text: `เปลี่ยนสถานะรหัสเชิญเป็น ${!currentStatus ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}` })
      await loadInviteCodes()
    } catch (error) {
      console.error("Error toggling invite code:", error)
      setMessage({ type: 'error', text: 'เกิดข้อผิดพลาด' })
    }
  }

  const handleDeleteInviteCode = async (inviteId: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบรหัสเชิญนี้?')) return
    
    try {
      await deleteDoc(doc(firestore, `cloned_sites/${params.slug}/invite_codes`, inviteId))
      setMessage({ type: 'success', text: 'ลบรหัสเชิญสำเร็จ' })
      await loadInviteCodes()
    } catch (error) {
      console.error("Error deleting invite code:", error)
      setMessage({ type: 'error', text: 'เกิดข้อผิดพลาด' })
    }
  }

  const handleAddFineItem = async () => {
    try {
      if (!newFineItem.name || newFineItem.amount <= 0) {
        setMessage({ type: 'error', text: 'กรุณากรอกข้อมูลให้ครบถ้วน' })
        return
      }

      const fineItemData = {
        name: newFineItem.name,
        amount: newFineItem.amount,
        description: newFineItem.description || "",
        isActive: true,
        createdAt: new Date()
      }

      const fineItemsRef = collection(firestore, `cloned_sites/${params.slug}/fine_items`)
      await addDoc(fineItemsRef, fineItemData)
      
      setMessage({ type: 'success', text: 'เพิ่มรายการปรับสำเร็จ' })
      setNewFineItem({ name: '', amount: 0, description: '' })
      await loadFineItems()
    } catch (error) {
      console.error("Error adding fine item:", error)
      setMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการเพิ่มรายการปรับ' })
    }
  }

  const handleToggleFineItem = async (itemId: string, isActive: boolean) => {
    try {
      const itemRef = doc(firestore, `cloned_sites/${params.slug}/fine_items`, itemId)
      await updateDoc(itemRef, { isActive: !isActive })
      setMessage({ type: 'success', text: isActive ? 'ปิดใช้งานรายการปรับสำเร็จ' : 'เปิดใช้งานรายการปรับสำเร็จ' })
      await loadFineItems()
    } catch (error) {
      console.error("Error toggling fine item:", error)
      setMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะรายการปรับ' })
    }
  }

  const handleDeleteFineItem = async (itemId: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบรายการปรับนี้?')) return
    
    try {
      const itemRef = doc(firestore, `cloned_sites/${params.slug}/fine_items`, itemId)
      await deleteDoc(itemRef)
      setMessage({ type: 'success', text: 'ลบรายการปรับสำเร็จ' })
      await loadFineItems()
    } catch (error) {
      console.error("Error deleting fine item:", error)
      setMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการลบรายการปรับ' })
    }
  }

  const handleUpdateHouseName = async (userId: string, newHouseName: string) => {
    try {
      const userRef = doc(firestore, `cloned_sites/${params.slug}/users`, userId)
      await updateDoc(userRef, { houseName: newHouseName })
      
      // Update local state immediately
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { ...user, houseName: newHouseName }
            : user
        )
      )
      
      // Log admin action
      const currentUserId = user?.id || ''
      const currentUsername = user?.username || ''
      const currentRole = user?.role || 'admin'
      const currentHouse = (user as any)?.houseName as string | undefined
      await logActivity(currentUserId, currentUsername, currentRole, currentHouse || '', 'update_house_name', `แก้ไขบ้าน/กลุ่มของ ${users.find(u => u.id === userId)?.username} เป็น "${newHouseName}"`)
      
      // Force refresh the user's session to update their houseName
      if (userId === user?.id) {
        await checkSession(params.slug)
      }
      
      setMessage({ type: 'success', text: 'อัปเดตบ้าน/กลุ่มสำเร็จ' })
    } catch (error) {
      console.error("Error updating house name:", error)
      setMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการอัปเดตบ้าน/กลุ่ม' })
    }
  }

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

  const loadActivityLogs = async () => {
    try {
      const logsRef = collection(firestore, `cloned_sites/${params.slug}/activity_logs`)
      const logsQuery = query(logsRef, orderBy('timestamp', 'desc'), limit(100))
      const logsSnapshot = await getDocs(logsQuery)
      
      const logs: ActivityLog[] = []
      logsSnapshot.forEach((doc) => {
        logs.push({
          id: doc.id,
          ...doc.data()
        } as ActivityLog)
      })
      
      setActivityLogs(logs)
    } catch (error) {
      console.error("Error loading activity logs:", error)
    }
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
    <div 
      data-cloned-site="true"
      className="min-h-screen"
      style={{
        background: siteSettings.backgroundImageUrl 
          ? `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(${siteSettings.backgroundImageUrl}) center/cover fixed`
          : `linear-gradient(to bottom right, ${siteSettings.backgroundColor || '#000000'}, #1f2937, #581c87)`,
        // @ts-ignore - CSS variables
        '--text-color': siteSettings.textColor || '#ffffff',
        '--theme-color': siteSettings.themeAccentColor || '#a855f7',
        '--bg-color': siteSettings.backgroundColor || '#1a1a2e',
        color: siteSettings.textColor || '#ffffff'
      }}
    >
      {/* Header */}
      <header className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <SiteLogo slug={params.slug} className="w-10 h-10" />
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
              href={`/${params.slug}/dashboard`}
              className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-xl transition-all duration-300"
            >
              <Home className="w-5 h-5" />
              <span>กลับหน้าหลัก</span>
            </Link>
            
            {['dashboard', 'settings', 'leave-types', 'delivery-types', 'users', 'leaves', 'delivery', 'reports', 'fines', 'invites', 'staff-reports', 'fine-items', 'logs'].map((tab) => (
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
                {tab === 'leave-types' && <List className="w-5 h-5" />}
                {tab === 'delivery-types' && <Truck className="w-5 h-5" />}
                {tab === 'users' && <Users className="w-5 h-5" />}
                {tab === 'leaves' && <FileText className="w-5 h-5" />}
                {tab === 'delivery' && <Truck className="w-5 h-5" />}
                {tab === 'reports' && <MessageSquare className="w-5 h-5" />}
                {tab === 'fines' && <DollarSign className="w-5 h-5" />}
                {tab === 'invites' && <UserPlus className="w-5 h-5" />}
                {tab === 'staff-reports' && <MessageSquare className="w-5 h-5" />}
                {tab === 'fine-items' && <DollarSign className="w-5 h-5" />}
                <span>
                  {tab === 'dashboard' && 'ภาพรวม'}
                  {tab === 'settings' && 'ตั้งค่าเว็บ'}
                  {tab === 'leave-types' && 'จัดการประเภทลา'}
                  {tab === 'delivery-types' && 'จัดการประเภทการส่งของ'}
                  {tab === 'users' && 'จัดการผู้ใช้'}
                  {tab === 'leaves' && 'คำขอลา'}
                  {tab === 'delivery' && 'การส่งของ'}
                  {tab === 'reports' && 'รายงาน'}
                  {tab === 'fines' && 'ค่าปรับ'}
                  {tab === 'invites' && 'รหัสเชิญ'}
                  {tab === 'staff-reports' && 'รายงาน Staff'}
                  {tab === 'fine-items' && 'รายการปรับ'}
                  {tab === 'logs' && 'Log ระบบ'}
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

                {/* Role Statistics */}
                <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">สถิติผู้ใช้งานตาม Role</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-400 mb-2">
                        {users.filter(u => u.role === 'member').length}
                      </div>
                      <div className="text-sm text-gray-300">สมาชิก (Member)</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-yellow-400 mb-2">
                        {users.filter(u => u.role === 'staff').length}
                      </div>
                      <div className="text-sm text-gray-300">Staff</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-red-400 mb-2">
                        {users.filter(u => u.role === 'admin').length}
                      </div>
                      <div className="text-sm text-gray-300">Admin</div>
                    </div>
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

                {/* Leave Types moved to its own tab */}

                {/* Delivery Types */}
                {/* Delivery Types moved to its own tab */}

                {/* Fine List removed (already available in "รายการปรับ") */}

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
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">บ้าน/กลุ่ม</th>
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
                              <div className="flex items-center gap-2">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  u.role === 'admin' 
                                    ? 'bg-red-600/20 text-red-400 border border-red-500/30'
                                    : u.role === 'staff'
                                    ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-500/30'
                                    : 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                                }`}>
                                  {u.role === 'admin' ? 'Admin' : u.role === 'staff' ? 'Staff' : 'Member'}
                                </span>
                                <select
                                  value={u.role}
                                  onChange={(e) => handleUpdateUserRole(u.id, e.target.value)}
                                  className="px-2 py-1 bg-gray-800 border border-gray-600 rounded-xl text-white text-xs focus:outline-none focus:border-purple-500"
                                >
                                  <option value="member">Member</option>
                                  <option value="staff">Staff</option>
                                  <option value="admin">Admin</option>
                                </select>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={editingHouseName[u.id] !== undefined ? editingHouseName[u.id] : (u.houseName || "")}
                                  onChange={(e) => {
                                    const next = e.target.value || ''
                                    setEditingHouseName(prev => ({ ...prev, [u.id]: next }))
                                    // debounce save
                                    if (houseSaveTimers.current[u.id]) {
                                      clearTimeout(houseSaveTimers.current[u.id])
                                    }
                                    houseSaveTimers.current[u.id] = setTimeout(() => {
                                      const toSave = next.trim()
                                      if (toSave !== (u.houseName || "")) {
                                        handleUpdateHouseName(u.id, toSave)
                                      }
                                    }, 600)
                                  }}
                                  onBlur={() => {
                                    if (houseSaveTimers.current[u.id]) {
                                      clearTimeout(houseSaveTimers.current[u.id])
                                    }
                                    const newValue = (editingHouseName[u.id] !== undefined ? editingHouseName[u.id] : (u.houseName || "")) || ""
                                    if (newValue !== (u.houseName || "")) {
                                      handleUpdateHouseName(u.id, newValue)
                                    }
                                    setEditingHouseName(prev => ({ ...prev, [u.id]: undefined }))
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      if (houseSaveTimers.current[u.id]) {
                                        clearTimeout(houseSaveTimers.current[u.id])
                                      }
                                      const newValue = (editingHouseName[u.id] !== undefined ? editingHouseName[u.id] : (u.houseName || "")) || ""
                                      if (newValue !== (u.houseName || "")) {
                                        handleUpdateHouseName(u.id, newValue)
                                      }
                                      setEditingHouseName(prev => ({ ...prev, [u.id]: undefined }))
                                    }
                                    if (e.key === 'Escape') {
                                      if (houseSaveTimers.current[u.id]) {
                                        clearTimeout(houseSaveTimers.current[u.id])
                                      }
                                      setEditingHouseName(prev => ({ ...prev, [u.id]: undefined }))
                                    }
                                  }}
                                  className="px-2 py-1 bg-gray-800/50 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-purple-500 w-32"
                                  placeholder="บ้าน/กลุ่ม"
                                />
                              </div>
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

            {/* Leave Types Tab */}
            {activeTab === 'leave-types' && (
              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-white mb-6">จัดการประเภทการลา</h2>
                <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <List className="w-5 h-5" />
                    ประเภทการลา
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
              </div>
            )}

            {/* Delivery Types Tab */}
            {activeTab === 'delivery-types' && (
              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-white mb-6">จัดการประเภทการส่งของ</h2>
                <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Truck className="w-5 h-5" />
                    ประเภทการส่งของ
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

            {/* Invite Codes Tab */}
            {activeTab === 'invites' && (
              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-white mb-6">จัดการรหัสเชิญ ({inviteCodes.length})</h2>
                
                {/* Create New Invite Code */}
                <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">สร้างรหัสเชิญใหม่</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">รหัสเชิญ</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newInviteCode.code}
                          onChange={(e) => setNewInviteCode(prev => ({ ...prev, code: e.target.value }))}
                          placeholder="กรอกรหัสเชิญ"
                          className="flex-1 px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                        />
                        <button
                          onClick={() => setNewInviteCode(prev => ({ ...prev, code: generateInviteCode() }))}
                          className="px-4 py-3 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 rounded-xl border border-purple-500/30 transition-all duration-300"
                        >
                          สุ่ม
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">จำนวนครั้งที่ใช้ได้</label>
                      <input
                        type="number"
                        min="1"
                        value={newInviteCode.maxUses}
                        onChange={(e) => setNewInviteCode(prev => ({ ...prev, maxUses: parseInt(e.target.value) || 1 }))}
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">หมดอายุใน (วัน)</label>
                      <input
                        type="number"
                        min="1"
                        value={newInviteCode.expiresInDays}
                        onChange={(e) => setNewInviteCode(prev => ({ ...prev, expiresInDays: parseInt(e.target.value) || 7 }))}
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={handleCreateInviteCode}
                        className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-medium rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-300 hover:scale-105"
                      >
                        <Plus className="w-5 h-5 inline mr-2" />
                        สร้างรหัสเชิญ
                      </button>
                    </div>
                  </div>
                </div>

                {/* Invite Codes List */}
                <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-800/50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">รหัสเชิญ</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">ใช้แล้ว/ทั้งหมด</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">หมดอายุ</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">สร้างโดย</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">สถานะ</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">จัดการ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700/30">
                        {inviteCodes.map((invite) => {
                          const isExpired = invite.expiresAt?.toDate?.() < new Date()
                          const isFullyUsed = invite.usedCount >= invite.maxUses
                          const isActive = invite.isActive && !isExpired && !isFullyUsed
                          
                          return (
                            <tr key={invite.id} className="hover:bg-gray-800/30 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <code className="px-3 py-1 bg-gray-800/50 text-purple-400 rounded-xl font-mono text-sm">
                                    {invite.code}
                                  </code>
                                  <button
                                    onClick={() => navigator.clipboard.writeText(invite.code)}
                                    className="text-gray-400 hover:text-white transition-colors"
                                    title="คัดลอก"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-300">
                                {invite.usedCount}/{invite.maxUses}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-300">
                                {formatDate(invite.expiresAt)}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-300">
                                {invite.createdBy}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  isActive
                                    ? 'bg-green-600/20 text-green-400 border border-green-500/30'
                                    : isExpired
                                    ? 'bg-red-600/20 text-red-400 border border-red-500/30'
                                    : isFullyUsed
                                    ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-500/30'
                                    : 'bg-gray-600/20 text-gray-400 border border-gray-500/30'
                                }`}>
                                  {isActive ? 'ใช้งานได้' : isExpired ? 'หมดอายุ' : isFullyUsed ? 'ใช้ครบแล้ว' : 'ปิดใช้งาน'}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleToggleInviteCode(invite.id, invite.isActive)}
                                    className={`px-3 py-1 rounded-xl text-xs font-medium transition-all ${
                                      invite.isActive
                                        ? 'bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600/30 border border-yellow-500/30'
                                        : 'bg-green-600/20 text-green-400 hover:bg-green-600/30 border border-green-500/30'
                                    }`}
                                  >
                                    {invite.isActive ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteInviteCode(invite.id)}
                                    className="px-3 py-1 bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-500/30 rounded-xl text-xs font-medium transition-all"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  
                  {inviteCodes.length === 0 && (
                    <div className="p-12 text-center">
                      <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400">ยังไม่มีรหัสเชิญ</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Staff Reports Tab */}
            {activeTab === 'staff-reports' && (
              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-white mb-6">รายงานจาก Staff ({staffReports.length})</h2>
                
                <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-800/50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">หัวข้อ</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">ประเภท</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">ความสำคัญ</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">ผู้รายงาน</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">สถานะ</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">วันที่</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700/30">
                        {staffReports.map((report) => (
                          <tr key={report.id} className="hover:bg-gray-800/30 transition-colors">
                            <td className="px-6 py-4">
                              <div className="text-white font-medium">{report.title}</div>
                              <div className="text-sm text-gray-400 truncate max-w-xs">{report.description}</div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-600/20 text-blue-400 border border-blue-500/30">
                                {report.category}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                report.priority === 'urgent' 
                                  ? 'bg-red-600/20 text-red-400 border border-red-500/30'
                                  : report.priority === 'high'
                                  ? 'bg-orange-600/20 text-orange-400 border border-orange-500/30'
                                  : report.priority === 'medium'
                                  ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-500/30'
                                  : 'bg-green-600/20 text-green-400 border border-green-500/30'
                              }`}>
                                {report.priority === 'urgent' ? 'ด่วนมาก' :
                                 report.priority === 'high' ? 'สูง' :
                                 report.priority === 'medium' ? 'ปานกลาง' : 'ต่ำ'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-300">{report.reporterName}</td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                report.status === 'pending' 
                                  ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-500/30'
                                  : report.status === 'in_progress'
                                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                                  : 'bg-green-600/20 text-green-400 border border-green-500/30'
                              }`}>
                                {report.status === 'pending' ? 'รอดำเนินการ' :
                                 report.status === 'in_progress' ? 'กำลังดำเนินการ' : 'เสร็จสิ้น'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-400">{formatDate(report.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {staffReports.length === 0 && (
                    <div className="p-12 text-center">
                      <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400">ยังไม่มีรายงานจาก Staff</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Fine Items Tab */}
            {activeTab === 'fine-items' && (
              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-white mb-6">จัดการรายการปรับ ({fineItems.length})</h2>
                
                {/* Add New Fine Item Form */}
                <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">เพิ่มรายการปรับใหม่</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <input
                      type="text"
                      value={newFineItem.name}
                      onChange={(e) => setNewFineItem({ ...newFineItem, name: e.target.value })}
                      placeholder="ชื่อรายการปรับ"
                      className="px-4 py-2 bg-gray-800/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-purple-500"
                    />
                    <input
                      type="number"
                      value={newFineItem.amount}
                      onChange={(e) => setNewFineItem({ ...newFineItem, amount: parseInt(e.target.value) || 0 })}
                      placeholder="จำนวนเงิน"
                      className="px-4 py-2 bg-gray-800/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-purple-500"
                    />
                    <input
                      type="text"
                      value={newFineItem.description}
                      onChange={(e) => setNewFineItem({ ...newFineItem, description: e.target.value })}
                      placeholder="คำอธิบาย (ไม่บังคับ)"
                      className="px-4 py-2 bg-gray-800/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <button
                    onClick={handleAddFineItem}
                    className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-all flex items-center gap-2"
                  >
                    <DollarSign className="w-4 h-4" />
                    เพิ่มรายการปรับ
                  </button>
                </div>

                {/* Fine Items List */}
                <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">รายการปรับทั้งหมด</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-800/50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">ชื่อรายการ</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">จำนวนเงิน</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">คำอธิบาย</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">สถานะ</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">วันที่สร้าง</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">จัดการ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700/30">
                        {fineItems.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-800/30 transition-colors">
                            <td className="px-6 py-4 text-sm text-white font-medium">{item.name}</td>
                            <td className="px-6 py-4 text-sm text-green-400 font-bold">฿{item.amount.toLocaleString()}</td>
                            <td className="px-6 py-4 text-sm text-gray-300">{item.description || "-"}</td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                item.isActive 
                                  ? 'bg-green-600/20 text-green-400 border border-green-500/30'
                                  : 'bg-red-600/20 text-red-400 border border-red-500/30'
                              }`}>
                                {item.isActive ? 'ใช้งาน' : 'ปิดใช้งาน'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-400">{formatDate(item.createdAt)}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleToggleFineItem(item.id, item.isActive)}
                                  className={`px-3 py-1 rounded-xl text-xs font-medium transition-all ${
                                    item.isActive
                                      ? 'bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600/30 border border-yellow-500/30'
                                      : 'bg-green-600/20 text-green-400 hover:bg-green-600/30 border border-green-500/30'
                                  }`}
                                >
                                  {item.isActive ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                                </button>
                                <button
                                  onClick={() => handleDeleteFineItem(item.id)}
                                  className="px-3 py-1 bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-500/30 rounded-xl text-xs font-medium transition-all"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {fineItems.length === 0 && (
                    <div className="p-12 text-center">
                      <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400">ยังไม่มีรายการปรับ</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Activity Logs Tab */}
            {activeTab === 'logs' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-3xl font-bold text-white">Log ระบบ ({activityLogs.length})</h2>
                  <div className="flex gap-2">
                    <select
                      value={logFilter}
                      onChange={(e) => setLogFilter(e.target.value as any)}
                      className="px-4 py-2 bg-gray-800/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="all">ทั้งหมด</option>
                      <option value="admin">Admin</option>
                      <option value="staff">Staff</option>
                      <option value="member">Member</option>
                    </select>
                    <button
                      onClick={loadActivityLogs}
                      className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-xl border border-blue-500/30 transition-all duration-300 flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      รีเฟรช
                    </button>
                  </div>
                </div>

                {/* Logs Table */}
                <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-800/50">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">เวลา</th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">ผู้ใช้</th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">บทบาท</th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">บ้าน/กลุ่ม</th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">การกระทำ</th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">รายละเอียด</th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">IP Address</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700/50">
                        {activityLogs
                          .filter(log => logFilter === 'all' || log.userRole === logFilter)
                          .map((log) => (
                            <tr key={log.id} className="hover:bg-gray-800/30 transition-colors">
                              <td className="px-6 py-4 text-sm text-gray-300">
                                {formatDate(log.timestamp)}
                              </td>
                              <td className="px-6 py-4 text-sm text-white font-medium">
                                {log.username}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  log.userRole === 'admin' 
                                    ? 'bg-red-600/20 text-red-400 border border-red-500/30'
                                    : log.userRole === 'staff'
                                    ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-500/30'
                                    : 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                                }`}>
                                  {log.userRole === 'admin' ? 'Admin' : log.userRole === 'staff' ? 'Staff' : 'Member'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-300">
                                {log.houseName || '-'}
                              </td>
                              <td className="px-6 py-4 text-sm text-white font-medium">
                                {log.action === 'update_house_name' && 'แก้ไขบ้าน/กลุ่ม'}
                                {log.action === 'create_user' && 'สร้างผู้ใช้'}
                                {log.action === 'update_user' && 'อัปเดตผู้ใช้'}
                                {log.action === 'delete_user' && 'ลบผู้ใช้'}
                                {log.action === 'create_invite_code' && 'สร้างรหัสเชิญ'}
                                {log.action === 'delete_invite_code' && 'ลบรหัสเชิญ'}
                                {log.action === 'login' && 'เข้าสู่ระบบ'}
                                {log.action === 'logout' && 'ออกจากระบบ'}
                                {log.action === 'create_leave_request' && 'ส่งคำขอลา'}
                                {log.action === 'create_delivery' && 'ส่งของ'}
                                {log.action === 'create_report' && 'ส่งรายงาน'}
                                {log.action === 'create_fine' && 'แจ้งค่าปรับ'}
                                {log.action === 'update_settings' && 'อัปเดตการตั้งค่า'}
                                {log.action === 'create_fine_item' && 'เพิ่มรายการปรับ'}
                                {log.action === 'delete_fine_item' && 'ลบรายการปรับ'}
                                {!['update_house_name', 'create_user', 'update_user', 'delete_user', 'create_invite_code', 'delete_invite_code', 'login', 'logout', 'create_leave_request', 'create_delivery', 'create_report', 'create_fine', 'update_settings', 'create_fine_item', 'delete_fine_item'].includes(log.action) && log.action}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-300 max-w-xs truncate">
                                {log.details}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-400 font-mono">
                                {log.ipAddress}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {activityLogs.length === 0 && (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800/50 flex items-center justify-center">
                        <FileText className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-400">ยังไม่มี Log กิจกรรม</p>
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
