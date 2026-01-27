"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HeroCarousel } from "@/components/hero-carousel";
import { Input } from "@/components/ui/input";
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
  LayoutGrid
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
      price: parseFloat(s.price) 
    })) || FALLBACK_STORAGE_OPTIONS;
  }, [quotationSettings]);

  const TECH_TYPE_PRICES = useMemo(() => {
    const prices: Record<string, number> = {};
    if (quotationSettings?.techTypes) {
      quotationSettings.techTypes.forEach((t: any) => {
        prices[t.name] = parseFloat(t.base_price);
      });
    }
    return Object.keys(prices).length > 0 ? prices : FALLBACK_TECH_TYPE_PRICES;
  }, [quotationSettings]);

  const CAMERA_TYPES = useMemo(() => {
    return quotationSettings?.cameraTypes?.map((c: any) => c.name) || ["IP", "HD"];
  }, [quotationSettings]);

  const CHANNEL_OPTIONS = useMemo(() => {
    return quotationSettings?.channels?.map((ch: any) => ({
      value: ch.channel_count,
      label: `${ch.channel_count} Ch`,
      features: Array.isArray(ch.features) ? ch.features : JSON.parse(ch.features || '[]')
    })) || [
      { value: 4, label: "4 Ch", features: [] },
      { value: 8, label: "8 Ch", features: [] },
      { value: 16, label: "16 Ch", features: [] }
    ];
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
  const [deliveryDate, setDeliveryDate] = useState(""); // New date field
  const [cableOption, setCableOption] = useState("None");
  const [hdCableQty, setHdCableQty] = useState(1);
  const [includeAccessories, setIncludeAccessories] = useState(false);
  const [includeInstallation, setIncludeInstallation] = useState(false);

  // Lead Verification States
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
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

  // --- PRICING LOGIC ---
  const totalPrice = useMemo(() => {
    if (!brand || !cameraType) return 0;
    const calculateCost = (subTypes: any) => Object.entries(subTypes).reduce((acc, [type, pixels]: [string, any]) => {
      return acc + (pixels["2MP"] * TECH_TYPE_PRICES[type]) + (pixels["5MP"] * TECH_TYPE_PRICES[type] * 1.5);
    }, 0);

    let total = calculateCost(indoorSubTypes) + calculateCost(outdoorSubTypes);
    total += STORAGE_OPTIONS.find((s: any) => s.label === storage)?.price || 0;
    total += (Number(channels) || 0) * 450;
    if (has5MPCameras) total += 800;

    if (cameraType === "HD" && cableOption === "3+1 Cable 90M") total += hdCableQty * 1800;
    if (cameraType === "IP") {
      if (cableOption === "CAT6 100M") total += 1800;
      if (cableOption === "CAT6 305M") total += 5500;
    }

    if (includeAccessories) {
      if (cameraType === "HD") {
        total += channels === 4 ? 600 : channels === 8 ? 875 : channels === 16 ? 1750 : 0;
      } else {
        total += channels === 4 ? 1260 : channels === 8 ? 1600 : channels === 16 ? 3150 : 0;
      }
    }

    if (includeInstallation) {
      total += totalCameraCount * (totalCameraCount > 8 ? 350 : 400);
    }

    return Math.round(total + 1500);
  }, [brand, cameraType, indoorSubTypes, outdoorSubTypes, storage, channels, has5MPCameras, cableOption, hdCableQty, includeAccessories, includeInstallation, totalCameraCount]);

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
  
  const handleConfirmBooking = async () => {
    if (!custName || !custPhone || !location || !pincode) {
      alert("Please fill all required fields: Name, Phone, Location, and PIN Code");
      return;
    }

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
        customerEmail: null,
        
        // Order Type
        orderType: bookingType || 'customize',
        comboId: null,
        
        // Address
        installationAddress: location,
        pincode: pincode,
        city: null,
        state: null,
        
        // Technical Details
        cameraType,
        brand,
        channels,
        dvrModel: modelNumber,
        indoorCameras: indoorSubTypes,
        outdoorCameras: outdoorSubTypes,
        storageSize: storage,
        cableOption,
        includeAccessories,
        includeInstallation,
        
        // Pricing
        subtotal: totalPrice - 1500,
        installationCharges: includeInstallation ? totalCameraCount * (totalCameraCount > 8 ? 350 : 400) : 0,
        deliveryCharges: 0,
        taxAmount: 0,
        discountAmount: 0,
        totalAmount: totalPrice,
        
        // Delivery
        expectedDeliveryDate: deliveryDate || null,
        
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
        setCreatedOrderNumber(data.order.orderNumber);
        setOrderSuccess(true);
      } else {
        alert(`Order creation failed: ${data.message}`);
      }
    } catch (error) {
      console.error('Order submission error:', error);
      alert('Failed to submit order. Please try again.');
    } finally {
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

      <section className="relative min-h-[90vh] flex items-center justify-center pt-32 pb-20 overflow-hidden bg-slate-50 print:hidden">
        <HeroCarousel />
        <div className="absolute inset-0 bg-white/70 z-1"></div>
        <motion.div initial="hidden" animate="visible" variants={heroVariants} className="container mx-auto px-4 py-16 relative z-10 text-center">
          <div className="flex items-center justify-center mb-8"><BlinkingDot /><span className="text-[#e63946] text-sm font-bold uppercase tracking-[0.2em]">Officially Certified</span></div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black uppercase tracking-wider text-slate-900 mb-6 leading-tight">Professional CCTV & <br /><span className="text-[#e63946]">Security Services</span></h1>
          <p className="text-slate-600 text-base md:text-lg max-w-3xl mx-auto mb-16">Verified hardware installed by certified experts across India.</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 max-w-6xl mx-auto">
            {[{ icon: Camera, label: "Installation" }, { icon: Network, label: "System Design" }, { icon: Settings, label: "Maintenance" }, { icon: Monitor, label: "Monitoring" }, { icon: HardDrive, label: "Storage & Backup" }, { icon: MessageSquare, label: "Consultation" }].map((s, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-16 h-16 flex items-center justify-center mb-3 transition-transform hover:scale-110"><s.icon className="w-12 h-12 text-[#e63946]" /></div>
                <span className="text-slate-800 text-xs font-bold uppercase text-center">{s.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

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

                      {/* Step 9 & 10 Always Visible inside Customize */}
                      <div className="space-y-8 pt-8 border-t border-slate-100">
                        <div className="grid md:grid-cols-2 gap-8">
                          <div className="space-y-4">
                            <label className="flex items-center gap-2 text-sm font-bold uppercase text-[#e63946]"><Cable size={16}/> Cable Selection (Optional)</label>
                            <select className="w-full bg-slate-50 border p-3 rounded" value={cableOption} onChange={(e) => setCableOption(e.target.value)}>
                              <option value="None">No Cable</option>
                              {cameraType === "HD" ? (<option value="3+1 Cable 90M">3+1 Coaxial (90 Mtr)</option>) : 
                              (<><option value="CAT6 100M">CAT6 LAN (100 Mtr)</option><option value="CAT6 305M">CAT6 LAN (305 Mtr)</option></>)}
                            </select>
                            {cameraType === "HD" && cableOption !== "None" && (
                              <div className="flex items-center gap-4 mt-2 bg-slate-50 p-2 rounded border border-dashed border-slate-300">
                                <span className="text-xs font-bold">Roll Quantity (1-5):</span>
                                <Input type="number" min="1" max="5" value={hdCableQty} onChange={(e) => setHdCableQty(Number(e.target.value))} className="w-20 bg-white" />
                              </div>
                            )}
                          </div>
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

                      {/* Final Section: Moved PIN + Date */}
                      <div className="grid md:grid-cols-2 gap-6 pt-10 border-t border-slate-100">
                        <div className="space-y-4">
                          <label className="flex items-center gap-2 text-sm font-bold uppercase text-[#e63946]"><MapPin size={16}/> PIN Code *</label>
                          <Input maxLength={6} placeholder="6-Digit PIN" className="bg-slate-50 border-slate-200" value={pincode} onChange={(e) => setPincode(e.target.value)} />
                        </div>
                        <div className="space-y-4">
                          <label className="flex items-center gap-2 text-sm font-bold uppercase text-[#e63946]"><Calendar size={16}/> Expected Delivery Date</label>
                          <Input type="date" className="bg-slate-50 border-slate-200" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
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
                          <Button 
                            onClick={handleConfirmBooking}
                            disabled={!pincode || totalPrice === 0 || orderSubmitting} 
                            className="w-full bg-[#e63946] text-white font-black py-8 rounded-2xl shadow-2xl uppercase transition-transform active:scale-95 text-lg disabled:opacity-50"
                          >
                            {orderSubmitting ? 'Creating Order...' : 'Confirm Booking'}
                          </Button>
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