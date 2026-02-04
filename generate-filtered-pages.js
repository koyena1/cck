const fs = require('fs');
const path = require('path');

// Read HD Combo as the base template
const hdComboPath = path.join(__dirname, 'app', 'categories', 'hd-combo', 'page.tsx');
let baseTemplate = fs.readFileSync(hdComboPath, 'utf8');

// Category configurations with their specific filters
const categories = [
  {
    slug: 'wifi-camera',
    title: 'WiFi Camera',
    description: 'Wireless security cameras with WiFi connectivity',
    api: 'wifi-camera-products',
    componentName: 'WiFiCameraPage',
    filters: {
      resolution: ['720P', '1080P', '2MP', '3MP', '4MP', '5MP'],
      connectivity: ['WiFi', '2.4GHz', '5GHz', 'Dual Band'],
      nightVision: ['Yes', 'No']
    },
    fields: [
      { name: 'resolution', type: 'string', label: 'Resolution' },
      { name: 'connectivity', type: 'string', label: 'Connectivity' },
      { name: 'nightVision', type: 'boolean', label: 'Night Vision' }
    ]
  },
  {
    slug: '4g-sim-camera',
    title: '4G SIM Camera',
    description: '4G enabled cameras with SIM card support',
    api: 'sim-4g-camera-products',
    componentName: 'FourGSIMCameraPage',
    filters: {
      resolution: ['720P', '1080P', '2MP', '3MP', '4MP'],
      simSupport: ['4G', '3G', '4G/3G'],
      battery: ['5000mAh', '8000mAh', '10000mAh', '15000mAh']
    },
    fields: [
      { name: 'resolution', type: 'string', label: 'Resolution' },
      { name: 'simSupport', type: 'string', label: 'SIM Support' },
      { name: 'battery', type: 'string', label: 'Battery' }
    ]
  },
  {
    slug: 'solar-camera',
    title: 'Solar Camera',
    description: 'Solar powered security cameras',
    api: 'solar-camera-products',
    componentName: 'SolarCameraPage',
    filters: {
      resolution: ['720P', '1080P', '2MP', '3MP', '4MP'],
      solarPanel: ['5W', '10W', '15W', '20W'],
      battery: ['5000mAh', '8000mAh', '10000mAh', '15000mAh', '20000mAh']
    },
    fields: [
      { name: 'resolution', type: 'string', label: 'Resolution' },
      { name: 'solarPanel', type: 'string', label: 'Solar Panel' },
      { name: 'battery', type: 'string', label: 'Battery' }
    ]
  },
  {
    slug: 'body-worn-camera',
    title: 'Body Worn Camera',
    description: 'Portable body-worn cameras for security personnel',
    api: 'body-worn-camera-products',
    componentName: 'BodyWornCameraPage',
    filters: {
      resolution: ['720P', '1080P', '2K', '4K'],
      batteryLife: ['4 Hours', '6 Hours', '8 Hours', '10 Hours', '12 Hours'],
      storage: ['16GB', '32GB', '64GB', '128GB', '256GB']
    },
    fields: [
      { name: 'resolution', type: 'string', label: 'Resolution' },
      { name: 'batteryLife', type: 'string', label: 'Battery Life' },
      { name: 'storage', type: 'string', label: 'Storage' }
    ]
  },
  {
    slug: 'hd-camera',
    title: 'HD Camera',
    description: 'Individual HD security cameras',
    api: 'hd-camera-products',
    componentName: 'HDCameraPage',
    filters: {
      cameraType: ['Bullet', 'Dome', 'PTZ', 'Turret'],
      resolution: ['720P', '1080P', '2MP', '3MP', '4MP', '5MP'],
      lens: ['2.8mm', '3.6mm', '6mm', '8mm', '12mm']
    },
    fields: [
      { name: 'cameraType', type: 'string', label: 'Camera Type' },
      { name: 'resolution', type: 'string', label: 'Resolution' },
      { name: 'lens', type: 'string', label: 'Lens' }
    ]
  },
  {
    slug: 'ip-camera',
    title: 'IP Camera',
    description: 'Individual IP security cameras',
    api: 'ip-camera-products',
    componentName: 'IPCameraPage',
    filters: {
      cameraType: ['Bullet', 'Dome', 'PTZ', 'Turret'],
      resolution: ['2MP', '3MP', '4MP', '5MP', '8MP'],
      poe: ['Yes', 'No']
    },
    fields: [
      { name: 'cameraType', type: 'string', label: 'Camera Type' },
      { name: 'resolution', type: 'string', label: 'Resolution' },
      { name: 'poe', type: 'boolean', label: 'PoE Support' }
    ]
  }
];

