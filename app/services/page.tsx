import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { Code, Smartphone, Palette, Cloud, Cpu, Settings, CheckCircle, ArrowRight } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Our Services - Web & Mobile Development Solutions",
  description: "Professional IT services: Web development, mobile apps, UI/UX design, cloud solutions, AI automation, and 24/7 maintenance. Custom solutions for startups and enterprises.",
  keywords: ["web development services", "mobile app development", "UI/UX design", "cloud solutions", "AI automation", "software maintenance", "IT consulting"],
  openGraph: {
    title: "IT Services - Cygnatrix Solutions",
    description: "Comprehensive IT services including web development, mobile apps, UI/UX design, cloud solutions, and AI automation.",
    url: "https://yourdomain.com/services",
    type: "website",
  },
  alternates: {
    canonical: "https://yourdomain.com/services",
  },
}

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
      <section className="relative h-[70vh] min-h-[500px] flex items-center justify-center overflow-hidden rounded-b-[80px] md:rounded-b-[120px]">
        {/* Video Background */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/serve.mp4" type="video/mp4" />
        </video>
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-background/60 to-accent/40 backdrop-blur-[2px]"></div>
        
        {/* Decorative Elements */}
        <div className="absolute top-10 right-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        
        {/* Content */}
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-balance leading-tight text-white drop-shadow-2xl">
              Solutions We <span className="gradient-text">Deliver</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 leading-relaxed drop-shadow-lg">
              Comprehensive technology services designed to accelerate your digital transformation and deliver
              measurable business results.
            </p>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-24 bg-gradient-to-b from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-5 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent pb-2">
              Our Services
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Empowering your business with cutting-edge technology solutions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {services.map((service, index) => {
              const Icon = service.icon
              const gradients = [
                'from-blue-500 to-cyan-500',
                'from-purple-500 to-pink-500',
                'from-orange-500 to-red-500',
                'from-green-500 to-emerald-500',
                'from-yellow-500 to-orange-500',
                'from-indigo-500 to-purple-500'
              ]
              const shadowColors = [
                'shadow-blue-500/20',
                'shadow-purple-500/20',
                'shadow-orange-500/20',
                'shadow-green-500/20',
                'shadow-yellow-500/20',
                'shadow-indigo-500/20'
              ]
              return (
                <Card
                  key={index}
                  className={`border-none bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl hover:shadow-2xl ${shadowColors[index]} transition-all duration-500 hover:-translate-y-3 group overflow-hidden`}
                >
                  <CardContent className="p-8">
                    <div className={`w-20 h-20 bg-gradient-to-br ${gradients[index]} rounded-2xl flex items-center justify-center mb-6 shadow-lg ${shadowColors[index]} group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                      <Icon className="text-white" size={36} />
                    </div>
                    <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text group-hover:from-blue-600 group-hover:to-purple-600 transition-all">
                      {service.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                      {service.description}
                    </p>
                    
                    <div className="mb-6">
                      <h4 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-4 uppercase tracking-wider">Key Capabilities</h4>
                      <ul className="space-y-3">
                        {service.features.map((feature, fIndex) => (
                          <li key={fIndex} className="flex items-start space-x-2 group/item">
                            <CheckCircle
                              className={`text-green-500 mt-0.5 flex-shrink-0 group-hover/item:scale-110 transition-transform`}
                              size={18}
                            />
                            <span className="text-sm text-gray-600 dark:text-gray-400 group-hover/item:text-gray-900 dark:group-hover/item:text-gray-200 transition-colors">
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Button asChild size="lg" className={`w-full bg-gradient-to-r ${gradients[index]} hover:opacity-90 shadow-lg ${shadowColors[index]} border-none text-white`}>
                      <Link href="/contact">
                        Get Started
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-blue-50 via-blue-100 to-cyan-100 dark:from-blue-950 dark:via-blue-900 dark:to-cyan-950 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full opacity-30">
            <div className="absolute top-10 left-10 w-72 h-72 bg-blue-200/40 dark:bg-blue-400/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-cyan-200/40 dark:bg-cyan-400/20 rounded-full blur-3xl"></div>
          </div>
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-balance text-gray-900 dark:text-white">
              Ready to Get Started?
            </h2>
            <p className="text-xl md:text-2xl mb-10 leading-relaxed text-gray-700 dark:text-gray-300">
              Let's start a conversation about how our solutions can help your business thrive in the digital age.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button asChild size="lg" className="text-base px-10 h-14 bg-blue-600 hover:bg-blue-700 text-white shadow-xl hover:shadow-blue-500/30 hover:scale-105 transition-all duration-300 font-semibold">
                <Link href="/contact">
                  Contact Us Today
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="text-base px-10 h-14 border-2 border-blue-600 bg-white hover:bg-blue-50 text-blue-600 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-blue-400 shadow-xl hover:scale-105 transition-all duration-300 font-semibold"
              >
                <Link href="/portfolio">View Our Work</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
