export function safeSocialProfile(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 250) return null
  const match = /^(?:https:\/\/)?(?:www\.)?(x\.com|twitter\.com|instagram\.com|linkedin\.com)\/([A-Za-z0-9_./-]+)$/i.exec(value.trim())
  if (!match) return null
  const host = match[1].toLowerCase(),
    path = match[2].replace(/\/$/, '')
  if (host === 'linkedin.com') return /^(in|company)\/[A-Za-z0-9_-]{1,100}$/.test(path) ? 'https://www.linkedin.com/' + path : null
  const reserved = new Set([
    'intent', 'share', 'login', 'signup', 'explore', 'home', 'i', 'p', 'reel', 'reels', 'stories', 'accounts', 'direct',
    'oauth', 'search', 'settings', 'tos', 'privacy', 'about', 'help', 'download', 'downloads', 'messages',
    'notifications', 'compose', 'hashtag', 'jobs', 'account', 'web', 'developer', 'developers', 'legal', 'directory',
    'challenge', 'tv', 'press', 'api', 'graphql', 'logout', 'business', 'ads',
  ])
  if (reserved.has(path.toLowerCase())) return null
  if (host === 'instagram.com') {
    if (!/^[A-Za-z0-9_](?:[A-Za-z0-9_.]{0,28}[A-Za-z0-9_])?$/.test(path) || path.includes('..')) return null
  } else if (!/^[A-Za-z0-9_]{1,15}$/.test(path)) return null
  return 'https://' + (host === 'twitter.com' ? 'x.com' : host) + '/' + path
}
