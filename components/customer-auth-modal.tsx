"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, X, UserCircle, Mail, Lock, Phone, User, MapPin, Eye, EyeOff } from "lucide-react"

interface CustomerAuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CustomerAuthModal({ isOpen, onClose }: CustomerAuthModalProps) {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  
  // Password visibility state
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  // OTP state
  const [otpSent, setOtpSent] = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)
  const [otp, setOtp] = useState("")
  const [sendingOTP, setSendingOTP] = useState(false)
  const [verifyingOTP, setVerifyingOTP] = useState(false)
  const [countdown, setCountdown] = useState(0)

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    address: "",
    pincode: ""
  })

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  // Send OTP
  const handleSendOTP = async () => {
    if (!formData.email) {
      setError("Please enter email address first")
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address")
      return
    }

    setSendingOTP(true)
    setError("")
    setMessage("")

    try {
      const response = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      })

      const result = await response.json()

      if (response.ok) {
        setOtpSent(true)
        setCountdown(60) // 60 seconds cooldown
        
        // Show dev OTP in message if in dev mode
        if (result.devMode && result.devOtp) {
          setMessage(`🧪 DEV MODE: Your OTP is ${result.devOtp}`)
        } else {
          setMessage(`OTP sent to ${formData.email}. Check your email inbox.`)
        }
      } else {
        setError(result.error || "Failed to send OTP")
      }
    } catch (err) {
      console.error('OTP send error:', err)
      setError("Failed to send OTP. Please check your connection and try again.")
    } finally {
      setSendingOTP(false)
    }
  }

  // Verify OTP
  const handleVerifyOTP = async () => {
    if (!otp) {
      setError("Please enter OTP")
      return
    }

    if (!/^[0-9]{6}$/.test(otp)) {
      setError("OTP must be 6 digits")
      return
    }

    setVerifyingOTP(true)
    setError("")
    setMessage("")

    try {
      const response = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, otp })
      })

      const result = await response.json()

      if (response.ok) {
        setOtpVerified(true)
        setMessage("✅ Email verified! Complete your registration below.")
        setError("")
      } else {
        setError(result.error || "Invalid OTP")
        setOtp("") // Clear OTP field on error
      }
    } catch (err) {
      console.error('OTP verify error:', err)
      setError("Failed to verify OTP. Please try again.")
      setOtp("")
    } finally {
      setVerifyingOTP(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setMessage("")
    setIsLoading(true)

    // For registration, check OTP verification first
    if (!isLogin && !otpVerified) {
      setError("Please verify your email address first")
      setIsLoading(false)
      return
    }

    // Validation
    if (!isLogin && formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (!isLogin && formData.password.length < 6) {
      setError("Password must be at least 6 characters")
      setIsLoading(false)
      return
    }

    try {
      const endpoint = isLogin ? '/api/auth/customer/login' : '/api/auth/customer/register'
      
      console.log('Sending registration data:', {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        pincode: formData.pincode
      })
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const result = await response.json()
      
      console.log('Registration response:', {
        status: response.status,
        ok: response.ok,
        result
      })

      if (response.ok) {
        if (isLogin) {
          // Store customer session
          localStorage.setItem('customerToken', result.token)
          localStorage.setItem('customerName', result.customer.full_name)
          localStorage.setItem('customerEmail', result.customer.email)
          
          setMessage("Login successful! Welcome back!")
          
          // Check if there's a redirect URL
          const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
          
          // Close modal and redirect
          setTimeout(() => {
            onClose()
            if (redirectUrl) {
              sessionStorage.removeItem('redirectAfterLogin');
              window.location.href = redirectUrl;
            } else {
              window.location.href = "/";
            }
          }, 1000)
        } else {
          setMessage("Registration successful! You can now login.")
          
          // Switch to login after 2 seconds
          setTimeout(() => {
            setIsLogin(true)
            setFormData({
              fullName: "",
              email: formData.email,
              phone: "",
              password: "",
              confirmPassword: "",
              address: "",
              pincode: ""
            })
            setMessage("")
          }, 2000)
        }
      } else {
        const errorMsg = result.error || result.message || "Something went wrong"
        console.error('Registration failed:', errorMsg, result.details)
        setError(errorMsg + (result.details ? ` (${result.details})` : ''))
      }
    } catch (err: any) {
      console.error("Registration error:", err)
      setError("Connection error: " + (err.message || "Please try again."))
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      fullName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      address: "",
      pincode: ""
    })
    setError("")
    setMessage("")
    setOtpSent(false)
    setOtpVerified(false)
    setOtp("")
    setCountdown(0)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose} modal={true}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-[#e63946]/30 text-white z-[100]">
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground z-10"
        >
          <X className="h-4 w-4 text-white" />
          <span className="sr-only">Close</span>
        </button>

        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold text-white flex items-center justify-center gap-2">
            <UserCircle className="w-6 h-6 text-[#e63946]" />
            {isLogin ? "Customer Login" : "Create Account"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {isLogin ? "Login to your customer account" : "Create a new customer account"}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {error && (
            <div className="p-3 mb-4 bg-red-500/20 text-red-300 text-sm rounded-lg border border-red-500/30">
              {error}
            </div>
          )}
          
          {message && (
            <div className="p-3 mb-4 bg-green-500/20 text-green-300 text-sm rounded-lg border border-green-500/30">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Register Fields */}
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-gray-300">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    id="fullName"
                    placeholder="Enter your full name"
                    required
                    value={formData.fullName}
                    onChange={e => setFormData({...formData, fullName: e.target.value})}
                    className="bg-slate-700/50 border-slate-600 pl-10 text-white placeholder:text-gray-500 focus:border-[#e63946]"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">
                Email Address {!isLogin && otpVerified && <span className="text-green-400">✓ Verified</span>}
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    required
                    value={formData.email}
                    onChange={e => {
                      setFormData({...formData, email: e.target.value})
                      // Reset OTP state if email changes during registration
                      if (!isLogin && otpSent && e.target.value !== formData.email) {
                        setOtpSent(false)
                        setOtpVerified(false)
                        setOtp("")
                      }
                    }}
                    disabled={!isLogin && otpVerified}
                    className="bg-slate-700/50 border-slate-600 pl-10 text-white placeholder:text-gray-500 focus:border-[#e63946]"
                  />
                </div>
                {!isLogin && !otpVerified && (
                  <Button
                    type="button"
                    onClick={handleSendOTP}
                    disabled={sendingOTP || countdown > 0 || !formData.email}
                    className="bg-[#e63946] hover:bg-red-700 text-white whitespace-nowrap"
                  >
                    {sendingOTP ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : countdown > 0 ? (
                      `Wait ${countdown}s`
                    ) : otpSent ? (
                      'Resend OTP'
                    ) : (
                      'Send OTP'
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* OTP Input for Email Verification - Register Only */}
            {!isLogin && otpSent && !otpVerified && (
              <div className="space-y-2">
                <Label htmlFor="otp" className="text-gray-300">Enter Verification Code</Label>
                <div className="flex gap-2">
                  <Input
                    id="otp"
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-gray-500 focus:border-[#e63946] text-center text-lg tracking-widest"
                  />
                  <Button
                    type="button"
                    onClick={handleVerifyOTP}
                    disabled={verifyingOTP || otp.length !== 6}
                    className="bg-green-600 hover:bg-green-700 text-white"
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
                <p className="text-xs text-gray-400">
                  Check your email inbox for the verification code
                </p>
              </div>
            )}

            {/* Phone - Register Only (optional contact info) */}
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-gray-300">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter 10-digit phone"
                    required
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="bg-slate-700/50 border-slate-600 pl-10 text-white placeholder:text-gray-500 focus:border-[#e63946]"
                  />
                </div>
              </div>
            )}

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  required
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  className="bg-slate-700/50 border-slate-600 pl-10 pr-10 text-white placeholder:text-gray-500 focus:border-[#e63946]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password - Register Only */}
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-300">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    required
                    value={formData.confirmPassword}
                    onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                    className="bg-slate-700/50 border-slate-600 pl-10 pr-10 text-white placeholder:text-gray-500 focus:border-[#e63946]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Optional Fields - Register Only */}
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-gray-300">Address (Optional)</Label>
                  <Input
                    id="address"
                    placeholder="Enter your address"
                    value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-gray-500 focus:border-[#e63946]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pincode" className="text-gray-300">Pincode (Optional)</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                      id="pincode"
                      placeholder="Enter your pincode"
                      value={formData.pincode}
                      onChange={e => setFormData({...formData, pincode: e.target.value})}
                      className="bg-slate-700/50 border-slate-600 pl-10 text-white placeholder:text-gray-500 focus:border-[#e63946]"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading || (!isLogin && !otpVerified)}
              className="w-full bg-[#e63946] hover:bg-red-700 text-white font-semibold py-6 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {isLogin ? "Logging in..." : "Creating account..."}
                </>
              ) : (
                isLogin ? "Login" : (otpVerified ? "Create Account" : "Verify Phone First")
              )}
            </Button>
          </form>

          {/* Toggle Login/Register */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin)
                resetForm()
              }}
              className="text-sm text-gray-400 hover:text-[#e63946] transition-colors"
            >
              {isLogin ? (
                <>Don't have an account? <span className="font-semibold">Create one</span></>
              ) : (
                <>Already have an account? <span className="font-semibold">Login</span></>
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="mt-6 pt-4 border-t border-slate-700">
            <p className="text-xs text-center text-gray-500">
              Are you a dealer or admin?{" "}
              <a href="/login" className="text-[#e63946] hover:underline">
                Click here to login
              </a>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
