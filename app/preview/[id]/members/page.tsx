"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ClonedSiteAuthProvider, useClonedSiteAuth } from "@/contexts/cloned-site-auth-context"
import Link from "next/link"
import { Home, FileText, Truck, MessageSquare, Settings, LogOut, Users, Mail, User, Shield, ShieldCheck } from "lucide-react"
import { collection, getDocs } from "firebase/firestore"
import { firestore } from "@/lib/firebase"

interface Member {
  id: string
  username: string
  email: string
  createdAt: any
}

function ClonedSiteMembers() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { user, logout, checkSession } = useClonedSiteAuth()
  const [siteName, setSiteName] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [members, setMembers] = useState<Member[]>([])

  useEffect(() => {
    const checkAuth = async () => {
      const sessionUser = await checkSession(params.id)
      if (!sessionUser) {
        router.push(`/preview/${params.id}/login`)
        return
      }
      
      await loadMembers()
      setIsLoading(false)
    }
    checkAuth()
  }, [params.id, checkSession, router])

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

  const loadMembers = async () => {
    try {
      const usersRef = collection(firestore, `cloned_sites/${params.id}/users`)
      const querySnapshot = await getDocs(usersRef)
      
      const membersList: Member[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        membersList.push({
          id: doc.id,
          username: data.username || "",
          email: data.email || "",
          createdAt: data.createdAt || null
        })
      })

      // Sort by creation date (newest first)
      membersList.sort((a, b) => {
        const timeA = a.createdAt?.toDate?.() || new Date(0)
        const timeB = b.createdAt?.toDate?.() || new Date(0)
        return timeB.getTime() - timeA.getTime()
      })

      setMembers(membersList)
    } catch (error) {
      console.error("Error loading members:", error)
    }
  }

  const handleLogout = () => {
    logout()
    router.push(`/preview/${params.id}/login`)
  }

  const formatDate = (timestamp: any) => {
    try {
      const date = timestamp?.toDate?.() || new Date(timestamp || 0)
      return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return "N/A"
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
              className="flex items-center gap-3 px-4 py-3 text-white bg-purple-600/20 border border-purple-500/30 rounded-xl hover:bg-purple-600/30 transition-all duration-300"
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
          <div className="max-w-6xl mx-auto">
            {/* Page Title */}
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <Users className="w-8 h-8 text-purple-400" />
                สมาชิกภายในบ้าน
              </h2>
              <p className="text-gray-400">รายชื่อสมาชิกทั้งหมดในเว็บไซต์</p>
            </div>

            {/* Stats */}
            <div className="mb-6 bg-gradient-to-br from-purple-600/20 to-purple-800/20 border border-purple-500/30 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-300 mb-1">จำนวนสมาชิกทั้งหมด</p>
                  <p className="text-4xl font-bold text-white">{members.length}</p>
                  <p className="text-xs text-purple-200 mt-1">คน</p>
                </div>
                <div className="w-16 h-16 bg-purple-600/30 rounded-full flex items-center justify-center">
                  <Users className="w-8 h-8 text-purple-300" />
                </div>
              </div>
            </div>

            {/* Members Grid */}
            {members.length === 0 ? (
              <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-12 text-center">
                <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-400 text-lg">ยังไม่มีสมาชิกในระบบ</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 hover:border-purple-500/30 hover:bg-gray-800/50 transition-all duration-300"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-600/30 to-blue-600/30 rounded-full flex items-center justify-center flex-shrink-0 border border-purple-500/30">
                        <User className="w-6 h-6 text-purple-300" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-white mb-1 truncate">
                          {member.username}
                          {member.id === user.id && (
                            <span className="ml-2 text-xs px-2 py-0.5 bg-blue-600/20 text-blue-400 rounded-full border border-blue-500/30">
                              คุณ
                            </span>
                          )}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                          <Mail className="w-3 h-3" />
                          <span className="truncate">{member.email}</span>
                        </div>
                        <p className="text-xs text-gray-500">
                          เข้าร่วมเมื่อ {formatDate(member.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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

export default function ClonedSiteMembersPage() {
  return (
    <ClonedSiteAuthProvider>
      <ClonedSiteMembers />
    </ClonedSiteAuthProvider>
  )
}

