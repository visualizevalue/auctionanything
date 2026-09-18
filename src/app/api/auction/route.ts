import {NextResponse} from 'next/server'
import {placeBid, snapshot} from '../../../../web/demo'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(snapshot(), {headers: {'Cache-Control': 'private, no-store'}})
}

export async function POST(req: Request) {
  try {
    const data = await req.json()
    if (data.action !== 'bid') return NextResponse.json({error: 'Unknown action.'}, {status: 400})
    const email = String(data.email || '').trim().toLowerCase()
    if (!email.includes('@')) return NextResponse.json({error: 'Enter a valid email.'}, {status: 400})
    const offer = placeBid({
      owner: email,
      company: String(data.company || ''),
      maxAmount: Number(data.maxAmount),
      publicCompany: data.publicCompany === true,
      social: typeof data.social === 'string' ? data.social : null,
    })
    return NextResponse.json({offer: {id: offer.id, amount: offer.amount}})
  } catch (e) {
    return NextResponse.json({error: e instanceof Error ? e.message : 'Could not place that bid.'}, {status: 400})
  }
}
