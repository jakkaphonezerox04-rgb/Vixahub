"use client"
import { AlertCircle, CheckCircle } from "lucide-react"

interface SimpleNotificationProps {
  message: string
  type: "error" | "success"
  visible: boolean
}

export default function SimpleNotification({ message, type, visible }: SimpleNotificationProps) {
  console.log("SimpleNotification render - message:", message, "type:", type, "visible:", visible)

  if (!visible || !message) {
    console.log("SimpleNotification not rendering - visible:", visible, "message:", message)
    return null
  }

  console.log("SimpleNotification rendering notification")

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-full duration-300">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg backdrop-blur-sm border ${
        type === 'error' 
          ? 'bg-red-600/20 border-red-500/30 text-red-400' 
          : 'bg-green-600/20 border-green-500/30 text-green-400'
      }`}>
        {type === 'error' ? (
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
        ) : (
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
        )}
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  )
}
