export type Bid = {
  id: string
  owner: string
  amount: number
  max_amount?: number | null
  admission_order?: string | null
  authorized_at?: string | null
  created_at: string
}

export type AuctionWindow = {
  closesAt: Date
  bidAt: Date
  now?: Date
  windowMs?: number
}
