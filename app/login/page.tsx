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
import { Loader2 } from "lucide-react"

type Role = 'customer' | 'dealer' | 'admin'

export default function UnifiedAuthPage() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [role, setRole] = useState<Role>('customer')

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
      <div className="min-h-screen bg-slate-50 py-20 px-4">
        <Card className="max-w-xl mx-auto shadow-xl">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold">
              {isLogin ? "LOGIN ACCESS" : "JOIN THE NETWORK"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error && <div className="p-3 mb-4 bg-red-100 text-red-700 text-sm rounded">{error}</div>}
            {message && <div className="p-3 mb-4 bg-blue-100 text-blue-700 text-sm rounded">{message}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Common Fields */}
              {!isLogin && (
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
              )}
              
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>

              {!isLogin && (
                <>
                  {/* Role Selection */}
                  <div className="py-4 border-y">
                    <Label className="mb-3 block font-bold">Select Your Role:</Label>
                    <div className="flex gap-6">
                      {['customer', 'dealer', 'admin'].map((r) => (
                        <div key={r} className="flex items-center space-x-2">
                          <input 
                            type="radio" 
                            name="role" 
                            checked={role === r} 
                            onChange={() => setRole(r as Role)} 
                          />
                          <Label className="capitalize">{r}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Dynamic Fields */}
                  {(role === 'customer' || role === 'dealer') && (
                    <div className="space-y-2">
                      <Label>Phone Number</Label>
                      <Input required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                    </div>
                  )}

                  {role === 'dealer' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Business Name</Label>
                        <Input required value={formData.businessName} onChange={e => setFormData({...formData, businessName: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label>Business Location</Label>
                        <Input required value={formData.businessLocation} onChange={e => setFormData({...formData, businessLocation: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label>GST Number</Label>
                        <Input required value={formData.gstNumber} onChange={e => setFormData({...formData, gstNumber: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label>Registration Number</Label>
                        <Input required value={formData.registrationNumber} onChange={e => setFormData({...formData, registrationNumber: e.target.value})} />
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              </div>

              {!isLogin && (
                <div className="space-y-2">
                  <Label>Confirm Password</Label>
                  <Input type="password" required value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} />
                </div>
              )}

              <Button disabled={isLoading} className="w-full bg-blue-600">
                {isLoading ? <Loader2 className="animate-spin" /> : isLogin ? "LOGIN" : "CREATE ACCOUNT"}
              </Button>
            </form>

            <button 
              onClick={() => setIsLogin(!isLogin)} 
              className="w-full mt-6 text-sm text-blue-600 hover:underline"
            >
              {isLogin ? "Don't have an account? Register here" : "Already have an account? Login here"}
            </button>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </>
  )
}
