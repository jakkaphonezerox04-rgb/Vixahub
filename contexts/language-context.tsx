"use client"
import React, { createContext, useContext, useState, useEffect } from "react"

interface LanguageContextType {
  language: string
  setLanguage: (lang: string) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

// Translation strings
const translations = {
  th: {
    // Dashboard
    dashboard: "แดชบอร์ด",
    settings: "ตั้งค่า",
    profile: "โปรไฟล์",
    logout: "ออกจากระบบ",
    
    // Settings Page
    generalSettings: "การตั้งค่าทั่วไป",
    language: "ภาษา",
    timezone: "เขตเวลา",
    dateFormat: "รูปแบบวันที่",
    notifications: "การแจ้งเตือน",
    security: "ความปลอดภัย",
    appearance: "รูปแบบ",
    
    // Settings Tabs
    general: "ทั่วไป",
    notificationSettings: "การตั้งค่าการแจ้งเตือน",
    securitySettings: "การตั้งค่าความปลอดภัย",
    appearanceSettings: "การตั้งค่ารูปแบบ",
    
    // General Settings Options
    thai: "ไทย",
    english: "English",
    bangkokTimezone: "Bangkok (UTC+7)",
    utcTimezone: "UTC (UTC+0)",
    
    // Notification Settings
    emailNotifications: "การแจ้งเตือนทางอีเมล",
    emailNotificationsDesc: "รับการแจ้งเตือนสำคัญทางอีเมล",
    pushNotifications: "การแจ้งเตือนแบบ Push",
    pushNotificationsDesc: "รับการแจ้งเตือนบนเบราว์เซอร์",
    smsNotifications: "การแจ้งเตือนทาง SMS",
    smsNotificationsDesc: "รับการแจ้งเตือนทางข้อความ",
    marketingEmails: "อีเมลการตลาด",
    marketingEmailsDesc: "รับข้อมูลข่าวสารและโปรโมชั่น",
    
    // Security Settings
    twoFactorAuth: "การยืนยันตัวตนแบบ 2 ขั้นตอน",
    twoFactorAuthDesc: "เพิ่มความปลอดภัยด้วยการยืนยันตัวตนแบบ 2 ขั้นตอน",
    loginAlerts: "การแจ้งเตือนการเข้าสู่ระบบ",
    loginAlertsDesc: "แจ้งเตือนเมื่อมีการเข้าสู่ระบบจากอุปกรณ์ใหม่",
    sessionTimeout: "หมดเวลาเซสชัน (นาที)",
    fifteenMinutes: "15 นาที",
    thirtyMinutes: "30 นาที",
    oneHour: "1 ชั่วโมง",
    twoHours: "2 ชั่วโมง",
    
    // Appearance Settings
    theme: "ธีม",
    darkMode: "โหมดมืด",
    lightMode: "โหมดสว่าง",
    fontSize: "ขนาดตัวอักษร",
    small: "เล็ก",
    medium: "กลาง",
    large: "ใหญ่",
    compactMode: "โหมดกะทัดรัด",
    compactModeDesc: "แสดงข้อมูลในพื้นที่น้อยลง",
    
    // Navigation
    createWebsite: "สร้างเว็บไซต์",
    myWebsites: "เว็บไซต์ของฉัน",
    topup: "เติมเงิน",
    
    // Sidebar Navigation
    rentWebsite: "เช่าเว็บไซต์",
    websites: "เว็บไซต์",
    
    // Common
    save: "บันทึก",
    cancel: "ยกเลิก",
    edit: "แก้ไข",
    about: "เกี่ยวกับ",
    email: "อีเมล",
  },
  en: {
    // Dashboard
    dashboard: "Dashboard",
    settings: "Settings",
    profile: "Profile",
    logout: "Logout",
    
    // Settings Page
    generalSettings: "General Settings",
    language: "Language",
    timezone: "Timezone",
    dateFormat: "Date Format",
    notifications: "Notifications",
    security: "Security",
    appearance: "Appearance",
    
    // Settings Tabs
    general: "General",
    notificationSettings: "Notification Settings",
    securitySettings: "Security Settings",
    appearanceSettings: "Appearance Settings",
    
    // General Settings Options
    thai: "Thai",
    english: "English",
    bangkokTimezone: "Bangkok (UTC+7)",
    utcTimezone: "UTC (UTC+0)",
    
    // Notification Settings
    emailNotifications: "Email Notifications",
    emailNotificationsDesc: "Receive important notifications via email",
    pushNotifications: "Push Notifications",
    pushNotificationsDesc: "Receive notifications in your browser",
    smsNotifications: "SMS Notifications",
    smsNotificationsDesc: "Receive notifications via text message",
    marketingEmails: "Marketing Emails",
    marketingEmailsDesc: "Receive news and promotional content",
    
    // Security Settings
    twoFactorAuth: "Two-Factor Authentication",
    twoFactorAuthDesc: "Add extra security with two-factor authentication",
    loginAlerts: "Login Alerts",
    loginAlertsDesc: "Get notified when logging in from new devices",
    sessionTimeout: "Session Timeout (minutes)",
    fifteenMinutes: "15 minutes",
    thirtyMinutes: "30 minutes",
    oneHour: "1 hour",
    twoHours: "2 hours",
    
    // Appearance Settings
    theme: "Theme",
    darkMode: "Dark Mode",
    lightMode: "Light Mode",
    fontSize: "Font Size",
    small: "Small",
    medium: "Medium",
    large: "Large",
    compactMode: "Compact Mode",
    compactModeDesc: "Display more content in less space",
    
    // Navigation
    createWebsite: "Create Website",
    myWebsites: "My Websites",
    topup: "Top Up",
    
    // Sidebar Navigation
    rentWebsite: "Rent Website",
    websites: "Websites",
    
    // Common
    save: "Save",
    cancel: "Cancel",
    edit: "Edit",
    about: "About",
    email: "Email",
  },
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState("th")

  useEffect(() => {
    // Load language from localStorage
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem("language")
      if (savedLanguage && (savedLanguage === "th" || savedLanguage === "en")) {
        setLanguage(savedLanguage)
      }
    }
  }, [])

  useEffect(() => {
    // Save language to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem("language", language)
    }
  }, [language])

  const t = (key: string): string => {
    return translations[language as keyof typeof translations]?.[key as keyof typeof translations.th] || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
} 