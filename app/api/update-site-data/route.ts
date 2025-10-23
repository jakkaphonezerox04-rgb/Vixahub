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
    const { slug, action, data } = body

    if (!slug || !action || !data) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400, headers: corsHeaders }
      )
    }

    console.log(`💾 [API] ${action} for slug:`, slug)

    let result: any = {}

    switch (action) {
      case 'updateUserRole':
        const userRef = db.collection('cloned_sites').doc(slug).collection('users').doc(data.userId)
        await userRef.update({ role: data.newRole })
        result.message = 'อัปเดต Role สำเร็จ'
        break

      case 'deleteUser':
        const deleteUserRef = db.collection('cloned_sites').doc(slug).collection('users').doc(data.userId)
        await deleteUserRef.delete()
        result.message = 'ลบผู้ใช้สำเร็จ'
        break

      case 'approveLeave':
        const leaveRef = db.collection('cloned_sites').doc(slug).collection('leave_requests').doc(data.leaveId)
        await leaveRef.update({ status: 'approved' })
        result.message = 'อนุมัติคำขอสำเร็จ'
        break

      case 'rejectLeave':
        const rejectLeaveRef = db.collection('cloned_sites').doc(slug).collection('leave_requests').doc(data.leaveId)
        await rejectLeaveRef.update({ status: 'rejected' })
        result.message = 'ปฏิเสธคำขอสำเร็จ'
        break

      case 'toggleFineStatus':
        const fineRef = db.collection('cloned_sites').doc(slug).collection('fine_records').doc(data.fineId)
        await fineRef.update({ status: data.newStatus })
        result.message = `เปลี่ยนสถานะเป็น ${data.newStatus}`
        break

      case 'addInviteCode':
        const inviteRef = db.collection('cloned_sites').doc(slug).collection('invite_codes')
        await inviteRef.add({
          code: data.code,
          maxUses: data.maxUses,
          usedCount: 0,
          isActive: true,
          expiresAt: data.expiresAt,
          createdAt: new Date()
        })
        result.message = 'เพิ่มรหัสเชิญสำเร็จ'
        break

      case 'toggleInviteCode':
        const toggleInviteRef = db.collection('cloned_sites').doc(slug).collection('invite_codes').doc(data.inviteId)
        await toggleInviteRef.update({ isActive: data.isActive })
        result.message = `เปลี่ยนสถานะรหัสเชิญเป็น ${data.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}`
        break

      case 'deleteInviteCode':
        const deleteInviteRef = db.collection('cloned_sites').doc(slug).collection('invite_codes').doc(data.inviteId)
        await deleteInviteRef.delete()
        result.message = 'ลบรหัสเชิญสำเร็จ'
        break

      case 'addFineItem':
        const fineItemRef = db.collection('cloned_sites').doc(slug).collection('fine_items')
        await fineItemRef.add({
          name: data.name,
          amount: data.amount,
          description: data.description,
          isActive: true,
          createdAt: new Date()
        })
        result.message = 'เพิ่มรายการปรับสำเร็จ'
        break

      case 'toggleFineItem':
        const toggleFineItemRef = db.collection('cloned_sites').doc(slug).collection('fine_items').doc(data.itemId)
        await toggleFineItemRef.update({ isActive: data.isActive })
        result.message = data.isActive ? 'เปิดใช้งานรายการปรับสำเร็จ' : 'ปิดใช้งานรายการปรับสำเร็จ'
        break

      case 'deleteFineItem':
        const deleteFineItemRef = db.collection('cloned_sites').doc(slug).collection('fine_items').doc(data.itemId)
        await deleteFineItemRef.delete()
        result.message = 'ลบรายการปรับสำเร็จ'
        break

      case 'updateHouseName':
        const houseRef = db.collection('cloned_sites').doc(slug).collection('users').doc(data.userId)
        await houseRef.update({ houseName: data.newHouseName })
        result.message = 'อัปเดตชื่อบ้านสำเร็จ'
        break

      case 'addActivityLog':
        const activityRef = db.collection('cloned_sites').doc(slug).collection('activity_logs')
        await activityRef.add({
          action: data.action,
          details: data.details,
          timestamp: new Date(),
          siteSlug: slug
        })
        result.message = 'บันทึกกิจกรรมสำเร็จ'
        break

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400, headers: corsHeaders }
        )
    }

    console.log(`✅ [API] ${action} completed successfully`)

    return NextResponse.json(
      { 
        success: true, 
        message: result.message,
        data: result
      },
      { status: 200, headers: corsHeaders }
    )

  } catch (error) {
    console.error(`❌ [API] Error updating site data:`, error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล',
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
