"use client"
import { createContext, useContext, useState, useCallback, useMemo } from "react"
import type React from "react"
import { doc, setDoc, getDoc, collection, query, where, getDocs } from "firebase/firestore"
import { signInWithPopup } from "firebase/auth"
import { firestore, auth, googleProvider } from "@/lib/firebase"

interface ClonedSiteUser {
  id: string
  siteId: string
  username: string
  email: string
  phone?: string
  createdAt: string
  role?: string
  houseName?: string
}

interface ClonedSiteAuthContextType {
  user: ClonedSiteUser | null
  isLoading: boolean
  login: (siteId: string, email: string, password: string) => Promise<{ success: boolean; message: string }>
  loginWithGoogle: (siteId: string) => Promise<{ success: boolean; message: string }>
  registerWithGoogle: (siteId: string) => Promise<{ success: boolean; message: string }>
  register: (siteId: string, userData: RegisterData) => Promise<{ success: boolean; message: string }>
  logout: () => void
  checkSession: (siteId: string) => Promise<ClonedSiteUser | null>
}

interface RegisterData {
  username: string
  email: string
  password: string
  confirmPassword: string
  phone?: string
  role: string
  inviteCode?: string
}

const ClonedSiteAuthContext = createContext<ClonedSiteAuthContextType | undefined>(undefined)

/**
 * Get cloned site user from Firestore (with localStorage fallback)
 */
async function getClonedSiteUser(siteId: string, email: string): Promise<ClonedSiteUser | null> {
  try {
    const usersRef = collection(firestore, `cloned_sites/${siteId}/users`)
    const q = query(usersRef, where("email", "==", email.toLowerCase()))
    const querySnapshot = await getDocs(q)
    
    if (!querySnapshot.empty) {
      const docSnap = querySnapshot.docs[0]
      const data = docSnap.data()
      return {
        id: docSnap.id,
        siteId,
        username: data.username,
        email: data.email,
        phone: data.phone,
        createdAt: data.createdAt,
        role: data.role,
        houseName: data.houseName || "",
      } as ClonedSiteUser
    }
    
    return null
  } catch (error) {
    console.error("Error getting cloned site user:", error)
    throw error
  }
}

/**
 * Create cloned site user in Firestore
 */
async function createClonedSiteUser(siteId: string, userData: RegisterData & { passwordHash: string; role?: string }): Promise<ClonedSiteUser> {
  try {
    const userId = `${siteId}_${Date.now()}`
    const userDocRef = doc(firestore, `cloned_sites/${siteId}/users`, userId)
    
    const newUserData = {
      siteId,
      username: userData.username,
      email: userData.email.toLowerCase(),
      phone: userData.phone || "",
      passwordHash: userData.passwordHash,
      role: userData.role || "member",
      houseName: "",
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    }
    
    // Save to Firestore
    await setDoc(userDocRef, newUserData)
    console.log("✅ User saved to Firestore:", `cloned_sites/${siteId}/users/${userId}`)
    console.log("✅ User data:", newUserData)
    
    return {
      id: userId,
      siteId,
      username: userData.username,
      email: userData.email.toLowerCase(),
      phone: userData.phone || "",
      createdAt: newUserData.createdAt,
      role: userData.role || "member",
      houseName: "",
    }
  } catch (error) {
    console.error("Error creating cloned site user:", error)
    throw error
  }
}

/**
 * Simple password hashing (for demo - in production use proper hashing)
 */
function hashPassword(password: string): string {
  // In production, use bcrypt or similar on the backend
  // This is just a simple demo hash
  return btoa(password + "VIXAHUB_SALT_2024")
}

/**
 * Verify password from Firestore
 */
async function verifyPassword(siteId: string, email: string, password: string): Promise<ClonedSiteUser | null> {
  try {
    const usersRef = collection(firestore, `cloned_sites/${siteId}/users`)
    const q = query(usersRef, where("email", "==", email.toLowerCase()))
    const querySnapshot = await getDocs(q)
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0]
      const userData = doc.data()
      const hashedPassword = hashPassword(password)
      
      if (userData.passwordHash === hashedPassword) {
        return {
          id: doc.id,
          siteId: userData.siteId,
          username: userData.username,
          email: userData.email,
          phone: userData.phone || "",
          createdAt: userData.createdAt,
          role: userData.role || "member",
        }
      }
    }
    
    return null
  } catch (error) {
    console.error("Error verifying password:", error)
    throw error
  }
}

