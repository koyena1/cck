'use client'

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation" 
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { 
  Mail, 
  Lock, 
  User, 
  Phone, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  Building2, 
  FileText,
  Loader2,
  MapPin
} from "lucide-react"
import { motion } from "framer-motion"

export default function AuthPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Registration Form State (Matches Proposal Requirements)
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    phone: '',
    businessName: '',
    gstin: '',
    location: '', // From Proposal: "Location" field
    password: ''
  })

  // Login Form State
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  // Input change handlers
  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    const field = id.replace('register-', '')
    setRegisterData(prev => ({ ...prev, [field]: value }))
  }

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    const field = id.replace('login-', '')
    setLoginData(prev => ({ ...prev, [field]: value }))
  }

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const response = await fetch('/dealer/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
      })

      // Robust JSON parsing to prevent "Unexpected end of JSON" errors
      const text = await response.text()
      const result = text ? JSON.parse(text) : {}

      if (response.ok) {
        // Direct redirection to dealer dashboard upon success
        router.push('/dealer/dashboard')
      } else {
        alert(result.message || "Invalid credentials. Please try again.")
      }
    } catch (err) {
      console.error("Login Error:", err)
      alert("Server connection error. Please try again later.")
    } finally {
      setIsLoading(false)
    }
  }

  // Registration handler
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const response = await fetch('/dealer/register', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData),
      })

      const text = await response.text()
      const result = text ? JSON.parse(text) : {}

      if (response.ok) {
        // Redirect directly to dashboard as requested
        router.push('/dealer/dashboard')
      } else {
        alert(result.message || "Registration failed. Check if email is already used.")
      }
    } catch (err) {
      console.error("Auth Error:", err)
      alert("Failed to connect to registration service.")
    } finally {
      setIsLoading(false)
    }
  }

  if (!mounted) return null 

  return (
    <>
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative h-[40vh] min-h-75 flex items-center justify-center bg-linear-to-br from-slate-950 via-blue-950 to-slate-950 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-5"></div>
        <div className="container relative mx-auto px-4 text-center">
          <motion.h1 
            className="text-5xl md:text-6xl font-bold text-white mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Business Portal
          </motion.h1>
          <motion.p className="text-xl text-gray-300">
            Secure access for Monika Order & Suppliers partners
          </motion.p>
        </div>
      </section>

      {/* Auth Forms Section */}
      <section className="py-20 bg-linear-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4">
          <motion.div className="max-w-md mx-auto">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="login" className="text-base">Login</TabsTrigger>
                <TabsTrigger value="register" className="text-base">Register</TabsTrigger>
              </TabsList>

              {/* Login Form */}
              <TabsContent value="login">
                <Card className="border-none shadow-2xl">
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold text-center">Login</CardTitle>
                    <CardDescription className="text-center">
                      Access your dealer dashboard
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <Input 
                            id="login-email" 
                            type="email" 
                            required 
                            placeholder="example@email.com" 
                            className="pl-10 h-11"
                            value={loginData.email}
                            onChange={handleLoginChange}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="login-password">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <Input 
                            id="login-password" 
                            type={showPassword ? "text" : "password"} 
                            required 
                            placeholder="••••••••" 
                            className="pl-10 pr-10 h-11"
                            value={loginData.password}
                            onChange={handleLoginChange}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                          >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>
                      <Button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors"
                      >
                        {isLoading ? <Loader2 className="animate-spin" /> : "Login"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Register Form */}
              <TabsContent value="register">
                <Card className="border-none shadow-2xl">
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold text-center">Dealer Registration</CardTitle>
                    <CardDescription className="text-center">
                      Join our B2B network today
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleRegister} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="register-name">Full Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <Input id="register-name" required value={registerData.name} onChange={handleRegisterChange} className="pl-10 h-11" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="register-email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <Input id="register-email" type="email" required value={registerData.email} onChange={handleRegisterChange} className="pl-10 h-11" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="register-phone">Phone Number</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <Input id="register-phone" required value={registerData.phone} onChange={handleRegisterChange} className="pl-10 h-11" />
                        </div>
                      </div>

                      {/* Business details required by Proposal */}
                      <div className="space-y-2">
                        <Label htmlFor="register-businessName">Business Name</Label>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <Input id="register-businessName" required value={registerData.businessName} onChange={handleRegisterChange} className="pl-10 h-11" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="register-gstin">GSTIN / Registration No.</Label>
                        <div className="relative">
                          <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <Input id="register-gstin" required value={registerData.gstin} onChange={handleRegisterChange} className="pl-10 h-11" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="register-location">Business Location</Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <Input id="register-location" required value={registerData.location} onChange={handleRegisterChange} className="pl-10 h-11" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="register-password">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <Input
                            id="register-password"
                            type={showPassword ? "text" : "password"}
                            required
                            value={registerData.password}
                            onChange={handleRegisterChange}
                            className="pl-10 pr-10 h-11"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                          >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>

                      <Button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full h-11 bg-linear-to-r from-purple-600 to-pink-600 text-white font-semibold transition-all"
                      >
                        {isLoading ? <Loader2 className="animate-spin" /> : "Create Account"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </section>

      <Footer />
    </>
  )
}