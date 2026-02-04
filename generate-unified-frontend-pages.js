const fs = require('fs');
const path = require('path');

// Category configurations - each has its specific filters and fields
const categories = [
  {
    name: "HD Combo",
    slug: "hd-combo",
    apiEndpoint: "/api/hd-combo-products",
    tableName: "hd_combo_products",
    pageTitle: "HD Combo Kits",
    filters: {
      brands: ["Hikvision", "CP Plus", "Dahua", "Prama", "Secureye", "Zebronics", "Daichi", "Godrej"],
      channels: [2, 4, 8, 16],
      cameraTypes: ["Bullet", "Dome", "PTZ"],
      resolutions: ["2MP", "3MP", "4MP", "5MP", "8MP"],
      hddOptions: ["500GB", "1TB", "2TB", "4TB"],
      cableLengths: ["60 Meter", "90 Meter", "120 Meter", "180 Meter", "270 Meter"]
    },
    fields: [
      { dbField: "brand", label: "Brand", displayField: "brand" },
      { dbField: "channels", label: "Channels", displayField: "channels", suffix: " CH" },
      { dbField: "camera_type", label: "Camera", displayField: "cameraType" },
      { dbField: "resolution", label: "Resolution", displayField: "resolution" },
      { dbField: "hdd", label: "HDD", displayField: "hdd" },
      { dbField: "cable", label: "Cable", displayField: "cable" }
    ]
  },
  {
    name: "IP Combo",
    slug: "ip-combo",
    apiEndpoint: "/api/ip-combo-products",
    tableName: "ip_combo_products",
    pageTitle: "IP Combo Kits",
    filters: {
      brands: ["Hikvision", "CP Plus", "Dahua", "Prama", "Secureye", "Zebronics", "Daichi", "Godrej"],
      channels: [2, 4, 8, 16],
      cameraTypes: ["Bullet", "Dome", "PTZ"],
      resolutions: ["2MP", "3MP", "4MP", "5MP", "8MP"],
      hddOptions: ["500GB", "1TB", "2TB", "4TB"],
      cableLengths: ["60 Meter", "90 Meter", "120 Meter", "180 Meter", "270 Meter"]
    },
    fields: [
      { dbField: "brand", label: "Brand", displayField: "brand" },
      { dbField: "channels", label: "Channels", displayField: "channels", suffix: " CH" },
      { dbField: "camera_type", label: "Camera", displayField: "cameraType" },
      { dbField: "resolution", label: "Resolution", displayField: "resolution" },
      { dbField: "hdd", label: "HDD", displayField: "hdd" },
      { dbField: "cable", label: "Cable", displayField: "cable" }
    ]
  },
  {
    name: "WiFi Camera",
    slug: "wifi-camera",
    apiEndpoint: "/api/wifi-camera-products",
    tableName: "wifi_camera_products",
    pageTitle: "WiFi Cameras",
    filters: {
      brands: ["Hikvision", "CP Plus", "Dahua", "Prama", "Secureye", "Zebronics", "Daichi", "Godrej"],
      resolutions: ["2MP", "3MP", "4MP", "5MP", "8MP"],
      connectivity: ["WiFi", "Dual Antenna"],
      powerSupply: ["DC Adapter", "PoE"],
      nightVision: ["10M", "20M", "30M", "40M"]
    },
    fields: [
      { dbField: "brand", label: "Brand", displayField: "brand" },
      { dbField: "resolution", label: "Resolution", displayField: "resolution" },
      { dbField: "connectivity", label: "Connectivity", displayField: "connectivity" },
      { dbField: "power_supply", label: "Power", displayField: "powerSupply" },
      { dbField: "night_vision", label: "Night Vision", displayField: "nightVision" }
    ]
  },
  {
    name: "4G SIM Camera",
    slug: "4g-sim-camera",
    apiEndpoint: "/api/sim-4g-camera-products",
    tableName: "sim_4g_camera_products",
    pageTitle: "4G SIM Cameras",
    filters: {
      brands: ["Hikvision", "CP Plus", "Dahua", "Prama", "Secureye", "Zebronics", "Daichi", "Godrej"],
      resolutions: ["2MP", "3MP", "4MP", "5MP", "8MP"],
      simSupport: ["Single SIM", "Dual SIM"],
      storage: ["32GB", "64GB", "128GB", "256GB"],
      powerSupply: ["DC Adapter", "Solar", "Battery"]
    },
    fields: [
      { dbField: "brand", label: "Brand", displayField: "brand" },
      { dbField: "resolution", label: "Resolution", displayField: "resolution" },
      { dbField: "sim_support", label: "SIM Support", displayField: "simSupport" },
      { dbField: "storage", label: "Storage", displayField: "storage" },
      { dbField: "power_supply", label: "Power", displayField: "powerSupply" }
    ]
  },
  {
    name: "Solar Camera",
    slug: "solar-camera",
    apiEndpoint: "/api/solar-camera-products",
    tableName: "solar_camera_products",
    pageTitle: "Solar Cameras",
    filters: {
      brands: ["Hikvision", "CP Plus", "Dahua", "Prama", "Secureye", "Zebronics", "Daichi", "Godrej"],
      resolutions: ["2MP", "3MP", "4MP", "5MP", "8MP"],
      solarPanel: ["10W", "20W", "30W", "40W"],
      battery: ["5000mAh", "10000mAh", "15000mAh", "20000mAh"],
      connectivity: ["WiFi", "4G SIM"]
    },
    fields: [
      { dbField: "brand", label: "Brand", displayField: "brand" },
      { dbField: "resolution", label: "Resolution", displayField: "resolution" },
      { dbField: "solar_panel", label: "Solar Panel", displayField: "solarPanel" },
      { dbField: "battery", label: "Battery", displayField: "battery" },
      { dbField: "connectivity", label: "Connectivity", displayField: "connectivity" }
    ]
  },
  {
    name: "Body Worn Camera",
    slug: "body-worn-camera",
    apiEndpoint: "/api/body-worn-camera-products",
    tableName: "body_worn_camera_products",
    pageTitle: "Body Worn Cameras",
    filters: {
      brands: ["Hikvision", "CP Plus", "Dahua", "Prama", "Secureye", "Zebronics", "Daichi", "Godrej"],
      resolutions: ["1080P", "2K", "4K"],
      storage: ["32GB", "64GB", "128GB", "256GB"],
      battery: ["2000mAh", "3000mAh", "4000mAh", "5000mAh"],
      features: ["Night Vision", "GPS", "WiFi", "Live Streaming"]
    },
    fields: [
      { dbField: "brand", label: "Brand", displayField: "brand" },
      { dbField: "resolution", label: "Resolution", displayField: "resolution" },
      { dbField: "storage", label: "Storage", displayField: "storage" },
      { dbField: "battery", label: "Battery", displayField: "battery" },
      { dbField: "features", label: "Features", displayField: "features" }
    ]
  },
  {
    name: "HD Camera",
    slug: "hd-camera",
    apiEndpoint: "/api/hd-camera-products",
    tableName: "hd_camera_products",
    pageTitle: "HD Cameras",
    filters: {
      brands: ["Hikvision", "CP Plus", "Dahua", "Prama", "Secureye", "Zebronics", "Daichi", "Godrej"],
      cameraTypes: ["Bullet", "Dome", "PTZ"],
      resolutions: ["1MP", "2MP", "3MP", "4MP", "5MP"],
      lensSize: ["2.8mm", "3.6mm", "6mm", "8mm", "12mm"],
      nightVision: ["20M", "30M", "40M", "50M"]
    },
    fields: [
      { dbField: "brand", label: "Brand", displayField: "brand" },
      { dbField: "camera_type", label: "Camera Type", displayField: "cameraType" },
      { dbField: "resolution", label: "Resolution", displayField: "resolution" },
      { dbField: "lens_size", label: "Lens", displayField: "lensSize" },
      { dbField: "night_vision", label: "Night Vision", displayField: "nightVision" }
    ]
  },
  {
    name: "IP Camera",
    slug: "ip-camera",
    apiEndpoint: "/api/ip-camera-products",
    tableName: "ip_camera_products",
    pageTitle: "IP Cameras",
    filters: {
      brands: ["Hikvision", "CP Plus", "Dahua", "Prama", "Secureye", "Zebronics", "Daichi", "Godrej"],
      cameraTypes: ["Bullet", "Dome", "PTZ"],
      resolutions: ["2MP", "3MP", "4MP", "5MP", "8MP"],
      lensSize: ["2.8mm", "3.6mm", "6mm", "8mm", "12mm"],
      nightVision: ["20M", "30M", "40M", "50M"]
    },
    fields: [
      { dbField: "brand", label: "Brand", displayField: "brand" },
      { dbField: "camera_type", label: "Camera Type", displayField: "cameraType" },
      { dbField: "resolution", label: "Resolution", displayField: "resolution" },
      { dbField: "lens_size", label: "Lens", displayField: "lensSize" },
      { dbField: "night_vision", label: "Night Vision", displayField: "nightVision" }
    ]
  }
];

