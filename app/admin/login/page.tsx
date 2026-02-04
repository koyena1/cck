'use client'
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, ShieldCheck, Lock, Mail } from "lucide-react"

export default function AdminLoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, role: 'admin' }),
      })
      
      const result = await response.json()

      if (response.ok) {
        if (result.role === 'admin') {
          // Save authentication token
          localStorage.setItem('adminToken', result.token || 'admin-authenticated')
          localStorage.setItem('userRole', 'admin')
          localStorage.setItem('userName', result.name || 'Admin')
          
          router.push('/admin/dashboard')
        } else {
          setError('Access denied. Admin credentials required.')
        }
      } else {
        setError(result.error || 'Invalid credentials')
      }
    } catch (err) {
      setError('Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-800/90 backdrop-blur-sm border-2 border-blue-500/30 shadow-2xl">
        <CardHeader className="space-y-1 text-center pb-6">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-black text-white">
            Admin Portal
          </CardTitle>
          <CardDescription className="text-gray-400">
            Secure access for administrators only
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300 font-medium">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  required
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="bg-slate-700/50 border-2 border-slate-600 rounded-lg pl-10 py-3 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300 font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  required
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  className="bg-slate-700/50 border-2 border-slate-600 rounded-lg pl-10 py-3 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-0"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-6 rounded-lg text-lg transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Authenticating...
                </>
              ) : (
                'Sign In to Admin Portal'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-3">
            <button
              onClick={() => router.push('/admin/register')}
              className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
            >
              Don't have an admin account? Register →
            </button>
            <div>
              <button
                onClick={() => router.push('/login')}
                className="text-gray-500 hover:text-gray-400 text-sm font-medium transition-colors"
              >
                ← Back to Main Login
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Badge */}
      <div className="absolute bottom-4 right-4 text-gray-500 text-xs flex items-center gap-2">
        <Lock className="w-4 h-4" />
        <span>Secured Access</span>
      </div>
    </div>
  )
}
