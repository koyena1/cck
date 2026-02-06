"use client";

import { useState, useEffect, useRef } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useGlobalQuotationData } from "@/lib/useGlobalQuotationData";
import { ChevronLeft, ChevronRight } from "lucide-react";

const categories = [
  {
    id: 1,
    name: "HD Combo",
    image: "/prod1.jpg", // Fallback - replace with /categories/hd-combo.jpg when available
    count: 1537,
    description: "Complete HD CCTV combo kits"
  },
  {
    id: 2,
    name: "IP Combo",
    image: "/prod2.jpg", // Fallback - replace with /categories/ip-combo.jpg when available
    count: 464,
    description: "Network IP camera combo kits"
  },
  {
    id: 3,
    name: "WiFi Camera",
    image: "/prod3.jpg", // Fallback - replace with /categories/wifi-camera.jpg when available
    count: 720,
    description: "Smart WiFi security cameras"
  },
  {
    id: 4,
    name: "4G SIM Camera",
    image: "/prod4.jpg", // Fallback - replace with /categories/sim-camera.jpg when available
    count: 314,
    description: "4G SIM enabled cameras"
  },
  {
    id: 5,
    name: "Solar Camera",
    image: "/prod5.jpg", // Fallback - replace with /categories/solar-camera.jpg when available
    count: 174,
    description: "Solar powered security cameras"
  },
  {
    id: 6,
    name: "Body Worn Camera",
    image: "/prod6.jpg", // Fallback - replace with /categories/body-worn.jpg when available
    count: 37,
    description: "Portable body worn cameras"
  },
  {
    id: 7,
    name: "HD Camera",
    image: "/cctv.jpg", // Fallback - replace with /categories/hd-camera.jpg when available
    count: 396,
    description: "HD bullet and dome cameras"
  },
  {
    id: 8,
    name: "IP Camera",
    image: "/cc.jpg", // Fallback - replace with /categories/ip-camera.jpg when available
    count: 614,
    description: "Network IP cameras"
  }
];