// Helper to convert slug to component name
function toComponentName(slug) {
  return slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
}

// Helper to convert slug to camelCase
function toCamelCase(slug) {
  const parts = slug.split('-');
  return parts[0] + parts.slice(1).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
}

// Generate filter sections based on category filters
function generateFilterSections(category) {
  const sections = [];
  const filters = category.filters;
  
  // Brand filter - always first
  if (filters.brands) {
    sections.push({
      key: 'brand',
      title: 'Brand',
      stateVar: 'selectedBrands',
      items: filters.brands.map(b => `"${b}"`).join(', '),
      itemRender: 'brand',
      displayText: 'brand'
    });
  }
  
  // Channels filter (for combo kits)
  if (filters.channels) {
    sections.push({
      key: 'channel',
      title: 'Channel',
      stateVar: 'selectedChannels',
      items: filters.channels.join(', '),
      itemRender: 'channel',
      displayText: 'channel + " Channel"'
    });
  }
  
  // Camera Type filter
  if (filters.cameraTypes) {
    sections.push({
      key: 'cameraType',
      title: 'Camera Type',
      stateVar: 'selectedCameraTypes',
      items: filters.cameraTypes.map(t => `"${t}"`).join(', '),
      itemRender: 'type',
      displayText: 'type'
    });
  }
  
  // Resolution filter
  if (filters.resolutions) {
    sections.push({
      key: 'resolution',
      title: 'Resolution',
      stateVar: 'selectedResolutions',
      items: filters.resolutions.map(r => `"${r}"`).join(', '),
      itemRender: 'res',
      displayText: 'res'
    });
  }
  
  // HDD filter (for combo kits)
  if (filters.hddOptions) {
    sections.push({
      key: 'hdd',
      title: 'Hard Disk',
      stateVar: 'selectedHDD',
      items: filters.hddOptions.map(h => `"${h}"`).join(', '),
      itemRender: 'hdd',
      displayText: 'hdd'
    });
  }
  
  // Cable Length filter (for combo kits)
  if (filters.cableLengths) {
    sections.push({
      key: 'cable',
      title: 'Cable Length (Optional)',
      stateVar: 'selectedCable',
      items: filters.cableLengths.map(c => `"${c}"`).join(', '),
      itemRender: 'cable',
      displayText: 'cable'
    });
  }
  
  // Connectivity filter
  if (filters.connectivity) {
    sections.push({
      key: 'connectivity',
      title: 'Connectivity',
      stateVar: 'selectedConnectivity',
      items: filters.connectivity.map(c => `"${c}"`).join(', '),
      itemRender: 'conn',
      displayText: 'conn'
    });
  }
  
  // Power Supply filter
  if (filters.powerSupply) {
    sections.push({
      key: 'powerSupply',
      title: 'Power Supply',
      stateVar: 'selectedPowerSupply',
      items: filters.powerSupply.map(p => `"${p}"`).join(', '),
      itemRender: 'power',
      displayText: 'power'
    });
  }
  
  // Night Vision filter
  if (filters.nightVision) {
    sections.push({
      key: 'nightVision',
      title: 'Night Vision',
      stateVar: 'selectedNightVision',
      items: filters.nightVision.map(n => `"${n}"`).join(', '),
      itemRender: 'nv',
      displayText: 'nv'
    });
  }
  
  // SIM Support filter
  if (filters.simSupport) {
    sections.push({
      key: 'simSupport',
      title: 'SIM Support',
      stateVar: 'selectedSimSupport',
      items: filters.simSupport.map(s => `"${s}"`).join(', '),
      itemRender: 'sim',
      displayText: 'sim'
    });
  }
  
  // Storage filter
  if (filters.storage) {
    sections.push({
      key: 'storage',
      title: 'Storage',
      stateVar: 'selectedStorage',
      items: filters.storage.map(s => `"${s}"`).join(', '),
      itemRender: 'storage',
      displayText: 'storage'
    });
  }
  
  // Solar Panel filter
  if (filters.solarPanel) {
    sections.push({
      key: 'solarPanel',
      title: 'Solar Panel',
      stateVar: 'selectedSolarPanel',
      items: filters.solarPanel.map(s => `"${s}"`).join(', '),
      itemRender: 'panel',
      displayText: 'panel'
    });
  }
  
  // Battery filter
  if (filters.battery) {
    sections.push({
      key: 'battery',
      title: 'Battery',
      stateVar: 'selectedBattery',
      items: filters.battery.map(b => `"${b}"`).join(', '),
      itemRender: 'battery',
      displayText: 'battery'
    });
  }
  
  // Features filter
  if (filters.features) {
    sections.push({
      key: 'features',
      title: 'Features',
      stateVar: 'selectedFeatures',
      items: filters.features.map(f => `"${f}"`).join(', '),
      itemRender: 'feature',
      displayText: 'feature'
    });
  }
  
  // Lens Size filter
  if (filters.lensSize) {
    sections.push({
      key: 'lensSize',
      title: 'Lens Size',
      stateVar: 'selectedLensSize',
      items: filters.lensSize.map(l => `"${l}"`).join(', '),
      itemRender: 'lens',
      displayText: 'lens'
    });
  }
  
  return sections;
}

