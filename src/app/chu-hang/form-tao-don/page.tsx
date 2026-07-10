"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, MapPin, Calendar, Clock, Truck, Package, Info,
  Upload, Trash2, ShieldCheck, ArrowRight, Loader2, Sparkles, ChevronDown
} from "lucide-react";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import { BorderBeam } from "@/components/magicui/border-beam";
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { DotPattern } from "@/components/magicui/dot-pattern";
import { cn } from "@/lib/utils";

type LatLng = { lat: number; lng: number };

const GOOGLE_MAPS_SCRIPT_ID = "google-maps-script";
const GOOGLE_MAPS_SCRIPT_SRC =
  "https://maps.googleapis.com/maps/api/js?key=AIzaSyDAom_mi4uBknVObU46tCt6l3RsgPEzzPE&libraries=places,geometry";

// Real options derived from Flutter/Backend definitions. "ô tô" is placed first matching the mobile logic.
const VEHICLE_TYPES = [
  "ô tô", // passenger car
  "xe tải thùng bạt",
  "xe tải thùng kín",
  "xe tải thùng lửng",
  "xe tải đông lạnh",
  "container / xe đầu kéo",
  "xe cứu hộ",
  "xe van / ô tô bán tải",
  "xe cẩu tự hành",
  "xe ben (xe ô tô ben)",
  "xe bồn (tanker)",
  "xe chở gia súc",
  "xe cần cẩu",
  "xe chở ô tô (lồng)",
  "các xe công trình",
];

const CARGO_TYPES = [
  "đồ gia dụng / nội thất",
  "vật liệu xây dựng",
  "hàng thực phẩm / nông sản",
  "hàng đông lạnh",
  "hàng dễ vỡ",
  "hàng thiết bị điện tử",
  "máy móc & thiết bị",
  "siêu trường siêu trọng",
  "hàng hóa lỏng",
];

const SEAT_TYPES = ["4 ghế", "7 ghế", "9 ghế", "16 ghế", "29 ghế", "45 ghế"];

const WEIGHT_RANGES = [
  "dưới 1 tấn",
  "1 - 2 tấn",
  "2 - 3.5 tấn",
  "3.5 - 5 tấn",
  "5 - 8 tấn",
  "8 - 10 tấn",
  "10 - 15 tấn",
  "15 - 20 tấn",
  "20 - 30 tấn",
  "30 - 40 tấn",
  "trên 40 tấn",
];

const CONTAINER_TYPES = [
  "xe container 20 feet",
  "xe container 40 feet",
  "xe container 45 feet",
  "xe container lạnh (reefer)",
  "xe container mở nóc (open top)",
  "xe container phẳng (flat rack)",
  "xe container moóc lùn (low-boy trailer)",
  "xe container lồng (chở ô tô)",
  "xe container có cần cẩu (sidelifter)",
];

const CONSTRUCTION_VEHICLE_TYPES = [
  "xe máy đào",
  "xe máy xúc lật vs ủi",
  "xe nâng",
  "xe lu",
  "máy phát điện",
];

const WEIGHT_BASED_VEHICLE_TYPES = [
  "xe tải thùng bạt",
  "xe tải thùng kín",
  "xe tải thùng lửng",
  "xe tải đông lạnh",
  "xe cứu hộ",
  "xe van / ô tô bán tải",
  "xe cẩu tự hành",
  "xe ben (xe ô tô ben)",
  "xe bồn (tanker)",
  "xe chở gia súc",
  "xe cần cẩu",
  "xe chở ô tô (lồng)",
];

// Helper to capitalize first letter of a string
const capitalizeFirst = (str: string) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Custom SearchableSelect component styled after Register page inputs
interface SearchableSelectProps {
  id: string;
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder?: string;
  icon?: React.ComponentType<any>;
}

