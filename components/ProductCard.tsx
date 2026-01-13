'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ProductCardProps {
  product: Product;
  userSession: {
    role: string;   // 'Dealer' or 'Customer'
    status: string; // 'Active', 'Pending Approval', etc.
  } | null;
}

export function ProductCard({ product, userSession }: ProductCardProps) {
  // Logic: Only Active Dealers see Wholesale pricing [cite: 11, 67]
  const showWholesale = userSession?.role === 'Dealer' && userSession?.status === 'Active';

  return (
    <Card className="overflow-hidden border-none shadow-lg">
      <img 
        src={product.ImageURL || "/prod1.jpg"} 
        alt={product.ModelName} 
        className="h-48 w-full object-cover"
      />
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-bold">{product.ModelName}</CardTitle>
          {showWholesale && (
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              Dealer Price
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-500 mb-4">{product.Description}</p>
        
        <div className="flex items-baseline gap-2">
          {showWholesale ? (
            <>
              {/* Show Wholesale Price  */}
              <span className="text-2xl font-bold text-blue-600">
                ₹{product.WholesalePrice.toLocaleString()}
              </span>
              <span className="text-sm text-gray-400 line-through">
                MRP: ₹{product.RetailPrice.toLocaleString()}
              </span>
            </>
          ) : (
            <>
              {/* Show Standard Retail Price [cite: 8] */}
              <span className="text-2xl font-bold text-slate-900">
                ₹{product.RetailPrice.toLocaleString()}
              </span>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}