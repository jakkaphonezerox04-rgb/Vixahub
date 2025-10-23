import { NextRequest, NextResponse } from 'next/server'
import { firestore } from '@/lib/firebase'
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore'

export async function POST(request: NextRequest) {
  try {
    console.log('[API] Initializing Firebase with real data...')
    
    // ข้อมูลสำหรับ websites collection
    const websitesData = [
      {
        id: 'test04',
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
        description: 'Test04 website for testing',
        userId: 'test-user-123',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      {
        id: 'test',
        slug: 'test',
        subdomain: 'test',
        name: 'Test Website',
        url: 'https://vixahub-2.vercel.app/test',
        plan: 'Basic',
        status: 'active',
        createdDate: '23 ต.ค. 2567',
        expiryDate: '23 พ.ย. 2567',
        visitors: 0,
        revenue: 0,
        thumbnail: '/portfolio-website-showcase.png',
        description: 'Test website for testing',
        userId: 'test-user-123',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      {
        id: 'demo',
        slug: 'demo',
        subdomain: 'demo',
        name: 'Demo Website',
        url: 'https://vixahub-2.vercel.app/demo',
        plan: 'Premium',
        status: 'active',
        createdDate: '23 ต.ค. 2567',
        expiryDate: '23 พ.ย. 2567',
        visitors: 150,
        revenue: 5000,
        thumbnail: '/portfolio-website-showcase.png',
        description: 'Demo website for showcasing features',
        userId: 'demo-user-456',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
    ]

    // ข้อมูลสำหรับ cloned_sites collection
    const clonedSitesData = [
      {
        id: 'test04',
        websiteId: 'test04',
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
            siteDescription: 'Test04 website for testing',
            siteLogo: '',
            siteFavicon: '',
            primaryColor: '#8B5CF6',
            secondaryColor: '#06B6D4',
            fontFamily: 'Kanit',
            customCSS: '',
            customJS: '',
            analyticsCode: '',
            seoTitle: 'Test04 Website',
            seoDescription: 'Test04 website for testing',
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
      },
      {
        id: 'test',
        websiteId: 'test',
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
            siteDescription: 'Test website for testing',
            siteLogo: '',
            siteFavicon: '',
            primaryColor: '#8B5CF6',
            secondaryColor: '#06B6D4',
            fontFamily: 'Kanit',
            customCSS: '',
            customJS: '',
            analyticsCode: '',
            seoTitle: 'Test Website',
            seoDescription: 'Test website for testing',
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
      },
      {
        id: 'demo',
        websiteId: 'demo',
        subdomain: 'demo',
        slug: 'demo',
        name: 'Demo Website',
        plan: 'Premium',
        status: 'active',
        userId: 'demo-user-456',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        settings: {
          site_settings: {
            siteName: 'Demo Website',
            siteDescription: 'Demo website for showcasing features',
            siteLogo: '',
            siteFavicon: '',
            primaryColor: '#8B5CF6',
            secondaryColor: '#06B6D4',
            fontFamily: 'Kanit',
            customCSS: '',
            customJS: '',
            analyticsCode: '',
            seoTitle: 'Demo Website',
            seoDescription: 'Demo website for showcasing features',
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
    ]

    // เพิ่มข้อมูลใน websites collection
    for (const website of websitesData) {
      const websiteRef = doc(firestore, 'websites', website.id)
      await setDoc(websiteRef, website)
      console.log(`[API] Website ${website.id} created`)
    }

    // เพิ่มข้อมูลใน cloned_sites collection
    for (const clonedSite of clonedSitesData) {
      const clonedSiteRef = doc(firestore, 'cloned_sites', clonedSite.id)
      await setDoc(clonedSiteRef, clonedSite)
      console.log(`[API] Cloned site ${clonedSite.id} created`)
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Firebase data initialized successfully!',
      data: {
        websites: websitesData.length,
        clonedSites: clonedSitesData.length
      }
    })

  } catch (error) {
    console.error('[API] Error initializing Firebase data:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to initialize Firebase data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
