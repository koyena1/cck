"use client";
import { useState, useEffect, useRef } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HeroCarousel } from "@/components/hero-carousel";
import Link from "next/link";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type Variants,
} from "framer-motion";

import {
  Shield,
  Eye,
  MapPin,
  Zap,
  Cpu,
  Star,
  DollarSign,
  Search,
  Camera,
  Network,
  Settings,
  Monitor,
  HardDrive,
  MessageSquare
} from "lucide-react";

// 1. Animation Variants (FIXED)
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 60 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const heroVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 1,
      ease: [0.16, 1, 0.3, 1],
    },
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

// Brand Data - Update the 'image' paths to your actual file locations
const brands = [
  { name: "Swann", image: "/prod1.jpg", desc: "Professional DIY security systems with multi-camera setups and heat-sensing technology." },
  { name: "Honeywell", image: "/prod2.jpg", desc: "Enterprise-grade surveillance solutions known for reliability and advanced analytics." },
  { name: "Hikvision", image: "/prod3.jpg", desc: "World-leading provider of innovative security products and full-stack video solutions." },
  { name: "Bosch", image: "/prod4.jpg", desc: "High-end German engineering featuring intelligent bitrate management and data security." },
  { name: "Dahua", image: "/prod5.jpg", desc: "Smart IoT solutions providing end-to-end security for residential and commercial use." },
  { name: "Lorex", image: "/prod6.jpg", desc: "Leading the market in 4K resolution security cameras and easy-to-use NVR systems." },
];

