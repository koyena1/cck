'use client'

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import Image from "next/image"
import { Code, Smartphone, Palette, Cloud, Cpu, Settings, CheckCircle, ArrowRight, ChevronRight, Phone, Shield, Lock } from "lucide-react"
import type { Metadata } from "next"

export default function ServicesPage() {
  const services = [
    {
      icon: Code,
      title: "Web Development",
      description:
        "Challenge the market with next-generation web applications built with cutting-edge technologies. From responsive websites to complex enterprise platforms, we deliver scalable solutions that drive business growth.",
      features: [
        "Custom Web Applications & Portals",
        "E-commerce & Marketplace Solutions",
        "Enterprise Content Management Systems",
        "Progressive Web Apps (PWA)",
        "RESTful API Development & Integration",
        "Performance Optimization & SEO",
      ],
    },
    {
      icon: Smartphone,
      title: "Mobile App Development",
      description:
        "Create exceptional mobile experiences for iOS and Android platforms. Our expert team delivers native and cross-platform solutions that engage users and maximize performance across all devices.",
      features: [
        "Native iOS Development (Swift)",
        "Native Android Development (Kotlin)",
        "Cross-Platform Apps (React Native, Flutter)",
        "Mobile-First UI/UX Design",
        "App Store Optimization & Publishing",
        "Push Notifications & Real-time Analytics",
      ],
    },
    {
      icon: Palette,
      title: "UI/UX Design",
      description:
        "Design beautiful, intuitive interfaces that users love. Our user-centric design process combines research, creativity, and best practices to create exceptional digital experiences that drive engagement and conversion.",
      features: [
        "User Research & Behavioral Analysis",
        "Wireframing, Prototyping & User Testing",
        "Visual Design & Brand Identity",
        "Design Systems & Component Libraries",
        "WCAG Accessibility Compliance",
        "Responsive & Adaptive Design",
      ],
    },
    {
      icon: Cloud,
      title: "Cloud Solutions",
      description:
        "Take your company to new levels of security, accessibility and scalability with our comprehensive cloud services. We help you leverage AWS, Azure, and Google Cloud to optimize costs and improve performance.",
      features: [
        "Cloud Migration & Modernization",
        "Multi-Cloud Architecture (AWS, Azure, GCP)",
        "DevOps & CI/CD Pipeline Automation",
        "Cloud-Native Application Development",
        "Serverless Computing & Microservices",
        "Cloud Cost Optimization & Management",
      ],
    },
    {
      icon: Cpu,
      title: "AI & Automation",
      description:
        "Harness the power of artificial intelligence and intelligent automation to transform your business operations. From chatbots to predictive analytics, we deliver AI solutions that create measurable business value.",
      features: [
        "Machine Learning Model Development",
        "AI Chatbots & Virtual Assistants",
        "Intelligent Process Automation (RPA)",
        "Predictive Analytics & Data Science",
        "Computer Vision & Image Recognition",
        "Natural Language Processing (NLP)",
      ],
    },
    {
      icon: Settings,
      title: "Maintenance & Support",
      description:
        "Keep your systems running at peak performance with our comprehensive maintenance and support services. Our dedicated team provides 24/7 monitoring, rapid response, and proactive management to ensure reliability.",
      features: [
        "24/7 Technical Support & Monitoring",
        "Proactive System Health Checks",
        "Security Patches & Updates",
        "Performance Tuning & Optimization",
        "Bug Resolution & Issue Tracking",
        "Automated Backups & Disaster Recovery",
      ],
    },
  ]

  return (
    <>
      <Navbar />

      {/* Hero Section */}
      <section className="relative h-[60vh] min-h-[450px] flex items-end overflow-hidden bg-slate-950">
        {/* Background Image */}
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url("/ser.jpg")',
            backgroundPosition: 'center right'
          }}
        >
          {/* Dark Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/40 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent"></div>
        </div>
        
        {/* Content */}
        <div className="container mx-auto px-4 pb-12 relative z-10">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-8 text-white">
              Services
            </h1>
            
            {/* Breadcrumb */}
            <nav className="flex items-center space-x-2 text-base">
              <Link 
                href="/" 
                className="text-[#e63946] hover:text-[#d62839] transition-colors font-medium"
              >
                Home
              </Link>
              <span className="text-gray-400">/</span>
              <span className="text-gray-300">Services</span>
            </nav>
          </div>
        </div>
      </section>

      {/* Services Grid Section */}
      <section className="py-24 bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="text-center mb-16">
              <div className="inline-block px-4 py-2 border-2 border-red-500 rounded-full mb-6">
                <span className="text-red-600 dark:text-red-400 text-sm font-semibold tracking-wide">// OUR SERVICES</span>
              </div>
              
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
                Complete{" "}
                <span className="text-red-600">CCTV</span>{" "}
                <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Services
                </span>
                <br />
                For Businesses
              </h2>
            </div>

            {/* Services Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Service Card 1 - Support And Maintenance */}
              <div className="group relative overflow-hidden rounded-3xl h-[400px] cursor-pointer">
                <Image
                  src="/service1.jpg"
                  alt="Support And Maintenance"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent"></div>
                
                {/* Tags */}
                <div className="absolute top-6 left-6 flex gap-2">
                  <Badge className="bg-white/20 backdrop-blur-md text-white border-white/30 hover:bg-white/30">
                    GUARDIAN VISION
                  </Badge>
                  <Badge className="bg-white/20 backdrop-blur-md text-white border-white/30 hover:bg-white/30">
                    SAFE VISION
                  </Badge>
                </div>

                {/* Content */}
                <div className="absolute bottom-8 left-8 right-8">
                  <h3 className="text-3xl font-bold text-white mb-2">
                    Support And Maintenance
                  </h3>
                  <p className="text-gray-300 text-sm">
                    Reliable upkeep ensuring seamless security operations.
                  </p>
                </div>
              </div>

              {/* Service Card 2 - Expert Camera Installation */}
              <div className="group relative overflow-hidden rounded-3xl h-[400px] cursor-pointer">
                <Image
                  src="/service2.jpg"
                  alt="Expert Camera Installation"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent"></div>
                
                {/* Tags */}
                <div className="absolute top-6 left-6 flex gap-2">
                  <Badge className="bg-white/20 backdrop-blur-md text-white border-white/30 hover:bg-white/30">
                    SMART GUARD
                  </Badge>
                  <Badge className="bg-white/20 backdrop-blur-md text-white border-white/30 hover:bg-white/30">
                    SECURE NET
                  </Badge>
                </div>

                {/* Content */}
                <div className="absolute bottom-8 left-8 right-8">
                  <h3 className="text-3xl font-bold text-white mb-2">
                    Expert Camera Installation
                  </h3>
                  <p className="text-gray-300 text-sm">
                    Seamless installation with guaranteed system reliability.
                  </p>
                </div>
              </div>

              {/* Service Card 3 - Weatherproof Cameras */}
              <div className="group relative overflow-hidden rounded-3xl h-[400px] cursor-pointer">
                <Image
                  src="/service3.jpg"
                  alt="Weatherproof Cameras"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent"></div>
                
                {/* Tags */}
                <div className="absolute top-6 left-6 flex gap-2">
                  <Badge className="bg-white/20 backdrop-blur-md text-white border-white/30 hover:bg-white/30">
                    WATCH PRO
                  </Badge>
                  <Badge className="bg-white/20 backdrop-blur-md text-white border-white/30 hover:bg-white/30">
                    CAM SHIELD
                  </Badge>
                </div>

                {/* Content */}
                <div className="absolute bottom-8 left-8 right-8">
                  <h3 className="text-3xl font-bold text-white mb-2">
                    Weatherproof Cameras
                  </h3>
                  <p className="text-gray-300 text-sm">
                    Durable surveillance for all weather conditions.
                  </p>
                </div>
              </div>

              {/* Service Card 4 - Access Control Systems */}
              <div className="group relative overflow-hidden rounded-3xl h-[400px] cursor-pointer">
                <Image
                  src="/service4.jpg"
                  alt="Access Control Systems"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent"></div>
                
                {/* Tags */}
                <div className="absolute top-6 left-6 flex gap-2">
                  <Badge className="bg-white/20 backdrop-blur-md text-white border-white/30 hover:bg-white/30">
                    VIEW SAFE
                  </Badge>
                  <Badge className="bg-white/20 backdrop-blur-md text-white border-white/30 hover:bg-white/30">
                    EYE TRACK
                  </Badge>
                </div>

                {/* Content */}
                <div className="absolute bottom-8 left-8 right-8">
                  <h3 className="text-3xl font-bold text-white mb-2">
                    Access Control Systems
                  </h3>
                  <p className="text-gray-300 text-sm">
                    Advanced security with controlled entry management.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 24/7 Support Section */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-7xl mx-auto items-center">
            {/* Left Content */}
            <div>
              <div className="inline-block px-4 py-2 border-2 border-red-500 rounded-full mb-6">
                <span className="text-red-600 dark:text-red-400 text-sm font-semibold tracking-wide">// OUR SUPPORT</span>
              </div>
              
              <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight text-gray-900 dark:text-white">
                Camtora{" "}
                <span className="bg-gradient-to-r from-red-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                  24/7
                </span>{" "}
                Reliable Technical Support
              </h2>

              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                Our dedicated team delivers 24/7 technical assistance, ensuring your CCTV systems remain secure, fully functional, and continuously supported for uninterrupted protection and peace of mind.
              </p>

              {/* Features */}
              <div className="space-y-6 mb-8">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-red-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Settings className="text-white" size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      CCTV Installation
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Expert installation of advanced surveillance and monitoring systems.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-red-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Lock className="text-white" size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      Confidential Access
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Restricted entry ensuring privacy, security, and authorized data access.
                    </p>
                  </div>
                </div>
              </div>

              <Button 
                asChild 
                size="lg" 
                className="bg-gradient-to-r from-slate-900 to-slate-700 hover:from-slate-800 hover:to-slate-600 text-white rounded-full px-8 shadow-xl hover:shadow-2xl transition-all"
              >
                <Link href="/contact" className="flex items-center gap-2">
                  Contact Now
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
            </div>

            {/* Right Image */}
            <div className="relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <Image
                  src="/ser1.jpg"
                  alt="24/7 Technical Support"
                  width={800}
                  height={600}
                  className="w-full h-auto object-cover"
                />
              </div>
              {/* Decorative Elements */}
              <div className="absolute -top-4 -right-4 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl"></div>
              <div className="absolute -bottom-4 -left-4 w-40 h-40 bg-purple-500/20 rounded-full blur-2xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-7xl mx-auto items-start">
            {/* Left Side - Title and Contact */}
            <div className="lg:sticky lg:top-24">
              <div className="inline-block px-4 py-2 bg-red-100 dark:bg-red-900/30 rounded-full mb-6">
                <span className="text-red-600 dark:text-red-400 text-sm font-semibold tracking-wide">// FREQUENTLY ASKED QUESTIONS</span>
              </div>
              
              <h2 className="text-4xl md:text-5xl font-bold mb-8 leading-tight">
                Answers To Regular{" "}
                <span className="bg-gradient-to-r from-red-600 to-blue-600 bg-clip-text text-transparent">
                  Customer
                </span>{" "}
                Questions
              </h2>

              {/* Emergency Contact Card */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-red-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Phone className="text-white" size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      We always take care of your smile
                    </p>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      24/7 Emergency
                    </h3>
                    <a 
                      href="tel:+0123456789" 
                      className="text-2xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent hover:from-red-700 hover:to-pink-700 transition-all"
                    >
                      +0123456789
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - FAQ Accordion */}
            <div>
              <Accordion type="single" collapsible defaultValue="item-1" className="space-y-4">
                <AccordionItem 
                  value="item-1" 
                  className="bg-gradient-to-r from-red-500 to-blue-600 rounded-2xl overflow-hidden border-none shadow-lg"
                >
                  <AccordionTrigger className="px-6 py-5 text-white hover:no-underline text-left font-semibold text-lg">
                    01. How Many Days Can CCTV Cameras Record?
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-5 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                    Recording time depends on storage capacity, resolution, and number of cameras. Typically, systems store footage for 15-30 days.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem 
                  value="item-2" 
                  className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg transition-shadow"
                >
                  <AccordionTrigger className="px-6 py-5 text-gray-800 dark:text-white hover:no-underline text-left font-semibold text-lg">
                    02. Can CCTV Cameras Record At Night?
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-5 text-gray-600 dark:text-gray-300">
                    Yes, most modern CCTV cameras come equipped with infrared (IR) night vision technology, allowing them to record clear footage even in complete darkness, typically up to 20-30 meters.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem 
                  value="item-3" 
                  className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg transition-shadow"
                >
                  <AccordionTrigger className="px-6 py-5 text-gray-800 dark:text-white hover:no-underline text-left font-semibold text-lg">
                    03. Do CCTV Cameras Work Without Internet?
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-5 text-gray-600 dark:text-gray-300">
                    Yes, CCTV cameras can work without internet. They record footage locally to a DVR/NVR. However, internet is required for remote viewing and mobile app access.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem 
                  value="item-4" 
                  className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg transition-shadow"
                >
                  <AccordionTrigger className="px-6 py-5 text-gray-800 dark:text-white hover:no-underline text-left font-semibold text-lg">
                    04. Do CCTV Cameras Record Audio?
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-5 text-gray-600 dark:text-gray-300">
                    Some CCTV cameras have built-in microphones and can record audio. However, this feature must be specifically selected and may be subject to legal restrictions depending on your location.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem 
                  value="item-5" 
                  className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg transition-shadow"
                >
                  <AccordionTrigger className="px-6 py-5 text-gray-800 dark:text-white hover:no-underline text-left font-semibold text-lg">
                    05. Can CCTV Cameras Work Without Power?
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-5 text-gray-600 dark:text-gray-300">
                    No, CCTV cameras require power to operate. However, you can use battery backup systems (UPS) or solar-powered solutions to ensure continuous operation during power outages.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
