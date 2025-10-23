import { NextRequest, NextResponse } from 'next/server'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

// Initialize Firebase Admin
if (!getApps().length) {
  try {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID || "vixahub",
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    })
  } catch (error) {
    console.error('Firebase Admin initialization error:', error)
  }
}

const db = getFirestore()

export async function POST(request: NextRequest) {
  try {
    console.log('[API] Setting up Firebase data...')
    
    // ข้อมูลสำหรับ websites collection
    const websiteData = {
      slug: 'test04',
      subdomain: 'test04',
      name: 'Test04 Website',
      url: 'https://vixahub-2.vercel.app/test04',
      plan: 'Basic',
      status: 'active',
      createdDate: '23 ต.ค. 2567',
      expiryDate: '23 พ.ย. 2567',
      visitors: 0,
      revenue: 0,
      thumbnail: '/portfolio-website-showcase.png',
      description: 'Test04 website for debugging',
      userId: 'test-user-123',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // ข้อมูลสำหรับ cloned_sites collection
    const clonedSiteData = {
      websiteId: 'test04-website-id',
      subdomain: 'test04',
      slug: 'test04',
      name: 'Test04 Website',
      plan: 'Basic',
      status: 'active',
      userId: 'test-user-123',
      createdAt: new Date(),
      updatedAt: new Date(),
      settings: {
        site_settings: {
          siteName: 'Test04 Website',
          siteDescription: 'Test04 website for debugging',
          siteLogo: '',
          siteFavicon: '',
          primaryColor: '#8B5CF6',
          secondaryColor: '#06B6D4',
          fontFamily: 'Kanit',
          customCSS: '',
          customJS: '',
          analyticsCode: '',
          seoTitle: 'Test04 Website',
          seoDescription: 'Test04 website for debugging',
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

    // เพิ่มข้อมูลใน websites collection
    await db.collection('websites').doc('test04').set(websiteData)
    console.log('[API] Website data created')

    // เพิ่มข้อมูลใน cloned_sites collection
    await db.collection('cloned_sites').doc('test04').set(clonedSiteData)
    console.log('[API] Cloned site data created')

    return NextResponse.json({ 
      success: true, 
      message: 'Firebase data created successfully!',
      data: {
        website: websiteData,
        clonedSite: clonedSiteData
      }
    })

  } catch (error) {
    console.error('[API] Error setting up Firebase data:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create Firebase data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
