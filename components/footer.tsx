'use client'

import React from "react"
import Link from "next/link"
import Image from "next/image"
import { Facebook, Clock, MapPin, MessageSquare, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"
import { Badge } from "./ui/badge"
import { Separator } from "./ui/separator"

// Define animation variants outside component to prevent recreation on each render
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0
  }
}

function FooterComponent() {



  return (
    <footer className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-gray-300 overflow-hidden">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>
      
      {/* Gradient Overlays */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />

      <div className="container relative mx-auto px-4 py-16">
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {/* Company Info */}
          <motion.div variants={itemVariants}>
            <Link href="/" className="inline-block mb-6 group">
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Image 
                  src="/logo.png" 
                  alt="UCAM Logo" 
                  width={150} 
                  height={50} 
                  className="h-10 w-auto object-contain brightness-0 invert group-hover:brightness-100 group-hover:invert-0 transition-all duration-300"
                />
              </motion.div>
            </Link>
            <p className="text-gray-400 mb-6 leading-relaxed text-sm">
              Keep your home or business safe with CCTV systems designed to provide 24/7 surveillance and peace of mind. Our expert team offers tailored security solutions.
            </p>
            <Badge variant="outline" className="mb-6 border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
              ⚡ 24/7 Support Available
            </Badge>
            <div className="flex space-x-3">
              {[
                { icon: Facebook, href: "https://facebook.com", label: "Facebook" },
                { icon: "X", href: "https://twitter.com", label: "Twitter" },
                { icon: "Discord", href: "https://discord.com", label: "Discord" },
                { icon: "TikTok", href: "https://tiktok.com", label: "TikTok" },
                { icon: "YouTube", href: "https://youtube.com", label: "YouTube" }
              ].map((social, i) => (
                <motion.a
                  key={i}
                  href={social.href}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 hover:from-blue-600 hover:to-purple-600 text-gray-400 hover:text-white flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-blue-500/50 border border-slate-700 hover:border-blue-500"
                  aria-label={social.label}
                >
                  {social.icon === Facebook ? (
                    <Facebook size={18} />
                  ) : social.icon === "X" ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  ) : social.icon === "Discord" ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                    </svg>
                  ) : social.icon === "TikTok" ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  )}
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Company Links */}
          <motion.div variants={itemVariants}>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-6 flex items-center">
              <span className="w-8 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 mr-3"></span>
              COMPANY
            </h3>
            <ul className="space-y-3">
              {[
                { href: "/", label: "Home" },
                { href: "/services", label: "Our Services" },
                { href: "/portfolio", label: "Projects" },
                { href: "/contact", label: "Get a Free Quote" },
                { href: "/about", label: "Blog" },
                { href: "/contact", label: "Contact" }
              ].map((link, i) => (
                <motion.li
                  key={i}
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Link 
                    href={link.href} 
                    className="text-gray-400 hover:text-white transition-colors text-sm flex items-center group"
                  >
                    <ArrowRight className="w-4 h-4 mr-2 opacity-0 group-hover:opacity-100 transition-opacity text-blue-400" />
                    {link.label}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Services Links */}
          <motion.div variants={itemVariants}>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-6 flex items-center">
              <span className="w-8 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 mr-3"></span>
              OUR SERVICES
            </h3>
            <ul className="space-y-3">
              {[
                "System Consultation",
                "Installation Services",
                "System Configuration",
                "Monitoring Services",
                "Maintenance",
                "Storage and Backup"
              ].map((service, i) => (
                <motion.li
                  key={i}
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="text-gray-400 hover:text-white transition-colors text-sm cursor-pointer flex items-center group"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-600 group-hover:bg-purple-400 mr-3 transition-colors"></span>
                  {service}
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Contact Info */}
          <motion.div variants={itemVariants}>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-6 flex items-center">
              <span className="w-8 h-0.5 bg-gradient-to-r from-emerald-500 to-cyan-500 mr-3"></span>
              GET IN TOUCH
            </h3>
            <div className="space-y-5">
              <motion.div 
                className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-blue-500/50 transition-all group"
                whileHover={{ scale: 1.02 }}
              >
                <Clock size={18} className="text-blue-400 mt-1 flex-shrink-0 group-hover:scale-110 transition-transform" />
                <div>
                  <p className="text-white font-semibold text-sm mb-1">We're Open</p>
                  <p className="text-gray-400 text-xs">Monday - Saturday<br />08.00 - 18.00</p>
                </div>
              </motion.div>

              <motion.div 
                className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-purple-500/50 transition-all group"
                whileHover={{ scale: 1.02 }}
              >
                <MapPin size={18} className="text-purple-400 mt-1 flex-shrink-0 group-hover:scale-110 transition-transform" />
                <div>
                  <p className="text-white font-semibold text-sm mb-1">Workshop Location</p>
                  <p className="text-gray-400 text-xs">100 S Main St, New York, NY</p>
                </div>
              </motion.div>

              <motion.div 
                className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-emerald-500/50 transition-all group"
                whileHover={{ scale: 1.02 }}
              >
                <MessageSquare size={18} className="text-emerald-400 mt-1 flex-shrink-0 group-hover:scale-110 transition-transform" />
                <div>
                  <p className="text-white font-semibold text-sm mb-1">Send a Message</p>
                  <a 
                    href="mailto:contact@ucam-cctv.com" 
                    className="text-gray-400 hover:text-emerald-400 transition-colors text-xs flex items-center gap-1"
                  >
                    contact@ucam-cctv.com
                  </a>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>

        <Separator className="my-10 bg-slate-700/50" />

        {/* Bottom Bar */}
        <motion.div 
          className="flex flex-col md:flex-row justify-between items-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <p className="text-gray-500 text-sm flex items-center gap-2">
            Copyright © {new Date().getFullYear()} Ucam by Designesia
            <span className="inline-block w-1 h-1 rounded-full bg-gray-600 mx-1"></span>
            Made with <span className="text-red-500 animate-pulse">♥</span>
          </p>
          <div className="flex space-x-6">
            {[
              { href: "/terms", label: "Terms & Conditions" },
              { href: "/privacy", label: "Privacy Policy" }
            ].map((link, i) => (
              <motion.div key={i} whileHover={{ y: -2 }}>
                <Link 
                  href={link.href} 
                  className="text-gray-400 hover:text-white text-sm transition-colors relative group"
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 group-hover:w-full transition-all duration-300"></span>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </footer>
  )
}

// Memoize the Footer component to prevent unnecessary re-renders
export const Footer = React.memo(FooterComponent)
Footer.displayName = 'Footer'