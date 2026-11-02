import { NextRequest, NextResponse } from 'next/server'
import { isValidPortal } from '@/lib/portals'
import { encryptSession, type Session } from '@/lib/session'

export async function GET(req: NextRequest) {
  const base = process.env.APP_BASE_URL!
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const returnedState = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(`${base}?error=${encodeURIComponent(error)}`)
  }

  const storedState = req.cookies.get('pkce_state')?.value
  const verifier = req.cookies.get('pkce_verifier')?.value

  if (!code || !storedState || !verifier || returnedState !== storedState) {
    return NextResponse.redirect(`${base}?error=invalid_state`)
  }

  let portal: string
  try {
    const decoded = JSON.parse(Buffer.from(storedState, 'base64url').toString())
    portal = decoded.portal ?? ''
  } catch {
    return NextResponse.redirect(`${base}?error=invalid_state`)
  }

  if (!isValidPortal(portal)) {
    return NextResponse.redirect(`${base}?error=invalid_portal`)
  }

  const tokenRes = await fetch(`https://${process.env.AUTH0_DOMAIN}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.AUTH0_CLIENT_ID!,
      client_secret: process.env.AUTH0_CLIENT_SECRET!,
      code,
      redirect_uri: `${base}/api/auth/callback`,
      code_verifier: verifier,
    }),
  })

  if (!tokenRes.ok) {
    console.error('Token exchange failed', await tokenRes.text())
    return NextResponse.redirect(`${base}?error=token_exchange_failed`)
  }

  const { access_token, id_token, expires_in } = await tokenRes.json()

  let sub = '', email: string | undefined, name: string | undefined, picture: string | undefined
  try {
    const payload = JSON.parse(Buffer.from(id_token.split('.')[1], 'base64url').toString())
    sub = payload.sub ?? ''
    email = payload.email
    name = payload.name
    picture = payload.picture
  } catch {
    return NextResponse.redirect(`${base}?error=id_token_decode_failed`)
  }

  const session: Session = {
    sub, email, name, picture,
    accessToken: access_token,
    idToken: id_token,
    expiresAt: Date.now() + (expires_in ?? 3600) * 1000,
  }

  const encrypted = await encryptSession(session)
  const res = NextResponse.redirect(`${base}/${portal}`)

  res.cookies.set(`session_${portal}`, encrypted, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 8 * 60 * 60,
  })

  res.cookies.set('pkce_verifier', '', { maxAge: 0, path: '/' })
  res.cookies.set('pkce_state', '', { maxAge: 0, path: '/' })

  return res
}
