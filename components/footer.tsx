'use client'

import React from "react"
import Link from "next/link"
import Image from "next/image"
import { Facebook, Twitter, Linkedin, Instagram, Clock, MapPin, MessageSquare, ArrowRight, Headset, MessageCircle } from "lucide-react"
import { motion } from "framer-motion"
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
    <footer className="relative bg-white text-[#b91c2c] overflow-hidden border-t border-red-100">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(15,23,42,0.08) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>
      
      {/* Gradient Overlays */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />

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
                  src="/onlylogo2.jpg" 
                  alt="Protechtur Logo" 
                  width={150} 
                  height={50} 
                  className="h-10 w-auto object-contain transition-all duration-300"
                />
              </motion.div>
            </Link>
            <p className="text-red-900 mb-6 leading-relaxed text-sm">
              Protechtur delivers dependable surveillance and security infrastructure for homes and businesses, combining expert system design, quality hardware, and responsive support to keep your property protected around the clock.
            </p>
            <div className="mb-6 inline-flex items-start gap-3 bg-slate-100 border border-slate-200 rounded-lg px-4 py-3">
              <Headset className="w-7 h-7 text-[#e63946] mt-0.5" strokeWidth={2.2} />
              <div>
                <p className="text-slate-900 font-semibold leading-tight">365 Days Help Desk</p>
                <p className="mt-1 flex items-center gap-2 text-slate-600 text-sm">
                  <MessageCircle className="w-4 h-4 text-green-500 fill-green-500/15" />
                  +91 747 800 3060
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              {[
                { icon: Facebook, label: "Facebook" },
                { icon: Twitter, label: "Twitter" },
                { icon: Linkedin, label: "LinkedIn" },
                { icon: Instagram, label: "Instagram" }
              ].map((social, i) => (
                <motion.button
                  key={i}
                  type="button"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  className="w-10 h-10 rounded-lg bg-red-50 hover:bg-[#e63946] text-[#b91c2c] hover:text-white flex items-center justify-center transition-all duration-300 shadow-lg border border-red-200 hover:border-[#e63946]"
                  aria-label={social.label}
                >
                  <social.icon size={18} />
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Company Links */}
          <motion.div variants={itemVariants}>
            <h3 className="text-[#b91c2c] font-bold text-sm uppercase tracking-wider mb-6 flex items-center">
              <span className="w-8 h-0.5 bg-[#e63946] mr-3"></span>
              PROTECHTUR
            </h3>
            <ul className="space-y-3">
              {[
                { href: "/", label: "Home" },
                { href: "/services", label: "Services" },
                { href: "/about", label: "About Us" },
                { href: "/testimonials", label: "Testimonials" }
              ].map((link, i) => (
                <motion.li
                  key={i}
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Link 
                    href={link.href} 
                    className="text-red-900 hover:text-[#e63946] transition-colors text-sm flex items-center group"
                  >
                    <ArrowRight className="w-4 h-4 mr-2 opacity-0 group-hover:opacity-100 transition-opacity text-[#e63946]" />
                    {link.label}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Services Links */}
          <motion.div variants={itemVariants}>
            <h3 className="text-[#b91c2c] font-bold text-sm uppercase tracking-wider mb-6 flex items-center">
              <span className="w-8 h-0.5 bg-[#e63946] mr-3"></span>
              BUSINESS
            </h3>
            <ul className="space-y-3">
              {[
                { key: 'biometric-access', label: 'Biometric Access' },
                { key: 'gps-system', label: 'GPS System' },
                { key: 'system', label: 'System' },
                { key: 'fire-alarm', label: 'Fire Alarm' },
                { key: 'intercom-system', label: 'Intercom System' },
                { key: 'motion-detection', label: 'Motion Detection' },
                { key: 'pa-system', label: 'PA System' }
              ].map((service, i) => (
                <motion.li
                  key={i}
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="text-sm"
                >
                  <Link
                    href={`/bestsellers?business=${service.key}`}
                    className="text-red-900 hover:text-[#e63946] transition-colors cursor-pointer flex items-center group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-red-300 group-hover:bg-[#e63946] mr-3 transition-colors"></span>
                    {service.label}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Contact Info */}
          <motion.div variants={itemVariants}>
            <h3 className="text-[#b91c2c] font-bold text-sm uppercase tracking-wider mb-6 flex items-center">
              <span className="w-8 h-0.5 bg-[#e63946] mr-3"></span>
              GET IN TOUCH
            </h3>
            <div className="space-y-5">
              <motion.div 
                className="flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-200 hover:border-[#e63946] transition-all group"
                whileHover={{ scale: 1.02 }}
              >
                <Clock size={18} className="text-[#e63946] mt-1 shrink-0 group-hover:scale-110 transition-transform" />
                <div>
                  <p className="text-[#b91c2c] font-semibold text-sm mb-1">We're Open</p>
                  <p className="text-red-900 text-xs">24 Hours</p>
                </div>
              </motion.div>

              <motion.div 
                className="flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-200 hover:border-[#e63946] transition-all group"
                whileHover={{ scale: 1.02 }}
              >
                <MapPin size={18} className="text-[#e63946] mt-1 shrink-0 group-hover:scale-110 transition-transform" />
                <div>
                  <p className="text-[#b91c2c] font-semibold text-sm mb-1">Location</p>
                  <p className="text-red-900 text-xs">
                    2 No. Biplabi Anukul Ch. Street, Shop No. 2, Ground Floor,<br />
                    Chandni Chawk, Kolkata - 700072,<br />
                    Beside Seetala Udipi Eating House (South Indian Restaurant)
                  </p>
                </div>
              </motion.div>

              <motion.div 
                className="flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-200 hover:border-[#e63946] transition-all group"
                whileHover={{ scale: 1.02 }}
              >
                <MessageSquare size={18} className="text-[#e63946] mt-1 shrink-0 group-hover:scale-110 transition-transform" />
                <div>
                  <p className="text-[#b91c2c] font-semibold text-sm mb-1">Send a Message</p>
                  <a 
                    href="mailto:support@protechtur.com" 
                    className="text-red-900 hover:text-[#e63946] transition-colors text-xs flex items-center gap-1"
                  >
                    support@protechtur.com
                  </a>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>

        <Separator className="my-10 bg-red-200" />

        {/* Bottom Bar */}
        <motion.div 
          className="flex flex-col md:flex-row justify-between items-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <div className="text-red-900 text-sm flex flex-col items-center md:items-start gap-1">
            <p className="flex items-center gap-2">
              Copyright © 2026 Protechtur
            </p>
            <p className="flex items-center gap-1">
              Made by 
              <a 
                href="https://cygnatrix.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#e63946] hover:text-[#b91c2c] transition-colors font-semibold underline underline-offset-2"
              >
                Cygnatrix IT Solution
              </a>
            </p>
          </div>

          <div className="flex space-x-6">
            {[
              { href: "/terms", label: "Terms & Conditions" },
              { href: "/privacy", label: "Privacy Policy" }
            ].map((link, i) => (
              <motion.div key={i} whileHover={{ y: -2 }}>
                <Link 
                  href={link.href} 
                  className="text-red-900 hover:text-[#e63946] text-sm transition-colors relative group"
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#e63946] group-hover:w-full transition-all duration-300"></span>
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