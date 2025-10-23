/**
 * Firebase Websites Management
 * จัดการข้อมูลเว็บไซต์ที่ถูกโคลนใน Firestore
 */

import { firestore, auth } from './firebase'
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore'
import { createSlug, validateSlug, generateUniqueSlug } from './slug-utils'

export interface Website {
  id: string
  slug: string
  subdomain: string
  name: string
  url: string
  plan: string
  status: 'active' | 'expired' | 'suspended'
  createdDate: string
  expiryDate: string
  visitors: number
  revenue: number
  thumbnail: string
  description: string
  userId: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

const WEBSITES_COLLECTION = 'websites'

/**
 * ดึงรายการ slug ทั้งหมดที่มีอยู่แล้ว
 */
export async function getAllSlugs(): Promise<string[]> {
  try {
    const websitesRef = collection(firestore, WEBSITES_COLLECTION)
    const snapshot = await getDocs(websitesRef)
    return snapshot.docs.map(doc => doc.data().slug)
  } catch (error) {
    console.error('Error fetching slugs:', error)
    return []
  }
}

/**
 * ตรวจสอบว่า slug ถูกใช้งานแล้วหรือยัง
 */
export async function isSlugTaken(slug: string): Promise<boolean> {
  try {
    const websitesRef = collection(firestore, WEBSITES_COLLECTION)
    const q = query(websitesRef, where('slug', '==', slug))
    const snapshot = await getDocs(q)
    return !snapshot.empty
  } catch (error) {
    console.error('Error checking slug:', error)
    return false
  }
}

/**
 * ดึงข้อมูลเว็บไซต์จาก slug
 */
export async function getWebsiteBySlug(slug: string): Promise<Website | null> {
  try {
    console.log(`[FIREBASE] Searching for website with slug: ${slug}`)
    
    // Try to get from Firebase first
    const websitesRef = collection(firestore, WEBSITES_COLLECTION)
    const q = query(websitesRef, where('slug', '==', slug))
    const snapshot = await getDocs(q)
    
    console.log(`[FIREBASE] Query result: ${snapshot.docs.length} documents found`)
    
    if (!snapshot.empty) {
      const doc = snapshot.docs[0]
      const websiteData = {
        id: doc.id,
        ...doc.data()
      } as Website
      
      console.log(`[FIREBASE] Website found:`, websiteData)
      return websiteData
    }
    
    // If not found in Firebase, create a temporary website for any valid slug
    if (slug && slug.length > 0 && /^[a-zA-Z0-9-_]+$/.test(slug)) {
      const tempWebsite: Website = {
        id: `temp-${slug}-${Date.now()}`,
        slug: slug,
        subdomain: slug,
        name: `${slug.charAt(0).toUpperCase() + slug.slice(1)} Website`,
        url: `https://vixahub-2.vercel.app/${slug}`,
        plan: 'Basic',
        status: 'active',
        createdDate: new Date().toLocaleDateString('th-TH'),
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('th-TH'),
        visitors: 0,
        revenue: 0,
        thumbnail: '/portfolio-website-showcase.png',
        description: `Website for ${slug}`,
        userId: 'temp-user',
        createdAt: new Date() as any,
        updatedAt: new Date() as any,
      }
      
      console.log(`[FIREBASE] Created temporary website for:`, slug)
      return tempWebsite
    }
    
    console.log(`[FIREBASE] No website found with slug: ${slug}`)
    return null
  } catch (error) {
    console.error('Error fetching website by slug:', error)
    
    // Fallback: create temporary website even if Firebase fails
    if (slug && slug.length > 0 && /^[a-zA-Z0-9-_]+$/.test(slug)) {
      const tempWebsite: Website = {
        id: `temp-${slug}-${Date.now()}`,
        slug: slug,
        subdomain: slug,
        name: `${slug.charAt(0).toUpperCase() + slug.slice(1)} Website`,
        url: `https://vixahub-2.vercel.app/${slug}`,
        plan: 'Basic',
        status: 'active',
        createdDate: new Date().toLocaleDateString('th-TH'),
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('th-TH'),
        visitors: 0,
        revenue: 0,
        thumbnail: '/portfolio-website-showcase.png',
        description: `Website for ${slug}`,
        userId: 'temp-user',
        createdAt: new Date() as any,
        updatedAt: new Date() as any,
      }
      
      console.log(`[FIREBASE] Fallback: Created temporary website for:`, slug)
      return tempWebsite
    }
    
    return null
  }
}

/**
 * ดึงข้อมูลเว็บไซต์จาก ID
 */
export async function getWebsiteById(id: string): Promise<Website | null> {
  try {
    const websiteRef = doc(firestore, WEBSITES_COLLECTION, id)
    const snapshot = await getDoc(websiteRef)
    
    if (!snapshot.exists()) {
      return null
    }
    
    return {
      id: snapshot.id,
      ...snapshot.data()
    } as Website
  } catch (error) {
    console.error('Error fetching website by ID:', error)
    return null
  }
}

/**
 * ดึงรายการเว็บไซต์ทั้งหมดของ user
 */
export async function getUserWebsites(userId: string): Promise<Website[]> {
  try {
    // Validate userId
    if (!userId || userId === 'undefined' || userId === 'null') {
      console.warn('[FIREBASE] getUserWebsites called with invalid userId:', userId)
      return []
    }

    console.log('[FIREBASE] Fetching websites for userId:', userId)
    const websitesRef = collection(firestore, WEBSITES_COLLECTION)
    const q = query(
      websitesRef, 
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    )
    const snapshot = await getDocs(q)
    
    console.log('[FIREBASE] Found', snapshot.docs.length, 'websites')
    
    const websites = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Website))
    
