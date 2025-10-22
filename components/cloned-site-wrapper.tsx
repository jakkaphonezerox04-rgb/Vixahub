/**
 * Cloned Site Wrapper Component
 * Component สำหรับห่อหุ้มหน้าต่างๆ ของเว็บไซต์ที่ถูกโคลน
 * จัดการ loading state และ error handling
 */

"use client"
import { useEffect, useState, ReactNode } from "react"
import { useParams, useRouter } from "next/navigation"
import { getWebsiteBySlug, Website } from "@/lib/firebase-websites"

interface ClonedSiteWrapperProps {
  children: (website: Website) => ReactNode
  requireAuth?: boolean
}

export default function ClonedSiteWrapper({ children, requireAuth = false }: ClonedSiteWrapperProps) {
  const params = useParams<{ slug: string }>()
  const router = useRouter()
  const [website, setWebsite] = useState<Website | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>("")

  useEffect(() => {
    const loadWebsite = async () => {
      try {
        const site = await getWebsiteBySlug(params.slug)
        if (site) {
          setWebsite(site)
        } else {
          setError("ไม่พบเว็บไซต์")
        }
      } catch (err) {
        console.error("Error loading website:", err)
        setError("เกิดข้อผิดพลาดในการโหลดข้อมูลเว็บไซต์")
      } finally {
        setIsLoading(false)
      }
    }
    loadWebsite()
  }, [params.slug])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-blue-950">
        <div className="text-white text-lg">กำลังโหลด...</div>
      </div>
    )
  }

  if (error || !website) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-black to-blue-950 px-6">
        <div className="max-w-md w-full bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-white mb-2">ไม่พบเว็บไซต์</h2>
          <p className="text-gray-400 mb-6">{error || "เว็บไซต์ที่คุณกำลังมองหาไม่มีอยู่ในระบบ"}</p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-colors"
          >
            กลับหน้าหลัก
          </a>
        </div>
      </div>
    )
  }

  return <>{children(website)}</>
}

