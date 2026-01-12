"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Zap, UserCircle, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"

export function Navbar() {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // Define your menu items here
  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/services", label: "Services" },
    { href: "/about", label: "About Us" },
  ]

  // This is the EXACT design of your "Home" pill from the screenshot
  const activeStyle = "bg-[#222222] text-white rounded-full px-6 py-2"
  const inactiveStyle = "text-gray-400 hover:text-white px-6 py-2 transition-colors"

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center p-6">
      <div className="w-full max-w-7xl bg-black/40 backdrop-blur-md border border-white/5 rounded-full px-4 py-2 flex items-center justify-between">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 pl-4">
          <span className="text-white text-xl font-bold tracking-tight">Citive</span>
        </Link>

        {/* Navigation Menu - Desktop */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            // Check if the current path matches the link href
            const isActive = pathname === link.href

            return (
              <Link
                key={link.label}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-all duration-300",
                  isActive ? activeStyle : inactiveStyle
                )}
              >
                {link.label}
              </Link>
            )
          })}

          {/* Special CTA Button */}
          <Link
            href="/quote"
            className="ml-4 flex items-center gap-2 px-6 py-2 bg-white text-black hover:bg-gray-200 rounded-full text-sm font-bold transition-transform active:scale-95"
          >
            <Zap size={14} fill="black" />
            Get Instant Quote
          </Link>
        </div>

        {/* Mobile Menu Toggle Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden text-white p-2 hover:bg-white/10 rounded-full transition-colors"
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Auth Section - Desktop */}
        <div className="pr-4 hidden md:block">
          <Link 
            href="/login" 
            className="flex items-center gap-2 text-gray-400 hover:text-white text-sm font-medium transition-colors"
          >
            <UserCircle size={18} />
            Login / Register
          </Link>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="absolute top-20 left-6 right-6 bg-black/95 backdrop-blur-md border border-white/10 rounded-3xl p-6 md:hidden">
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => {
              const isActive = pathname === link.href

              return (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    "text-base font-medium transition-all duration-300 text-center py-3 rounded-full",
                    isActive ? "bg-[#222222] text-white" : "text-gray-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  {link.label}
                </Link>
              )
            })}

            {/* Mobile CTA Button */}
            <Link
              href="/quote"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-black hover:bg-gray-200 rounded-full text-sm font-bold transition-transform active:scale-95"
            >
              <Zap size={14} fill="black" />
              Get Instant Quote
            </Link>

            {/* Mobile Auth */}
            <Link 
              href="/login"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center justify-center gap-2 text-gray-400 hover:text-white text-sm font-medium transition-colors py-3"
            >
              <UserCircle size={18} />
              Login / Register
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}