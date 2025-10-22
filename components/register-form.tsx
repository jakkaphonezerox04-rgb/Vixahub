"use client"
import { useState } from "react"
import type React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, User, Mail, Lock, AlertCircle, CheckCircle } from "lucide-react"
import Logo from "./logo"
import { useAuth } from "@/contexts/auth-context"

export default function RegisterForm() {
  const router = useRouter()
  const { register, registerWithGoogle, isLoading } = useAuth()
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
    // Clear error when user starts typing
    if (error) setError("")
  }

  const validateForm = () => {
    if (!formData.username.trim()) {
      setError("กรุณากรอกชื่อผู้ใช้")
      return false
    }
    if (formData.username.length < 3) {
      setError("ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร")
      return false
    }
    if (!formData.email) {
      setError("กรุณากรอกอีเมล")
      return false
    }
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError("รูปแบบอีเมลไม่ถูกต้อง")
      return false
    }
    if (!formData.password) {
      setError("กรุณากรอกรหัสผ่าน")
      return false
    }
    if (formData.password.length < 6) {
      setError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร")
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน")
      return false
    }
    if (!formData.agreeToTerms) {
      setError("กรุณายอมรับข้อตกลงการใช้งาน")
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!validateForm()) {
      return
    }

    const result = await register(formData)

    if (result.success) {
      setSuccess(result.message)
      // Redirect to user dashboard after successful registration
      setTimeout(() => {
        router.push("/user-dashboard")
      }, 1000)
    } else {
      setError(result.message)
    }
  }

  const handleGoogleRegister = async () => {
    setError("")
    setSuccess("")
    
    const result = await registerWithGoogle()
    
    if (result.success) {
      setSuccess(result.message)
      setTimeout(() => {
        router.push("/user-dashboard")
      }, 1000)
    } else {
      setError(result.message)
    }
  }

  const handleSocialRegister = (provider: string) => {
    if (provider === "google") {
      handleGoogleRegister()
    } else {
      console.log(`Register with ${provider}`)
      setError("การสมัครผ่าน Social Media ยังไม่พร้อมใช้งาน")
    }
  }

  return (
    <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8">
      {/* Logo */}
      <div className="flex justify-center mb-8">
        <Logo size="lg" showText={false} className="justify-center" />
      </div>

      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">สร้างบัญชีของคุณ</h1>
        <p className="text-gray-400">
          มีบัญชีอยู่แล้ว?{" "}
          <Link href="/login" className="text-blue-400 hover:text-blue-300 transition-colors">
            เข้าสู่ระบบ
          </Link>
        </p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-600/20 border border-red-500/30 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <span className="text-red-400 text-sm">{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-600/20 border border-green-500/30 rounded-xl flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
          <span className="text-green-400 text-sm">{success}</span>
        </div>
      )}

      {/* Register Form */}
      <form onSubmit={handleSubmit} className="space-y-4 mb-6">
        {/* Username */}
        <div>
          <label htmlFor="username" className="block text-gray-300 text-sm font-medium mb-2">
            Username
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="Enter your username"
              className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              required
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">ใช้ได้เฉพาะตัวอักษร ตัวเลข และ _ (อย่างน้อย 3 ตัวอักษร)</p>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-gray-300 text-sm font-medium mb-2">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="your@email.com"
              className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              required
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-gray-300 text-sm font-medium mb-2">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="••••••••"
              className="w-full pl-10 pr-12 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร</p>
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="confirmPassword" className="block text-gray-300 text-sm font-medium mb-2">
            Confirm Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type={showConfirmPassword ? "text" : "password"}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="••••••••"
              className="w-full pl-10 pr-12 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Terms Agreement */}
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="agreeToTerms"
            name="agreeToTerms"
            checked={formData.agreeToTerms}
            onChange={handleInputChange}
            className="mt-1 w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded-xl focus:ring-blue-500 focus:ring-2"
            required
          />
          <label htmlFor="agreeToTerms" className="text-sm text-gray-300">
            ฉันยอมรับ{" "}
            <Link href="/terms" className="text-blue-400 hover:text-blue-300 transition-colors">
              ข้อตกลงการใช้งาน
            </Link>{" "}
            และ{" "}
            <Link href="/privacy" className="text-blue-400 hover:text-blue-300 transition-colors">
              นโยบายความเป็นส่วนตัว
            </Link>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white font-medium py-3 px-6 rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {isLoading ? "กำลังสร้างบัญชี..." : "สร้างบัญชี"}
        </button>
      </form>

      {/* Divider */}
      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-600"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-gray-900/50 text-gray-400">หรือดำเนินการต่อด้วย</span>
        </div>
      </div>

      {/* Social Register */}
      <button
        onClick={() => handleSocialRegister("google")}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white hover:bg-gray-700/50 transition-all duration-300 hover:scale-105"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        ลงทะเบียนด้วย Google
      </button>
    </div>
  )
}
