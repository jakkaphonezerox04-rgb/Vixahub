"use client"
import { useState, useEffect } from "react"
import { AlertCircle, CheckCircle, X } from "lucide-react"

interface NotificationToastProps {
  message: string
  type: "error" | "success"
  duration?: number
  onClose?: () => void
}

export default function NotificationToast({ 
  message, 
  type, 
  duration = 5000, 
  onClose 
}: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  console.log("NotificationToast render - message:", message, "type:", type, "isVisible:", isVisible)

  useEffect(() => {
    console.log("NotificationToast useEffect - message changed:", message)
    if (message && message.trim() !== "") {
      console.log("Setting toast visible")
      setIsVisible(true)
      setIsExiting(false)
      
      const timer = setTimeout(() => {
        console.log("Auto close timer triggered")
        handleClose()
      }, duration)

      return () => {
        console.log("Clearing timer")
        clearTimeout(timer)
      }
    } else {
      console.log("No message, hiding toast")
      setIsVisible(false)
      setIsExiting(false)
    }
  }, [message, duration])

  const handleClose = () => {
    console.log("Handle close called")
    setIsExiting(true)
    setTimeout(() => {
      console.log("Toast hidden")
      setIsVisible(false)
      onClose?.()
    }, 300)
  }

  console.log("NotificationToast render check - isVisible:", isVisible, "message:", message)

  if (!isVisible || !message || message.trim() === "") {
    console.log("NotificationToast not rendering - isVisible:", isVisible, "message:", message)
    return null
  }

  console.log("NotificationToast rendering toast")

  return (
    <div className={`fixed top-4 right-4 z-50 transform transition-all duration-300 ${
      isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
    }`}>
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
        <button
          onClick={handleClose}
          className="ml-2 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
