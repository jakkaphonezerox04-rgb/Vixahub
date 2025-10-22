"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ClonedSiteAuthProvider, useClonedSiteAuth } from "@/contexts/cloned-site-auth-context"
import ClonedSiteRegisterForm from "@/components/cloned-site-register-form"

function ClonedSiteRegisterContent() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { register, registerWithGoogle } = useClonedSiteAuth()
  const [siteName, setSiteName] = useState<string>("")

  useEffect(() => {
    // Get site information from localStorage
    try {
      const raw = localStorage.getItem("websites")
      const list = raw ? JSON.parse(raw) : []
      const found = list.find((s: any) => s.id === params.id)
      if (found) {
        setSiteName(found.name)
      }
    } catch {
      setSiteName("เว็บไซต์")
    }
  }, [params.id])

  const handleRegister = async (userData: {
    username: string
    email: string
    password: string
    confirmPassword: string
    phone?: string
  }) => {
    return await register(params.id, userData)
  }

  const handleGoogleRegister = async () => {
    return await registerWithGoogle(params.id)
  }

  const handleSuccess = () => {
    router.push(`/preview/${params.id}/dashboard`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-black to-blue-950 px-6">
      <ClonedSiteRegisterForm
        siteId={params.id}
        siteName={siteName || "เว็บไซต์"}
        onRegister={handleRegister}
        onGoogleRegister={handleGoogleRegister}
        onSuccess={handleSuccess}
      />
    </div>
  )
}

export default function ClonedSiteRegister() {
  return (
    <ClonedSiteAuthProvider>
      <ClonedSiteRegisterContent />
    </ClonedSiteAuthProvider>
  )
}


