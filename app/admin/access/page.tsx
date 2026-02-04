'use client'

export default function AccessManagementPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Access Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage different types of user access and login credentials
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Telecaller Access */}
        <div className="border rounded-lg p-6 hover:border-primary transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Telecaller</h3>
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 text-xl">📞</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Manage telecaller login credentials and access
          </p>
          <button className="w-full px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90">
            Manage Access
          </button>
        </div>

        {/* Field Sales Access */}
        <div className="border rounded-lg p-6 hover:border-primary transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Field Sales</h3>
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <span className="text-green-600 text-xl">🚗</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Manage field sales team credentials
          </p>
          <button className="w-full px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90">
            Manage Access
          </button>
        </div>

        {/* Merchant Access */}
        <div className="border rounded-lg p-6 hover:border-primary transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Merchant</h3>
            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
              <span className="text-purple-600 text-xl">🏪</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Manage merchant login credentials
          </p>
          <button className="w-full px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90">
            Manage Access
          </button>
        </div>

        {/* Online Sales Access */}
        <div className="border rounded-lg p-6 hover:border-primary transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Online Sales</h3>
            <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
              <span className="text-orange-600 text-xl">🌐</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Manage online sales team access
          </p>
          <button className="w-full px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90">
            Manage Access
          </button>
        </div>
      </div>

      {/* Coming Soon Notice */}
      <div className="mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <h3 className="font-semibold text-yellow-900 mb-1">Feature Under Development</h3>
            <p className="text-sm text-yellow-800">
              The access management system for different user roles is currently being developed. 
              This feature will allow you to create and manage login credentials for telecallers, 
              field sales, merchants, and online sales team members.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
