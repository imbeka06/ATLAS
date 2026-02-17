import type { Metadata } from 'next'
import './globals.css' // <-- This must exactly match your filename

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
      {/* If Tailwind works, the whole background will turn RED */}
      <body className="bg-red-500">{children}</body>
    </html>
  )
}