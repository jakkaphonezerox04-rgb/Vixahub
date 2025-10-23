import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    let subdomain = searchParams.get('subdomain')

    if (!subdomain) {
      return NextResponse.json({ available: false, error: 'Subdomain is required' })
    }

    // แปลงเป็นตัวพิมพ์เล็กและลบอักขระที่ไม่ต้องการ
    subdomain = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '')

    console.log(`[API-ADMIN] Checking subdomain: ${subdomain}`)

    // ตรวจสอบรูปแบบ subdomain
    const subdomainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/
    if (!subdomainRegex.test(subdomain)) {
      return NextResponse.json({ 
        available: false, 
        error: 'Subdomain must contain only letters, numbers, and hyphens' 
      })
    }

    // ตรวจสอบ subdomain ที่ห้ามใช้
    const reservedSubdomains = [
      'www', 'api', 'admin', 'app', 'mail', 'ftp', 'blog', 'shop', 'store',
      'support', 'help', 'docs', 'status', 'cdn', 'assets', 'static',
      'test', 'dev', 'staging', 'demo', 'example', 'localhost'
    ]

    if (reservedSubdomains.includes(subdomain)) {
      return NextResponse.json({ 
        available: false, 
        error: 'This subdomain is reserved and cannot be used' 
      })
    }

    // ตรวจสอบในฐานข้อมูลผ่าน REST API
    console.log(`[API-ADMIN] Querying Firestore via REST API for subdomain: ${subdomain}`)
    
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDsxkKY3M9476plC9NUIIeuXrPfH0EUB8Y",
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "vixahub"
    }

    const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/websites`
    const queryParams = new URLSearchParams({
      'where': `subdomain=="${subdomain}"`
    })

    const response = await fetch(`${url}?${queryParams}`)
    const data = await response.json()

    console.log(`[API-ADMIN] Firestore response:`, data)
    
    if (data.documents && data.documents.length > 0) {
      console.log(`[API-ADMIN] Subdomain ${subdomain} is already taken`)
      return NextResponse.json({ 
        available: false, 
        error: 'โดเมนนี้มีคนใช้แล้ว กรุณาเลือกโดเมนอื่น' 
      })
    }

    console.log(`[API-ADMIN] Subdomain ${subdomain} is available`)
    return NextResponse.json({ available: true })

  } catch (error) {
    console.error('Error checking subdomain:', error)
    return NextResponse.json({ 
      available: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

