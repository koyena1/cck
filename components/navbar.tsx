"use client"

import React from "react"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useSearchParams, useRouter } from "next/navigation"
import { Zap, UserCircle, Menu, X, ShoppingBag, LogOut, ChevronDown, Gift } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCart } from "./cart-context"
import { CustomerAuthModal } from "./customer-auth-modal"

function NavbarComponent() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const [customerName, setCustomerName] = useState<string | null>(null)
  const { cartCount, setIsCartOpen } = useCart()
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Check if customer is logged in
  useEffect(() => {
    const name = localStorage.getItem('customerName')
    setCustomerName(name)
  }, [])

  // Auto-open auth modal if login query parameter is present
  useEffect(() => {
    const loginParam = searchParams?.get('login')
    if (loginParam === 'true' && !customerName) {
      setIsAuthModalOpen(true)
    }
  }, [searchParams, customerName])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false)
      }
    }

    if (isUserDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isUserDropdownOpen])

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('customerToken')
    localStorage.removeItem('customerName')
    localStorage.removeItem('customerEmail')
    setCustomerName(null)
    setIsUserDropdownOpen(false)
    window.location.reload()
  }

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/services", label: "Services" },
    { href: "/about", label: "About Us" },
    { href: "/quotation-management", label: "Quotation Management", highlighted: true },
    ...(customerName ? [{ href: "/track-order", label: "Track Order" }] : []),
  ]

  // Light theme active style: Light grey background with dark text
  const activeStyle = "bg-slate-100 text-[#e63946] rounded-full px-6 py-2"
  const inactiveStyle = "text-slate-600 hover:text-[#e63946] px-6 py-2 transition-colors"

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center p-6">
      {/* Container: White background with subtle shadow */}
      <div className="w-full max-w-7xl bg-white/90 backdrop-blur-md border border-slate-200 rounded-full px-4 py-2 flex items-center justify-between shadow-md">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 pl-4">
          <Image 
            src="/logo2.png" 
            alt="Protechtur Logo" 
            width={150} 
            height={50} 
            className="h-12 w-auto object-contain"
          />
        </Link>

        {/* Navigation Menu - Desktop */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href
            const linkStyle = link.highlighted 
              ? "ml-2 flex items-center gap-2 px-6 py-2 bg-[#e63946] text-white hover:bg-red-700 rounded-full text-sm font-bold shadow-sm transition-transform active:scale-95"
              : isActive ? activeStyle : inactiveStyle
            return (
              <Link
                key={link.label}
                href={link.href}
                className={cn(
                  "text-sm font-semibold transition-all duration-300",
                  linkStyle
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
          
          {/* Cart Icon - Only show when logged in */}
          {customerName && (
            <button
              onClick={() => setIsCartOpen(true)}
              className="ml-2 relative p-2 hover:bg-slate-100 rounded-full transition-colors"
              aria-label="Shopping cart"
            >
              <ShoppingBag className="w-6 h-6 text-slate-900 stroke-2" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#e63946] text-white text-xs w-6 h-6 flex items-center justify-center rounded-full font-bold shadow-lg border-2 border-white">
                  {cartCount}
                </span>
              )}
            </button>
          )}
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
          {customerName ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors px-3 py-2 rounded-full hover:bg-slate-100"
              >
                <UserCircle size={18} />
                <span>{customerName}</span>
                <ChevronDown size={16} className={cn(
                  "transition-transform duration-200",
                  isUserDropdownOpen && "rotate-180"
                )} />
              </button>

              {/* Dropdown Menu */}
              {isUserDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50">
                  <button
                    onClick={() => {
                      router.push('/customer/dashboard')
                      setIsUserDropdownOpen(false)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 hover:text-purple-600 text-sm font-medium transition-all"
                  >
                    <Gift size={18} />
                    <span>Rewards</span>
                  </button>
                  <div className="border-t border-slate-200"></div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 text-sm font-medium transition-colors"
                  >
                    <LogOut size={18} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button 
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-2 text-slate-600 hover:text-[#e63946] text-sm font-medium transition-colors"
            >
              <UserCircle size={18} />
              Login / Register
            </button>
          )}
        </div>
      </div>

      {/* Mobile Menu Dropdown - White Background */}
      {isMenuOpen && (
        <div className="absolute top-24 left-6 right-6 bg-white border border-slate-200 shadow-xl rounded-3xl p-6 md:hidden">
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => {
              const isActive = pathname === link.href
              const linkStyle = link.highlighted
                ? "bg-[#e63946] text-white"
                : isActive ? "bg-slate-100 text-[#e63946]" : "text-slate-600 hover:bg-slate-50"
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    "text-base font-medium transition-all duration-300 text-center py-3 rounded-full",
                    linkStyle
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
            
            {/* Cart Button for Mobile - Only show when logged in */}
            {customerName && (
              <button
                onClick={() => {
                  setIsCartOpen(true)
                  setIsMenuOpen(false)
                }}
                className="relative flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 text-slate-900 hover:bg-slate-200 rounded-full text-sm font-bold transition-colors"
              >
                <ShoppingBag className="w-5 h-5" />
                Shopping Cart
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#e63946] text-white text-xs w-6 h-6 flex items-center justify-center rounded-full font-bold shadow-lg">
                    {cartCount}
                  </span>
                )}
              </button>
            )}
            
            {/* Login/Register for Mobile */}
            {customerName ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 text-slate-900 rounded-full text-sm font-bold">
                  <UserCircle size={18} />
                  {customerName}
                </div>
                <button
                  onClick={() => {
                    router.push('/customer/dashboard')
                    setIsMenuOpen(false)
                  }}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-600 hover:from-purple-200 hover:to-blue-200 rounded-full text-sm font-bold transition-colors"
                >
                  <Gift size={18} />
                  Rewards
                </button>
                <button
                  onClick={() => {
                    handleLogout()
                    setIsMenuOpen(false)
                  }}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-red-100 text-red-600 hover:bg-red-200 rounded-full text-sm font-bold transition-colors"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setIsAuthModalOpen(true)
                  setIsMenuOpen(false)
                }}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 text-slate-900 hover:bg-slate-200 rounded-full text-sm font-bold transition-colors"
              >
                <UserCircle size={18} />
                Login / Register
              </button>
            )}
          </div>
        </div>
      )}

      {/* Customer Auth Modal */}
      <CustomerAuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </nav>
  )
}

// Memoize the Navbar component to prevent unnecessary re-renders
export const Navbar = React.memo(NavbarComponent)
Navbar.displayName = 'Navbar'