import crypto from 'crypto';

export function generateCodeVerifier(length = 64): string {
  // 64 bytes to 86 base64url chars, then slice to desired length
  const bytes = crypto.randomBytes(64);
  return base64url(bytes).slice(0, length);
}

export function codeChallengeFromVerifier(verifier: string): string {
  const hash = crypto.createHash('sha256').update(verifier).digest();
  return base64url(hash);
}

function base64url(buf: Buffer): string {
  return buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}
