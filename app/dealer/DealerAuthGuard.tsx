'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export function DealerAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = () => {
      const authToken = localStorage.getItem('authToken')
      const userRole = localStorage.getItem('userRole')
      const dealerId = localStorage.getItem('dealerId')
      
      // Check if user is authenticated and has dealer role
      if (!authToken || userRole !== 'dealer' || !dealerId) {
        console.warn('⚠ Unauthorized access attempt to dealer portal:', pathname)
        // Redirect to login with return URL
        const returnUrl = encodeURIComponent(pathname || '/dealer/dashboard')
        router.push(`/login?returnTo=${returnUrl}&required=dealer`)
        return
      }
      
      console.log('✓ Dealer authenticated:', pathname)
      setIsAuthenticated(true)
      setIsLoading(false)
    }

    checkAuth()
  }, [pathname, router])

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  // Only render children if authenticated
  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
