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
    const { slug, dataType } = body

    if (!slug || !dataType) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400, headers: corsHeaders }
      )
    }

    console.log(`💾 [API] Loading ${dataType} for slug:`, slug)

    let result: any = {}

    switch (dataType) {
      case 'settings':
        const settingsRef = db.collection('cloned_sites').doc(slug).collection('settings').doc('site_settings')
        const settingsDoc = await settingsRef.get()
        result.settings = settingsDoc.exists ? settingsDoc.data() : null
        break

      case 'users':
        const usersRef = db.collection('cloned_sites').doc(slug).collection('users')
        const usersSnapshot = await usersRef.get()
        result.users = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        break

      case 'leave_requests':
        const leaveRef = db.collection('cloned_sites').doc(slug).collection('leave_requests')
        const leaveSnapshot = await leaveRef.orderBy('createdAt', 'desc').get()
        result.leaveRequests = leaveSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        break

      case 'fine_records':
        const fineRef = db.collection('cloned_sites').doc(slug).collection('fine_records')
        const fineSnapshot = await fineRef.orderBy('createdAt', 'desc').get()
        result.fineRecords = fineSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        break

      case 'invite_codes':
        const inviteRef = db.collection('cloned_sites').doc(slug).collection('invite_codes')
        const inviteSnapshot = await inviteRef.orderBy('createdAt', 'desc').get()
        result.inviteCodes = inviteSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        break

      case 'fine_items':
        const itemsRef = db.collection('cloned_sites').doc(slug).collection('fine_items')
        const itemsSnapshot = await itemsRef.get()
        result.fineItems = itemsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        break

      case 'stats':
        // Load basic stats
        const [usersSnapshot, leaveSnapshot, fineSnapshot] = await Promise.all([
          db.collection('cloned_sites').doc(slug).collection('users').get(),
          db.collection('cloned_sites').doc(slug).collection('leave_requests').get(),
          db.collection('cloned_sites').doc(slug).collection('fine_records').get()
        ])
        
        result.stats = {
          totalUsers: usersSnapshot.size,
          totalLeaveRequests: leaveSnapshot.size,
          totalFineRecords: fineSnapshot.size,
          pendingLeaveRequests: leaveSnapshot.docs.filter(doc => doc.data().status === 'pending').length,
          unpaidFines: fineSnapshot.docs.filter(doc => doc.data().status === 'ยังไม่ชำระ').length
        }
        break

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid data type' },
          { status: 400, headers: corsHeaders }
        )
    }

    console.log(`✅ [API] Loaded ${dataType} successfully`)

    return NextResponse.json(
      { 
        success: true, 
        data: result
      },
      { status: 200, headers: corsHeaders }
    )

  } catch (error) {
    console.error(`❌ [API] Error loading site data:`, error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'เกิดข้อผิดพลาดในการโหลดข้อมูล',
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
