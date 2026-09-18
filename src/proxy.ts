import {nextBid, reserveAmount} from './bid'
import type {Bid} from './types'

export function resolveProxy(offers: Bid[]) {
  const ranked = [...offers].sort(
    (a, b) =>
      reserveAmount(b) - reserveAmount(a) ||
      Number(a.admission_order || 0) - Number(b.admission_order || 0) ||
      new Date(a.authorized_at || a.created_at).getTime() - new Date(b.authorized_at || b.created_at).getTime() ||
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime() ||
      a.id.localeCompare(b.id),
  )
  const distinct = ranked.filter((o, i) => ranked.findIndex(b => b.owner.toLowerCase() === o.owner.toLowerCase()) === i)
  const first = distinct[0]
  if (!first) return {winner: null, offers: [] as Bid[]}
  const second = distinct[1]
  const standing = Math.max(...offers.map(o => o.amount))
  const price = Math.min(
    reserveAmount(first),
    Math.max(standing, first.amount, second ? nextBid(reserveAmount(second)) : 100),
  )
  const resolved = offers.map(o => ({
    ...o,
    amount: o.id === first.id ? price : distinct.some(d => d.id === o.id) ? reserveAmount(o) : o.amount,
  }))
  return {winner: resolved.find(o => o.id === first.id)!, offers: resolved}
}

export function visibleOffer<T extends {owner: string; max_amount?: number | null}>(offer: T, email: string): T {
  if (offer.owner === email) return offer
  const {max_amount: _privateMaximum, ...visible} = offer
  return visible as T
}
