import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/lib/database.types'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient<Database>({ req, res })

  // Refresh session if expired - required for Server Components
  const { data: { session } } = await supabase.auth.getSession()

  // Check if the request is for the dashboard
  if (req.nextUrl.pathname.startsWith('/dashboard')) {
    if (!session) {
      // Redirect to login if no session
      const redirectUrl = new URL('/auth/login', req.url)
      redirectUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Check if the request is for auth pages while logged in
  if (req.nextUrl.pathname.startsWith('/auth') && session) {
    // Only redirect if not trying to access login page
    if (!req.nextUrl.pathname.startsWith('/auth/login')) {
      // Redirect to dashboard if already logged in
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  return res
}

// Specify which routes this middleware should run on
export const config = {
  matcher: ['/dashboard/:path*', '/auth/:path*']
} 