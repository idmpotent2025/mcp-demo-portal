import { NextRequest, NextResponse } from 'next/server'
import { isValidPortal } from '@/lib/portals'

function base64url(buf: ArrayBuffer): string {
  return Buffer.from(buf).toString('base64url')
}

async function sha256(plain: string): Promise<ArrayBuffer> {
  return crypto.subtle.digest('SHA-256', new TextEncoder().encode(plain))
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ portal: string }> },
) {
  const { portal } = await params

  if (!isValidPortal(portal)) {
    return NextResponse.redirect(new URL('/', process.env.APP_BASE_URL!))
  }

  const clientId = process.env.AUTH0_CLIENT_ID!

  const verifier = base64url(crypto.getRandomValues(new Uint8Array(32)))
  const challenge = base64url(await sha256(verifier))
  const state = base64url(crypto.getRandomValues(new Uint8Array(16)))

  const callbackUrl = `${process.env.APP_BASE_URL}/api/auth/${portal}/callback`

  const authUrl = new URL(`https://${process.env.AUTH0_DOMAIN}/authorize`)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('redirect_uri', callbackUrl)
  authUrl.searchParams.set('scope', 'openid profile email offline_access')
  authUrl.searchParams.set('audience', process.env.AUTH0_AUDIENCE!)
  authUrl.searchParams.set('code_challenge', challenge)
  authUrl.searchParams.set('code_challenge_method', 'S256')
  authUrl.searchParams.set('state', state)
  authUrl.searchParams.set('ext-brand', portal)

  const res = NextResponse.redirect(authUrl)

  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 600,
  }

  res.cookies.set(`pkce_verifier_${portal}`, verifier, cookieOpts)
  res.cookies.set(`pkce_state_${portal}`, state, cookieOpts)

  return res
}
