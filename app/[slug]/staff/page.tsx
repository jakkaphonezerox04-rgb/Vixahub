"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ClonedSiteAuthProvider, useClonedSiteAuth } from "@/contexts/cloned-site-auth-context"
import { ClonedSiteLayout, SiteLogo } from "@/components/cloned-site-layout"
import ClonedSiteRouteGuard from "@/components/cloned-site-route-guard"
import Link from "next/link"
import { Home, FileText, Truck, MessageSquare, Users, Shield, LogOut, UserCheck, DollarSign, Calendar, AlertTriangle } from "lucide-react"
import { collection, getDocs, query, where, addDoc, serverTimestamp } from "firebase/firestore"
import { firestore } from "@/lib/firebase"
import { getWebsiteBySlug } from "@/lib/firebase-websites"

interface StaffStats {
  totalMembers: number
  totalLeaveRequests: number
  pendingLeaveRequests: number
  totalFineAmount: number
  totalDeliveryRecords: number
  totalReportRecords: number
}

interface Member {
  id: string
  username: string
  email: string
  role: string
  houseName?: string
  createdAt: any
}

interface LeaveRequest {
  id: string
  userId: string
  username: string
  houseName?: string
  reason: string
  startDate: string
  endDate: string
  status: string
  createdAt: any
}

interface FineRecord {
  id: string
  memberName: string
  memberHouseName?: string
  amount: number
  reason: string
  status: string
  createdAt: any
}

interface FineItem {
  id: string
  name: string
  amount: number
  description?: string
  isActive: boolean
  createdAt: any
}

interface FineFormData {
  memberUsername: string
  memberUID: string
  fineItem: string
  amount: number
  reason: string
  memberHouseName: string
}

