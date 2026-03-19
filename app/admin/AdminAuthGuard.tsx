'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = () => {
      const authToken = localStorage.getItem('authToken')
      const userRole = localStorage.getItem('userRole')
      
      // Check if user is authenticated and has admin role
      if (!authToken || userRole !== 'admin') {
        console.warn('⚠ Unauthorized access attempt to admin portal:', pathname)
        // Redirect to login with return URL
        const returnUrl = encodeURIComponent(pathname || '/admin/dashboard')
        router.push(`/login?returnTo=${returnUrl}&required=admin`)
        return
      }
      
      console.log('✓ Admin authenticated:', pathname)
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

  return <>{children}</>
}
