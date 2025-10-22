import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  const hostname = request.headers.get('host') || ''
  
  // ตรวจสอบว่าเป็น subdomain หรือไม่
  const subdomain = hostname.split('.')[0]
  
  // ถ้าเป็น subdomain และไม่ใช่ www หรือ api
  if (subdomain && subdomain !== 'www' && subdomain !== 'api' && !hostname.includes('localhost')) {
    // เปลี่ยน path เป็น /[slug] โดยใช้ subdomain เป็น slug
    url.pathname = `/${subdomain}${url.pathname}`
    return NextResponse.rewrite(url)
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
