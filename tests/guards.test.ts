import {expect, it} from 'vitest'
import {extendedClose, safeCompanyName, safeSocialProfile, shouldExtend} from '../src/index'

it.each([
  'https://claim.example',
  'SCAM.XYZ',
  'claim dot com',
  'claim[.]com',
  '@claim',
  'Connect your wallet',
  'CLAIM FREE TOKENS',
  '0x' + 'a'.repeat(40),
])('rejects company links and wallet scams: %s', name => expect(safeCompanyName(name)).toBeNull())

it.each(['Acme Inc.', 'Smith & Co.', 'Studio 42'])('keeps ordinary company names: %s', name => expect(safeCompanyName(name)).toBe(name))
it('allows an explicitly reviewed domain', () => expect(safeCompanyName('example.com', ['example.com'])).toBe('example.com'))

it('allows a direct profile', () => expect(safeSocialProfile('https://x.com/example')).toBe('https://x.com/example'))
it('normalizes twitter.com', () => expect(safeSocialProfile('https://twitter.com/example')).toBe('https://x.com/example'))
it.each(['javascript:alert(1)', 'http://x.com/example', 'https://x.com/intent', 'https://x.com/example/status/1'])(
  'rejects unsafe profiles: %s',
  url => expect(safeSocialProfile(url)).toBeNull(),
)

it('extends an on-time bid in the last 10 minutes', () => {
  const close = new Date('2026-01-01T12:00:00Z')
  const bidAt = new Date('2026-01-01T11:55:00Z')
  const now = new Date('2026-01-01T11:55:00Z')
  expect(shouldExtend(close, bidAt, now)).toBe(true)
  expect(extendedClose(close).toISOString()).toBe('2026-01-01T12:10:00.000Z')
})
it('does not extend a bid outside the window', () => {
  const close = new Date('2026-01-01T12:00:00Z')
  expect(shouldExtend(close, new Date('2026-01-01T11:00:00Z'), new Date('2026-01-01T11:00:00Z'))).toBe(false)
})
