"use client"
import { useState, useEffect } from "react"
import { AlertCircle, CheckCircle, X } from "lucide-react"

interface CustomAlertModalProps {
  message: string
  type: "error" | "success"
  visible: boolean
  onClose: () => void
}

export default function CustomAlertModal({ message, type, visible, onClose }: CustomAlertModalProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (visible) {
      setIsAnimating(true)
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        handleClose()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [visible])

  const handleClose = () => {
    setIsAnimating(false)
    setTimeout(() => {
      onClose()
    }, 300)
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          isAnimating ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className={`relative bg-gray-900/95 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 max-w-md w-full mx-4 transform transition-all duration-300 ${
        isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
      }`}>
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="text-center">
          {/* Icon */}
          <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
            type === 'error' 
              ? 'bg-red-600/20 border border-red-500/30' 
              : 'bg-green-600/20 border border-green-500/30'
          }`}>
            {type === 'error' ? (
              <AlertCircle className="w-8 h-8 text-red-400" />
            ) : (
              <CheckCircle className="w-8 h-8 text-green-400" />
            )}
          </div>

          {/* Message */}
          <h3 className={`text-xl font-bold mb-2 ${
            type === 'error' ? 'text-red-400' : 'text-green-400'
          }`}>
            {type === 'error' ? 'เกิดข้อผิดพลาด' : 'สำเร็จ'}
          </h3>
          
          <p className="text-gray-300 text-sm leading-relaxed mb-6">
            {message}
          </p>

          {/* Action Button */}
          <button
            onClick={handleClose}
            className={`w-full px-6 py-3 rounded-xl font-medium transition-all duration-300 hover:scale-105 ${
              type === 'error'
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            ตกลง
          </button>
        </div>
      </div>
    </div>
  )
}
