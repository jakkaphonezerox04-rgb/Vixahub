"use client"
import Link from "next/link"
import { useEffect, useState } from "react"
import Logo from "./logo"
import { GlareCard } from "./ui/glare-card"
import { Component as ImageAutoSlider } from "./ui/image-auto-slider"

export default function HeroSection() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <>
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-float:nth-child(2) {
          animation-delay: 0.5s;
        }
        .animate-float:nth-child(3) {
          animation-delay: 1s;
        }
        .animate-float:nth-child(4) {
          animation-delay: 1.5s;
        }
        .animate-float:nth-child(5) {
          animation-delay: 2s;
        }
      `}</style>
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-black via-black to-blue-950 transition-all duration-1000">
        {/* Background gradient effect */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(30,64,175,0.3),transparent_70%)] animate-pulse"></div>

        {/* Navigation */}
        <header
          className={`relative z-10 px-6 py-4 mx-auto max-w-7xl transform transition-all duration-1000 ${isVisible ? "translate-y-0 opacity-100" : "-translate-y-10 opacity-0"}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center text-left">
              <Logo size="md" showText={true} />
              <nav className="hidden ml-12 space-x-8 md:flex">
                {[
                  { name: "Home", href: "/" },
                  { name: "Price", href: "/pricing" },
                  { name: "Contact", href: "/contact" },
                ].map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="text-gray-300 hover:text-white transition-all duration-300 hover:scale-105 relative group"
                  >
                    {item.name}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full"></span>
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/login"
                className="px-4 py-2 text-white hover:text-gray-200 transition-all duration-300 hover:scale-105 hover:bg-white/10 rounded-xl"
              >
                Log In
              </Link>
            </div>
          </div>
        </header>

        {/* Hero Content */}
        <main className="relative z-10 flex flex-col items-center justify-center px-6 pt-20 pb-32 mx-auto text-center max-w-7xl">
          {/* Large Logo in Hero */}
          <div
            className={`mb-8 transform transition-all duration-1000 delay-200 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
          >
            <Logo size="lg" showText={false} className="justify-center" />
          </div>

          <h1
            className={`max-w-4xl mx-auto text-4xl font-bold text-white md:text-5xl lg:text-6xl transform transition-all duration-1000 delay-300 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
          >
            บริการระบบ
            <br />
            จัดการทีมเพื่อเพิ่ม
            <br />
            ประสิทธิภาพสูงสุด
          </h1>
          <p
            className={`max-w-2xl mx-auto mt-6 text-lg text-gray-300 transform transition-all duration-1000 delay-500 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
          >
            ระบบจัดการทีมอย่างมีประสิทธิภาพ ทั้งการเล่นและการทำงาน
            <br />
            ไม่ว่าจะเป็น แก๊ง ครอบครัว หน่วยงาน ทีมงาน ก็สามารถทำงานและเล่นให้เป็นระบบได้
            <br />
            ให้เกมส์เป็นได้มากกว่าเกมส์
          </p>
          <div
            className={`flex flex-col mt-10 space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 transform transition-all duration-1000 delay-700 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
          >
            <Link
              href="/pricing"
              className="group flex items-center justify-center px-8 py-3 text-lg font-medium text-gray-900 bg-white rounded-xl-md hover:bg-gray-100 transition-all duration-300 hover:scale-105 hover:shadow-lg transform"
            >
              เริ่มต้นใช้งาน
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5 ml-2 transition-transform duration-300 group-hover:translate-x-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </Link>
          </div>

          {/* Auto Slide Images */}
          <div
            className={`w-full mt-20 transform transition-all duration-1000 delay-1000 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
          >
            <ImageAutoSlider />
          </div>

          {/* System Features Section */}
          <div
            className={`w-full mt-16 transform transition-all duration-1000 delay-1200 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
          >
            <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">
              ระบบที่เราให้บริการ
            </h2>
            <p className="mb-12 text-lg text-gray-400">
              เลือกระบบที่เหมาะสมกับองค์กรของคุณ
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
              {/* Family System */}
              <div className="h-[400px]">
                <GlareCard className="flex flex-col justify-center items-center p-8 text-center">
                  <h3 className="text-3xl font-bold text-white mb-6">FAMILY SYSTEM</h3>
                  <p className="text-gray-400 text-lg mb-8">ระบบจัดการครอบครัวขั้นพื้นฐาน</p>
                  <ul className="text-gray-300 text-base space-y-4">
                    <li>• จัดการสมาชิก 10 คน</li>
                    <li>• ระบบแชทพื้นฐาน</li>
                    <li>• การจัดตารางงาน</li>
                    <li>• รายงานกิจกรรม</li>
                  </ul>
                </GlareCard>
              </div>

              {/* Gang System */}
              <div className="h-[400px]">
                <GlareCard className="flex flex-col justify-center items-center p-8 text-center">
                  <h3 className="text-3xl font-bold text-white mb-6">GANG SYSTEM</h3>
                  <p className="text-gray-400 text-lg mb-8">ระบบจัดการแก๊งและทีมงาน</p>
                  <ul className="text-gray-300 text-base space-y-4">
                    <li>• จัดการสมาชิก 25 คน</li>
                    <li>• ระบบแชทขั้นสูง</li>
                    <li>• การจัดการโปรเจค</li>
                    <li>• ระบบคะแนนและรางวัล</li>
                  </ul>
                </GlareCard>
              </div>

              {/* Agency System */}
              <div className="h-[400px]">
                <GlareCard className="flex flex-col justify-center items-center p-8 text-center">
                  <h3 className="text-3xl font-bold text-white mb-6">AGENCY SYSTEM</h3>
                  <p className="text-gray-400 text-lg mb-8">ระบบจัดการหน่วยงานขนาดใหญ่</p>
                  <ul className="text-gray-300 text-base space-y-4">
                    <li>• จัดการสมาชิกไม่จำกัด</li>
                    <li>• ระบบแชทแบบองค์กร</li>
                    <li>• การจัดการหลายโปรเจค</li>
                    <li>• รายงานและวิเคราะห์ขั้นสูง</li>
                  </ul>
                </GlareCard>
              </div>

              {/* Admin System */}
              <div className="h-[400px]">
                <GlareCard className="flex flex-col justify-center items-center p-8 text-center">
                  <h3 className="text-3xl font-bold text-white mb-6">ADMIN SYSTEM</h3>
                  <p className="text-gray-400 text-lg mb-8">ระบบจัดการระดับผู้ดูแลระบบ</p>
                  <ul className="text-gray-300 text-base space-y-4">
                    <li>• การจัดการขั้นสูงทั้งหมด</li>
                    <li>• การปรับแต่งระบบเต็มรูปแบบ</li>
                    <li>• การผสานระบบภายนอก</li>
                    <li>• การวิเคราะห์ขั้นสูงและ AI</li>
                  </ul>
                </GlareCard>
              </div>
            </div>
          </div>

          {/* Partners Section */}
          <div
            className={`w-full mt-24 transform transition-all duration-1000 delay-1400 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
          >
            <p className="mb-8 text-gray-400">
              Copyright © 2025 VIXAHUB. All rights reserved.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
              {/* VIXAHUB logo text repeated */}
              <div className="text-white transition-all duration-300 hover:scale-110 hover:text-blue-300 cursor-pointer animate-float">
                <span className="text-2xl font-bold text-white">VIXAHUB</span>
              </div>
              <div className="text-white transition-all duration-300 hover:scale-110 hover:text-blue-300 cursor-pointer animate-float">
                <span className="text-2xl font-bold text-white">VIXAHUB</span>
              </div>
              <div className="text-white transition-all duration-300 hover:scale-110 hover:text-blue-300 cursor-pointer animate-float">
                <span className="text-2xl font-bold text-white">VIXAHUB</span>
              </div>
              <div className="text-white transition-all duration-300 hover:scale-110 hover:text-blue-300 cursor-pointer animate-float">
                <span className="text-2xl font-bold text-white">VIXAHUB</span>
              </div>
              <div className="text-white transition-all duration-300 hover:scale-110 hover:text-blue-300 cursor-pointer animate-float">
                <span className="text-2xl font-bold text-white">VIXAHUB</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