export default function HomePage() {
  const [quote, setQuote] = useState({
    channels: "4",
    indoor: 0,
    outdoor: 0,
    hdd: "1TB",
    brand: "Standard",
    pincode: ""
  });

  const [totalPrice, setTotalPrice] = useState(0);
  const [availabilityMessage, setAvailabilityMessage] = useState("");

  // --- SPRING PHYSICS LOGIC FOR "HOW IT WORKS" ---
  const containerRef = useRef<HTMLDivElement>(null);
  const [constraints, setConstraints] = useState(0);
  const scrollProgress = useMotionValue(0);

  const smoothProgress = useSpring(scrollProgress, {
    stiffness: 100,
    damping: 20,
    mass: 1
  });

  useEffect(() => {
    if (containerRef.current) {
      setConstraints(containerRef.current.scrollWidth - containerRef.current.offsetWidth);
    }
  }, []);

  const x = useTransform(smoothProgress, [0, 100], [0, -constraints]);
  // --- END SPRING LOGIC ---

  // Price Calculation Logic
  useEffect(() => {
    let base = 5000; 
    let cameraPrice = (quote.indoor * 1200) + (quote.outdoor * 1500);
    let hddPrice = quote.hdd === "2TB" ? 2000 : quote.hdd === "4TB" ? 4500 : 0;
    setTotalPrice(base + cameraPrice + hddPrice);
  }, [quote]);

  const checkAvailability = () => {
    if (quote.pincode.length === 6) {
      setAvailabilityMessage("Searching for top-rated dealers in your 10km radius...");
      setTimeout(() => {
        setAvailabilityMessage("Success! Verified installers are available in your area.");
      }, 1500);
    } else {
      setAvailabilityMessage("Please enter a valid 6-digit PIN code.");
    }
  };

  return (
    <>
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-32 pb-20 overflow-hidden bg-[#1a2332]">
        <HeroCarousel />
        <div className="absolute inset-0 bg-black/60 z-1"></div>
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={heroVariants}
          className="container mx-auto px-4 py-16 relative z-10 text-center"
        >
            {/* Officially Certified Badge */}
            <div className="flex items-center justify-center mb-8">
              <BlinkingDot />
              <span className="text-red-500 text-sm font-bold uppercase tracking-[0.2em]">Officially Certified</span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black uppercase tracking-wider text-white mb-6 leading-tight">
                Professional CCTV & Security Services<br />
            </h1>
            
            <p className="text-gray-300 text-base md:text-lg max-w-3xl mx-auto mb-16">
                24/7 surveillance for total peace of mind.
            </p>

            {/* Service Icons Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 max-w-6xl mx-auto">
              {[
                { icon: Camera, label: "Installation" },
                { icon: Network, label: "System Design" },
                { icon: Settings, label: "Maintenance" },
                { icon: Monitor, label: "Monitoring" },
                { icon: HardDrive, label: "Storage & Backup" },
                { icon: MessageSquare, label: "Consultation" }
              ].map((service, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + (index * 0.1) }}
                  className="flex flex-col items-center group cursor-pointer"
                >
                  <div className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center mb-3 transition-transform group-hover:scale-110">
                    <service.icon className="w-12 h-12 md:w-14 md:h-14 text-[#e63946] stroke-[1.5]" />
                  </div>
                  <span className="text-white text-xs md:text-sm font-bold uppercase tracking-wider text-center">
                    {service.label}
                  </span>
                </motion.div>
              ))}
            </div>
        </motion.div>
      </section>

      {/* SECTION 1: Automated Quotation Inputs */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={fadeInUp}
        id="quote-engine" 
        className="py-24 bg-[url('/tt.jpg')] bg-cover bg-center bg-fixed relative"
      >
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <BlinkingDot />
              <p className="text-[#e63946] text-xs font-bold tracking-[0.3em] uppercase">
                Get an instant price in just a few steps
              </p>
            </div>
            <h2 className="text-4xl font-black text-white uppercase tracking-wider flex items-center justify-center">
              Automated Quotation
            </h2>
            <p className="text-gray-200 mt-4">Select your requirements below</p>
          </div>

          <div className="max-w-3xl mx-auto">
            <Card className="bg-white/10 border border-white/20 text-white p-8 shadow-2xl rounded-2xl backdrop-blur-none">
              <CardContent className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold mb-2 uppercase">DVR/NVR Channels</label>
                    <select 
                      className="w-full bg-black/40 border border-white/10 p-3 rounded text-white focus:outline-none focus:border-[#e63946]"
                      onChange={(e) => setQuote({...quote, channels: e.target.value})}
                    >
                      <option value="4">4-Channel System</option>
                      <option value="8">8-Channel System</option>
                      <option value="16">16-Channel System</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2 uppercase">Storage Capacity</label>
                    <select 
                      className="w-full bg-black/40 border border-white/10 p-3 rounded text-white focus:outline-none"
                      onChange={(e) => setQuote({...quote, hdd: e.target.value})}
                    >
                      <option value="1TB">1TB Surveillance HDD</option>
                      <option value="2TB">2TB Surveillance HDD</option>
                      <option value="4TB">4TB Surveillance HDD</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold mb-2 uppercase">Indoor</label>
                      <input 
                        type="number" min="0" 
                        className="w-full bg-black/40 border border-white/10 p-3 rounded text-white focus:outline-none"
                        onChange={(e) => setQuote({...quote, indoor: parseInt(e.target.value) || 0})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-2 uppercase">Outdoor</label>
                      <input 
                        type="number" min="0" 
                        className="w-full bg-black/40 border border-white/10 p-3 rounded text-white focus:outline-none"
                        onChange={(e) => setQuote({...quote, outdoor: parseInt(e.target.value) || 0})}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2 uppercase">Installation PIN</label>
                    <input 
                      type="text" placeholder="6-Digit PIN" 
                      className="w-full bg-black/40 border border-white/10 p-3 rounded text-white focus:outline-none"
                      onChange={(e) => setQuote({...quote, pincode: e.target.value})}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.section>

      {/* SECTION 2: Estimated Total Display */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={fadeInUp}
        className="py-24 bg-[url('/w.jpg')] bg-cover bg-center bg-fixed relative"
      >
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="bg-[#e63946]/40 border border-white/20 p-12 rounded-3xl flex flex-col items-center justify-center text-white shadow-2xl backdrop-blur-none">
              <h3 className="text-2xl font-bold uppercase mb-2 tracking-widest">Estimated Total</h3>
              <div className="text-8xl font-black mb-6 flex items-start justify-center">
                <span className="text-4xl mt-4 mr-2">₹</span>{totalPrice}
              </div>
              <p className="text-white/80 mb-10 max-w-md">
                This includes all hardware and professional installation. Final verification is required via call.
              </p>
              <Button size="lg" className="bg-white text-[#e63946] hover:bg-gray-100 font-black h-16 px-12 text-lg rounded-full shadow-xl transition-transform hover:scale-105">
                BOOK INSTALLATION NOW
              </Button>
            </div>
          </div>
        </div>
      </motion.section>

      {/* How It Works */}
      <section className="py-24 bg-[#1a2332] overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center mb-4">
              <BlinkingDot />
              <p className="text-[#e63946] text-xs font-bold tracking-[0.3em] uppercase">
                Our process, simplified
              </p>
            </div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 100 }}
            className="text-4xl font-black text-white uppercase mb-16 text-center flex items-center justify-center"
          >
            How It Works
          </motion.h2>
          
          <div className="relative overflow-hidden">
            <motion.div 
              ref={containerRef}
              style={{ x }}
              className="flex gap-12"
            >
              {[
                { step: 1, title: "Automated Quote", desc: "Select your hardware and get an instant estimate tailored to your needs.", color: "#e63946" },
                { step: 2, title: "Admin Verification", desc: "Our team performs a manual confirmation call to verify details and ensure security.", color: "#7700ff" },
                { step: 3, title: "Dealer Assignment", desc: "We assign the job to the top-rated dealer within a 5-10km radius of your PIN code.", color: "#00ccff" }
              ].map((item, i) => (
                <motion.div 
                  key={i} 
                  whileHover={{ 
                    y: -15, 
                    scale: 1.02,
                    transition: { type: "spring", stiffness: 500, damping: 15 } 
                  }}
                  className="min-w-75 md:min-w-100 group relative p-10 rounded-[2rem] bg-white/5 border border-white/10 hover:border-[#e63946]/50 transition-colors cursor-default"
                >
                  <div className="w-16 h-16 bg-[#e63946] rounded-full flex items-center justify-center text-white font-bold text-2xl mb-8 shadow-[0_0_20px_rgba(230,57,70,0.4)]">
                    {item.step}
                  </div>
                  
                  <h4 className="text-2xl font-bold text-white uppercase mb-4 tracking-tight">
                    {item.title}
                  </h4>
                  
                  <p className="text-gray-400 text-base leading-relaxed">
                    {item.desc}
                  </p>

                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity rounded-[2rem]"
                    style={{ background: `radial-gradient(circle at center, ${item.color}, transparent)` }}
                  />
                </motion.div>
              ))}
            </motion.div>
          </div>

          <div className="mt-16 max-w-md mx-auto relative h-2 bg-white/10 rounded-full">
            <motion.div 
              className="absolute h-full bg-[#e63946] rounded-full"
              style={{ width: useTransform(smoothProgress, (v) => `${v}%`) }}
            />
            <input
              type="range"
              min="0"
              max="100"
              step="0.01"
              value={scrollProgress.get()}
              onChange={(e) => scrollProgress.set(parseFloat(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
            />
          </div>
        </div>
      </section>

      {/* Why Choose Our Platform? */}
      <section className="py-24 bg-[#0a1628]">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center mb-4">
              <BlinkingDot />
              <p className="text-[#e63946] text-xs font-bold tracking-[0.3em] uppercase">
                Trusted quality and performance
              </p>
            </div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-black text-white uppercase tracking-wider mb-16 flex items-center justify-center"
          >
            Only the Best for Your Safety
          </motion.h2>
          
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto"
          >
            <motion.div variants={itemVariants} className="bg-[#1a2540] p-8 rounded-lg text-center group hover:bg-[#e63946] transition-all">
              <MapPin className="w-12 h-12 text-[#e63946] group-hover:text-white mx-auto mb-6" />
              <h3 className="text-xl font-bold text-white uppercase mb-4">Verified Local Experts</h3>
              <p className="text-gray-400 group-hover:text-white/90 text-sm">We only work with dealers within a 5-10km radius of your location to ensure fast service.</p>
            </motion.div>
            <motion.div variants={itemVariants} className="bg-[#1a2540] p-8 rounded-lg text-center group hover:bg-[#e63946] transition-all">
              <Star className="w-12 h-12 text-[#e63946] group-hover:text-white mx-auto mb-6" />
              <h3 className="text-xl font-bold text-white uppercase mb-4">Rated Performance</h3>
              <p className="text-gray-400 group-hover:text-white/90 text-sm">Every dealer is vetted based on their infrastructure, standing, and past performance scores.</p>
            </motion.div>
            <motion.div variants={itemVariants} className="bg-[#1a2540] p-8 rounded-lg text-center group hover:bg-[#e63946] transition-all">
              <DollarSign className="w-12 h-12 text-[#e63946] group-hover:text-white mx-auto mb-6" />
              <h3 className="text-xl font-bold text-white uppercase mb-4">Fixed Pricing</h3>
              <p className="text-gray-400 group-hover:text-white/90 text-sm">No hidden costs or bidding wars. You pay the transparent price fixed by the platform.</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* NEW SECTION: Brand Choice */}
      <section className="py-24 bg-[#0a1628]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-[#e63946] text-xs font-bold tracking-[0.3em] uppercase mb-2">
              <BlinkingDot />Trusted brands</p>
            <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-wider flex items-center justify-center">
              Brand Choice
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {brands.map((brand, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group relative bg-linear-to-br from-[#1a2332] to-[#0d1520] overflow-hidden aspect-4/3 flex flex-col items-center justify-center p-8 transition-all duration-500"
                style={{
                  clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 40px), calc(100% - 40px) 100%, 0 100%)'
                }}
              >
                {/* Angled Corner Effect */}
                <div className="absolute bottom-0 right-0 w-16 h-16 bg-linear-to-br from-[#2a3342] to-[#1d2534] transform rotate-0" 
                     style={{
                       clipPath: 'polygon(100% 0, 100% 100%, 0 100%)'
                     }}
                />

                {/* Brand Image/Kit Container */}
                <div className="relative w-full h-full flex items-center justify-center">
                  <img 
                    src={brand.image} 
                    alt={brand.name} 
                    className="max-w-[80%] max-h-[80%] object-contain"
                  />
                </div>

                {/* Default Brand Name (Bottom) */}
                <div className="absolute bottom-8 left-0 w-full text-center transition-opacity duration-300 group-hover:opacity-0">
                  <h3 className="text-white font-bold uppercase tracking-[0.2em] text-sm">{brand.name}</h3>
                </div>

                {/* Hover Overlay Content */}
                <div className="absolute inset-0 bg-[#0a1628]/95 p-8 flex flex-col justify-start opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0 z-20">
                  <h3 className="text-[#e63946] font-black uppercase tracking-wider text-lg mb-4 mt-4">{brand.name}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed mb-auto">
                    {brand.desc}
                  </p>
                  <Button className="bg-[#e63946] hover:bg-[#d62839] text-white font-bold uppercase text-xs tracking-[0.15em] px-8 h-10 rounded-none transition-colors border-none self-start">
                    View Details
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
        
      {/* Service Area Check */}
      <section className="py-24 bg-[#1a2332] border-t border-gray-800">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <div className="flex items-center justify-center mb-4">
              <p className="text-[#e63946] text-xs font-bold tracking-[0.3em] uppercase">
                <BlinkingDot />Availability
              </p>
            </div>
          <motion.div
             initial={{ opacity: 0, scale: 0.9 }}
             whileInView={{ opacity: 1, scale: 1 }}
             viewport={{ once: true }}
          >
            <h2 className="text-4xl font-black text-white uppercase mb-6 flex items-center justify-center">
              Check Availability
            </h2>
            <p className="text-gray-400 mb-10">Enter your PIN code to see if we service your area.</p>
            
            <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
                <div className="relative w-full md:w-64">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                <input 
                    type="text" 
                    maxLength={6}
                    placeholder="Enter PIN Code" 
                    className="w-full bg-[#0a1628] border border-gray-700 p-4 pl-12 rounded text-white focus:border-[#e63946] outline-none"
                    onChange={(e) => setQuote({...quote, pincode: e.target.value})}
                />
                </div>
                <Button onClick={checkAvailability} className="bg-[#e63946] hover:bg-[#d62839] text-white font-bold h-14 px-8 w-full md:w-auto">
                  <Search className="mr-2" size={18} /> CHECK NOW
                </Button>
            </div>

            {availabilityMessage && (
                <div className={`mt-6 p-4 rounded text-sm font-bold ${availabilityMessage.includes('Success') ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                {availabilityMessage}
                </div>
            )}
          </motion.div>
        </div>
      </section>

      <Footer />
    </>
  );
}