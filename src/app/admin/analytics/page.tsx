"use client";

import { useState, useEffect, useRef } from "react";
import { 
  TrendingUp, Users, Truck, Package, MapPin, 
  ChevronDown, Calendar, ArrowUpRight, BarChart3, AlertCircle
} from "lucide-react";

interface TimeframeDataPoint {
  label: string;
  value: string;
  heightPercent: number;
}

interface OperationalMetrics {
  efficiency: string;
  avgTime: string;
  cancelRate: string;
  fiveStarRate: string;
  growthText: string;
}

interface MapMarkerPoint {
  name: string;
  type: "driver" | "shipper";
  coords: { lat: number; lng: number };
  details: string;
}

interface RegionDensityPoint {
  region: string;
  percent: number;
  label: string;
  status: "high" | "medium" | "low";
}

const TIMEFRAME_DATA: Record<"day" | "week" | "month" | "year", {
  chartPoints: TimeframeDataPoint[];
  metrics: OperationalMetrics;
  mapMarkers: MapMarkerPoint[];
  regionDensities: RegionDensityPoint[];
}> = {
  day: {
    chartPoints: [
      { label: "0h - 6h", value: "3 đơn", heightPercent: 18 },
      { label: "6h - 12h", value: "14 đơn", heightPercent: 55 },
      { label: "12h - 18h", value: "25 đơn", heightPercent: 95 },
      { label: "18h - 24h", value: "9 đơn", heightPercent: 38 }
    ],
    metrics: {
      efficiency: "98.2%",
      avgTime: "1.8 giờ",
      cancelRate: "0.5%",
      fiveStarRate: "99.1%",
      growthText: "Tăng trưởng +4.2% so với hôm qua"
    },
    mapMarkers: [
      { name: "Hà Nội Hub (Hôm nay)", type: "driver", coords: { lat: 21.028511, lng: 105.804817 }, details: "24 Tài xế hoạt động hôm nay" },
      { name: "Cảng Cát Lái, Q2 (Hôm nay)", type: "shipper", coords: { lat: 10.763403, lng: 106.779774 }, details: "15 Đơn hàng hôm nay" },
      { name: "Đà Nẵng Hub (Hôm nay)", type: "driver", coords: { lat: 16.054407, lng: 108.202164 }, details: "8 Tài xế hoạt động hôm nay" }
    ],
    regionDensities: [
      { region: "Hà Nội & Bắc Ninh", percent: 25, label: "Trung bình (25%)", status: "medium" },
      { region: "TP. Hồ Chí Minh & Bình Dương", percent: 45, label: "Nhiều xe (45%)", status: "high" },
      { region: "Đà Nẵng & Quảng Nam", percent: 8, label: "Thiếu xe (8%)", status: "low" },
      { region: "Cần Thơ & Miền Tây", percent: 22, label: "Trung bình (22%)", status: "medium" }
    ]
  },
  week: {
    chartPoints: [
      { label: "Thứ 2", value: "85 đơn", heightPercent: 40 },
      { label: "Thứ 4", value: "120 đơn", heightPercent: 65 },
      { label: "Thứ 6", value: "150 đơn", heightPercent: 92 },
      { label: "Chủ Nhật", value: "95 đơn", heightPercent: 50 }
    ],
    metrics: {
      efficiency: "95.4%",
      avgTime: "2.2 giờ",
      cancelRate: "1.1%",
      fiveStarRate: "97.8%",
      growthText: "Tăng trưởng +8.6% so với tuần trước"
    },
    mapMarkers: [
      { name: "Hà Nội Hub", type: "driver", coords: { lat: 21.028511, lng: 105.804817 }, details: "142 Tài xế Tuần này" },
      { name: "Cảng Hải Phòng", type: "shipper", coords: { lat: 20.844911, lng: 106.688084 }, details: "85 Đơn hàng Tuần này" },
      { name: "TP. Hồ Chí Minh Hub", type: "driver", coords: { lat: 10.823099, lng: 106.629664 }, details: "198 Tài xế Tuần này" },
      { name: "KCN Sóng Thần, Bình Dương", type: "shipper", coords: { lat: 10.980486, lng: 106.674391 }, details: "120 Đơn hàng Tuần này" }
    ],
    regionDensities: [
      { region: "Hà Nội & Bắc Ninh", percent: 35, label: "Nhiều xe (35%)", status: "high" },
      { region: "TP. Hồ Chí Minh & Bình Dương", percent: 40, label: "Nhiều xe (40%)", status: "high" },
      { region: "Đà Nẵng & Quảng Nam", percent: 15, label: "Trung bình (15%)", status: "medium" },
      { region: "Cần Thơ & Miền Tây", percent: 10, label: "Thiếu xe (10%)", status: "low" }
    ]
  },
  month: {
    chartPoints: [
      { label: "Tuần 1", value: "450 đơn", heightPercent: 48 },
      { label: "Tuần 2", value: "520 đơn", heightPercent: 64 },
      { label: "Tuần 3", value: "610 đơn", heightPercent: 95 },
      { label: "Tuần 4", value: "480 đơn", heightPercent: 58 }
    ],
    metrics: {
      efficiency: "94.8%",
      avgTime: "2.4 giờ",
      cancelRate: "1.2%",
      fiveStarRate: "96.5%",
      growthText: "Tăng trưởng +15.4% so với tháng trước"
    },
    mapMarkers: [
      { name: "Hà Nội Hub", type: "driver", coords: { lat: 21.028511, lng: 105.804817 }, details: "520 Tài xế hoạt động" },
      { name: "Cảng Hải Phòng", type: "shipper", coords: { lat: 20.844911, lng: 106.688084 }, details: "310 Đơn hàng phát sinh" },
      { name: "Đà Nẵng Hub", type: "driver", coords: { lat: 16.054407, lng: 108.202164 }, details: "180 Tài xế hoạt động" },
      { name: "KCN Sóng Thần, Bình Dương", type: "shipper", coords: { lat: 10.980486, lng: 106.674391 }, details: "480 Đơn hàng phát sinh" },
      { name: "TP. Hồ Chí Minh Hub", type: "driver", coords: { lat: 10.823099, lng: 106.629664 }, details: "710 Tài xế hoạt động" },
      { name: "Cần Thơ Hub", type: "shipper", coords: { lat: 10.045162, lng: 105.746857 }, details: "140 Đơn hàng phát sinh" }
    ],
    regionDensities: [
      { region: "Hà Nội & Bắc Ninh", percent: 42, label: "Nhiều xe (42%)", status: "high" },
      { region: "TP. Hồ Chí Minh & Bình Dương", percent: 38, label: "Nhiều xe (38%)", status: "high" },
      { region: "Đà Nẵng & Quảng Nam", percent: 12, label: "Trung bình (12%)", status: "medium" },
      { region: "Cần Thơ & Miền Tây", percent: 8, label: "Thiếu xe (8%)", status: "low" }
    ]
  },
  year: {
    chartPoints: [
      { label: "Quý 1", value: "4.8k đơn", heightPercent: 45 },
      { label: "Quý 2", value: "5.5k đơn", heightPercent: 68 },
      { label: "Quý 3", value: "6.2k đơn", heightPercent: 95 },
      { label: "Quý 4", value: "5.9k đơn", heightPercent: 82 }
    ],
    metrics: {
      efficiency: "93.1%",
      avgTime: "2.6 giờ",
      cancelRate: "1.5%",
      fiveStarRate: "95.8%",
      growthText: "Tăng trưởng +22.1% so với năm trước"
    },
    mapMarkers: [
      { name: "Hà Nội Hub", type: "driver", coords: { lat: 21.028511, lng: 105.804817 }, details: "6,400 Tài xế trong năm" },
      { name: "Cảng Hải Phòng", type: "shipper", coords: { lat: 20.844911, lng: 106.688084 }, details: "4,100 Đơn hàng" },
      { name: "Đà Nẵng Hub", type: "driver", coords: { lat: 16.054407, lng: 108.202164 }, details: "2,200 Tài xế" },
      { name: "KCN Sóng Thần, Bình Dương", type: "shipper", coords: { lat: 10.980486, lng: 106.674391 }, details: "5,800 Đơn hàng" },
      { name: "TP. Hồ Chí Minh Hub", type: "driver", coords: { lat: 10.823099, lng: 106.629664 }, details: "8,900 Tài xế" },
      { name: "Cần Thơ Hub", type: "shipper", coords: { lat: 10.045162, lng: 105.746857 }, details: "1,900 Đơn hàng" }
    ],
    regionDensities: [
      { region: "Hà Nội & Bắc Ninh", percent: 40, label: "Nhiều xe (40%)", status: "high" },
      { region: "TP. Hồ Chí Minh & Bình Dương", percent: 41, label: "Nhiều xe (41%)", status: "high" },
      { region: "Đà Nẵng & Quảng Nam", percent: 10, label: "Thiếu xe (10%)", status: "low" },
      { region: "Cần Thơ & Miền Tây", percent: 9, label: "Thiếu xe (9%)", status: "low" }
    ]
  }
};

