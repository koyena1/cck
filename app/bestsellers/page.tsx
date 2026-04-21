'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { useCart } from '@/components/cart-context';

type BestsellerProduct = {
  id: number;
  product_name: string;
  brand_name: string;
  base_price: number;
  original_price: number | null;
  image: string | null;
  product_description: string;
  product_specifications: string;
  segment: string;
  sold: number;
};

function AllBestsellersContent() {
  const router = useRouter();
  const { addToCart, setIsCartOpen } = useCart();
  const searchParams = useSearchParams();
  const business = searchParams?.get('business') || '';
  const [products, setProducts] = useState<BestsellerProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const headingText = business
    ? `${business.replace(/-/g, ' ')} Best Seller Products`
    : 'All Bestseller Products';

  useEffect(() => {
    const fetchAllBestsellers = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/bestseller-products?all=true${business ? `&business=${encodeURIComponent(business)}` : ''}`,
          { cache: 'no-store' }
        );
        const data = await response.json();

        if (response.ok && data.success && Array.isArray(data.products)) {
          const mapped: BestsellerProduct[] = data.products.map((product: any) => ({
            id: Number(product.id) || 0,
            product_name: product.product_name || '',
            brand_name: product.brand_name || '',
            base_price: Number(product.base_price) || 0,
            original_price: product.original_price !== null ? Number(product.original_price) || null : null,
            image: product.image || '/pdt.png',
            product_description: product.product_description || '',
            product_specifications: product.product_specifications || '',
            segment: product.segment || 'CCTV',
            sold: Number(product.sold) || 0,
          }));
          setProducts(mapped);
        } else {
          setProducts([]);
        }
      } catch (error) {
        console.error('Failed to fetch all bestseller products:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAllBestsellers();
  }, [business]);

  const handleAddToCart = (product: BestsellerProduct) => {
    addToCart({
      id: String(product.id),
      name: product.product_name,
      price: Number(product.base_price) || 0,
      image: product.image || '/pdt.png',
      category: product.segment || 'CCTV',
    });
    setIsCartOpen(true);
  };

  const handleBuyNow = (product: BestsellerProduct) => {
    router.push(
      `/buy-now?productId=${product.id}&productName=${encodeURIComponent(product.product_name)}&price=${Number(product.base_price) || 0}`
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="container mx-auto px-3 sm:px-4 pt-28 sm:pt-32 pb-12 sm:pb-16">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 uppercase tracking-wide leading-tight">
            {headingText}
          </h1>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/')}
            className="w-full sm:w-auto"
          >
            Back to Home
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#e63946]" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-300 rounded-xl bg-white">
            <p className="text-slate-500">No bestseller products available right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 px-1 py-1">
            {products.map((product) => (
              <div
                key={product.id}
                className="w-full border border-slate-200 rounded-xl bg-white overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="relative h-48 bg-slate-50">
                  <img
                    src={product.image || '/pdt.png'}
                    alt={product.product_name}
                    className="h-full w-full object-contain p-3"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/pdt.png';
                    }}
                  />
                </div>

                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-slate-500">Brand: {product.brand_name}</p>
                    <span className="text-xs font-bold text-[#e63946]">{product.sold} sold</span>
                  </div>

                  <p className="text-xs text-slate-500 mb-1">{product.segment}</p>
                  <h3 className="text-[1.05rem] font-semibold text-slate-900 leading-snug line-clamp-2 min-h-12">
                    {product.product_name}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 min-h-10">
                    {product.product_description || 'No description available'}
                  </p>

                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-3xl font-black text-slate-900">RS {product.base_price.toLocaleString()}</span>
                    {product.original_price !== null && product.original_price > product.base_price && (
                      <span className="text-sm text-slate-500 line-through">RS {Number(product.original_price).toLocaleString()}</span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                    Specs: {product.product_specifications || 'N/A'}
                  </p>

                  <div className="mt-4 grid grid-cols-1 gap-2">
                    <Button
                      type="button"
                      onClick={() => router.push(`/products/${product.id}`)}
                      className="w-full bg-[#e63946] hover:bg-[#d62839] text-white font-bold"
                    >
                      View Details
                    </Button>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => handleAddToCart(product)}
                      >
                        Add to Cart
                      </Button>
                      <Button
                        type="button"
                        className="w-full bg-slate-800 hover:bg-slate-900 text-white"
                        onClick={() => handleBuyNow(product)}
                      >
                        Buy Now
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function AllBestsellersPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50">
          <Navbar />
          <main className="container mx-auto px-3 sm:px-4 pt-28 sm:pt-32 pb-12 sm:pb-16">
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#e63946]" />
            </div>
          </main>
          <Footer />
        </div>
      }
    >
      <AllBestsellersContent />
    </Suspense>
  );
}
