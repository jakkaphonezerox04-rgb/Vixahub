import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  const hostname = request.headers.get('host') || ''
  
  console.log(`[MIDDLEWARE] Processing: ${hostname}${request.nextUrl.pathname}`)
  
  // ตรวจสอบว่าเป็น subdomain หรือไม่
  const subdomain = hostname.split('.')[0]
  
  // ถ้าเป็น subdomain และไม่ใช่ www หรือ api และไม่ใช่ main domain
  if (subdomain && 
      subdomain !== 'www' && 
      subdomain !== 'api' && 
      !hostname.includes('localhost') &&
      hostname.includes('vercel.app') &&
      subdomain !== 'vixahub-2') {
    
    // เปลี่ยน path เป็น /[slug] โดยใช้ subdomain เป็น slug
    url.pathname = `/${subdomain}${url.pathname}`
    console.log(`[MIDDLEWARE] Subdomain routing: ${hostname}${request.nextUrl.pathname} -> ${url.pathname}`)
    return NextResponse.rewrite(url)
  }
  
  // Path-based routing: ตรวจสอบ path ที่เริ่มต้นด้วย /[slug]
  const pathSegments = url.pathname.split('/').filter(Boolean)
  if (pathSegments.length > 0) {
    const firstSegment = pathSegments[0]
    
    // ตรวจสอบว่าเป็น slug ที่มีอยู่หรือไม่ (ไม่ใช่ api, _next, favicon.ico)
    if (firstSegment && 
        !firstSegment.startsWith('_') && 
        firstSegment !== 'api' && 
        firstSegment !== 'favicon.ico' &&
        firstSegment !== 'robots.txt' &&
        firstSegment !== 'sitemap.xml') {
      
      // ตรวจสอบว่าเป็นหน้าเว็บหลักหรือไม่
      if (url.pathname === '/' || url.pathname === '') {
        return NextResponse.next()
      }
      
      // Rewrite path เป็น /[slug] format
      const remainingPath = url.pathname.substring(`/${firstSegment}`.length)
      url.pathname = `/${firstSegment}${remainingPath}`
      console.log(`[MIDDLEWARE] Path-based routing: ${request.nextUrl.pathname} -> ${url.pathname}`)
      return NextResponse.rewrite(url)
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}