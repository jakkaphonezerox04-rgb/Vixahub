import { NextRequest, NextResponse } from 'next/server'
import { initializeApp, getApps } from 'firebase/app'
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDsxkKY3M9476plC9NUIIeuXrPfH0EUB8Y",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "vixahub.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "vixahub",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "vixahub.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:abcdef123456"
}

let app
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig)
} else {
  app = getApps()[0]
}

const firestore = getFirestore(app)

export async function POST(request: NextRequest) {
  try {
    console.log('[API] Creating test data...')
    
    // สร้างข้อมูล website
    const websiteData = {
      slug: 'test',
      subdomain: 'test',
      name: 'Test Website',
      url: 'https://vixahub-2.vercel.app/test',
      plan: 'Basic',
      status: 'active',
      createdDate: new Date().toLocaleDateString('th-TH'),
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('th-TH'),
      visitors: 0,
      revenue: 0,
      thumbnail: '/portfolio-website-showcase.png',
      description: 'Test website for debugging',
      userId: 'test-user-123',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
    
    const websiteRef = await addDoc(collection(firestore, 'websites'), websiteData)
    console.log('[API] Website created with ID:', websiteRef.id)
    
    // สร้างข้อมูล cloned site
    const clonedSiteData = {
      websiteId: websiteRef.id,
      subdomain: 'test',
      slug: 'test',
      name: 'Test Website',
      plan: 'Basic',
      status: 'active',
      userId: 'test-user-123',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      settings: {
        site_settings: {
          siteName: 'Test Website',
          siteDescription: 'Test website for debugging',
          siteLogo: '',
          siteFavicon: '',
          primaryColor: '#8B5CF6',
          secondaryColor: '#06B6D4',
          fontFamily: 'Kanit',
          customCSS: '',
          customJS: '',
          analyticsCode: '',
          seoTitle: 'Test Website',
          seoDescription: 'Test website for debugging',
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
    
    const clonedSiteRef = await addDoc(collection(firestore, 'cloned_sites'), clonedSiteData)
    console.log('[API] Cloned site created with ID:', clonedSiteRef.id)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Test data created successfully!',
      websiteId: websiteRef.id,
      clonedSiteId: clonedSiteRef.id
    })
    
  } catch (error) {
    console.error('[API] Error creating test data:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create test data' 
    }, { status: 500 })
  }
}
