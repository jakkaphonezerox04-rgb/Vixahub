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
    const websitesRef = collection(firestore, WEBSITES_COLLECTION)
    const q = query(websitesRef, where('slug', '==', slug))
    const snapshot = await getDocs(q)
    
    if (snapshot.empty) {
      return null
    }
    
    const doc = snapshot.docs[0]
    return {
      id: doc.id,
      ...doc.data()
    } as Website
  } catch (error) {
    console.error('Error fetching website by slug:', error)
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
      name: data.name.trim(),
      url: `https://vixahub.web.app/${slug}`,
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

