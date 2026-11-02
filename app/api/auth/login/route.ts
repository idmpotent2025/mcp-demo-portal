import { NextRequest, NextResponse } from 'next/server'
import { isValidPortal } from '@/lib/portals'

function base64url(buf: ArrayBuffer | Uint8Array): string {
  return Buffer.from(buf).toString('base64url')
}

async function sha256(plain: string): Promise<ArrayBuffer> {
  return crypto.subtle.digest('SHA-256', new TextEncoder().encode(plain))
}

export async function GET(req: NextRequest) {
  const base = process.env.APP_BASE_URL!
  const portal = req.nextUrl.searchParams.get('portal') ?? ''

  if (!isValidPortal(portal)) {
    return NextResponse.redirect(base)
  }

  const verifier = base64url(crypto.getRandomValues(new Uint8Array(32)))
  const challenge = base64url(await sha256(verifier))

  // Encode portal + nonce into state — Auth0 returns it unchanged so the
  // callback can reconstruct which portal initiated the flow without any
  // portal-specific Auth0 configuration.
  const nonce = base64url(crypto.getRandomValues(new Uint8Array(16)))
  const state = base64url(Buffer.from(JSON.stringify({ portal, nonce })))

  const authUrl = new URL(`https://${process.env.AUTH0_DOMAIN}/authorize`)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('client_id', process.env.AUTH0_CLIENT_ID!)
  authUrl.searchParams.set('redirect_uri', `${base}/api/auth/callback`)
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

  res.cookies.set('pkce_verifier', verifier, cookieOpts)
  res.cookies.set('pkce_state', state, cookieOpts)

  return res
}
