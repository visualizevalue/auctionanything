import {expect, it} from 'vitest'
import {admit, nextBid, reserveAmount, resolveProxy, visibleOffer} from '../src/index'
import type {Bid} from '../src/types'

function bid(id: string, amount: number, max: number | null, time = 1): Bid {
  return {
    id,
    owner: id + '@example.test',
    amount,
    max_amount: max,
    authorized_at: new Date(time * 1000).toISOString(),
    created_at: new Date(time * 1000).toISOString(),
  }
}

it('opens at $1', () => expect(nextBid(0)).toBe(100))
it('starts a sole maximum at the opening public price', () => {
  expect(resolveProxy([bid('a', 100, 1000000)]).winner?.amount).toBe(100)
})
it('a standing maximum automatically beats a lower challenger without exposing its ceiling', () => {
  const r = resolveProxy([bid('a', 100, 100000), bid('b', 110, 10000, 2)])
  expect(r.winner).toMatchObject({id: 'a', amount: 11000})
  expect(r.offers.find(o => o.id === 'b')?.amount).toBe(10000)
})
it('a higher maximum pays only the next increment above the runner-up ceiling', () => {
  expect(resolveProxy([bid('a', 100, 10000), bid('b', 110, 100000, 2)]).winner).toMatchObject({id: 'b', amount: 11000})
})
it('stops automatic bidding at the reserved maximum', () => {
  expect(resolveProxy([bid('a', 100, 10000), bid('b', 110, 10500, 2)]).winner).toMatchObject({id: 'b', amount: 10500})
})
it('equal maxima favor the earlier admitted bidder', () => {
  for (const bids of [
    [bid('b', 110, 10000, 2), bid('a', 100, 10000)],
    [bid('a', 100, 10000), bid('b', 110, 10000, 2)],
  ])
    expect(resolveProxy(bids).winner).toMatchObject({id: 'a', amount: 10000})
})
it('does not lower a price after a competitor withdraws', () => {
  expect(resolveProxy([bid('a', 40000, 100000)]).winner?.amount).toBe(40000)
})
it('does not compete against multiple bids from the same person', () => {
  const a = bid('a', 100, 100000)
  const b = {...bid('b', 110, 90000, 2), owner: a.owner}
  expect(resolveProxy([a, b]).winner?.amount).toBe(110)
})
it('strips hidden maxima from everyone except the owner', () => {
  const o = bid('a', 100, 100000)
  expect(visibleOffer(o, 'admin@example.test')).not.toHaveProperty('max_amount')
  expect(visibleOffer(o, o.owner)).toHaveProperty('max_amount', 100000)
})
it('never exceeds any reserve', () => {
  for (let a = 100; a < 100000; a += 997) {
    for (let b = 110; b < 100000; b += 1543) {
      const r = resolveProxy([bid('a', 100, a), bid('b', 110, b, 2)])
      expect(r.winner!.amount).toBeGreaterThanOrEqual(110)
      for (const o of r.offers) expect(o.amount).toBeLessThanOrEqual(reserveAmount(o))
    }
  }
})
it('uses admission sequence for equal maxima', () => {
  const earlier = {...bid('z', 100, 10000), admission_order: '1'}
  const later = {...bid('a', 110, 10000), admission_order: '2'}
  expect(resolveProxy([later, earlier]).winner?.id).toBe('z')
})
it('admits a new maximum and flags the displaced leader', () => {
  const close = new Date('2026-01-01T12:00:00Z')
  const r = admit([bid('a', 100, 10000)], bid('b', 110, 100000, 2), close, new Date('2026-01-01T10:00:00Z'), new Date('2026-01-01T10:00:00Z'))
  expect(r.winner?.id).toBe('b')
  expect(r.extend).toBeNull()
  expect(r.notify[0]?.id).toBe('a')
})
