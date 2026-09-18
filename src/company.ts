export function safeCompanyName(value: unknown, allowedDomains: string[] = []): string | null {
  if (typeof value !== 'string') return null
  const name = value.normalize('NFKC').trim()
  if (!name || name.length > 200 || /[\p{Cc}\p{Cf}]/u.test(name)) return null
  if (new Set(allowedDomains.map(d => d.toLowerCase())).has(name.toLowerCase())) return name
  const probe = name.replace(/[。．｡]/g, '.').replace(/\s*(?:\[dot\]|\(dot\)|\bdot\b|\[\.\]|\(\.\))\s*/gi, '.')
  if (/(?:https?|hxxps?|www|mailto|javascript|data):|www\.|[@<>\[\]{}\/\\]|[\p{L}\p{N}-]+\s*\.\s*[\p{L}]{2,}/iu.test(probe)) return null
  if (/\b0x[a-f0-9]{40}\b|\bbc1[a-z0-9]{20,}\b|\b[1-9A-HJ-NP-Za-km-z]{32,44}\b/i.test(probe)) return null
  if (/\bairdrop\b|\bconnect\b.*\bwallet\b|\bseed phrase\b|\bclaim\b.*\b(?:tokens?|rewards?|crypto)\b/i.test(probe)) return null
  return name
}