// Generate filter state declarations
function generateFilterStates(sections) {
  return sections.map(section => {
    const defaultValue = section.stateVar === 'selectedChannels' ? '[]' : '[]';
    return `  const [${section.stateVar}, set${section.stateVar.charAt(0).toUpperCase() + section.stateVar.slice(1)}] = useState<${section.stateVar === 'selectedChannels' ? 'number[]' : 'string[]'}>(${defaultValue});`;
  }).join('\n');
}

// Generate filter conditions for product filtering
function generateFilterConditions(category) {
  const conditions = [];
  const filters = category.filters;
  
  if (filters.brands) conditions.push('if (selectedBrands.length > 0 && !selectedBrands.includes(product.brand)) return false;');
  if (filters.channels) conditions.push('if (selectedChannels.length > 0 && !selectedChannels.includes(product.channels)) return false;');
  if (filters.cameraTypes) conditions.push('if (selectedCameraTypes.length > 0 && !selectedCameraTypes.includes(product.cameraType)) return false;');
  if (filters.resolutions) conditions.push('if (selectedResolutions.length > 0 && !selectedResolutions.includes(product.resolution)) return false;');
  if (filters.hddOptions) conditions.push('if (selectedHDD.length > 0 && !selectedHDD.includes(product.hdd)) return false;');
  if (filters.cableLengths) conditions.push('if (selectedCable.length > 0 && !selectedCable.includes(product.cable)) return false;');
  if (filters.connectivity) conditions.push('if (selectedConnectivity.length > 0 && !selectedConnectivity.includes(product.connectivity)) return false;');
  if (filters.powerSupply) conditions.push('if (selectedPowerSupply.length > 0 && !selectedPowerSupply.includes(product.powerSupply)) return false;');
  if (filters.nightVision) conditions.push('if (selectedNightVision.length > 0 && !selectedNightVision.includes(product.nightVision)) return false;');
  if (filters.simSupport) conditions.push('if (selectedSimSupport.length > 0 && !selectedSimSupport.includes(product.simSupport)) return false;');
  if (filters.storage) conditions.push('if (selectedStorage.length > 0 && !selectedStorage.includes(product.storage)) return false;');
  if (filters.solarPanel) conditions.push('if (selectedSolarPanel.length > 0 && !selectedSolarPanel.includes(product.solarPanel)) return false;');
  if (filters.battery) conditions.push('if (selectedBattery.length > 0 && !selectedBattery.includes(product.battery)) return false;');
  if (filters.features) conditions.push('if (selectedFeatures.length > 0 && !selectedFeatures.includes(product.features)) return false;');
  if (filters.lensSize) conditions.push('if (selectedLensSize.length > 0 && !selectedLensSize.includes(product.lensSize)) return false;');
  
  return conditions.join('\n      ');
}

