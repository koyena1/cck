"use client";
import { useState } from "react"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Counter } from "@/components/ui/counter"
import { Target, Eye, Shield, Zap, TrendingUp, Award, CheckCircle, Quote, ChevronLeft, ChevronRight } from "lucide-react"
import { motion, type Variants } from "framer-motion"

// Animation Variants
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

export default function AboutPage() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const values = [
    {
      icon: Zap,
      title: "Innovation",
      description:
        "Embracing cutting-edge technologies and creative solutions to deliver next-generation digital experiences.",
    },
    {
      icon: Shield,
      title: "Security",
      description:
        "Implementing industry-leading security measures with ISO 27001 certification to protect your valuable assets.",
    },
    {
      icon: TrendingUp,
      title: "Scalability",
      description:
        "Building robust architectures that seamlessly grow from startup to enterprise scale without compromise.",
    },
    {
      icon: Award,
      title: "Reliability",
      description: "Delivering consistent excellence with 99.99% uptime guarantee and proactive 24/7 monitoring.",
    },
  ]

  const commitments = [
    {
      icon: Shield,
      title: "Data Security & Privacy",
      description: "We prioritize the protection of your sensitive information with end-to-end encryption, regular security audits, and strict compliance with international data protection regulations including GDPR and ISO 27001.",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: Award,
      title: "Quality Excellence",
      description: "Every project undergoes rigorous quality assurance processes, comprehensive testing, and code reviews to ensure we deliver solutions that exceed industry standards and client expectations.",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: Target,
      title: "On-Time Delivery",
      description: "We understand that time is critical for your business. Our proven project management methodologies and agile approach ensure timely delivery without compromising on quality or functionality.",
      gradient: "from-orange-500 to-red-500"
    },
    {
      icon: TrendingUp,
      title: "Continuous Innovation",
      description: "We stay ahead of technology trends and continuously invest in research and development to bring you cutting-edge solutions that give your business a competitive advantage in the market.",
      gradient: "from-green-500 to-emerald-500"
    },
    {
      icon: Zap,
      title: "Performance Optimization",
      description: "We build fast, efficient, and scalable solutions optimized for peak performance. Our applications are designed to handle growth and deliver exceptional user experiences under any load.",
      gradient: "from-yellow-500 to-orange-500"
    },
    {
      icon: CheckCircle,
      title: "24/7 Support",
      description: "Our dedicated support team is available around the clock to assist you. We provide rapid response times, proactive monitoring, and comprehensive maintenance to ensure your systems run smoothly.",
      gradient: "from-indigo-500 to-purple-500"
    },
  ]

  const achievements = [
    { icon: CheckCircle, text: "ISO 27001:2022 Certified" },
    { icon: CheckCircle, text: "98% Client Retention Rate" },
    { icon: CheckCircle, text: "500+ Projects Delivered" },
    { icon: CheckCircle, text: "15+ Years in Business" },
  ]

  const testimonials = [
    {
      name: "Rajesh Kumar",
      role: "CEO, TechVision Solutions",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop",
      content: "Cygnatrix transformed our business with their innovative CCTV solutions. The system is robust, user-friendly, and the support team is incredibly responsive. Highly recommended!",
      rating: 5
    },
    {
      name: "Priya Sharma",
      role: "Operations Manager, SafeGuard Retail",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
      content: "Working with Cygnatrix has been an absolute pleasure. They delivered our security system ahead of schedule and the quality exceeded our expectations. True professionals!",
      rating: 5
    },
    {
      name: "Amit Patel",
      role: "Director, Urban Properties",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
      content: "The team's expertise in security technology is unmatched. They installed a comprehensive CCTV network across our properties with minimal disruption. Excellent service!",
      rating: 5
    },
    {
      name: "Sneha Reddy",
      role: "Facility Head, MedCare Hospital",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop",
      content: "Cygnatrix provided us with a state-of-the-art surveillance system that has significantly improved our facility's security. Their after-sales support is outstanding!",
      rating: 5
    }
  ]

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
  };

  return (
    <>
      <Navbar />

      {/* Hero Section with Video Background */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-16 md:pt-24 lg:pt-32 pb-12 md:pb-16 lg:pb-20 overflow-hidden bg-[#1a2332]">
        {/* Photo Background */}
        <div className="absolute inset-0 w-full h-full">
          <img
            src="/prod3.jpg" 
            alt="Hero Background"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/60"></div>
        </div>
        
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={heroVariants}
          className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 lg:py-16 relative z-10 text-center"
        >
          {/* about our company */}
          <div className="flex items-center justify-center mb-6 md:mb-8">
            <BlinkingDot />
            <span className="text-red-500 text-xs sm:text-sm font-bold uppercase tracking-[0.2em]">About Our Company</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black uppercase tracking-wider sm:tracking-wide md:tracking-wider text-white mb-4 md:mb-6 leading-tight">
            Who We Are & What We Stand For
          </h1>
          
          <p className="text-gray-300 text-sm sm:text-base md:text-lg max-w-2xl md:max-w-3xl mx-auto mb-6 md:mb-8 px-4 sm:px-0">
            A team of passionate developers, analysts, and designers with the vision to transform your business through cutting-edge technology.
          </p>
          <nav className="flex items-center justify-center space-x-2 text-base font-bold uppercase tracking-widest">
            <Link 
              href="/" 
              className="text-[#e63946] hover:text-white transition-colors"
            >
              Home
            </Link>
            <span className="text-gray-600">/</span>
            <span className="text-gray-400">About</span>
          </nav>
        </motion.div>
      </section>

      {/* Our Story Section */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={fadeInUp}
        className="py-16 md:py-20 lg:py-24 bg-[url('/hero1.jpg')] bg-cover bg-center bg-fixed relative"
      >
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center mb-4">
              <BlinkingDot />
              <p className="text-[#e63946] text-xs font-bold tracking-[0.3em] uppercase">
                Our Story
              </p>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white uppercase tracking-wider mb-6 md:mb-8">
              We Offers Quality CCTV Systems & Services
            </h2>
            <div className="space-y-4 md:space-y-6 text-gray-200 leading-relaxed text-base sm:text-lg">
              <p className="px-2 sm:px-0">
                Cygnatrix was born from a simple yet powerful vision — to deliver reliable, innovative, and affordable IT solutions that truly make a difference.
              </p>
              <p className="font-bold text-[#e63946] text-lg sm:text-xl md:text-2xl mt-6 md:mt-8">
                This is just the beginning of our story. 🚀
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Company Stats */}
      <section className="py-16 md:py-20 lg:py-24 bg-[#1a2332]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl sm:text-3xl md:text-4xl font-black text-white uppercase mb-12 md:mb-16 text-center flex items-center justify-center"
          >
            <BlinkingDot />Our Track Record
          </motion.h2>
          
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row justify-center items-center gap-6 md:gap-8 text-center max-w-4xl mx-auto"
          >
            <motion.div variants={itemVariants} className="p-6 md:p-8 bg-[#1a2540] rounded-lg group hover:bg-[#e63946] transition-all w-full max-w-xs sm:max-w-sm">
              <div className="text-4xl sm:text-5xl md:text-6xl font-black mb-2 md:mb-3 text-[#e63946] group-hover:text-white">
                <Counter to={500} suffix="+" />
              </div>
              <div className="text-sm md:text-lg text-gray-400 group-hover:text-white/90 font-bold uppercase">OUR STAFF</div>
            </motion.div>
            <motion.div variants={itemVariants} className="p-6 md:p-8 bg-[#1a2540] rounded-lg group hover:bg-[#e63946] transition-all w-full max-w-xs sm:max-w-sm">
              <div className="text-4xl sm:text-5xl md:text-6xl font-black mb-2 md:mb-3 text-[#e63946] group-hover:text-white">
                <Counter to={250} suffix="+" />
              </div>
              <div className="text-sm md:text-lg text-gray-400 group-hover:text-white/90 font-bold uppercase">HAPPY CLIENTS</div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={fadeInUp}
        className="py-16 md:py-20 lg:py-24 bg-[url('/gg.png')] bg-cover bg-center bg-fixed relative"
      >
        <div className="absolute inset-0 bg-black/70"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-12 gap-8 max-w-7xl mx-auto">
            {/* Left Side - Heading and Navigation */}
            <div className="lg:col-span-4 flex flex-col justify-start">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
                Customers Feedback
              </h2>
              <p className="text-gray-300 mb-6 md:mb-8 text-base sm:text-lg">
                From career changes to dream jobs, here's how FlyonUI helped.
              </p>
              
              {/* Navigation Arrows */}
              <div className="flex gap-4 mb-8 lg:mb-0">
                <button
                  onClick={() => handlePrev()}
                  className="bg-white/20 hover:bg-[#e63946] text-white p-3 rounded-lg transition-all shadow-lg hover:scale-105 backdrop-blur-sm"
                  aria-label="Previous testimonial"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <button
                  onClick={() => handleNext()}
                  className="bg-[#e63946] hover:bg-[#d32f2f] text-white p-3 rounded-lg transition-all shadow-lg hover:scale-105"
                  aria-label="Next testimonial"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Right Side - Testimonial Cards */}
            <div className="lg:col-span-8">
              <div className="overflow-hidden">
                <motion.div
                  animate={{ x: `-${currentIndex * 100}%` }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="flex"
                >
                  {testimonials.map((testimonial, index) => (
                    <div
                      key={index}
                      className="w-full shrink-0 px-2"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        {/* Show current testimonial and next one */}
                        {[testimonial, testimonials[(index + 1) % testimonials.length]].map((item, idx) => (
                          <div key={idx} className="bg-white rounded-xl md:rounded-2xl p-4 sm:p-6 shadow-xl hover:shadow-2xl transition-all">
                            {/* Profile Section */}
                            <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                              <img 
                                src={item.image} 
                                alt={item.name}
                                className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover ring-4 ring-blue-100"
                              />
                              <div>
                                <h4 className="text-gray-900 font-bold text-base sm:text-lg">{item.name}</h4>
                                <p className="text-gray-500 text-xs sm:text-sm">{item.role}</p>
                              </div>
                            </div>

                            {/* Star Rating */}
                            <div className="flex gap-1 mb-3 sm:mb-4">
                              {[...Array(item.rating)].map((_, i) => (
                                <svg key={i} className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>

                            {/* Testimonial Content */}
                            <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
                              "{item.content}"
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      <Footer />
    </>
  )
}