import { NextRequest, NextResponse } from 'next/server'
import { firestore } from '@/lib/firebase'
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore'

export async function POST(request: NextRequest) {
  try {
    console.log('[API] Setting up test data...')
    
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
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
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
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
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
    const websiteRef = doc(firestore, 'websites', 'test04')
    await setDoc(websiteRef, websiteData)
    console.log('[API] Website data created')

    // เพิ่มข้อมูลใน cloned_sites collection
    const clonedSiteRef = doc(firestore, 'cloned_sites', 'test04')
    await setDoc(clonedSiteRef, clonedSiteData)
    console.log('[API] Cloned site data created')

    return NextResponse.json({ 
      success: true, 
      message: 'Test data created successfully!',
      data: {
        website: websiteData,
        clonedSite: clonedSiteData
      }
    })

  } catch (error) {
    console.error('[API] Error setting up test data:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create test data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