/**
 * Check if user is the first user (for Auto-Admin)
 */
async function isFirstUser(siteId: string): Promise<boolean> {
  try {
    const usersRef = collection(firestore, `cloned_sites/${siteId}/users`)
    const snapshot = await getDocs(usersRef)
    return snapshot.empty
  } catch (error) {
    console.error("Error checking if first user:", error)
    return false
  }
}

/**
 * Validate and use invite code
 */
async function validateAndUseInviteCode(siteId: string, inviteCode: string): Promise<{ valid: boolean; message: string }> {
  try {
    if (!inviteCode.trim()) {
      return { valid: false, message: "กรุณากรอกรหัสเชิญ" }
    }

    const inviteCodesRef = collection(firestore, `cloned_sites/${siteId}/invite_codes`)
    const q = query(inviteCodesRef, where("code", "==", inviteCode.trim()))
    const snapshot = await getDocs(q)

    if (snapshot.empty) {
      return { valid: false, message: "รหัสเชิญไม่ถูกต้อง" }
    }

    const inviteDoc = snapshot.docs[0]
    const inviteData = inviteDoc.data()

    // Check if invite code is active
    if (!inviteData.isActive) {
      return { valid: false, message: "รหัสเชิญถูกปิดใช้งาน" }
    }

    // Check if invite code is expired
    const now = new Date()
    const expiresAt = inviteData.expiresAt?.toDate?.() || new Date(0)
    if (expiresAt < now) {
      return { valid: false, message: "รหัสเชิญหมดอายุแล้ว" }
    }

    // Check if invite code has reached max uses
    if (inviteData.usedCount >= inviteData.maxUses) {
      return { valid: false, message: "รหัสเชิญถูกใช้ครบแล้ว" }
    }

    // Increment used count
    await setDoc(doc(firestore, `cloned_sites/${siteId}/invite_codes`, inviteDoc.id), {
      usedCount: inviteData.usedCount + 1
    }, { merge: true })

    return { valid: true, message: "รหัสเชิญถูกต้อง" }
  } catch (error) {
    console.error("Error validating invite code:", error)
    return { valid: false, message: "เกิดข้อผิดพลาดในการตรวจสอบรหัสเชิญ" }
  }
}

// Activity Logging Functions
const getClientIP = async () => {
  try {
    const response = await fetch('https://api.ipify.org?format=json')
    const data = await response.json()
    return data.ip
  } catch (error) {
    console.error('Error getting IP:', error)
    return 'Unknown'
  }
}

const logActivity = async (siteId: string, userId: string, username: string, userRole: string, houseName: string | undefined, action: string, details: string) => {
  try {
    const ipAddress = await getClientIP()
    const logData = {
      userId,
      username,
      userRole,
      houseName: houseName || '',
      action,
      details,
      ipAddress,
      timestamp: serverTimestamp(),
      siteSlug: siteId
    }
    
    await addDoc(collection(firestore, `cloned_sites/${siteId}/activity_logs`), logData)
  } catch (error) {
    console.error('Error logging activity:', error)
  }
}