export default function CategoriesPage() {
  const router = useRouter();
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const brandScrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  
  // Global quotation data - automatically synced with admin additions
  const { data: quotationSettings, loading: loadingSettings } = useGlobalQuotationData();
  
  // Dynamically build brands list from global data
  const [brands, setBrands] = useState<Array<{ name: string; logo: string }>>([]);
  
  useEffect(() => {
    if (quotationSettings?.brands) {
      const dynamicBrands = quotationSettings.brands.map(brand => {
        // Use ONLY admin-uploaded images from database
        const logoUrl = brand.image_url && brand.image_url.trim() !== '' 
          ? brand.image_url 
          : "/placeholder.png";
        
        console.log(`Brand: ${brand.name}, image_url from DB: ${brand.image_url}, Using: ${logoUrl}`);
        
        return {
          name: brand.name,
          logo: logoUrl
        };
      });
      setBrands(dynamicBrands);
    }
  }, [quotationSettings]);

  // Check scroll position to show/hide arrows
  const checkScrollPosition = () => {
    if (brandScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = brandScrollRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScrollPosition();
    window.addEventListener('resize', checkScrollPosition);
    return () => window.removeEventListener('resize', checkScrollPosition);
  }, [brands]);

  const scrollBrands = (direction: 'left' | 'right') => {
    if (brandScrollRef.current) {
      const scrollAmount = 300;
      const newScrollLeft = direction === 'left'
        ? brandScrollRef.current.scrollLeft - scrollAmount
        : brandScrollRef.current.scrollLeft + scrollAmount;
      
      brandScrollRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  const handleBrandClick = (brandName: string) => {
    setSelectedBrand(brandName === selectedBrand ? "" : brandName);
  };

  const handleCategoryClick = (categoryName: string) => {
    const routes: Record<string, string> = {
      "HD Combo": '/categories/hd-combo',
      "IP Combo": '/categories/ip-combo',
      "WiFi Camera": '/categories/wifi-camera',
      "4G SIM Camera": '/categories/4g-sim-camera',
      "Solar Camera": '/categories/solar-camera',
      "Body Worn Camera": '/categories/body-worn-camera',
      "HD Camera": '/categories/hd-camera',
      "IP Camera": '/categories/ip-camera'
    };
    
    const route = routes[categoryName];
    if (route) {
      // If brand is selected, navigate with brand filter; otherwise show all products
      if (selectedBrand) {
        router.push(`${route}?brand=${encodeURIComponent(selectedBrand)}`);
      } else {
        router.push(route);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Shop by Categories
              <span className="text-slate-500 text-2xl ml-3">({categories.length})</span>
            </h1>
            <p className="text-slate-600 text-lg">
              Browse our comprehensive range of CCTV and security camera solutions
            </p>
          </motion.div>

          {/* Shop by Brand Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-16"
          >
            <div className="bg-gradient-to-br from-slate-50 to-white rounded-3xl p-8 md:p-12 shadow-lg border border-slate-200">
              <div className="text-center mb-10">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
                  Shop by Brand
                </h2>
                <p className="text-slate-600 text-base md:text-lg">
                  Premium CCTV brands trusted by professionals worldwide
                </p>
              </div>

              <div className="relative">
                {/* Left Arrow */}
                {showLeftArrow && (
                  <button
                    onClick={() => scrollBrands('left')}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white hover:bg-slate-50 text-slate-800 rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-slate-200 hover:border-[#e63946] group"
                    aria-label="Scroll left"
                  >
                    <ChevronLeft className="w-6 h-6 group-hover:text-[#e63946]" />
                  </button>
                )}

                {/* Brands Container */}
                <div 
                  ref={brandScrollRef}
                  onScroll={checkScrollPosition}
                  className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide scroll-smooth px-8"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {loadingSettings ? (
                    <div className="w-full text-center py-8 text-slate-500">
                      Loading brands...
                    </div>
                  ) : brands.length === 0 ? (
                    <div className="w-full text-center py-8 text-slate-500">
                      No brands available
                    </div>
                  ) : (
                    brands.map((brand, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: 0.3 + i * 0.05 }}
                        onClick={() => handleBrandClick(brand.name)}
                        className={`flex-shrink-0 w-32 md:w-40 flex flex-col items-center justify-center p-4 rounded-2xl bg-white hover:shadow-xl transition-all duration-300 cursor-pointer group ${
                          selectedBrand === brand.name 
                            ? 'border-2 border-[#e63946] shadow-lg' 
                            : 'border border-slate-100 hover:bg-slate-50'
                        }`}
                      >
                        <div className={`w-20 h-20 md:w-24 md:h-24 flex items-center justify-center mb-3 rounded-full bg-white shadow-md group-hover:scale-110 group-hover:shadow-lg transition-all duration-300 overflow-hidden ${
                          selectedBrand === brand.name ? 'border-2 border-[#e63946]' : 'border-2 border-slate-100'
                        }`}>
                          <div className="relative w-14 h-14 md:w-16 md:h-16 flex items-center justify-center">
                            <img
                              src={brand.logo}
                              alt={brand.name}
                              className="w-full h-full object-contain p-2"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/placeholder.png';
                              }}
                            />
                          </div>
                        </div>
                        <span className={`text-xs md:text-sm font-bold text-center transition-colors ${
                          selectedBrand === brand.name ? 'text-[#e63946]' : 'text-slate-800 group-hover:text-[#e63946]'
                        }`}>
                          {brand.name}
                        </span>
                      </motion.div>
                    ))
                  )}
                </div>

                {/* Right Arrow */}
                {showRightArrow && (
                  <button
                    onClick={() => scrollBrands('right')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white hover:bg-slate-50 text-slate-800 rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-slate-200 hover:border-[#e63946] group"
                    aria-label="Scroll right"
                  >
                    <ChevronRight className="w-6 h-6 group-hover:text-[#e63946]" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>

          {/* Categories Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {categories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                onClick={() => handleCategoryClick(category.name)}
                className="group cursor-pointer"
              >
                <div className="relative bg-slate-100 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                  {/* Image Container */}
                  <div className="relative h-56 bg-gradient-to-br from-slate-200 to-slate-100 flex items-center justify-center p-6">
                    <div className="relative w-full h-full">
                      <Image
                        src={category.image}
                        alt={category.name}
                        fill
                        className="object-contain group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                  </div>

                  {/* Count Badge */}
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1.5 shadow-lg">
                    <svg 
                      className="w-4 h-4 text-slate-600" 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                    </svg>
                    <span className="text-sm font-semibold text-slate-700">
                      {category.count}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="p-5 bg-white">
                    <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-[#e63946] transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {category.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* View Less Button (Optional) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="mt-12 flex justify-center"
          >
            <button 
              onClick={() => router.push('/')}
              className="bg-[#e63946] hover:bg-[#d62839] text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
            >
              BACK TO HOME
            </button>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
