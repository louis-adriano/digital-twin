import type React from "react"
import type { Metadata } from "next"
import { Playfair_Display, Source_Sans_3 as Source_Sans_Pro } from "next/font/google"
import "./globals.css"

const playfairDisplay = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
})

const sourceSansPro = Source_Sans_Pro({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "Digital Twin - Louis Adriano",
  description: "Full-stack Developer & AI Data Analyst - Professional Digital Portfolio",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${playfairDisplay.variable} ${sourceSansPro.variable} antialiased`}>
        {children}
      </body>
    </html>
  )
}