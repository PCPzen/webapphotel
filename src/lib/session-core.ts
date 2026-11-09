export type UserRole = "admin" | "staff" | "tenant";

export interface SessionPayload {
  userId: string;
  role: UserRole;
  email?: string;
  name?: string;
  tenantId?: number;
  roomId?: number;
  iat: number;
  exp: number;
}

export const SESSION_COOKIE_NAME = "webhotel_session";
export const DEFAULT_MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds

/**
 * ดึงความลับ (Secret) สำหรับลงลายเซ็น HMAC-SHA256
 */
function getSecret(): string {
  const secret =
    process.env.SESSION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "webhotel-production-secure-signature-secret-key-32chars";
  return secret;
}

async function getCryptoKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function base64urlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlDecode(str: string): Uint8Array {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) base64 += "=";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * สร้าง Cryptographically Signed Session Token (HMAC-SHA256)
 */
export async function createSessionToken(
  data: Omit<SessionPayload, "exp" | "iat">,
  maxAgeSeconds = DEFAULT_MAX_AGE
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    ...data,
    iat: now,
    exp: now + maxAgeSeconds,
  };

  const enc = new TextEncoder();
  const payloadB64 = base64urlEncode(enc.encode(JSON.stringify(payload)));

  const key = await getCryptoKey(getSecret());
  const sigBuffer = await crypto.subtle.sign("HMAC", key, enc.encode(payloadB64));
  const sigB64 = base64urlEncode(new Uint8Array(sigBuffer));

  return `${payloadB64}.${sigB64}`;
}

/**
 * ตรวจสอบความถูกต้องและลายเซ็นของ Session Token
 * หากถูกแก้ไข ปลอมแปลง หรือหมดอายุ จะส่งกลับ null ทันที
 */
export async function verifySessionToken(token?: string | null): Promise<SessionPayload | null> {
  if (!token || typeof token !== "string") return null;

  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [payloadB64, sigB64] = parts;

    const key = await getCryptoKey(getSecret());
    const enc = new TextEncoder();
    const sigBytes = base64urlDecode(sigB64);

    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes as unknown as ArrayBuffer,
      enc.encode(payloadB64)
    );

    if (!isValid) return null;

    const dec = new TextDecoder();
    const payloadJson = dec.decode(base64urlDecode(payloadB64));
    const payload = JSON.parse(payloadJson) as SessionPayload;

    const now = Math.floor(Date.now() / 1000);
    if (!payload.exp || payload.exp < now) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