function toSnakeCase(str) {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

function toCamelCase(str) {
  return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
}

function generateCategoryPage(config) {
  // Start with base structure
  let content = `"use client";

import { useState, useEffect, useMemo } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { ChevronDown, ChevronUp, Star } from "lucide-react";

// Product interface
interface Product {
  id: number;
  name: string;
  brand: string;
`;

  // Add field types
  config.fields.forEach(field => {
    content += `  ${field.name}: ${field.type === 'boolean' ? 'boolean' : 'string'};\n`;
  });

  content += `  price: number;
  originalPrice: number;
  image: string;
  specs: string[];
  rating: number;
  reviews: number;
}

// Filter options
const brands = ["Hikvision", "CP Plus", "Dahua", "Prama", "Secureye", "Zebronics", "Daichi", "Godrej"];
`;

  // Add filter options
  Object.keys(config.filters).forEach(filterKey => {
    const values = config.filters[filterKey];
    if (filterKey === 'nightVision' || filterKey === 'poe') {
      // Boolean filters are handled differently
      return;
    }
    const arrayValues = values.map(v => `"${v}"`).join(', ');
    content += `const ${filterKey}Options = [${arrayValues}];\n`;
  });

  content += `
export default function ${config.componentName}() {
  // Products from database
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Expanded state for each product card
  const [expandedCards, setExpandedCards] = useState<Record<number, boolean>>({});
  
  // Filter states
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
`;

  // Add filter states
  config.fields.forEach(field => {
    if (field.type === 'boolean') {
      content += `  const [selected${field.name.charAt(0).toUpperCase() + field.name.slice(1)}, setSelected${field.name.charAt(0).toUpperCase() + field.name.slice(1)}] = useState<string[]>([]);\n`;
    } else {
      content += `  const [selected${field.name.charAt(0).toUpperCase() + field.name.slice(1)}, setSelected${field.name.charAt(0).toUpperCase() + field.name.slice(1)}] = useState<string[]>([]);\n`;
    }
  });

  content += `  const [priceRange, setPriceRange] = useState<number[]>([0, 100000]);
  
  // Filter section collapse states
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    brand: true,
`;

  config.fields.forEach((field, index) => {
    content += `    ${field.name}: ${index === 0 ? 'true' : 'false'},\n`;
  });

  content += `    price: false
  });

  // Fetch products from database
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/${config.api}');
      if (res.ok) {
        const data = await res.json();
        
        const mappedProducts = data.map((p: any) => ({
          id: p.id,
          name: p.name,
          brand: p.brand,
`;

  // Add field mappings
  config.fields.forEach(field => {
    content += `          ${field.name}: p.${toSnakeCase(field.name)},\n`;
  });

  content += `          price: parseFloat(p.price),
          originalPrice: parseFloat(p.original_price),
          image: p.image || '/prod1.jpg',
          specs: Array.isArray(p.specs) ? p.specs : [],
          rating: parseFloat(p.rating) || 4.5,
          reviews: p.reviews || 0
        }));
        
        setProducts(mappedProducts);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      if (selectedBrands.length > 0 && !selectedBrands.includes(product.brand)) return false;
`;

  // Add filter logic
  config.fields.forEach(field => {
    const selectedVar = `selected${field.name.charAt(0).toUpperCase() + field.name.slice(1)}`;
    if (field.type === 'boolean') {
      content += `      if (${selectedVar}.length > 0) {
        const value = product.${field.name} ? 'Yes' : 'No';
        if (!${selectedVar}.includes(value)) return false;
      }
`;
    } else {
      content += `      if (${selectedVar}.length > 0 && !${selectedVar}.includes(product.${field.name})) return false;
`;
    }
  });

  content += `      if (product.price < priceRange[0] || product.price > priceRange[1]) return false;
      return true;
    });
  }, [products, selectedBrands, ${config.fields.map(f => `selected${f.name.charAt(0).toUpperCase() + f.name.slice(1)}`).join(', ')}, priceRange]);

  // Toggle functions
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleFilter = (value: string, selected: string[], setSelected: Function) => {
    if (selected.includes(value)) {
      setSelected(selected.filter((item: string) => item !== value));
    } else {
      setSelected([...selected, value]);
    }
  };

  const toggleCardExpansion = (productId: number) => {
    setExpandedCards(prev => ({ ...prev, [productId]: !prev[productId] }));
  };

  const clearAllFilters = () => {
    setSelectedBrands([]);
`;

  config.fields.forEach(field => {
    content += `    setSelected${field.name.charAt(0).toUpperCase() + field.name.slice(1)}([]);\n`;
  });

  content += `    setPriceRange([0, 100000]);
  };

  const FilterSection = ({ title, sectionKey, children }: any) => (
    <div className="border-b border-slate-200 last:border-0">
      <button
        onClick={() => toggleSection(sectionKey)}
        className="w-full py-4 px-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
      >
        <span className="font-semibold text-slate-800">{title}</span>
        {expandedSections[sectionKey] ? (
          <ChevronUp className="w-5 h-5 text-slate-600" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-600" />
        )}
      </button>
      {expandedSections[sectionKey] && (
        <div className="px-4 pb-4 space-y-2">{children}</div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">${config.title}</h1>
          <p className="text-lg md:text-xl opacity-90">${config.description}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm sticky top-4">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <h2 className="font-bold text-lg text-slate-800">Filters</h2>
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear All
                </button>
              </div>

              {/* Brand Filter */}
              <FilterSection title="Brand" sectionKey="brand">
                {brands.map(brand => (
                  <label key={brand} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded">
                    <Checkbox
                      checked={selectedBrands.includes(brand)}
                      onCheckedChange={() => toggleFilter(brand, selectedBrands, setSelectedBrands)}
                    />
                    <span className="text-sm text-slate-700">{brand}</span>
                  </label>
                ))}
              </FilterSection>

`;

  // Add filter sections
  config.fields.forEach(field => {
    const selectedVar = `selected${field.name.charAt(0).toUpperCase() + field.name.slice(1)}`;
    const setSelectedVar = `setSelected${field.name.charAt(0).toUpperCase() + field.name.slice(1)}`;
    
    if (field.type === 'boolean') {
      content += `              {/* ${field.label} Filter */}
              <FilterSection title="${field.label}" sectionKey="${field.name}">
                {['Yes', 'No'].map(value => (
                  <label key={value} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded">
                    <Checkbox
                      checked={${selectedVar}.includes(value)}
                      onCheckedChange={() => toggleFilter(value, ${selectedVar}, ${setSelectedVar})}
                    />
                    <span className="text-sm text-slate-700">{value}</span>
                  </label>
                ))}
              </FilterSection>

`;
    } else {
      content += `              {/* ${field.label} Filter */}
              <FilterSection title="${field.label}" sectionKey="${field.name}">
                {${field.name}Options.map(option => (
                  <label key={option} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded">
                    <Checkbox
                      checked={${selectedVar}.includes(option)}
                      onCheckedChange={() => toggleFilter(option, ${selectedVar}, ${setSelectedVar})}
                    />
                    <span className="text-sm text-slate-700">{option}</span>
                  </label>
                ))}
              </FilterSection>

`;
    }
  });

  content += `              {/* Price Range Filter */}
              <FilterSection title="Price Range" sectionKey="price">
                <div className="space-y-4">
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    min={0}
                    max={100000}
                    step={1000}
                    className="w-full"
                  />
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>₹{priceRange[0].toLocaleString()}</span>
                    <span>₹{priceRange[1].toLocaleString()}</span>
                  </div>
                </div>
              </FilterSection>
            </div>
          </aside>

          {/* Products Grid */}
          <main className="flex-1">
            <div className="mb-6 flex items-center justify-between">
              <p className="text-slate-600">
                Showing <span className="font-semibold text-slate-900">{filteredProducts.length}</span> products
              </p>
            </div>

            {loading ? (
              <div className="text-center py-20">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">Loading products...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-lg">
                <p className="text-gray-600 text-lg">No products found matching your filters.</p>
                <button
                  onClick={clearAllFilters}
                  className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col"
                  >
                    {/* Product Image */}
                    <div className="relative h-56 bg-gray-100 flex items-center justify-center">
                      {product.image ? (
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      ) : (
                        <span className="text-gray-400">No Image</span>
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
                      <div className="space-y-2 mb-4 bg-slate-50 p-3 rounded-lg">
`;

  // Add product detail displays
  config.fields.forEach(field => {
    if (field.type === 'boolean') {
      content += `                        <div className="flex items-center justify-between text-sm">
                          <span className="font-semibold text-slate-700 min-w-[70px]">${field.label}:</span>
                          <span className="text-slate-600">{product.${field.name} ? 'Yes' : 'No'}</span>
                        </div>
`;
    } else {
      content += `                        <div className="flex items-center justify-between text-sm">
                          <span className="font-semibold text-slate-700 min-w-[70px]">${field.label}:</span>
                          <span className="text-slate-600">{product.${field.name}}</span>
                        </div>
`;
    }
  });

  content += `                      </div>

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
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}
`;

  return content;
}

// Generate and save all category pages
console.log('🔄 Generating filtered category pages...\n');

categories.forEach(config => {
  const filePath = path.join(__dirname, 'app', 'categories', config.slug, 'page.tsx');
  const content = generateCategoryPage(config);
  
  fs.writeFileSync(filePath, content);
  console.log(`✅ Generated: ${config.title} (with filters and sidebar)`);
});

console.log('\n🎉 All category pages generated with filtered design!');
console.log('\nAll categories now have:');
console.log('  ✓ Filter sidebar with brand filter');
console.log('  ✓ Category-specific filters');
console.log('  ✓ Price range slider');
console.log('  ✓ Show More/Less functionality');
console.log('  ✓ Uniform card design');
console.log('  ✓ Database integration');
