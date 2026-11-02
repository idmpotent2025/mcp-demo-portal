import { NextRequest, NextResponse } from 'next/server'
import { isValidPortal } from '@/lib/portals'
import { encryptSession, type Session } from '@/lib/session'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ portal: string }> },
) {
  const { portal } = await params
  const base = process.env.APP_BASE_URL!

  if (!isValidPortal(portal)) {
    return NextResponse.redirect(base)
  }

  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const returnedState = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(`${base}?error=${encodeURIComponent(error)}`)
  }

  const storedState = req.cookies.get(`pkce_state_${portal}`)?.value
  const verifier = req.cookies.get(`pkce_verifier_${portal}`)?.value

  if (!code || !storedState || !verifier || returnedState !== storedState) {
    return NextResponse.redirect(`${base}?error=invalid_state`)
  }

  const clientId = process.env.AUTH0_CLIENT_ID!
  const clientSecret = process.env.AUTH0_CLIENT_SECRET!
  const callbackUrl = `${base}/api/auth/${portal}/callback`

  const tokenRes = await fetch(`https://${process.env.AUTH0_DOMAIN}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: callbackUrl,
      code_verifier: verifier,
    }),
  })

  if (!tokenRes.ok) {
    const body = await tokenRes.text()
    console.error('Token exchange failed', body)
    return NextResponse.redirect(`${base}?error=token_exchange_failed`)
  }

  const tokens = await tokenRes.json()
  const { access_token, id_token, expires_in } = tokens

  // Decode the ID token payload (no signature verification needed — we just got it from Auth0)
  let email: string | undefined
  let name: string | undefined
  let picture: string | undefined
  let sub: string = ''

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
    sub,
    email,
    name,
    picture,
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

  // Clear PKCE cookies
  res.cookies.set(`pkce_verifier_${portal}`, '', { maxAge: 0, path: '/' })
  res.cookies.set(`pkce_state_${portal}`, '', { maxAge: 0, path: '/' })

  return res
}
