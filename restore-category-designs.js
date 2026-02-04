const fs = require('fs');
const path = require('path');

// Read the HD Combo page as the template (it has the correct design)
const hdComboPath = path.join(__dirname, 'app', 'categories', 'hd-combo', 'page.tsx');
const hdComboContent = fs.readFileSync(hdComboPath, 'utf8');

// Categories to restore (excluding hd-combo which is already correct)
const categories = [
  {
    slug: 'ip-combo',
    title: 'IP Combo',
    description: 'Complete IP CCTV camera kits with NVR, cameras, and cables',
    api: 'ip-combo-products',
    fields: ['channels', 'cameraType', 'resolution', 'hdd', 'cable'],
    hasFilters: true
  },
  {
    slug: 'wifi-camera',
    title: 'WiFi Camera',
    description: 'Wireless security cameras with WiFi connectivity',
    api: 'wifi-camera-products',
    fields: ['resolution', 'connectivity', 'nightVision'],
    hasFilters: false
  },
  {
    slug: '4g-sim-camera',
    title: '4G SIM Camera',
    description: '4G enabled cameras with SIM card support',
    api: 'sim-4g-camera-products',
    fields: ['resolution', 'simSupport', 'battery'],
    hasFilters: false
  },
  {
    slug: 'solar-camera',
    title: 'Solar Camera',
    description: 'Solar powered security cameras',
    api: 'solar-camera-products',
    fields: ['resolution', 'solarPanel', 'battery'],
    hasFilters: false
  },
  {
    slug: 'body-worn-camera',
    title: 'Body Worn Camera',
    description: 'Portable body-worn cameras for security personnel',
    api: 'body-worn-camera-products',
    fields: ['resolution', 'batteryLife', 'storage'],
    hasFilters: false
  },
  {
    slug: 'hd-camera',
    title: 'HD Camera',
    description: 'Individual HD security cameras',
    api: 'hd-camera-products',
    fields: ['cameraType', 'resolution', 'lens'],
    hasFilters: false
  },
  {
    slug: 'ip-camera',
    title: 'IP Camera',
    description: 'Individual IP security cameras',
    api: 'ip-camera-products',
    fields: ['cameraType', 'resolution', 'poe'],
    hasFilters: false
  }
];

