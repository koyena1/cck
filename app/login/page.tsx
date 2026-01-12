'use client'
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation" // Added for redirection
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Mail, Lock, User, Phone, Eye, EyeOff, CheckCircle, Loader2 } from "lucide-react"
import { motion } from "framer-motion"

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  // Login Form State
  const [loginData, setLoginData] = useState({ email: "", password: "" })

  // Register Form State
  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: ""
  })

  // Handle Login Submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
      })

      const result = await response.json()

      if (response.ok) {
        // Redirect to the Admin Dashboard upon success
        router.push('/admin/dashboard')
      } else {
        setError(result.message || "Invalid login credentials")
      }
    } catch (err) {
      setError("Failed to connect to the server")
    } finally {
      setIsLoading(false)
    }
  }

  // Handle Register Submission
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (registerData.password !== registerData.confirmPassword) {
      setError("Passwords do not match")
      return
    }
    
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData),
      })

      if (response.ok) {
        alert("Account created successfully! Please login.")
        // Optionally switch tabs to login here
      } else {
        const result = await response.json()
        setError(result.message || "Registration failed")
      }
    } catch (err) {
      setError("Failed to connect to the server")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative h-[40vh] min-h-[300px] flex items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-5"></div>
        <div className="container relative mx-auto px-4 text-center">
          <motion.h1 
            className="text-5xl md:text-6xl font-bold text-white mb-4 font-orbitron"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Welcome
          </motion.h1>
          <motion.p className="text-xl text-gray-300 font-poppins">Secure login for Customers and Administrators</motion.p>
        </div>
      </section>

      {/* Auth Forms Section */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900">
        <div className="container mx-auto px-4">
          <motion.div className="max-w-md mx-auto">
            {error && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-md font-poppins text-center">
                {error}
              </div>
            )}

            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="login" className="font-poppins">Login</TabsTrigger>
                <TabsTrigger value="register" className="font-poppins">Register</TabsTrigger>
              </TabsList>

              {/* Login Form */}
              <TabsContent value="login">
                <Card className="border-none shadow-2xl">
                  <CardHeader>
                    <CardTitle className="font-orbitron text-center">Sign In</CardTitle>
                    <CardDescription className="text-center font-poppins text-xs">
                      Access your dashboard to manage CCTV installations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                          <Input
                            id="login-email"
                            type="email"
                            required
                            value={loginData.email}
                            onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                            className="pl-10 font-poppins"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="login-password">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                          <Input
                            id="login-password"
                            type={showPassword ? "text" : "password"}
                            required
                            value={loginData.password}
                            onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                            className="pl-10 pr-10 font-poppins"
                          />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>

                      <Button disabled={isLoading} className="w-full font-orbitron bg-blue-600 hover:bg-blue-700">
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "LOGIN"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Register Form */}
              <TabsContent value="register">
                <Card className="border-none shadow-2xl">
                  <CardHeader>
                    <CardTitle className="font-orbitron text-center">New Account</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleRegister} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Full Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                          <Input 
                            required 
                            className="pl-10" 
                            value={registerData.name}
                            onChange={(e) => setRegisterData({...registerData, name: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input 
                          type="email" 
                          required 
                          value={registerData.email}
                          onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Phone</Label>
                        <Input 
                          type="tel" 
                          required 
                          value={registerData.phone}
                          onChange={(e) => setRegisterData({...registerData, phone: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Password</Label>
                        <Input 
                          type="password" 
                          required 
                          value={registerData.password}
                          onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Confirm Password</Label>
                        <Input 
                          type="password" 
                          required 
                          value={registerData.confirmPassword}
                          onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                        />
                      </div>
                      <Button disabled={isLoading} className="w-full font-orbitron bg-purple-600 hover:bg-purple-700">
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "CREATE ACCOUNT"}
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