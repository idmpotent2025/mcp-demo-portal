import { NextRequest, NextResponse } from 'next/server'
import { isValidPortal } from '@/lib/portals'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ portal: string }> },
) {
  const { portal } = await params

  const returnTo = process.env.APP_BASE_URL!

  if (!isValidPortal(portal)) {
    return NextResponse.redirect(returnTo)
  }

  const clientId = process.env.AUTH0_CLIENT_ID!

  const res = NextResponse.redirect(
    `https://${process.env.AUTH0_DOMAIN}/v2/logout?client_id=${clientId}&returnTo=${encodeURIComponent(returnTo)}`,
  )

  res.cookies.set(`session_${portal}`, '', { maxAge: 0, path: '/' })

  return res
}
