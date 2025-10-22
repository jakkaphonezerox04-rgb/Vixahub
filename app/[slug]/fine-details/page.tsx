"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ClonedSiteAuthProvider, useClonedSiteAuth } from "@/contexts/cloned-site-auth-context"
import Link from "next/link"
import { ArrowLeft, DollarSign, CheckCircle, XCircle, Home, FileText, Truck, MessageSquare, Settings, Users } from "lucide-react"
import { collection, query, where, getDocs } from "firebase/firestore"
import { firestore } from "@/lib/firebase"

interface FineRecord {
  id: string
  memberName: string
  fineItem: string
  amount: number
  reason: string
  timestamp: any
  staffUser: string
  status: string
}

function ClonedSiteFineDetails() {
  const params = useParams<{ slug: string }>()
  const router = useRouter()
  const { user, checkSession } = useClonedSiteAuth()
  const [siteName, setSiteName] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [fineRecords, setFineRecords] = useState<FineRecord[]>([])
  const [totalFines, setTotalFines] = useState(0)
  const [unpaidTotal, setUnpaidTotal] = useState(0)

  useEffect(() => {
    const checkAuth = async () => {
      const sessionUser = await checkSession(params.slug)
      if (!sessionUser) {
        router.push(`/${params.slug}/login`)
        return
      }
      
      await loadFineData(sessionUser.username)
      setIsLoading(false)
    }
    checkAuth()
  }, [params.slug, checkSession, router])

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

  const loadFineData = async (username: string) => {
    try {
      // Load fine records from Firestore
      const finesRef = collection(firestore, `cloned_sites/${params.slug}/fine_records`)
      const q = query(finesRef, where("memberName", "==", username))
      const querySnapshot = await getDocs(q)
      
      const records: FineRecord[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        records.push({
          id: doc.id,
          memberName: data.memberName || "",
          fineItem: data.fineItem || "",
          amount: data.amount || 0,
          reason: data.reason || "",
          timestamp: data.timestamp || data.createdAt,
          staffUser: data.staffUser || "System",
          status: data.status || "ยังไม่ชำระ"
        })
      })

      // Sort by timestamp (newest first)
      records.sort((a, b) => {
        const timeA = a.timestamp?.toDate?.() || new Date(a.timestamp || 0)
        const timeB = b.timestamp?.toDate?.() || new Date(b.timestamp || 0)
        return timeB.getTime() - timeA.getTime()
      })

      setFineRecords(records)

      // Calculate totals
      const total = records.reduce((sum, record) => sum + record.amount, 0)
      const unpaid = records
        .filter(record => record.status !== "ชำระแล้ว")
        .reduce((sum, record) => sum + record.amount, 0)
      
      setTotalFines(total)
      setUnpaidTotal(unpaid)
    } catch (error) {
      console.error("Error loading fine data:", error)
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-blue-950">
        <div className="text-white text-lg">กำลังโหลด...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-blue-950 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link
              href={`/${params.slug}/dashboard`}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 rounded-xl transition-all duration-300 border border-gray-600/50"
            >
              <ArrowLeft className="w-4 h-4" />
              กลับ
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <DollarSign className="w-8 h-8 text-red-400" />
                รายละเอียดค่าปรับ
              </h1>
              <p className="text-gray-400 mt-1">{user.username}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">{siteName}</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border border-blue-500/30 rounded-xl p-6">
            <p className="text-sm text-blue-300 mb-1">รายการทั้งหมด</p>
            <p className="text-3xl font-bold text-white">{fineRecords.length}</p>
            <p className="text-xs text-blue-200 mt-1">รายการ</p>
          </div>
          <div className="bg-gradient-to-br from-red-600/20 to-red-800/20 border border-red-500/30 rounded-xl p-6">
            <p className="text-sm text-red-300 mb-1">ค่าปรับทั้งหมด</p>
            <p className="text-3xl font-bold text-white">฿{totalFines.toLocaleString()}</p>
            <p className="text-xs text-red-200 mt-1">บาท</p>
          </div>
          <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 border border-yellow-500/30 rounded-xl p-6">
            <p className="text-sm text-yellow-300 mb-1">ยังไม่ชำระ</p>
            <p className="text-3xl font-bold text-white">฿{unpaidTotal.toLocaleString()}</p>
            <p className="text-xs text-yellow-200 mt-1">บาท</p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-gray-700/50">
            <h2 className="text-xl font-bold text-white">ประวัติค่าปรับ</h2>
          </div>
          
          {fineRecords.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <p className="text-gray-400 text-lg">ไม่พบรายการค่าปรับ</p>
              <p className="text-gray-500 text-sm mt-2">คุณไม่มีค่าปรับในระบบ</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">รายการปรับ</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">จำนวนเงิน</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">เหตุผล</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">วันที่</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">ผู้แจ้ง</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/30">
                  {fineRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{record.fineItem}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-400">
                        ฿{record.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">{record.reason || "-"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {formatDate(record.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{record.staffUser}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {record.status === "ชำระแล้ว" ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-600/20 border border-green-500/30 text-green-400 rounded-full text-xs font-medium">
                            <CheckCircle className="w-3 h-3" />
                            ชำระแล้ว
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-600/20 border border-red-500/30 text-red-400 rounded-full text-xs font-medium">
                            <XCircle className="w-3 h-3" />
                            ยังไม่ชำระ
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
export default function ClonedSiteFineDetailsPage() {
  return (
    <ClonedSiteAuthProvider>
      <ClonedSiteFineDetails />
    </ClonedSiteAuthProvider>
  )
}


