import type {Metadata} from 'next'
import '../../web/auction.css'

export const metadata: Metadata = {
  title: 'Auction anything',
  description: 'A 48-hour proxy auction. Private maxima, 10% increments, anti-snipe.',
}

export default function Layout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body style={{margin: 0}}>{children}</body>
    </html>
  )
}
