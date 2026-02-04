'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function TestAuthPage() {
  const router = useRouter()
  const [authState, setAuthState] = useState({
    hasToken: false,
    token: '',
    role: ''
  })

  useEffect(() => {
    const token = localStorage.getItem('adminToken') || ''
    const role = localStorage.getItem('userRole') || ''
    
    setAuthState({
      hasToken: !!token,
      token: token,
      role: role
    })
  }, [])

  const clearAuth = () => {
    localStorage.clear()
    alert('Authentication cleared! Now try to access /admin/dashboard')
    router.push('/admin/dashboard')
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Authentication Test Page</h1>
        
        <div className="bg-slate-800 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-bold mb-4">Current Authentication State:</h2>
          <div className="space-y-2">
            <p><strong>Has Token:</strong> {authState.hasToken ? '✅ YES' : '❌ NO'}</p>
            <p><strong>Token:</strong> {authState.token || 'Not found'}</p>
            <p><strong>Role:</strong> {authState.role || 'Not found'}</p>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-bold mb-4">Test Authentication:</h2>
          <div className="space-y-4">
            <Button 
              onClick={clearAuth}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              Clear Auth & Test Redirect
            </Button>
            <p className="text-sm text-gray-400">
              This will clear your authentication and redirect to /admin/dashboard.
              You should be redirected to the login page.
            </p>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Instructions:</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Click the "Clear Auth & Test Redirect" button above</li>
            <li>You will be redirected to /admin/dashboard</li>
            <li>Since you have no authentication, you should be redirected to /admin/login</li>
            <li>Login with your admin credentials</li>
            <li>After login, you'll be able to access the dashboard</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
