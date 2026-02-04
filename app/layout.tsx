import type React from "react"
import type { Metadata } from "next"
import { Poppins, Orbitron } from "next/font/google"
import { WhatsAppFloat } from "@/components/whatsapp-float"
import Chatbot from "@/components/chatbot" // This looks for the 'export default'
import { CookieConsent } from "@/components/cookie-consent"
import { SmoothScroll } from "@/components/smooth-scroll"
import { CartProvider } from "@/components/cart-context"
import { CartSidebar } from "@/components/cart-sidebar"
import "./globals.css"

const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
})

const orbitron = Orbitron({
  weight: ["600", "700", "800", "900"],
  subsets: ["latin"],
  variable: "--font-orbitron",
})

export const metadata: Metadata = {
  metadataBase: new URL('https://yourdomain.com'),
  title: {
    default: "Manika Order Supplier",
    template: "%s | Manika Order Supplier"
  },
  description:
    "Leading IT solutions provider offering web development, mobile apps, UI/UX design, cloud solutions, AI automation, and maintenance services for startups and enterprises.",
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
  authors: [{ name: "Cygnatrix IT Solutions" }],
  creator: "Cygnatrix IT Solutions",
  publisher: "Cygnatrix IT Solutions",
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
    siteName: 'Cygnatrix IT Solutions',
    title: 'Cygnatrix IT Solutions | Building Smart Digital Solutions',
    description: 'Leading IT solutions provider offering web development, mobile apps, UI/UX design, cloud solutions, AI automation, and maintenance services.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Cygnatrix IT Solutions',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cygnatrix IT Solutions | Building Smart Digital Solutions',
    description: 'Leading IT solutions provider offering web development, mobile apps, UI/UX design, cloud solutions, and AI automation.',
    images: ['/og-image.png'],
    creator: '@cygnatrix',
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
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
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
    "name": "Cygnatrix IT Solutions",
    "url": "https://yourdomain.com",
    "logo": "https://yourdomain.com/logo.png",
    "description": "Leading IT solutions provider offering web development, mobile apps, UI/UX design, cloud solutions, AI automation, and maintenance services.",
    "sameAs": [
      "https://www.facebook.com/cygnatrix",
      "https://www.linkedin.com/company/cygnatrix",
      "https://twitter.com/cygnatrix"
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
    "name": "Cygnatrix IT Solutions",
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
      <body className={`${poppins.variable} ${orbitron.variable} font-sans antialiased`}>
        <CartProvider>
          <SmoothScroll />
          {children}
          <CartSidebar />
          <Chatbot />
          <WhatsAppFloat />
          <CookieConsent />
        </CartProvider>
      </body>
    </html>
  )
}
