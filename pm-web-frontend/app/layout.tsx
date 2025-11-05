import type React from "react"
import { Work_Sans, Saira } from "next/font/google"
import "./globals.css"
import { Layout } from "@/components/ui/layout"

const worksans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-worksans",
  display: "swap",
})

const saira = Saira({
  subsets: ["latin"],
  variable: "--font-saira",
  display: "swap",
  weight: ["400", "500", "600", "700"],
})

export const metadata = {
  title: "Mitarbeiterberichtssystem",
  description: "Verwaltung von Tagesberichten, Regiescheinen und Streetwatch-Daten",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="de">
      <body className={`${worksans.variable} ${saira.variable} font-worksans`}>
        <Layout>{children}</Layout>
      </body>
    </html>
  )
}