export function ClonedSiteAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ClonedSiteUser | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const login = useCallback(async (siteId: string, email: string, password: string): Promise<{ success: boolean; message: string }> => {
    setIsLoading(true)

    try {
      const authenticatedUser = await verifyPassword(siteId, email, password)
      
      if (authenticatedUser) {
        setUser(authenticatedUser)
        // Store session in sessionStorage for this specific site
        if (typeof window !== "undefined") {
          sessionStorage.setItem(`cloned_site_session_${siteId}`, JSON.stringify(authenticatedUser))
        }
        
        // Log login activity
        await logActivity(siteId, authenticatedUser.id, authenticatedUser.username, authenticatedUser.role, authenticatedUser.houseName, 'login', 'เข้าสู่ระบบ')
        
        setIsLoading(false)
        return { success: true, message: "เข้าสู่ระบบสำเร็จ" }
      } else {
        setIsLoading(false)
        return { success: false, message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" }
      }
    } catch (error: any) {
      setIsLoading(false)
      console.error("Login error:", error)
      return { success: false, message: "เกิดข้อผิดพลาดในการเข้าสู่ระบบ" }
    }
  }, [])

  const loginWithGoogle = useCallback(async (siteId: string): Promise<{ success: boolean; message: string }> => {
    setIsLoading(true)

    try {
      // Sign in with Google popup
      const result = await signInWithPopup(auth, googleProvider)
      const googleUser = result.user

      if (!googleUser.email) {
        setIsLoading(false)
        return { success: false, message: "ไม่สามารถรับข้อมูลอีเมลจาก Google ได้" }
      }

      // Check if user exists in cloned site
      const existingUser = await getClonedSiteUser(siteId, googleUser.email)
      console.log("Google login - existingUser:", existingUser)

      if (!existingUser) {
        console.log("Google login - User not found, showing registration message")
        setIsLoading(false)
        return { success: false, message: "ไม่พบบัญชีผู้ใช้ กรุณาสมัครสมาชิกด้วย Google ก่อน" }
      }

      setUser(existingUser)
      // Store session in sessionStorage
      if (typeof window !== "undefined") {
        sessionStorage.setItem(`cloned_site_session_${siteId}`, JSON.stringify(existingUser))
      }
      setIsLoading(false)
      return { success: true, message: "เข้าสู่ระบบด้วย Google สำเร็จ" }
    } catch (error: any) {
      setIsLoading(false)
      console.error("Google login error:", error)
      if (error.code === 'auth/popup-closed-by-user') {
        return { success: false, message: "ยกเลิกการเข้าสู่ระบบ" }
      }
      return { success: false, message: "เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย Google" }
    }
  }, [])

  const registerWithGoogle = useCallback(async (siteId: string): Promise<{ success: boolean; message: string }> => {
    setIsLoading(true)

    try {
      // Sign in with Google popup
      const result = await signInWithPopup(auth, googleProvider)
      const googleUser = result.user

      if (!googleUser.email) {
        setIsLoading(false)
        return { success: false, message: "ไม่สามารถรับข้อมูลอีเมลจาก Google ได้" }
      }

      // Check if user already exists
      const existingUser = await getClonedSiteUser(siteId, googleUser.email)

      if (existingUser) {
        setIsLoading(false)
        return { success: false, message: "บัญชีนี้ถูกสมัครสมาชิกแล้ว กรุณาเข้าสู่ระบบ" }
      }

      // Check if this is the first user (Auto-Admin)
      const isFirst = await isFirstUser(siteId)
      const finalRole = isFirst ? "admin" : "member"

      if (isFirst) {
        console.log("🎉 First user detected (Google) - granting admin role")
      }

      // Create new user from Google account
      const newUserData = {
        username: googleUser.displayName || googleUser.email.split('@')[0],
        email: googleUser.email,
        password: "",
        confirmPassword: "",
        phone: googleUser.phoneNumber || "",
        passwordHash: "GOOGLE_AUTH",
        role: finalRole,
      }
      const newUser = await createClonedSiteUser(siteId, newUserData)

      setUser(newUser)
      // Store session in sessionStorage
      if (typeof window !== "undefined") {
        sessionStorage.setItem(`cloned_site_session_${siteId}`, JSON.stringify(newUser))
      }
      setIsLoading(false)
      const successMessage = isFirst 
        ? "สมัครสมาชิกด้วย Google สำเร็จ! คุณได้รับสิทธิ์ Admin อัตโนมัติ" 
        : "สมัครสมาชิกด้วย Google สำเร็จ"
      return { success: true, message: successMessage }
    } catch (error: any) {
      setIsLoading(false)
      console.error("Google register error:", error)
      if (error.code === 'auth/popup-closed-by-user') {
        return { success: false, message: "ยกเลิกการสมัครสมาชิก" }
      }
      return { success: false, message: "เกิดข้อผิดพลาดในการสมัครสมาชิกด้วย Google" }
    }
  }, [])

  const register = useCallback(async (siteId: string, userData: RegisterData): Promise<{ success: boolean; message: string }> => {
    setIsLoading(true)

    try {
      // Validate passwords match
      if (userData.password !== userData.confirmPassword) {
        setIsLoading(false)
        return { success: false, message: "รหัสผ่านไม่ตรงกัน" }
      }

      // Validate password length
      if (userData.password.length < 6) {
        setIsLoading(false)
        return { success: false, message: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" }
      }

      // Check if user already exists
      const existingUser = await getClonedSiteUser(siteId, userData.email)
      if (existingUser) {
        setIsLoading(false)
        return { success: false, message: "อีเมลนี้ถูกใช้งานแล้วในเว็บไซต์นี้" }
      }

      // Check if this is the first user (Auto-Admin)
      const isFirst = await isFirstUser(siteId)
      let finalRole = "member" // Default role

      if (isFirst) {
        // First user gets admin role automatically
        finalRole = "admin"
        console.log("🎉 First user detected - granting admin role")
      } else {
        // For non-first users, validate invite code
        if (!userData.inviteCode?.trim()) {
          setIsLoading(false)
          return { success: false, message: "กรุณากรอกรหัสเชิญ" }
        }

        const inviteValidation = await validateAndUseInviteCode(siteId, userData.inviteCode)
        if (!inviteValidation.valid) {
          setIsLoading(false)
          return { success: false, message: inviteValidation.message }
        }
        
        // For invite code users, they get member role by default
        // (Admin can create specific invite codes for staff if needed)
        finalRole = "member"
      }

      // Hash password
      const passwordHash = hashPassword(userData.password)

      // Create new user with determined role
      const newUser = await createClonedSiteUser(siteId, {
        ...userData,
        passwordHash,
        role: finalRole,
      })
      
      setUser(newUser)
      
      // Store session
      if (typeof window !== "undefined") {
        sessionStorage.setItem(`cloned_site_session_${siteId}`, JSON.stringify(newUser))
      }
      
      // Log registration activity
      await logActivity(siteId, newUser.id, newUser.username, newUser.role, newUser.houseName, 'create_user', `สมัครสมาชิกใหม่ - บทบาท: ${finalRole}`)
      
      setIsLoading(false)
      const successMessage = isFirst 
        ? "สมัครสมาชิกสำเร็จ! คุณได้รับสิทธิ์ Admin อัตโนมัติ" 
        : "สมัครสมาชิกสำเร็จ"
      return { success: true, message: successMessage }
    } catch (error: any) {
      setIsLoading(false)
      console.error("Registration error:", error)
      return { success: false, message: "เกิดข้อผิดพลาดในการสมัครสมาชิก" }
    }
  }, [])

  const logout = useCallback(async () => {
    if (user && typeof window !== "undefined") {
      // Log logout activity
      await logActivity(user.siteId, user.id, user.username, user.role, user.houseName, 'logout', 'ออกจากระบบ')
      
      sessionStorage.removeItem(`cloned_site_session_${user.siteId}`)
    }
    setUser(null)
  }, [user])

  const checkSession = useCallback(async (siteId: string): Promise<ClonedSiteUser | null> => {
    if (typeof window !== "undefined") {
      try {
        const sessionData = sessionStorage.getItem(`cloned_site_session_${siteId}`)
        if (sessionData) {
          const userData = JSON.parse(sessionData) as ClonedSiteUser
          // Fetch latest from Firestore to keep fields (like houseName) fresh
          const fresh = await getClonedSiteUser(siteId, userData.email)
          if (fresh) {
            setUser(fresh)
            sessionStorage.setItem(`cloned_site_session_${siteId}`, JSON.stringify(fresh))
            console.log('[CLONED-AUTH] Session refreshed for', siteId, ':', fresh)
            return fresh
          }
          setUser(userData)
          return userData
        } else {
          console.log('[CLONED-AUTH] No session found for', siteId)
        }
      } catch (error) {
        console.error("Error checking session:", error)
      }
    }
    return null
  }, [])

  const value = useMemo(() => ({
    user,
    isLoading,
    login,
    loginWithGoogle,
    registerWithGoogle,
    register,
    logout,
    checkSession,
  }), [user, isLoading, login, loginWithGoogle, registerWithGoogle, register, logout, checkSession])

  return <ClonedSiteAuthContext.Provider value={value}>{children}</ClonedSiteAuthContext.Provider>
}

export function useClonedSiteAuth() {
  const context = useContext(ClonedSiteAuthContext)
  if (context === undefined) {
    throw new Error("useClonedSiteAuth must be used within a ClonedSiteAuthProvider")
  }
  return context
}

