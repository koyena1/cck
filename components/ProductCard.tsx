'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ShoppingCart, Package } from "lucide-react"
import { Product } from "./product"
import { useCart } from "./cart-context"
import { useRouter } from "next/navigation"
import { useState } from "react"

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
  const { addToCart, setIsCartOpen } = useCart();
  const router = useRouter();
  const [isAdding, setIsAdding] = useState(false);

  const price = showWholesale ? product.WholesalePrice : product.RetailPrice;

  const handleAddToCart = () => {
    setIsAdding(true);
    addToCart({
      id: product.ProductID.toString(),
      name: product.ModelName,
      price: price,
      image: product.ImageURL || "/prod1.jpg",
      category: (product as any).CategoryName || ''
    });
    
    // Show success animation
    setTimeout(() => {
      setIsAdding(false);
      setIsCartOpen(true);
    }, 300);
  };

  const handleBuyNow = () => {
    const queryParams = new URLSearchParams({
      productId: product.ProductID.toString(),
      productName: product.ModelName,
      price: price.toString()
    });
    router.push(`/buy-now?${queryParams.toString()}`);
  };

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
        
        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          <Button
            onClick={handleAddToCart}
            disabled={isAdding}
            className="flex-1 bg-slate-900 hover:bg-slate-800 text-white"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            {isAdding ? 'Added!' : 'Add to Cart'}
          </Button>
          <Button
            onClick={handleBuyNow}
            className="flex-1 bg-[#e63946] hover:bg-[#d62839] text-white"
          >
            <Package className="w-4 h-4 mr-2" />
            Buy Now
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}