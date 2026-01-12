"use client"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"

// Note: Metadata export is not available in client components
// Consider moving metadata to a separate page.tsx if needed

export default function PortfolioPage() {
  const [filter, setFilter] = useState("all")

  // To make filtering work, the 'category' here must match the 'value' in the categories array below.
  const projects = [
     {
      title: "Portfolio Performance",
      category: "trading",
      description: "Landing site for upcoming digital platform.",
      image: "/zupeon.png",
      link: "https://zupeon.com/",
      tags: ["React", "Node.js", "Express.js", "PostgreSQL" ],
    },
    {
      title: "MSME Business Solutions",
      category: "msme",
      description: "Digital solutions and consulting services for MSME growth.",
      image: "/periti.png",
      link: "https://www.perititechnica.in/periti_technica/index.php",
      tags: ["Html", "Css", "Javascript", "Php", "PostgreSQL"],
    },
    {
      title: "Financial Dashboard",
      category: "financial",
      description: "Personalized insurance, investment, and loan solutions to secure your financial future.",
      image: "/Paysure.png",
      link: "https://mypaysure.in/paysure-insurance/index.php",
      tags: ["Html", "Css", "Javascript", "Php", "PostgreSQL"],
    },
    {
      title: "Clinical Psychology Services",
      category: "health",
      description: "Compassionate online therapy for anxiety, relationships, trauma & stress.",
      image: "/healthcare.png",
      link: "https://thecompassionatespace.com/clinicalpsychologist/index.php",
      tags: ["Html", "Css", "Javascript", "Php", "Mysql"],
    },
    {
      title: "Coaching Institute",
      category: "education",
      description: "Coaching platform for academic and competitive exam preparation.",
      image: "/percentile.png",
      link: "https://100percentile.in/",
      tags: ["Html, Css", "Javascript", "Php", "Bootstrap" ],
    },
    {
      title: "Online Examination System",
      category: "education",
      description: "Undergraduate college offering arts & commerce programs in Nagaland.",
      image: "/mount.png",
      link: "https://mountolivecollege.org/index.php",
      tags: ["Html, Css", "Javascript", "Php", "Bootstrap"],
    },
    {
      title: "E-Commerce Platform",
      category: "ecommerce",
      description: "Online store for handmade crochet products.",
      image: "/crochet.png",
      link: "https://crochetondemand.in/",
      tags: ["Wordpress", "WooCommerce", "Razorpay"],
    },
  ]

  const categories = [
    { value: "all", label: "All Projects" },
    { value: "msme", label: "MSME" },
    { value: "health", label: "Medical" },
    { value: "trading", label: "Trading" },
    { value: "education", label: "Education" },
    { value: "ecommerce", label: "E-Commerce" },
    { value: "financial", label: "Financial" },
  ]

  // Filtering Logic
  const filteredProjects = filter === "all" 
    ? projects 
    : projects.filter((p) => p.category === filter)

  return (
    <>
      <Navbar />

      {/* Hero Section */}
      <section className="relative h-[60vh] min-h-[500px] flex items-center justify-center overflow-hidden rounded-b-[80px] md:rounded-b-[120px]">
        <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
          <source src="/portfol.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/40 via-background/60 to-pink-600/40 backdrop-blur-[2px]"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-white drop-shadow-2xl">
              Our <span className="text-yellow-300">Portfolio</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 leading-relaxed max-w-3xl mx-auto">
              Explore our successful projects and see how we've helped businesses transform digitally.
            </p>
          </div>
        </div>
      </section>

      {/* Filter Section */}
      <section className="py-12 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-4">
            {categories.map((category) => (
              <Button
                key={category.value}
                variant={filter === category.value ? "default" : "outline"}
                onClick={() => setFilter(category.value)}
                className={`rounded-full px-6 transition-all duration-300 ${
                  filter === category.value 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'hover:border-blue-500'
                }`}
              >
                {category.label}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Projects Grid */}
      <section className="py-24 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {filteredProjects.map((project, index) => {
              const gradients = ['from-blue-500 to-cyan-400', 'from-purple-500 to-pink-500', 'from-orange-500 to-red-500', 'from-green-500 to-emerald-500']
              const gradient = gradients[index % gradients.length]
              
              return (
                <Card key={index} className="group overflow-hidden border-none bg-white dark:bg-gray-900 shadow-xl rounded-[32px] transition-all duration-500 hover:-translate-y-2">
                  <div className="relative aspect-video overflow-hidden">
                    <img
                      src={project.image}
                      alt={project.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    
                    {/* Hover Overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-90 transition-all duration-500 flex items-center justify-center`}>
                      <Button asChild variant="secondary" size="lg" className="gap-2 shadow-2xl rounded-full">
                        <a href={project.link} target="_blank" rel="noopener noreferrer">
                          View Details <ExternalLink size={18} />
                        </a>
                      </Button>
                    </div>

                    {/* Category Badge - Dynamically finds the Label */}
                    <div className={`absolute top-5 right-5 px-5 py-1.5 bg-gradient-to-r ${gradient} text-white text-[12px] font-extrabold rounded-full uppercase tracking-widest`}>
                      {categories.find(c => c.value === project.category)?.label || project.category}
                    </div>
                  </div>

                  <CardContent className="p-8">
                    <h3 className="text-2xl font-bold mb-3">{project.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6 line-clamp-2">{project.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {project.tags.map((tag, tIndex) => (
                        <span key={tIndex} className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-xs font-semibold rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
          
          {/* Empty State */}
          {filteredProjects.length === 0 && (
            <div className="text-center py-20">
              <p className="text-xl text-gray-500">No projects found for this category.</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      {/* <section className="py-24 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white relative overflow-hidden">
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-balance drop-shadow-lg">
              Let's Build Your Next Project
            </h2>
            <p className="text-xl md:text-2xl mb-10 leading-relaxed text-white/95 drop-shadow">
              Ready to create something amazing? Contact us to discuss your project requirements.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button asChild size="lg" className="text-base px-10 h-14 bg-white text-blue-600 hover:bg-gray-100 shadow-2xl hover:scale-105 transition-all duration-300 font-semibold">
                <a href="/contact">Start Your Project <ExternalLink className="ml-2 w-5 h-5" /></a>
              </Button>
            </div>
          </div>
        </div>
      </section> */}

      <Footer />
    </>
  )
}