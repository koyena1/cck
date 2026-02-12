"use client"
import { Suspense } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"

export default function PrivacyPage() {
  return (
    <>
      <Suspense fallback={<div className="h-16" />}>
        <Navbar />
      </Suspense>

      <section className="pt-32 pb-20 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">Privacy Policy</h1>
            <p className="text-xl text-muted-foreground">Last updated: January 2025</p>
          </div>
        </div>
      </section>

      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="border-border">
              <CardContent className="p-8 prose prose-lg max-w-none">
                <h2 className="text-2xl font-bold mb-4">Introduction</h2>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  Cygnatrix IT Solutions ("we," "our," or "us") is committed to protecting your privacy. This Privacy
                  Policy explains how we collect, use, disclose, and safeguard your information when you visit our
                  website or use our services.
                </p>

                <h2 className="text-2xl font-bold mb-4 mt-8">Information We Collect</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  We may collect information about you in a variety of ways, including:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-6">
                  <li>Personal Data: Name, email address, phone number, and company information</li>
                  <li>Usage Data: IP address, browser type, pages visited, and time spent on pages</li>
                  <li>Cookies and Tracking Technologies</li>
                </ul>

                <h2 className="text-2xl font-bold mb-4 mt-8">How We Use Your Information</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">We use the information we collect to:</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-6">
                  <li>Provide and maintain our services</li>
                  <li>Improve and personalize your experience</li>
                  <li>Communicate with you about our services</li>
                  <li>Send marketing and promotional materials (with your consent)</li>
                  <li>Detect, prevent, and address technical issues</li>
                </ul>

                <h2 className="text-2xl font-bold mb-4 mt-8">Data Security</h2>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  We implement appropriate technical and organizational security measures to protect your personal
                  information. However, no method of transmission over the Internet is 100% secure.
                </p>

                <h2 className="text-2xl font-bold mb-4 mt-8">Contact Us</h2>
                <p className="text-muted-foreground leading-relaxed">
                  If you have any questions about this Privacy Policy, please contact us at privacy@cygnatrix.com
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
