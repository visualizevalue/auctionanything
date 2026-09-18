/** Amounts are integer cents. Opening bid is $1. */
export const OPENING_BID = 100
export const INCREMENT = 110

export function nextBid(current: number) {
  return Math.max(OPENING_BID, Math.ceil((current * INCREMENT) / 100))
}

export function reserveAmount(bid: {amount: number; max_amount?: number | null}) {
  return bid.max_amount ?? bid.amount
}

/** Postgres order used while a row lock is held. */
export const bidOrder =
  'amount DESC,COALESCE(max_amount,amount) DESC,admission_order ASC NULLS FIRST,authorized_at ASC,created_at ASC,id ASC'
