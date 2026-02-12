'use client'

import { Suspense } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import Image from "next/image"
import { motion, type Variants } from "framer-motion"
import { 
  Settings, 
  ArrowRight, Phone, Lock 
} from "lucide-react"

// --- ANIMATION VARIANTS (Maintained) ---
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 60 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
  },
};

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
};

const heroVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
  },
};

// Blinking Red Dot Component
const BlinkingDot = () => (
  <span className="inline-flex items-center mr-3">
    <span className="relative flex h-3 w-3">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#e63946] opacity-75"></span>
      <span className="relative inline-flex rounded-full h-3 w-3 bg-[#e63946]"></span>
    </span>
  </span>
);

export default function ServicesPage() {
  return (
    <div className="bg-white min-h-screen">
      <Suspense fallback={<div className="h-16" />}>
        <Navbar />
      </Suspense>

      {/* Hero Section - Light Refactor */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-16 md:pt-24 lg:pt-32 pb-12 md:pb-16 lg:pb-20 overflow-hidden bg-slate-50">
        {/* Photo Background */}
        <div className="absolute inset-0 w-full h-full">
          <img
            src="/ser.jpg" 
            alt="Services Background"
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Light Overlay for readability */}
          <div className="absolute inset-0 bg-white/70"></div>
        </div>
        
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={heroVariants}
          className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 lg:py-16 relative z-10 text-center"
        >
          <div className="flex items-center justify-center mb-6 md:mb-8">
            <BlinkingDot />
            <span className="text-[#e63946] text-xs sm:text-sm font-bold uppercase tracking-[0.2em]">Professional Security Services</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black uppercase tracking-wider text-slate-900 mb-4 md:mb-6 leading-tight">
            Expert Security & <br/><span className="text-[#e63946]">Surveillance</span> Solutions
          </h1>
          
          <p className="text-slate-600 text-sm sm:text-base md:text-lg max-w-2xl md:max-w-3xl mx-auto mb-6 md:mb-8 px-4 sm:px-0">
            Comprehensive security solutions tailored to protect your business and residential spaces with 24/7 reliability and cutting-edge technology.
          </p>

          <nav className="flex items-center justify-center space-x-2 text-base font-bold uppercase tracking-widest">
            <Link 
              href="/" 
              className="text-[#e63946] hover:text-slate-900 transition-colors"
            >
              Home
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-400">Services</span>
          </nav>
        </motion.div>
      </section>

      {/* Services Grid Section - Light Background */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="text-center mb-16">
              <div className="flex items-center justify-center mb-6">
                <BlinkingDot />
                <span className="text-[#e63946] text-sm font-bold uppercase tracking-[0.3em]">
                  // OUR SERVICES
                </span>
              </div>
              
              <h2 className="text-4xl md:text-6xl font-black uppercase tracking-wider mb-4 text-slate-900">
                Complete{" "}
                <span className="text-[#e63946]">CCTV</span>{" "}
                Services
                <br />
                For Businesses
              </h2>
            </div>

            {/* Services Grid */}
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
            >
              {[
                { img: "/prod2.jpg", title: "Support And Maintenance", tag1: "GUARDIAN VISION", tag2: "SAFE VISION", desc: "Reliable upkeep ensuring seamless security operations." },
                { img: "/prod4.jpg", title: "Expert Camera Installation", tag1: "SMART GUARD", tag2: "SECURE NET", desc: "Seamless installation with guaranteed system reliability." },
                { img: "/ae.png", title: "Weatherproof Cameras", tag1: "WATCH PRO", tag2: "CAM SHIELD", desc: "Durable surveillance for all weather conditions." },
                { img: "/cc.jpg", title: "Access Control Systems", tag1: "VIEW SAFE", tag2: "EYE TRACK", desc: "Advanced security with controlled entry management." }
              ].map((service, index) => (
                <motion.div 
                  key={index}
                  variants={itemVariants}
                  className="group relative overflow-hidden rounded-[2rem] h-100 cursor-pointer border border-slate-200 shadow-sm hover:shadow-xl transition-all"
                >
                  <Image
                    src={service.img}
                    alt={service.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  {/* Light Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent"></div>
                  
                  {/* Tags */}
                  <div className="absolute top-6 left-6 flex gap-2">
                    <Badge className="bg-white/80 backdrop-blur-md text-[#e63946] border-slate-200 rounded-none px-4 py-1 font-bold">
                      {service.tag1}
                    </Badge>
                    <Badge className="bg-slate-900 text-white rounded-none px-4 py-1 font-bold">
                      {service.tag2}
                    </Badge>
                  </div>

                  {/* Content */}
                  <div className="absolute bottom-8 left-8 right-8">
                    <h3 className="text-3xl font-black text-slate-900 uppercase mb-2">
                      {service.title}
                    </h3>
                    <p className="text-slate-600 group-hover:text-slate-900 transition-colors text-sm font-medium">
                      {service.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* 24/7 Support Section - Light Mode */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 max-w-7xl mx-auto items-center">
            {/* Left Content */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <div className="flex items-center mb-6">
                <BlinkingDot />
                <span className="text-[#e63946] text-sm font-bold uppercase tracking-[0.3em]">
                  // OUR SUPPORT
                </span>
              </div>
              
              <h2 className="text-4xl md:text-5xl font-black uppercase mb-6 leading-tight text-slate-900">
                Citive{" "}
                <span className="text-[#e63946]">24/7</span>{" "}
                Reliable Technical Support
              </h2>

              <p className="text-lg text-slate-600 mb-8 leading-relaxed font-medium">
                Our dedicated team delivers 24/7 technical assistance, ensuring your CCTV systems remain secure, fully functional, and continuously supported for uninterrupted protection.
              </p>

              {/* Features */}
              <div className="space-y-8 mb-10">
                <div className="flex items-start gap-6 group">
                  <div className="w-16 h-16 bg-[#e63946] rounded-full flex items-center justify-center shrink-0 shadow-lg transition-transform group-hover:scale-110">
                    <Settings className="text-white" size={28} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 uppercase mb-2 tracking-wide">
                      CCTV Installation
                    </h3>
                    <p className="text-slate-500 font-medium">
                      Expert installation of advanced surveillance and monitoring systems.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-6 group">
                  <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center shrink-0 shadow-lg transition-transform group-hover:scale-110">
                    <Lock className="text-white" size={28} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 uppercase mb-2 tracking-wide">
                      Confidential Access
                    </h3>
                    <p className="text-slate-500 font-medium">
                      Restricted entry ensuring privacy, security, and authorized data access.
                    </p>
                  </div>
                </div>
              </div>

              <Button 
                asChild 
                size="lg" 
                className="bg-[#e63946] hover:bg-red-700 text-white rounded-none px-10 h-16 font-black uppercase tracking-widest shadow-xl transition-all"
              >
                <Link href="/contact" className="flex items-center gap-2">
                  Contact Now
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
            </motion.div>

            {/* Right Image */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="relative rounded-[2rem] overflow-hidden border border-slate-200 shadow-2xl">
                <Image
                  src="/ser1.jpg"
                  alt="24/7 Technical Support"
                  width={800}
                  height={600}
                  className="w-full h-auto object-cover"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section - Light Mode */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 max-w-7xl mx-auto items-start">
            {/* Left Side */}
            <div className="lg:sticky lg:top-32">
              <div className="flex items-center mb-6">
                <BlinkingDot />
                <span className="text-[#e63946] text-sm font-bold uppercase tracking-[0.3em]">
                  // FAQ
                </span>
              </div>
              
              <h2 className="text-4xl md:text-5xl font-black uppercase mb-10 text-slate-900 tracking-wider leading-tight">
                Answers To Regular{" "}
                <span className="text-[#e63946]">Customer</span>{" "}
                Questions
              </h2>

              <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-10 shadow-sm">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-[#e63946] rounded-full flex items-center justify-center shadow-lg">
                    <Phone className="text-white" size={28} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
                      24/7 Emergency Support
                    </p>
                    <a 
                      href="tel:+0123456789" 
                      className="text-3xl font-black text-slate-900 hover:text-[#e63946] transition-colors"
                    >
                      +0123456789
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - FAQ Accordion */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <Accordion type="single" collapsible className="space-y-4">
                {[
                  { id: "item-1", q: "01. How Many Days Can CCTV Cameras Record?", a: "Recording time depends on storage capacity, resolution, and number of cameras. Typically, systems store footage for 15-30 days." },
                  { id: "item-2", q: "02. Can CCTV Cameras Record At Night?", a: "Yes, most modern CCTV cameras come equipped with infrared (IR) night vision technology, typically up to 20-30 meters." },
                  { id: "item-3", q: "03. Do CCTV Cameras Work Without Internet?", a: "Yes, CCTV cameras can work without internet by recording locally to a DVR/NVR. Internet is required for remote viewing." },
                  { id: "item-4", q: "04. Do CCTV Cameras Record Audio?", a: "Some CCTV cameras have built-in microphones. This feature must be specifically selected and checked for local legal compliance." },
                  { id: "item-5", q: "05. Can CCTV Cameras Work Without Power?", a: "No, CCTV cameras require power. However, battery backup systems (UPS) or solar-powered solutions can ensure operation during outages." }
                ].map((faq) => (
                  <AccordionItem 
                    key={faq.id}
                    value={faq.id} 
                    className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden px-2 shadow-sm"
                  >
                    <AccordionTrigger className="px-6 py-6 text-slate-900 hover:no-underline text-left font-black text-lg uppercase tracking-wide group">
                      <span className="group-data-[state=open]:text-[#e63946] transition-colors">
                        {faq.q}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-6 text-slate-600 text-base leading-relaxed font-medium">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}