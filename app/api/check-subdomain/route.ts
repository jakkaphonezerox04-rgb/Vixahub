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

    console.log(`[API] Checking subdomain: ${subdomain}`)

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

    // สำหรับตอนนี้ ให้ subdomain ที่ขึ้นต้นด้วย 'x' เป็น unavailable (เพื่อทดสอบ)
    // TODO: เปลี่ยนเป็น Firebase query จริง
    if (subdomain.startsWith('x')) {
      console.log(`[API] Subdomain ${subdomain} is already taken (test rule)`)
      return NextResponse.json({ 
        available: false, 
        error: 'โดเมนนี้มีคนใช้แล้ว กรุณาเลือกโดเมนอื่น' 
      })
    }

    console.log(`[API] Subdomain ${subdomain} is available`)
    return NextResponse.json({ available: true })

  } catch (error) {
    console.error('Error checking subdomain:', error)
    return NextResponse.json({ 
      available: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