export default function AdminAnalyticsPage() {
  const [timeframe, setTimeframe] = useState<"day" | "week" | "month" | "year">("month");
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  // Initialize dynamic Google Maps API on client-side
  useEffect(() => {
    const existingScript = document.getElementById("google-maps-script");
    if (!existingScript) {
      const script = document.createElement("script");
      script.id = "google-maps-script";
      script.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyDAom_mi4uBknVObU46tCt6l3RsgPEzzPE&libraries=places,geometry";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);

      script.onload = () => {
        initGoogleMap();
      };
    } else {
      if ((window as any).google) {
        initGoogleMap();
      }
    }

    function initGoogleMap() {
      const google = (window as any).google;
      if (!google) return;

      const mapContainer = document.getElementById("google-map");
      if (!mapContainer) return;

      const mapOptions = {
        center: { lat: 16.054407, lng: 108.202164 },
        zoom: 6,
        disableDefaultUI: false,
        zoomControl: true,
        scrollwheel: false
      };

      const map = new google.maps.Map(mapContainer, mapOptions);
      mapRef.current = map;
      setMapReady(true);
    }
  }, []);

  // Update map markers when timeframe or map status changes
  useEffect(() => {
    const google = (window as any).google;
    const map = mapRef.current;
    if (!google || !map || !mapReady) return;

    // Clear old markers
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    // Draw new markers based on selected timeframe
    const currentMarkersData = TIMEFRAME_DATA[timeframe].mapMarkers;

    currentMarkersData.forEach((pos) => {
      const markerColor = pos.type === "driver" ? "#10b981" : "#3b82f6";
      const markerLabel = pos.type === "driver" ? "🚚" : "📦";

      const marker = new google.maps.Marker({
        position: pos.coords,
        map: map,
        title: pos.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: markerColor,
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2.5,
          scale: 14
        },
        label: {
          text: markerLabel,
          color: "#ffffff",
          fontSize: "12px",
          fontWeight: "black"
        }
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="font-family: sans-serif; padding: 4px; line-height: 1.4;">
            <h4 style="margin: 0 0 3px 0; font-size: 12px; font-weight: 800; color: #1e293b;">${pos.name}</h4>
            <p style="margin: 0; font-size: 11px; font-weight: 600; color: #64748b;">${pos.details}</p>
          </div>
        `
      });

      marker.addListener("click", () => {
        infoWindow.open(map, marker);
      });

      markersRef.current.push(marker);
    });

  }, [timeframe, mapReady]);

  const activeData = TIMEFRAME_DATA[timeframe];

  return (
    <div className="space-y-6">
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/80 backdrop-blur-xl border border-slate-200/50 p-6 rounded-3xl shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary-600" /> Hệ Thống Phân Tích & Giám Sát
          </h1>
          <p className="text-slate-500 text-xs mt-1">Phân tích mật độ xe, tăng trưởng đơn hàng và định vị trực tuyến bằng Google Maps</p>
        </div>
        
        {/* Timeframe switch button */}
        <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setTimeframe("day")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              timeframe === "day" ? "bg-white text-slate-800 shadow" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Ngày
          </button>
          <button
            onClick={() => setTimeframe("week")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              timeframe === "week" ? "bg-white text-slate-800 shadow" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Tuần
          </button>
          <button
            onClick={() => setTimeframe("month")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              timeframe === "month" ? "bg-white text-slate-800 shadow" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Tháng
          </button>
          <button
            onClick={() => setTimeframe("year")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              timeframe === "year" ? "bg-white text-slate-800 shadow" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Năm
          </button>
        </div>
      </div>

      {/* Grid: Map and Vehicle Density Column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Real-time Map Container */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/50 p-6 shadow-xl relative overflow-hidden flex flex-col min-h-[450px]">
          <h2 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2 uppercase tracking-wide">
            📍 Bản Đồ Phân Phối Trực Tuyến (Google Maps Live)
          </h2>
          
          <div className="flex-1 w-full rounded-2xl bg-slate-100 relative overflow-hidden min-h-[350px]">
            <div id="google-map" className="w-full h-full z-10" />
            
            {/* Map Legend overlay */}
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md p-3.5 rounded-xl shadow-lg border border-slate-200/50 z-20 space-y-1.5 text-xs font-bold">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Chú giải bản đồ</p>
              <div className="flex items-center gap-2 text-slate-700">
                <span className="w-4 h-4 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-[8px]">🚚</span> 
                <span>Tài xế đang online ({activeData.mapMarkers.filter(m => m.type === "driver").length})</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <span className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center text-[8px]">📦</span> 
                <span>Chủ hàng/Điểm có đơn ({activeData.mapMarkers.filter(m => m.type === "shipper").length})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Region density / High-low vehicle concentration lists */}
        <div className="bg-white rounded-3xl border border-slate-200/50 p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-black text-slate-900 mb-4 uppercase tracking-wide">
              📊 Phân tích mật độ xe theo khu vực
            </h2>
            <p className="text-xs text-slate-400 mb-6">Mật độ tập trung xe và mức độ khan hiếm xe theo tỉnh thành lớn</p>

            <div className="space-y-5">
              {activeData.regionDensities.map((item) => (
                <div key={item.region} className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-700">{item.region}</span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase ${
                      item.status === "high" 
                        ? "text-emerald-600 bg-emerald-50" 
                        : item.status === "medium" 
                          ? "text-amber-600 bg-amber-50" 
                          : "text-red-600 bg-red-50"
                    }`}>
                      {item.label}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        item.status === "high" 
                          ? "bg-emerald-500" 
                          : item.status === "medium" 
                            ? "bg-amber-500" 
                            : "bg-red-500"
                      }`} 
                      style={{ width: `${item.percent * 2}%` }} // Adjusted visualization multiplier
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3 text-xs font-semibold leading-relaxed text-blue-800 mt-6 lg:mt-0">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p>
              {timeframe === "day" ? (
                <span><strong>Khuyến nghị điều phối:</strong> Đà Nẵng đang báo động đỏ thiếu xe cục bộ trong ngày hôm nay. Đề nghị trung tâm điều phối ưu tiên kết nối tài xế chạy rỗng hướng Bắc-Nam qua trạm Đà Nẵng.</span>
              ) : timeframe === "week" ? (
                <span><strong>Khuyến nghị điều phối:</strong> Cần Thơ tiếp tục thiếu xe tải nặng chuyên dụng trong tuần này. Gợi ý điều phối tài xế trống từ khu vực Đồng Nai, Bình Dương di chuyển đón đơn.</span>
              ) : (
                <span><strong>Khuyến nghị điều phối:</strong> Khu vực Cần Thơ đang có tỉ lệ chênh lệch cung-cầu cao (thiếu xe tải lạnh chở nông sản). Admin nên điều xe trống từ miền Đông Nam Bộ xuống hỗ trợ.</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Analytical graphs and operational stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Growth Bar Chart */}
        <div className="bg-white rounded-3xl border border-slate-200/50 p-6 shadow-xl md:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
              📈 Tăng Trưởng Khối Lượng Đơn Vận Chuyển ({timeframe === "day" ? "Theo Ngày" : timeframe === "week" ? "Theo Tuần" : timeframe === "month" ? "Theo Tháng" : "Theo Năm"})
            </h3>
            <span className="text-xs text-slate-400 font-bold flex items-center gap-1">
              {timeframe === "year" ? "Đơn vị: Nghìn đơn" : "Đơn vị: Đơn"} <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            </span>
          </div>

          {/* Bar chart flex container */}
          <div className="h-64 flex items-end justify-between gap-3 pt-6 px-4 border-b border-slate-100 relative">
            
            {/* Grid helper lines */}
            <div className="absolute left-0 right-0 top-1/4 border-t border-slate-100 border-dashed pointer-events-none"></div>
            <div className="absolute left-0 right-0 top-2/4 border-t border-slate-100 border-dashed pointer-events-none"></div>
            <div className="absolute left-0 right-0 top-3/4 border-t border-slate-100 border-dashed pointer-events-none"></div>

            {/* Dynamic Bars */}
            {activeData.chartPoints.map((point, index) => {
              const isLast = index === activeData.chartPoints.length - 1;
              return (
                <div key={point.label} className="flex-1 h-full flex flex-col justify-end items-center group relative pb-6">
                  <div 
                    className={`w-full max-w-[45px] rounded-t-lg transition-all group-hover:scale-y-105 duration-200 relative ${
                      isLast 
                        ? "bg-gradient-to-t from-primary-500 to-indigo-600 shadow-lg shadow-primary-200" 
                        : "bg-gradient-to-t from-slate-100 to-slate-200"
                    }`}
                    style={{ height: `${point.heightPercent}%` }}
                  >
                    <span className={`absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-black opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap ${
                      isLast ? "text-primary-600" : "text-slate-400"
                    }`}>
                      {point.value}
                    </span>
                  </div>
                  <span className={`absolute bottom-0 text-[10px] font-bold ${isLast ? "text-primary-600 font-black" : "text-slate-400"}`}>
                    {point.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic Analytics Sidebar overview card */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-3xl p-6 text-white shadow-xl flex flex-col justify-between relative overflow-hidden">
          {/* Subtle background ambient ring */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600/10 rounded-full blur-2xl"></div>

          <div>
            <span className="text-[9px] bg-white/10 text-white px-2.5 py-1 rounded-md font-black uppercase tracking-wider">Hiệu suất vận hành</span>
            <h3 className="text-2xl font-black mt-4">{activeData.metrics.efficiency}</h3>
            <p className="text-slate-400 text-xs mt-1">Tỉ lệ hoàn thành chuyến xe thành công</p>
          </div>

          <div className="space-y-3.5 my-6">
            <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
              <span className="text-slate-400">Thời gian giao TB:</span>
              <span className="font-semibold">{activeData.metrics.avgTime}</span>
            </div>
            <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
              <span className="text-slate-400">Số đơn bị hủy:</span>
              <span className="font-semibold text-red-400">{activeData.metrics.cancelRate}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Tỉ lệ đánh giá 5★:</span>
              <span className="font-semibold text-emerald-400">{activeData.metrics.fiveStarRate}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 p-3 rounded-xl">
            <ArrowUpRight className="w-4 h-4 flex-shrink-0" />
            <span>{activeData.metrics.growthText}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
