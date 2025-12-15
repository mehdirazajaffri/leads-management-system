import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const pathname = req.nextUrl.pathname

    // Redirect authenticated users away from login
    if (pathname === '/login' && token) {
      const redirectPath = token.role === 'ADMIN' ? '/admin/dashboard' : '/agent/dashboard'
      return NextResponse.redirect(new URL(redirectPath, req.url))
    }

    // Protect admin routes
    if (pathname.startsWith('/admin') && token?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/agent/dashboard', req.url))
    }

    // Protect agent routes
    if (pathname.startsWith('/agent') && token?.role !== 'AGENT' && token?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/admin/dashboard', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname

        // Allow access to login page
        if (pathname === '/login') {
          return true
        }

        // Require authentication for all other routes
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    '/admin/:path*',
    '/agent/:path*',
    '/login',
  ],
}

