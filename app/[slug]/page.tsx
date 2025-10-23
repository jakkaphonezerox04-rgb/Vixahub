"use client"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { createWebsiteFromSlug, getSpecialWebsiteData, isValidSlug, type Website } from "@/lib/website-data"

function ClonedSiteHomeContent() {
  const params = useParams<{ slug: string }>()
  const [website, setWebsite] = useState<Website | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadWebsite = () => {
      try {
        console.log(`[CLONED-SITE] Loading website for slug: ${params.slug}`)
        
        // ตรวจสอบว่า slug ถูกต้องหรือไม่
        if (!isValidSlug(params.slug)) {
          console.log(`[CLONED-SITE] Invalid slug: ${params.slug}`)
          setWebsite(null)
          setIsLoading(false)
          return
        }
        
        // ลองหาข้อมูลพิเศษก่อน
        let websiteData = getSpecialWebsiteData(params.slug)
        
        // ถ้าไม่มีข้อมูลพิเศษ ให้สร้างข้อมูลทั่วไป
        if (!websiteData) {
          websiteData = createWebsiteFromSlug(params.slug)
        }
        
        console.log(`[CLONED-SITE] Website data:`, websiteData)
        setWebsite(websiteData)
      } catch (error) {
        console.error("Error loading website:", error)
        setWebsite(null)
      } finally {
        setIsLoading(false)
      }
    }
    loadWebsite()
  }, [params.slug])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-black to-blue-950">
        <div className="text-white text-lg">กำลังโหลด...</div>
      </div>
    )
  }

  if (!website) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-black to-blue-950">
        <div className="text-white text-lg">ไม่พบเว็บไซต์</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-black to-blue-950">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">{website.name}</h1>
            <div className="flex space-x-4">
              <a 
                href={`/${params.slug}/login`}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                เข้าสู่ระบบ
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">
            ยินดีต้อนรับสู่ {website.name}
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            {website.description}
          </p>
          <div className="flex justify-center space-x-4">
            <a 
              href={`/${params.slug}/login`}
              className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-lg font-semibold"
            >
              เข้าสู่ระบบ
            </a>
            <a 
              href={`/${params.slug}/register`}
              className="px-8 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors text-lg font-semibold"
            >
              สมัครสมาชิก
            </a>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <h3 className="text-xl font-semibold text-white mb-4">ระบบจัดการทีม</h3>
            <p className="text-gray-300">
              จัดการสมาชิกและกิจกรรมของทีมอย่างมีประสิทธิภาพ
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <h3 className="text-xl font-semibold text-white mb-4">ระบบแชท</h3>
            <p className="text-gray-300">
              ติดต่อสื่อสารกับสมาชิกในทีมได้อย่างสะดวก
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <h3 className="text-xl font-semibold text-white mb-4">รายงานและสถิติ</h3>
            <p className="text-gray-300">
              ดูรายงานและสถิติการใช้งานของทีม
            </p>
          </div>
        </div>

        {/* Website Info */}
        <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
          <h3 className="text-xl font-semibold text-white mb-4">ข้อมูลเว็บไซต์</h3>
          <div className="grid md:grid-cols-2 gap-4 text-gray-300">
            <div>
              <strong>ชื่อเว็บไซต์:</strong> {website.name}
            </div>
            <div>
              <strong>แผน:</strong> {website.plan}
            </div>
            <div>
              <strong>สถานะ:</strong> {website.status}
            </div>
            <div>
              <strong>วันที่สร้าง:</strong> {website.createdDate}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-black/20 backdrop-blur-sm border-t border-white/10 mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-gray-400">
            <p>&copy; 2025 {website.name}. All rights reserved.</p>
            <p className="mt-2">Powered by VIXAHUB</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default function ClonedSiteHomePage() {
  return <ClonedSiteHomeContent />
}