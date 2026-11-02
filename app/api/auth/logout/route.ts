import { NextRequest, NextResponse } from 'next/server'
import { isValidPortal } from '@/lib/portals'

export async function GET(req: NextRequest) {
  const returnTo = process.env.APP_BASE_URL!
  const portal = req.nextUrl.searchParams.get('portal') ?? ''

  const res = NextResponse.redirect(
    `https://${process.env.AUTH0_DOMAIN}/v2/logout?client_id=${process.env.AUTH0_CLIENT_ID}&returnTo=${encodeURIComponent(returnTo)}`,
  )

  if (isValidPortal(portal)) {
    res.cookies.set(`session_${portal}`, '', { maxAge: 0, path: '/' })
  }

  return res
}
