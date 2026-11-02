import { EncryptJWT, jwtDecrypt } from 'jose'
import { cookies } from 'next/headers'

function getSecret(): Uint8Array {
  const s = process.env.SESSION_SECRET
  if (!s || s.length < 32) throw new Error('SESSION_SECRET must be at least 32 characters')
  return new TextEncoder().encode(s)
}

export type Session = {
  sub: string
  email?: string
  name?: string
  picture?: string
  accessToken: string
  idToken?: string
  expiresAt: number
}

export async function encryptSession(session: Session): Promise<string> {
  return new EncryptJWT(session as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .setExpirationTime('8h')
    .setIssuedAt()
    .encrypt(getSecret())
}

export async function decryptSession(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtDecrypt(token, getSecret())
    const s = payload as unknown as Session
    if (s.expiresAt && Date.now() > s.expiresAt) return null
    return s
  } catch {
    return null
  }
}

export async function getSession(portal: string): Promise<Session | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(`session_${portal}`)?.value
  if (!token) return null
  return decryptSession(token)
}
