import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ARC - Audio Analyzer',
  description:
    'audio + video analysis for the big shit. built for arc, by arc. listen. understand. memeify.',
  generator: 'arc — where ai infrastructure meets memetics',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="bg-black text-white antialiased lowercase">
      <body className="min-h-screen flex flex-col font-mono">
        {children}
      </body>
    </html>
  )
}
