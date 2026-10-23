import "server-only"

import { cookies, headers } from "next/headers"
import { auth } from "@/lib/auth"
import { createHmac, scryptSync, timingSafeEqual } from "node:crypto"

export const ADMIN_EMAIL = "momensah60@gmail.com"
// scrypt "salt:hash" of the admin password. The plain password is never stored.
const ADMIN_PASSWORD_HASH =
  "e22e46ddb74450e6d5edad85a935c95c:34566805fc01c1b6e4dead75d959e43a5200f89c21b322cf0dc27a85b59cb6052102694633cd25de2ccddfcab83f7f0893801fbdf379a66fba0900cf2b418c76"
const COOKIE_NAME = "emo_admin_session"
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

function secret(): string {
  const pw = process.env.ADMIN_PASSWORD
  if (!pw) throw new Error("ADMIN_PASSWORD is not set")
  return pw
}

// Signed token: base64(payload).hmac  — payload holds the email + issue time.
function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex")
}

function makeToken(): string {
  const payload = Buffer.from(`${ADMIN_EMAIL}:${Date.now()}`).toString("base64url")
  return `${payload}.${sign(payload)}`
}

function isValidToken(token: string | undefined): boolean {
  if (!token) return false
  const [payload, mac] = token.split(".")
  if (!payload || !mac) return false
  const expected = sign(payload)
  // Constant-time compare to avoid timing leaks.
  const a = Buffer.from(mac)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  if (!timingSafeEqual(a, b)) return false
  try {
    const decoded = Buffer.from(payload, "base64url").toString()
    return decoded.startsWith(`${ADMIN_EMAIL}:`)
  } catch {
    return false
  }
}

// Verify the incoming request carries a valid admin session cookie.
export async function isAdmin(): Promise<boolean> {
  const store = await cookies()
  if (isValidToken(store.get(COOKIE_NAME)?.value)) return true
  // Signing in on the regular /sign-in page with the admin account also counts.
  const session = await auth.api.getSession({ headers: await headers() })
  return session?.user.email.toLowerCase() === ADMIN_EMAIL
}

// Throws when the caller is not an authenticated admin. Use at the top of
// every admin-only server action and route.
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) throw new Error("Unauthorized")
}

function passwordMatches(password: string): boolean {
  const [salt, hash] = ADMIN_PASSWORD_HASH.split(":")
  const expected = Buffer.from(hash, "hex")
  const actual = scryptSync(password, salt, expected.length)
  return timingSafeEqual(actual, expected)
}

// Validate credentials and set the session cookie. Returns false on mismatch.
export async function signInAdmin(email: string, password: string): Promise<boolean> {
  const emailOk = email.trim().toLowerCase() === ADMIN_EMAIL
  // Always run the hash so a wrong email takes as long as a wrong password.
  const passOk = passwordMatches(password)
  if (!emailOk || !passOk) return false

  const store = await cookies()
  store.set(COOKIE_NAME, makeToken(), {
    httpOnly: true,
    secure: true,
    // "none" so the cookie survives the cross-site v0 preview iframe.
    sameSite: "none",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  })
  return true
}

export async function signOutAdmin(): Promise<void> {
  const store = await cookies()
  store.delete(COOKIE_NAME)
}