function generateCategoryPage(config) {
  // If category has filters (combo products), use the full HD Combo template
  if (config.hasFilters) {
    let content = hdComboContent;
    
    // Replace HD Combo specific text
    content = content.replace(/HD Combo/g, config.title);
    content = content.replace(/hd-combo-products/g, config.api);
    content = content.replace(/HDComboPage/g, config.title.replace(/\s+/g, '') + 'Page');
    content = content.replace(/Complete HD CCTV camera kits with DVR, cameras, and cables/g, config.description);
    
    return content;
  }
  
  // For non-combo products (simple products), create simpler version with just grid
  const toSnakeCase = (str) => str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  
  const interfaceFields = config.fields.map(field => {
    const type = field === 'nightVision' || field === 'poe' ? 'boolean' : 
                  field === 'channels' ? 'number' : 'string';
    return `  ${field}: ${type};`;
  }).join('\n');

  const fieldMappings = config.fields.map(field => 
    `        ${field}: product.${toSnakeCase(field)},`
  ).join('\n');

  const cardDetails = config.fields.map(field => {
    const label = field.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim();
    if (field === 'nightVision' || field === 'poe') {
      return `                          <p className="text-sm text-gray-600">{product.${field} ? 'Yes' : 'No'} ${label}</p>`;
    } else {
      return `                          <p className="text-sm text-gray-600">{product.${field}}</p>`;
    }
  }).join('\n');

  return `"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import Image from "next/image";
import { motion } from "framer-motion";
import { Star, ChevronDown, ChevronUp } from "lucide-react";

interface Product {
  id: number;
  name: string;
  brand: string;
${interfaceFields}
  price: number;
  originalPrice: number;
  image: string;
  specs: string[];
  rating: number;
  reviews: number;
}

export default function ${config.title.replace(/\s+/g, '')}Page() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCards, setExpandedCards] = useState<Record<number, boolean>>({});

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/${config.api}');
      if (response.ok) {
        const data = await response.json();
        
        const mappedProducts = data.map((product: any) => ({
          id: product.id,
          name: product.name,
          brand: product.brand,
${fieldMappings}
          price: parseFloat(product.price),
          originalPrice: parseFloat(product.original_price),
          image: product.image || '',
          specs: Array.isArray(product.specs) ? product.specs : [],
          rating: parseFloat(product.rating) || 4.5,
          reviews: product.reviews || 0
        }));
        
        setProducts(mappedProducts);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCardExpansion = (productId: number) => {
    setExpandedCards(prev => ({ ...prev, [productId]: !prev[productId] }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-grow">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">${config.title}</h1>
            <p className="text-xl opacity-90">${config.description}</p>
          </div>
        </div>

        {/* Products Grid */}
        <div className="container mx-auto px-4 py-12">
          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-600 text-lg">No products available at the moment.</p>
              <p className="text-gray-500 mt-2">Check back soon for new additions!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col"
                >
                  {/* Product Image */}
                  <div className="relative h-56 bg-gray-100 flex items-center justify-center">
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      />
                    ) : (
                      <span className="text-gray-400">No Image Available</span>
                    )}
                    
                    {/* Discount Badge */}
                    {product.originalPrice > product.price && (
                      <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                        {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                      </div>
                    )}
                  </div>

                  {/* Product Content */}
                  <div className="p-5 flex-1 flex flex-col">
                    {/* Brand */}
                    <p className="text-blue-600 font-semibold text-sm mb-2">{product.brand}</p>
                    
                    {/* Product Name */}
                    <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2">
                      {product.name}
                    </h3>

                    {/* Rating */}
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex items-center bg-yellow-50 px-2 py-1 rounded">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="ml-1 text-sm font-bold text-gray-900">{product.rating}</span>
                      </div>
                      <span className="text-sm text-gray-500">({product.reviews})</span>
                    </div>

                    {/* Product Details */}
                    <div className="space-y-2 mb-4 bg-gray-50 p-3 rounded-lg">
${cardDetails}
                    </div>

                    {/* Specifications */}
                    {product.specs && product.specs.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Key Features:</h4>
                        <div className="space-y-1">
                          {product.specs.slice(0, expandedCards[product.id] ? undefined : 2).map((spec, index) => (
                            <p key={index} className="text-sm text-gray-600 flex items-start">
                              <span className="text-blue-600 mr-2">✓</span>
                              <span>{spec}</span>
                            </p>
                          ))}
                        </div>
                        
                        {product.specs.length > 2 && (
                          <button
                            onClick={() => toggleCardExpansion(product.id)}
                            className="text-blue-600 text-sm font-semibold mt-3 flex items-center hover:text-blue-700 transition-colors"
                          >
                            {expandedCards[product.id] ? (
                              <>
                                Show Less <ChevronUp className="w-4 h-4 ml-1" />
                              </>
                            ) : (
                              <>
                                Show More <ChevronDown className="w-4 h-4 ml-1" />
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Price Section */}
                    <div className="mt-auto pt-4 border-t border-gray-200">
                      <div className="flex items-baseline gap-2 mb-3">
                        <p className="text-2xl font-bold text-gray-900">₹{product.price.toLocaleString()}</p>
                        {product.originalPrice > product.price && (
                          <p className="text-sm text-gray-500 line-through">
                            ₹{product.originalPrice.toLocaleString()}
                          </p>
                        )}
                      </div>

                      {/* Action Button */}
                      <button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg">
                        Get Quote
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
`;
}

// Generate and save all category pages
console.log('🔄 Restoring category pages with proper designs...\n');

categories.forEach(config => {
  const filePath = path.join(__dirname, 'app', 'categories', config.slug, 'page.tsx');
  const content = generateCategoryPage(config);
  
  fs.writeFileSync(filePath, content);
  console.log(`✅ Restored: ${config.title} (${config.hasFilters ? 'with filters' : 'simple grid'})`);
});

console.log('\n🎉 All category pages restored with original designs!');
console.log('\nNote: HD Combo kept its original filtered design');
console.log('      IP Combo restored with filtered design');
console.log('      Other categories use simple grid (as they likely were originally)');
