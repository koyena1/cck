"use client";

import { useState, useEffect, useMemo } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { ChevronRight, ChevronDown, ChevronUp, Minus } from "lucide-react";
import { useCart } from "@/components/cart-context";
import { useGlobalQuotationData } from "@/lib/useGlobalQuotationData";

// Product interface
interface Product {
  id: number;
  name: string;
  brand: string;
  resolution: string;
  solarPanel: string;
  battery: string;
  connectivity: string;
  price: number;
  originalPrice: number;
  image: string;
  specs: string[];
  rating: number;
  reviews: number;
}

// Filter options - Static
const connectivityOptions = ["WiFi", "4G SIM"];
const solarPanelOptions = ["10W", "20W", "30W", "40W"];
const batteryOptions = ["5000mAh", "10000mAh", "15000mAh", "20000mAh"];

export default function SolarCameraPage() {
  const router = useRouter();
  const { addToCart, setIsCartOpen } = useCart();
  
  // Get global quotation data (including pixels from admin panel)
  const { data: quotationSettings, loading: loadingSettings } = useGlobalQuotationData();
  
  // Dynamic resolutions/pixels from database
  const resolutions = useMemo(() => {
    return quotationSettings?.pixels?.map((p: any) => p.name) || ["3MP", "4MP", "5MP", "8MP"];
  }, [quotationSettings]);
  
  // Products from database
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Expanded state for each product card
  const [expandedCards, setExpandedCards] = useState<Record<number, boolean>>({});
  
  // Filter states
  const [selectedResolutions, setSelectedResolutions] = useState<string[]>([]);
  const [selectedConnectivity, setSelectedConnectivity] = useState<string[]>([]);
  const [selectedSolarPanel, setSelectedSolarPanel] = useState<string[]>([]);
  const [selectedBattery, setSelectedBattery] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<number[]>([0, 100000]);
  
  // Filter section collapse states
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    resolution: true,
    connectivity: false,
    solarPanel: false,
    battery: false
  });

  // Fetch products from database
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/solar-camera-products');
      const data = await res.json();
      console.log('API Response:', data);
      if (data.success) {
        // Map database fields to frontend format
        const mappedProducts = data.products.map((p: any) => ({
          id: p.id,
          name: p.name,
          brand: p.brand,
          resolution: p.resolution,
          solarPanel: p.solar_panel,
          battery: p.battery,
          connectivity: p.connectivity,
          price: parseFloat(p.price),
          originalPrice: parseFloat(p.original_price),
          image: p.image || '/prod1.jpg',
          specs: Array.isArray(p.specs) ? p.specs : [],
          rating: parseFloat(p.rating) || 4.5,
          reviews: p.reviews || 0
        }));
        console.log('Mapped Products:', mappedProducts);
        setProducts(mappedProducts);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Toggle card expansion
  const toggleCardExpansion = (productId: number) => {
    setExpandedCards(prev => ({ ...prev, [productId]: !prev[productId] }));
  };

  // Toggle filter selection
  const toggleFilter = (value: any, selected: any[], setSelected: Function) => {
    if (selected.includes(value)) {
      setSelected(selected.filter(item => item !== value));
    } else {
      setSelected([...selected, value]);
    }
  };

  // Filtered products
  const filteredProducts = useMemo(() => {
    const filtered = products.filter(product => {
      if (selectedResolutions.length > 0 && !selectedResolutions.includes(product.resolution)) return false;
      if (selectedConnectivity.length > 0 && !selectedConnectivity.includes(product.connectivity)) return false;
      if (selectedSolarPanel.length > 0 && !selectedSolarPanel.includes(product.solarPanel)) return false;
      if (selectedBattery.length > 0 && !selectedBattery.includes(product.battery)) return false;
      if (product.price < priceRange[0] || product.price > priceRange[1]) return false;
      return true;
    });
    console.log('Filtered Products:', filtered);
    console.log('Total Products:', products.length);
    console.log('Filters Active:', { selectedResolutions, selectedConnectivity, selectedSolarPanel, selectedBattery, priceRange });
    return filtered;
  }, [selectedResolutions, selectedConnectivity, selectedSolarPanel, selectedBattery, priceRange, products]);

  const FilterSection = ({ 
    title, 
    sectionKey, 
    children 
  }: { 
    title: string; 
    sectionKey: string; 
    children: React.ReactNode;
  }) => (
    <div className="border-slate-200 pb-4 mb-4 lg:border-b min-w-[200px] lg:min-w-0">
      <button
        onClick={() => toggleSection(sectionKey)}
        className="flex items-center justify-between w-full text-left mb-3"
      >
        <h3 className="font-bold text-slate-900 text-xs lg:text-sm uppercase whitespace-nowrap">{title}</h3>
        {expandedSections[sectionKey] ? (
          <ChevronUp className="w-4 h-4 text-slate-600" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-600" />
        )}
      </button>
      {expandedSections[sectionKey] && <div className="space-y-2">{children}</div>}
    </div>
  );

  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product.id.toString(),
      name: product.name,
      price: product.price,
      image: product.image,
      category: 'Solar Camera'
    });
    setIsCartOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-slate-600 mb-6">
            <button onClick={() => router.push('/')} className="hover:text-[#e63946]">Home</button>
            <ChevronRight className="w-4 h-4" />
            <button onClick={() => router.push('/categories')} className="hover:text-[#e63946]">Categories</button>
            <ChevronRight className="w-4 h-4" />
            <span className="text-slate-900 font-medium">Solar Camera</span>
          </div>

          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
              Solar Cameras
            </h1>
            <p className="text-slate-600">
              Showing {filteredProducts.length} out of {products.length} Products
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Sidebar - Filters */}
            <aside className="lg:w-64 flex-shrink-0">
              <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6 lg:sticky lg:top-24">
                <div className="lg:block">
                  <div className="flex items-center justify-between mb-4 lg:mb-6">
                    <h2 className="font-bold text-base lg:text-lg text-slate-900">Filters</h2>
                  <button 
                    onClick={() => {
                      setSelectedResolutions([]);
                      setSelectedConnectivity([]);
                      setSelectedSolarPanel([]);
                      setSelectedBattery([]);
                      setPriceRange([0, 100000]);
                    }}
                    className="text-sm text-[#e63946] hover:underline"
                  >
                    Clear All
                  </button>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 lg:block lg:overflow-visible lg:pb-0 scrollbar-hide">

                {/* Resolution Filter */}
                <FilterSection title="Resolution" sectionKey="resolution">
                  {resolutions.map(res => (
                    <label key={res} className="flex items-center gap-2 cursor-pointer group">
                      <Checkbox
                        checked={selectedResolutions.includes(res)}
                        onCheckedChange={() => toggleFilter(res, selectedResolutions, setSelectedResolutions)}
                      />
                      <span className="text-sm text-slate-700 group-hover:text-slate-900">
                        {res}
                      </span>
                    </label>
                  ))}
                </FilterSection>

                {/* Connectivity Filter */}
                <FilterSection title="Connectivity" sectionKey="connectivity">
                  {connectivityOptions.map(conn => (
                    <label key={conn} className="flex items-center gap-2 cursor-pointer group">
                      <Checkbox
                        checked={selectedConnectivity.includes(conn)}
                        onCheckedChange={() => toggleFilter(conn, selectedConnectivity, setSelectedConnectivity)}
                      />
                      <span className="text-sm text-slate-700 group-hover:text-slate-900">
                        {conn}
                      </span>
                    </label>
                  ))}
                </FilterSection>

                {/* Solar Panel Filter */}
                <FilterSection title="Solar Panel" sectionKey="solarPanel">
                  {solarPanelOptions.map(panel => (
                    <label key={panel} className="flex items-center gap-2 cursor-pointer group">
                      <Checkbox
                        checked={selectedSolarPanel.includes(panel)}
                        onCheckedChange={() => toggleFilter(panel, selectedSolarPanel, setSelectedSolarPanel)}
                      />
                      <span className="text-sm text-slate-700 group-hover:text-slate-900">
                        {panel}
                      </span>
                    </label>
                  ))}
                </FilterSection>

                {/* Battery Filter */}
                <FilterSection title="Battery" sectionKey="battery">
                  {batteryOptions.map(battery => (
                    <label key={battery} className="flex items-center gap-2 cursor-pointer group">
                      <Checkbox
                        checked={selectedBattery.includes(battery)}
                        onCheckedChange={() => toggleFilter(battery, selectedBattery, setSelectedBattery)}
                      />
                      <span className="text-sm text-slate-700 group-hover:text-slate-900">
                        {battery}
                      </span>
                    </label>
                  ))}
                </FilterSection>

                {/* Price Filter */}
                <FilterSection title="Price Range" sectionKey="price">
                  <div className="space-y-4">
                    <Slider
                      min={0}
                      max={100000}
                      step={1000}
                      value={priceRange}
                      onValueChange={setPriceRange}
                      className="w-full"
                    />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-700">₹{(priceRange[0] || 0).toLocaleString()}</span>
                      <Minus className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-700">₹{(priceRange[1] || 100000).toLocaleString()}</span>
                    </div>
                  </div>
                </FilterSection>
              </div>
            </div>
              </div>
            </aside>

            {/* Right Side - Product Grid */}
            <div className="flex-1">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e63946] mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading products...</p>
                  </div>
                </div>
              ) : filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredProducts.map((product, index) => {
                    const isExpanded = expandedCards[product.id] || false;
                    return (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group flex flex-col h-full"
                    >
                      {/* Product Image */}
                      <div className="relative h-56 bg-slate-100">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {/* Discount Badge */}
                        {product.originalPrice && (
                          <div className="absolute top-3 right-3 bg-[#e63946] text-white px-2 py-1 rounded-md text-xs font-bold">
                            {Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="p-5 flex-1 flex flex-col">
                        <h3 className="font-bold text-slate-900 mb-3 line-clamp-2 group-hover:text-[#e63946] transition-colors">
                          {product.name}
                        </h3>

                        {/* Product Details - Always visible */}
                        <div className="mb-3 space-y-1.5">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-semibold text-slate-700 min-w-[70px]">Brand:</span>
                            <span className="text-slate-600">{product.brand}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-semibold text-slate-700 min-w-[70px]">Resolution:</span>
                            <span className="text-slate-600">{product.resolution}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-semibold text-slate-700 min-w-[70px]">Solar Panel:</span>
                            <span className="text-slate-600">{product.solarPanel}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-semibold text-slate-700 min-w-[70px]">Battery:</span>
                            <span className="text-slate-600">{product.battery}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-semibold text-slate-700 min-w-[70px]">Connectivity:</span>
                            <span className="text-slate-600">{product.connectivity}</span>
                          </div>
                        </div>

                        {/* Specifications - Collapsible */}
                        {product.specs && product.specs.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs font-semibold text-slate-700 mb-1.5">Specifications:</p>
                            <ul className="space-y-1">
                              {(isExpanded ? product.specs : product.specs.slice(0, 2)).map((spec, i) => (
                                <li key={i} className="text-xs text-slate-600 flex items-start gap-1">
                                  <span className="text-[#e63946] mt-0.5">•</span>
                                  <span>{spec}</span>
                                </li>
                              ))}
                            </ul>
                            {product.specs.length > 2 && (
                              <button
                                onClick={() => toggleCardExpansion(product.id)}
                                className="text-xs text-[#e63946] hover:underline mt-2 font-medium"
                              >
                                {isExpanded ? '− Show Less' : `+ Show More (${product.specs.length - 2} more)`}
                              </button>
                            )}
                          </div>
                        )}

                        {/* Spacer to push bottom content down */}
                        <div className="flex-1"></div>

                        {/* Rating */}
                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex items-center gap-1 bg-green-600 text-white px-2 py-0.5 rounded text-xs font-semibold">
                            <span>{product.rating}</span>
                            <span>★</span>
                          </div>
                          <span className="text-xs text-slate-500">({product.reviews} Reviews)</span>
                        </div>

                        {/* Price */}
                        <div className="flex items-center gap-2 mb-4">
                          <span className="text-2xl font-bold text-slate-900">
                            ₹{product.price.toLocaleString()}
                          </span>
                          {product.originalPrice && (
                            <span className="text-sm text-slate-500 line-through">
                              ₹{product.originalPrice.toLocaleString()}
                            </span>
                          )}
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleAddToCart(product)}
                            className="flex-1 bg-slate-700 hover:bg-slate-800 text-white"
                          >
                            Add to Cart
                          </Button>
                          <Button
                            onClick={() => router.push(`/buy-now?productId=${product.id}&productName=${encodeURIComponent(product.name)}&price=${product.price}`)}
                            className="flex-1 bg-[#e63946] hover:bg-[#d62839] text-white"
                          >
                            Buy Now
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                  <p className="text-slate-600 text-lg mb-4">No products found matching your filters</p>
                  <Button
                    onClick={() => {
                      setSelectedResolutions([]);
                      setSelectedConnectivity([]);
                      setSelectedSolarPanel([]);
                      setSelectedBattery([]);
                      setPriceRange([0, 100000]);
                    }}
                    className="bg-[#e63946] hover:bg-[#d62839] text-white"
                  >
                    Clear All Filters
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
