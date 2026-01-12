
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Counter } from "@/components/ui/counter"
import { Target, Eye, Shield, Zap, TrendingUp, Award, CheckCircle } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "About Us - Innovative IT Solutions Company",
  description: "Learn about Cygnatrix IT Solutions - a leading technology company delivering innovative web development, mobile apps, and cloud solutions with 500+ projects completed worldwide.",
  keywords: ["about Cygnatrix", "IT company", "technology solutions", "software development company", "digital transformation experts"],
  openGraph: {
    title: "About Cygnatrix IT Solutions",
    description: "Leading IT solutions provider with 500+ successful projects, 10+ years experience, and 200+ satisfied clients worldwide.",
    url: "https://yourdomain.com/about",
    type: "website",
  },
  alternates: {
    canonical: "https://yourdomain.com/about",
  },
}

export default function AboutPage() {
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

  return (
    <>
      <Navbar />

      {/* Hero Section with Video Background */}
      <section className="relative h-[70vh] min-h-[500px] flex items-center justify-center overflow-hidden rounded-b-[80px] md:rounded-b-[120px]">
        {/* Video Background */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/aboth.mp4" type="video/mp4" />
          {/* Fallback background if video doesn't load */}
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
              About <span className="gradient-text">Us</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 leading-relaxed max-w-3xl mx-auto drop-shadow-lg">
              A team of passionate developers, analysts, and designers with the vision to transform your business
              through cutting-edge technology.
            </p>
          </div>
        </div>
      </section>

      {/* Our Story & Vision Section */}
      <section className="py-24 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          {/* Our Story */}
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-7xl mx-auto mb-24">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-blue-600 dark:text-blue-400">Our Story</h2>
              <div className="space-y-4 text-gray-700 dark:text-gray-300 leading-relaxed">
                <p>
                  Cygnatrix was born from a simple yet powerful vision — to deliver reliable, innovative, and affordable IT solutions that truly make a difference.

Our journey began in 2023 with just three passionate minds, big dreams, and limited resources. In the early days, we took on projects at very low costs, not for profit alone, but to build trust, experience, and long-term relationships. Every project taught us something new, every challenge made us stronger.

Step by step, project by project, we grew.
From handling small assignments to confidently delivering large-scale projects, our evolution has been steady and intentional. What never changed was our commitment to quality, transparency, and client satisfaction.

Today, Cygnatrix stands as a growing IT solutions company powered by a team of 8 skilled professionals, each sharing the same dedication and purpose. We believe growth is not about numbers alone — it’s about impact, integrity, and innovation.

This is just the beginning of our story.
With every line of code, every solution delivered, and every client partnership, we continue to move forward — building technology that supports dreams and drives success. 🚀
                  </p>
                <p>
                  As a company we have years of experience in custom software and web development as well as design and consulting. Across our diverse team, we have an extensive repository of knowledge and experience, meaning we can deliver the right talent and solutions to our clients efficiently with value-oriented pricing.
                </p>
                <p className="font-semibold text-blue-600 dark:text-blue-400">
                  Travel with us on our journey.
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80"
                  alt="Cygnatrix team members"
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>

          {/* Our Vision */}
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
            <div className="order-2 md:order-1 relative">
              <div className="rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=800&q=80"
                  alt="Business leader presenting"
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-blue-600 dark:text-blue-400">Our Vision</h2>
              <div className="space-y-4 text-gray-700 dark:text-gray-300 leading-relaxed">
                <p className="italic text-lg">
                  "Our vision is to be the premier software development company, known for delivering innovative and high-quality solutions that exceed our clients' expectations and help them achieve their business goals.
                </p>
                <p>
                  We strive to create an environment where our team can thrive, grow, and continuously learn, and to be a trusted partner for businesses looking to transform their operations through technology. We aim to make a positive impact on the world by using our skills and expertise to build solutions that solve real problems and make people's lives better."
                </p>
                <p className="text-gray-500 dark:text-gray-500 italic text-sm">
                  — Srikrishna Mandal
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-24 bg-gradient-to-b from-white via-blue-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwMDAwMDAiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PHBhdGggZD0iTTM2IDE0YzMuMzEgMCA2LTIuNjkgNi02cy0yLjY5LTYtNi02LTYgMi42OS02IDYgMi42OSA2IDYgNiIvPjwvZz48L2c+PC9zdmc+')] opacity-40"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-5 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">Core Values</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
              The fundamental principles that guide our approach and define our culture
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {values.map((value, index) => {
              const Icon = value.icon
              const gradients = [
                'from-yellow-400 to-orange-500',
                'from-green-400 to-cyan-500',
                'from-pink-400 to-purple-500',
                'from-blue-400 to-indigo-500'
              ]
              return (
                <Card
                  key={index}
                  className="text-center border-none bg-white dark:bg-gray-800 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 group overflow-hidden relative"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${gradients[index]} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
                  <CardContent className="p-8 relative">
                    <div className={`w-20 h-20 bg-gradient-to-br ${gradients[index]} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                      <Icon className="text-white" size={36} />
                    </div>
                    <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">{value.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{value.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Our Commitments Section */}
      <section className="py-24 bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-5 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Our Commitments</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Promises we make to every client to ensure exceptional service and lasting partnerships
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {commitments.map((commitment, index) => {
              const Icon = commitment.icon
              return (
                <Card
                  key={index}
                  className="border-none bg-white dark:bg-gray-800 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 group overflow-hidden relative"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${commitment.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
                  <CardContent className="p-8 relative">
                    <div className={`w-16 h-16 bg-gradient-to-br ${commitment.gradient} rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                      <Icon className="text-white" size={28} />
                    </div>
                    <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">{commitment.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{commitment.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* We Believe In Section */}
      <section className="py-24 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-blue-700 dark:text-blue-400 mb-4">We believe in</h2>
          </div>
          <div className="max-w-6xl mx-auto bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-3xl p-8 md:p-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Your Success */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <TrendingUp className="text-blue-500" size={28} />
                  <h3 className="text-xl font-bold text-blue-700 dark:text-blue-400">Your Success</h3>
                </div>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  We don't just deliver projects, we bring effective solutions and value to help your business grow.
                </p>
              </div>

              {/* Talent Cultivation */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Target className="text-blue-500" size={28} />
                  <h3 className="text-xl font-bold text-blue-700 dark:text-blue-400">Talent Cultivation</h3>
                </div>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  We believe personal growth is crucial and we help our employees achieve that in various ways.
                </p>
              </div>

              {/* Glass Box Approach */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Shield className="text-blue-500" size={28} />
                  <h3 className="text-xl font-bold text-blue-700 dark:text-blue-400">Glass Box Approach</h3>
                </div>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  We operate in a way that is open and transparent, putting integrity and honesty first above all else.
                </p>
              </div>

              {/* Equal Opportunity */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Award className="text-blue-500" size={28} />
                  <h3 className="text-xl font-bold text-blue-700 dark:text-blue-400">Equal Opportunity</h3>
                </div>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  Everyone has equal opportunities regardless of their gender, age, disability, orientation or nationality.
                </p>
              </div>

              {/* Continuous Innovation */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Zap className="text-blue-500" size={28} />
                  <h3 className="text-xl font-bold text-blue-700 dark:text-blue-400">Continuous Innovation</h3>
                </div>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  We stay up-to-date with emerging technologies to ensure clients get the best possible solutions.
                </p>
              </div>

              {/* Celebration & Fun */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle className="text-blue-500" size={28} />
                  <h3 className="text-xl font-bold text-blue-700 dark:text-blue-400">Celebration & Fun</h3>
                </div>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  It's not all about work! We make it a priority to celebrate every special moment with our team.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What Keeps Us Going */}
      <section className="py-24 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-5 pb-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              What keeps us going
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {/* Team Building */}
            <Card className="border-none shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden">
              <CardContent className="p-0">
                <div className="relative h-64 overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80"
                    alt="Team building activities"
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                  />
                </div>
                <div className="p-6 text-center">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    Team-building brings us together and makes the dream work
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Cricket and Hiking */}
            <Card className="border-none shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden">
              <CardContent className="p-0">
                <div className="relative h-64 overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=800&q=80"
                    alt="Cricket or hiking activities"
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                  />
                </div>
                <div className="p-6 text-center">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    We love a good game of cricket or a hike to take in some fresh air
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Birthday Celebrations */}
            <Card className="border-none shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden">
              <CardContent className="p-0">
                <div className="relative h-64 overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=800&q=80"
                    alt="Birthday celebration with cake"
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                  />
                </div>
                <div className="p-6 text-center">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    At Cygnatrix, we celebrate <span className="italic font-semibold">almost</span> every occasion with cake
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Coffee and Chat */}
            <Card className="border-none shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden">
              <CardContent className="p-0">
                <div className="relative h-64 overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=800&q=80"
                    alt="Team coffee discussion"
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                  />
                </div>
                <div className="p-6 text-center">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    A good coffee and chat makes the world a better place
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Team Collaboration */}
            <Card className="border-none shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden lg:col-span-2">
              <CardContent className="p-0">
                <div className="relative h-64 overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80"
                    alt="Team collaboration and discussion"
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                  />
                </div>
                <div className="p-6 text-center">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    Team-building brings us together and makes the dream work
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Company Stats */}
      <section className="py-24 bg-gray-50 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3 text-gray-900">
              {"Our Track Record".split("").map((char, index) => (
                <span
                  key={index}
                  className="inline-block animate-bounce"
                  style={{
                    animationDelay: `${index * 0.05}s`,
                    animationDuration: '1s',
                    animationIterationCount: '1'
                  }}
                >
                  {char === " " ? "\u00A0" : char}
                </span>
              ))}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Numbers that demonstrate our commitment to excellence
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center max-w-6xl mx-auto">
            <div className="p-8 bg-white rounded-3xl border border-gray-200 hover:border-sky-500 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="text-5xl md:text-6xl font-bold mb-3 text-sky-500">
                <Counter to={500} suffix="+" />
              </div>
              <div className="text-lg text-gray-700 font-medium">Projects Delivered</div>
            </div>
            <div className="p-8 bg-white rounded-3xl border border-gray-200 hover:border-sky-500 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="text-5xl md:text-6xl font-bold mb-3 text-sky-500">
                <Counter to={250} suffix="+" />
              </div>
              <div className="text-lg text-gray-700 font-medium">Enterprise Clients</div>
            </div>
            <div className="p-8 bg-white rounded-3xl border border-gray-200 hover:border-sky-500 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="text-5xl md:text-6xl font-bold mb-3 text-sky-500">
                <Counter to={50} suffix="+" />
              </div>
              <div className="text-lg text-gray-700 font-medium">Expert Team Members</div>
            </div>
            <div className="p-8 bg-white rounded-3xl border border-gray-200 hover:border-sky-500 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="text-5xl md:text-6xl font-bold mb-3 text-sky-500">
                <Counter to={15} suffix="+" />
              </div>
              <div className="text-lg text-gray-700 font-medium">Years of Excellence</div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
