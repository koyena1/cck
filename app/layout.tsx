import type React from "react"
import type { Metadata } from "next"
import { Roboto } from "next/font/google"
// import Chatbot from "@/components/chatbot"
import { CookieConsent } from "@/components/cookie-consent"
import { SmoothScroll } from "@/components/smooth-scroll"
import { CartProvider } from "@/components/cart-context"
import { CartSidebar } from "@/components/cart-sidebar"
import { ClientOnly } from "@/components/client-only"
import "./globals.css"

const roboto = Roboto({
  weight: ["100", "300", "400", "500", "700", "900"],
  subsets: ["latin"],
  variable: "--font-roboto",
})

export const metadata: Metadata = {
  metadataBase: new URL('https://yourdomain.com'),
  title: {
    default: "Protechtur",
    template: "%s | Protechtur"
  },
  description:
    "Protechtur offers CCTV products, installation support, and security solutions.",
  keywords: [
    "IT solutions",
    "web development",
    "mobile app development",
    "cloud solutions",
    "AI automation",
    "digital transformation",
    "UI/UX design",
    "enterprise software",
    "custom software development",
    "technology consulting"
  ],
  authors: [{ name: "Protechtur" }],
  creator: "Protechtur",
  publisher: "Protechtur",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://yourdomain.com',
    siteName: 'Protechtur',
    title: 'Protechtur',
    description: 'Protechtur offers CCTV products, installation support, and security solutions.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Protechtur',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Protechtur | Building Smart Digital Solutions',
    description: 'Protechtur offers CCTV products, installation support, and security solutions.',
    images: ['/og-image.png'],
    creator: '@Protechtur',
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
    yahoo: 'your-yahoo-verification-code',
  },
  alternates: {
    canonical: 'https://yourdomain.com',
  },
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Protechtur",
    "url": "https://yourdomain.com",
    "logo": "https://yourdomain.com/logo.png",
    "description": "Protechtur offers CCTV products, installation support, and security solutions.",
    "sameAs": [
      "https://www.facebook.com/Protechtur",
      "https://www.linkedin.com/company/Protechtur",
      "https://twitter.com/Protechtur"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+1-XXX-XXX-XXXX",
      "contactType": "Customer Service",
      "areaServed": "Worldwide",
      "availableLanguage": ["English"]
    },
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Your Street Address",
      "addressLocality": "Your City",
      "addressRegion": "Your State",
      "postalCode": "Your ZIP",
      "addressCountry": "Your Country"
    }
  }

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Protechtur",
    "url": "https://yourdomain.com",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://yourdomain.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  }

  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body className={`${roboto.variable} font-sans antialiased`}>
        <CartProvider>
          <SmoothScroll />
          {children}
          <CartSidebar />
          {/* <ClientOnly>
            <Chatbot />
          </ClientOnly> */}
          <CookieConsent />
        </CartProvider>
      </body>
    </html>
  )
}
