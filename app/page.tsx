"use client";
import { useState, useEffect, useMemo, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { useCart } from "@/components/cart-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import ThumbnailCarousel from "@/components/ui/thumbnail-carousel";
import { SplineSceneBasic } from "@/components/ui/demo";
import Image from "next/image";
import {
  motion,
  type Variants,
} from "framer-motion";

import {
  Shield,
  MapPin,
  Star,
  DollarSign,
  Search,
  Camera,
  Network,
  Settings,
  Monitor,
  HardDrive,
  MessageSquare,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Info,
  Plus,
  Minus,
  Box,
  Cable,
  Smartphone,
  User,
  FileText,
  Lock,
  Check,
  Wrench,
  Calendar,
  Zap
} from "lucide-react";

// --- DATA CONSTANTS ---
// Fallback constants in case API fails
const FALLBACK_BRANDS = ["Hikvision", "CP Plus", "Honeywell", "Dahua"];

const CHANNEL_DETAILS: Record<number, string[]> = {
  4: ["Supports up to 4 Cameras", "1080p/5MP Lite Resolution", "1 SATA Port (Up to 6TB)", "H.265+ Compression"],
  8: ["Supports up to 8 Cameras", "5MP Real-time Resolution Support", "1 SATA Port (Up to 10TB)", "Smart Search Features"],
  16: ["Supports up to 16 Cameras", "4K Output / 5MP Multi-channel", "2 SATA Ports (Up to 20TB)", "Advanced Analytics"]
};

const FALLBACK_TECH_TYPE_PRICES: Record<string, number> = {
  "HD Non Audio": 1200,
  "HD Audio": 1500,
  "HD Smart Hybrid": 1800,
  "HD Full Color": 2200,
};

const FALLBACK_STORAGE_OPTIONS = [
  { label: "500GB", price: 2200 },
  { label: "1TB", price: 4100 },
  { label: "2TB", price: 6200 },
  { label: "4TB", price: 9800 },
];

const CABLE_OPTIONS = [
  { label: "None", price: 0 },
  { label: "90 Meters Roll", price: 1800 },
  { label: "180 Meters Roll", price: 3200 },
  { label: "305 Meters Roll", price: 5500 },
];

const ACCESSORY_PRICES: Record<string, number> = {
  "BNC Connectors (Pack)": 450,
  "DC Pins (Pack)": 250,
  "SMPS Power Box": 1200,
};

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 60 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
  },
};

const heroVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 1, ease: [0.16, 1, 0.3, 1] },
  },
};

const BlinkingDot = () => (
  <span className="inline-flex items-center mr-3">
    <span className="relative flex h-3 w-3">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#e63946] opacity-75"></span>
      <span className="relative inline-flex rounded-full h-3 w-3 bg-[#e63946]"></span>
    </span>
  </span>
);

type BestsellerProduct = {
  id: number;
  product_name: string;
  brand_name: string;
  base_price: number;
  original_price: number | null;
  price_note: string;
  image: string | null;
  product_description: string;
  product_specifications: string;
  segment: string;
  sold: number;
};

type BusinessBestsellerSection = {
  business_key: string;
  business_name: string;
  products: BestsellerProduct[];
};

const mapBestsellerProduct = (product: any): BestsellerProduct => ({
  id: Number(product.id) || 0,
  product_name: product.product_name || '',
  brand_name: product.brand_name || '',
  base_price: Number(product.base_price) || 0,
  original_price: product.original_price !== null ? Number(product.original_price) || null : null,
  price_note: product.price_note || '',
  image: product.image || '/pdt.png',
  product_description: product.product_description || '',
  product_specifications: product.product_specifications || '',
  segment: product.segment || 'CCTV',
  sold: Number(product.sold) || 0,
});

