"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Zap, UserCircle, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"

export function Navbar() {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/services", label: "Services" },
    { href: "/about", label: "About Us" },
    { href: "/track-order", label: "Track Order" },
  ]

  // Light theme active style: Light grey background with dark text
  const activeStyle = "bg-slate-100 text-[#e63946] rounded-full px-6 py-2"
  const inactiveStyle = "text-slate-600 hover:text-[#e63946] px-6 py-2 transition-colors"

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center p-6">
      {/* Container: White background with subtle shadow */}
      <div className="w-full max-w-7xl bg-white/90 backdrop-blur-md border border-slate-200 rounded-full px-4 py-2 flex items-center justify-between shadow-md">
        
        {/* Logo - Dark Text */}
        <Link href="/" className="flex items-center gap-2 pl-4">
          <span className="text-slate-900 text-xl font-bold tracking-tight">Citive</span>
        </Link>

        {/* Navigation Menu - Desktop */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.label}
                href={link.href}
                className={cn(
                  "text-sm font-semibold transition-all duration-300",
                  isActive ? activeStyle : inactiveStyle
                )}
              >
                {link.label}
              </Link>
            )
          })}

          {/* Special CTA Button - Red Accent */}
          <Link
            href="/quote"
            className="ml-4 flex items-center gap-2 px-6 py-2 bg-[#e63946] text-white hover:bg-red-700 rounded-full text-sm font-bold shadow-sm transition-transform active:scale-95"
          >
            <Zap size={14} fill="white" />
            Contact Us
          </Link>
        </div>

        {/* Mobile Menu Toggle Button - Darker Icon */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden text-slate-900 p-2 hover:bg-slate-100 rounded-full transition-colors"
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Auth Section - Desktop */}
        <div className="pr-4 hidden md:block">
          <Link 
            href="/login" 
            className="flex items-center gap-2 text-slate-600 hover:text-[#e63946] text-sm font-medium transition-colors"
          >
            <UserCircle size={18} />
            Login / Register
          </Link>
        </div>
      </div>

      {/* Mobile Menu Dropdown - White Background */}
      {isMenuOpen && (
        <div className="absolute top-24 left-6 right-6 bg-white border border-slate-200 shadow-xl rounded-3xl p-6 md:hidden">
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
                    isActive ? "bg-slate-100 text-[#e63946]" : "text-slate-600 hover:bg-slate-50"
                  )}
                >
                  {link.label}
                </Link>
              )
            })}
            <Link
              href="/quote"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-[#e63946] text-white rounded-full text-sm font-bold"
            >
              <Zap size={14} fill="white" />
              Get Instant Quote
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}