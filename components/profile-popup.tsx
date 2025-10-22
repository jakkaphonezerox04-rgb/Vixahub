"use client"
import { useState, useEffect, useRef } from "react"
import { X, User, Mail, Calendar, MapPin, Edit3, Camera } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useLanguage } from "@/contexts/language-context"

interface ProfilePopupProps {
  isOpen: boolean
  onClose: () => void
}

export default function ProfilePopup({ isOpen, onClose }: ProfilePopupProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [originalData, setOriginalData] = useState({
    name: "",
    email: "",
    bio: "",
    image: null as string | null
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user, updateUserProfile } = useAuth()
  const { t } = useLanguage()
  
  const [profileData, setProfileData] = useState({
    name: user?.name || "สวัสดี asdfgh!",
    email: user?.email || "photoampereee@gmail.com",
    bio: "ยังไม่ได้เขียนเกี่ยวกับตัวเอง",
    joinDate: "สมัครสมาชิกเมื่อวันที่ 9 สิงหาคม 2568"
  })

  // Load data from localStorage on mount and when user email changes
  useEffect(() => {
    const savedProfile = localStorage.getItem('userProfile')
    const savedImage = localStorage.getItem('userProfileImage')
    
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile)
        const loadedData = {
          ...parsed,
          email: user?.email || parsed.email, // Keep user email from auth context
        }
        setProfileData(prev => ({
          ...prev,
          ...loadedData,
        }))
        // Store original data for comparison
        setOriginalData({
          name: loadedData.name,
          email: loadedData.email,
          bio: loadedData.bio,
          image: savedImage
        })
      } catch (error) {
        console.error('Error loading profile from localStorage:', error)
      }
    }
    
    if (savedImage) {
      setProfileImage(savedImage)
    }
  }, [user?.email])

  // Check for changes whenever profileData or profileImage changes
  useEffect(() => {
    const hasDataChanges = 
      profileData.name !== originalData.name ||
      profileData.email !== originalData.email ||
      profileData.bio !== originalData.bio ||
      profileImage !== originalData.image
    
    setHasChanges(hasDataChanges)
  }, [profileData.name, profileData.email, profileData.bio, profileImage, originalData.name, originalData.email, originalData.bio, originalData.image])

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
    } else {
      setIsVisible(false)
    }
  }, [isOpen])

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // ตรวจสอบขนาดไฟล์ (ไม่เกิน 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('ไฟล์รูปภาพต้องมีขนาดไม่เกิน 5MB')
        return
      }
      
      // ตรวจสอบประเภทไฟล์
      if (!file.type.startsWith('image/')) {
        alert('กรุณาเลือกไฟล์รูปภาพเท่านั้น')
        return
      }
      
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setProfileImage(result)
        // บันทึกรูปใน localStorage
        localStorage.setItem('userProfileImage', result)
        
        // Trigger custom event to update other components
        window.dispatchEvent(new CustomEvent('profileImageUpdated'))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCameraClick = () => {
    if (isEditing) {
      fileInputRef.current?.click()
    }
  }

  const handleSave = () => {
    // บันทึกข้อมูลโปรไฟล์
    localStorage.setItem('userProfile', JSON.stringify(profileData))
    
    // อัพเดต AuthContext
    if (updateUserProfile) {
      updateUserProfile({
        name: profileData.name,
        email: profileData.email,
        profileImage: profileImage || undefined
      })
    }
    
    // อัปเดต originalData เพื่อรีเซ็ต hasChanges
    setOriginalData({
      name: profileData.name,
      email: profileData.email,
      bio: profileData.bio,
      image: profileImage
    })
    
    setIsEditing(false)
    setHasChanges(false)
    console.log("Saving profile data:", profileData)
    console.log("Profile image:", profileImage)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setHasChanges(false)
    // คืนค่าข้อมูลเดิม
    setProfileData({
      name: originalData.name,
      email: originalData.email,
      bio: originalData.bio,
      joinDate: "สมัครสมาชิกเมื่อวันที่ 9 สิงหาคม 2568"
    })
    setProfileImage(originalData.image)
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Popup */}
      <div className="fixed inset-0 z-[201] flex items-center justify-center p-4">
        <div 
          className={`bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300 ${
            isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
            <h2 className="text-xl font-bold text-white">{t("profile")}</h2>
            <div className="flex items-center gap-2">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 rounded-xl hover:bg-gray-700/50 transition-colors text-gray-400 hover:text-white"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              ) : (
                hasChanges && (
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white text-sm font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-purple-500/25 border border-purple-500/20"
                    >
                      {t("save")}
                    </button>
                    <button
                      onClick={handleCancel}
                      className="px-4 py-2 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-gray-300 hover:text-white text-sm font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-gray-500/25 border border-gray-600/30"
                    >
                      {t("cancel")}
                    </button>
                  </div>
                )
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-gray-700/50 transition-colors text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Profile Avatar */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative group mb-3">
                {/* Profile Image */}
                <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-purple-500/20 group-hover:ring-purple-400/40 transition-all duration-300">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <User className="w-10 h-10 text-white" />
                    </div>
                  )}
                </div>
                
                {/* Camera Button - positioned over the image only when editing and hovering */}
                {isEditing && (
                  <button 
                    onClick={handleCameraClick}
                    className="absolute inset-0 bg-gradient-to-br from-purple-600/70 to-pink-600/70 backdrop-blur-[2px] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:from-purple-500/80 hover:to-pink-500/80"
                  >
                    <div className="bg-white/25 rounded-full p-2 backdrop-blur-sm hover:bg-white/35 transition-colors duration-200">
                      <Camera className="w-4 h-4 text-white drop-shadow-lg" />
                    </div>
                  </button>
                )}
              </div>
              
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              
              {/* Name */}
              {isEditing ? (
                <div className="w-full">
                  <div className="text-center mb-3">
                    <p className="text-gray-400 text-sm">แก้ไขชื่อ</p>
                  </div>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                    placeholder="ชื่อเต็ม"
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white text-center focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              ) : (
                <h3 className="text-xl font-bold text-white text-center">{profileData.name}</h3>
              )}
            </div>

            {/* Profile Details */}
            <div className="space-y-4">
              {/* Email */}
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-400" />
                <div className="flex-1">
                  <p className="text-gray-400 text-sm">{t("email")}</p>
                  {isEditing ? (
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 mt-1"
                    />
                  ) : (
                    <p className="text-white text-sm">{profileData.email}</p>
                  )}
                </div>
              </div>

              {/* Bio */}
              <div className="flex items-start gap-3">
                <User className="w-4 h-4 text-gray-400 mt-1" />
                <div className="flex-1">
                  <p className="text-gray-400 text-sm">{t("about")}</p>
                  {isEditing ? (
                    <textarea
                      value={profileData.bio}
                      onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                      placeholder="เกี่ยวกับตัวเอง"
                      rows={3}
                      className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 mt-1 resize-none"
                    />
                  ) : (
                    <p className="text-white text-sm">{profileData.bio}</p>
                  )}
                </div>
              </div>

              {/* Join Date */}
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-gray-400" />
                <div className="flex-1">
                  <p className="text-gray-400 text-sm">{profileData.joinDate}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
} 