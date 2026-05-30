"use client"

import React from "react"
import { Suspense } from "react"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useSearchParams, useRouter } from "next/navigation"
import { Zap, UserCircle, Menu, X, ShoppingBag, LogOut, ChevronDown, Gift, CircleHelp, Edit3 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCart } from "./cart-context"
import { CustomerAuthModal } from "./customer-auth-modal"
import { HelpDeskModal } from "./help-desk-modal"

function NavbarComponent() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isHelpDeskOpen, setIsHelpDeskOpen] = useState(false)
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const [isNavbarVisible, setIsNavbarVisible] = useState(true)
  const [customerName, setCustomerName] = useState<string | null>(null)
  const { cartCount, setIsCartOpen } = useCart()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const lastScrollYRef = useRef(0)

  // Check if customer is logged in
  useEffect(() => {
    const name = localStorage.getItem('customerName')
    setCustomerName(name)
  }, [])

  useEffect(() => {
    const syncCustomerName = () => {
      setCustomerName(localStorage.getItem('customerName'))
    }

    const handleCustomerProfileUpdate = () => {
      syncCustomerName()
    }

    window.addEventListener('storage', syncCustomerName)
    window.addEventListener('customer-profile-updated', handleCustomerProfileUpdate)

    return () => {
      window.removeEventListener('storage', syncCustomerName)
      window.removeEventListener('customer-profile-updated', handleCustomerProfileUpdate)
    }
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

  // Hide navbar on downward scroll only on homepage, show again on upward scroll.
  useEffect(() => {
    if (pathname !== "/") {
      setIsNavbarVisible(true)
      return
    }

    lastScrollYRef.current = window.scrollY

    const handleScroll = () => {
      const currentScrollY = window.scrollY

      if (currentScrollY < 8) {
        setIsNavbarVisible(true)
        lastScrollYRef.current = currentScrollY
        return
      }

      if (currentScrollY > lastScrollYRef.current + 4) {
        setIsNavbarVisible(false)
      } else if (currentScrollY < lastScrollYRef.current - 4) {
        setIsNavbarVisible(true)
      }

      lastScrollYRef.current = currentScrollY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [pathname])

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
    { href: "/quotation-management", label: "Create Quotation", highlighted: true },
    { href: customerName ? "/track-order" : "/guest-track-order", label: "Track Order", skipActiveHighlight: true },
  ]

  // Light theme active style: Light grey background with dark text
  const activeStyle = "bg-slate-100 text-[#e63946] rounded-full px-6 py-2"
  const inactiveStyle = "text-slate-600 hover:text-[#e63946] px-6 py-2 transition-colors"

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 flex justify-center p-6 transition-transform duration-300",
        (isNavbarVisible || isMenuOpen) ? "translate-y-0" : "-translate-y-full"
      )}
    >
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
              ? "ml-2 flex items-center gap-2 px-6 py-2 !bg-[#e63946] text-white hover:!bg-red-700 rounded-full text-sm font-bold shadow-sm transition-transform active:scale-95"
              : (isActive && !link.skipActiveHighlight) ? activeStyle : inactiveStyle
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

          <button
            onClick={() => setIsCartOpen(true)}
            className="ml-2 relative p-2 rounded-full transition-colors hover:bg-slate-100"
            aria-label="Shopping cart"
            title="Shopping Cart"
          >
            <ShoppingBag className="w-6 h-6 text-slate-900 stroke-2" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-[#e63946] text-white text-xs w-6 h-6 flex items-center justify-center rounded-full font-bold shadow-lg border-2 border-white">
                {cartCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setIsHelpDeskOpen(true)}
            className="ml-2 p-2 hover:bg-slate-100 rounded-full transition-colors"
            aria-label="Open help desk"
            title="Help Desk"
          >
            <CircleHelp className="w-6 h-6 text-slate-900 stroke-2" />
          </button>
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
                    className="w-full flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-linear-to-r hover:from-purple-50 hover:to-blue-50 hover:text-purple-600 text-sm font-medium transition-all"
                  >
                    <Gift size={18} />
                    <span>Rewards</span>
                  </button>
                  <button
                    onClick={() => {
                      router.push('/customer/profile')
                      setIsUserDropdownOpen(false)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-slate-50 hover:text-slate-950 text-sm font-medium transition-colors"
                  >
                    <Edit3 size={18} />
                    <span>Edit Profile</span>
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

      {/* Mobile Side Drawer */}
      <div className={cn(
        "fixed inset-0 z-[9999] bg-white md:hidden transition-opacity duration-300",
        isMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      )}>
        <div
          className="absolute inset-0 bg-white"
          onClick={() => setIsMenuOpen(false)}
          aria-hidden="true"
        />
        <div className={cn(
          "absolute right-0 top-0 z-[10000] h-full w-80 max-w-[85vw] bg-white shadow-2xl border-l border-slate-200 px-5 py-6 transition-transform duration-300",
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        )}>
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Image
                src="/logo2.png"
                alt="Protechtur Logo"
                width={120}
                height={40}
                className="h-8 w-auto object-contain"
              />
            </div>
            <button
              onClick={() => setIsMenuOpen(false)}
              className="p-2 rounded-full hover:bg-slate-100"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>

          <div className="mt-5 flex flex-col gap-3">
            {navLinks.map((link) => {
              const isActive = pathname === link.href
              const linkStyle = link.highlighted
                ? "!bg-[#e63946] text-white"
                : (isActive && !link.skipActiveHighlight) ? "bg-slate-100 text-[#e63946]" : "text-slate-600 hover:bg-slate-50"
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

            <button
              onClick={() => {
                setIsHelpDeskOpen(true)
                setIsMenuOpen(false)
              }}
              className="relative flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 text-slate-900 hover:bg-slate-200 rounded-full text-sm font-bold transition-colors"
            >
              <CircleHelp className="w-5 h-5" />
              Help Desk
            </button>

            {/* Login/Register for Mobile */}
            {customerName ? (
              <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 text-slate-900 rounded-full text-sm font-bold">
                  <UserCircle size={18} />
                  {customerName}
                </div>
                <button
                  onClick={() => {
                    router.push('/customer/profile')
                    setIsMenuOpen(false)
                  }}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 text-slate-900 hover:bg-slate-200 rounded-full text-sm font-bold transition-colors"
                >
                  <Edit3 size={18} />
                  Edit Profile
                </button>
                <button
                  onClick={() => {
                    router.push('/customer/dashboard')
                    setIsMenuOpen(false)
                  }}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-linear-to-r from-purple-100 to-blue-100 text-purple-600 hover:from-purple-200 hover:to-blue-200 rounded-full text-sm font-bold transition-colors"
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
      </div>

      {/* Customer Auth Modal */}
      <CustomerAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <HelpDeskModal
        open={isHelpDeskOpen}
        onOpenChange={setIsHelpDeskOpen}
      />
    </nav>
  )
}

function NavbarFallback() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center p-6">
      <div className="w-full max-w-7xl bg-white/90 backdrop-blur-md border border-slate-200 rounded-full px-4 py-2 flex items-center justify-between shadow-md">
        <Link href="/" className="flex items-center gap-2 pl-4">
          <Image
            src="/logo2.png"
            alt="Protechtur Logo"
            width={150}
            height={50}
            className="h-12 w-auto object-contain"
          />
        </Link>
      </div>
    </nav>
  )
}

function NavbarWithSuspense() {
  return (
    <Suspense fallback={<NavbarFallback />}>
      <NavbarComponent />
    </Suspense>
  )
}

// Memoize the Navbar component to prevent unnecessary re-renders
export const Navbar = React.memo(NavbarWithSuspense)
Navbar.displayName = 'Navbar'