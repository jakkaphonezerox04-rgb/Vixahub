"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { getWebsiteBySlug } from "@/lib/firebase-websites"
import { ClonedSiteAuthProvider, useClonedSiteAuth } from "@/contexts/cloned-site-auth-context"

function ClonedSiteHomeContent() {
  const params = useParams<{ slug: string }>()
  const router = useRouter()
  const { checkSession } = useClonedSiteAuth()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkSiteAndAuth = async () => {
      try {
        console.log(`[CLONED-SITE] Checking website for slug: ${params.slug}`)
        const website = await getWebsiteBySlug(params.slug)
        console.log(`[CLONED-SITE] Website result:`, website)
        
        if (website) {
          console.log(`[CLONED-SITE] Website found, checking session...`)
          // Check if user is already logged in
          const sessionUser = await checkSession(params.slug)
          if (sessionUser) {
            console.log(`[CLONED-SITE] User logged in, redirecting to dashboard`)
            // User is logged in, redirect to dashboard
            router.push(`/${params.slug}/dashboard`)
          } else {
            console.log(`[CLONED-SITE] User not logged in, redirecting to login`)
            // User is not logged in, redirect to login
            router.push(`/${params.slug}/login`)
          }
        } else {
          console.log(`[CLONED-SITE] Website not found, redirecting to home`)
          router.push("/")
        }
      } catch (error) {
        console.error("Error:", error)
        router.push("/")
      } finally {
        setIsLoading(false)
      }
    }
    checkSiteAndAuth()
  }, [params.slug, router, checkSession])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-black to-blue-950">
        <div className="text-white text-lg">กำลังโหลด...</div>
      </div>
    )
  }

  return null
}

export default function ClonedSiteHomePage() {
  return (
    <ClonedSiteAuthProvider>
      <ClonedSiteHomeContent />
    </ClonedSiteAuthProvider>
  )
}
