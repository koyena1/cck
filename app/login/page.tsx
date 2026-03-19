'use client'
import { Suspense, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Footer } from "@/components/footer"
import { Loader2, User, Lock, Eye, EyeOff, Shield } from "lucide-react"

type Role = 'dealer' | 'admin'

const AUTH_REQUEST_TIMEOUT_MS = 12000
const AUTH_MAX_RETRIES = 2

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function parseApiResponse(response: Response) {
  const contentType = response.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    return response.json()
  }

  const rawBody = await response.text()
  try {
    return JSON.parse(rawBody)
  } catch {
    return {
      success: false,
      message: rawBody?.trim() || 'Unexpected server response'
    }
  }
}

async function postWithRetry(endpoint: string, payload: Record<string, unknown>) {
  let lastError: unknown

  for (let attempt = 0; attempt <= AUTH_MAX_RETRIES; attempt += 1) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), AUTH_REQUEST_TIMEOUT_MS)

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
        cache: 'no-store'
      })

      clearTimeout(timeoutId)

      const result = await parseApiResponse(response)

      if (response.status >= 500 && attempt < AUTH_MAX_RETRIES) {
        await sleep(400 * (attempt + 1))
        continue
      }

      return { response, result }
    } catch (error) {
      clearTimeout(timeoutId)
      lastError = error

      const isAbort = error instanceof DOMException && error.name === 'AbortError'
      if (attempt < AUTH_MAX_RETRIES) {
        await sleep(400 * (attempt + 1))
        continue
      }

      if (isAbort) {
        throw new Error('Server took too long to respond. Please try again.')
      }

      throw error
    }
  }

  throw lastError
}

function UnifiedAuthPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = searchParams.get('returnTo')
  const requiredRole = searchParams.get('required')
  
  const [isLogin, setIsLogin] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [role, setRole] = useState<Role>('dealer')

  // Password visibility state
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // OTP states
  const [otpSent, setOtpSent] = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)
  const [otp, setOtp] = useState('')
  const [sendingOTP, setSendingOTP] = useState(false)
  const [verifyingOTP, setVerifyingOTP] = useState(false)
  const [countdown, setCountdown] = useState(0)

  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", businessName: "",
    businessLocation: "", gstNumber: "", registrationNumber: "",
    serviceablePincodes: "",
    password: "", confirmPassword: ""
  })

  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleSendOTP = async () => {
    if (!formData.email) {
      setError('Please enter your email address')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address')
      return
    }

    setSendingOTP(true)
    setError('')

    try {
      const response = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      })

      const result = await response.json()

      if (result.success) {
        setOtpSent(true)
        setCountdown(60)
        setMessage(`OTP sent to ${formData.email}. Check your email inbox.`)
        setTimeout(() => setMessage(''), 5000)
      } else {
        setError(result.error || 'Failed to send OTP')
      }
    } catch (error) {
      setError('Failed to send OTP. Please try again.')
    } finally {
      setSendingOTP(false)
    }
  }

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP')
      return
    }

    setVerifyingOTP(true)
    setError('')

    try {
      const response = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, otp }),
      })

      const result = await response.json()

      if (result.success) {
        setOtpVerified(true)
        setMessage('✅ Email verified successfully!')
        setTimeout(() => setMessage(''), 5000)
      } else {
        setError(result.error || 'Invalid OTP. Please try again.')
      }
    } catch (error) {
      setError('Failed to verify OTP. Please try again.')
    } finally {
      setVerifyingOTP(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(""); setMessage(""); setIsLoading(true)

    // Check OTP verification for registration
    if (!isLogin && !otpVerified) {
      setError('Please verify your email address first')
      setIsLoading(false)
      return
    }

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register'
    
    if (!isLogin && formData.password !== formData.confirmPassword) {
      setError("Passwords do not match"); setIsLoading(false); return
    }

    try {
      const { response, result } = await postWithRetry(endpoint, { ...formData, role })

      if (response.ok) {
        if (isLogin) {
          // Store authentication data in localStorage
          if (result.role === 'admin') {
            localStorage.setItem('userRole', 'admin');
            localStorage.setItem('userName', result.name || result.user?.name || 'Admin');
            localStorage.setItem('authToken', result.token || `admin_${Date.now()}`);
            
            // Redirect to returnTo URL or default dashboard
            if (returnTo) {
              router.push(decodeURIComponent(returnTo));
            } else {
              router.push('/admin/dashboard');
            }
          } else if (result.role === 'customer') {
            localStorage.setItem('userRole', 'customer');
            localStorage.setItem('userName', result.name || result.user?.name || 'Customer');
            localStorage.setItem('authToken', result.token || `customer_${Date.now()}`);
            
            // Redirect to returnTo URL or default dashboard
            if (returnTo) {
              router.push(decodeURIComponent(returnTo));
            } else {
              router.push('/customer/dashboard');
            }
          } else if (result.role === 'dealer') {
            // Store dealer-specific data
            localStorage.setItem('userRole', 'dealer');
            localStorage.setItem('userName', result.user?.name || 'Dealer');
            localStorage.setItem('dealerId', result.user?.id?.toString() || '');
            localStorage.setItem('authToken', result.token || `dealer_${result.user?.id}_${Date.now()}`);
            
            // Redirect to returnTo URL or default dashboard
            if (returnTo) {
              router.push(decodeURIComponent(returnTo));
            } else {
              router.push('/dealer/dashboard');
            }
          } else {
            router.push('/dealer/dashboard');
          }
        } else {
          if (role === 'dealer') {
            setMessage("Your dealer account will be activated after admin approval.");
          } else if (role === 'admin') {
            setMessage("Your admin registration has been submitted. The main admin must approve your request before you can log in.");
          } else {
            router.push('/customer/dashboard');
          }
        }
      } else {
        setError(result.message || "Action failed");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to connect to the server"
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 py-12 px-4 flex items-center justify-center">
        <div className="w-full max-w-md">
          <Card className="border-2 border-slate-300 dark:border-slate-700 shadow-lg bg-white dark:bg-slate-900">
            <CardContent className="p-8">
              {/* Icon and Title */}
              <div className="text-center mb-6">
                <div className="mx-auto w-16 h-16 bg-blue-500 dark:bg-blue-600 rounded-full flex items-center justify-center mb-4">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {isLogin ? "Dealer & Admin Portal" : "Register Account"}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  {isLogin ? "Please enter your credentials" : "Create your account"}
                </p>
              </div>

              {/* Auth Required Notice */}
              {returnTo && requiredRole && (
                <div className="p-3 mb-4 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-sm rounded-lg border border-amber-200 dark:border-amber-800">
                  <p className="font-semibold">Authentication Required</p>
                  <p className="text-xs mt-1">Please login as <span className="font-bold">{requiredRole}</span> to access this page.</p>
                </div>
              )}

              {error && <div className="p-3 mb-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-200 dark:border-red-800">{error}</div>}
              {message && <div className="p-3 mb-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-sm rounded-lg border border-blue-200 dark:border-blue-800">{message}</div>}

              <form onSubmit={handleSubmit} className="space-y-4">{/* Common Fields */}
              {!isLogin && (
                <div className="space-y-2">
                  <Label className="text-gray-700 dark:text-gray-300 text-sm font-medium">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <Input 
                      placeholder="Enter your full name"
                      required 
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})} 
                      className="pl-10 border-gray-300 dark:border-gray-600 dark:bg-slate-800 dark:text-white focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label className="text-gray-700 dark:text-gray-300 text-sm font-medium">
                  {isLogin ? "Email / Dealer ID" : "Email Address"} {!isLogin && otpVerified && <span className="text-green-600 dark:text-green-400">✓ Verified</span>}
                </Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <Input 
                      type={isLogin ? "text" : "email"}
                      placeholder={isLogin ? "Enter email or dealer ID (e.g. 101)" : "Enter your email"}
                      required 
                      value={formData.email} 
                      onChange={e => {
                        setFormData({...formData, email: e.target.value})
                        if (!isLogin && otpSent && e.target.value !== formData.email) {
                          setOtpSent(false)
                          setOtpVerified(false)
                          setOtp('')
                        }
                      }} 
                      disabled={!isLogin && otpVerified}
                      className="pl-10 border-gray-300 dark:border-gray-600 dark:bg-slate-800 dark:text-white focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  {!isLogin && !otpVerified && (
                    <Button
                      type="button"
                      onClick={handleSendOTP}
                      disabled={sendingOTP || countdown > 0 || !formData.email}
                      className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white"
                    >
                      {sendingOTP ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : countdown > 0 ? (
                        `Wait ${countdown}s`
                      ) : otpSent ? (
                        'Resend'
                      ) : (
                        'Send OTP'
                      )}
                    </Button>
                  )}
                </div>
                
                {/* OTP Input */}
                {!isLogin && otpSent && !otpVerified && (
                  <div className="space-y-2 mt-2">
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="Enter 6-digit OTP"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                        className="flex-1 border-gray-300 dark:border-gray-600 dark:bg-slate-800 dark:text-white text-center text-lg tracking-widest focus:border-green-500 focus:ring-green-500"
                      />
                      <Button
                        type="button"
                        onClick={handleVerifyOTP}
                        disabled={verifyingOTP || otp.length !== 6}
                        className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white"
                      >
                        {verifyingOTP ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          'Verify'
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 px-2">
                      Check your email inbox for the verification code
                    </p>
                  </div>
                )}
              </div>

              {!isLogin && (
                <>
                  {/* Role Selection */}
                  <div className="py-2">
                    <Label className="mb-2 block font-medium text-gray-700 dark:text-gray-300 text-sm">Select Your Role:</Label>
                    <div className="flex gap-6">
                      {['dealer', 'admin'].map((r) => (
                        <div key={r} className="flex items-center space-x-2">
                          <input 
                            type="radio" 
                            name="role" 
                            checked={role === r} 
                            onChange={() => setRole(r as Role)} 
                            className="w-4 h-4 text-blue-500 border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                          />
                          <Label className="capitalize text-gray-700 dark:text-gray-300 cursor-pointer">{r}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Dynamic Fields */}
                  {role === 'dealer' && (
                    <>
                      <div className="space-y-2">
                        <Label className="text-gray-700 dark:text-gray-300 text-sm font-medium">Phone Number</Label>
                        <Input 
                          placeholder="Enter phone number"
                          required 
                          value={formData.phone} 
                          onChange={e => setFormData({...formData, phone: e.target.value})} 
                          className="border-gray-300 dark:border-gray-600 dark:bg-slate-800 dark:text-white focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-gray-700 dark:text-gray-300 text-sm font-medium">Business Name</Label>
                          <Input 
                            placeholder="Enter business name"
                            required 
                            value={formData.businessName} 
                            onChange={e => setFormData({...formData, businessName: e.target.value})} 
                            className="border-gray-300 dark:border-gray-600 dark:bg-slate-800 dark:text-white focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-gray-700 dark:text-gray-300 text-sm font-medium">Business Location</Label>
                          <Input 
                            placeholder="Enter location"
                            required 
                            value={formData.businessLocation} 
                            onChange={e => setFormData({...formData, businessLocation: e.target.value})} 
                            className="border-gray-300 dark:border-gray-600 dark:bg-slate-800 dark:text-white focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-gray-700 dark:text-gray-300 text-sm font-medium">GST Number</Label>
                          <Input 
                            placeholder="Enter GST number"
                            required 
                            value={formData.gstNumber} 
                            onChange={e => setFormData({...formData, gstNumber: e.target.value})} 
                            className="border-gray-300 dark:border-gray-600 dark:bg-slate-800 dark:text-white focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-gray-700 dark:text-gray-300 text-sm font-medium">Registration Number</Label>
                          <Input 
                            placeholder="Enter registration number"
                            required 
                            value={formData.registrationNumber} 
                            onChange={e => setFormData({...formData, registrationNumber: e.target.value})} 
                            className="border-gray-300 dark:border-gray-600 dark:bg-slate-800 dark:text-white focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-gray-700 dark:text-gray-300 text-sm font-medium">Serviceable Pincodes</Label>
                        <Input 
                          placeholder="Serviceable Locations (Pincode) - e.g., 110001, 110002"
                          required 
                          value={formData.serviceablePincodes} 
                          onChange={e => setFormData({...formData, serviceablePincodes: e.target.value})} 
                          className="border-gray-300 dark:border-gray-600 dark:bg-slate-800 dark:text-white focus:border-blue-500 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 px-2">Enter pincodes separated by commas</p>
                      </div>
                    </>
                  )}
                </>
              )}

              <div className="space-y-2">
                <Label className="text-gray-700 dark:text-gray-300 text-sm font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 z-10" />
                  <Input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Enter your password"
                    required 
                    value={formData.password} 
                    onChange={e => setFormData({...formData, password: e.target.value})} 
                    className="pl-10 pr-12 border-gray-300 dark:border-gray-600 dark:bg-slate-800 dark:text-white focus:border-blue-500 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors z-10"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <div className="space-y-2">
                  <Label className="text-gray-700 dark:text-gray-300 text-sm font-medium">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 z-10" />
                    <Input 
                      type={showConfirmPassword ? "text" : "password"} 
                      placeholder="Confirm your password"
                      required 
                      value={formData.confirmPassword} 
                      onChange={e => setFormData({...formData, confirmPassword: e.target.value})} 
                      className="pl-10 pr-12 border-gray-300 dark:border-gray-600 dark:bg-slate-800 dark:text-white focus:border-blue-500 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors z-10"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              )}

              <Button 
                disabled={isLoading} 
                type="submit"
                className="w-full bg-gray-900 dark:bg-slate-700 hover:bg-gray-800 dark:hover:bg-slate-600 text-white py-6 font-semibold text-base transition-all"
              >
                {isLoading ? <Loader2 className="animate-spin" /> : isLogin ? "Login to Portal" : "Create Account"}
              </Button>
            </form>

            <div className="text-center mt-6">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isLogin ? "Access restricted to authorized personnel" : "All fields are required"}
              </p>
              <button 
                onClick={() => setIsLogin(!isLogin)} 
                className="mt-3 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-all font-medium"
              >
                {isLogin ? "Don't have an account? Register here" : "Already have an account? Login here"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
      <Footer />
    </>
  )
}

export default function UnifiedAuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 py-12 px-4 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-600 dark:text-slate-300" />
        </div>
      }
    >
      <UnifiedAuthPageContent />
    </Suspense>
  )
}
