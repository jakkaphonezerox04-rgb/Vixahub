"use client"
import { ReactNode } from 'react'
import { useSiteSettings } from '@/hooks/use-site-settings'
import Image from 'next/image'

interface ClonedSiteLayoutProps {
  slug: string
  children: ReactNode
  className?: string
  showLogo?: boolean
  logoClassName?: string
}

export function ClonedSiteLayout({ 
  slug, 
  children, 
  className = '',
  showLogo = false,
  logoClassName = 'w-10 h-10'
}: ClonedSiteLayoutProps) {
  const { settings, loading } = useSiteSettings(slug)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-purple-950">
        <div className="text-white text-lg">กำลังโหลด...</div>
      </div>
    )
  }

  return (
    <div 
      data-cloned-site="true"
      className={`min-h-screen ${className}`}
      style={{
        background: settings.backgroundImageUrl 
          ? `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(${settings.backgroundImageUrl}) center/cover fixed`
          : `linear-gradient(to bottom right, ${settings.backgroundColor || '#000000'}, #1f2937, #581c87)`,
        // @ts-ignore - CSS variables
        '--text-color': settings.textColor || '#ffffff',
        '--theme-color': settings.themeAccentColor || '#a855f7',
        '--bg-color': settings.backgroundColor || '#1a1a2e',
        color: settings.textColor || '#ffffff'
      }}
    >
      {children}
    </div>
  )
}

export function SiteLogo({ slug, className = 'w-10 h-10' }: { slug: string; className?: string }) {
  const { settings } = useSiteSettings(slug)
  
  if (!settings.logoImageUrl) return null
  
  return (
    <div className={`relative ${className} flex-shrink-0`}>
      <Image
        src={settings.logoImageUrl}
        alt="Logo"
        fill
        className="object-contain"
        unoptimized
      />
    </div>
  )
}