// Generate clear all filters function
function generateClearAllFilters(sections) {
  return sections.map(section => {
    return `set${section.stateVar.charAt(0).toUpperCase() + section.stateVar.slice(1)}([]);`;
  }).join('\n                      ');
}

// Generate product interface based on fields
function generateProductInterface(category) {
  const baseFields = `  id: number;
  name: string;`;
  
  const categoryFields = category.fields.map(field => {
    if (field.dbField === 'channels') {
      return `  ${field.displayField}: number;`;
    } else {
      return `  ${field.displayField}: string;`;
    }
  }).join('\n');
  
  const commonFields = `  price: number;
  originalPrice: number;
  image: string;
  specs: string[];
  rating: number;
  reviews: number;`;
  
  return `${baseFields}\n${categoryFields}\n${commonFields}`;
}

// Generate product mapping
function generateProductMapping(category) {
  const mappings = category.fields.map(field => {
    return `          ${field.displayField}: p.${field.dbField},`;
  }).join('\n');
  
  return mappings;
}

// Generate product detail rows
function generateProductDetailRows(category) {
  return category.fields.map(field => {
    const suffix = field.suffix || '';
    return `                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-semibold text-slate-700 min-w-[70px]">${field.label}:</span>
                            <span className="text-slate-600">{product.${field.displayField}}${suffix}</span>
                          </div>`;
  }).join('\n');
}

