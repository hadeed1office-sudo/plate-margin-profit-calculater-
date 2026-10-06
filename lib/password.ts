export async function hashPassword(password: string, salt?: string) {
  const used = salt ?? bytesToHex(crypto.getRandomValues(new Uint8Array(16)));
  const data = new TextEncoder().encode(`${used}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return `${used}:${bytesToHex(new Uint8Array(digest))}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [salt] = stored.split(":");
  if (!salt) return false;
  const next = await hashPassword(password, salt);
  return next === stored;
}

function bytesToHex(bytes: Uint8Array) {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function resetCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}
