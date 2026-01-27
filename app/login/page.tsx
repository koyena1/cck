'use client'
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox" // Ensure you have this shadcn component
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Loader2, Facebook, Twitter } from "lucide-react"

type Role = 'dealer' | 'admin'

export default function UnifiedAuthPage() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [role, setRole] = useState<Role>('dealer')

  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", businessName: "",
    businessLocation: "", gstNumber: "", registrationNumber: "",
    password: "", confirmPassword: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(""); setMessage(""); setIsLoading(true)

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register'
    
    if (!isLogin && formData.password !== formData.confirmPassword) {
      setError("Passwords do not match"); setIsLoading(false); return
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, role }),
      })
      const result = await response.json()

      if (response.ok) {
        if (isLogin) {
          if (result.role === 'admin') router.push('/admin/dashboard')
          else if (result.role === 'customer') router.push('/customer/dashboard')
          else router.push('/dealer/dashboard')
        } else {
          if (role === 'dealer') {
            setMessage("Your account will be activated after admin approval.")
          } else {
            router.push(role === 'admin' ? '/admin/dashboard' : '/customer/dashboard')
          }
        }
      } else {
        setError(result.message || "Action failed")
      }
    } catch (err) {
      setError("Connection error")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 py-12 px-4 flex items-center justify-center">
        <div className="w-full max-w-4xl grid md:grid-cols-[1.5fr,3fr,1.5fr] gap-0 rounded-2xl overflow-hidden shadow-2xl">
          {/* Left gradient panel */}
          <div className="bg-gradient-to-br from-red-400/40 to-transparent backdrop-blur-sm hidden md:block"></div>
          
          {/* Center panel with form */}
          <div className="bg-gray-900 p-8">
            <div className="text-center mb-5">
              <h1 className="text-3xl font-bold text-white mb-1.5 tracking-wide">
                {isLogin ? "LOGIN" : "REGISTER"}
              </h1>
              <p className="text-gray-400 text-xs">
                {isLogin ? "Please enter your login and password!" : "Create your account"}
              </p>
            </div>

            {error && <div className="p-3 mb-4 bg-red-500/20 text-red-300 text-sm rounded-lg border border-red-500/30">{error}</div>}
            {message && <div className="p-3 mb-4 bg-blue-500/20 text-blue-300 text-sm rounded-lg border border-blue-500/30">{message}</div>}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Common Fields */}
              {!isLogin && (
                <div className="space-y-2">
                  <Input 
                    placeholder="Full Name"
                    required 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    className="bg-transparent border-2 border-blue-400/50 rounded-full px-5 py-3 text-white placeholder:text-gray-500 focus:border-blue-400 focus:ring-0"
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Input 
                  type="email" 
                  placeholder={isLogin ? "Username" : "Email Address"}
                  required 
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})} 
                  className="bg-transparent border-2 border-blue-400/50 rounded-full px-5 py-3 text-white placeholder:text-gray-500 focus:border-blue-400 focus:ring-0"
                />
              </div>

              {!isLogin && (
                <>
                  {/* Role Selection */}
                  <div className="py-2">
                    <Label className="mb-2 block font-medium text-gray-300 text-xs">Select Your Role:</Label>
                    <div className="flex gap-6">
                      {['dealer', 'admin'].map((r) => (
                        <div key={r} className="flex items-center space-x-2">
                          <input 
                            type="radio" 
                            name="role" 
                            checked={role === r} 
                            onChange={() => setRole(r as Role)} 
                            className="w-4 h-4 text-blue-500"
                          />
                          <Label className="capitalize text-gray-300 cursor-pointer">{r}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Dynamic Fields */}
                  {role === 'dealer' && (
                    <>
                      <div className="space-y-2">
                        <Input 
                          placeholder="Phone Number"
                          required 
                          value={formData.phone} 
                          onChange={e => setFormData({...formData, phone: e.target.value})} 
                          className="bg-transparent border-2 border-blue-400/50 rounded-full px-5 py-3 text-white placeholder:text-gray-500 focus:border-blue-400 focus:ring-0"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input 
                          placeholder="Business Name"
                          required 
                          value={formData.businessName} 
                          onChange={e => setFormData({...formData, businessName: e.target.value})} 
                          className="bg-transparent border-2 border-blue-400/50 rounded-full px-6 py-3 text-white placeholder:text-gray-500 focus:border-blue-400 focus:ring-0"
                        />
                        <Input 
                          placeholder="Business Location"
                          required 
                          value={formData.businessLocation} 
                          onChange={e => setFormData({...formData, businessLocation: e.target.value})} 
                          className="bg-transparent border-2 border-blue-400/50 rounded-full px-6 py-3 text-white placeholder:text-gray-500 focus:border-blue-400 focus:ring-0"
                        />
                        <Input 
                          placeholder="GST Number"
                          required 
                          value={formData.gstNumber} 
                          onChange={e => setFormData({...formData, gstNumber: e.target.value})} 
                          className="bg-transparent border-2 border-blue-400/50 rounded-full px-6 py-3 text-white placeholder:text-gray-500 focus:border-blue-400 focus:ring-0"
                        />
                        <Input 
                          placeholder="Registration Number"
                          required 
                          value={formData.registrationNumber} 
                          onChange={e => setFormData({...formData, registrationNumber: e.target.value})} 
                          className="bg-transparent border-2 border-blue-400/50 rounded-full px-6 py-3 text-white placeholder:text-gray-500 focus:border-blue-400 focus:ring-0"
                        />
                      </div>
                    </>
                  )}
                </>
              )}

              <div className="space-y-2">
                <Input 
                  type="password" 
                  placeholder="Password"
                  required 
                  value={formData.password} 
                  onChange={e => setFormData({...formData, password: e.target.value})} 
                  className="bg-transparent border-2 border-blue-400/50 rounded-full px-5 py-3 text-white placeholder:text-gray-500 focus:border-blue-400 focus:ring-0"
                />
              </div>

              {!isLogin && (
                <div className="space-y-2">
                  <Input 
                    type="password" 
                    placeholder="Confirm Password"
                    required 
                    value={formData.confirmPassword} 
                    onChange={e => setFormData({...formData, confirmPassword: e.target.value})} 
                    className="bg-transparent border-2 border-blue-400/50 rounded-full px-5 py-3 text-white placeholder:text-gray-500 focus:border-blue-400 focus:ring-0"
                  />
                </div>
              )}

              {isLogin && (
                <div className="text-center">
                  <button type="button" className="text-gray-400 text-sm hover:text-gray-300 underline">
                    Forgot password?
                  </button>
                </div>
              )}

              <Button 
                disabled={isLoading} 
                className="w-full bg-transparent border-2 border-green-500 hover:bg-green-500/10 text-white rounded-full py-3 font-semibold text-sm transition-all"
              >
                {isLoading ? <Loader2 className="animate-spin" /> : isLogin ? "Login" : "Create Account"}
              </Button>
            </form>

            {isLogin && (
              <div className="flex justify-center gap-4 mt-5">
                <button className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all">
                  <Facebook className="w-5 h-5 text-white" />
                </button>
                <button className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all">
                  <Twitter className="w-5 h-5 text-white" />
                </button>
                <button className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                  </svg>
                </button>
              </div>
            )}

            <button 
              onClick={() => setIsLogin(!isLogin)} 
              className="w-full mt-4 text-xs text-gray-400 hover:text-white transition-all"
            >
              {isLogin ? "Don't have an account? Register here" : "Already have an account? Login here"}
            </button>
          </div>

          {/* Right gradient panel */}
          <div className="bg-gradient-to-bl from-blue-400/40 to-transparent backdrop-blur-sm hidden md:block"></div>
        </div>
      </div>
      <Footer />
    </>
  )
}
