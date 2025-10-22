"use client"
import { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react"
import type React from "react"
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  signInWithPopup
} from "firebase/auth"
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore"
import { auth, firestore, googleProvider } from "@/lib/firebase"
import { firebaseCreditsService } from "@/lib/firebase-credits"

interface User {
  id: string
  name: string
  email: string
  phone?: string
  location?: string
  website?: string
  bio?: string
  joinDate: string
  balance: number
  avatar?: string
  profileImage?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  loading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>
  register: (userData: RegisterData) => Promise<{ success: boolean; message: string }>
  loginWithGoogle: () => Promise<{ success: boolean; message: string }>
  registerWithGoogle: () => Promise<{ success: boolean; message: string }>
  logout: () => void
  updateUser: (userData: Partial<User>) => void
  updateUserProfile: (profileData: { name: string; email: string; profileImage?: string }) => void
}

interface RegisterData {
  username: string
  email: string
  password: string
  confirmPassword: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * Get user profile from Firestore
 */
async function getUserProfile(userId: string): Promise<User | null> {
  try {
    const userDocRef = doc(firestore, "users", userId)
    const userDoc = await getDoc(userDocRef)
    
    if (userDoc.exists()) {
      const data = userDoc.data()
      return {
        id: userId,
        name: data.name || data.username || "User",
        email: data.email || "",
        phone: data.phone || "",
        location: data.location || "",
        website: data.website || "",
        bio: data.bio || "",
        joinDate: data.joinDate || "",
        balance: data.balance || 0,
        avatar: data.avatar || "",
        profileImage: data.profileImage || "",
      }
    }
    return null
  } catch (error) {
    console.error("Error getting user profile:", error)
    return null
  }
}

/**
 * Create user profile in Firestore
 */
async function createUserProfile(userId: string, userData: { username: string; email: string }): Promise<User> {
  try {
    const userDocRef = doc(firestore, "users", userId)
    
    const joinDate = new Date().toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
    })
    
