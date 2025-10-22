"use client"
import { useState, useEffect } from "react"
import type React from "react"
import Link from "next/link"
import { Eye, EyeOff, Mail, Lock, AlertCircle, CheckCircle } from "lucide-react"

interface ClonedSiteLoginFormProps {
  siteId: string
  siteName: string
  onLogin: (email: string, password: string) => Promise<{ success: boolean; message: string }>
  onGoogleLogin?: () => Promise<{ success: boolean; message: string }>
  onSuccess: () => void
}

export default function ClonedSiteLoginForm({ siteId, siteName, onLogin, onGoogleLogin, onSuccess }: ClonedSiteLoginFormProps) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [persistentError, setPersistentError] = useState("")

  // ตรวจสอบ localStorage เมื่อ component mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedError = localStorage.getItem("cloned_site_error")
      const storedTimestamp = localStorage.getItem("cloned_site_error_timestamp")
      
      if (storedError && storedTimestamp) {
        const errorAge = Date.now() - parseInt(storedTimestamp)
        // แสดง error ถ้าไม่เกิน 10 วินาที
        if (errorAge < 10000) {
          console.log("Restoring error from localStorage:", storedError)
          setPersistentError(storedError)
          setError(storedError)
          
          // ลบ error หลังจากแสดง
          setTimeout(() => {
            localStorage.removeItem("cloned_site_error")
            localStorage.removeItem("cloned_site_error_timestamp")
            setPersistentError("")
            setError("")
          }, 5000)
        }
      }
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    if (error) setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!formData.email || !formData.password) {
      setError("กรุณากรอกอีเมลและรหัสผ่าน")
      return
    }

    setIsLoading(true)
    const result = await onLogin(formData.email, formData.password)
    setIsLoading(false)

    if (result.success) {
      setSuccess(result.message)
      setTimeout(() => {
        onSuccess()
      }, 1000)
    } else {
      setError(result.message)
    }
  }

  const handleGoogleLogin = async () => {
    if (!onGoogleLogin) return
    
    setError("")
    setSuccess("")
    setIsLoading(true)
    
    const result = await onGoogleLogin()
    setIsLoading(false)

    if (result.success) {
      setSuccess(result.message)
      setTimeout(() => {
        onSuccess()
      }, 1000)
    } else {
      setError(result.message)
      setPersistentError(result.message)
      
      // เก็บ error message ใน localStorage เพื่อป้องกันการหายไป
      if (typeof window !== "undefined") {
        localStorage.setItem("cloned_site_error", result.message)
        localStorage.setItem("cloned_site_error_timestamp", Date.now().toString())
      }
    }
  }

  return (
    <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8 max-w-md w-full">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">เข้าสู่ระบบ</h1>
        <p className="text-gray-400 mb-1">{siteName}</p>
        <p className="text-sm text-gray-500">
          ยังไม่มีบัญชี?{" "}
          <Link href={`/${siteId}/register`} className="text-blue-400 hover:text-blue-300 transition-colors">
            สมัครสมาชิก
          </Link>
        </p>
      </div>

      {/* Error/Success Messages */}
      {(error || persistentError) && (
        <div className="mb-4 p-3 bg-red-600/20 border border-red-500/30 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <span className="text-red-400 text-sm">{error || persistentError}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-600/20 border border-green-500/30 rounded-xl flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
          <span className="text-green-400 text-sm">{success}</span>
        </div>
      )}

      {/* Google Sign-In Button */}
      {onGoogleLogin && (
        <>
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full mb-4 px-4 py-3 bg-white hover:bg-gray-100 text-gray-800 font-medium rounded-xl transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            เข้าสู่ระบบด้วย Google
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-900/50 text-gray-400">หรือ</span>
            </div>
          </div>
        </>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
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
              className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              placeholder="your@email.com"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Password Field */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
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
              className="w-full pl-10 pr-12 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              placeholder="••••••••"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {isLoading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
        </button>
      </form>

      {/* Back Link */}
      <div className="mt-6 text-center">
        <Link href="/" className="text-sm text-gray-400 hover:text-gray-300 transition-colors">
          ← กลับไปหน้าแรก
        </Link>
      </div>
    </div>
  )
}

