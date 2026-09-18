# Auction anything

A 48-hour proxy auction you can drop onto any lot.

Private maxima. Public prices. 10% increments. Last-10-minute bids add 10 minutes. One live offer per buyer.

Used in production at [visualizevalue.com/jack](https://visualizevalue.com/jack). This repo is the engine, the SQL, and a generic Next.js skeleton. It does **not** include buyer data, Stripe keys, inbox addresses, affiliate traffic, or the Jack brand.

## Run the skeleton

```bash
pnpm install
pnpm test
pnpm dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000). Bids live in memory for the process — no Postgres or Stripe required.

The page is the production layout with the names filed off: scrolling ticker, lot card, bid history, bid overlay, off-card settlement overlay. Swap the copy and wire `/api/auction` to your store.

## Engine

Amounts are integer cents. Opening bid is `$1`.

```ts
import {admit, nextBid, resolveProxy, shouldExtend, visibleOffer} from 'auctionanything'

nextBid(2000_00) // 2200_00 — next public floor (+10%)
```

`resolveProxy` ranks by reserved maximum, then admission time. The leader’s public price is

```
min(leaderMax, max(standing, leaderAmount, nextBid(runnerUpMax)))
```

so a higher maximum wins without publishing its ceiling. The last automatic step can be under 10% when the reserve is reached. Equal maxima keep the earlier bidder.

`admit` takes the current standing offers plus the incoming bid, returns the resolved book, who to notify, and whether the close should move.

`shouldExtend(closesAt, bidAt)` is true when the bid is on time and inside the last 10 minutes, and `bidAt + 10 minutes` is still in the future.

`visibleOffer` strips `max_amount` from everyone except the owner.

`safeCompanyName` and `safeSocialProfile` reject links, wallets, and reserved social paths. Pass reviewed domains into `safeCompanyName` if you want to allow a specific one.

## Persistence

[`schema.sql`](schema.sql) is the generic table set: `auction_offers`, `auction`, `auction_slot`, `auction_events`, `auction_outbid_emails`.

Admit under a transaction lock so two bids cannot resolve at once:

```sql
SELECT pg_advisory_xact_lock(740019);
```

Anti-snipe is a single update after a successful admit (also in `schema.sql`).

## What you still wire

The skeleton authorizes a bid without a card. Production should:

1. Create a Stripe Checkout Session with `capture_method: 'manual'` for the **maximum**, not the public price.
2. Admit only after the hold is authorized.
3. Capture the **public** winning amount if you accept; void everyone else.
4. Refund or void if a hold expires before close.

Stripe card holds work. Stripe stablecoin payments do not support reversible manual capture — keep those off checkout and use the settlement overlay (email it to your desk).

Environment placeholders are in [`.env.example`](.env.example). None of them are filled.

## License

MIT. Visualize Value, 2026.
