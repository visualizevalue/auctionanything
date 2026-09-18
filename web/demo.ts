import {admit, nextBid, OPENING_BID} from '../src/index'
import type {Bid} from '../src/types'

export type HistoryItem = {id: string; amount: number; company: string | null; social: string | null; at: string; automatic: boolean}
export type LiveBid = Bid & {company: string; public_company: boolean; social: string | null; capture_before: string}

const HOURS = 48
let admission = 0
let closesAt = new Date(Date.now() + HOURS * 3600 * 1000).toISOString()
let bids: LiveBid[] = []
let history: HistoryItem[] = []

function standing() {
  const now = Date.now()
  return bids
    .filter(b => Date.parse(b.capture_before) > now)
    .sort((a, b) => b.amount - a.amount || Number(a.admission_order || 0) - Number(b.admission_order || 0))
}

export function snapshot() {
  const live = standing()
  const high = live[0]
  const current = high?.amount || 0
  return {
    commission: {open: Date.parse(closesAt) > Date.now(), closesAt, serverNow: new Date().toISOString()},
    bid: {
      current,
      minimum: nextBid(current) || OPENING_BID,
      company: high?.public_company ? high.company : high ? 'Anonymous' : null,
      social: high?.social || null,
    },
    history: {count: history.length, items: history.slice(0, 50)},
  }
}

export function placeBid(input: {owner: string; company: string; maxAmount: number; publicCompany: boolean; social: string | null}) {
  if (Date.parse(closesAt) <= Date.now()) throw new Error('Bidding is closed.')
  const live = standing()
  if (live.some(b => b.owner === input.owner)) throw new Error('Withdraw your existing offer before changing your maximum.')
  const min = nextBid(live[0]?.amount || 0)
  if (input.maxAmount < min) throw new Error(`Enter at least $${(min / 100).toFixed(2)}.`)
  admission += 1
  const incoming: LiveBid = {
    id: crypto.randomUUID(),
    owner: input.owner,
    company: input.company,
    amount: min,
    max_amount: input.maxAmount,
    public_company: input.publicCompany,
    social: input.social,
    admission_order: String(admission),
    authorized_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    capture_before: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
  }
  const result = admit(live, incoming, new Date(closesAt), new Date(), new Date())
  if (result.extend) closesAt = result.extend.toISOString()
  bids = result.offers.map(o => {
    const prev = [...live, incoming].find(b => b.id === o.id)!
    return {...prev, ...o}
  })
  const admitted = bids.find(b => b.id === incoming.id)!
  const previous = live[0]
  if (previous && previous.amount !== (bids.find(b => b.id === previous.id)?.amount || previous.amount)) {
    history.unshift({id: crypto.randomUUID(), amount: bids.find(b => b.id === previous.id)!.amount, company: previous.public_company ? previous.company : null, social: previous.social, at: new Date().toISOString(), automatic: true})
  }
  history.unshift({
    id: crypto.randomUUID(),
    amount: admitted.amount,
    company: admitted.public_company ? admitted.company : null,
    social: admitted.social,
    at: admitted.authorized_at!,
    automatic: false,
  })
  return admitted
}
