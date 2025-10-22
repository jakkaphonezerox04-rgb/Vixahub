"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ClonedSiteAuthProvider, useClonedSiteAuth } from "@/contexts/cloned-site-auth-context"
import ClonedSiteLoginForm from "@/components/cloned-site-login-form"
import ClonedSiteRouteGuard from "@/components/cloned-site-route-guard"

function ClonedSiteLoginContent() {
  const params = useParams<{ slug: string }>()
  const router = useRouter()
  const { login, loginWithGoogle } = useClonedSiteAuth()
  const [siteId, setSiteId] = useState<string>("")
  const [siteName, setSiteName] = useState<string>("")

  useEffect(() => {
    // Get site information from Firebase
    const loadSite = async () => {
      try {
        const { getWebsiteBySlug } = await import("@/lib/firebase-websites")
        const website = await getWebsiteBySlug(params.slug)
        if (website) {
          setSiteId(website.id)
          setSiteName(website.name)
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

  const handleLogin = async (email: string, password: string) => {
    // ใช้ slug แทน siteId เพื่อให้ตรงกับระบบใหม่
    return await login(params.slug, email, password)
  }

  const handleGoogleLogin = async () => {
    // ใช้ slug แทน siteId เพื่อให้ตรงกับระบบใหม่
    return await loginWithGoogle(params.slug)
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
        <ClonedSiteLoginForm
          siteId={params.slug}
          siteName={siteName || "เว็บไซต์"}
          onLogin={handleLogin}
          onGoogleLogin={handleGoogleLogin}
          onSuccess={handleSuccess}
        />
      </div>
    </ClonedSiteRouteGuard>
  )
}

export default function ClonedSiteLogin() {
  return (
    <ClonedSiteAuthProvider>
      <ClonedSiteLoginContent />
    </ClonedSiteAuthProvider>
  )
}
