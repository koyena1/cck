'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Allow access to login and register pages without authentication
    if (pathname === '/admin/login' || pathname === '/admin/register') {
      console.log('✓ Public admin page, allowing access:', pathname)
      setIsAuthenticated(true)
      setIsLoading(false)
      return
    }

    // For all other admin routes, check authentication
    console.log('🔒 Checking authentication for:', pathname)
    const adminToken = localStorage.getItem('adminToken')
    const adminRole = localStorage.getItem('userRole')
    
    console.log('Token:', adminToken ? 'EXISTS' : 'NOT FOUND')
    console.log('Role:', adminRole)
    
    if (!adminToken || adminRole !== 'admin') {
      // Not authenticated - redirect to login
      console.log('❌ Authentication failed - redirecting to login')
      setIsAuthenticated(false)
      setIsLoading(false)
      router.replace('/admin/login')
      return
    }

    // User is authenticated
    console.log('✓ Admin authenticated, allowing access')
    setIsAuthenticated(true)
    setIsLoading(false)
  }, [pathname, router])

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Verifying authentication...</p>
        </div>
      </div>
    )
  }

  // Don't render protected pages if not authenticated
  if (!isAuthenticated && pathname !== '/admin/login' && pathname !== '/admin/register') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
