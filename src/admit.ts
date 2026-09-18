import {nextBid} from './bid'
import {extendedClose, shouldExtend} from './extend'
import {resolveProxy} from './proxy'
import type {Bid} from './types'

export function admit(standing: Bid[], incoming: Bid, closesAt: Date, bidAt = new Date(), now = new Date()) {
  const previous = standing[0]
  const bid = incoming.max_amount != null ? {...incoming, amount: nextBid(previous?.amount || 0)} : incoming
  const resolved = resolveProxy([...standing, bid])
  if (!resolved.winner) throw new Error('Unable to resolve bidding.')
  const displaced = previous && previous.id !== resolved.winner.id ? resolved.offers.find(o => o.id === previous.id) : undefined
  const beaten = resolved.offers.find(o => o.id === bid.id)
  return {
    ...resolved,
    extend: shouldExtend(closesAt, bidAt, now) ? extendedClose(closesAt) : null,
    notify: [displaced, beaten && beaten.id !== resolved.winner.id ? beaten : undefined].filter(Boolean) as Bid[],
  }
}
