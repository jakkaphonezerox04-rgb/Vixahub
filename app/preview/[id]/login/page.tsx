"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ClonedSiteAuthProvider, useClonedSiteAuth } from "@/contexts/cloned-site-auth-context"
import ClonedSiteLoginForm from "@/components/cloned-site-login-form"

function ClonedSiteLoginContent() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { login } = useClonedSiteAuth()
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

  const handleLogin = async (email: string, password: string) => {
    return await login(params.id, email, password)
  }

  const handleSuccess = () => {
    router.push(`/preview/${params.id}/dashboard`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-black to-blue-950 px-6">
      <ClonedSiteLoginForm
        siteId={params.id}
        siteName={siteName || "เว็บไซต์"}
        onLogin={handleLogin}
        onSuccess={handleSuccess}
      />
    </div>
  )
}

export default function ClonedSiteLogin() {
  return (
    <ClonedSiteAuthProvider>
      <ClonedSiteLoginContent />
    </ClonedSiteAuthProvider>
  )
}
