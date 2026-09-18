-- Generic tables. No buyer data ships with this repo.

CREATE TABLE IF NOT EXISTS auction_offers (
  id uuid PRIMARY KEY,
  owner text NOT NULL,
  company text NOT NULL,
  amount integer NOT NULL CHECK (amount >= 100 AND amount <= 99999999),
  max_amount integer CHECK (max_amount >= amount AND max_amount <= 99999999),
  public_bid boolean NOT NULL DEFAULT true,
  public_company boolean NOT NULL DEFAULT false,
  outbid_email boolean NOT NULL DEFAULT false,
  social_profile text,
  status text NOT NULL DEFAULT 'draft',
  version integer NOT NULL DEFAULT 1,
  admission_order bigint,
  authorized_at timestamptz,
  checkout_id text UNIQUE,
  payment_intent text UNIQUE,
  capture_before timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS auction_offers_owner ON auction_offers (owner);
CREATE SEQUENCE IF NOT EXISTS auction_bid_admission;

CREATE TABLE IF NOT EXISTS auction (
  id integer PRIMARY KEY CHECK (id = 1),
  opens_at timestamptz NOT NULL DEFAULT now(),
  closes_at timestamptz NOT NULL DEFAULT (now() + interval '48 hours')
);
INSERT INTO auction (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS auction_slot (
  id integer PRIMARY KEY CHECK (id = 1),
  offer_id uuid NOT NULL UNIQUE,
  claimed_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS auction_events (
  id bigserial PRIMARY KEY,
  offer_id uuid NOT NULL REFERENCES auction_offers (id),
  actor text NOT NULL,
  action text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS auction_outbid_emails (
  id bigserial PRIMARY KEY,
  recipient text NOT NULL,
  losing_offer uuid NOT NULL REFERENCES auction_offers (id),
  winning_offer uuid NOT NULL REFERENCES auction_offers (id),
  winning_version integer NOT NULL,
  old_amount integer NOT NULL,
  new_amount integer NOT NULL,
  closes_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  first_attempt_at timestamptz,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  payload jsonb,
  sent_at timestamptz,
  UNIQUE (losing_offer, winning_offer, winning_version)
);

-- Anti-snipe: any on-time bid in the last 10 minutes extends the close by 10 minutes.
-- UPDATE auction SET closes_at = closes_at + interval '10 minutes'
--  WHERE id = 1
--    AND closes_at > $bid_at
--    AND closes_at <= $bid_at + interval '10 minutes'
--    AND $bid_at + interval '10 minutes' > now();
