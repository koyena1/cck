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
  Check
} from "lucide-react";

// --- DATA CONSTANTS ---
const BRANDS = ["Hikvision", "CP Plus", "Honeywell", "Dahua"];

const CHANNEL_DETAILS: Record<number, string[]> = {
  4: ["Supports up to 4 Cameras", "1080p/5MP Lite Resolution", "1 SATA Port (Up to 6TB)", "H.265+ Compression"],
  8: ["Supports up to 8 Cameras", "5MP Real-time Resolution Support", "1 SATA Port (Up to 10TB)", "Smart Search Features"],
  16: ["Supports up to 16 Cameras", "4K Output / 5MP Multi-channel", "2 SATA Ports (Up to 20TB)", "Advanced Analytics"]
};

const TECH_TYPE_PRICES: Record<string, number> = {
  "HD Non Audio": 1200,
  "HD Audio": 1500,
  "HD Smart Hybrid": 1800,
  "HD Full Color": 2200,
};

const STORAGE_OPTIONS = [
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
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
};

const heroVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 1, ease: [0.16, 1, 0.3, 1] } },
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
  // --- STATE ---
  const [cameraType, setCameraType] = useState("");
  const [brand, setBrand] = useState("");
  const [channels, setChannels] = useState<number | "">("");
  const [pixelDefault, setPixelDefault] = useState("2MP");
  const [modelNumber, setModelNumber] = useState("");
  const [storage, setStorage] = useState("");
  const [location, setLocation] = useState("");
  const [pincode, setPincode] = useState(""); // Mandatory Pin Code
  const [cableLength, setCableLength] = useState("None"); // Step 9
  const [selectedAccessories, setSelectedAccessories] = useState<string[]>([]); // Step 10
  const [availabilityMessage, setAvailabilityMessage] = useState("");
  
  // --- LEAD & VERIFICATION STATE ---
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [currentDate, setCurrentDate] = useState("");

  const [indoorSubTypes, setIndoorSubTypes] = useState({
    "HD Non Audio": { "2MP": 0, "5MP": 0 },
    "HD Audio": { "2MP": 0, "5MP": 0 },
    "HD Smart Hybrid": { "2MP": 0, "5MP": 0 },
    "HD Full Color": { "2MP": 0, "5MP": 0 }
  });

  const [outdoorSubTypes, setOutdoorSubTypes] = useState({
    "HD Non Audio": { "2MP": 0, "5MP": 0 },
    "HD Audio": { "2MP": 0, "5MP": 0 },
    "HD Smart Hybrid": { "2MP": 0, "5MP": 0 },
    "HD Full Color": { "2MP": 0, "5MP": 0 }
  });

  // Auto-fill Model Number
  useEffect(() => {
    if (brand && cameraType && channels) {
      const typeCode = cameraType === 'IP' ? 'NX' : 'DX';
      const brandCode = brand.substring(0, 3).toUpperCase();
      setModelNumber(`${brandCode}-${typeCode}-${channels}-${pixelDefault}`);
    } else {
      setModelNumber("");
    }
  }, [brand, cameraType, channels, pixelDefault]);

  // Derived Values
  const getCategoryTotal = (subTypes: any) => 
    Object.values(subTypes).reduce((acc: number, pixelMap: any) => acc + pixelMap["2MP"] + pixelMap["5MP"], 0);

  const indoorQty = getCategoryTotal(indoorSubTypes);
  const outdoorQty = getCategoryTotal(outdoorSubTypes);
  const totalCameraCount = indoorQty + outdoorQty;

  const has5MPCameras = useMemo(() => {
    const check = (subTypes: any) => Object.values(subTypes).some((p: any) => p["5MP"] > 0);
    return check(indoorSubTypes) || check(outdoorSubTypes);
  }, [indoorSubTypes, outdoorSubTypes]);

  // Dynamic Resolution Sync
  useEffect(() => {
    if (has5MPCameras) setPixelDefault("5MP");
    else setPixelDefault("2MP");
  }, [has5MPCameras]);

  // Set date on client side to avoid hydration mismatch
  useEffect(() => {
    setCurrentDate(new Date().toLocaleDateString());
  }, []);

  // --- PRICING LOGIC ---
  const totalPrice = useMemo(() => {
    if (!brand || !cameraType) return 0;

    const calculateCost = (subTypes: any) => {
      return Object.entries(subTypes).reduce((acc, [type, pixels]: [string, any]) => {
        const cost2MP = pixels["2MP"] * TECH_TYPE_PRICES[type];
        const cost5MP = pixels["5MP"] * TECH_TYPE_PRICES[type] * 1.5;
        return acc + cost2MP + cost5MP;
      }, 0);
    };

    const storagePrice = STORAGE_OPTIONS.find(s => s.label === storage)?.price || 0;
    const recorderBase = (Number(channels) || 0) * 450;
    const upgradeFee = has5MPCameras ? 800 : 0;
    
    // New step costs
    const cablePrice = CABLE_OPTIONS.find(c => c.label === cableLength)?.price || 0;
    const accessoryPrice = selectedAccessories.reduce((acc, item) => acc + ACCESSORY_PRICES[item], 0);

    return Math.round(calculateCost(indoorSubTypes) + calculateCost(outdoorSubTypes) + storagePrice + recorderBase + upgradeFee + cablePrice + accessoryPrice + 1500);
  }, [brand, cameraType, indoorSubTypes, outdoorSubTypes, storage, channels, has5MPCameras, cableLength, selectedAccessories]);

  // Counter Logic
  const updateQty = (category: 'indoor' | 'outdoor', type: string, pixel: '2MP' | '5MP', delta: number) => {
    if (delta > 0 && channels && totalCameraCount + 1 > Number(channels)) {
      alert(`Limit Reached: Your selected ${channels}-Channel ${cameraType === 'IP' ? 'NVR' : 'DVR'} supports a maximum of ${channels} cameras.`);
      return;
    }
    const setter = category === 'indoor' ? setIndoorSubTypes : setOutdoorSubTypes;
    setter(prev => ({
      ...prev,
      [type]: {
        ...prev[type as keyof typeof indoorSubTypes],
        [pixel]: Math.max(0, prev[type as keyof typeof indoorSubTypes][pixel] + delta)
      }
    }));
  };

  // Manual Input Logic
  const handleManualTotal = (category: 'indoor' | 'outdoor', total: number) => {
    const otherCategoryTotal = category === 'indoor' ? outdoorQty : indoorQty;
    if (channels && total + otherCategoryTotal > Number(channels)) {
      alert(`Capacity Warning: Total cameras cannot exceed the ${channels}-Channel limit.`);
      return;
    }
    let currentPixel = pixelDefault;
    if (pixelDefault === "5MP") {
      setPixelDefault("2MP");
      currentPixel = "2MP";
    }
    const emptyBreakdown = {
      "HD Non Audio": { "2MP": 0, "5MP": 0 }, "HD Audio": { "2MP": 0, "5MP": 0 },
      "HD Smart Hybrid": { "2MP": 0, "5MP": 0 }, "HD Full Color": { "2MP": 0, "5MP": 0 }
    };
    const setter = category === 'indoor' ? setIndoorSubTypes : setOutdoorSubTypes;
    setter({
      ...emptyBreakdown,
      "HD Non Audio": { ...emptyBreakdown["HD Non Audio"], [currentPixel]: total }
    });
  };

  const toggleAccessory = (item: string) => {
    setSelectedAccessories(prev => 
      prev.includes(item) ? prev.filter(a => a !== item) : [...prev, item]
    );
  };

  // OTP Logic Simulation
  const handleSendOtp = () => {
    if (custName.length < 3 || custPhone.length < 10) {
      alert("Please enter a valid Name and 10-digit Phone Number.");
      return;
    }
    setOtpSent(true);
    alert("Simulation: OTP Sent to " + custPhone + ". Enter 1234 to verify.");
  };

  const handleVerifyOtp = () => {
    if (otpInput === "1234") {
      setIsVerified(true);
    } else {
      alert("Invalid OTP. Try 1234.");
    }
  };

  // PDF Technical BOM Generator
  const generateBOM = () => {
    const items: { model: string; qty: number; desc: string }[] = [];
    const bCode = brand.substring(0, 3).toUpperCase();

    // Recorder
    items.push({ model: modelNumber, qty: 1, desc: `${channels} Channel Recorder` });

    // Cameras
    const addCams = (subs: any, label: string) => {
      Object.entries(subs).forEach(([type, pixels]: [string, any], idx) => {
        if (pixels["2MP"] > 0) items.push({ model: `${bCode}-C${idx + 1}-2MP`, qty: pixels["2MP"], desc: `${label} ${type}` });
        if (pixels["5MP"] > 0) items.push({ model: `${bCode}-C${idx + 1}-5MP`, qty: pixels["5MP"], desc: `${label} ${type} (HD)` });
      });
    };
    addCams(indoorSubTypes, "Indoor");
    addCams(outdoorSubTypes, "Outdoor");

    // Storage
    if (storage) items.push({ model: `SURV-HDD-${storage}`, qty: 1, desc: "Surveillance Hard Drive" });

    return items;
  };

  const handleDownloadPdf = () => {
    window.print(); // Browser optimized print for simplicity
  };

  // --- UI HELPERS ---
  const containerRef = useRef<HTMLDivElement>(null);
  const [constraints, setConstraints] = useState(0);
  const scrollProgress = useMotionValue(0);
  const smoothProgress = useSpring(scrollProgress, { stiffness: 100, damping: 20 });
  useEffect(() => {
    if (containerRef.current) setConstraints(containerRef.current.scrollWidth - containerRef.current.offsetWidth);
  }, []);
  const x = useTransform(smoothProgress, [0, 100], [0, -constraints]);

  const checkAvailability = () => {
    if (pincode.length === 6) {
      setAvailabilityMessage("Searching for top-rated dealers in your area...");
      setTimeout(() => setAvailabilityMessage("Success! Verified installers are available."), 1500);
    } else {
      setAvailabilityMessage("Please enter a valid 6-digit PIN code.");
    }
  };

  return (
    <div className="bg-white min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-32 pb-20 overflow-hidden bg-slate-50">
        <HeroCarousel />
        <div className="absolute inset-0 bg-white/70 z-1"></div>
        <motion.div initial="hidden" animate="visible" variants={heroVariants} className="container mx-auto px-4 py-16 relative z-10 text-center">
          <div className="flex items-center justify-center mb-8">
            <BlinkingDot />
            <span className="text-[#e63946] text-sm font-bold uppercase tracking-[0.2em]">Officially Certified</span>
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black uppercase tracking-wider text-slate-900 mb-6 leading-tight">
            Professional CCTV & <br /><span className="text-[#e63946]">Security Services</span>
          </h1>
          <p className="text-slate-600 text-base md:text-lg max-w-3xl mx-auto mb-16">
            24/7 surveillance for total peace of mind. High-quality hardware installed by certified experts.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 max-w-6xl mx-auto">
            {[
              { icon: Camera, label: "Installation" }, { icon: Network, label: "System Design" },
              { icon: Settings, label: "Maintenance" }, { icon: Monitor, label: "Monitoring" },
              { icon: HardDrive, label: "Storage & Backup" }, { icon: MessageSquare, label: "Consultation" }
            ].map((service, index) => (
              <motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 + (index * 0.1) }} className="flex flex-col items-center group cursor-pointer">
                <div className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center mb-3 transition-transform group-hover:scale-110">
                  <service.icon className="w-12 h-12 md:w-14 md:h-14 text-[#e63946] stroke-[1.5]" />
                </div>
                <span className="text-slate-800 text-xs md:text-sm font-bold uppercase tracking-wider text-center">{service.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Automated Quotation Engine */}
      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} id="quote-engine" className="py-24 bg-slate-50 relative print:bg-white print:py-0">
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-12 print:hidden">
            <div className="flex items-center justify-center mb-4 text-[#e63946]"><BlinkingDot /> <p className="text-xs font-bold uppercase tracking-widest">Step-by-Step System Builder</p></div>
            <h2 className="text-4xl font-black text-slate-900 uppercase">Automated Quotation</h2>
          </div>

          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Input Side (Hidden in PDF) */}
            <div className="lg:col-span-2 space-y-6 print:hidden">
              <Card className="bg-white border border-slate-200 text-slate-900 p-6 shadow-xl rounded-2xl">
                <CardContent className="space-y-10 p-0">
                  {/* Step 1 & 2 */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <label className="flex items-center gap-2 text-sm font-bold uppercase text-[#e63946]"><ChevronRight size={16}/> Step 1: Camera Type</label>
                      <select className="w-full bg-slate-50 border border-slate-200 p-3 rounded text-slate-900" value={cameraType} onChange={(e) => setCameraType(e.target.value)}>
                        <option value="">Select Type</option><option value="IP">IP Camera</option><option value="HD">HD Camera</option>
                      </select>
                    </div>
                    {cameraType && (
                      <div className="space-y-4">
                        <label className="flex items-center gap-2 text-sm font-bold uppercase text-[#e63946]"><ChevronRight size={16}/> Step 2: Brand</label>
                        <select className="w-full bg-slate-50 border border-slate-200 p-3 rounded text-slate-900" value={brand} onChange={(e) => setBrand(e.target.value)}>
                          <option value="">Select Brand</option>{BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Step 3 & 4 */}
                  {brand && (
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <label className="text-sm font-bold uppercase text-[#e63946]">Step 3: {cameraType === 'IP' ? 'NVR' : 'DVR'} Channels</label>
                        <select className="w-full bg-slate-50 border border-slate-200 p-3 rounded" value={channels} onChange={(e) => setChannels(Number(e.target.value))}>
                          <option value="">Select Channel</option><option value="4">4 Ch</option><option value="8">8 Ch</option><option value="16">16 Ch</option>
                        </select>
                      </div>
                      <div className="space-y-4">
                        <label className="text-sm font-bold uppercase text-[#e63946]">Step 4: Default Pixel</label>
                        <select className="w-full bg-slate-50 border border-slate-200 p-3 rounded" value={pixelDefault} onChange={(e) => setPixelDefault(e.target.value)}>
                          <option value="2MP">2MP</option><option value="5MP">5MP</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Step 5 (Camera Grid) */}
                  {channels && (
                    <div className="space-y-8 border-t pt-8">
                       <div className="flex items-center gap-2 text-sm font-bold uppercase text-[#e63946]"><ChevronRight size={16}/> Step 5: Indoor / Outdoor Quantity</div>
                       <div className="grid md:grid-cols-2 gap-12">
                          {['indoor', 'outdoor'].map((cat) => (
                            <div key={cat} className="space-y-4">
                              <div className="bg-slate-100 p-3 rounded flex justify-between items-center"><span className="font-bold text-xs uppercase">{cat} Total</span><Input type="number" className="w-20 bg-white" value={cat === 'indoor' ? indoorQty : outdoorQty} onChange={(e) => handleManualTotal(cat as any, Number(e.target.value))} /></div>
                              <div className="pl-4 space-y-4 border-l-2 border-slate-200">
                                {Object.entries(cat === 'indoor' ? indoorSubTypes : outdoorSubTypes).map(([type, pixels]: [string, any]) => (
                                  <div key={type} className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400">{type}</p>
                                    <div className="grid grid-cols-2 gap-2">
                                      {['2MP', '5MP'].map(px => (
                                        <div key={px} className="flex items-center justify-between bg-slate-50 p-1.5 rounded border border-slate-100">
                                          <span className="text-[10px] font-bold">{px}</span>
                                          <div className="flex items-center gap-2">
                                            <button onClick={() => updateQty(cat as any, type, px as any, -1)}><Minus size={10}/></button>
                                            <span className="text-xs font-black">{pixels[px]}</span>
                                            <button onClick={() => updateQty(cat as any, type, px as any, 1)} className="text-[#e63946]"><Plus size={10}/></button>
                                          </div>
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

                  {/* Step 6-10 */}
                  {channels && (
                    <div className="grid md:grid-cols-3 gap-6 pt-6 border-t">
                      <div className="space-y-2"><label className="text-[10px] font-bold uppercase">Model</label><Input value={modelNumber} disabled className="bg-slate-100 text-[10px]" /></div>
                      <div className="space-y-2"><label className="text-[10px] font-bold uppercase">Storage</label><select className="w-full bg-slate-50 border p-2 rounded text-xs" value={storage} onChange={(e) => setStorage(e.target.value)}><option value="">Select HDD</option>{STORAGE_OPTIONS.map(s => <option key={s.label} value={s.label}>{s.label}</option>)}</select></div>
                      <div className="space-y-2"><label className="text-[10px] font-bold uppercase">Pin Code *</label><Input maxLength={6} className="bg-slate-50" value={pincode} onChange={(e) => setPincode(e.target.value)} /></div>
                    </div>
                  )}

                  {pincode.length === 6 && (
                    <div className="grid md:grid-cols-2 gap-8 pt-6 border-t">
                       <div className="space-y-2"><label className="text-xs font-bold uppercase">Step 9: Cable</label><select className="w-full bg-slate-50 border p-3 rounded" value={cableLength} onChange={(e) => setCableLength(e.target.value)}>{CABLE_OPTIONS.map(c => <option key={c.label} value={c.label}>{c.label}</option>)}</select></div>
                       <div className="space-y-2"><label className="text-xs font-bold uppercase">Step 10: Accessories</label><div className="space-y-1">{Object.keys(ACCESSORY_PRICES).map(item => (<label key={item} className="flex items-center gap-2 text-xs"><input type="checkbox" checked={selectedAccessories.includes(item)} onChange={() => setSelectedAccessories(prev => prev.includes(item) ? prev.filter(a => a !== item) : [...prev, item])} /> {item}</label>))}</div></div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Side Sidebar (Verified / Unverified) */}
            <div className="space-y-6">
              <Card className="bg-white text-slate-900 border border-slate-200 shadow-2xl overflow-hidden rounded-2xl sticky top-24 print:static print:shadow-none print:border-none">
                <div className="bg-slate-900 p-4 text-white flex items-center gap-2 print:hidden">
                  <Info size={18} className="text-[#e63946]" />
                  <span className="font-bold uppercase tracking-tight text-sm">{cameraType === 'IP' ? 'NVR Details' : 'DVR Details'}</span>
                </div>
                
                {/* Print Header (Only in PDF) */}
                <div className="hidden print:block p-8 border-b-2 border-slate-900">
                   <h1 className="text-2xl font-black uppercase text-slate-900">Quotation - Monica Security</h1>
                   <p className="text-sm font-bold mt-2">To: {custName} | Phone: {custPhone}</p>
                   <p className="text-xs text-slate-500">Date: {currentDate}</p>
                </div>

                <CardContent className="p-6">
                  {!isVerified && !otpSent ? (
                    <div className="space-y-6 print:hidden">
                      <div className="text-center"><Lock size={40} className="mx-auto text-slate-300 mb-2"/><p className="text-sm font-bold text-slate-500 uppercase">Verify Identity to View Quote</p></div>
                      <div className="space-y-4">
                        <div className="relative"><User className="absolute left-3 top-3 text-slate-400" size={16}/><Input placeholder="Customer Name" value={custName} onChange={(e) => setCustName(e.target.value)} className="pl-10"/></div>
                        <div className="relative"><Smartphone className="absolute left-3 top-3 text-slate-400" size={16}/><Input placeholder="Phone Number" value={custPhone} onChange={(e) => setCustPhone(e.target.value)} className="pl-10"/></div>
                        <Button onClick={handleSendOtp} className="w-full bg-slate-900 text-white font-bold h-12 uppercase">Send OTP & Generate</Button>
                      </div>
                    </div>
                  ) : !isVerified && otpSent ? (
                    <div className="space-y-4 print:hidden">
                      <p className="text-xs font-bold text-slate-500 text-center uppercase tracking-widest">Enter Verification Code</p>
                      <Input placeholder="Enter 4-Digit OTP" value={otpInput} onChange={(e) => setOtpInput(e.target.value)} className="text-center font-black text-xl h-14"/>
                      <Button onClick={handleVerifyOtp} className="w-full bg-[#e63946] text-white font-black h-12 uppercase">Verify Now</Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="p-3 bg-green-50 border border-green-100 rounded-lg print:hidden">
                        <p className="text-[10px] font-black uppercase text-green-600 mb-1 flex items-center gap-1"><Check size={10}/> Verification Successful</p>
                        <p className="text-xs font-bold text-slate-700">{custName} | {custPhone}</p>
                      </div>

                      {/* Technical BOM (No Prices per item) */}
                      <div className="space-y-4">
                        <h4 className="text-xs font-black uppercase border-b pb-2">Technical Bill of Materials</h4>
                        <ul className="space-y-3">
                          {generateBOM().map((item, i) => (
                            <li key={i} className="flex justify-between items-start border-b border-dashed pb-2 last:border-0">
                              <div><p className="text-[11px] font-black text-slate-800">{item.model}</p><p className="text-[9px] text-slate-400 uppercase font-bold">{item.desc}</p></div>
                              <span className="text-xs font-bold text-slate-500">Qty: {item.qty}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="pt-6 border-t-2 border-slate-900 mt-12">
                        <p className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-1">Grand Total Amount</p>
                        <div className="text-5xl font-black text-[#e63946] flex items-start print:text-3xl">
                          <span className="text-2xl mt-1.5 mr-1">₹</span>{totalPrice}
                        </div>
                        
                        <div className="mt-8 space-y-3 print:hidden">
                          <Button onClick={handleDownloadPdf} variant="outline" className="w-full border-slate-200 font-bold h-12 flex items-center gap-2 uppercase"><FileText size={16}/> Download PDF Report</Button>
                          <Button className="w-full bg-[#e63946] text-white font-black py-7 rounded-xl shadow-lg uppercase transition-transform active:scale-95">Book Installation Now</Button>
                        </div>
                        <p className="text-[9px] text-slate-400 mt-4 text-center hidden print:block italic">Generated via Monica Security Automated Platform.</p>
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