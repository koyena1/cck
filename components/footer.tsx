import Link from "next/link"
import Image from "next/image"
import { Facebook, Clock, MapPin, Mail, MessageSquare } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-[#1e2d3f] text-gray-300">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Company Info */}
          <div>
            <Link href="/" className="inline-block mb-6">
              <Image 
                src="/logo.png" 
                alt="UCAM Logo" 
                width={150} 
                height={50} 
                className="h-10 w-auto object-contain"
              />
            </Link>
            <p className="text-gray-400 mb-6 leading-relaxed text-sm">
              Keep your home or business safe with CCTV systems designed to provide 24/7 surveillance and peace of mind. Our expert team offers tailored security solutions, from installation to remote monitoring, ensuring your property is always protected.
            </p>
            <div className="flex space-x-3">
              <a
                href="https://facebook.com"
                className="w-9 h-9 rounded-md bg-[#2a3d52] hover:bg-[#e63946] text-gray-400 hover:text-white flex items-center justify-center transition-all duration-300"
                aria-label="Facebook"
              >
                <Facebook size={16} />
              </a>
              <a
                href="https://twitter.com"
                className="w-9 h-9 rounded-md bg-[#2a3d52] hover:bg-[#e63946] text-gray-400 hover:text-white flex items-center justify-center transition-all duration-300"
                aria-label="Twitter"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a
                href="https://discord.com"
                className="w-9 h-9 rounded-md bg-[#2a3d52] hover:bg-[#e63946] text-gray-400 hover:text-white flex items-center justify-center transition-all duration-300"
                aria-label="Discord"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
              </a>
              <a
                href="https://tiktok.com"
                className="w-9 h-9 rounded-md bg-[#2a3d52] hover:bg-[#e63946] text-gray-400 hover:text-white flex items-center justify-center transition-all duration-300"
                aria-label="TikTok"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </a>
              <a
                href="https://youtube.com"
                className="w-9 h-9 rounded-md bg-[#2a3d52] hover:bg-[#e63946] text-gray-400 hover:text-white flex items-center justify-center transition-all duration-300"
                aria-label="YouTube"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-6">
              COMPANY
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-gray-400 hover:text-[#e63946] transition-colors text-sm">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/services" className="text-[#e63946] hover:text-[#e63946] transition-colors text-sm">
                  Our Services
                </Link>
              </li>
              <li>
                <Link href="/portfolio" className="text-gray-400 hover:text-[#e63946] transition-colors text-sm">
                  Projects
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-[#e63946] transition-colors text-sm">
                  Get a Free Quote
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-400 hover:text-[#e63946] transition-colors text-sm">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-[#e63946] transition-colors text-sm">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Services Links */}
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-6">
              OUR SERVICES
            </h3>
            <ul className="space-y-3">
              <li className="text-gray-400 hover:text-[#e63946] transition-colors text-sm cursor-pointer">
                System Consultation
              </li>
              <li className="text-gray-400 hover:text-[#e63946] transition-colors text-sm cursor-pointer">
                Installation Services
              </li>
              <li className="text-gray-400 hover:text-[#e63946] transition-colors text-sm cursor-pointer">
                System Configuration
              </li>
              <li className="text-gray-400 hover:text-[#e63946] transition-colors text-sm cursor-pointer">
                Monitoring Services
              </li>
              <li className="text-gray-400 hover:text-[#e63946] transition-colors text-sm cursor-pointer">
                Maintenance
              </li>
              <li className="text-gray-400 hover:text-[#e63946] transition-colors text-sm cursor-pointer">
                Storage and Backup
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <div className="space-y-6">
              <div>
                <div className="flex items-start gap-3 mb-2">
                  <Clock size={18} className="text-[#e63946] mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-white font-semibold text-sm mb-1">We're Open</p>
                    <p className="text-gray-400 text-sm">Monday - Saturday 08.00 - 18.00</p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-start gap-3 mb-2">
                  <MapPin size={18} className="text-[#e63946] mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-white font-semibold text-sm mb-1">Workshop Location</p>
                    <p className="text-gray-400 text-sm">100 S Main St, New York, NY</p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-start gap-3">
                  <MessageSquare size={18} className="text-[#e63946] mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-white font-semibold text-sm mb-1">Send a Message</p>
                    <a href="mailto:contact@ucam-cctv.com" className="text-gray-400 hover:text-[#e63946] transition-colors text-sm">
                      contact@ucam-cctv.com
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">Copyright 2025 - Ucam by Designesia</p>
          <div className="flex space-x-6">
            <Link href="/terms" className="text-gray-400 hover:text-[#e63946] text-sm transition-colors">
              Terms & Conditions
            </Link>
            <Link href="/privacy" className="text-gray-400 hover:text-[#e63946] text-sm transition-colors">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}