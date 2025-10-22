"use client"
import { useState } from "react"
import type React from "react"

import Link from "next/link"
import { Mail, ArrowLeft } from "lucide-react"
import Logo from "./logo"

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    console.log("Forgot password submitted:", email)
    setIsSubmitted(true)
    setIsLoading(false)
  }

  if (isSubmitted) {
    return (
      <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8 text-center">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Mail className="w-8 h-8 text-green-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-4">ตรวจสอบอีเมลของคุณ</h1>
        <p className="text-gray-300 mb-6">
          เราได้ส่งลิงก์สำหรับรีเซ็ตรหัสผ่านไปยัง
          <br />
          <span className="text-blue-400">{email}</span>
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          กลับไปหน้าเข้าสู่ระบบ
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8">
      {/* Logo */}
      <div className="flex justify-center mb-8">
        <Logo size="lg" showText={false} className="justify-center" />
      </div>

      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">ลืมรหัสผ่าน?</h1>
        <p className="text-gray-400">กรอกอีเมลของคุณเพื่อรีเซ็ตรหัสผ่าน</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-gray-300 text-sm font-medium mb-2">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white font-medium py-3 px-6 rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "กำลังส่ง..." : "ส่งลิงก์รีเซ็ตรหัสผ่าน"}
        </button>
      </form>

      {/* Back to Login */}
      <div className="text-center mt-6">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-300 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          กลับไปหน้าเข้าสู่ระบบ
        </Link>
      </div>
    </div>
  )
}
