"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Cookie } from "lucide-react"

export function CookieConsent() {
  const [showConsent, setShowConsent] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent")
    if (!consent) {
      // Show popup after a short delay
      setTimeout(() => setShowConsent(true), 1000)
    }
  }, [])

  const acceptCookies = () => {
    localStorage.setItem("cookie-consent", "accepted")
    setShowConsent(false)
  }

  const rejectCookies = () => {
    localStorage.setItem("cookie-consent", "rejected")
    setShowConsent(false)
  }

  if (!showConsent) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-2xl animate-fade-in-up">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Cookie Icon & Text */}
          <div className="flex items-center gap-4 flex-1">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Cookie size={28} className="text-orange-600" />
            </div>
            <p className="text-gray-700 text-sm">
              We use cookies to personalize your experience and enhance our website. See our{" "}
              <a href="/privacy" className="text-blue-600 hover:text-blue-700 underline font-medium">
                Privacy Policy
              </a>{" "}
              to learn more.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 flex-shrink-0">
            <Button
              onClick={rejectCookies}
              variant="outline"
              className="px-6 h-11 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold transition-all duration-300"
            >
              Reject Optional
            </Button>
            <Button
              onClick={acceptCookies}
              className="px-6 h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Accept All
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
