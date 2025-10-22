"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ClonedSiteAuthProvider, useClonedSiteAuth } from "@/contexts/cloned-site-auth-context"
import { ClonedSiteLayout, SiteLogo } from "@/components/cloned-site-layout"
import ClonedSiteRouteGuard from "@/components/cloned-site-route-guard"
import Link from "next/link"
import { Home, MessageSquare, Users, FileText, LogOut, ArrowLeft, AlertCircle, CheckCircle, Upload, X, Image as ImageIcon, File } from "lucide-react"
import { collection, addDoc, getDocs, query, where, orderBy, limit, serverTimestamp } from "firebase/firestore"
import { firestore } from "@/lib/firebase"
import { getWebsiteBySlug } from "@/lib/firebase-websites"

interface ReportFormData {
  title: string
  category: string
  description: string
  priority: string
  targetMember?: string
  attachments: File[]
}

interface ReportCategory {
  id: string
  name: string
  description: string
  color: string
}

const REPORT_CATEGORIES: ReportCategory[] = [
  { id: 'behavior', name: 'พฤติกรรมไม่เหมาะสม', description: 'รายงานพฤติกรรมที่ไม่เหมาะสมของสมาชิก', color: 'red' },
  { id: 'rule_violation', name: 'ฝ่าฝืนกฎระเบียบ', description: 'รายงานการฝ่าฝืนกฎระเบียบของบ้าน', color: 'orange' },
  { id: 'safety', name: 'ความปลอดภัย', description: 'รายงานเรื่องความปลอดภัยและความเสี่ยง', color: 'yellow' },
  { id: 'facility', name: 'สิ่งอำนวยความสะดวก', description: 'รายงานปัญหาเกี่ยวกับสิ่งอำนวยความสะดวก', color: 'blue' },
  { id: 'noise', name: 'เสียงรบกวน', description: 'รายงานเรื่องเสียงรบกวน', color: 'purple' },
  { id: 'other', name: 'อื่นๆ', description: 'รายงานเรื่องอื่นๆ', color: 'gray' }
]

const PRIORITY_LEVELS = [
  { value: 'low', label: 'ต่ำ', color: 'green', description: 'ไม่เร่งด่วน' },
  { value: 'medium', label: 'ปานกลาง', color: 'yellow', description: 'ควรแก้ไขในเร็วๆ' },
  { value: 'high', label: 'สูง', color: 'orange', description: 'เร่งด่วน' },
  { value: 'urgent', label: 'ด่วนมาก', color: 'red', description: 'ต้องแก้ไขทันที' }
]

