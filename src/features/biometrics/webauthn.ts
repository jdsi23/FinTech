/**
 * WebAuthn platform-authenticator wrapper used as a per-device "unlock
 * gate" for an already-authenticated Firebase session — not as a Firebase
 * sign-in method itself. Firebase Spark has no Cloud Functions, so there is
 * no server (relying party) to issue challenges or verify signatures
 * against; we don't need one, because we never use the signature for
 * anything. A successfully resolved `navigator.credentials.get()` call is
 * itself the proof that the OS's biometric/PIN check passed — the browser
 * enforces that natively and it can't be scripted around. This protects
 * against someone picking up an unlocked device/browser profile; it does
 * not protect against extracting the Firebase session token directly from
 * IndexedDB, which is an inherent ceiling for a client-only app.
 */

const STORAGE_PREFIX = 'forecastflow:biometric:'

function base64UrlToBytes(base64Url: string): Uint8Array<ArrayBuffer> {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (!window.PublicKeyCredential?.isUserVerifyingPlatformAuthenticatorAvailable) return false
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
  } catch {
    return false
  }
}

export function hasBiometricCredential(uid: string): boolean {
  return localStorage.getItem(STORAGE_PREFIX + uid) !== null
}

export function removeBiometricCredential(uid: string): void {
  localStorage.removeItem(STORAGE_PREFIX + uid)
}

export async function registerBiometricCredential(uid: string, email: string): Promise<void> {
  const credential = await navigator.credentials.create({
    publicKey: {
      rp: { name: 'ForecastFlow', id: window.location.hostname },
      user: { id: new TextEncoder().encode(uid), name: email, displayName: email },
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 }, // ES256
        { type: 'public-key', alg: -257 }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
      },
      timeout: 60000,
      attestation: 'none',
    },
  })

  if (!(credential instanceof PublicKeyCredential)) {
    throw new Error('Could not create a biometric credential on this device.')
  }

  localStorage.setItem(STORAGE_PREFIX + uid, credential.id)
}

export async function verifyBiometricUnlock(uid: string): Promise<boolean> {
  const credentialId = localStorage.getItem(STORAGE_PREFIX + uid)
  if (!credentialId) return false

  try {
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        allowCredentials: [{ type: 'public-key', id: base64UrlToBytes(credentialId) }],
        userVerification: 'required',
        timeout: 60000,
      },
    })
    return assertion instanceof PublicKeyCredential
  } catch {
    return false
  }
}
