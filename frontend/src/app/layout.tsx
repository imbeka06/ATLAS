import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ARCHITECT.AI',
  description: 'AI System Architect',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}