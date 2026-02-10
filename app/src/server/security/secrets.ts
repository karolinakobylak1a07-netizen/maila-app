import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const resolveSecret = () => {
  const fromEnv =
    process.env.CLIENT_KEYS_ENCRYPTION_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    null;
  return fromEnv && fromEnv.trim().length > 0 ? fromEnv : "dev-local-credentials-secret";
};

const resolveKey = () => createHash("sha256").update(resolveSecret()).digest();

export const encryptSecret = (plainText: string) => {
  const iv = randomBytes(12);
  const key = resolveKey();
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
};

export const decryptSecret = (cipherText: string) => {
  const [ivRaw, tagRaw, payloadRaw] = cipherText.split(".");
  if (!ivRaw || !tagRaw || !payloadRaw) {
    throw new Error("INVALID_SECRET_PAYLOAD");
  }

  const iv = Buffer.from(ivRaw, "base64url");
  const tag = Buffer.from(tagRaw, "base64url");
  const encrypted = Buffer.from(payloadRaw, "base64url");
  const key = resolveKey();

  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const plain = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return plain.toString("utf8");
};

