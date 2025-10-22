"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ClonedSiteAuthProvider, useClonedSiteAuth } from "@/contexts/cloned-site-auth-context"
import Link from "next/link"
import { Home, FileText, Truck, MessageSquare, Settings, LogOut, User, Users, ShieldCheck } from "lucide-react"
import { collection, getDocs, query, where } from "firebase/firestore"
import { firestore } from "@/lib/firebase"

interface DashboardStats {
  totalLeaveRequests: number
  totalFineAmount: number
  totalDeliveryRecords: number
  totalReportRecords: number
}

function ClonedSiteUserDashboard() {
  const params = useParams<{ id: string }>()
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

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      const sessionUser = await checkSession(params.id)
      if (!sessionUser) {
        router.push(`/preview/${params.id}/login`)
        return
      }
      
      // Load real data from Firebase
      await loadDashboardStats(sessionUser)
      setIsLoading(false)
    }
    checkAuth()
  }, [params.id, checkSession, router])

  useEffect(() => {
    // Get site information
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

  const loadDashboardStats = async (currentUser: any) => {
    try {
      // Load leave requests for current user
      const leaveRequestsRef = collection(firestore, `cloned_sites/${params.id}/leave_requests`)
      const leaveQuery = query(leaveRequestsRef, where("userId", "==", currentUser.id))
      const leaveSnapshot = await getDocs(leaveQuery)
      
      // Load fine records for current user
      const fineRecordsRef = collection(firestore, `cloned_sites/${params.id}/fine_records`)
      const fineQuery = query(fineRecordsRef, where("memberName", "==", currentUser.username))
      const fineSnapshot = await getDocs(fineQuery)
      
      let totalFineAmount = 0
      fineSnapshot.forEach((doc) => {
        const data = doc.data()
        totalFineAmount += data.amount || 0
      })
      
      // Load delivery records for current user
      const deliveryRecordsRef = collection(firestore, `cloned_sites/${params.id}/delivery_records`)
      const deliveryQuery = query(deliveryRecordsRef, where("userId", "==", currentUser.id))
      const deliverySnapshot = await getDocs(deliveryQuery)
      
      // Load reports for current user
      const reportsRef = collection(firestore, `cloned_sites/${params.id}/reports`)
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
      // Set to zero if error
      setStats({
        totalLeaveRequests: 0,
        totalFineAmount: 0,
        totalDeliveryRecords: 0,
        totalReportRecords: 0,
      })
    }
  }

  const handleLogout = () => {
    logout()
    router.push(`/preview/${params.id}/login`)
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
              className="flex items-center gap-3 px-4 py-3 text-white bg-blue-600/20 border border-blue-500/30 rounded-xl hover:bg-blue-600/30 transition-all duration-300"
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
              className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-xl transition-all duration-300"
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
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Page Title */}
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">เมนูหลัก</h2>
              <p className="text-gray-400">ภาพรวมข้อมูลและสถิติของคุณ</p>
            </div>

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
                <Link href={`/preview/${params.id}/fine-details`} className="inline-block w-full md:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 hover:scale-105 hover:shadow-lg text-center">
                  ดูรายละเอียดค่าปรับของฉัน
                </Link>
              </div>
            </div>

            {/* Recent Activity (Optional) */}
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

export default function ClonedSiteUserDashboardPage() {
  return (
    <ClonedSiteAuthProvider>
      <ClonedSiteUserDashboard />
    </ClonedSiteAuthProvider>
  )
}