function ClonedSiteReportForm() {
  const params = useParams<{ slug: string }>()
  const router = useRouter()
  const { user, logout, checkSession } = useClonedSiteAuth()
  const [siteName, setSiteName] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [members, setMembers] = useState<Array<{id: string, username: string, houseName?: string}>>([])
  const [formData, setFormData] = useState<ReportFormData>({
    title: "",
    category: "",
    description: "",
    priority: "medium",
    targetMember: "",
    attachments: []
  })
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [dragActive, setDragActive] = useState(false)

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
      console.log('[REPORT-FORM] Checking session for slug:', params.slug)
      const sessionUser = await checkSession(params.slug)
      console.log('[REPORT-FORM] Session user:', sessionUser)
      
      if (!sessionUser) {
        console.log('[REPORT-FORM] No session, redirecting to login')
        router.push(`/${params.slug}/login`)
        return
      }

      if (sessionUser.role !== 'staff' && sessionUser.role !== 'admin') {
        console.log('[REPORT-FORM] User does not have staff role, redirecting to dashboard')
        router.push(`/${params.slug}/dashboard`)
        return
      }

      // Check if user has house/group assigned (except admin)
      if (sessionUser.role !== 'admin' && !sessionUser.houseName) {
        console.log('[REPORT-FORM] User does not have house/group assigned, redirecting to dashboard')
        router.push(`/${params.slug}/dashboard`)
        return
      }
      
      // Load data
      await loadMembers()
      setIsLoading(false)
    }
    checkAuth()
  }, [siteName, params.slug, checkSession, router])

  const loadMembers = async () => {
    try {
      const membersRef = collection(firestore, `cloned_sites/${params.slug}/users`)
      const membersSnapshot = await getDocs(membersRef)
      const membersList: Array<{id: string, username: string, houseName?: string}> = []
      membersSnapshot.forEach((doc) => {
        const data = doc.data()
        if (data.role !== 'admin') { // Exclude admin from target list
          membersList.push({
            id: doc.id,
            username: data.username || "",
            houseName: data.houseName || ""
          })
        }
      })
      setMembers(membersList)
    } catch (error) {
      console.error("Error loading members:", error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...files]
    }))
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files)
      setFormData(prev => ({
        ...prev,
        attachments: [...prev.attachments, ...files]
      }))
    }
  }

  const removeAttachment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }))
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="w-5 h-5 text-blue-400" />
    }
    return <File className="w-5 h-5 text-gray-400" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage(null)

    try {
      if (!formData.title || !formData.category || !formData.description) {
        setMessage({ type: 'error', text: 'กรุณากรอกข้อมูลให้ครบถ้วน' })
        setIsSubmitting(false)
        return
      }

      const reportData = {
        title: formData.title,
        category: formData.category,
        description: formData.description,
        priority: formData.priority,
        targetMember: formData.targetMember || null,
        reporterId: user?.id || "",
        reporterName: user?.username || "",
        status: "pending",
        createdAt: new Date(),
        timestamp: new Date().getTime(),
        attachments: formData.attachments.map(file => ({
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified
        }))
      }

      // Save to Firestore
      const reportsRef = collection(firestore, `cloned_sites/${params.slug}/reports`)
      await addDoc(reportsRef, reportData)

      // Log activity
      await logActivity(user.id, user.username, user.role, user.houseName, 'create_report', `ส่งรายงาน: ${formData.title} - ${formData.category}`)

      setMessage({ type: 'success', text: 'ส่งรายงานสำเร็จ! Admin จะได้รับการแจ้งเตือน' })
      
      // Reset form
      setFormData({
        title: "",
        category: "",
        description: "",
        priority: "medium",
        targetMember: "",
        attachments: []
      })

    } catch (error) {
      console.error("Error submitting report:", error)
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
                <h1 className="text-xl font-bold text-white">{siteName} - รายงานปัญหา</h1>
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
                className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-xl transition-all duration-300"
              >
                <Users className="w-5 h-5" />
                <span>Staff Dashboard</span>
              </Link>
              <Link
                href={`/${params.slug}/fine-form`}
                className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-xl transition-all duration-300"
              >
                <FileText className="w-5 h-5" />
                <span>แจ้งค่าปรับ</span>
              </Link>
              <div className="flex items-center gap-3 px-4 py-3 text-blue-400 bg-blue-600/20 border border-blue-500/30 rounded-xl">
                <MessageSquare className="w-5 h-5" />
                <span>รายงานปัญหา</span>
              </div>
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
                  <h2 className="text-3xl font-bold text-white mb-2">📢 รายงานปัญหา</h2>
                  <p className="text-gray-400">ส่งรายงานปัญหาให้ Admin เพื่อการแก้ไข</p>
                </div>
              </div>

              {/* Report Form */}
              <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Report Title */}
                  <div>
                    <label htmlFor="title" className="block text-gray-300 text-sm font-medium mb-2">
                      หัวข้อรายงาน <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                      placeholder="ระบุหัวข้อรายงานอย่างชัดเจน"
                      required
                    />
                  </div>

                  {/* Category Selection */}
                  <div>
                    <label htmlFor="category" className="block text-gray-300 text-sm font-medium mb-2">
                      ประเภทปัญหา <span className="text-red-400">*</span>
                    </label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                      required
                    >
                      <option value="">เลือกประเภทปัญหา</option>
                      {REPORT_CATEGORIES.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name} - {category.description}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Priority Selection */}
                  <div>
                    <label htmlFor="priority" className="block text-gray-300 text-sm font-medium mb-2">
                      ระดับความสำคัญ <span className="text-red-400">*</span>
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {PRIORITY_LEVELS.map((priority) => (
                        <label key={priority.value} className="relative">
                          <input
                            type="radio"
                            name="priority"
                            value={priority.value}
                            checked={formData.priority === priority.value}
                            onChange={handleInputChange}
                            className="sr-only"
                          />
                          <div className={`p-3 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                            formData.priority === priority.value
                              ? `border-${priority.color}-500 bg-${priority.color}-600/20`
                              : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
                          }`}>
                            <div className={`text-sm font-medium ${
                              formData.priority === priority.value
                                ? `text-${priority.color}-400`
                                : 'text-gray-300'
                            }`}>
                              {priority.label}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              {priority.description}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Target Member (Optional) */}
                  <div>
                    <label htmlFor="targetMember" className="block text-gray-300 text-sm font-medium mb-2">
                      สมาชิกที่เกี่ยวข้อง (ถ้ามี)
                    </label>
                    <select
                      id="targetMember"
                      name="targetMember"
                      value={formData.targetMember}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    >
                      <option value="">ไม่ระบุสมาชิกเฉพาะ</option>
                      {members.map((member) => (
                        <option key={member.id} value={member.username}>
                          {member.username} {member.houseName ? `(${member.houseName})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Description */}
                  <div>
                    <label htmlFor="description" className="block text-gray-300 text-sm font-medium mb-2">
                      รายละเอียดปัญหา <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={6}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 resize-none"
                      placeholder="อธิบายรายละเอียดของปัญหาให้ชัดเจน รวมถึงเวลา สถานที่ และผลกระทบที่เกิดขึ้น"
                      required
                    />
                  </div>

                  {/* File Upload */}
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      ไฟล์แนบ (ถ้ามี)
                    </label>
                    <div
                      className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-300 ${
                        dragActive
                          ? 'border-blue-500 bg-blue-600/10'
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                    >
                      <input
                        type="file"
                        multiple
                        onChange={handleFileUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        accept="image/*,.pdf,.doc,.docx,.txt"
                      />
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-300 mb-1">
                        ลากไฟล์มาวางที่นี่ หรือ <span className="text-blue-400">คลิกเพื่อเลือกไฟล์</span>
                      </p>
                      <p className="text-xs text-gray-400">
                        รองรับไฟล์: รูปภาพ, PDF, Word, Text (ขนาดไม่เกิน 10MB)
                      </p>
                    </div>

                    {/* File List */}
                    {formData.attachments.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {formData.attachments.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl">
                            <div className="flex items-center gap-3">
                              {getFileIcon(file)}
                              <div>
                                <div className="text-white text-sm">{file.name}</div>
                                <div className="text-gray-400 text-xs">{formatFileSize(file.size)}</div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeAttachment(index)}
                              className="p-1 text-red-400 hover:text-red-300 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
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
                    className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        กำลังส่งรายงาน...
                      </>
                    ) : (
                      <>
                        <MessageSquare className="w-5 h-5" />
                        ส่งรายงาน
                      </>
                    )}
                  </button>
                </form>
              </div>
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

export default function ClonedSiteReportFormPage() {
  return (
    <ClonedSiteAuthProvider>
      <ClonedSiteReportForm />
    </ClonedSiteAuthProvider>
  )
}

