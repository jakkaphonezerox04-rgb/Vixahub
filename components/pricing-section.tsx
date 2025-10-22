"use client"
import Link from "next/link"
import { Check, Star } from "lucide-react"
import { useEffect, useState } from "react"

const pricingPlans = [
  {
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
    buttonText: "เริ่มต้นใช้งาน",
    gradient: "from-gray-600 to-gray-800",
  },
  {
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
    buttonText: "เริ่มต้นใช้งาน",
    gradient: "from-blue-600 to-purple-600",
  },
  {
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
    buttonText: "เริ่มต้นใช้งาน",
    gradient: "from-green-600 to-teal-600",
  },
  {
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
    buttonText: "ติดต่อเรา",
    gradient: "from-purple-600 to-pink-600",
  },
]

export default function PricingSection() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <div className="relative py-20">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.1),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(147,51,234,0.1),transparent_50%)]"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Header */}
        <div
          className={`text-center mb-16 transform transition-all duration-1000 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
            เลือกแพ็กเกจ<span className="text-blue-400">ของคุณ</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">เลือกรูปแบบการใช้งานให้เหมาะกับทีมของคุณ</p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {pricingPlans.map((plan, index) => (
            <div
              key={plan.name}
              className={`relative ${
                plan.name === "FAMILY SYSTEM" 
                  ? `transform transition-all duration-500 delay-0 ${
                      isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
                    }`
                  : ""
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20 transition-transform duration-300 group-hover:scale-105">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                    <Star className="w-4 h-4 fill-current" />
                    ยอดนิยม
                  </div>
                </div>
              )}

              {/* Card */}
              <div
                className={`relative h-full bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8 transition-all duration-300 hover:scale-105 hover:border-blue-500/50 group flex flex-col ${
                  plan.popular ? "ring-2 ring-blue-500/30" : ""
                }`}
              >
                {/* Gradient Overlay */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${plan.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-xl`}
                ></div>

                <div className="relative z-10 flex flex-col h-full">
                  {/* Plan Name */}
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                    <p className="text-gray-400 text-sm">{plan.nameEn}</p>
                    <p className="text-gray-300 text-sm mt-2">{plan.description}</p>
                  </div>

                  {/* Price */}
                  <div className="mb-8">
                    <div className="flex items-baseline">
                      <span className="text-4xl font-bold text-white">฿{plan.price}</span>
                      <span className="text-gray-400 ml-2">{plan.period}</span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="mb-8 flex-grow">
                    <ul className="space-y-4">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center mt-0.5">
                            <Check className="w-3 h-3 text-green-400" />
                          </div>
                          <span className="text-gray-300 text-sm leading-relaxed">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA Button */}
                  <div className="mt-auto">
                    <Link
                      href={plan.name === "ADMIN SYSTEM" ? "/contact" : "/signup"}
                      className={`block w-full text-center py-3 px-6 rounded-xl font-medium transition-all duration-300 ${
                        plan.popular
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 hover:scale-105 hover:shadow-lg"
                          : "bg-gray-800 text-white hover:bg-gray-700 hover:scale-105"
                      }`}
                    >
                      {plan.buttonText}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div
          className={`text-center mt-16 transform transition-all duration-1000 delay-1000 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
        >
          <p className="text-gray-400 mb-6">
            ต้องการคำปรึกษาเพิ่มเติม?{" "}
            <Link href="/contact" className="text-blue-400 hover:text-blue-300 transition-colors">
              ติดต่อทีม VIXAHUB
            </Link>
          </p>
          <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-500">
            <span>✓ ทดลองใช้ฟรี 14 วัน</span>
            <span>✓ ยกเลิกได้ตลอดเวลา</span>
            <span>✓ ซัพพอร์ต 24/7</span>
            <span>✓ การันตีความพึงพอใจ</span>
          </div>
        </div>
      </div>
    </div>
  )
}
