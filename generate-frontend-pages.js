const fs = require('fs');
const path = require('path');

const categories = [
  {
    slug: 'ip-combo',
    title: 'IP Combo',
    api: 'ip-combo-products',
    fields: ['channels', 'cameraType', 'resolution', 'hdd', 'cable']
  },
  {
    slug: 'wifi-camera',
    title: 'WiFi Camera',
    api: 'wifi-camera-products',
    fields: ['resolution', 'connectivity', 'nightVision']
  },
  {
    slug: '4g-sim-camera',
    title: '4G SIM Camera',
    api: 'sim-4g-camera-products',
    fields: ['resolution', 'simSupport', 'battery']
  },
  {
    slug: 'solar-camera',
    title: 'Solar Camera',
    api: 'solar-camera-products',
    fields: ['resolution', 'solarPanel', 'battery']
  },
  {
    slug: 'body-worn-camera',
    title: 'Body Worn Camera',
    api: 'body-worn-camera-products',
    fields: ['resolution', 'batteryLife', 'storage']
  },
  {
    slug: 'hd-camera',
    title: 'HD Camera',
    api: 'hd-camera-products',
    fields: ['cameraType', 'resolution', 'lens']
  },
  {
    slug: 'ip-camera',
    title: 'IP Camera',
    api: 'ip-camera-products',
    fields: ['cameraType', 'resolution', 'poe']
  }
];

function generateFrontendPage(config) {
  const toSnakeCase = (str) => str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  const toTitleCase = (str) => {
    return str.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()).trim();
  };

  // Generate interface fields
  const interfaceFields = config.fields.map(field => {
    const type = field === 'nightVision' || field === 'poe' ? 'boolean' : 
                  field === 'channels' ? 'number' : 'string';
    return `  ${field}: ${type};`;
  }).join('\n');

  // Generate field mappings
  const fieldMappings = config.fields.map(field => 
    `        ${field}: product.${toSnakeCase(field)},`
  ).join('\n');

  // Generate product card details
  const cardDetails = config.fields.map(field => {
    const label = toTitleCase(field);
    if (field === 'nightVision' || field === 'poe') {
      return `                          <p className="text-sm text-gray-600">{product.${field} ? 'Yes' : 'No'} ${label}</p>`;
    } else {
      return `                          <p className="text-sm text-gray-600">{product.${field}} ${label}</p>`;
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
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-12">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl font-bold mb-4">${config.title} Products</h1>
            <p className="text-lg opacity-90">
              Explore our range of ${config.title.toLowerCase()} products
            </p>
          </div>
        </div>

        {/* Products Section */}
        <div className="container mx-auto px-4 py-12">
          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-600 text-lg">No products available at the moment.</p>
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
                  <div className="relative h-48 bg-gray-100 flex items-center justify-center">
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      />
                    ) : (
                      <span className="text-gray-400">No Image</span>
                    )}
                    
                    {/* Discount Badge */}
                    {product.originalPrice > product.price && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-lg text-sm font-bold">
                        {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                      </div>
                    )}
                  </div>

                  {/* Product Content */}
                  <div className="p-4 flex-1 flex flex-col">
                    {/* Brand */}
                    <p className="text-blue-600 font-semibold text-sm mb-1">{product.brand}</p>
                    
                    {/* Product Name */}
                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                      {product.name}
                    </h3>

                    {/* Rating */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="ml-1 text-sm font-semibold">{product.rating}</span>
                      </div>
                      <span className="text-sm text-gray-500">({product.reviews} reviews)</span>
                    </div>

                    {/* Product Details */}
                    <div className="space-y-1 mb-3">
${cardDetails}
                    </div>

                    {/* Specifications */}
                    {product.specs && product.specs.length > 0 && (
                      <div className="mb-3">
                        <div className="space-y-1">
                          {product.specs.slice(0, expandedCards[product.id] ? undefined : 2).map((spec, index) => (
                            <p key={index} className="text-sm text-gray-600 flex items-start">
                              <span className="mr-2">•</span>
                              <span>{spec}</span>
                            </p>
                          ))}
                        </div>
                        
                        {product.specs.length > 2 && (
                          <button
                            onClick={() => toggleCardExpansion(product.id)}
                            className="text-blue-600 text-sm font-medium mt-2 flex items-center hover:text-blue-700"
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
                    <div className="mt-auto pt-4 border-t">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-2xl font-bold text-gray-900">₹{product.price.toLocaleString()}</p>
                          {product.originalPrice > product.price && (
                            <p className="text-sm text-gray-500 line-through">
                              ₹{product.originalPrice.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Action Button */}
                      <button className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
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

// Generate all frontend pages
categories.forEach(config => {
  const filePath = path.join(__dirname, 'app', 'categories', config.slug, 'page.tsx');
  const content = generateFrontendPage(config);
  fs.writeFileSync(filePath, content);
  console.log(`✅ Updated: ${filePath}`);
});

console.log('\n🎉 All frontend pages updated successfully!');
