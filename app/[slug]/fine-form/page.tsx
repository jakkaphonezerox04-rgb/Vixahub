"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ClonedSiteAuthProvider, useClonedSiteAuth } from "@/contexts/cloned-site-auth-context"
import { ClonedSiteLayout, SiteLogo } from "@/components/cloned-site-layout"
import ClonedSiteRouteGuard from "@/components/cloned-site-route-guard"
import Link from "next/link"
import { Home, DollarSign, Users, FileText, LogOut, ArrowLeft, AlertCircle, CheckCircle } from "lucide-react"
import { collection, getDocs, addDoc, query, where, serverTimestamp } from "firebase/firestore"
import { firestore } from "@/lib/firebase"
import { getWebsiteBySlug } from "@/lib/firebase-websites"

interface Member {
  id: string
  username: string
  email: string
  role: string
  houseName?: string
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

function ClonedSiteFineForm() {
  const params = useParams<{ slug: string }>()
  const router = useRouter()
  const { user, logout, checkSession } = useClonedSiteAuth()
  const [siteName, setSiteName] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [members, setMembers] = useState<Member[]>([])
  const [fineItems, setFineItems] = useState<FineItem[]>([])
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
      console.log('[FINE-FORM] Checking session for slug:', params.slug)
      const sessionUser = await checkSession(params.slug)
      console.log('[FINE-FORM] Session user:', sessionUser)
      
      if (!sessionUser) {
        console.log('[FINE-FORM] No session, redirecting to login')
        router.push(`/${params.slug}/login`)
        return
      }

      if (sessionUser.role !== 'staff' && sessionUser.role !== 'admin') {
        console.log('[FINE-FORM] User does not have staff role, redirecting to dashboard')
        router.push(`/${params.slug}/dashboard`)
        return
      }

      // Check if user has house/group assigned (except admin)
      if (sessionUser.role !== 'admin' && !sessionUser.houseName) {
        console.log('[FINE-FORM] User does not have house/group assigned, redirecting to dashboard')
        router.push(`/${params.slug}/dashboard`)
        return
      }
      
      // Load data
      await loadData()
      setIsLoading(false)
    }
    checkAuth()
  }, [siteName, params.slug, checkSession, router])

  const loadData = async () => {
    try {
      // Load members
      const membersRef = collection(firestore, `cloned_sites/${params.slug}/users`)
      const membersSnapshot = await getDocs(membersRef)
      const membersList: Member[] = []
      membersSnapshot.forEach((doc) => {
        const data = doc.data()
        if (data.role !== 'admin') { // Exclude admin from fine list
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
    } catch (error) {
      console.error("Error loading data:", error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Auto-fill amount when fine item is selected
    if (name === 'fineItem') {
      const selectedFineItem = fineItems.find(item => item.name === value)
      if (selectedFineItem) {
        setFormData(prev => ({
          ...prev,
          fineItem: value,
          amount: selectedFineItem.amount
        }))
      }
    }

    // Auto-fill member info when member is selected
    if (name === 'memberUsername') {
      const selectedMember = members.find(member => member.username === value)
      if (selectedMember) {
        setFormData(prev => ({
          ...prev,
          memberUsername: value,
          memberUID: selectedMember.id,
          memberHouseName: selectedMember.houseName || ""
        }))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage(null)

    try {
      if (!formData.memberUsername || !formData.fineItem || !formData.amount) {
        setMessage({ type: 'error', text: 'กรุณากรอกข้อมูลให้ครบถ้วน' })
        setIsSubmitting(false)
        return
      }

      const fineData = {
        memberName: formData.memberUsername,
        memberUID: formData.memberUID,
        fineItem: formData.fineItem,
        amount: formData.amount,
        reason: formData.reason || "ไม่มี",
        status: "ยังไม่ชำระ",
        staffUser: user?.username || "",
        memberHouseName: formData.memberHouseName,
        createdAt: new Date(),
        timestamp: new Date().getTime()
      }

      // Save to Firestore
      const fineRecordsRef = collection(firestore, `cloned_sites/${params.slug}/fine_records`)
      await addDoc(fineRecordsRef, fineData)

      // Log activity
      await logActivity(user.id, user.username, user.role, user.houseName, 'create_fine', `แจ้งค่าปรับ ${formData.memberUsername} จำนวน ฿${formData.amount} - ${formData.fineItem}`)

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
      await loadData()

    } catch (error) {
      console.error("Error submitting fine:", error)
      setMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' })
    } finally {
      setIsSubmitting(false)
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

  const handleLogout = () => {
    logout()
    router.push(`/${params.slug}/login`)
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
                <h1 className="text-xl font-bold text-white">{siteName} - แจ้งค่าปรับ</h1>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-gray-300">
                  สวัสดีคุณ, <span className="font-bold text-yellow-400">{user.username}</span>
                  <span className="ml-2 px-2 py-1 bg-yellow-600/20 text-yellow-400 rounded-full text-xs border border-yellow-500/30">
                    Staff
                  </span>
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
                href={`/${params.slug}/staff`}
                className="flex items-center gap-3 px-4 py-3 text-yellow-400 bg-yellow-600/20 border border-yellow-500/30 rounded-xl"
              >
                <DollarSign className="w-5 h-5" />
                <span>แจ้งค่าปรับ</span>
              </Link>
              <Link
                href={`/${params.slug}/staff`}
                className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-xl transition-all duration-300"
              >
                <Users className="w-5 h-5" />
                <span>จัดการสมาชิก</span>
              </Link>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 p-6 lg:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Page Title */}
              <div className="flex items-center gap-4">
                <Link
                  href={`/${params.slug}/staff`}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 rounded-xl transition-all duration-300"
                >
                  <ArrowLeft className="w-4 h-4" />
                  กลับ
                </Link>
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">💸 แจ้งค่าปรับ</h2>
                  <p className="text-gray-400">กรอกแบบฟอร์มแจ้งค่าปรับสมาชิก</p>
                </div>
              </div>

              {/* Fine Form */}
              <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Member Selection */}
                  <div>
                    <label htmlFor="memberUsername" className="block text-gray-300 text-sm font-medium mb-2">
                      ชื่อผู้ถูกปรับ <span className="text-red-400">*</span>
                    </label>
                    <select
                      id="memberUsername"
                      name="memberUsername"
                      value={formData.memberUsername}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-300"
                      required
                    >
                      <option value="">เลือกชื่อสมาชิก</option>
                      {members.map((member) => (
                        <option key={member.id} value={member.username}>
                          {member.username} {member.houseName ? `(${member.houseName})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Fine Item Selection */}
                  <div>
                    <label htmlFor="fineItem" className="block text-gray-300 text-sm font-medium mb-2">
                      รายการปรับ <span className="text-red-400">*</span>
                    </label>
                    <select
                      id="fineItem"
                      name="fineItem"
                      value={formData.fineItem}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-300"
                      required
                    >
                      <option value="">เลือกรายการปรับ</option>
                      {fineItems.map((item) => (
                        <option key={item.id} value={item.name}>
                          {item.name} (฿{item.amount.toLocaleString()})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Fine Amount */}
                  <div>
                    <label htmlFor="amount" className="block text-gray-300 text-sm font-medium mb-2">
                      จำนวนเงินที่ปรับ <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      id="amount"
                      name="amount"
                      value={formData.amount || ''}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-300"
                      placeholder="จำนวนเงิน"
                      required
                      readOnly
                    />
                  </div>

                  {/* Reason */}
                  <div>
                    <label htmlFor="reason" className="block text-gray-300 text-sm font-medium mb-2">
                      เหตุผลเพิ่มเติม
                    </label>
                    <textarea
                      id="reason"
                      name="reason"
                      value={formData.reason}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-300 resize-none"
                      placeholder="ระบุเหตุผลเพิ่มเติม (ถ้ามี)"
                    />
                  </div>

                  {/* Message */}
                  {message && (
                    <div className={`p-4 rounded-xl border flex items-center gap-3 ${
                      message.type === 'success' 
                        ? 'bg-green-600/20 border-green-500/30 text-green-400' 
                        : 'bg-red-600/20 border-red-500/30 text-red-400'
                    }`}>
                      {message.type === 'success' ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <AlertCircle className="w-5 h-5" />
                      )}
                      {message.text}
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full px-6 py-4 bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white font-medium rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        กำลังบันทึก...
                      </>
                    ) : (
                      <>
                        <DollarSign className="w-5 h-5" />
                        ส่งแจ้งปรับ
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Fine Items Info */}
              {fineItems.length === 0 && (
                <div className="bg-yellow-600/20 border border-yellow-500/30 rounded-xl p-6 text-center">
                  <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-yellow-400 mb-2">ไม่มีรายการปรับ</h3>
                  <p className="text-yellow-300">
                    กรุณาติดต่อ Admin เพื่อเพิ่มรายการปรับในระบบ
                  </p>
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

export default function ClonedSiteFineFormPage() {
  return (
    <ClonedSiteAuthProvider>
      <ClonedSiteFineForm />
    </ClonedSiteAuthProvider>
  )
}

