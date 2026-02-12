"use client"
import { Suspense } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"

export default function TermsPage() {
  return (
    <>
      <Suspense fallback={<div className="h-16" />}>
        <Navbar />
      </Suspense>

      <section className="pt-32 pb-20 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">Terms of Service</h1>
            <p className="text-xl text-muted-foreground">Last updated: January 2025</p>
          </div>
        </div>
      </section>

      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="border-border">
              <CardContent className="p-8 prose prose-lg max-w-none">
                <h2 className="text-2xl font-bold mb-4">Agreement to Terms</h2>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  By accessing or using the services provided by Cygnatrix IT Solutions, you agree to be bound by these
                  Terms of Service. If you disagree with any part of these terms, you may not access our services.
                </p>

                <h2 className="text-2xl font-bold mb-4 mt-8">Services</h2>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  Cygnatrix IT Solutions provides various IT services including web development, mobile app development,
                  UI/UX design, cloud solutions, AI & automation, and maintenance & support. The specific terms for each
                  service will be outlined in individual service agreements.
                </p>

                <h2 className="text-2xl font-bold mb-4 mt-8">User Responsibilities</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">You agree to:</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-6">
                  <li>Provide accurate and complete information</li>
                  <li>Maintain the security of your account credentials</li>
                  <li>Use our services in compliance with all applicable laws</li>
                  <li>Not engage in any activity that disrupts or interferes with our services</li>
                </ul>

                <h2 className="text-2xl font-bold mb-4 mt-8">Intellectual Property</h2>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  All content, features, and functionality of our services are owned by Cygnatrix IT Solutions and are
                  protected by international copyright, trademark, and other intellectual property laws.
                </p>

                <h2 className="text-2xl font-bold mb-4 mt-8">Limitation of Liability</h2>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  Cygnatrix IT Solutions shall not be liable for any indirect, incidental, special, consequential, or
                  punitive damages resulting from your use of or inability to use our services.
                </p>

                <h2 className="text-2xl font-bold mb-4 mt-8">Contact Information</h2>
                <p className="text-muted-foreground leading-relaxed">
                  For questions about these Terms of Service, please contact us at legal@cygnatrix.com
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