function ClonedSiteStaffDashboard() {
  const params = useParams<{ slug: string }>()
  const router = useRouter()
  const { user, logout, checkSession } = useClonedSiteAuth()
  const [siteName, setSiteName] = useState<string>("")
  const [stats, setStats] = useState<StaffStats>({
    totalMembers: 0,
    totalLeaveRequests: 0,
    pendingLeaveRequests: 0,
    totalFineAmount: 0,
    totalDeliveryRecords: 0,
    totalReportRecords: 0,
  })
  const [members, setMembers] = useState<Member[]>([])
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [fineRecords, setFineRecords] = useState<FineRecord[]>([])
  const [fineItems, setFineItems] = useState<FineItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'members' | 'leaves' | 'fines' | 'fine-form'>('dashboard')
  const [formData, setFormData] = useState<FineFormData>({
    memberUsername: "",
    memberUID: "",
    fineItem: "",
    amount: 0,
    reason: "",
    memberHouseName: ""
  })
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

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

    // Check if user is logged in and has staff role
    const checkAuth = async () => {
      console.log('[STAFF] Checking session for slug:', params.slug)
      const sessionUser = await checkSession(params.slug)
      console.log('[STAFF] Session user:', sessionUser)
      
      if (!sessionUser) {
        console.log('[STAFF] No session, redirecting to login')
        router.push(`/${params.slug}/login`)
        return
      }

      if (sessionUser.role !== 'staff' && sessionUser.role !== 'admin') {
        console.log('[STAFF] User does not have staff role, redirecting to dashboard')
        router.push(`/${params.slug}/dashboard`)
        return
      }

      // Check if user has house/group assigned (except admin)
      if (sessionUser.role !== 'admin' && !sessionUser.houseName) {
        console.log('[STAFF] User does not have house/group assigned, redirecting to dashboard')
        router.push(`/${params.slug}/dashboard`)
        return
      }
      
      // Load staff data
      await loadStaffData()
      setIsLoading(false)
    }
    checkAuth()
  }, [siteName, params.slug, checkSession, router])

  const loadStaffData = async () => {
    try {
      // Load members - only from the same house/group as staff
      const membersRef = collection(firestore, `cloned_sites/${params.slug}/users`)
      const membersSnapshot = await getDocs(membersRef)
      const membersList: Member[] = []
      membersSnapshot.forEach((doc) => {
        const data = doc.data()
        // Only show members from the same house/group as the staff
        // Admin can see everyone, staff can only see their own house/group
        if (user?.role === 'admin' || data.houseName === user?.houseName) {
          membersList.push({
            id: doc.id,
            username: data.username || "",
            email: data.email || "",
            role: data.role || "member",
            houseName: data.houseName || "",
            createdAt: data.createdAt
          })
        }
      })
      setMembers(membersList)

      // Load fine items
      const fineItemsRef = collection(firestore, `cloned_sites/${params.slug}/fine_items`)
      const fineItemsSnapshot = await getDocs(fineItemsRef)
      const fineItemsList: FineItem[] = []
      fineItemsSnapshot.forEach((doc) => {
        const data = doc.data()
        if (data.isActive !== false) { // Only active items
          fineItemsList.push({
            id: doc.id,
            name: data.name || "",
            amount: data.amount || 0,
            description: data.description || "",
            isActive: data.isActive !== false,
            createdAt: data.createdAt
          })
        }
      })
      setFineItems(fineItemsList)

      // Load leave requests - only from the same house/group as staff
      const leaveRequestsRef = collection(firestore, `cloned_sites/${params.slug}/leave_requests`)
      const leaveSnapshot = await getDocs(leaveRequestsRef)
      const leaveList: LeaveRequest[] = []
      leaveSnapshot.forEach((doc) => {
        const data = doc.data()
        // Only show leave requests from members in the same house/group
        if (data.houseName === user?.houseName) {
          leaveList.push({
            id: doc.id,
            userId: data.userId || "",
            username: data.username || "",
            houseName: data.houseName || "",
            reason: data.reason || "",
            startDate: data.startDate || "",
            endDate: data.endDate || "",
            status: data.status || "pending",
            createdAt: data.createdAt
          })
        }
      })
      setLeaveRequests(leaveList)

      // Load fine records - only from the same house/group as staff
      const fineRecordsRef = collection(firestore, `cloned_sites/${params.slug}/fine_records`)
      const fineSnapshot = await getDocs(fineRecordsRef)
      const fineList: FineRecord[] = []
      let totalFineAmount = 0
      fineSnapshot.forEach((doc) => {
        const data = doc.data()
        // Only show fine records from members in the same house/group
        if (data.memberHouseName === user?.houseName) {
          totalFineAmount += data.amount || 0
          fineList.push({
            id: doc.id,
            memberName: data.memberName || "",
            memberHouseName: data.memberHouseName || "",
            amount: data.amount || 0,
            reason: data.reason || "",
            status: data.status || "pending",
            createdAt: data.createdAt
          })
        }
      })
      setFineRecords(fineList)

      // Load delivery records - only from the same house/group as staff
      const deliveryRecordsRef = collection(firestore, `cloned_sites/${params.slug}/delivery_records`)
      const deliverySnapshot = await getDocs(deliveryRecordsRef)
      let deliveryCount = 0
      deliverySnapshot.forEach((doc) => {
        const data = doc.data()
        if (data.houseName === user?.houseName) {
          deliveryCount++
        }
      })

      // Load reports - only from the same house/group as staff
      const reportsRef = collection(firestore, `cloned_sites/${params.slug}/reports`)
      const reportsSnapshot = await getDocs(reportsRef)
      let reportCount = 0
      reportsSnapshot.forEach((doc) => {
        const data = doc.data()
        if (data.reporterHouseName === user?.houseName) {
          reportCount++
        }
      })

      setStats({
        totalMembers: membersList.length,
        totalLeaveRequests: leaveList.length,
        pendingLeaveRequests: leaveList.filter(req => req.status === 'pending').length,
        totalFineAmount: totalFineAmount,
        totalDeliveryRecords: deliveryCount,
        totalReportRecords: reportCount,
      })
    } catch (error) {
      console.error("Error loading staff data:", error)
    }
  }

  const handleLogout = () => {
    logout()
    router.push(`/${params.slug}/login`)
  }

  const handleFineFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    setIsSubmitting(true)
    setMessage(null)

    try {
      // Validate form
      if (!formData.memberUsername || !formData.fineItem || !formData.amount || !formData.reason) {
        setMessage({ type: 'error', text: 'กรุณากรอกข้อมูลให้ครบถ้วน' })
        setIsSubmitting(false)
        return
      }

      // Create fine record
      const fineData = {
        memberName: formData.memberUsername,
        memberUID: formData.memberUID,
        fineItem: formData.fineItem,
        amount: formData.amount,
        reason: formData.reason,
        status: 'pending',
        staffUser: user?.username || '',
        memberHouseName: formData.memberHouseName,
        timestamp: serverTimestamp()
      }

      // Save to Firestore
      const fineRecordsRef = collection(firestore, `cloned_sites/${params.slug}/fine_records`)
      await addDoc(fineRecordsRef, fineData)

      // Log activity
      await logActivity(user?.id || '', user?.username || '', user?.role || '', user?.houseName || '', 'create_fine', `แจ้งค่าปรับ: ${formData.memberUsername} - ${formData.fineItem} จำนวน ${formData.amount} บาท`)

      // Send webhook notification
      const settingsRef = doc(firestore, `cloned_sites/${params.slug}/settings`, 'site_settings')
      const settingsSnapshot = await getDoc(settingsRef)
      
      if (settingsSnapshot.exists()) {
        const siteSettings = settingsSnapshot.data()
        
        if (siteSettings.fineWebhookUrl) {
          console.log("🔔 กำลังส่ง Fine Webhook...")
          try {
            const { sendFineWebhook } = await import('@/lib/webhook')
            await sendFineWebhook(siteSettings.fineWebhookUrl, {
              memberName: formData.memberUsername,
              reason: formData.reason,
              amount: formData.amount,
              status: 'pending',
              websiteName: siteSettings.websiteName,
              logoUrl: siteSettings.logoUrl,
              themeColor: siteSettings.themeAccentColor
            })
            console.log("✅ ส่ง Fine Webhook สำเร็จ!")
          } catch (webhookError) {
            console.error("⚠️ ส่ง Fine Webhook ไม่สำเร็จ:", webhookError)
            // Don't fail the whole operation if webhook fails
          }
        } else {
          console.log("⚠️ ไม่มี Fine Webhook URL ข้ามการส่ง Webhook")
        }
      }

      setMessage({ type: 'success', text: 'แจ้งค่าปรับสำเร็จ!' })
      
      // Reset form
      setFormData({
        memberUsername: "",
        memberUID: "",
        fineItem: "",
        amount: 0,
        reason: "",
        memberHouseName: ""
      })

      // Reload data
      await loadStaffData()
    } catch (error) {
      console.error("Error submitting fine:", error)
      setMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการแจ้งค่าปรับ' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (date: any) => {
    if (!date) return "ไม่ระบุ"
    try {
      const dateObj = date.toDate ? date.toDate() : new Date(date)
      return dateObj.toLocaleDateString('th-TH')
    } catch {
      return "ไม่ระบุ"
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
                <h1 className="text-xl font-bold text-white">{siteName} - Staff Dashboard</h1>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-gray-300">
                  สวัสดีคุณ, <span className="font-bold text-yellow-400">{user.username}</span>
                  <span className="ml-2 px-2 py-1 bg-yellow-600/20 text-yellow-400 rounded-full text-xs border border-yellow-500/30">
                    Staff
                  </span>
                  {user.houseName && (
                    <span className="ml-2 px-2 py-1 bg-blue-600/20 text-blue-400 rounded-full text-xs border border-blue-500/30">
                      {user.houseName}
                    </span>
                  )}
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
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                  activeTab === 'dashboard'
                    ? 'text-white bg-yellow-600/20 border border-yellow-500/30'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                <Shield className="w-5 h-5" />
                <span>ภาพรวม Staff</span>
              </button>
              <button
                onClick={() => setActiveTab('members')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                  activeTab === 'members'
                    ? 'text-white bg-yellow-600/20 border border-yellow-500/30'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                <Users className="w-5 h-5" />
                <span>จัดการสมาชิก ({user.houseName || 'กลุ่มเดียวกัน'})</span>
              </button>
              <button
                onClick={() => setActiveTab('leaves')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                  activeTab === 'leaves'
                    ? 'text-white bg-yellow-600/20 border border-yellow-500/30'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                <FileText className="w-5 h-5" />
                <span>จัดการคำขอลา ({user.houseName || 'กลุ่มเดียวกัน'})</span>
              </button>
              <button
                onClick={() => setActiveTab('fines')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                  activeTab === 'fines'
                    ? 'text-white bg-yellow-600/20 border border-yellow-500/30'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                <DollarSign className="w-5 h-5" />
                <span>จัดการค่าปรับ ({user.houseName || 'กลุ่มเดียวกัน'})</span>
              </button>
              <button
                onClick={() => setActiveTab('fine-form')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                  activeTab === 'fine-form'
                    ? 'text-white bg-yellow-600/20 border border-yellow-500/30'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                <DollarSign className="w-5 h-5" />
                <span>แจ้งค่าปรับ</span>
              </button>
              <Link
                href={`/${params.slug}/report-form`}
                className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-xl transition-all duration-300"
              >
                <MessageSquare className="w-5 h-5" />
                <span>รายงานปัญหา</span>
              </Link>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 p-6 lg:p-8">
            <div className="max-w-6xl mx-auto space-y-6">
              {/* Page Title */}
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">Staff Dashboard</h2>
                <p className="text-gray-400">จัดการข้อมูลสมาชิกและระบบภายใน</p>
              </div>

              {/* Dashboard Tab */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  {/* Stats Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6 text-center hover:scale-105 transition-transform duration-300">
                      <Users className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                      <div className="text-3xl font-bold text-white mb-1">{stats.totalMembers}</div>
                      <div className="text-sm text-blue-300">สมาชิกทั้งหมด</div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 backdrop-blur-sm border border-green-500/30 rounded-xl p-6 text-center hover:scale-105 transition-transform duration-300">
                      <FileText className="w-8 h-8 text-green-400 mx-auto mb-2" />
                      <div className="text-3xl font-bold text-white mb-1">{stats.totalLeaveRequests}</div>
                      <div className="text-sm text-green-300">คำขอลาทั้งหมด</div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 backdrop-blur-sm border border-yellow-500/30 rounded-xl p-6 text-center hover:scale-105 transition-transform duration-300">
                      <AlertTriangle className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                      <div className="text-3xl font-bold text-white mb-1">{stats.pendingLeaveRequests}</div>
                      <div className="text-sm text-yellow-300">รอตรวจสอบ</div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-red-600/20 to-red-800/20 backdrop-blur-sm border border-red-500/30 rounded-xl p-6 text-center hover:scale-105 transition-transform duration-300">
                      <DollarSign className="w-8 h-8 text-red-400 mx-auto mb-2" />
                      <div className="text-3xl font-bold text-white mb-1">฿{stats.totalFineAmount.toLocaleString()}</div>
                      <div className="text-sm text-red-300">ค่าปรับทั้งหมด</div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
                      <h3 className="text-xl font-bold text-white mb-4">คำขอลาล่าสุด</h3>
                      <div className="space-y-3">
                        {leaveRequests.slice(0, 5).map((request) => (
                          <div key={request.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl">
                            <div>
                              <div className="text-white font-medium">{request.username}</div>
                              <div className="text-sm text-gray-400">{request.reason}</div>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              request.status === 'approved' 
                                ? 'bg-green-600/20 text-green-400'
                                : request.status === 'rejected'
                                ? 'bg-red-600/20 text-red-400'
                                : 'bg-yellow-600/20 text-yellow-400'
                            }`}>
                              {request.status === 'approved' ? 'อนุมัติ' : 
                               request.status === 'rejected' ? 'ปฏิเสธ' : 'รอตรวจสอบ'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
                      <h3 className="text-xl font-bold text-white mb-4">ค่าปรับล่าสุด</h3>
                      <div className="space-y-3">
                        {fineRecords.slice(0, 5).map((fine) => (
                          <div key={fine.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl">
                            <div>
                              <div className="text-white font-medium">{fine.memberName}</div>
                              <div className="text-sm text-gray-400">{fine.reason}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-red-400 font-bold">฿{fine.amount.toLocaleString()}</div>
                              <div className={`text-xs ${
                                fine.status === 'paid' ? 'text-green-400' : 'text-yellow-400'
                              }`}>
                                {fine.status === 'paid' ? 'ชำระแล้ว' : 'ค้างชำระ'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Members Tab */}
              {activeTab === 'members' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2">จัดการสมาชิก ({members.length})</h2>
                    <p className="text-gray-400">
                      แสดงรายชื่อสมาชิกในบ้าน/กลุ่ม: <span className="text-yellow-400 font-semibold">{user.houseName || 'ไม่ระบุ'}</span>
                    </p>
                  </div>
                  
                  <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-800/50">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">ชื่อผู้ใช้</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">อีเมล</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">บทบาท</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">บ้าน/กลุ่ม</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">วันที่สมัคร</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700/30">
                          {members.map((member) => (
                            <tr key={member.id} className="hover:bg-gray-800/30 transition-colors">
                              <td className="px-6 py-4 text-sm text-white">{member.username}</td>
                              <td className="px-6 py-4 text-sm text-gray-300">{member.email}</td>
                              <td className="px-6 py-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  member.role === 'admin' 
                                    ? 'bg-red-600/20 text-red-400 border border-red-500/30'
                                    : member.role === 'staff'
                                    ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-500/30'
                                    : 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                                }`}>
                                  {member.role === 'admin' ? 'Admin' : member.role === 'staff' ? 'Staff' : 'Member'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-300">{member.houseName || '-'}</td>
                              <td className="px-6 py-4 text-sm text-gray-400">{formatDate(member.createdAt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Leaves Tab */}
              {activeTab === 'leaves' && (
                <div className="space-y-6">
                  <h2 className="text-3xl font-bold text-white mb-6">จัดการคำขอลา ({leaveRequests.length})</h2>
                  
                  <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-800/50">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">ผู้ขอ</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">บ้าน/กลุ่ม</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">เหตุผล</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">วันที่เริ่ม</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">วันที่สิ้นสุด</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">สถานะ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700/30">
                          {leaveRequests.map((request) => (
                            <tr key={request.id} className="hover:bg-gray-800/30 transition-colors">
                              <td className="px-6 py-4 text-sm text-white">{request.username}</td>
                              <td className="px-6 py-4 text-sm text-gray-300">{request.houseName || '-'}</td>
                              <td className="px-6 py-4 text-sm text-gray-300">{request.reason}</td>
                              <td className="px-6 py-4 text-sm text-gray-400">{request.startDate}</td>
                              <td className="px-6 py-4 text-sm text-gray-400">{request.endDate}</td>
                              <td className="px-6 py-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  request.status === 'approved' 
                                    ? 'bg-green-600/20 text-green-400 border border-green-500/30'
                                    : request.status === 'rejected'
                                    ? 'bg-red-600/20 text-red-400 border border-red-500/30'
                                    : 'bg-yellow-600/20 text-yellow-400 border border-yellow-500/30'
                                }`}>
                                  {request.status === 'approved' ? 'อนุมัติ' : 
                                   request.status === 'rejected' ? 'ปฏิเสธ' : 'รอตรวจสอบ'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Fine Form Tab */}
              {activeTab === 'fine-form' && (
                <div className="space-y-6">
                  <h2 className="text-3xl font-bold text-white mb-6">💸 แจ้งค่าปรับ</h2>
                  
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

                  {/* Fine Form */}
                  <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8">
                    <form onSubmit={handleFineFormSubmit} className="space-y-6">
                      {/* Member Selection */}
                      <div>
                        <label htmlFor="memberUsername" className="block text-gray-300 text-sm font-medium mb-2">
                          ชื่อผู้ถูกปรับ <span className="text-red-400">*</span>
                        </label>
                        <select
                          id="memberUsername"
                          value={formData.memberUsername}
                          onChange={(e) => {
                            const selectedMember = members.find(m => m.username === e.target.value)
                            setFormData(prev => ({
                              ...prev,
                              memberUsername: e.target.value,
                              memberUID: selectedMember?.id || "",
                              memberHouseName: selectedMember?.houseName || ""
                            }))
                          }}
                          className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-purple-500"
                          required
                        >
                          <option value="">เลือกสมาชิก</option>
                          {members.map((member) => (
                            <option key={member.id} value={member.username}>
                              {member.username} ({member.houseName || 'ไม่มีบ้าน/กลุ่ม'})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Fine Item Selection */}
                      <div>
                        <label htmlFor="fineItem" className="block text-gray-300 text-sm font-medium mb-2">
                          ประเภทค่าปรับ <span className="text-red-400">*</span>
                        </label>
                        <select
                          id="fineItem"
                          value={formData.fineItem}
                          onChange={(e) => {
                            const selectedItem = fineItems.find(item => item.name === e.target.value)
                            setFormData(prev => ({
                              ...prev,
                              fineItem: e.target.value,
                              amount: selectedItem?.amount || 0
                            }))
                          }}
                          className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-purple-500"
                          required
                        >
                          <option value="">เลือกประเภทค่าปรับ</option>
                          {fineItems.map((item) => (
                            <option key={item.id} value={item.name}>
                              {item.name} - ฿{item.amount}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Amount */}
                      <div>
                        <label htmlFor="amount" className="block text-gray-300 text-sm font-medium mb-2">
                          จำนวนเงิน (บาท) <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="number"
                          id="amount"
                          value={formData.amount}
                          onChange={(e) => setFormData(prev => ({ ...prev, amount: Number(e.target.value) }))}
                          className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-purple-500"
                          placeholder="0"
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>

                      {/* Reason */}
                      <div>
                        <label htmlFor="reason" className="block text-gray-300 text-sm font-medium mb-2">
                          เหตุผล <span className="text-red-400">*</span>
                        </label>
                        <textarea
                          id="reason"
                          value={formData.reason}
                          onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                          className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-purple-500"
                          placeholder="ระบุเหตุผลในการปรับ"
                          rows={3}
                          required
                        />
                      </div>

                      {/* Submit Button */}
                      <div className="flex gap-4">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
                        >
                          {isSubmitting ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              กำลังส่ง...
                            </>
                          ) : (
                            <>
                              <DollarSign className="w-4 h-4" />
                              แจ้งค่าปรับ
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({
                            memberUsername: "",
                            memberUID: "",
                            fineItem: "",
                            amount: 0,
                            reason: "",
                            memberHouseName: ""
                          })}
                          className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl transition-all duration-300"
                        >
                          รีเซ็ต
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Fines Tab */}
              {activeTab === 'fines' && (
                <div className="space-y-6">
                  <h2 className="text-3xl font-bold text-white mb-6">จัดการค่าปรับ ({fineRecords.length})</h2>
                  
                  <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-800/50">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">สมาชิก</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">บ้าน/กลุ่ม</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">เหตุผล</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">จำนวนเงิน</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">สถานะ</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">วันที่</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700/30">
                          {fineRecords.map((fine) => (
                            <tr key={fine.id} className="hover:bg-gray-800/30 transition-colors">
                              <td className="px-6 py-4 text-sm text-white">{fine.memberName}</td>
                              <td className="px-6 py-4 text-sm text-gray-300">{fine.memberHouseName || '-'}</td>
                              <td className="px-6 py-4 text-sm text-gray-300">{fine.reason}</td>
                              <td className="px-6 py-4 text-sm text-red-400 font-bold">฿{fine.amount.toLocaleString()}</td>
                              <td className="px-6 py-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  fine.status === 'paid' 
                                    ? 'bg-green-600/20 text-green-400 border border-green-500/30'
                                    : 'bg-yellow-600/20 text-yellow-400 border border-yellow-500/30'
                                }`}>
                                  {fine.status === 'paid' ? 'ชำระแล้ว' : 'ค้างชำระ'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-400">{formatDate(fine.createdAt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>

        {/* Footer */}
        <footer className="mt-8 py-4 px-6 text-center text-gray-400 border-t border-gray-700/50">
          <p>© {new Date().getFullYear()} {siteName} - Staff Dashboard</p>
        </footer>
      </ClonedSiteLayout>
    </ClonedSiteRouteGuard>
  )
}

export default function ClonedSiteStaffDashboardPage() {
  return (
    <ClonedSiteAuthProvider>
      <ClonedSiteStaffDashboard />
    </ClonedSiteAuthProvider>
  )
}