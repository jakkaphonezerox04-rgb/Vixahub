"use client"
import { useEffect } from "react"
import { CheckCircle, XCircle, Info, AlertCircle, X } from "lucide-react"

interface ToastNotificationProps {
  type: "success" | "error" | "info" | "warning"
  title: string
  message?: string
  onClose: () => void
  duration?: number
}

export default function ToastNotification({ 
  type, 
  title, 
  message, 
  onClose, 
  duration = 5000 
}: ToastNotificationProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  const configs = {
    success: {
      icon: CheckCircle,
      bgColor: "bg-green-600/20",
      borderColor: "border-green-500/30",
      textColor: "text-green-400",
      iconBg: "bg-green-600/30",
    },
    error: {
      icon: XCircle,
      bgColor: "bg-red-600/20",
      borderColor: "border-red-500/30",
      textColor: "text-red-400",
      iconBg: "bg-red-600/30",
    },
    warning: {
      icon: AlertCircle,
      bgColor: "bg-yellow-600/20",
      borderColor: "border-yellow-500/30",
      textColor: "text-yellow-400",
      iconBg: "bg-yellow-600/30",
    },
    info: {
      icon: Info,
      bgColor: "bg-blue-600/20",
      borderColor: "border-blue-500/30",
      textColor: "text-blue-400",
      iconBg: "bg-blue-600/30",
    },
  }

  const config = configs[type]
  const Icon = config.icon

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-5 fade-in duration-300">
      <div className={`max-w-md ${config.bgColor} ${config.borderColor} border backdrop-blur-sm rounded-xl shadow-2xl p-4`}>
        <div className="flex items-start gap-3">
          <div className={`${config.iconBg} p-2 rounded-xl flex-shrink-0`}>
            <Icon className={`w-5 h-5 ${config.textColor}`} />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold ${config.textColor} mb-1`}>{title}</h3>
            {message && (
              <p className="text-gray-300 text-sm break-words whitespace-pre-line">{message}</p>
            )}
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

