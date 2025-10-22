"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ClonedSiteAuthProvider, useClonedSiteAuth } from "@/contexts/cloned-site-auth-context"
import ClonedSiteRegisterForm from "@/components/cloned-site-register-form"
import ClonedSiteRouteGuard from "@/components/cloned-site-route-guard"
import { collection, getDocs } from "firebase/firestore"
import { firestore } from "@/lib/firebase"

function ClonedSiteRegisterContent() {
  const params = useParams<{ slug: string }>()
  const router = useRouter()
  const { register, registerWithGoogle } = useClonedSiteAuth()
  const [siteId, setSiteId] = useState<string>("")
  const [siteName, setSiteName] = useState<string>("")
  const [isFirstUser, setIsFirstUser] = useState<boolean>(false)

  useEffect(() => {
    // Get site information from Firebase
    const loadSite = async () => {
      try {
        const { getWebsiteBySlug } = await import("@/lib/firebase-websites")
        const website = await getWebsiteBySlug(params.slug)
        if (website) {
          setSiteId(website.id)
          setSiteName(website.name)
          
          // Check if this is the first user
          const usersRef = collection(firestore, `cloned_sites/${params.slug}/users`)
          const snapshot = await getDocs(usersRef)
          setIsFirstUser(snapshot.empty)
        } else {
          router.push("/")
        }
      } catch (error) {
        console.error("Error loading site:", error)
        router.push("/")
      }
    }
    loadSite()
  }, [params.slug, router])

  const handleRegister = async (userData: {
    username: string
    email: string
    password: string
    confirmPassword: string
    phone?: string
    role: string
    inviteCode?: string
  }) => {
    // ใช้ slug แทน siteId เพื่อให้ตรงกับระบบใหม่
    return await register(params.slug, userData)
  }

  const handleGoogleRegister = async () => {
    // ใช้ slug แทน siteId เพื่อให้ตรงกับระบบใหม่
    return await registerWithGoogle(params.slug)
  }

  const handleSuccess = () => {
    router.push(`/${params.slug}/dashboard`)
  }

  if (!siteName) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-black to-blue-950">
        <div className="text-white text-lg">กำลังโหลด...</div>
      </div>
    )
  }

  return (
    <ClonedSiteRouteGuard requireAuth={false}>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-black to-blue-950 px-6">
        <ClonedSiteRegisterForm
          siteId={params.slug}
          siteName={siteName || "เว็บไซต์"}
          onRegister={handleRegister}
          onGoogleRegister={handleGoogleRegister}
          onSuccess={handleSuccess}
          isFirstUser={isFirstUser}
        />
      </div>
    </ClonedSiteRouteGuard>
  )
}

export default function ClonedSiteRegister() {
  return (
    <ClonedSiteAuthProvider>
      <ClonedSiteRegisterContent />
    </ClonedSiteAuthProvider>
  )
}


