"use client";
import { useState, useEffect, useRef, useMemo } from "react";
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

  const containerRef = useRef<HTMLDivElement>(null);
  const [constraints, setConstraints] = useState(0);
  const scrollProgress = useMotionValue(0);
  const smoothProgress = useSpring(scrollProgress, { stiffness: 100, damping: 20 });
  useEffect(() => { if (containerRef.current) setConstraints(containerRef.current.scrollWidth - containerRef.current.offsetWidth); }, []);
  const x = useTransform(smoothProgress, [0, 100], [0, -constraints]);

  return (
    <div className="bg-white min-h-screen">
      <Navbar />

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
      <section className="bg-white py-6 border-b border-slate-200 print:hidden mt-24">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between gap-6 overflow-x-auto scrollbar-hide">
            {[
              { icon: Zap, label: "24 hrs", sublabel: "Delivery", highlight: true, useIcon: true },
              { image: "/ct.png", label: "CCTV", link: "/categories" },
              { image: "/biometric.png", label: "BIOMETRIC ACCESS" },
              { image: "/gps.png", label: "GPS SYSTEM"},
              { image: "/system.png", label: "SYSTEM" },
              { image: "/fire.jpg", label: "FIRE ALARM" },
              { image: "/intercom.png", label: "INTERCOM SYSTEM"},
              { image: "/motion.png", label: "MOTION DETECTION", },
              { image: "/pasys.png", label: "PA SYSTEM" }
            ].map((item, i) => (
              <div 
                key={i} 
                onClick={() => item.link && router.push(item.link)}
                className="flex flex-col items-center min-w-25 p-3 rounded-lg hover:bg-slate-50 transition-all cursor-pointer group"
              >
                <div className={`w-14 h-14 flex items-center justify-center mb-2 rounded-full ${item.highlight ? 'bg-red-50' : 'bg-slate-50'} group-hover:scale-110 transition-transform overflow-hidden`}>
                  {item.useIcon && item.icon ? (
                    <item.icon className={`w-7 h-7 ${item.highlight ? 'text-[#e63946]' : 'text-slate-600'}`} />
                  ) : (
                    <div className="relative w-10 h-10">
                      <Image 
                        src={item.image || '/placeholder.png'} 
                        alt={item.label}
                        fill
                        className="object-contain"
                      />
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <p className="text-xs font-semibold text-[#e63946] leading-tight">{item.label}</p>
                  {item.sublabel && <p className="text-xs font-semibold text-[#e63946] leading-tight">{item.sublabel}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative pt-16 pb-12 bg-white print:hidden overflow-hidden">
        {/* Background Video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/vid.mp4" type="video/mp4" />
        </video>
        
        {/* Overlay for better text visibility */}
        <div className="absolute inset-0 bg-black/40"></div>
        
        <motion.div initial="hidden" animate="visible" variants={heroVariants} className="container mx-auto px-4 text-center relative z-10">
          <div className="flex items-center justify-center mb-6"><BlinkingDot /><span className="text-white text-sm font-bold uppercase tracking-[0.2em] drop-shadow-lg">Officially Certified</span></div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black uppercase tracking-wider text-white mb-6 leading-tight drop-shadow-2xl">Professional CCTV & <br /><span className="text-[#e63946]">Security Services</span></h1>
          <p className="text-white text-base md:text-lg max-w-3xl mx-auto mb-8 drop-shadow-lg">Verified hardware installed by certified experts across India.</p>
        </motion.div>
      </section>

      {/* Service Categories Section */}
      <section className="bg-slate-50 py-12 border-y border-slate-200 print:hidden">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 max-w-6xl mx-auto">
            {[
              { icon: Camera, label: "Installation" },
              { icon: Network, label: "System Design" },
              { icon: Settings, label: "Maintenance" },
              { icon: Monitor, label: "Monitoring" },
              { icon: HardDrive, label: "Storage & Backup" },
              { icon: MessageSquare, label: "Consultation" }
            ].map((s, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center p-4 rounded-xl hover:bg-white transition-all group cursor-pointer"
              >
                <div className="w-16 h-16 flex items-center justify-center mb-3 transition-transform group-hover:scale-110">
                  <s.icon className="w-12 h-12 text-[#e63946]" />
                </div>
                <span className="text-slate-800 text-xs font-bold uppercase text-center">{s.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Maintain How It Works, Trust, Availability and Footer sections */}
      <section className="py-24 bg-white overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center mb-4">
            <BlinkingDot /> <p className="text-[#e63946] text-xs font-bold tracking-[0.3em] uppercase">Our process, simplified</p>
          </div>
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 100 }} className="text-4xl font-black text-slate-900 uppercase mb-16 text-center">How It Works</motion.h2>
          <div className="relative overflow-hidden">
            <motion.div ref={containerRef} style={{ x }} className="flex gap-12">
              {[
                { step: 1, title: "Automated Quote", desc: "Select hardware and get mixed resolution estimates tailored to you.", color: "#e63946" },
                { step: 2, title: "Admin Verification", desc: "Our team performs a manual confirmation call to verify mixed specs.", color: "#7700ff" },
                { step: 3, title: "Dealer Assignment", desc: "We assign the job to the top-rated dealer within a 5-10km radius.", color: "#00ccff" }
              ].map((item, i) => (
                <motion.div key={i} whileHover={{ y: -15, scale: 1.02 }} className="min-w-75 md:min-w-100 group relative p-10 rounded-[2rem] bg-slate-50 border border-slate-200 hover:border-[#e63946]/50 transition-colors">
                  <div className="w-16 h-16 bg-[#e63946] rounded-full flex items-center justify-center text-white font-bold text-2xl mb-8 shadow-lg">{item.step}</div>
                  <h4 className="text-2xl font-bold text-slate-900 uppercase mb-4 tracking-tight">{item.title}</h4>
                  <p className="text-slate-600 text-base leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
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

      {/* Availability Check */}
      <section className="py-24 bg-white border-t border-slate-100">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <p className="text-[#e63946] text-xs font-bold tracking-[0.3em] uppercase mb-4"><BlinkingDot />Availability</p>
          <h2 className="text-4xl font-black text-slate-900 uppercase mb-6">Check Availability</h2>
          <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
            <div className="relative w-full md:w-64">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input type="text" maxLength={6} placeholder="Enter PIN Code" className="w-full bg-slate-50 border border-slate-200 p-4 pl-12 rounded-xl text-slate-900 focus:border-[#e63946] outline-none transition-all shadow-inner" onChange={(e) => setPincode(e.target.value)} />
            </div>
            <Button onClick={checkAvailability} className="bg-[#e63946] hover:bg-red-700 text-white font-bold h-14 px-8 w-full md:w-auto rounded-xl shadow-md">
              <Search className="mr-2" size={18} /> CHECK NOW
            </Button>
          </div>
          {availabilityMessage && (
            <div className={`mt-6 p-4 rounded-xl text-sm font-bold shadow-sm ${availabilityMessage.includes('Success') ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
              {availabilityMessage}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}