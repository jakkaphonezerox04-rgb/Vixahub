import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('[API] Creating simple test data...')
    
    // สร้างข้อมูลทดสอบแบบง่าย
    const testData = {
      slug: 'test04',
      subdomain: 'test04',
      name: 'Test04 Website',
      url: 'https://test04.vixahub-2.vercel.app',
      plan: 'Basic',
      status: 'active',
      createdDate: new Date().toLocaleDateString('th-TH'),
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('th-TH'),
      visitors: 0,
      revenue: 0,
      thumbnail: '/portfolio-website-showcase.png',
      description: 'Test04 website for debugging',
      userId: 'test-user-123',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    console.log('[API] Test data created:', testData)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Simple test data created successfully!',
      data: testData
    })
    
  } catch (error) {
    console.error('[API] Error creating simple test data:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create simple test data' 
    }, { status: 500 })
  }
}
