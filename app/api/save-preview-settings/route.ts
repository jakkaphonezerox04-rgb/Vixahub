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
    // Add CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }

    // Handle preflight request
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 200, headers: corsHeaders })
    }

    const body = await request.json()
    const { id, siteSettings } = body

    if (!id || !siteSettings) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400, headers: corsHeaders }
      )
    }

    console.log('💾 [API] Saving preview settings for id:', id)
    console.log('💾 [API] Settings data:', siteSettings)

    // บันทึก settings ใน cloned_sites
    const settingsRef = db.collection('cloned_sites').doc(id).collection('settings').doc('site_settings')
    await settingsRef.set(siteSettings, { merge: true })
    console.log('✅ [API] Preview settings saved successfully')

    return NextResponse.json(
      { 
        success: true, 
        message: 'บันทึกการตั้งค่าสำเร็จ',
        data: { id, websiteName: siteSettings.websiteName }
      },
      { status: 200, headers: corsHeaders }
    )

  } catch (error) {
    console.error('❌ [API] Error saving preview settings:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'เกิดข้อผิดพลาดในการบันทึก',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500, headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }}
    )
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
