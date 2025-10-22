"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"

interface ClonedSite {
  id: string
  name: string
  url: string
  plan: string
  thumbnail: string
  description: string
}

export default function ClonedPreviewPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [site, setSite] = useState<ClonedSite | null>(null)

  // Check if user is logged in, if yes redirect to dashboard, else to login
  useEffect(() => {
    if (params?.id && typeof window !== "undefined") {
      const sessionData = sessionStorage.getItem(`cloned_site_session_${params.id}`)
      if (sessionData) {
        router.replace(`/preview/${params.id}/dashboard`)
      } else {
        router.replace(`/preview/${params.id}/login`)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.id])

  useEffect(() => {
    try {
      const raw = localStorage.getItem("websites")
      const list: ClonedSite[] = raw ? JSON.parse(raw) : []
      const found = list.find((s) => s.id === params.id)
      setSite(found || null)
    } catch {
      setSite(null)
    }
  }, [params.id])

  if (!site) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-black to-blue-950">
        <div className="text-center text-gray-300">
          <p className="mb-4">ไม่พบเว็บไซต์สำหรับพรีวิว</p>
          <Link href="/user-dashboard/my-websites" className="px-4 py-2 bg-purple-600 text-white rounded-xl">กลับไปที่รายการเว็บไซต์</Link>
        </div>
      </div>
    )
  }

  const planTheme: Record<string, { gradient: string; accent: string }> = {
    "FAMILY SYSTEM": { gradient: "from-blue-600 to-purple-600", accent: "text-blue-300" },
    "GANG SYSTEM": { gradient: "from-gray-600 to-gray-800", accent: "text-gray-300" },
    "AGENCY SYSTEM": { gradient: "from-green-600 to-teal-600", accent: "text-green-300" },
    "ADMIN SYSTEM": { gradient: "from-purple-600 to-pink-600", accent: "text-pink-300" },
  }
  const theme = planTheme[site.plan] || planTheme["FAMILY SYSTEM"]

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-black to-blue-950">
      <header className="px-6 py-4 mx-auto max-w-6xl">
        <div className="flex items-center justify-between">
          <h1 className="text-white font-bold text-xl">{site.name}</h1>
          <div className="flex gap-2">
            <Link href={`/preview/${site.id}/login`} className="px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/15">Login</Link>
            <Link href={`/preview/${site.id}/register`} className="px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/15">Register</Link>
            <Link href="/user-dashboard/my-websites" className="px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/15">กลับไปจัดการ</Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24">
        {/* Hero */}
        <section className={`mt-6 bg-gradient-to-r ${theme.gradient} rounded-xl p-8 text-white overflow-hidden`}> 
          <h2 className="text-3xl md:text-4xl font-bold mb-2">เว็บไซต์ตัวอย่างของ {site.name}</h2>
          <p className="text-white/80">แพ็กเกจ: <span className="font-semibold">{site.plan}</span></p>
          <p className="mt-4 max-w-2xl">{site.description || "นี่คือเว็บไซต์ที่โคลนขึ้นมาแบบเร็วเพื่อทดสอบการทำงานของระบบโคลน คุณสามารถปรับแต่งเนื้อหาและดีไซน์เพิ่มเติมได้ภายหลัง."}</p>
          <div className="mt-6">
            <Link href={`/preview/${site.id}`} className="inline-block px-5 py-2 bg-black/30 rounded-xl hover:bg-black/40">เปิดพรีวิว: {site.url}</Link>
          </div>
        </section>

        {/* Content blocks */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-gray-900/60 border border-gray-700/50 rounded-xl p-6">
            <h3 className={`text-lg font-semibold ${theme.accent}`}>ส่วนหัวข้อที่ 1</h3>
            <p className="text-gray-300 mt-2">คอนเทนต์ตัวอย่างสำหรับพรีวิวเว็บไซต์</p>
          </div>
          <div className="bg-gray-900/60 border border-gray-700/50 rounded-xl p-6">
            <h3 className={`text-lg font-semibold ${theme.accent}`}>ส่วนหัวข้อที่ 2</h3>
            <p className="text-gray-300 mt-2">เพิ่มรายละเอียดสินค้า/บริการได้ที่นี่</p>
          </div>
          <div className="bg-gray-900/60 border border-gray-700/50 rounded-xl p-6">
            <h3 className={`text-lg font-semibold ${theme.accent}`}>ส่วนหัวข้อที่ 3</h3>
            <p className="text-gray-300 mt-2">แก้ไขเลย์เอาต์นี้ในภายหลังได้</p>
          </div>
        </section>
      </main>
    </div>
  )
}