function SearchableSelect({
  id,
  label,
  value,
  onChange,
  options,
  placeholder = "Gõ từ khóa để tìm kiếm...",
  icon: Icon,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("");
    }
  }, [isOpen]);

  const handleOptionClick = (opt: string) => {
    onChange(opt);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative group">
        <input
          type="text"
          id={id}
          placeholder=" "
          value={isOpen ? searchTerm : capitalizeFirst(value)}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="peer w-full pl-12 pr-10 pt-6 pb-2 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-500/10 text-slate-800 text-sm font-semibold transition-all  bg-slate-50/30 cursor-pointer"
          autoComplete="off"
        />
        <label
          htmlFor={id}
          className="absolute left-12 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 uppercase tracking-wider pointer-events-none transition-all duration-200 origin-left peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-focus:-translate-y-[15px] peer-focus:scale-75 peer-focus:text-primary-600 peer-[:not(:placeholder-shown)]:-translate-y-[15px] peer-[:not(:placeholder-shown)]:scale-75 peer-[:not(:placeholder-shown)]:text-primary-600"
        >
          {label}
        </label>
        {Icon && (
          <Icon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 peer-focus:text-primary-500" />
        )}
        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto p-2 space-y-1 animate-fade-in">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => {
              const isSelected = opt === value;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleOptionClick(opt)}
                  className={cn(
                    "w-full text-left px-4 py-3 rounded-xl text-xs font-semibold transition-colors flex items-center justify-between",
                    isSelected
                      ? "bg-primary-50 text-primary-600"
                      : "text-slate-700 hover:bg-slate-50"
                  )}
                >
                  <span>{capitalizeFirst(opt)}</span>
                  {isSelected && <span>✓</span>}
                </button>
              );
            })
          ) : (
            <div className="px-4 py-3 text-xs text-slate-400 text-center font-medium">
              Không tìm thấy phương tiện phù hợp
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ShipperCreateOrderPage() {
  const router = useRouter();

  // Locations State
  const [pickupAddress, setPickupAddress] = useState("");
  const [pickupCoords, setPickupCoords] = useState<LatLng | null>(null);
  const [dropoffAddress, setDropoffAddress] = useState("");
  const [dropoffCoords, setDropoffCoords] = useState<LatLng | null>(null);

  // Date & Time
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");

  // Vehicle & Cargo details. Default value set to "ô tô"
  const [selectedVehicleType, setSelectedVehicleType] = useState("ô tô");
  const [selectedWeight, setSelectedWeight] = useState("dưới 1 tấn");
  const [selectedContainer, setSelectedContainer] = useState("xe container 20 feet");
  const [selectedSeat, setSelectedSeat] = useState("4 ghế");
  const [selectedConstruction, setSelectedConstruction] = useState("xe máy đào");
  const [selectedCargo, setSelectedCargo] = useState<string[]>([]);
  const [note, setNote] = useState("");

  // Images State
  const [cargoImages, setCargoImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Map & Route States
  const [mapLoaded, setMapLoaded] = useState(false);
  const [distance, setDistance] = useState<number | null>(null); // in meters
  const [duration, setDuration] = useState<string | null>(null);
  const [priceBreakdown, setPriceBreakdown] = useState({ base: 0, service: 0, total: 0 });

  // UI State
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdOrderCode, setCreatedOrderCode] = useState("");

  const mapRef = useRef<any>(null);
  const pickupInputRef = useRef<HTMLInputElement | null>(null);
  const dropoffInputRef = useRef<HTMLInputElement | null>(null);
  const directionsRendererRef = useRef<any>(null);
  const pickupMarkerRef = useRef<any>(null);
  const dropoffMarkerRef = useRef<any>(null);

  // Load Google Maps API
  useEffect(() => {
    if (typeof window === "undefined") return;

    const loadScript = () => {
      if ((window as any).google?.maps) {
        setMapLoaded(true);
        return;
      }

      const existingScript = document.getElementById(GOOGLE_MAPS_SCRIPT_ID);
      if (existingScript) return;

      const script = document.createElement("script");
      script.id = GOOGLE_MAPS_SCRIPT_ID;
      script.src = GOOGLE_MAPS_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => setMapLoaded(true);
      document.body.appendChild(script);
    };

    loadScript();
  }, []);

  // Initialize autocomplete and map
  useEffect(() => {
    if (!mapLoaded) return;
    const google = (window as any).google;

    // Initialize Autocomplete
    if (pickupInputRef.current) {
      const autocompletePickup = new google.maps.places.Autocomplete(pickupInputRef.current, {
        componentRestrictions: { country: "vn" },
      });
      autocompletePickup.addListener("place_changed", () => {
        const place = autocompletePickup.getPlace();
        setPickupAddress(place.formatted_address || place.name || "");
        if (place.geometry?.location) {
          setPickupCoords({
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          });
        }
      });
    }

    if (dropoffInputRef.current) {
      const autocompleteDropoff = new google.maps.places.Autocomplete(dropoffInputRef.current, {
        componentRestrictions: { country: "vn" },
      });
      autocompleteDropoff.addListener("place_changed", () => {
        const place = autocompleteDropoff.getPlace();
        setDropoffAddress(place.formatted_address || place.name || "");
        if (place.geometry?.location) {
          setDropoffCoords({
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          });
        }
      });
    }

    // Initialize Map preview
    const mapContainer = document.getElementById("order-form-map");
    if (mapContainer && !mapRef.current) {
      const map = new google.maps.Map(mapContainer, {
        center: { lat: 16.054407, lng: 108.202164 },
        zoom: 6,
        disableDefaultUI: true,
        zoomControl: true
      });
      mapRef.current = map;

      const directionsRenderer = new google.maps.DirectionsRenderer({
        map,
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: "#136DEC",
          strokeOpacity: 0.85,
          strokeWeight: 6,
        },
      });
      directionsRendererRef.current = directionsRenderer;
    }
  }, [mapLoaded]);

  // Update map markers & routes
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    const google = (window as any).google;
    const map = mapRef.current;

    // Clear old markers
    if (pickupMarkerRef.current) pickupMarkerRef.current.setMap(null);
    if (dropoffMarkerRef.current) dropoffMarkerRef.current.setMap(null);

    // Redraw markers
    if (pickupCoords) {
      pickupMarkerRef.current = new google.maps.Marker({
        position: pickupCoords,
        map,
        label: { text: "A", color: "#ffffff", fontWeight: "600" },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 14,
          fillColor: "#2563eb",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 3,
        },
      });
    }

    if (dropoffCoords) {
      dropoffMarkerRef.current = new google.maps.Marker({
        position: dropoffCoords,
        map,
        label: { text: "B", color: "#ffffff", fontWeight: "600" },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 14,
          fillColor: "#ef4444",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 3,
        },
      });
    }

    // Call directions service
    if (pickupCoords && dropoffCoords) {
      const directionsService = new google.maps.DirectionsService();
      directionsService.route(
        {
          origin: pickupCoords,
          destination: dropoffCoords,
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result: any, status: any) => {
          if (status === google.maps.DirectionsStatus.OK && directionsRendererRef.current) {
            directionsRendererRef.current.setDirections(result);
            const route = result.routes[0].legs[0];
            setDistance(route.distance.value);
            setDuration(route.duration.text);

            // Zoom map to fit
            const bounds = new google.maps.LatLngBounds();
            bounds.extend(pickupCoords);
            bounds.extend(dropoffCoords);
            map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
          }
        }
      );
    } else if (pickupCoords) {
      map.setCenter(pickupCoords);
      map.setZoom(14);
    } else if (dropoffCoords) {
      map.setCenter(dropoffCoords);
      map.setZoom(14);
    }
  }, [pickupCoords, dropoffCoords, mapLoaded]);

  // Compute pricing
  useEffect(() => {
    if (!distance) {
      setPriceBreakdown({ base: 0, service: 0, total: 0 });
      return;
    }

    // Base calculation
    const km = distance / 1000;
    let baseRate = 18000; // rate per km

    if (selectedVehicleType === "container / xe đầu kéo") baseRate = 35000;
    else if (selectedVehicleType === "các xe công trình") baseRate = 40000;
    else if (selectedVehicleType === "ô tô") baseRate = 14000;

    let multiplier = 1.0;
    if (selectedWeight.includes("2 - 3.5")) multiplier = 1.2;
    else if (selectedWeight.includes("3.5 - 5")) multiplier = 1.5;
    else if (selectedWeight.includes("8 - 10")) multiplier = 2.0;
    else if (selectedWeight.includes("15 - 20")) multiplier = 2.8;
    else if (selectedWeight.includes("30 - 40")) multiplier = 4.0;

    const rawBase = km * baseRate * multiplier;
    const base = Math.max(Math.round(rawBase / 1000) * 1000, 300000); // Min 300k
    const service = Math.round((base * 0.03) / 1000) * 1000; // 3% fee
    const total = base + service;

    setPriceBreakdown({ base, service, total });
  }, [distance, selectedVehicleType, selectedWeight]);

  // Handle cargo multi-select
  const toggleCargo = (type: string) => {
    setSelectedCargo((prev) =>
      prev.includes(type) ? prev.filter((item) => item !== type) : [...prev, type]
    );
  };

  // Mock Upload cargo images
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const fileList = Array.from(e.target.files);

    if (cargoImages.length + fileList.length > 3) {
      alert("Chỉ được đính kèm tối đa 3 hình ảnh hàng hóa");
      return;
    }

    setIsUploading(true);

    // Simulate network upload
    setTimeout(() => {
      const newUrls = fileList.map((file) => URL.createObjectURL(file));
      setCargoImages((prev) => [...prev, ...newUrls]);
      setIsUploading(false);
    }, 1200);
  };

  // Remove image
  const removeImage = (index: number) => {
    setCargoImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Validate form
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!pickupAddress) errors.pickup = "Địa chỉ lấy hàng là bắt buộc";
    if (!dropoffAddress) errors.dropoff = "Địa chỉ nhận hàng là bắt buộc";
    if (!pickupDate) errors.date = "Ngày nhận là bắt buộc";
    if (!pickupTime) errors.time = "Giờ nhận là bắt buộc";

    // Validate cargo selection if vehicle type is NOT passenger car ("ô tô")
    if (selectedVehicleType !== "ô tô" && selectedCargo.length === 0) {
      errors.cargo = "Vui lòng chọn ít nhất 1 loại hàng hóa";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      // scroll to error
      const firstErrorKey = Object.keys(formErrors)[0];
      const element = document.getElementById(`err-${firstErrorKey}`);
      if (element) element.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setIsSubmitting(true);

    // Simulate backend order creation
    setTimeout(() => {
      const randomCode = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(100 + Math.random() * 900)}`;
      setCreatedOrderCode(randomCode);
      setIsSubmitting(false);
      setShowSuccessModal(true);
    }, 2000);
  };

  const isWeightBased = WEIGHT_BASED_VEHICLE_TYPES.includes(selectedVehicleType);
  const isContainer = selectedVehicleType === "container / xe đầu kéo";
  const isPassenger = selectedVehicleType === "ô tô";
  const isConstruction = selectedVehicleType === "các xe công trình";

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col relative overflow-hidden">
      {/* Light background Dot Pattern */}
      <DotPattern className="opacity-40 [mask-image:radial-gradient(1000px_circle_at_center,white,transparent)]" />

      {/* Header bar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/user" className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-slate-900">Đăng tin tìm xe</h1>
            <p className="text-xs text-slate-500 font-medium">Tạo vận đơn trực tuyến dành cho Chủ Hàng</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 bg-slate-50 border border-slate-200/60 px-3 py-1.5 rounded-full">
          <ShieldCheck className="w-4 h-4 text-emerald-500" /> Hệ thống bảo mật 256-bit
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 lg:px-6 grid lg:grid-cols-12 gap-8 items-start relative z-10">
        {/* Left Side: Input Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-6">
          {/* Card 1: Địa điểm & Thời gian */}
          <Card className="relative bg-white border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] p-1.5 rounded-3xl">
            <div className="absolute overflow-hidden rounded-[inherit] pointer-events-none">
              <BorderBeam size={350} duration={12} delay={0} colorFrom="#136DEC" colorTo="#bfdbfe" />
            </div>

            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-slate-800">
                1. Địa điểm & Thời gian bốc xếp
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Pickup Address */}
              <div>
                <div className="relative group">
                  <input
                    ref={pickupInputRef}
                    type="text"
                    id="pickup"
                    placeholder=" "
                    value={pickupAddress}
                    onChange={(e) => {
                      setPickupAddress(e.target.value);
                      if (formErrors.pickup) setFormErrors({ ...formErrors, pickup: "" });
                    }}
                    className={`peer w-full pl-12 pr-4 pt-6 pb-2 border rounded-2xl focus:outline-none focus:ring-4 text-slate-800 text-sm font-semibold transition-all  bg-slate-50/30 ${formErrors.pickup
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500/10"
                      : "border-slate-200 focus:border-primary-500 focus:ring-primary-500/10"
                      }`}
                  />
                  <label
                    htmlFor="pickup"
                    className="absolute left-12 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 uppercase tracking-wider pointer-events-none transition-all duration-200 origin-left peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-focus:-translate-y-[15px] peer-focus:scale-75 peer-focus:text-primary-600 peer-[:not(:placeholder-shown)]:-translate-y-[15px] peer-[:not(:placeholder-shown)]:scale-75 peer-[:not(:placeholder-shown)]:text-primary-600"
                  >
                    Địa điểm lấy hàng (Điểm A)
                  </label>
                  <MapPin className={`w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${formErrors.pickup ? "text-red-400" : "text-slate-400 peer-focus:text-primary-500"}`} />
                </div>
                {formErrors.pickup && (
                  <p id="err-pickup" className="text-red-500 text-xs mt-1.5 pl-3 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5" /> {formErrors.pickup}
                  </p>
                )}
              </div>

              {/* Dropoff Address */}
              <div>
                <div className="relative group">
                  <input
                    ref={dropoffInputRef}
                    type="text"
                    id="dropoff"
                    placeholder=" "
                    value={dropoffAddress}
                    onChange={(e) => {
                      setDropoffAddress(e.target.value);
                      if (formErrors.dropoff) setFormErrors({ ...formErrors, dropoff: "" });
                    }}
                    className={`peer w-full pl-12 pr-4 pt-6 pb-2 border rounded-2xl focus:outline-none focus:ring-4 text-slate-800 text-sm font-semibold transition-all  bg-slate-50/30 ${formErrors.dropoff
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500/10"
                      : "border-slate-200 focus:border-primary-500 focus:ring-primary-500/10"
                      }`}
                  />
                  <label
                    htmlFor="dropoff"
                    className="absolute left-12 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 uppercase tracking-wider pointer-events-none transition-all duration-200 origin-left peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-focus:-translate-y-[15px] peer-focus:scale-75 peer-focus:text-primary-600 peer-[:not(:placeholder-shown)]:-translate-y-[15px] peer-[:not(:placeholder-shown)]:scale-75 peer-[:not(:placeholder-shown)]:text-primary-600"
                  >
                    Địa điểm giao hàng (Điểm B)
                  </label>
                  <MapPin className={`w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${formErrors.dropoff ? "text-red-400" : "text-slate-400 peer-focus:text-primary-500"}`} />
                </div>
                {formErrors.dropoff && (
                  <p id="err-dropoff" className="text-red-500 text-xs mt-1.5 pl-3 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5" /> {formErrors.dropoff}
                  </p>
                )}
              </div>

              {/* Date & Time Pickers */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <div className="relative group">
                    <input
                      type="date"
                      id="pickupDate"
                      value={pickupDate}
                      placeholder=" "
                      onChange={(e) => {
                        setPickupDate(e.target.value);
                        if (formErrors.date) setFormErrors({ ...formErrors, date: "" });
                      }}
                      className={`peer w-full pl-12 pr-4 pt-6 pb-2 border rounded-2xl focus:outline-none focus:ring-4 text-slate-800 text-sm font-semibold transition-all  bg-slate-50/30 ${formErrors.date
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500/10"
                        : "border-slate-200 focus:border-primary-500 focus:ring-primary-500/10"
                        }`}
                    />
                    <label
                      htmlFor="pickupDate"
                      className="absolute left-12 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 uppercase tracking-wider pointer-events-none transition-all duration-200 origin-left peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-focus:-translate-y-[15px] peer-focus:scale-75 peer-focus:text-primary-600 peer-[:not(:placeholder-shown)]:-translate-y-[15px] peer-[:not(:placeholder-shown)]:scale-75 peer-[:not(:placeholder-shown)]:text-primary-600"
                    >
                      Ngày nhận
                    </label>
                    <Calendar className={`w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${formErrors.date ? "text-red-400" : "text-slate-400 peer-focus:text-primary-500"}`} />
                  </div>
                  {formErrors.date && (
                    <p id="err-date" className="text-red-500 text-xs mt-1.5 pl-3 flex items-center gap-1">
                      <Info className="w-3.5 h-3.5" /> {formErrors.date}
                    </p>
                  )}
                </div>

                <div>
                  <div className="relative group">
                    <input
                      type="time"
                      id="pickupTime"
                      value={pickupTime}
                      placeholder=" "
                      onChange={(e) => {
                        setPickupTime(e.target.value);
                        if (formErrors.time) setFormErrors({ ...formErrors, time: "" });
                      }}
                      className={`peer w-full pl-12 pr-4 pt-6 pb-2 border rounded-2xl focus:outline-none focus:ring-4 text-slate-800 text-sm font-semibold transition-all  bg-slate-50/30 ${formErrors.time
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500/10"
                        : "border-slate-200 focus:border-primary-500 focus:ring-primary-500/10"
                        }`}
                    />
                    <label
                      htmlFor="pickupTime"
                      className="absolute left-12 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 uppercase tracking-wider pointer-events-none transition-all duration-200 origin-left peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-0 peer-focus:-translate-y-[15px] peer-focus:scale-75 peer-focus:text-primary-600 peer-[:not(:placeholder-shown)]:-translate-y-[15px] peer-[:not(:placeholder-shown)]:scale-75 peer-[:not(:placeholder-shown)]:text-primary-600"
                    >
                      Giờ nhận
                    </label>
                    <Clock className={`w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${formErrors.time ? "text-red-400" : "text-slate-400 peer-focus:text-primary-500"}`} />
                  </div>
                  {formErrors.time && (
                    <p id="err-time" className="text-red-500 text-xs mt-1.5 pl-3 flex items-center gap-1">
                      <Info className="w-3.5 h-3.5" /> {formErrors.time}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Yêu cầu phương tiện */}
          <Card className="relative bg-white border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] p-1.5 rounded-3xl">
            <div className="absolute overflow-hidden rounded-[inherit] pointer-events-none">
              <BorderBeam size={350} duration={12} delay={3} colorFrom="#136DEC" colorTo="#bfdbfe" />
            </div>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-slate-800">
                2. Yêu cầu phương tiện vận chuyển
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Searchable Select for Vehicle Type */}
              <SearchableSelect
                id="vehicleType"
                label="Loại phương tiện"
                value={selectedVehicleType}
                onChange={(val) => {
                  setSelectedVehicleType(val);
                }}
                options={VEHICLE_TYPES}
                icon={Truck}
              />

              {/* Dynamic options displayed conditionally as Searchable Selects */}
              {isContainer && (
                <div className="animate-fade-in">
                  <SearchableSelect
                    id="containerType"
                    label="Loại Container yêu cầu"
                    value={selectedContainer}
                    onChange={(val) => setSelectedContainer(val)}
                    options={CONTAINER_TYPES}
                    icon={Truck}
                  />
                </div>
              )}

              {isPassenger && (
                <div className="animate-fade-in">
                  <SearchableSelect
                    id="seatType"
                    label="Số ghế xe khách mong muốn"
                    value={selectedSeat}
                    onChange={(val) => setSelectedSeat(val)}
                    options={SEAT_TYPES}
                    icon={Truck}
                  />
                </div>
              )}

              {isConstruction && (
                <div className="animate-fade-in">
                  <SearchableSelect
                    id="constructionType"
                    label="Loại xe công trình đặc thù"
                    value={selectedConstruction}
                    onChange={(val) => setSelectedConstruction(val)}
                    options={CONSTRUCTION_VEHICLE_TYPES}
                    icon={Truck}
                  />
                </div>
              )}

              {isWeightBased && (
                <div className="animate-fade-in">
                  <SearchableSelect
                    id="weightRange"
                    label="Tải trọng xe mong muốn"
                    value={selectedWeight}
                    onChange={(val) => setSelectedWeight(val)}
                    options={WEIGHT_RANGES}
                    icon={Truck}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card 3: Thông tin hàng hóa & Hình ảnh (Hiden for "ô tô") */}
          {!isPassenger ? (
            <Card className="relative bg-white border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] p-1.5 rounded-3xl">
              <div className="absolute overflow-hidden rounded-[inherit] pointer-events-none">
                <BorderBeam size={350} duration={12} delay={6} colorFrom="#136DEC" colorTo="#bfdbfe" />
              </div>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-slate-800">
                  3. Thông tin chi tiết hàng hóa
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Cargo Type Checklist (multi-select Chips) */}
                <div className="space-y-2">
                  <Label>Tính chất hàng hóa (Chọn nhiều loại)</Label>
                  <div className="flex flex-wrap gap-2">
                    {CARGO_TYPES.map((type) => {
                      const isSelected = selectedCargo.includes(type);
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => toggleCargo(type)}
                          className={`text-xs font-semibold px-4 py-2.5 rounded-xl border transition-all flex items-center gap-1.5 ${isSelected
                            ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/10"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                            }`}
                        >
                          {isSelected && <span>✓</span>}
                          {capitalizeFirst(type)}
                        </button>
                      );
                    })}
                  </div>
                  {formErrors.cargo && (
                    <p id="err-cargo" className="text-red-500 text-xs pl-1 flex items-center gap-1">
                      <Info className="w-3.5 h-3.5" /> {formErrors.cargo}
                    </p>
                  )}
                </div>

                {/* Images Uploader Grid */}
                <div className="space-y-2">
                  <Label>Hình ảnh thực tế của hàng hóa (Tối đa 3 hình ảnh)</Label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                    {cargoImages.map((img, idx) => (
                      <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 shadow-sm group">
                        <img src={img} alt="Cargo Thumbnail" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500 hover:bg-red-650 text-white shadow opacity-90 transition hover:scale-105"
                          title="Xóa ảnh này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}

                    {cargoImages.length < 3 && (
                      <label className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 hover:border-blue-500 cursor-pointer flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-blue-500 bg-slate-50/50 hover:bg-blue-50/10 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageUpload}
                          disabled={isUploading}
                          className="hidden"
                        />
                        {isUploading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            <Upload className="w-5 h-5 text-slate-400" />
                            <span className="text-[10px] font-semibold uppercase tracking-wider">Tải ảnh</span>
                          </>
                        )}
                      </label>
                    )}
                  </div>
                </div>

                {/* Note Area */}
                <div>
                  <div className="relative group">
                    <textarea
                      id="note"
                      placeholder=" "
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={3}
                      className="peer w-full pl-12 pr-4 pt-6 pb-2 border border-slate-200 focus:border-primary-500 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-500/10 text-slate-800 text-sm font-semibold transition-all  bg-slate-50/30 resize-none"
                    />
                    <label
                      htmlFor="note"
                      className="absolute left-12 top-6 -translate-y-1/2 text-xs font-medium text-slate-400 uppercase tracking-wider pointer-events-none transition-all duration-200 origin-left peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:-translate-y-[15px] peer-focus:scale-75 peer-focus:text-primary-600 peer-[:not(:placeholder-shown)]:-translate-y-[15px] peer-[:not(:placeholder-shown)]:scale-75 peer-[:not(:placeholder-shown)]:text-primary-600"
                    >
                      Ghi chú vận chuyển dành cho Tài xế
                    </label>
                    <Info className="w-5 h-5 absolute left-4 top-6 -translate-y-1/2 text-slate-400 peer-focus:text-primary-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Simplify notes card for "ô tô" selection */
            <Card className="relative bg-white border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] p-1.5 rounded-3xl">
              <div className="absolute overflow-hidden rounded-[inherit] pointer-events-none">
                <BorderBeam size={350} duration={12} delay={6} colorFrom="#136DEC" colorTo="#bfdbfe" />
              </div>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-slate-800">
                  3. Ghi chú chuyến đi dành cho Tài xế
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="relative group">
                    <textarea
                      id="note"
                      placeholder=" "
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={3}
                      className="peer w-full pl-12 pr-4 pt-6 pb-2 border border-slate-200 focus:border-primary-500 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-500/10 text-slate-800 text-sm font-semibold transition-all  bg-slate-50/30 resize-none"
                    />
                    <label
                      htmlFor="note"
                      className="absolute left-12 top-6 -translate-y-1/2 text-xs font-medium text-slate-400 uppercase tracking-wider pointer-events-none transition-all duration-200 origin-left peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:-translate-y-[15px] peer-focus:scale-75 peer-focus:text-primary-600 peer-[:not(:placeholder-shown)]:-translate-y-[15px] peer-[:not(:placeholder-shown)]:scale-75 peer-[:not(:placeholder-shown)]:text-primary-600"
                    >
                      Ghi chú hành trình (ví dụ: điểm đón cụ thể, hành lý mang theo, đi chung động vật...)
                    </label>
                    <Info className="w-5 h-5 absolute left-4 top-6 -translate-y-1/2 text-slate-400 peer-focus:text-primary-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </form>

        {/* Right Side: Map & Route Details Summary */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
          {/* Map Preview card */}
          <Card className="relative bg-white border-slate-200/60 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-4 flex flex-col rounded-3xl">
            <div className="absolute overflow-hidden rounded-[inherit] pointer-events-none">
              <BorderBeam size={250} duration={15} delay={8} colorFrom="#136DEC" colorTo="#bfdbfe" />
            </div>
            <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
              🗺️ Bản đồ xem trước lộ trình
            </h4>
            <div className="w-full h-[220px] rounded-2xl bg-slate-100 overflow-hidden relative  border border-slate-200/60">
              <div id="order-form-map" className="w-full h-full z-10" />
              {!pickupCoords && !dropoffCoords && (
                <div className="absolute bg-white/70 backdrop-blur-sm z-20 flex flex-col items-center justify-center text-center p-4">
                  <MapPin className="w-8 h-8 text-blue-500 mb-2 animate-bounce" />
                  <p className="text-xs font-semibold text-slate-700">Điền thông tin điểm xuất phát (A) & điểm nhận (B)</p>
                  <p className="text-[10px] text-slate-500 mt-1 max-w-[200px] leading-normal font-semibold">Để hệ thống đo đạc lộ trình và ước tính cước phí</p>
                </div>
              )}
            </div>
            {distance && duration && (
              <div className="grid grid-cols-2 gap-4 text-center text-xs font-semibold bg-slate-50 border border-slate-200/60 p-3 rounded-xl">
                <div>
                  <p className="text-slate-500 text-[10px] uppercase font-medium mb-0.5">Quãng đường</p>
                  <p className="text-slate-800 font-semibold">{(distance / 1000).toFixed(1)} km</p>
                </div>
                <div>
                  <p className="text-slate-500 text-[10px] uppercase font-medium mb-0.5">Thời gian đi</p>
                  <p className="text-slate-800 font-semibold">{duration}</p>
                </div>
              </div>
            )}
          </Card>

          {/* Pricing breakdown card */}
          <Card className="relative bg-white border-slate-200/60 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-6 rounded-3xl">
            <div className="absolute overflow-hidden rounded-[inherit] pointer-events-none">
              <BorderBeam size={300} duration={10} delay={10} colorFrom="#136DEC" colorTo="#bfdbfe" />
            </div>

            <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
              💰 Ước tính chi phí cước xe
            </h4>

            {distance ? (
              <div className="space-y-4">
                <div className="space-y-2 text-xs font-semibold">
                  <div className="flex justify-between text-slate-500">
                    <span>Cước vận chuyển chính:</span>
                    <span className="text-slate-800">{priceBreakdown.base.toLocaleString("vi-VN")} ₫</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Phí kết nối hệ thống (3%):</span>
                    <span className="text-slate-800">{priceBreakdown.service.toLocaleString("vi-VN")} ₫</span>
                  </div>
                  <div className="h-px bg-slate-100 my-2"></div>
                  <div className="flex justify-between text-slate-700 text-sm">
                    <span>Tổng cước phí ước tính:</span>
                    <span className="text-emerald-600 font-semibold text-base">{priceBreakdown.total.toLocaleString("vi-VN")} ₫</span>
                  </div>
                </div>
                <div className="bg-emerald-50 border border-emerald-500/10 text-emerald-600 rounded-xl p-3 flex gap-2 text-[10px] font-semibold leading-normal">
                  <Sparkles className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <p>Mức giá trên dựa trên cước thị trường thực tế. Cước phí cụ thể có thể thương lượng thêm với tài xế sau khi khớp đơn.</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs font-semibold leading-normal">
                <Info className="w-5 h-5 text-slate-300 mx-auto mb-2" />
                Vui lòng điền đủ điểm đi & điểm giao để mở khóa báo giá
              </div>
            )}

            {/* Shimmer Button from Magic UI */}
            <ShimmerButton
              onClick={handleSubmit}
              disabled={isSubmitting}
              type="button"
              className="w-full text-white py-6"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Đang thiết lập đơn hàng...
                </>
              ) : (
                <>
                  Đăng tin tìm xe ngay <ArrowRight className="w-4 h-4" />
                </>
              )}
            </ShimmerButton>
          </Card>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="relative bg-white border border-slate-200/60 w-full max-w-md rounded-3xl shadow-2xl p-6 text-center space-y-6 animate-scale-up">
            <div className="absolute overflow-hidden rounded-[inherit] pointer-events-none">
              <BorderBeam size={250} duration={8} colorFrom="#136DEC" colorTo="#bfdbfe" />
            </div>

            <div className="w-16 h-16 bg-emerald-50 text-emerald-650 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <ShieldCheck className="w-8 h-8 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Đăng tin thành công!</h3>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-1">Mã đơn hàng của bạn</p>
              <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-2xl mt-2 font-mono text-base font-semibold text-blue-600">
                {createdOrderCode}
              </div>
            </div>
            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              Vận đơn đã được phát sóng tới tất cả tài xế phù hợp trong bán kính 5km. Vui lòng theo dõi tiến độ hoặc liên lạc với tài xế trong trang Tổng quan.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Link href={`/route-tracking?code=${createdOrderCode}`} className="w-full">
                <Button className="w-full text-white font-semibold text-xs py-5 rounded-xl transition">
                  Định vị live GPS
                </Button>
              </Link>
              <Link href="/admin/orders" className="w-full">
                <Button variant="secondary" className="w-full font-semibold text-xs py-5 rounded-xl transition bg-slate-100 text-slate-700 hover:bg-slate-200 border-none">
                  Về quản lý đơn
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