export default function HomePage() {
  const router = useRouter();
  const { addToCart, setIsCartOpen } = useCart();

  // --- NEW STATE: BOOKING TYPE ---
  const [bookingType, setBookingType] = useState<string | null>(null);

  // --- QUOTATION SETTINGS STATE (from API) ---
  const [quotationSettings, setQuotationSettings] = useState<any>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);

  // Dynamic data from API
  const BRANDS = useMemo(() => {
    return quotationSettings?.brands?.map((b: any) => b.name) || FALLBACK_BRANDS;
  }, [quotationSettings]);

  const STORAGE_OPTIONS = useMemo(() => {
    return quotationSettings?.storage?.map((s: any) => ({ 
      label: s.capacity, 
      price: parseFloat(s.price) || 0,
      hd_price: parseFloat(s.hd_price) || parseFloat(s.price) || 0,
      ip_price: parseFloat(s.ip_price) || parseFloat(s.price) || 0
    })) || FALLBACK_STORAGE_OPTIONS;
  }, [quotationSettings]);

  const CABLE_PRICES = useMemo(() => {
    const prices: Record<string, number> = { "None": 0 };
    if (quotationSettings?.cables) {
      quotationSettings.cables.forEach((c: any) => {
        prices[c.name] = parseFloat(c.price);
      });
    }
    return prices;
  }, [quotationSettings]);

  const ACCESSORY_PRICES_DB = useMemo(() => {
    const prices: Record<string, number> = {};
    if (quotationSettings?.accessories) {
      quotationSettings.accessories.forEach((a: any) => {
        prices[a.name] = parseFloat(a.price);
      });
    }
    return prices;
  }, [quotationSettings]);

  const TECH_TYPE_PRICES = useMemo(() => {
    const prices: Record<string, { hd: number, ip: number }> = {};
    if (quotationSettings?.techTypes) {
      quotationSettings.techTypes.forEach((t: any) => {
        prices[t.name] = {
          hd: parseFloat(t.hd_price) || parseFloat(t.base_price) || 0,
          ip: parseFloat(t.ip_price) || parseFloat(t.base_price) || 0
        };
      });
      console.log('📊 Tech Type Prices Loaded:', prices);
    }
    return prices;
  }, [quotationSettings]);

  const CAMERA_TYPES = useMemo(() => {
    const types = quotationSettings?.cameraTypes?.map((c: any) => c.name.trim()) || ["IP", "HD"];
    console.log('📊 Camera Types Available:', types);
    return types;
  }, [quotationSettings]);

  const CHANNEL_OPTIONS = useMemo(() => {
    return quotationSettings?.channels?.map((ch: any) => ({
      value: ch.channel_count,
      label: `${ch.channel_count} Ch`,
      price: parseFloat(ch.price) || 0,
      features: Array.isArray(ch.features) ? ch.features : JSON.parse(ch.features || '[]')
    })) || [
      { value: 4, label: "4 Ch", price: 0, features: [] },
      { value: 8, label: "8 Ch", price: 0, features: [] },
      { value: 16, label: "16 Ch", price: 0, features: [] }
    ];
  }, [quotationSettings]);

  // Base Component Pricing (Camera Type, Brand, Pixel)
  const CAMERA_TYPE_PRICES = useMemo(() => {
    const prices: Record<string, number> = {};
    if (quotationSettings?.cameraTypes) {
      quotationSettings.cameraTypes.forEach((ct: any) => {
        const name = ct.name.trim(); // Trim to handle "HD " -> "HD"
        prices[name] = parseFloat(ct.price) || 0;
      });
      console.log('📊 Camera Type Prices Loaded:', prices);
    }
    return prices;
  }, [quotationSettings]);

  const BRAND_PRICES = useMemo(() => {
    const prices: Record<string, { hd: number, ip: number }> = {};
    if (quotationSettings?.brands) {
      quotationSettings.brands.forEach((b: any) => {
        prices[b.name] = {
          hd: parseFloat(b.hd_price) || 0,
          ip: parseFloat(b.ip_price) || 0
        };
      });
    }
    return prices;
  }, [quotationSettings]);

  const PIXEL_PRICES = useMemo(() => {
    const prices: Record<string, number> = {};
    if (quotationSettings?.pixels) {
      quotationSettings.pixels.forEach((px: any) => {
        prices[px.name] = parseFloat(px.price) || 0;
      });
      console.log('📊 Pixel Prices Loaded:', prices);
    }
    return prices;
  }, [quotationSettings]);

  const PIXEL_OPTIONS = useMemo(() => {
    return quotationSettings?.pixels?.map((p: any) => p.name) || ["2MP", "5MP"];
  }, [quotationSettings]);

  // --- CORE STATE ---
  const [cameraType, setCameraType] = useState("");
  const [brand, setBrand] = useState("");
  const [channels, setChannels] = useState<number | "">("");
  const [pixelDefault, setPixelDefault] = useState("");
  const [modelNumber, setModelNumber] = useState("");
  const [storage, setStorage] = useState("");
  const [location, setLocation] = useState("");
  const [pincode, setPincode] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [cableOption, setCableOption] = useState("None");
  const [hdCableQty, setHdCableQty] = useState(1);
  const [includeAccessories, setIncludeAccessories] = useState(false);
  const [includeInstallation, setIncludeInstallation] = useState(false);

  // --- NEW STATE: Installation Date & Tools Checkbox ---
  const [installationDate, setInstallationDate] = useState("");
  const [useAutomatedTools, setUseAutomatedTools] = useState(false);

  // Lead Verification States
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custEmail, setCustEmail] = useState("");
  const [custAddress, setCustAddress] = useState("");
  const [custCity, setCustCity] = useState("");
  const [custState, setCustState] = useState("");
  const [custLandmark, setCustLandmark] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [currentDate, setCurrentDate] = useState("");

  // Availability State
  const [availabilityMessage, setAvailabilityMessage] = useState("");
  
  // Order Submission States
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [createdOrderNumber, setCreatedOrderNumber] = useState("");

  // Bestseller products state
  const [businessBestsellerSections, setBusinessBestsellerSections] = useState<BusinessBestsellerSection[]>([]);
  const [loadingBestsellers, setLoadingBestsellers] = useState(true);
  const [canScrollCategoryLeft, setCanScrollCategoryLeft] = useState(false);
  const [canScrollCategoryRight, setCanScrollCategoryRight] = useState(false);
  const bestsellerScrollRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [bestsellerArrowState, setBestsellerArrowState] = useState<Record<string, { left: boolean; right: boolean }>>({});
  const [bestsellerSearchTerms, setBestsellerSearchTerms] = useState<Record<string, string>>({});
  const [searchingBestsellerSections, setSearchingBestsellerSections] = useState<Record<string, boolean>>({});

  // Initialize with fallback tech types
  const getInitialTechTypes = () => {
    const types = Object.keys(TECH_TYPE_PRICES);
    const initial: any = {};
    const pixels = PIXEL_OPTIONS.length > 0 ? PIXEL_OPTIONS : ["2MP", "5MP"];
    types.forEach(type => {
      const pixelObj: any = {};
      pixels.forEach((px: string) => {
        pixelObj[px] = 0;
      });
      initial[type] = pixelObj;
    });
    return initial;
  };

  const [indoorSubTypes, setIndoorSubTypes] = useState(() => getInitialTechTypes());
  const [outdoorSubTypes, setOutdoorSubTypes] = useState(() => getInitialTechTypes());

  // Effects
  useEffect(() => {
    // Fetch quotation settings from API
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/quotation-settings', {
          cache: 'no-store',
        });
        if (response.ok) {
          const data = await response.json();
          setQuotationSettings(data);
          // Set default pixel option
          if (data.pixels && data.pixels.length > 0 && !pixelDefault) {
            setPixelDefault(data.pixels[0].name);
          }
        }
      } catch (error) {
        console.error('Failed to fetch quotation settings:', error);
      } finally {
        setLoadingSettings(false);
      }
    };
    fetchSettings();
  }, []);

  // Reinitialize tech types when quotation settings change
  useEffect(() => {
    if (quotationSettings?.techTypes) {
      const types = quotationSettings.techTypes.map((t: any) => t.name);
      const initial: any = {};
      types.forEach((type: string) => {
        initial[type] = { "2MP": 0, "5MP": 0 };
      });
      if (Object.keys(initial).length > 0) {
        setIndoorSubTypes(initial);
        setOutdoorSubTypes(initial);
      }
    }
  }, [quotationSettings]);

  useEffect(() => {
    if (brand && cameraType && channels) {
      const typeCode = cameraType === 'IP' ? 'NX' : 'DX';
      const brandCode = brand.substring(0, 3).toUpperCase();
      setModelNumber(`${brandCode}-${typeCode}-${channels}-${pixelDefault}`);
    } else {
      setModelNumber("");
    }
  }, [brand, cameraType, channels, pixelDefault]);

  const indoorQty: number = useMemo(() => {
    return Object.values(indoorSubTypes).reduce((acc: number, p: any) => {
      return acc + Object.values(p).reduce((sum: number, val: any) => sum + (Number(val) || 0), 0);
    }, 0);
  }, [indoorSubTypes]);
  
  const outdoorQty: number = useMemo(() => {
    return Object.values(outdoorSubTypes).reduce((acc: number, p: any) => {
      return acc + Object.values(p).reduce((sum: number, val: any) => sum + (Number(val) || 0), 0);
    }, 0);
  }, [outdoorSubTypes]);
  
  const totalCameraCount: number = indoorQty + outdoorQty;

  const has5MPCameras = useMemo(() => {
    const check = (sub: any) => {
      return Object.values(sub).some((p: any) => {
        return Object.entries(p).some(([pixel, count]: [string, any]) => pixel !== "2MP" && count > 0);
      });
    };
    return check(indoorSubTypes) || check(outdoorSubTypes);
  }, [indoorSubTypes, outdoorSubTypes]);

  useEffect(() => {
    if (has5MPCameras && PIXEL_OPTIONS.length > 1) {
      // Set to the second pixel option if available (typically 5MP or higher)
      setPixelDefault(PIXEL_OPTIONS[1]);
    }
  }, [has5MPCameras, PIXEL_OPTIONS]);

  useEffect(() => {
    setCurrentDate(new Date().toLocaleDateString());
  }, []);

  useEffect(() => {
    const fetchBestsellers = async () => {
      try {
        setLoadingBestsellers(true);
        const response = await fetch('/api/bestseller-products?grouped=true&limit=10', {
          cache: 'no-store',
        });

        if (!response.ok) {
          setBusinessBestsellerSections([]);
          return;
        }

        const data = await response.json();
        if (data.success && Array.isArray(data.sections)) {
          const mappedSections: BusinessBestsellerSection[] = data.sections.map((section: any) => ({
            business_key: section.business_key || '',
            business_name: section.business_name || 'Bestseller',
            products: Array.isArray(section.products)
              ? section.products.map(mapBestsellerProduct)
              : [],
          }));

          setBusinessBestsellerSections(mappedSections);
        } else {
          setBusinessBestsellerSections([]);
        }
      } catch (error) {
        console.error('Failed to fetch bestseller products:', error);
        setBusinessBestsellerSections([]);
      } finally {
        setLoadingBestsellers(false);
      }
    };

    fetchBestsellers();
  }, []);

  useEffect(() => {
    const container = document.getElementById('categoryScroll');
    if (!container) {
      setCanScrollCategoryLeft(false);
      setCanScrollCategoryRight(false);
      return;
    }

    const updateArrowState = () => {
      const maxScrollLeft = container.scrollWidth - container.clientWidth;
      setCanScrollCategoryLeft(container.scrollLeft > 2);
      setCanScrollCategoryRight(maxScrollLeft - container.scrollLeft > 2);
    };

    updateArrowState();
    container.addEventListener('scroll', updateArrowState, { passive: true });
    window.addEventListener('resize', updateArrowState);

    return () => {
      container.removeEventListener('scroll', updateArrowState);
      window.removeEventListener('resize', updateArrowState);
    };
  }, []);

  const updateBestsellerArrowState = (rowKey: string) => {
    const container = bestsellerScrollRefs.current[rowKey];
    if (!container) {
      return;
    }

    const maxScrollLeft = container.scrollWidth - container.clientWidth;
    const next = {
      left: container.scrollLeft > 2,
      right: maxScrollLeft - container.scrollLeft > 2,
    };

    setBestsellerArrowState((prev) => {
      const current = prev[rowKey];
      if (current && current.left === next.left && current.right === next.right) {
        return prev;
      }
      return { ...prev, [rowKey]: next };
    });
  };

  const scrollBestsellerRow = (rowKey: string, direction: 'left' | 'right') => {
    const container = bestsellerScrollRefs.current[rowKey];
    if (!container) {
      return;
    }

    container.scrollBy({
      left: direction === 'left' ? -360 : 360,
      behavior: 'smooth',
    });
  };

  const handleAddBestsellerToCart = (product: BestsellerProduct) => {
    addToCart({
      id: String(product.id),
      name: product.product_name,
      price: Number(product.base_price) || 0,
      image: product.image || '/pdt.png',
      category: product.segment || 'CCTV',
    });
    setIsCartOpen(true);
  };

  const handleBestsellerBuyNow = (product: BestsellerProduct) => {
    router.push(
      `/buy-now?productId=${product.id}&productName=${encodeURIComponent(product.product_name)}&price=${Number(product.base_price) || 0}`
    );
  };

  const handleBestsellerSegmentSearch = async (section: BusinessBestsellerSection) => {
    const businessKey = section.business_key || 'best-seller';
    const searchTerm = (bestsellerSearchTerms[businessKey] || '').trim();

    try {
      setSearchingBestsellerSections((prev) => ({ ...prev, [businessKey]: true }));

      const params = new URLSearchParams({
        business: businessKey,
        limit: '10',
      });

      if (searchTerm) {
        params.set('search', searchTerm);
      }

      const response = await fetch(`/api/bestseller-products?${params.toString()}`, {
        cache: 'no-store',
      });
      const data = await response.json();

      if (response.ok && data.success && Array.isArray(data.products)) {
        const mappedProducts = data.products.map(mapBestsellerProduct);
        setBusinessBestsellerSections((prev) =>
          prev.map((item) =>
            item.business_key === businessKey ? { ...item, products: mappedProducts } : item
          )
        );
      }
    } catch (error) {
      console.error('Failed to search bestseller products:', error);
    } finally {
      setSearchingBestsellerSections((prev) => ({ ...prev, [businessKey]: false }));
    }
  };

  useEffect(() => {
    const listeners: Array<{ rowKey: string; handler: () => void }> = [];

    businessBestsellerSections.forEach((section, index) => {
      const rowKey = `${section.business_key || 'best-seller'}-${index}`;
      const container = bestsellerScrollRefs.current[rowKey];
      if (!container || section.products.length === 0) {
        return;
      }

      const handler = () => updateBestsellerArrowState(rowKey);
      handler();
      container.addEventListener('scroll', handler, { passive: true });
      listeners.push({ rowKey, handler });
    });

    const handleResize = () => {
      businessBestsellerSections.forEach((section, index) => {
        const rowKey = `${section.business_key || 'best-seller'}-${index}`;
        updateBestsellerArrowState(rowKey);
      });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      listeners.forEach(({ rowKey, handler }) => {
        const container = bestsellerScrollRefs.current[rowKey];
        if (container) {
          container.removeEventListener('scroll', handler);
        }
      });
      window.removeEventListener('resize', handleResize);
    };
  }, [businessBestsellerSections]);

  // --- PRICING LOGIC - Uses Database Prices from Admin Panel ---
  const totalPrice = useMemo(() => {
    if (!cameraType) return 0;
    
    let total = 0;
    
    // Normalize camera type for comparison (remove "Camera" suffix and trim)
    const normalizedCameraType = cameraType.replace(/Camera/gi, '').trim();
    
    // 1. Add Camera Type base price (IP or HD)
    const cameraTypePrice = CAMERA_TYPE_PRICES[cameraType] || CAMERA_TYPE_PRICES[normalizedCameraType] || 0;
    console.log('🔍 Pricing Debug:', {
      selectedCameraType: cameraType,
      normalizedCameraType,
      availablePrices: CAMERA_TYPE_PRICES,
      cameraTypePrice,
      selectedBrand: brand,
      brandPrices: BRAND_PRICES[brand] || 'No brand selected'
    });
    
    // 2. Add Brand price (specific to camera type) - only if brand is selected
    const brandPrice = brand ? (
      normalizedCameraType.toLowerCase().includes('hd')
        ? (BRAND_PRICES[brand]?.hd || 0) 
        : (BRAND_PRICES[brand]?.ip || 0)
    ) : 0;
    
    // 3. Add DVR/NVR price based on selected channel from database
    let channelPrice = 0;
    if (channels) {
      const channelOption = CHANNEL_OPTIONS.find((ch: any) => ch.value === Number(channels));
      channelPrice = channelOption?.price || 0;
    }
    
    // 4. Calculate camera costs based on tech type and pixel from database
    const calculateCost = (subTypes: any) => {
      let cost = 0;
      Object.entries(subTypes).forEach(([type, pixels]: [string, any]) => {
        // Get base price based on camera type (HD or IP)
        const techPrices = TECH_TYPE_PRICES[type];
        const basePrice = normalizedCameraType.toLowerCase().includes('hd')
          ? (techPrices?.hd || 0)
          : (techPrices?.ip || 0);
        
        const pixel2MPPrice = PIXEL_PRICES["2MP"] || 0;
        const pixel5MPPrice = PIXEL_PRICES["5MP"] || 0;
        
        const qty2MP = pixels["2MP"] || 0;
        const qty5MP = pixels["5MP"] || 0;
        
        if (qty2MP > 0 || qty5MP > 0) {
          console.log(`  ${type} (${normalizedCameraType}): base=${basePrice}, 2MP price=${pixel2MPPrice}, 5MP price=${pixel5MPPrice}`);
          console.log(`    2MP: ${qty2MP} x (${basePrice} + ${pixel2MPPrice}) = ${qty2MP * (basePrice + pixel2MPPrice)}`);
          console.log(`    5MP: ${qty5MP} x (${basePrice} + ${pixel5MPPrice}) = ${qty5MP * (basePrice + pixel5MPPrice)}`);
        }
        
        // Calculate cost: (base tech type price + pixel premium) * quantity
        cost += (qty2MP * (basePrice + pixel2MPPrice)) + (qty5MP * (basePrice + pixel5MPPrice));
      });
      return cost;
    };

    const cameraCost = calculateCost(indoorSubTypes) + calculateCost(outdoorSubTypes);
    console.log('📷 Total Camera Cost:', cameraCost);
    
    // 5. Add storage cost from database (HD or IP specific)
    const storageOption = STORAGE_OPTIONS.find((s: any) => s.label === storage);
    const storageCost = storageOption 
      ? (normalizedCameraType.toLowerCase().includes('hd') 
          ? (storageOption.hd_price || storageOption.price || 0)
          : (storageOption.ip_price || storageOption.price || 0))
      : 0;
    
    // 6. Add cable costs from database
    let cableCost = 0;
    if (cableOption && cableOption !== "None") {
      const cablePrice = CABLE_PRICES[cableOption] || 0;
      if (normalizedCameraType.toLowerCase().includes('hd') && cableOption.includes("Cable")) {
        cableCost = hdCableQty * cablePrice;
      } else {
        cableCost = cablePrice;
      }
    }

    // 7. Add accessories cost from database
    let accessoryCost = 0;
    if (includeAccessories && Object.keys(ACCESSORY_PRICES_DB).length > 0) {
      // Sum all accessory prices from database
      Object.values(ACCESSORY_PRICES_DB).forEach((price: number) => {
        accessoryCost += price;
      });
    }

    // 8. Add installation cost (this can be made dynamic too if needed)
    let installationCost = 0;
    if (includeInstallation) {
      const installationPerCamera = totalCameraCount > 8 ? 350 : 400;
      installationCost = totalCameraCount * installationPerCamera;
    }

    // Total = Camera Type + Brand + Channel + Cameras + Storage + Cable + Accessories + Installation
    total = cameraTypePrice + brandPrice + channelPrice + cameraCost + storageCost + cableCost + accessoryCost + installationCost;

    console.log('💰 PRICE BREAKDOWN:');
    console.log(`  Camera Type (${cameraType}): RS ${cameraTypePrice}`);
    console.log(`  Brand (${brand}): RS ${brandPrice}`);
    console.log(`  Channel (${channels}CH): RS ${channelPrice}`);
    console.log(`  Cameras: RS ${cameraCost}`);
    console.log(`  Storage: RS ${storageCost}`);
    console.log(`  Cable: RS ${cableCost}`);
    console.log(`  Accessories: RS ${accessoryCost}`);
    console.log(`  Installation: RS ${installationCost}`);
    console.log(`  ═══════════════════════════`);
    console.log(`  TOTAL: RS ${Math.round(total)}`);

    return Math.round(total);
  }, [cameraType, brand, channels, indoorSubTypes, outdoorSubTypes, storage, cableOption, hdCableQty, includeAccessories, includeInstallation, totalCameraCount, CAMERA_TYPE_PRICES, BRAND_PRICES, PIXEL_PRICES, TECH_TYPE_PRICES, STORAGE_OPTIONS, CABLE_PRICES, ACCESSORY_PRICES_DB, CHANNEL_OPTIONS]);

  // Handlers
  const handleSendOtp = () => {
    if (custName.length < 3 || custPhone.length < 10) {
      alert("Enter a valid name and phone number.");
      return;
    }
    setOtpSent(true);
    alert("Verification Simulation: Enter 1234 to unlock your quote.");
  };

  const handleVerifyOtp = () => {
    if (otpInput === "1234") setIsVerified(true);
    else alert("Invalid Code. Use 1234.");
  };

  const updateQty = (cat: 'indoor' | 'outdoor', type: string, px: '2MP' | '5MP', delta: number) => {
    if (delta > 0 && channels && totalCameraCount + 1 > Number(channels)) {
      alert(`Capacity Reached: Selected ${channels}-Ch recorder supports max ${channels} cameras.`);
      return;
    }
    const setter = cat === 'indoor' ? setIndoorSubTypes : setOutdoorSubTypes;
    setter((prev: any) => ({ ...prev, [type]: { ...prev[type as keyof typeof indoorSubTypes], [px]: Math.max(0, prev[type as keyof typeof indoorSubTypes][px] + delta) } }));
  };

  const handleManualTotal = (cat: 'indoor' | 'outdoor', total: number) => {
    const other: number = cat === 'indoor' ? outdoorQty : indoorQty;
    if (channels && total + other > Number(channels)) {
      alert(`Limit Exceeded: Total cameras cannot exceed ${channels} channels.`);
      return;
    }
    if (pixelDefault === "5MP") setPixelDefault("2MP");
    
    // Create empty object with all available tech types
    const empty: any = {};
    Object.keys(TECH_TYPE_PRICES).forEach(type => {
      empty[type] = { "2MP": 0, "5MP": 0 };
    });
    
    const setter = cat === 'indoor' ? setIndoorSubTypes : setOutdoorSubTypes;
    const firstType = Object.keys(TECH_TYPE_PRICES)[0] || "HD Non Audio";
    setter({ ...empty, [firstType]: { ...empty[firstType], ["2MP"]: total } });
  };

  const checkAvailability = async () => {
    const normalizedPincode = pincode.trim();

    if (!/^\d{6}$/.test(normalizedPincode)) {
      setAvailabilityMessage("Please enter a valid 6-digit PIN code.");
      return;
    }

    try {
      setAvailabilityMessage("Checking availability...");
      const response = await fetch(`/api/pincode-availability?pincode=${encodeURIComponent(normalizedPincode)}`, {
        cache: 'no-store',
      });
      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(data?.error || 'Failed to check availability');
      }

      setAvailabilityMessage(data.available ? 'Available' : 'Not Available for this pincode.');
    } catch (error) {
      console.error('Availability check failed:', error);
      setAvailabilityMessage('Unable to check availability right now. Please try again.');
    }
  };

  // Handle Tools Redirect
  const handleToolsRedirect = (checked: boolean) => {
    setUseAutomatedTools(checked);
    if (checked) {
      // Small delay for better UX before redirecting
      setTimeout(() => {
        router.push("/tools");
      }, 500);
    }
  };

  const generateBOM = () => {
    const items: { model: string; qty: number; desc: string }[] = [];
    const bCode = brand.substring(0, 3).toUpperCase();
    items.push({ model: modelNumber, qty: 1, desc: `${channels} Channel ${cameraType === 'IP' ? 'NVR' : 'DVR'}` });
    const addCams = (subs: any, label: string) => {
      Object.entries(subs).forEach(([type, pixels]: [string, any], idx) => {
        if (pixels["2MP"] > 0) items.push({ model: `${bCode}-C${idx + 1}-2MP`, qty: pixels["2MP"], desc: `${label} ${type}` });
        if (pixels["5MP"] > 0) items.push({ model: `${bCode}-C${idx + 1}-5MP`, qty: pixels["5MP"], desc: `${label} ${type} (HD)` });
      });
    };
    addCams(indoorSubTypes, "Indoor");
    addCams(outdoorSubTypes, "Outdoor");
    if (storage) items.push({ model: `SURV-HDD-${storage}`, qty: 1, desc: "Surveillance Storage" });
    if (cableOption !== "None") items.push({ model: cableOption.includes("CAT6") ? "IP-CAT6-LAN" : "HD-COAX-31", qty: cameraType === "HD" ? hdCableQty : 1, desc: cableOption });
    if (includeAccessories) items.push({ model: "TECH-ACC-SET", qty: 1, desc: `${cameraType} Accessory Bundle` });
    if (includeInstallation) items.push({ model: "SVC-INSTALL", qty: totalCameraCount, desc: `Professional Service` });
    return items;
  };
  
  const validateForm = () => {
    if (!custName) {
      alert("Please enter your name");
      return false;
    }
    if (!custEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(custEmail)) {
      alert("Please enter a valid email address");
      return false;
    }
    if (!custPhone || !/^\d{10}$/.test(custPhone)) {
      alert("Please enter a valid 10-digit phone number");
      return false;
    }
    if (!custAddress) {
      alert("Please enter your address");
      return false;
    }
    if (!custCity) {
      alert("Please enter your city");
      return false;
    }
    if (!custState) {
      alert("Please enter your state");
      return false;
    }
    if (!pincode || !/^\d{6}$/.test(pincode)) {
      alert("Please enter a valid 6-digit PIN code");
      return false;
    }
    return true;
  };

  const submitOrder = async (paymentMethod: string) => {
    if (!validateForm()) return;

    setOrderSubmitting(true);

    try {
      const billOfMaterials = generateBOM().map(item => ({
        type: item.desc.includes("DVR") || item.desc.includes("NVR") ? "DVR" : 
              item.desc.includes("Camera") ? "Camera" :
              item.desc.includes("Storage") ? "Storage" :
              item.desc.includes("Cable") ? "Cable" :
              item.desc.includes("Accessory") ? "Accessory" : "Installation",
        name: item.model,
        description: item.desc,
        quantity: item.qty,
        unitPrice: 0, // Can calculate per item if needed
        totalPrice: 0
      }));

      const orderData = {
        // Customer Info
        customerName: custName,
        customerPhone: custPhone,
        customerEmail: custEmail,
        
        // Order Type
        orderType: bookingType || 'hd_combo',
        comboId: null,
        
        // Address
        installationAddress: custAddress,
        pincode: pincode,
        city: custCity,
        state: custState,
        landmark: custLandmark,
        
        // Technical Details
        cameraType,
        brand,
        channels,
        dvrModel: modelNumber,
        indoorCameras: indoorSubTypes,
        outdoorCameras: outdoorSubTypes,
        storageSize: storage,
        cableOption,
        includesAccessories: includeAccessories,
        includesInstallation: includeInstallation,
        
        // Dates
        expectedDeliveryDate: deliveryDate || null,
        expectedInstallationDate: installationDate || null,
        
        // Pricing
        subtotal: totalPrice - 1500,
        installationCharges: includeInstallation ? totalCameraCount * (totalCameraCount > 8 ? 350 : 400) : 0,
        deliveryCharges: 0,
        taxAmount: 0,
        discountAmount: 0,
        totalAmount: totalPrice,
        
        // Payment
        paymentMethod: paymentMethod,
        paymentStatus: 'Pending',
        status: 'Pending',
        
        // Bill of Materials
        billOfMaterials
      };

      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();

      if (data.success) {
        setCreatedOrderNumber(data.order.orderNumber || data.order.order_number);
        setOrderSuccess(true);
        alert(`Order created successfully! Order Number: ${data.order.orderNumber || data.order.order_number}`);
        // Reset form
        setCustName("");
        setCustPhone("");
        setCustEmail("");
        setCustAddress("");
        setCustCity("");
        setCustState("");
        setPincode("");
        setCustLandmark("");
        setIsVerified(false);
      } else {
        alert(`Order creation failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Order submission error:', error);
      alert('Failed to submit order. Please try again.');
    } finally {
      setOrderSubmitting(false);
    }
  };

  const handleCOD = () => submitOrder('cod');
  const handleRazorpay = () => submitOrder('razorpay');
  const bestSellerSectionForSearch = businessBestsellerSections.find(
    (section) => section.business_key === 'best-seller'
  );

  return (
    <div className="bg-white min-h-screen">
      <Suspense fallback={<div className="h-16" />}>
        <Navbar />
      </Suspense>

      {/* Success Modal */}
      {orderSuccess && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8"
          >
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-2">Order Confirmed!</h2>
              <p className="text-slate-600 mb-6">Your order has been successfully placed</p>
              
              <div className="bg-slate-50 rounded-xl p-6 mb-6">
                <p className="text-xs font-bold uppercase text-slate-500 mb-2">Order Number</p>
                <p className="text-2xl font-black text-[#e63946] font-mono">{createdOrderNumber}</p>
                <p className="text-xs text-slate-500 mt-2">Use this to track your order</p>
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={() => window.location.href = '/track-order'}
                  className="w-full bg-[#e63946] text-white font-bold h-14"
                >
                  Track Your Order
                </Button>
                <Button 
                  onClick={() => {
                    setOrderSuccess(false);
                    // Reset form
                    setBookingType(null);
                    setCameraType("");
                    setBrand("");
                    setChannels("");
                    setCustName("");
                    setCustPhone("");
                    setIsVerified(false);
                    setOtpSent(false);
                    setDeliveryDate("");
                    setInstallationDate("");
                    setUseAutomatedTools(false);
                  }}
                  variant="outline"
                  className="w-full h-12"
                >
                  Place Another Order
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Category Section - Exact replica of screenshot */}
      <section className="bg-white py-5 sm:py-6 border-b border-slate-200 print:hidden mt-20 sm:mt-24">
        <div className="container mx-auto px-4">
          <div className="relative">
            <div id="categoryScroll" className="flex items-center justify-start md:justify-between gap-4 sm:gap-6 overflow-x-auto scrollbar-hide scroll-smooth px-10 sm:px-12 md:px-0">
              {[
                { icon: Camera, label: "CCTV", link: "/categories" },
                { icon: Lock, label: "BIOMETRIC ACCESS" },
                { icon: MapPin, label: "GPS SYSTEM" },
                { icon: Settings, label: "SYSTEM" },
                { icon: Wrench, label: "FIRE ALARM" },
                { icon: MessageSquare, label: "INTERCOM SYSTEM" },
                { icon: Network, label: "MOTION DETECTION" },
                { icon: Monitor, label: "PA SYSTEM" }
              ].map((item, i) => (
                <div 
                  key={i} 
                  onClick={() => item.link && router.push(item.link)}
                  className="flex flex-col items-center min-w-24 sm:min-w-25 p-2.5 sm:p-3 rounded-xl hover:bg-slate-50 transition-all cursor-pointer group"
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center mb-2 rounded-full bg-white border border-slate-300 shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all overflow-hidden">
                    <item.icon className="w-6 h-6 sm:w-7 sm:h-7 text-black" strokeWidth={2.2} />
                  </div>
                  <div className="text-center">
                    <p className="text-[11px] sm:text-xs font-semibold text-black leading-tight tracking-wide">{item.label}</p>
                  </div>
                </div>
              ))}
            </div>
            {/* Left Scroll Arrow Button for Mobile */}
            {canScrollCategoryLeft && (
              <button 
                onClick={() => {
                  const container = document.getElementById('categoryScroll');
                  if (container) {
                    container.scrollBy({ left: -200, behavior: 'smooth' });
                  }
                }}
                className="md:hidden absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/95 shadow-lg flex items-center justify-center text-[#e63946] hover:bg-[#e63946] hover:text-white transition-all active:scale-95 z-10 border border-slate-200"
                aria-label="Scroll left"
              >
                <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            {/* Right Scroll Arrow Button for Mobile */}
            {canScrollCategoryRight && (
              <button 
                onClick={() => {
                  const container = document.getElementById('categoryScroll');
                  if (container) {
                    container.scrollBy({ left: 200, behavior: 'smooth' });
                  }
                }}
                className="md:hidden absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/95 shadow-lg flex items-center justify-center text-[#e63946] hover:bg-[#e63946] hover:text-white transition-all active:scale-95 z-10 border border-slate-200"
                aria-label="Scroll right"
              >
                <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="relative print:hidden overflow-hidden">
        <ThumbnailCarousel />
      </section>

      {/* Bestseller Section */}
      <section className="py-16 bg-white border-t border-slate-100">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-wide">Best Sellers</h2>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              {bestSellerSectionForSearch && (
                <>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      value={bestsellerSearchTerms[bestSellerSectionForSearch.business_key] || ''}
                      onChange={(event) =>
                        setBestsellerSearchTerms((prev) => ({
                          ...prev,
                          [bestSellerSectionForSearch.business_key]: event.target.value,
                        }))
                      }
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          handleBestsellerSegmentSearch(bestSellerSectionForSearch);
                        }
                      }}
                      placeholder="Search Best Sellers"
                      className="h-10 pl-9"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleBestsellerSegmentSearch(bestSellerSectionForSearch)}
                    disabled={!!searchingBestsellerSections[bestSellerSectionForSearch.business_key]}
                    className="w-full sm:w-auto"
                  >
                    <Search className="w-4 h-4" />
                    {searchingBestsellerSections[bestSellerSectionForSearch.business_key] ? 'Searching' : 'Search'}
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                onClick={() => router.push('/bestsellers')}
                className="w-full sm:w-auto"
              >
                View All
              </Button>
            </div>
          </div>

          {loadingBestsellers ? (
            <div className="flex items-center justify-center py-10">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#e63946]"></div>
            </div>
          ) : businessBestsellerSections.some((section) => section.products.length > 0) ? (
            <div className="space-y-10">
              {businessBestsellerSections.map((section, index) => {
                const rowKey = `${section.business_key || 'best-seller'}-${index}`;
                const arrows = bestsellerArrowState[rowKey] || { left: false, right: false };

                return (
                <div key={rowKey}>
                  {section.business_key !== 'best-seller' && (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                      <h3 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-wide">
                        {section.business_name}
                      </h3>
                      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <div className="relative w-full sm:w-64">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input
                            value={bestsellerSearchTerms[section.business_key] || ''}
                            onChange={(event) =>
                              setBestsellerSearchTerms((prev) => ({
                                ...prev,
                                [section.business_key]: event.target.value,
                              }))
                            }
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') {
                                handleBestsellerSegmentSearch(section);
                              }
                            }}
                            placeholder={`Search ${section.business_name}`}
                            className="h-10 pl-9"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleBestsellerSegmentSearch(section)}
                          disabled={!!searchingBestsellerSections[section.business_key]}
                          className="w-full sm:w-auto"
                        >
                          <Search className="w-4 h-4" />
                          {searchingBestsellerSections[section.business_key] ? 'Searching' : 'Search'}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => router.push(`/bestsellers?business=${section.business_key}`)}
                          className="w-full sm:w-auto"
                        >
                          View All
                        </Button>
                      </div>
                    </div>
                  )}

                  {section.products.length === 0 ? (
                    <div className="text-sm text-slate-500 border border-dashed border-slate-300 rounded-xl px-4 py-6">
                      No products selected yet for {section.business_name}.
                    </div>
                  ) : (
                    <div className="relative">
                      {arrows.left && (
                        <button
                          type="button"
                          onClick={() => scrollBestsellerRow(rowKey, 'left')}
                          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/95 border border-slate-200 shadow-md flex items-center justify-center text-slate-700 hover:text-[#e63946] hover:border-[#e63946] transition-colors"
                          aria-label="Scroll bestsellers left"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                      )}

                      <div
                        ref={(node) => {
                          bestsellerScrollRefs.current[rowKey] = node;
                        }}
                        className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-hide px-1 py-1"
                      >
                      {section.products.map((product) => (
                        <div
                          key={`${section.business_key}-${product.id}`}
                          className="min-w-72 max-w-72 sm:min-w-80 sm:max-w-80 shrink-0 snap-start border border-slate-200 rounded-xl bg-white overflow-hidden hover:shadow-md transition-shadow"
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

                            {!!product.price_note && (
                              <p className="mt-1 text-xs text-slate-500">{product.price_note}</p>
                            )}

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
                                  onClick={() => handleAddBestsellerToCart(product)}
                                >
                                  Add to Cart
                                </Button>
                                <Button
                                  type="button"
                                  className="w-full bg-slate-800 hover:bg-slate-900 text-white"
                                  onClick={() => handleBestsellerBuyNow(product)}
                                >
                                  Buy Now
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      </div>

                      {arrows.right && (
                        <button
                          type="button"
                          onClick={() => scrollBestsellerRow(rowKey, 'right')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/95 border border-slate-200 shadow-md flex items-center justify-center text-slate-700 hover:text-[#e63946] hover:border-[#e63946] transition-colors"
                          aria-label="Scroll bestsellers right"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )})}
            </div>
          ) : (
            <div className="text-center py-8 border border-dashed border-slate-300 rounded-xl">
              <p className="text-slate-500">No bestseller products available right now.</p>
            </div>
          )}
        </div>
      </section>

      {/* Interactive 3D Section (disabled) */}
      {/*
      <section className="bg-white py-24 overflow-hidden">
        <div className="container mx-auto px-4">
          <SplineSceneBasic />
        </div>
      </section>
      */}

      {/* Why Choose Us Section */}
      {/*
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center mb-4">
            <BlinkingDot />
            <p className="text-[#e63946] text-xs font-bold tracking-[0.3em] uppercase">Trusted quality</p>
          </div>
          <h2 className="text-4xl font-black text-slate-900 uppercase tracking-wider mb-16">Only the Best for Your Safety</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              { icon: MapPin, title: "Verified Local Experts", desc: "Fast service from dealers within a 5-10km radius." },
              { icon: Star, title: "Rated Performance", desc: "Every dealer is vetted based on past performance scores." },
              { icon: DollarSign, title: "Fixed Pricing", desc: "No hidden costs. Transparent pricing fixed by the platform." }
            ].map((item, i) => (
              <div key={i} className="bg-white border border-slate-100 p-8 rounded-2xl group hover:bg-[#e63946] transition-all cursor-default shadow-sm hover:shadow-xl">
                <item.icon className="w-12 h-12 text-[#e63946] group-hover:text-white mx-auto mb-6 transition-colors" />
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-white uppercase mb-4 transition-colors">{item.title}</h3>
                <p className="text-slate-500 group-hover:text-white/90 text-sm transition-colors">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      */}

      {/* Security Systems Showcase */}
      {/* <section className="py-20 bg-slate-200">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="h-px w-14 bg-slate-400" />
              <Camera className="w-5 h-5 text-black" />
              <span className="h-px w-14 bg-slate-400" />
            </div>
            <p className="text-black text-3xl md:text-4xl font-medium mb-2">360 total Security Services</p>
            <h2 className="text-5xl md:text-6xl font-semibold text-[#e63946]">CCTV Surveillance Systems</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
            {[
              { image: "/imga.jpg", alt: "Door access security" },
              { image: "/imgd.jpg", alt: "Mobile controlled smart lock" },
              { image: "/imgp.jpg", alt: "Bullet camera surveillance" }
            ].map((item, i) => (
              <div key={i} className="relative h-146 overflow-hidden group cursor-pointer">
                <Image
                  src={item.image}
                  alt={item.alt}
                  fill
                  className="object-cover brightness-110 contrast-105 saturate-110 transition-transform duration-500 ease-out group-hover:scale-105 group-active:scale-105"
                />
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute inset-0 bg-black/45 translate-x-full transition-transform duration-500 ease-out group-hover:translate-x-0 group-active:translate-x-0" />
                <div className="absolute inset-0 flex items-center justify-center px-8 text-center translate-x-full transition-transform duration-500 ease-out group-hover:translate-x-0 group-active:translate-x-0">
                  <p className="text-white font-extrabold text-3xl leading-snug">
                    Suspendisse urna nibh, viverra non, semper suscipit, posuere a, pede. Donec nec justo eget felis facilisis fermentum.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* Availability Check */}
      <section
        className="relative py-50 md:py-60 min-h-175 border-t border-slate-100 bg-center bg-no-repeat flex items-center"
        style={{ backgroundImage: "url('/allbusiness.jpg')", backgroundSize: 'contain', backgroundPosition: 'center center' }}
      >
        <div className="absolute inset-0 bg-slate-900/45" aria-hidden="true" />
        <div className="relative z-10 container mx-auto px-4 max-w-5xl text-center">
          <p className="text-[#ff8b94] text-xs font-bold tracking-[0.3em] uppercase mb-4"><BlinkingDot />Availability</p>
          <h2 className="text-3xl sm:text-4xl font-black text-white uppercase mb-6">Check Availability</h2>
          <div className="flex flex-col md:flex-row gap-3 sm:gap-4 justify-center items-center max-w-xl mx-auto">
            <div className="relative w-full md:w-64">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input type="text" maxLength={6} placeholder="Enter PIN Code" className="w-full bg-slate-50 border border-slate-200 p-4 pl-12 rounded-xl text-slate-900 focus:border-[#e63946] outline-none transition-all shadow-inner" onChange={(e) => setPincode(e.target.value)} />
            </div>
            <Button onClick={checkAvailability} className="bg-[#e63946] hover:bg-red-700 text-white font-bold h-14 px-8 w-full md:w-auto rounded-xl shadow-md">
              <Search className="mr-2" size={18} /> CHECK NOW
            </Button>
          </div>
          {availabilityMessage && (
            <div className={`mt-6 p-4 rounded-xl text-sm font-bold shadow-sm ${availabilityMessage === 'Available' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
              {availabilityMessage}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
