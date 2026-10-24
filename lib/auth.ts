import bcrypt from "bcryptjs";
import crypto from "crypto";

const TOKEN_PREFIX = "local";
const VERIFICATION_TTL_MS = 1000 * 60 * 60 * 24;
const ACCESS_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;

function tokenSecret() {
  const secret = process.env.AUTH_TOKEN_SECRET || process.env.NEXTAUTH_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("Missing AUTH_TOKEN_SECRET configuration.");
  }
  return "development-only-token-secret";
}

function signature(payload: string) {
  return crypto.createHmac("sha256", tokenSecret()).update(payload).digest("hex");
}

export function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export function comparePassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export function issueAccessToken(userId: number) {
  const expiresAt = Math.floor(Date.now() / 1000) + ACCESS_TOKEN_TTL_SECONDS;
  const payload = `${userId}.${expiresAt}`;
  return `${TOKEN_PREFIX}.${payload}.${signature(payload)}`;
}

export function parseAccessToken(token: string | null | undefined) {
  if (!token) return null;
  const [prefix, rawId, rawExpiry, providedSignature] = token.split(".");
  if (prefix !== TOKEN_PREFIX || !rawId || !rawExpiry || !providedSignature) return null;
  const id = Number(rawId);
  const expiresAt = Number(rawExpiry);
  if (!Number.isInteger(id) || id <= 0 || !Number.isInteger(expiresAt) || expiresAt <= Math.floor(Date.now() / 1000)) return null;
  const expectedSignature = signature(`${rawId}.${rawExpiry}`);
  const providedBuffer = Buffer.from(providedSignature, "utf8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");
  if (providedBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(providedBuffer, expectedBuffer)) return null;
  return id;
}

export function makeVerificationToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function verificationExpiryDate() {
  return new Date(Date.now() + VERIFICATION_TTL_MS);
}