    console.log('[FIREBASE] Returning websites:', websites)
    return websites
  } catch (error) {
    console.error('[FIREBASE] Error fetching user websites:', error)
    return []
  }
}

/**
 * สร้างเว็บไซต์ใหม่
 */
export async function createWebsite(data: {
  name: string
  plan: string
  thumbnail: string
  description: string
  subdomain: string
}): Promise<{ success: boolean; website?: Website; error?: string; slug?: string }> {
  try {
    // ตรวจสอบว่า user ล็อกอินหรือไม่
    const user = auth.currentUser
    if (!user || !user.uid) {
      console.error('[FIREBASE] No authenticated user found')
      return { success: false, error: 'กรุณาเข้าสู่ระบบก่อน' }
    }
    
    console.log('[FIREBASE] Creating website for user:', user.uid)
    console.log('[FIREBASE] Data:', data)
    
    // ตรวจสอบ subdomain availability
    const subdomainAvailable = await checkSubdomainAvailability(data.subdomain)
    if (!subdomainAvailable) {
      return { success: false, error: 'โดเมนนี้มีคนใช้แล้ว กรุณาเลือกโดเมนอื่น' }
    }

    // สร้าง slug จากชื่อเว็บไซต์
    let slug = createSlug(data.name)
    console.log('[FIREBASE] Initial slug:', slug)
    
    // ดึงรายการ slug ที่มีอยู่
    const existingSlugs = await getAllSlugs()
    console.log('[FIREBASE] Existing slugs:', existingSlugs)
    
    // ตรวจสอบความถูกต้องของ slug
    const validation = validateSlug(slug, existingSlugs)
    if (!validation.valid) {
      // ถ้า slug ไม่ valid หรือซ้ำ ให้สร้าง unique slug
      slug = generateUniqueSlug(slug, existingSlugs)
      console.log('[FIREBASE] Generated unique slug:', slug)
    }
    
    // สร้าง ID สำหรับเว็บไซต์
    const websiteId = `${Date.now()}_${Math.random().toString(36).substring(7)}`
    console.log('[FIREBASE] Website ID:', websiteId)
    
    // คำนวณวันหมดอายุ (1 เดือนจากวันนี้)
    const now = new Date()
    const oneMonthLater = new Date(now)
    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1)
    
    const website: Omit<Website, 'id'> = {
      slug,
      subdomain: data.subdomain,
      name: data.name.trim(),
      url: `https://vixahub-2.vercel.app/${data.subdomain}`,
      plan: data.plan,
      status: 'active',
      createdDate: now.toLocaleDateString('th-TH', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }),
      expiryDate: oneMonthLater.toLocaleDateString('th-TH', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }),
      visitors: 0,
      revenue: 0,
      thumbnail: data.thumbnail,
      description: data.description,
      userId: user.uid,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
    }
    
    console.log('[FIREBASE] Website object:', website)
    
    // บันทึกลง Firestore
    const websiteRef = doc(firestore, WEBSITES_COLLECTION, websiteId)
    await setDoc(websiteRef, website)
    
    console.log('[FIREBASE] Website saved successfully!')
    
    // สร้างข้อมูล cloned site ใน cloned_sites collection
    console.log('[FIREBASE] Creating cloned site data...')
    try {
      const clonedSiteRef = doc(firestore, 'cloned_sites', data.subdomain)
      const clonedSiteData = {
        websiteId: websiteId,
        subdomain: data.subdomain,
        slug: slug,
        name: data.name.trim(),
        plan: data.plan,
        status: 'active',
        userId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        // สร้างข้อมูลเริ่มต้นสำหรับ cloned site
        settings: {
          site_settings: {
            siteName: data.name.trim(),
            siteDescription: data.description,
            siteLogo: '',
            siteFavicon: '',
            primaryColor: '#8B5CF6',
            secondaryColor: '#06B6D4',
            fontFamily: 'Kanit',
            customCSS: '',
            customJS: '',
            analyticsCode: '',
            seoTitle: data.name.trim(),
            seoDescription: data.description,
            seoKeywords: '',
            socialMedia: {
              facebook: '',
              twitter: '',
              instagram: '',
              youtube: '',
              tiktok: ''
            },
            contactInfo: {
              email: '',
              phone: '',
              address: '',
              website: ''
            },
            leaveTypes: ['ป่วย', 'ลากิจ', 'ลาพักผ่อน', 'อื่นๆ'],
            deliveryTypes: ['อาหาร', 'ของใช้', 'เอกสาร', 'อื่นๆ'],
            reportTypes: ['ปัญหาทางเทคนิค', 'ข้อเสนอแนะ', 'การใช้งาน', 'อื่นๆ'],
            fineItems: [
              { name: 'มาสาย', amount: 50 },
              { name: 'ไม่มาเรียน', amount: 100 },
              { name: 'ไม่ส่งงาน', amount: 200 }
            ],
            webhookUrls: {
              leaveWebhookUrl: '',
              deliveryWebhookUrl: '',
              reportWebhookUrl: '',
              fineWebhookUrl: ''
            }
          }
        }
      }
      
      await setDoc(clonedSiteRef, clonedSiteData)
      console.log('[FIREBASE] Cloned site data created successfully!')
    } catch (clonedSiteError) {
      console.warn('[FIREBASE] Warning: Could not create cloned site data:', clonedSiteError)
      // ไม่ให้ error นี้หยุดการสร้าง website หลัก
    }
    
    return { 
      success: true, 
      website: { id: websiteId, ...website } as Website,
      slug 
    }
  } catch (error) {
    console.error('[FIREBASE] Error creating website:', error)
    return { 
      success: false, 
      error: 'เกิดข้อผิดพลาดในการสร้างเว็บไซต์' 
    }
  }
}