    const newUserData = {
      username: userData.username,
      name: userData.username,
      email: userData.email,
      phone: "",
      location: "",
      website: "",
      bio: "",
      joinDate,
      balance: 0,
      avatar: "",
      profileImage: "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
    
    await setDoc(userDocRef, newUserData)
    
    // Initialize credits for new user
    await firebaseCreditsService.getUserCredits(userId)
    
    return {
      id: userId,
      name: userData.username,
      email: userData.email,
      phone: "",
      location: "",
      website: "",
      bio: "",
      joinDate,
      balance: 0,
      avatar: "",
      profileImage: "",
    }
  } catch (error) {
    console.error("Error creating user profile:", error)
    throw error
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Listen to Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // User is signed in, get their profile
        const userProfile = await getUserProfile(firebaseUser.uid)
        
        if (userProfile) {
          // Get current balance from credits service
          const creditsResult = await firebaseCreditsService.getUserCredits(firebaseUser.uid)
          // Don't mutate, create new object
          setUser({
            ...userProfile,
            balance: creditsResult.credits
          })
        } else {
          // Profile doesn't exist, create one
          const newProfile = await createUserProfile(firebaseUser.uid, {
            username: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
            email: firebaseUser.email || "",
          })
          setUser(newProfile)
        }
      } else {
        // User is signed out
        setUser(null)
      }
      setIsLoading(false)
    })

    // Cleanup subscription
    return () => unsubscribe()
  }, [])

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
    setIsLoading(true)

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const firebaseUser = userCredential.user
      
      // Get user profile
      const userProfile = await getUserProfile(firebaseUser.uid)
      
      if (userProfile) {
        // Get current balance
        const creditsResult = await firebaseCreditsService.getUserCredits(firebaseUser.uid)
        // Don't mutate, create new object
        setUser({
          ...userProfile,
          balance: creditsResult.credits
        })
        setIsLoading(false)
        return { success: true, message: "เข้าสู่ระบบสำเร็จ" }
      } else {
        // Create profile if doesn't exist
        const newProfile = await createUserProfile(firebaseUser.uid, {
          username: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
          email: firebaseUser.email || "",
        })
        setUser(newProfile)
        setIsLoading(false)
        return { success: true, message: "เข้าสู่ระบบสำเร็จ" }
      }
    } catch (error: any) {
      setIsLoading(false)
      console.error("Login error:", error)
      
      // Handle specific Firebase errors
      if (error.code === "auth/user-not-found") {
        return { success: false, message: "ไม่พบผู้ใช้งานนี้ในระบบ" }
      } else if (error.code === "auth/wrong-password") {
        return { success: false, message: "รหัสผ่านไม่ถูกต้อง" }
      } else if (error.code === "auth/invalid-email") {
        return { success: false, message: "รูปแบบอีเมลไม่ถูกต้อง" }
      } else if (error.code === "auth/invalid-credential") {
        return { success: false, message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" }
      } else {
        return { success: false, message: error.message || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ" }
      }
    }
  }, [])

  const register = useCallback(async (userData: RegisterData): Promise<{ success: boolean; message: string }> => {
    setIsLoading(true)

    try {
      // Validate passwords match
      if (userData.password !== userData.confirmPassword) {
        setIsLoading(false)
        return { success: false, message: "รหัสผ่านไม่ตรงกัน" }
      }

      // Create Firebase auth user
      const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password)
      const firebaseUser = userCredential.user
      
      // Create user profile in Firestore
      const newProfile = await createUserProfile(firebaseUser.uid, {
        username: userData.username,
        email: userData.email,
      })
      
      setUser(newProfile)
      setIsLoading(false)
      return { success: true, message: "สมัครสมาชิกสำเร็จ" }
    } catch (error: any) {
      setIsLoading(false)
      console.error("Registration error:", error)
      
      // Handle specific Firebase errors
      if (error.code === "auth/email-already-in-use") {
        return { success: false, message: "อีเมลนี้ถูกใช้งานแล้ว" }
      } else if (error.code === "auth/invalid-email") {
        return { success: false, message: "รูปแบบอีเมลไม่ถูกต้อง" }
      } else if (error.code === "auth/weak-password") {
        return { success: false, message: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" }
      } else {
        return { success: false, message: error.message || "เกิดข้อผิดพลาดในการสมัครสมาชิก" }
      }
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await firebaseSignOut(auth)
      setUser(null)
    } catch (error) {
      console.error("Logout error:", error)
    }
  }, [])

  const updateUser = useCallback(async (userData: Partial<User>) => {
    if (!user) return
    
    try {
      const userDocRef = doc(firestore, "users", user.id)
      await updateDoc(userDocRef, {
        ...userData,
        updatedAt: serverTimestamp(),
      })
      
      // Create new user object to avoid mutation
      setUser(prevUser => prevUser ? { ...prevUser, ...userData } : null)
    } catch (error) {
      console.error("Error updating user:", error)
    }
  }, [user])

  const updateUserProfile = useCallback(async (profileData: { name: string; email: string; profileImage?: string }) => {
    if (!user) return
    
    try {
      const userDocRef = doc(firestore, "users", user.id)
      await updateDoc(userDocRef, {
        name: profileData.name,
        email: profileData.email,
        ...(profileData.profileImage && { profileImage: profileData.profileImage }),
        updatedAt: serverTimestamp(),
      })
      
      // Create new user object to avoid mutation
      setUser(prevUser => prevUser ? { ...prevUser, ...profileData } : null)
    } catch (error) {
      console.error("Error updating user profile:", error)
    }
  }, [user])

  // Google Login for main site
  const loginWithGoogle = useCallback(async () => {
    setIsLoading(true)

    try {
      const result = await signInWithPopup(auth, googleProvider)
      const googleUser = result.user

      if (!googleUser.email) {
        setIsLoading(false)
        return { success: false, message: "ไม่สามารถรับข้อมูลอีเมลจาก Google ได้" }
      }

      // Check if user exists in main site
      const userDocRef = doc(firestore, "users", googleUser.uid)
      const userDoc = await getDoc(userDocRef)

      if (!userDoc.exists()) {
        setIsLoading(false)
        return { success: false, message: "ไม่พบบัญชีผู้ใช้ กรุณาสมัครสมาชิกด้วย Google ก่อน" }
      }

      const userData = userDoc.data() as User
      setUser(userData)
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

  // Google Register for main site
  const registerWithGoogle = useCallback(async () => {
    setIsLoading(true)

    try {
      const result = await signInWithPopup(auth, googleProvider)
      const googleUser = result.user

      if (!googleUser.email) {
        setIsLoading(false)
        return { success: false, message: "ไม่สามารถรับข้อมูลอีเมลจาก Google ได้" }
      }

      // Check if user already exists
      const userDocRef = doc(firestore, "users", googleUser.uid)
      const userDoc = await getDoc(userDocRef)

      if (userDoc.exists()) {
        setIsLoading(false)
        return { success: false, message: "บัญชีนี้มีอยู่แล้วในระบบ" }
      }

      // Create new user profile
      const newProfile = await createUserProfile(googleUser.uid, {
        username: googleUser.displayName || googleUser.email.split('@')[0],
        email: googleUser.email,
      })

      setUser(newProfile)
      setIsLoading(false)
      return { success: true, message: "สมัครสมาชิกด้วย Google สำเร็จ" }
    } catch (error: any) {
      setIsLoading(false)
      console.error("Google register error:", error)
      if (error.code === 'auth/popup-closed-by-user') {
        return { success: false, message: "ยกเลิกการสมัครสมาชิก" }
      }
      return { success: false, message: "เกิดข้อผิดพลาดในการสมัครสมาชิกด้วย Google" }
    }
  }, [])

  const value = useMemo(() => ({
    user,
    isLoading,
    loading: isLoading, // alias for compatibility
    login,
    register,
    loginWithGoogle,
    registerWithGoogle,
    logout,
    updateUser,
    updateUserProfile,
  }), [user, isLoading, login, register, loginWithGoogle, registerWithGoogle, logout, updateUser, updateUserProfile])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
