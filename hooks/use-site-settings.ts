import { useState, useEffect } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { firestore } from '@/lib/firebase'

export interface SiteSettings {
  websiteName: string
  backgroundColor: string
  textColor: string
  themeAccentColor: string
  backgroundImageUrl: string
  logoImageUrl: string
  webhookUrl: string
  deliveryWebhookUrl: string
  reportWebhookUrl: string
  fineWebhookUrl: string
  leaveTypes: string[]
  deliveryTypes: string[]
  fineList: { name: string; amount: number }[]
}

const defaultSettings: SiteSettings = {
  websiteName: '',
  backgroundColor: '#1a1a2e',
  textColor: '#ffffff',
  themeAccentColor: '#a855f7',
  backgroundImageUrl: '',
  logoImageUrl: '',
  webhookUrl: '',
  deliveryWebhookUrl: '',
  reportWebhookUrl: '',
  fineWebhookUrl: '',
  leaveTypes: ['ลาป่วย', 'ลากิจ', 'ลาพักร้อน'],
  deliveryTypes: ['ส่งของทั่วไป', 'ส่งของด่วน', 'ส่งเอกสาร'],
  fineList: []
}

export function useSiteSettings(slug: string) {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settingsRef = doc(firestore, `cloned_sites/${slug}/settings`, 'site_settings')
        const settingsDoc = await getDoc(settingsRef)
        
        if (settingsDoc.exists()) {
          setSettings({ ...defaultSettings, ...settingsDoc.data() as SiteSettings })
        }
      } catch (error) {
        console.error('Error loading settings:', error)
      } finally {
        setLoading(false)
      }
    }

    if (slug) {
      loadSettings()
    }
  }, [slug])

  return { settings, loading }
}