/**
 * อัพเดทข้อมูลเว็บไซต์
 */
export async function updateWebsite(
  websiteId: string, 
  data: Partial<Omit<Website, 'id' | 'slug' | 'userId' | 'createdAt'>>
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = auth.currentUser
    if (!user || !user.uid) {
      return { success: false, error: 'กรุณาเข้าสู่ระบบก่อน' }
    }
    
    const websiteRef = doc(firestore, WEBSITES_COLLECTION, websiteId)
    const websiteDoc = await getDoc(websiteRef)
    
    if (!websiteDoc.exists()) {
      return { success: false, error: 'ไม่พบเว็บไซต์' }
    }
    
    // ตรวจสอบว่าเป็นเจ้าของเว็บไซต์หรือไม่
    if (websiteDoc.data().userId !== user.uid) {
      return { success: false, error: 'คุณไม่มีสิทธิ์แก้ไขเว็บไซต์นี้' }
    }
    
    await updateDoc(websiteRef, {
      ...data,
      updatedAt: serverTimestamp(),
    })
    
    return { success: true }
  } catch (error) {
    console.error('Error updating website:', error)
    return { success: false, error: 'เกิดข้อผิดพลาดในการอัพเดทเว็บไซต์' }
  }
}

/**
 * ลบเว็บไซต์
 */
export async function deleteWebsite(websiteId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const user = auth.currentUser
    if (!user || !user.uid) {
      return { success: false, error: 'กรุณาเข้าสู่ระบบก่อน' }
    }
    
    const websiteRef = doc(firestore, WEBSITES_COLLECTION, websiteId)
    const websiteDoc = await getDoc(websiteRef)
    
    if (!websiteDoc.exists()) {
      return { success: false, error: 'ไม่พบเว็บไซต์' }
    }
    
    // ตรวจสอบว่าเป็นเจ้าของเว็บไซต์หรือไม่
    if (websiteDoc.data().userId !== user.uid) {
      return { success: false, error: 'คุณไม่มีสิทธิ์ลบเว็บไซต์นี้' }
    }
    
    await deleteDoc(websiteRef)
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting website:', error)
    return { success: false, error: 'เกิดข้อผิดพลาดในการลบเว็บไซต์' }
  }
}

/**
 * ตรวจสอบ subdomain availability
 */
export async function checkSubdomainAvailability(subdomain: string): Promise<boolean> {
  try {
    const websitesRef = collection(firestore, WEBSITES_COLLECTION)
    const q = query(websitesRef, where('subdomain', '==', subdomain))
    const querySnapshot = await getDocs(q)
    return querySnapshot.empty
  } catch (error) {
    console.error('Error checking subdomain availability:', error)
    return false
  }
}

