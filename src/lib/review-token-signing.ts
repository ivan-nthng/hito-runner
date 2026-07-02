const BASE64_BINARY_CHUNK_SIZE = 0x8000;

export function stableJsonStringify(value: unknown): string {
  return JSON.stringify(sortJsonValue(value));
}

export function stableJsonEqual(left: unknown, right: unknown) {
  return stableJsonStringify(left) === stableJsonStringify(right);
}

export async function digestSha256Hex(payload: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(payload));

  return bytesToHex(digest);
}

export async function signStableJsonPayload(payload: unknown, secret: string | null | undefined) {
  const serializedPayload = stableJsonStringify(payload);

  if (!secret) {
    return `sha256:${await digestSha256Hex(serializedPayload)}`;
  }

  return `hmac-sha256:${await hmacSha256Hex(secret, serializedPayload)}`;
}

export function safeTokenEqual(left: string, right: string) {
  if (left.length !== right.length) {
    return false;
  }

  let mismatch = 0;

  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return mismatch === 0;
}

export function base64UrlEncodeUtf8(value: string) {
  return btoa(utf8StringToBinaryString(value))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

export function base64UrlDecodeUtf8(value: string) {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");

  return binaryStringToUtf8String(atob(padded));
}

async function hmacSha256Hex(secret: string, payload: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));

  return bytesToHex(signature);
}

function bytesToHex(value: ArrayBuffer) {
  return Array.from(new Uint8Array(value))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function sortJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => sortJsonValue(entry));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
        .map(([key, nestedValue]) => [key, sortJsonValue(nestedValue)]),
    );
  }

  return value;
}

function utf8StringToBinaryString(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";

  for (let start = 0; start < bytes.length; start += BASE64_BINARY_CHUNK_SIZE) {
    binary += String.fromCharCode(...bytes.subarray(start, start + BASE64_BINARY_CHUNK_SIZE));
  }

  return binary;
}

function binaryStringToUtf8String(value: string) {
  const bytes = new Uint8Array(value.length);

  for (let index = 0; index < value.length; index += 1) {
    bytes[index] = value.charCodeAt(index);
  }

  return new TextDecoder().decode(bytes);
}
