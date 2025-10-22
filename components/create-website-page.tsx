"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Globe, Crown, Users, Building, Zap, ArrowRight, Check, Loader2 } from "lucide-react"
import { createWebsite } from "@/lib/firebase-websites"
import { createSlug } from "@/lib/slug-utils"
import { useToast } from "@/contexts/toast-context"

export default function CreateWebsitePage() {
  const [isVisible, setIsVisible] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [websiteName, setWebsiteName] = useState("")
  const [subdomain, setSubdomain] = useState("")
  const [previewSlug, setPreviewSlug] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [isCheckingSubdomain, setIsCheckingSubdomain] = useState(false)
  const [subdomainError, setSubdomainError] = useState("")
  const router = useRouter()
  const { showSuccess, showError } = useToast()

  useEffect(() => {
    setIsVisible(true)
  }, [])

  // อัพเดท preview slug เมื่อชื่อเว็บไซต์เปลี่ยน
  useEffect(() => {
    if (websiteName.trim()) {
      setPreviewSlug(createSlug(websiteName))
    } else {
      setPreviewSlug("")
    }
  }, [websiteName])

  // ตรวจสอบ subdomain availability
  const checkSubdomainAvailability = async (subdomain: string) => {
    if (!subdomain.trim()) {
      setSubdomainError("")
      return
    }

    setIsCheckingSubdomain(true)
    setSubdomainError("")

    try {
      // ตรวจสอบ subdomain ผ่าน API
      const response = await fetch(`/api/check-subdomain?subdomain=${subdomain}`)
      const data = await response.json()
      
      if (!data.available) {
        setSubdomainError("โดเมนนี้มีคนใช้แล้ว กรุณาเลือกโดเมนอื่น")
      }
    } catch (error) {
      console.error("Error checking subdomain:", error)
      setSubdomainError("ไม่สามารถตรวจสอบโดเมนได้")
    } finally {
      setIsCheckingSubdomain(false)
    }
  }

  // ตรวจสอบ subdomain เมื่อมีการเปลี่ยนแปลง
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (subdomain.trim()) {
        checkSubdomainAvailability(subdomain)
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [subdomain])

  const websitePlans = [
    {
      id: "family",
      name: "FAMILY SYSTEM",
      nameEn: "ระบบจัดการครอบครัวขั้นพื้นฐาน",
      price: "199",
      period: "/เดือน",
      popular: true,
      description: "เหมาะสำหรับครอบครัวและกลุ่มเล็ก",
      features: [
        "จัดการสมาชิก 10 คน",
        "ระบบแชทพื้นฐาน",
        "การจัดตารางงาน",
        "รายงานกิจกรรม",
        "การแจ้งเตือนพื้นฐาน",
        "ฝึกอบรมออนไลน์",
        "ซัพพอร์ต 24/7",
        "การสำรองข้อมูล",
      ],
      icon: Users,
      gradient: "from-blue-600 to-purple-600",
    },
    {
      id: "gang",
      name: "GANG SYSTEM",
      nameEn: "ระบบจัดการแก๊งและทีมงาน",
      price: "299",
      period: "/เดือน",
      popular: false,
      description: "เหมาะสำหรับธุรกิจขนาดเล็กและทีมงาน",
      features: [
        "จัดการสมาชิก 25 คน",
        "ระบบแชทขั้นสูง",
        "การจัดการโปรเจค",
        "ระบบคะแนนและรางวัล",
        "การวิเคราะห์ผลงาน",
        "การปรับแต่งส่วนตัว",
        "API พื้นฐาน",
        "การฝึกอบรมเฉพาะทาง",
      ],
      icon: Crown,
      gradient: "from-gray-600 to-gray-800",
    },
    {
      id: "agency",
      name: "AGENCY SYSTEM",
      nameEn: "ระบบจัดการหน่วยงานขนาดใหญ่",
      price: "499",
      period: "/เดือน",
      popular: false,
      description: "เหมาะสำหรับองค์กรและหน่วยงานขนาดใหญ่",
      features: [
        "จัดการสมาชิกไม่จำกัด",
        "ระบบแชทแบบองค์กร",
        "การจัดการหลายโปรเจค",
        "ระบบอนุมัติขั้นสูง",
        "รายงานและวิเคราะห์ขั้นสูง",
        "การผิดพลาดแบบเรียลไทม์",
        "ผู้จัดการเฉพาะ",
        "การฝึกอบรมแบบองค์กร",
      ],
      icon: Building,
      gradient: "from-green-600 to-teal-600",
    },
    {
      id: "admin",
      name: "ADMIN SYSTEM",
      nameEn: "ระบบจัดการระดับผู้ดูแลระบบ",
      price: "699",
      period: "/เดือน",
      popular: false,
      description: "เหมาะสำหรับองค์กรขนาดใหญ่และระดับองค์กร",
      features: [
        "การจัดการขั้นสูงทั้งหมด",
        "การปรับแต่งระบบเต็มรูปแบบ",
        "การผสานระบบภายนอก",
        "การวิเคราะห์ขั้นสูงและ AI",
        "ซัพพอร์ตลำดับความสำคัญ",
        "ผู้จัดการเฉพาะทาง",
        "การฝึกอบรมแบบกำหนดเอง",
        "ตัวเลือก White-label",
      ],
      icon: Zap,
      gradient: "from-purple-600 to-pink-600",
    },
  ]

  const handleCreateWebsite = async () => {
    if (!selectedPlan || !websiteName.trim() || !subdomain.trim()) {
      showError("กรุณากรอกข้อมูลให้ครบ", "กรุณาเลือกแพ็กเกจ กรอกชื่อเว็บไซต์ และโดเมนย่อย")
      return
    }

    // ตรวจสอบ subdomain อีกครั้งก่อนสร้าง
    if (isCheckingSubdomain) {
      showError("กำลังตรวจสอบโดเมน", "กรุณารอสักครู่")
      return
    }

    if (subdomainError) {
      showError("โดเมนไม่ถูกต้อง", "กรุณาเลือกโดเมนย่อยที่ใช้ได้")
      return
    }

    setIsCreating(true)
    console.log("[CREATE] Starting website creation:", { selectedPlan, websiteName, subdomain })

    try {
      // ตรวจสอบ subdomain อีกครั้งก่อนสร้าง
      console.log("[CREATE] Double-checking subdomain availability...")
      const response = await fetch(`/api/check-subdomain?subdomain=${subdomain}`)
      const data = await response.json()
      
      if (!data.available) {
        showError("โดเมนไม่สามารถใช้ได้", data.error || "โดเมนนี้มีคนใช้แล้ว กรุณาเลือกโดเมนอื่น")
        return
      }

      const selectedPlanData = websitePlans.find((plan) => plan.id === selectedPlan)

      const planThumbnail: Record<string, string> = {
        family: "/portfolio-website-showcase.png",
        gang: "/ecommerce-store.png",
        agency: "/portfolio-website-showcase.png",
        admin: "/portfolio-website-showcase.png",
      }

      // สร้างเว็บไซต์ใน Firebase
      console.log("[CREATE] Calling createWebsite...")
      const result = await createWebsite({
        name: websiteName.trim(),
        plan: selectedPlanData?.name || selectedPlan,
        thumbnail: planThumbnail[selectedPlan] || "/portfolio-website-showcase.png",
        description: selectedPlanData?.description || "",
        subdomain: subdomain.trim(),
      })

      console.log("[CREATE] Result:", result)

      if (result.success && result.slug) {
        // แสดงข้อความสำเร็จ
        console.log("[CREATE] Success! Slug:", result.slug)
        showSuccess(
          `สร้างเว็บไซต์ "${websiteName}" สำเร็จ!`,
          `URL: ${subdomain}.vixahub-2.vercel.app`
        )
        
        // Reset form
        setWebsiteName("")
        setSubdomain("")
        setSelectedPlan(null)
        
        // Redirect กลับไปหน้า My Websites หลัง 1.5 วินาที
        setTimeout(() => {
          console.log("[CREATE] Redirecting to my-websites...")
          router.push('/user-dashboard/my-websites')
        }, 1500)
      } else {
        console.error("[CREATE] Failed:", result.error)
        showError("เกิดข้อผิดพลาด", result.error || "ไม่สามารถสร้างเว็บไซต์ได้")
      }
    } catch (e) {
      console.error("[CREATE] Exception:", e)
      showError("เกิดข้อผิดพลาด", "กรุณาลองใหม่อีกครั้ง")
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="space-y-6">


      {/* Website Name Input */}
      <div
        className={`transform transition-all duration-1000 delay-200 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
        }`}
      >
        <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6">ข้อมูลเว็บไซต์</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">ชื่อเว็บไซต์</label>
              <input
                type="text"
                value={websiteName}
                onChange={(e) => setWebsiteName(e.target.value)}
                placeholder="กรอกชื่อเว็บไซต์ของคุณ"
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
              />
            </div>
            
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                โดเมนย่อย (Subdomain)
                {isCheckingSubdomain && (
                  <span className="ml-2 text-blue-400 text-xs">กำลังตรวจสอบ...</span>
                )}
              </label>
              <input
                type="text"
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="กรอกโดเมนย่อยที่ต้องการ (เช่น test, gang-system)"
                className={`w-full px-4 py-3 bg-gray-800/50 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 ${
                  subdomainError ? 'border-red-500' : 'border-gray-600/50'
                }`}
              />
              {subdomainError && (
                <p className="text-red-400 text-sm mt-2">{subdomainError}</p>
              )}
              <p className="text-gray-500 text-sm mt-2">
                URL ของเว็บไซต์: <span className="text-purple-400 font-medium">
                  {subdomain ? `${subdomain}.vixahub-2.vercel.app` : 'your-subdomain.vixahub-2.vercel.app'}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Plan Selection */}
      <div
        className={`transform transition-all duration-1000 delay-400 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
        }`}
      >
        <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6">เลือกแพ็กเกจ</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {websitePlans.map((plan) => {
              const Icon = plan.icon
              const isSelected = selectedPlan === plan.id

              return (
                <div
                  key={plan.id}
                  className={`relative cursor-pointer transform transition-all duration-300 hover:scale-105 ${
                    isSelected ? "scale-105" : ""
                  }`}
                  onClick={() => setSelectedPlan(plan.id)}
                >


                  {/* Card */}
                  <div
                    className={`relative h-full bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border-2 rounded-xl p-6 transition-all duration-300 ${
                      isSelected
                        ? "border-purple-500 bg-purple-600/10"
                        : "border-gray-700/50 hover:border-purple-500/50"
                    }`}
                  >
                    {/* Selection Indicator */}
                    {isSelected && (
                      <div className="absolute top-4 right-4 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}

                    {/* Gradient Overlay */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${plan.gradient} opacity-0 hover:opacity-10 transition-opacity duration-300 rounded-xl`}
                    ></div>

                    <div className="relative z-10">
                      {/* Plan Header */}
                      <div className="mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                          <p className="text-gray-400 text-sm">{plan.nameEn}</p>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="mb-4">
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-bold text-white">฿{plan.price}</span>
                          <span className="text-gray-400">{plan.period}</span>
                        </div>
                        <p className="text-gray-300 text-sm mt-1">{plan.description}</p>
                      </div>

                      {/* Features */}
                      <div className="space-y-2">
                        {plan.features.slice(0, 4).map((feature, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                            <span className="text-gray-300 text-sm">{feature}</span>
                          </div>
                        ))}
                        {plan.features.length > 4 && (
                          <p className="text-gray-400 text-sm">และอีก {plan.features.length - 4} ฟีเจอร์...</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Summary & Create Button */}
      <div
        className={`transform transition-all duration-1000 delay-600 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
        }`}
      >
        <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6">สรุปการสร้างเว็บไซต์</h2>

          {selectedPlan && websiteName && (
            <div className="bg-gray-800/50 rounded-xl p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-white font-medium mb-2">ข้อมูลเว็บไซต์</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">ชื่อเว็บไซต์:</span>
                      <span className="text-white">{websiteName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">URL:</span>
                      <span className="text-purple-400">vixahub.web.app/{previewSlug}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-white font-medium mb-2">แพ็กเกจที่เลือก</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">แพ็กเกจ:</span>
                      <span className="text-white">{websitePlans.find((p) => p.id === selectedPlan)?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">ราคา:</span>
                      <span className="text-green-400">
                        ฿{websitePlans.find((p) => p.id === selectedPlan)?.price}/เดือน
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleCreateWebsite}
            disabled={!selectedPlan || !websiteName.trim() || isCreating}
            className="group relative w-full bg-gradient-to-br from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 border border-gray-600/50 hover:border-purple-500/50 text-white font-medium py-4 px-6 rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-3 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            {isCreating ? (
              <>
                <Loader2 className="w-5 h-5 relative z-10 animate-spin" />
                <span className="relative z-10">กำลังสร้างเว็บไซต์...</span>
              </>
            ) : (
              <>
                <Globe className="w-5 h-5 relative z-10 group-hover:scale-110 transition-transform duration-300" />
                <span className="relative z-10">สร้างเว็บไซต์</span>
                <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform duration-300" />
              </>
            )}
          </button>

          <p className="text-gray-500 text-sm text-center mt-4">
            หลังจากสร้างเว็บไซต์แล้ว คุณจะได้รับอีเมลยืนยันและสามารถเข้าใช้งานได้ทันที
          </p>
        </div>
      </div>
    </div>
  )
}
