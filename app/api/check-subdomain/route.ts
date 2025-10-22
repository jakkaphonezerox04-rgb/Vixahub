import { NextRequest, NextResponse } from 'next/server'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { firestore } from '@/lib/firebase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const subdomain = searchParams.get('subdomain')

    if (!subdomain) {
      return NextResponse.json({ available: false, error: 'Subdomain is required' })
    }

    // ตรวจสอบรูปแบบ subdomain
    const subdomainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/
    if (!subdomainRegex.test(subdomain)) {
      return NextResponse.json({ 
        available: false, 
        error: 'Subdomain must contain only lowercase letters, numbers, and hyphens' 
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

    // ตรวจสอบในฐานข้อมูลว่า subdomain ถูกใช้แล้วหรือไม่
    const websitesRef = collection(firestore, 'websites')
    const q = query(websitesRef, where('subdomain', '==', subdomain))
    const querySnapshot = await getDocs(q)

    if (!querySnapshot.empty) {
      return NextResponse.json({ available: false, error: 'Subdomain already exists' })
    }

    return NextResponse.json({ available: true })

  } catch (error) {
    console.error('Error checking subdomain:', error)
    return NextResponse.json({ 
      available: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