// Generate filter sections JSX
function generateFilterSectionsJSX(sections) {
  return sections.map(section => {
    return `                {/* ${section.title} Filter */}
                <FilterSection title="${section.title}" sectionKey="${section.key}">
                  {${section.key === 'channel' ? 'channels' : section.key + 's'}.map(${section.itemRender} => (
                    <label key={${section.itemRender}} className="flex items-center gap-2 cursor-pointer group">
                      <Checkbox
                        checked={${section.stateVar}.includes(${section.itemRender})}
                        onCheckedChange={() => toggleFilter(${section.itemRender}, ${section.stateVar}, set${section.stateVar.charAt(0).toUpperCase() + section.stateVar.slice(1)})}
                      />
                      <span className="text-sm text-slate-700 group-hover:text-slate-900">
                        {${section.displayText}}
                      </span>
                    </label>
                  ))}
                </FilterSection>`;
  }).join('\n\n');
}

// Generate filter constant declarations
function generateFilterConstants(category) {
  const constants = [];
  const filters = category.filters;
  
  if (filters.brands) {
    constants.push(`const brands = [${filters.brands.map(b => `"${b}"`).join(', ')}];`);
  }
  if (filters.channels) {
    constants.push(`const channels = [${filters.channels.join(', ')}];`);
  }
  if (filters.cameraTypes) {
    constants.push(`const cameraTypes = [${filters.cameraTypes.map(t => `"${t}"`).join(', ')}];`);
  }
  if (filters.resolutions) {
    constants.push(`const resolutions = [${filters.resolutions.map(r => `"${r}"`).join(', ')}];`);
  }
  if (filters.hddOptions) {
    constants.push(`const hddOptions = [${filters.hddOptions.map(h => `"${h}"`).join(', ')}];`);
  }
  if (filters.cableLengths) {
    constants.push(`const cableLengths = [${filters.cableLengths.map(c => `"${c}"`).join(', ')}];`);
  }
  if (filters.connectivity) {
    constants.push(`const connectivityOptions = [${filters.connectivity.map(c => `"${c}"`).join(', ')}];`);
  }
  if (filters.powerSupply) {
    constants.push(`const powerSupplyOptions = [${filters.powerSupply.map(p => `"${p}"`).join(', ')}];`);
  }
  if (filters.nightVision) {
    constants.push(`const nightVisionOptions = [${filters.nightVision.map(n => `"${n}"`).join(', ')}];`);
  }
  if (filters.simSupport) {
    constants.push(`const simSupportOptions = [${filters.simSupport.map(s => `"${s}"`).join(', ')}];`);
  }
  if (filters.storage) {
    constants.push(`const storageOptions = [${filters.storage.map(s => `"${s}"`).join(', ')}];`);
  }
  if (filters.solarPanel) {
    constants.push(`const solarPanelOptions = [${filters.solarPanel.map(s => `"${s}"`).join(', ')}];`);
  }
  if (filters.battery) {
    constants.push(`const batteryOptions = [${filters.battery.map(b => `"${b}"`).join(', ')}];`);
  }
  if (filters.features) {
    constants.push(`const featuresOptions = [${filters.features.map(f => `"${f}"`).join(', ')}];`);
  }
  if (filters.lensSize) {
    constants.push(`const lensSizeOptions = [${filters.lensSize.map(l => `"${l}"`).join(', ')}];`);
  }
  
  return constants.join('\n');
}

// Generate expanded sections default state
function generateExpandedSectionsDefault(sections) {
  const defaults = sections.map((section, index) => {
    return `    ${section.key}: ${index < 2 ? 'true' : 'false'}`;
  }).join(',\n');
  return `{\n${defaults}\n  }`;
}

