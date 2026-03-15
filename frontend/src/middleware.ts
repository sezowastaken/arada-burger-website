import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const locales = ['tr', 'en']
const defaultLocale = 'tr'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Check if the pathname is missing a locale
  const pathnameIsMissingLocale = locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  )

  // Redirect if there is no locale
  if (pathnameIsMissingLocale) {
    // If it's the root, redirect to default
    if (pathname === '/') {
      return NextResponse.redirect(new URL(`/${defaultLocale}`, request.url))
    }
    
    // Otherwise, prepend default locale (optional, or just ignore for static files)
    // Next.js automatically ignores public/ and _next/ in most cases, but we can be explicit
    if (
      !pathname.startsWith('/api/') &&
      !pathname.startsWith('/_next/') &&
      !pathname.includes('.') // ignore files with extensions
    ) {
      return NextResponse.redirect(new URL(`/${defaultLocale}${pathname}`, request.url))
    }
  }
}

export const config = {
  matcher: [
    // Skip all internal paths (_next)
    '/((?!_next|api|brand|menu|images|favicon.ico).*)',
  ],
}
