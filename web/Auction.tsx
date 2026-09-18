'use client'
import {useEffect, useState} from 'react'
import {safeCompanyName, safeSocialProfile} from '../src/index'

const money = (n: number) =>
  new Intl.NumberFormat('en-US', {style: 'currency', currency: 'USD', maximumFractionDigits: n % 100 ? 2 : 0}).format(n / 100)

type Snapshot = {
  commission: {open: boolean; closesAt: string; serverNow: string}
  bid: {current: number; minimum: number; company: string | null; social: string | null}
  history: {count: number; items: {id: string; amount: number; company: string | null; social: string | null; at: string; automatic: boolean}[]}
}

async function api(path: string, method = 'GET', body?: unknown) {
  const r = await fetch(path, {method, headers: body ? {'Content-Type': 'application/json'} : undefined, body: body ? JSON.stringify(body) : undefined, cache: 'no-store'})
  const d = await r.json().catch(() => ({error: 'Connection interrupted.'}))
  if (!r.ok) throw new Error(d.error || 'Could not complete request.')
  return d
}

export default function Auction() {
  const [data, setData] = useState<Snapshot | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [now, setNow] = useState(Date.now())
  const [offset, setOffset] = useState(0)
  const [open, setOpen] = useState<'bid' | 'settle' | null>(null)
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [budget, setBudget] = useState('')
  const [publicCompany, setPublicCompany] = useState(false)
  const [social, setSocial] = useState('')
  const [consent, setConsent] = useState(false)
  const [settle, setSettle] = useState({email: '', handle: '', max: '', currency: '', note: ''})
  const [sent, setSent] = useState(false)

  const seconds = data ? Math.max(0, Math.ceil((Date.parse(data.commission.closesAt) - now - offset) / 1000)) : null
  const live = Boolean(data?.commission.open && seconds && seconds > 0)
  const countdown = seconds === null ? '—' : [Math.floor(seconds / 3600), Math.floor((seconds % 3600) / 60), seconds % 60].map(n => String(n).padStart(2, '0')).join(':')

  async function refresh() {
    const d = await api('/api/auction')
    setData(d)
    setOffset(Date.parse(d.commission.serverNow) - Date.now())
    setNow(Date.now())
  }

  useEffect(() => {
    refresh().catch(e => setError(e.message))
    const poll = setInterval(() => refresh().catch(() => {}), 15000)
    const tick = setInterval(() => setNow(Date.now()), 1000)
    return () => { clearInterval(poll); clearInterval(tick) }
  }, [])

  async function run(fn: () => Promise<void>) {
    if (busy) return
    setBusy(true)
    setError('')
    try { await fn() } catch (e) { setError((e as Error).message) } finally { setBusy(false) }
  }

  async function submitBid() {
    await run(async () => {
      const name = safeCompanyName(company)
      if (!name) throw new Error('Use a plain company name. No links or wallets.')
      const profile = social ? safeSocialProfile(social.startsWith('http') ? social : 'https://' + social) : null
      if (social && !profile) throw new Error('Use a direct X, Instagram, or LinkedIn profile.')
      await api('/api/auction', 'POST', {action: 'bid', email, company: name, maxAmount: Math.round(Number(budget) * 100), publicCompany, social: profile})
      setOpen(null)
      setConsent(false)
      await refresh()
    })
  }

  const ticker = [
    data ? `${data.history.count} ${data.history.count === 1 ? 'bid' : 'bids'}` : '— bids',
    data ? `High bid ${money(data.bid.current)}` : 'High —',
    data?.bid.current ? 'Next bid +10%' : 'Opening $1',
    seconds === 0 ? 'Bidding ended' : `${countdown} left`,
    'settle?',
  ]
  const copy = (i: number) => (
    <p key={i} aria-hidden={i > 0 || undefined}>
      {ticker.slice(0, 4).map((item, j) => <span key={j}>{item}</span>)}
      <button type="button" onClick={() => { setOpen('settle'); setSent(false) }} tabIndex={i === 0 ? 0 : -1}>settle?</button>
    </p>
  )

  return (
    <div className="auction">
      <div className="auction-ticker" role="status" aria-label={ticker.join(' · ')}>
        <div className="auction-ticker-track">{Array.from({length: 12}, (_, i) => copy(i))}</div>
      </div>
      {error && <div className="auction-error" role="alert">{error}<button onClick={() => setError('')} aria-label="Dismiss">×</button></div>}
      <section className="auction-intro">
        <aside>
          <p>One lot.<br />Forty-eight hours.<br />Highest reserved maximum wins.</p>
        </aside>
        <p><a href="/terms">Terms</a></p>
      </section>
      <section className="auction-work" aria-label="Lot">
        <article>
          <div className="auction-frame">
            <div><h1>The lot</h1></div>
            <div>
              <p>Current bid · {data ? `${data.history.count} ${data.history.count === 1 ? 'bid' : 'bids'}` : '—'}</p>
              <p>{data ? money(data.bid.current) : '—'}</p>
              {data && data.bid.current > 0 && <p>{data.bid.social ? <a href={data.bid.social} target="_blank" rel="noopener noreferrer nofollow ugc">{data.bid.company || 'Anonymous'} ↗</a> : data.bid.company || 'Anonymous'}</p>}
              <p>{data?.bid.current ? 'Next min bid' : 'Opening bid'}: {data ? money(data.bid.minimum) : '—'}{data?.bid.current ? ' (+10%)' : ''}</p>
            </div>
            <div className="auction-action">
              <p>Charged only if accepted · <button type="button" onClick={() => { setOpen('settle'); setSent(false) }}>settle?</button></p>
              <div className="auction-bottom">
                <button disabled={!data || !live} onClick={() => setOpen('bid')}>{!data ? 'Loading…' : live ? 'Make a bid ↗' : 'Bidding closed'}</button>
                <time className={seconds !== null && seconds > 0 && seconds < 3600 ? 'is-urgent' : undefined} dateTime={data?.commission.closesAt}>{countdown}</time>
              </div>
            </div>
          </div>
          <div className="auction-caption"><span>You?</span></div>
        </article>
        {[1, 2, 3, 4, 5].map(n => (
          <article key={n}>
            <div className="auction-art" aria-hidden="true" />
            <div className="auction-caption"><span>Example {n}</span></div>
          </article>
        ))}
        <article>
          <button className="auction-art" disabled={!live} onClick={() => setOpen('bid')} style={{width: '100%'}}>
            <span>Bid</span>
          </button>
          <div className="auction-caption"><span>Bid ({data ? money(data.bid.minimum) : '—'})</span></div>
        </article>
      </section>
      <section className="auction-history" aria-label="Bid history">
        <div className="auction-history-heading">
          <h2>Bid history</h2>
          <span>{data?.history.count || 0} {(data?.history.count || 0) === 1 ? 'bid' : 'bids'}</span>
        </div>
        {!data ? <p className="auction-muted">Loading…</p> : data.history.items.length ? (
          <ol>
            {data.history.items.map(item => (
              <li key={item.id}>
                <span>{item.social ? <a href={item.social} target="_blank" rel="noopener noreferrer nofollow ugc">{item.company || 'Anonymous'} ↗</a> : item.company || 'Anonymous'}{item.automatic && <span className="auction-muted"> · Auto</span>}</span>
                <time dateTime={item.at}>{new Date(item.at).toLocaleString(undefined, {month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'})}</time>
                <span>{money(item.amount)}</span>
              </li>
            ))}
          </ol>
        ) : <p className="auction-muted">No bids yet.</p>}
      </section>

      {open && (
        <div className="auction-overlay" role="dialog" aria-modal="true" aria-label={open === 'settle' ? 'Settlement' : 'Make a bid'} onKeyDown={e => { if (e.key === 'Escape') setOpen(null) }}>
          <div className="auction-panel">
            <button className="auction-close" onClick={() => setOpen(null)} aria-label="Close">×</button>
            {error && <p role="alert" className="auction-error">{error}</p>}
            {open === 'settle' ? sent ? (
              <><h2>Sent.</h2><p>Replace this demo with your own inbox.</p><button className="auction-primary" type="button" onClick={() => setOpen(null)}>Close</button></>
            ) : (
              <form className="auction-form" onSubmit={e => { e.preventDefault(); setSent(true) }}>
                <h2>Off-card settlement.</h2>
                <p>This demo only stores the note in the browser session. Wire it to email in production.</p>
                <label>Email<input type="email" required value={settle.email} onChange={e => setSettle({...settle, email: e.target.value})} /></label>
                <label>X handle<span className="auction-profile"><span aria-hidden="true">x.com/</span><input required maxLength={15} value={settle.handle} onChange={e => setSettle({...settle, handle: e.target.value.replace(/^@/, '')})} /></span></label>
                <label>Max bid (USD)<input type="number" min="1" step=".01" required value={settle.max} onChange={e => setSettle({...settle, max: e.target.value})} /></label>
                <label>Settlement currency<select required value={settle.currency} onChange={e => setSettle({...settle, currency: e.target.value})}><option value="" disabled>Select</option><option>USDC</option><option>ETH</option><option>SOL</option><option>BTC</option></select></label>
                <label>Message<textarea maxLength={2000} value={settle.note} onChange={e => setSettle({...settle, note: e.target.value})} /></label>
                <button className="auction-primary" disabled={busy}>Send</button>
              </form>
            ) : (
              <form className="auction-form" onSubmit={e => { e.preventDefault(); void submitBid() }}>
                <h2>Make a bid.</h2>
                <label>Email<input type="email" required value={email} onChange={e => setEmail(e.target.value)} /></label>
                <label>Company name · no links<input required maxLength={200} value={company} onChange={e => setCompany(e.target.value)} /></label>
                <label>Social profile · optional<span className="auction-profile"><span aria-hidden="true">https://</span><input value={social} onChange={e => setSocial(e.target.value.replace(/^https:\/\//i, ''))} placeholder="x.com/yourname" /></span></label>
                <label>Your maximum bid · USD<input type="number" required min={(data?.bid.minimum || 100) / 100} step=".01" value={budget} onChange={e => setBudget(e.target.value)} /></label>
                <small>Minimum {data ? money(data.bid.minimum) : '$1'}. Only the public bid is shown. Your maximum stays private.</small>
                <label className="auction-check"><input type="checkbox" checked={publicCompany} onChange={e => setPublicCompany(e.target.checked)} /><span>Show my company name publicly.</span></label>
                <label className="auction-check"><input type="checkbox" required checked={consent} onChange={e => setConsent(e.target.checked)} /><span>I agree this demo authorizes a bid without a card hold. Production should reserve the maximum on a card.</span></label>
                <button className="auction-primary" disabled={busy || !live}>Place bid</button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