// Generate the page template
function generatePageTemplate(category) {
  const componentName = toComponentName(category.slug) + 'Page';
  const filterSections = generateFilterSections(category);
  const filterStates = generateFilterStates(filterSections);
  const filterConditions = generateFilterConditions(category);
  const clearAllFilters = generateClearAllFilters(filterSections);
  const productInterface = generateProductInterface(category);
  const productMapping = generateProductMapping(category);
  const productDetailRows = generateProductDetailRows(category);
  const filterSectionsJSX = generateFilterSectionsJSX(filterSections);
  const filterConstants = generateFilterConstants(category);
  const expandedSectionsDefault = generateExpandedSectionsDefault(filterSections);
  const filterVarsList = filterSections.map(s => s.stateVar).join(', ');
  
  return `"use client";

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

// Product interface
interface Product {
${productInterface}
}

// Filter options
${filterConstants}

export default function ${componentName}() {
  const router = useRouter();
  
  // Products from database
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Expanded state for each product card
  const [expandedCards, setExpandedCards] = useState<Record<number, boolean>>({});
  
  // Filter states
${filterStates}
  const [priceRange, setPriceRange] = useState<number[]>([0, 100000]);
  
  // Filter section collapse states
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(${expandedSectionsDefault});

  // Fetch products from database
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch('${category.apiEndpoint}');
      const data = await res.json();
      console.log('API Response:', data);
      if (data.success) {
        // Map database fields to frontend format
        const mappedProducts = data.products.map((p: any) => ({
          id: p.id,
          name: p.name,
${productMapping}
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
      ${filterConditions}
      if (product.price < priceRange[0] || product.price > priceRange[1]) return false;
      return true;
    });
    console.log('Filtered Products:', filtered);
    console.log('Total Products:', products.length);
    console.log('Filters Active:', { ${filterVarsList}, priceRange });
    return filtered;
  }, [${filterVarsList}, priceRange, products]);

  const FilterSection = ({ 
    title, 
    sectionKey, 
    children 
  }: { 
    title: string; 
    sectionKey: string; 
    children: React.ReactNode;
  }) => (
    <div className="border-b border-slate-200 pb-4 mb-4">
      <button
        onClick={() => toggleSection(sectionKey)}
        className="flex items-center justify-between w-full text-left mb-3"
      >
        <h3 className="font-bold text-slate-900 text-sm uppercase">{title}</h3>
        {expandedSections[sectionKey] ? (
          <ChevronUp className="w-4 h-4 text-slate-600" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-600" />
        )}
      </button>
      {expandedSections[sectionKey] && <div className="space-y-2">{children}</div>}
    </div>
  );

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
            <span className="text-slate-900 font-medium">${category.name}</span>
          </div>

          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
              ${category.pageTitle}
            </h1>
            <p className="text-slate-600">
              Showing {filteredProducts.length} out of {products.length} Products
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Sidebar - Filters */}
            <aside className="lg:w-64 flex-shrink-0">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-bold text-lg text-slate-900">Filters</h2>
                  <button 
                    onClick={() => {
                      ${clearAllFilters}
                      setPriceRange([0, 100000]);
                    }}
                    className="text-sm text-[#e63946] hover:underline"
                  >
                    Clear All
                  </button>
                </div>

${filterSectionsJSX}

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
${productDetailRows}
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
                                {isExpanded ? '− Show Less' : \`+ Show More (\${product.specs.length - 2} more)\`}
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

                        {/* Button */}
                        <Button
                          className="w-full bg-[#e63946] hover:bg-[#d62839] text-white"
                        >
                          Add to Cart
                        </Button>
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
                      ${clearAllFilters}
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
`;
}

// Generate all category pages
console.log('Generating unified frontend pages for all categories...\n');

categories.forEach(category => {
  const pageContent = generatePageTemplate(category);
  const pagePath = path.join(__dirname, 'app', 'categories', category.slug, 'page.tsx');
  
  // Create directory if it doesn't exist
  const pageDir = path.dirname(pagePath);
  if (!fs.existsSync(pageDir)) {
    fs.mkdirSync(pageDir, { recursive: true });
  }
  
  // Write the file
  fs.writeFileSync(pagePath, pageContent);
  console.log(`✅ Generated: ${category.name} (${category.slug})`);
});

console.log('\n✅ All category frontend pages generated successfully!');
console.log('All pages now have the exact same structure with category-specific filters and fields.');
