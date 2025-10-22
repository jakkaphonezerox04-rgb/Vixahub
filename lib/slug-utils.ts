/**
 * Slug Utilities
 * สำหรับจัดการ URL slug ของเว็บไซต์ที่ถูกโคลน
 */

/**
 * สร้าง slug จากชื่อเว็บไซต์
 * - แปลงเป็นตัวพิมพ์เล็ก
 * - แปลงภาษาไทยเป็น Latin
 * - ลบอักขระพิเศษ
 * - แทนที่ช่องว่างด้วย dash
 */
export function createSlug(name: string): string {
  let slug = name.trim().toLowerCase()
  
  // แปลงภาษาไทยเป็น Latin (transliteration พื้นฐาน)
  const thaiToLatin: Record<string, string> = {
    'ก': 'k', 'ข': 'kh', 'ค': 'kh', 'ฆ': 'kh', 'ง': 'ng',
    'จ': 'ch', 'ฉ': 'ch', 'ช': 'ch', 'ซ': 's', 'ฌ': 'ch',
    'ญ': 'y', 'ฎ': 'd', 'ฏ': 't', 'ฐ': 'th', 'ฑ': 'th',
    'ฒ': 'th', 'ณ': 'n', 'ด': 'd', 'ต': 't', 'ถ': 'th',
    'ท': 'th', 'ธ': 'th', 'น': 'n', 'บ': 'b', 'ป': 'p',
    'ผ': 'ph', 'ฝ': 'f', 'พ': 'ph', 'ฟ': 'f', 'ภ': 'ph',
    'ม': 'm', 'ย': 'y', 'ร': 'r', 'ล': 'l', 'ว': 'w',
    'ศ': 's', 'ษ': 's', 'ส': 's', 'ห': 'h', 'ฬ': 'l',
    'อ': 'o', 'ฮ': 'h',
    'ะ': 'a', 'า': 'a', 'ิ': 'i', 'ี': 'i', 'ึ': 'ue',
    'ื': 'ue', 'ุ': 'u', 'ู': 'u', 'เ': 'e', 'แ': 'ae',
    'โ': 'o', 'ใ': 'ai', 'ไ': 'ai', 'ำ': 'am',
    '่': '', '้': '', '๊': '', '๋': '', '์': '', 'ั': 'a',
    '็': '', 'ๆ': '', 'ฯ': ''
  }
  
  // แปลงตัวอักษรไทยเป็น Latin
  slug = slug.split('').map(char => thaiToLatin[char] || char).join('')
  
  // ลบอักขระพิเศษ เหลือแต่ a-z, 0-9, dash, underscore
  slug = slug.replace(/[^a-z0-9-_\s]/g, '')
  
  // แทนที่ช่องว่างและ underscore หลายตัวติดกันด้วย dash
  slug = slug.replace(/[\s_]+/g, '-')
  
  // ลบ dash ที่ซ้ำกัน
  slug = slug.replace(/-+/g, '-')
  
  // ลบ dash ที่อยู่หน้าและหลัง
  slug = slug.replace(/^-+|-+$/g, '')
  
  // ถ้าหลังจากประมวลผลแล้วเป็นค่าว่าง ให้ใช้ timestamp
  if (!slug) {
    slug = `site-${Date.now()}`
  }
  
  return slug
}

/**
 * ตรวจสอบว่า slug ถูกต้องตามรูปแบบหรือไม่
 */
export function isValidSlug(slug: string): boolean {
  // slug ต้องมีแค่ a-z, 0-9, dash
  // ความยาว 3-63 ตัวอักษร
  // ไม่ขึ้นต้นหรือลงท้ายด้วย dash
  const slugRegex = /^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$/
  return slugRegex.test(slug)
}

/**
 * Reserved slugs ที่ไม่อนุญาตให้ใช้
 * (เพื่อไม่ให้ชนกับ routes ของระบบหลัก)
 */
const RESERVED_SLUGS = [
  'api',
  'admin',
  'dashboard',
  'user-dashboard',
  'login',
  'register',
  'forgot-password',
  'pricing',
  'contact',
  'preview',
  'settings',
  '_next',
  'public',
  'static',
  'assets',
  'about',
  'terms',
  'privacy',
  'help',
  'support',
  'blog',
  'docs',
  'documentation',
]

/**
 * ตรวจสอบว่า slug เป็น reserved keyword หรือไม่
 */
export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.includes(slug.toLowerCase())
}

/**
 * สร้าง slug ที่ไม่ซ้ำโดยเพิ่มตัวเลขท้าย
 */
export function generateUniqueSlug(baseSlug: string, existingSlugs: string[]): string {
  let slug = baseSlug
  let counter = 1
  
  while (existingSlugs.includes(slug)) {
    slug = `${baseSlug}-${counter}`
    counter++
  }
  
  return slug
}

/**
 * ตรวจสอบว่า slug สามารถใช้ได้หรือไม่
 */
export function validateSlug(slug: string, existingSlugs: string[] = []): {
  valid: boolean
  error?: string
} {
  if (!slug || slug.trim().length === 0) {
    return { valid: false, error: 'กรุณากรอกชื่อเว็บไซต์' }
  }
  
  if (slug.length < 3) {
    return { valid: false, error: 'ชื่อเว็บไซต์ต้องมีอักขระอย่างน้อย 3 ตัว' }
  }
  
  if (slug.length > 63) {
    return { valid: false, error: 'ชื่อเว็บไซต์ต้องไม่เกิน 63 ตัวอักษร' }
  }
  
  if (!isValidSlug(slug)) {
    return { 
      valid: false, 
      error: 'ชื่อเว็บไซต์สามารถใช้ได้เฉพาะตัวอักษร a-z, 0-9 และ dash (-)' 
    }
  }
  
  if (isReservedSlug(slug)) {
    return { 
      valid: false, 
      error: 'ชื่อนี้ถูกสงวนไว้โดยระบบ กรุณาเลือกชื่ออื่น' 
    }
  }
  
  if (existingSlugs.includes(slug)) {
    return { 
      valid: false, 
      error: 'ชื่อนี้ถูกใช้งานแล้ว กรุณาเลือกชื่ออื่น' 
    }
  }
  
  return { valid: true }
}

