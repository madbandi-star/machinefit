/** Random OAuth CSRF / OIDC nonce (32 bytes hex). */
export function generateOAuthCsrfToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Constant-time string compare for state/nonce. */
export function oauthCsrfMatches(
  expected: string | null | undefined,
  received: string | null | undefined
): boolean {
  if (!expected || !received) return false;
  if (expected.length !== received.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i += 1) {
    diff |= expected.charCodeAt(i) ^ received.charCodeAt(i);
  }
  return diff === 0;
}
