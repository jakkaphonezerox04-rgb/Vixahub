"use client"
import { useEffect, useState, useRef } from "react"
import type React from "react"
import { useParams, useRouter } from "next/navigation"
import { useClonedSiteAuth } from "@/contexts/cloned-site-auth-context"

interface ClonedSiteRouteGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  redirectTo?: string
}

export default function ClonedSiteRouteGuard({ 
  children, 
  requireAuth = true, 
  redirectTo 
}: ClonedSiteRouteGuardProps) {
  const params = useParams<{ slug: string }>()
  const { user, isLoading, checkSession } = useClonedSiteAuth()
  const router = useRouter()
  const defaultRedirectTo = `/${params.slug}/login`
  const finalRedirectTo = redirectTo || defaultRedirectTo
  const [hasChecked, setHasChecked] = useState(false)
  const isRedirecting = useRef(false)

  useEffect(() => {
    const verifyAuth = async () => {
      if (!isLoading && !hasChecked && !isRedirecting.current) {
        setHasChecked(true)
        const sessionUser = await checkSession(params.slug)
        
        if (requireAuth && !sessionUser) {
          console.log(`[ClonedSiteRouteGuard] Not authenticated, redirecting to ${finalRedirectTo}`)
          isRedirecting.current = true
          router.push(finalRedirectTo)
        } else if (!requireAuth && sessionUser) {
          console.log(`[ClonedSiteRouteGuard] Authenticated, redirecting to /${params.slug}/dashboard`)
          isRedirecting.current = true
          router.push(`/${params.slug}/dashboard`)
        }
      }
    }
    
    verifyAuth()
  }, [isLoading, hasChecked, params.slug, requireAuth, finalRedirectTo, router, checkSession])

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-black to-blue-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">กำลังโหลด...</p>
        </div>
      </div>
    )
  }

  // Don't render children if auth requirements aren't met
  if (requireAuth && !user) {
    return null
  }

  if (!requireAuth && user) {
    return null
  }

  return <>{children}</>
}
