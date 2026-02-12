"use client";
import { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
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
  LayoutGrid,
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

export default function HomePage() {
  const router = useRouter();

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

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
    console.log(`  Camera Type (${cameraType}): ₹${cameraTypePrice}`);
    console.log(`  Brand (${brand}): ₹${brandPrice}`);
    console.log(`  Channel (${channels}CH): ₹${channelPrice}`);
    console.log(`  Cameras: ₹${cameraCost}`);
    console.log(`  Storage: ₹${storageCost}`);
    console.log(`  Cable: ₹${cableCost}`);
    console.log(`  Accessories: ₹${accessoryCost}`);
    console.log(`  Installation: ₹${installationCost}`);
    console.log(`  ═══════════════════════════`);
    console.log(`  TOTAL: ₹${Math.round(total)}`);

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

  const checkAvailability = () => {
    if (pincode.length === 6) {
      setAvailabilityMessage("Searching for top-rated dealers in your area...");
      setTimeout(() => setAvailabilityMessage("Success! Verified installers are available."), 1500);
    } else {
      setAvailabilityMessage("Please enter a valid 6-digit PIN code.");
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
        const orderNum = data.order.orderNumber || data.order.order_number;
        setCreatedOrderNumber(orderNum);
        
        if (paymentMethod === 'cod') {
          setOrderSuccess(true);
          alert(`Order created successfully! Order Number: ${orderNum}`);
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
        }
        
        return { orderNumber: orderNum, totalAmount: totalPrice };
      } else {
        alert(`Order creation failed: ${data.error || 'Unknown error'}`);
        return null;
      }
    } catch (error) {
      console.error('Order submission error:', error);
      alert('Failed to submit order. Please try again.');
    } finally {
      setOrderSubmitting(false);
    }
  };

  const handleCOD = () => submitOrder('cod');
  
  const handleRazorpay = async () => {
    if (!isVerified) {
      alert('Please verify your mobile number before placing order');
      return;
    }

    try {
      setOrderSubmitting(true);
      
      // First create order in database
      const orderResult = await submitOrder('razorpay');
      if (!orderResult || !createdOrderNumber) {
        setOrderSubmitting(false);
        return;
      }

      const orderNumberToUse = orderResult.orderNumber || createdOrderNumber;

      // Create Razorpay order
      const razorpayResponse = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: totalPrice,
          receipt: orderNumberToUse,
          notes: {
            orderNumber: orderNumberToUse,
            customerName: custName,
            phone: custPhone,
          },
        }),
      });

      const razorpayData = await razorpayResponse.json();

      if (!razorpayData.success) {
        alert(razorpayData.error || 'Failed to initialize payment');
        setOrderSubmitting(false);
        return;
      }

      // Development mode: Skip Razorpay and auto-verify
      if (razorpayData.devMode) {
        console.log('🧪 DEV MODE - Simulating successful payment...');
        
        const verifyResponse = await fetch('/api/razorpay/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            razorpay_order_id: razorpayData.orderId,
            razorpay_payment_id: `pay_DEV${Date.now()}`,
            razorpay_signature: 'dev_signature',
            order_number: orderNumberToUse,
          }),
        });

        const verifyData = await verifyResponse.json();

        if (verifyData.success) {
          alert('✅ Payment successful (DEV MODE)! Order placed.');
          setOrderSuccess(true);
        } else {
          alert('Payment verification failed');
        }
        setOrderSubmitting(false);
        return;
      }

      // Production mode: Use real Razorpay
      // Initialize Razorpay checkout
      const options = {
        key: 'rzp_test_SC7jHw0oYI68Ps', // Your Razorpay test key
        amount: razorpayData.amount,
        currency: razorpayData.currency,
        name: 'CCTV Store',
        description: `Order #${orderNumberToUse}`,
        order_id: razorpayData.orderId,
        handler: async function (response: any) {
          // Verify payment
          const verifyResponse = await fetch('/api/razorpay/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              order_number: orderNumberToUse,
            }),
          });

          const verifyData = await verifyResponse.json();

          if (verifyData.success) {
            alert('Payment successful! Order placed.');
            setOrderSuccess(true);
          } else {
            alert('Payment verification failed');
          }
          setOrderSubmitting(false);
        },
        prefill: {
          name: custName,
          email: custEmail,
          contact: custPhone,
        },
        theme: {
          color: '#e63946',
        },
        modal: {
          ondismiss: function() {
            setOrderSubmitting(false);
          }
        }
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Razorpay error:', error);
      alert('Payment initialization failed. Please try again.');
      setOrderSubmitting(false);
    }
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const [constraints, setConstraints] = useState(0);
  const scrollProgress = useMotionValue(0);
  const smoothProgress = useSpring(scrollProgress, { stiffness: 100, damping: 20 });
  useEffect(() => { if (containerRef.current) setConstraints(containerRef.current.scrollWidth - containerRef.current.offsetWidth); }, []);
  const x = useTransform(smoothProgress, [0, 100], [0, -constraints]);

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

      {/* Quotation Management Page - Focused on System Configurator */}
      <div className="pt-24"></div>

      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} id="quote-engine" className="py-24 bg-slate-50 relative print:bg-white print:py-0">
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-12 print:hidden">
            <div className="flex items-center justify-center mb-4 text-[#e63946]"><BlinkingDot /> <p className="text-xs font-bold uppercase">System Configurator</p></div>
            <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tight">Automated Quotation</h2>
          </div>

          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6 print:hidden">
              <Card className="bg-white border border-slate-200 text-slate-900 p-6 shadow-xl rounded-2xl">
                <CardContent className="space-y-10 p-0">
                  
                  {/* --- NEW STEP: BOOKING TYPE --- */}
                  <div className="space-y-4">
                    <label className="flex items-center gap-2 text-sm font-bold uppercase text-[#e63946]"><LayoutGrid size={16}/> Booking Type</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={() => setBookingType('combo')}
                        className={`p-4 rounded-xl border-2 transition-all text-sm font-bold uppercase ${bookingType === 'combo' ? 'border-[#e63946] bg-red-50 text-[#e63946]' : 'border-slate-100 bg-slate-50 text-slate-400'}`}
                      >
                        Combo Offer Booking
                      </button>
                      <button 
                        onClick={() => setBookingType('customize')}
                        className={`p-4 rounded-xl border-2 transition-all text-sm font-bold uppercase ${bookingType === 'customize' ? 'border-[#e63946] bg-red-50 text-[#e63946]' : 'border-slate-100 bg-slate-50 text-slate-400'}`}
                      >
                        Customize Booking
                      </button>
                    </div>
                  </div>

                  {/* --- CONDITIONAL CUSTOMIZE FLOW --- */}
                  {bookingType === 'customize' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
                      {/* Step 1 & 2 */}
                      <div className="grid md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                        <div className="space-y-4"><label className="flex items-center gap-2 text-sm font-bold uppercase text-[#e63946]"><ChevronRight size={16}/> Step 1: Camera Type</label><select className="w-full bg-slate-50 border p-3 rounded" value={cameraType} onChange={(e) => setCameraType(e.target.value)}><option value="">Select Type</option>{CAMERA_TYPES.map((type: any) => <option key={type} value={type}>{type} Camera</option>)}</select></div>
                        {cameraType && (<div className="space-y-4"><label className="flex items-center gap-2 text-sm font-bold uppercase text-[#e63946]"><ChevronRight size={16}/> Step 2: Brand</label><select className="w-full bg-slate-50 border p-3 rounded" value={brand} onChange={(e) => setBrand(e.target.value)}><option value="">Select Brand</option>{BRANDS.map((b: any) => <option key={b} value={b}>{b}</option>)}</select></div>)}
                      </div>

                      {/* Step 3 & 4 */}
                      {brand && (
                        <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                          <div className="space-y-4"><label className="text-sm font-bold uppercase text-[#e63946]">Step 3: {cameraType === 'IP' ? 'NVR' : 'DVR'} Channels</label><select className="w-full bg-slate-50 border p-3 rounded" value={channels} onChange={(e) => setChannels(Number(e.target.value))}><option value="">Select Channel</option>{CHANNEL_OPTIONS.map((ch: any) => <option key={ch.value} value={ch.value}>{ch.label}</option>)}</select></div>
                          <div className="space-y-4"><label className="text-sm font-bold uppercase text-[#e63946]">Step 4: Default Pixel</label><select className="w-full bg-slate-50 border p-3 rounded" value={pixelDefault} onChange={(e) => setPixelDefault(e.target.value)}><option value="">Select Pixel</option>{PIXEL_OPTIONS.map((px: any) => <option key={px} value={px}>{px}</option>)}</select></div>
                        </div>
                      )}

                      {/* Step 5 */}
                      {channels && (
                        <div className="space-y-8 border-t border-slate-100 pt-8">
                          <div className="flex items-center gap-2 text-sm font-bold uppercase text-[#e63946]"><ChevronRight size={16}/> Step 5: Quantity Details</div>
                          <div className="grid md:grid-cols-2 gap-12">
                            {['indoor', 'outdoor'].map((cat) => (
                              <div key={cat} className="space-y-4">
                                <div className="bg-slate-100 p-3 rounded flex justify-between items-center"><span className="font-bold text-xs uppercase">{cat} Total</span><Input type="number" className="w-20 bg-white" value={String(cat === 'indoor' ? indoorQty : outdoorQty)} onChange={(e) => handleManualTotal(cat as any, Number(e.target.value))} /></div>
                                <div className="pl-4 space-y-4 border-l-2 border-slate-200">
                                  {Object.entries(cat === 'indoor' ? indoorSubTypes : outdoorSubTypes).map(([type, pxMap]: [string, any]) => (
                                    <div key={type} className="space-y-1">
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{type}</p>
                                      <div className="grid grid-cols-2 gap-2">
                                        {PIXEL_OPTIONS.map((px: string) => (
                                          <div key={px} className="flex items-center justify-between bg-slate-50 p-1 rounded border">
                                            <span className="text-[9px] font-bold">{px}</span>
                                            <div className="flex items-center gap-2"><button onClick={() => updateQty(cat as any, type, px as any, -1)}><Minus size={10}/></button><span className="text-xs font-black">{pxMap[px] || 0}</span><button onClick={() => updateQty(cat as any, type, px as any, 1)} className="text-[#e63946]"><Plus size={10}/></button></div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Step 6, 7 & 8 Location (No Pin) */}
                      {channels && (
                        <div className="grid md:grid-cols-3 gap-6 pt-6 border-t border-slate-100">
                          <div className="space-y-2"><label className="text-[10px] font-bold uppercase">Step 6: Model</label><Input value={modelNumber} disabled className="bg-slate-50 text-[10px] font-mono" /></div>
                          <div className="space-y-2"><label className="text-[10px] font-bold uppercase">Step 7: Storage</label><select className="w-full bg-slate-50 border p-2 rounded text-xs" value={storage} onChange={(e) => setStorage(e.target.value)}><option value="">Select HDD</option>{STORAGE_OPTIONS.map((s: any) => <option key={s.label} value={s.label}>{s.label}</option>)}</select></div>
                          <div className="space-y-2"><label className="text-[10px] font-bold uppercase">Step 8: Location</label><Input placeholder="E.g. Home, Office" className="bg-slate-50 border-slate-200 text-slate-900" value={location} onChange={(e) => setLocation(e.target.value)} /></div>
                        </div>
                      )}

                      {/* Step 9 & 10 Updated with Installation Date and Tools */}
                      <div className="space-y-8 pt-8 border-t border-slate-100">
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <label className="flex items-center gap-2 text-sm font-bold uppercase text-[#e63946]"><Calendar size={16}/> Expected Delivery Date</label>
                            <Input type="date" className="bg-slate-50 border-slate-200" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
                          </div>
                          
                          {/* NEW: Expected Installation Date */}
                          <div className="space-y-4">
                            <label className="flex items-center gap-2 text-sm font-bold uppercase text-[#e63946]"><Wrench size={16}/> Expected Installation Date</label>
                            <Input type="date" className="bg-slate-50 border-slate-200" value={installationDate} onChange={(e) => setInstallationDate(e.target.value)} />
                          </div>
                        </div>

                        {/* NEW: Automated Tools Section */}
                        <div className="pt-4">
                          <label className={`flex items-center gap-4 cursor-pointer p-5 rounded-2xl border-2 transition-all ${useAutomatedTools ? 'border-[#e63946] bg-red-50' : 'border-slate-100 bg-slate-50'}`}>
                            <input 
                              type="checkbox" 
                              checked={useAutomatedTools} 
                              onChange={(e) => handleToolsRedirect(e.target.checked)} 
                              className="w-6 h-6 accent-[#e63946]" 
                            />
                            <div className="flex-1">
                              <div className="font-black uppercase tracking-wider text-sm flex items-center gap-2 text-slate-900">
                                <Zap size={16} className="text-[#e63946] fill-[#e63946]"/> 
                                Use Automated Engineering Tools
                              </div>
                              <p className="text-[10px] text-slate-500 font-bold uppercase">
                                Open Storage Calculator & Coverage Visualizer to verify this setup
                              </p>
                            </div>
                            <ChevronRight className={`transition-transform ${useAutomatedTools ? 'rotate-90' : ''}`} size={20} />
                          </label>
                        </div>

                        {/* Cable Selection - Uses Database Prices */}
                        <div className="space-y-4">
                          <label className="flex items-center gap-2 text-sm font-bold uppercase text-[#e63946]"><Cable size={16}/> Cable Selection (Optional)</label>
                          <select className="w-full bg-slate-50 border p-3 rounded" value={cableOption} onChange={(e) => setCableOption(e.target.value)}>
                            <option value="None">No Cable</option>
                            {quotationSettings?.cables?.filter((c: any) => 
                              cameraType === "HD" ? c.cable_type === "HD" || c.cable_type === "hd_cable" : c.cable_type === "IP" || c.cable_type === "ip_cable"
                            ).map((cable: any) => (
                              <option key={cable.id} value={cable.name}>{cable.name} - {cable.length}</option>
                            ))}
                          </select>
                          {cameraType === "HD" && cableOption !== "None" && (
                            <div className="flex items-center gap-4 mt-2 bg-slate-50 p-2 rounded border border-dashed border-slate-300">
                              <span className="text-xs font-bold">Roll Quantity (1-5):</span>
                              <Input type="number" min="1" max="5" value={hdCableQty} onChange={(e) => setHdCableQty(Number(e.target.value))} className="w-20 bg-white" />
                            </div>
                          )}
                        </div>

                        {/* Hardware Bundle */}
                        <div className="space-y-4">
                          <label className="flex items-center gap-2 text-sm font-bold uppercase text-[#e63946]"><Box size={16}/> Hardware Bundle (Optional)</label>
                          <div className="p-4 bg-slate-50 rounded border space-y-2">
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input type="checkbox" checked={includeAccessories} onChange={(e) => setIncludeAccessories(e.target.checked)} className="accent-[#e63946]" />
                              <div className="text-xs font-bold">Include All Setup Accessories</div>
                            </label>
                            <p className="text-[10px] text-slate-400 pl-7 italic">Includes: {cameraType === "HD" ? "SMPS, BNC & DC Jacks" : "POE Switch & RJ45"}</p>
                          </div>
                        </div>

                        {/* Installation (Rate label removed) */}
                        <div className="pt-4">
                          <label className="flex items-center gap-4 cursor-pointer p-5 bg-slate-900 text-white rounded-2xl shadow-xl hover:bg-black transition-all">
                            <input type="checkbox" checked={includeInstallation} onChange={(e) => setIncludeInstallation(e.target.checked)} className="w-5 h-5 accent-[#e63946]" />
                            <div className="flex-1">
                              <div className="font-black uppercase tracking-wider text-sm flex items-center gap-2"><Wrench size={16} className="text-[#e63946]"/> Include Professional Installation</div>
                              <p className="text-[10px] text-slate-400 font-bold uppercase">Assignment within your area</p>
                            </div>
                          </label>
                        </div>
                      </div>

                      {/* Final Section: PIN Code Only */}
                      <div className="grid md:grid-cols-1 gap-6 pt-10 border-t border-slate-100">
                        <div className="space-y-4">
                          <label className="flex items-center gap-2 text-sm font-bold uppercase text-[#e63946]"><MapPin size={16}/> PIN Code *</label>
                          <Input maxLength={6} placeholder="6-Digit PIN" className="bg-slate-50 border-slate-200" value={pincode} onChange={(e) => setPincode(e.target.value)} />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Empty state for Combo */}
                  {bookingType === 'combo' && (
                    <div className="p-10 text-center text-slate-400 text-sm font-bold uppercase tracking-widest border-t border-slate-100">
                      Combo offers selection coming soon...
                    </div>
                  )}

                  {!bookingType && (
                    <div className="p-10 text-center text-slate-300 italic text-sm border-t border-slate-100">
                      Select a booking type above to begin configuration.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar Summary (Constant and Visible) */}
            <div className="space-y-6">
              <Card className="bg-white text-slate-900 border border-slate-200 shadow-2xl overflow-hidden rounded-2xl sticky top-24 print:static print:shadow-none print:border-none">
                <div className="bg-slate-900 p-4 text-white flex items-center gap-2 print:hidden">
                  <Info size={18} className="text-[#e63946]" /><span className="font-bold uppercase tracking-tight text-sm">Quotation Overview</span>
                </div>
                
                <div className="hidden print:block p-10 border-b-4 border-slate-900">
                   <h1 className="text-3xl font-black uppercase text-slate-900">Official Quotation</h1>
                   <div className="mt-4 grid grid-cols-2 text-sm">
                      <div><p className="font-bold">Customer: {custName}</p><p>Phone: {custPhone}</p></div>
                      <div className="text-right"><p>Date: {currentDate}</p><p className="font-bold text-[#e63946] uppercase">PIN: {pincode}</p></div>
                   </div>
                </div>

                <CardContent className="p-6">
                  {!isVerified && !otpSent ? (
                    <div className="space-y-6 print:hidden">
                      <div className="text-center"><Lock size={44} className="mx-auto text-slate-300 mb-2"/><p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Verify Identity</p></div>
                      <div className="space-y-4">
                        <div className="relative"><User className="absolute left-3 top-3 text-slate-400" size={16}/><Input placeholder="Your Name" value={custName} onChange={(e) => setCustName(e.target.value)} className="pl-10"/></div>
                        <div className="relative"><Smartphone className="absolute left-3 top-3 text-slate-400" size={16}/><Input placeholder="10-Digit Mobile" value={custPhone} onChange={(e) => setCustPhone(e.target.value)} className="pl-10"/></div>
                        <Button onClick={handleSendOtp} className="w-full bg-slate-900 text-white font-black h-12 uppercase tracking-tighter">Request Quote Access</Button>
                      </div>
                    </div>
                  ) : !isVerified && otpSent ? (
                    <div className="space-y-4 print:hidden">
                      <p className="text-xs font-bold text-slate-500 text-center uppercase">Enter Verification Code (1234)</p>
                      <Input placeholder="OTP CODE" value={otpInput} onChange={(e) => setOtpInput(e.target.value)} className="text-center font-black text-2xl h-16"/>
                      <Button onClick={handleVerifyOtp} className="w-full bg-[#e63946] text-white font-black h-12 uppercase">Verify & Unlock</Button>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      <div className="p-3 bg-green-50 border border-green-200 rounded-xl print:hidden flex justify-between items-center"><span className="text-xs font-bold text-green-700">{custPhone}</span><CheckCircle2 size={16} className="text-green-600"/></div>

                      {/* Customer Details Form */}
                      <div className="space-y-4 print:hidden">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-[#e63946]">Complete Your Details</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2">
                            <Input 
                              placeholder="Full Name *" 
                              value={custName} 
                              onChange={(e) => setCustName(e.target.value)}
                              className="bg-green-50 border-green-200 font-semibold"
                              disabled
                            />
                          </div>
                          <div className="col-span-2">
                            <Input 
                              placeholder="Phone Number (Verified) *" 
                              value={custPhone} 
                              onChange={(e) => setCustPhone(e.target.value)}
                              maxLength={10}
                              className="bg-green-50 border-green-200 font-semibold"
                              disabled
                            />
                          </div>
                          <div className="col-span-2">
                            <Input 
                              type="email"
                              placeholder="Email Address *" 
                              value={custEmail} 
                              onChange={(e) => setCustEmail(e.target.value)}
                              className="bg-slate-50"
                            />
                          </div>
                          <div className="col-span-2">
                            <Input 
                              placeholder="Full Address *" 
                              value={custAddress} 
                              onChange={(e) => setCustAddress(e.target.value)}
                              className="bg-slate-50"
                            />
                          </div>
                          <Input 
                            placeholder="City *" 
                            value={custCity} 
                            onChange={(e) => setCustCity(e.target.value)}
                            className="bg-slate-50"
                          />
                          <Input 
                            placeholder="State *" 
                            value={custState} 
                            onChange={(e) => setCustState(e.target.value)}
                            className="bg-slate-50"
                          />
                          <Input 
                            placeholder="PIN Code (6 digits) *" 
                            value={pincode} 
                            onChange={(e) => setPincode(e.target.value)}
                            maxLength={6}
                            className="bg-slate-50"
                          />
                          <Input 
                            placeholder="Landmark (Optional)" 
                            value={custLandmark} 
                            onChange={(e) => setCustLandmark(e.target.value)}
                            className="bg-slate-50"
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Technical Items List</h4>
                        <ul className="space-y-4">
                          {generateBOM().map((item, i) => (
                            <li key={i} className="flex justify-between items-start border-b border-dashed pb-3 last:border-0">
                              <div><p className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{item.model}</p><p className="text-[9px] text-slate-500 font-bold uppercase">{item.desc}</p></div>
                              <span className="text-xs font-black text-slate-400">x{item.qty}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="pt-8 border-t-2 border-slate-900">
                        <p className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-1">Total Quotation Value</p>
                        <div className="text-5xl font-black text-[#e63946] flex items-start print:text-4xl"><span className="text-2xl mt-1.5 mr-1">₹</span>{totalPrice}</div>
                        <div className="mt-8 space-y-3 print:hidden">
                          <Button onClick={() => window.print()} variant="outline" className="w-full border-slate-300 font-black h-14 flex items-center gap-2 uppercase tracking-tighter"><FileText size={18}/> Technical PDF Report</Button>
                          
                          {/* Payment Method Buttons */}
                          <div className="grid grid-cols-2 gap-3">
                            <Button 
                              onClick={handleRazorpay}
                              disabled={totalPrice === 0 || orderSubmitting} 
                              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black py-6 rounded-xl shadow-lg uppercase transition-transform active:scale-95 disabled:opacity-50"
                            >
                              {orderSubmitting ? 'Processing...' : 'Razorpay'}
                            </Button>
                            <Button 
                              onClick={handleCOD}
                              disabled={totalPrice === 0 || orderSubmitting} 
                              className="w-full bg-[#e63946] hover:bg-[#d62839] text-white font-black py-6 rounded-xl shadow-lg uppercase transition-transform active:scale-95 disabled:opacity-50"
                            >
                              {orderSubmitting ? 'Processing...' : 'COD'}
                            </Button>
                          </div>
                        </div>
                        <p className="text-[8px] text-slate-400 mt-10 text-center hidden print:block border-t pt-4">Generated via Monica Order Supplier Automated Platform.</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </motion.section>

      <Footer />
    </div>
  );
}