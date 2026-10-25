"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, MapPin, Navigation, Phone, ShieldAlert, Truck } from "lucide-react";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import { getServerMediaUrl } from "@/utils/media";
import { API_BASE } from "@/utils/api";
import { fetchWithAuth } from '@/utils/api';

interface OrderData {
  order: {
    id: string;
    orderCode: string;
    status: string;
    cargoType: string;
    pickup: { address: string; lat: number | null; lng: number | null };
    dropoff: { address: string; lat: number | null; lng: number | null };
    route: { distanceMeters: number | null; durationSeconds: number | null; polyline: string | null };
    offerPrice: number;
    createdAt: string;
  };
  driver: {
    fullName: string;
    phone: string;
    avatar: string | null;
    vehicleText: string | null;
    plateNumber: string | null;
  } | null;
  latestLocation: {
    lat: number;
    lng: number;
    speed: number | null;
    heading: number | null;
    createdAt: string;
  } | null;
  historyLocations: { lat: number; lng: number; speed?: number | null; heading?: number | null; createdAt?: string }[];
}

type LatLng = { lat: number; lng: number };


const GOOGLE_MAPS_SCRIPT_ID = "google-maps-script";
const GOOGLE_MAPS_SCRIPT_SRC =
  "https://maps.googleapis.com/maps/api/js?key=AIzaSyDDq4-qHUd9qYi5go9mI3OpoLEgpMhzgGU&libraries=places,geometry";
const TRACKING_REFRESH_MS = 3 * 60 * 1000;


function decodePolyline(encoded: string): LatLng[] {
  if (!encoded) return [];
  const points: LatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    lat += result & 1 ? ~(result >> 1) : result >> 1;
    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    lng += result & 1 ? ~(result >> 1) : result >> 1;
    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }

  return points;
}

function hasValidPoint(point?: { lat?: number | null; lng?: number | null } | null): point is LatLng {
  return Boolean(point && Number.isFinite(point.lat) && Number.isFinite(point.lng));
}

function parseRoutePoints(value: unknown): LatLng[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const point = item as { lat?: unknown; lng?: unknown };
      const lat = typeof point.lat === "number" ? point.lat : Number(point.lat);
      const lng = typeof point.lng === "number" ? point.lng : Number(point.lng);
      return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
    })
    .filter((point): point is LatLng => Boolean(point));
}

async function fetchServerDirections(origin: LatLng, destination: LatLng) {
  const query = new URLSearchParams({
    originLat: String(origin.lat),
    originLng: String(origin.lng),
    destinationLat: String(destination.lat),
    destinationLng: String(destination.lng),
  });

  const response = await fetch(`${API_BASE}/address/directions?${query.toString()}`);
  if (!response.ok) return [];

  const payload = await response.json().catch(() => null);
  const data = payload?.data || payload || {};
  const points = parseRoutePoints(data.points);
  if (points.length >= 2) return points;

  const decoded = decodePolyline(String(data.encodedPolyline || ""));
  return decoded.length >= 2 ? decoded : [];
}

function loadGoogleMaps() {
  if (typeof window === "undefined") return Promise.resolve();
  if ((window as any).google?.maps) return Promise.resolve();

  return new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById(GOOGLE_MAPS_SCRIPT_ID) as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Không thể tải Google Maps")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.src = GOOGLE_MAPS_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Không thể tải Google Maps"));
    document.body.appendChild(script);
  });
}

function getStatusText(status: string) {
  switch (status) {
    case "searching_driver":
    case "waiting_driver":
    case "waiting_driver_acceptance":
      return "Chờ nhận đơn";
    case "accepted":
      return "Đã nhận đơn";
    case "in_progress":
    case "delivered":
      return "Đang vận chuyển";
    case "completed":
      return "Đã hoàn thành";
    case "cancelled":
      return "Đã hủy";
    default:
      return "Đang cập nhật";
  }
}

function formatTrackingTime(value?: string | null) {
  if (!value) return "Chưa có";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa có";
  return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

function RouteTrackingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code") || "";
  const avatarUrl = useMemo(() => getServerMediaUrl(null), []);

  const [loading, setLoading] = useState(true);
  const [mapLoading, setMapLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<OrderData | null>(null);

  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const polylinesRef = useRef<any[]>([]);
  const directionsRendererRef = useRef<any>(null);
  const hasUserInteractedRef = useRef(false);
  const lastFitKeyRef = useRef<string | null>(null);
  const mapContainerId = "google-route-tracking-map";

  const fetchTracking = async (showLoader = false) => {
    if (!code) return;
    if (showLoader) setLoading(true);

    try {
      const response = await fetchWithAuth(`/api/tracking?code=${encodeURIComponent(code)}`, { cache: 'no-store' });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Không thể nạp dữ liệu định vị");
      }

      const resData = await response.json();
      setData(resData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chưa tải được định vị từ hệ thống.');
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const initMap = () => {
    const google = (window as any).google;
    if (!google?.maps || mapRef.current) return;

    const mapContainer = document.getElementById(mapContainerId);
    if (!mapContainer) return;

    const map = new google.maps.Map(mapContainer, {
      center: { lat: 16.054407, lng: 108.202164 },
      zoom: 6,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
      clickableIcons: false,
      gestureHandling: "greedy",
    });
    mapRef.current = map;

    const directionsRenderer = new google.maps.DirectionsRenderer({
      map,
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: "#4f46e5",
        strokeOpacity: 0.85,
        strokeWeight: 5,
      },
    });
    directionsRendererRef.current = directionsRenderer;

    map.addListener("dragstart", () => {
      hasUserInteractedRef.current = true;
    });
    mapContainer.addEventListener("wheel", () => {
      hasUserInteractedRef.current = true;
    }, { passive: true });
    mapContainer.addEventListener("touchstart", () => {
      hasUserInteractedRef.current = true;
    }, { passive: true });
    setMapLoading(false);
  };

  const clearMapLayers = () => {
    markersRef.current.forEach((marker) => marker.setMap(null));
    polylinesRef.current.forEach((polyline) => polyline.setMap(null));
    markersRef.current = [];
    polylinesRef.current = [];
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setDirections({ routes: [] });
    }
  };

  const drawRoutePolyline = (path: LatLng[]) => {
    const google = (window as any).google;
    const map = mapRef.current;
    if (!google?.maps || !map || path.length === 0) return;

    polylinesRef.current.push(new google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: "#4f46e5",
      strokeOpacity: 0.9,
      strokeWeight: 5,
      icons: [{
        icon: { path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 3, strokeColor: "#4f46e5" },
        offset: "50%",
        repeat: "90px",
      }],
      map,
    }));
  };

  const fitMapToPoints = (points: LatLng[]) => {
    const google = (window as any).google;
    const map = mapRef.current;
    if (!google?.maps || !map || points.length === 0 || hasUserInteractedRef.current) return;

    const fitKey = points
      .map((point) => `${point.lat.toFixed(5)},${point.lng.toFixed(5)}`)
      .join("|");
    if (lastFitKeyRef.current === fitKey) return;
    lastFitKeyRef.current = fitKey;

    if (points.length === 1) {
      map.setCenter(points[0]);
      map.setZoom(15);
      return;
    }

    const bounds = new google.maps.LatLngBounds();
    points.forEach((point) => bounds.extend(point));
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

    map.fitBounds(bounds, isMobile
      ? { top: 96, right: 36, bottom: 300, left: 36 }
      : { top: 110, right: 460, bottom: 96, left: 80 });

    google.maps.event.addListenerOnce(map, "idle", () => {
      const zoom = map.getZoom();
      if (zoom && zoom > 16) map.setZoom(16);
    });
  };

  const updateMapLayers = () => {
    const google = (window as any).google;
    const map = mapRef.current;
    if (!google?.maps || !map || !data) return;

    clearMapLayers();

    const pickup = data.order.pickup;
    const dropoff = data.order.dropoff;
    const driverLoc = data.latestLocation;

    let routeCoords = data.order.route.polyline ? decodePolyline(data.order.route.polyline) : [];

    if (routeCoords.length > 0) {
      drawRoutePolyline(routeCoords);
      const fitPoints: LatLng[] = [...routeCoords];
      if (hasValidPoint(pickup)) fitPoints.push({ lat: pickup.lat, lng: pickup.lng });
      if (hasValidPoint(dropoff)) fitPoints.push({ lat: dropoff.lat, lng: dropoff.lng });
      if (hasValidPoint(driverLoc)) fitPoints.push({ lat: driverLoc.lat, lng: driverLoc.lng });
      fitMapToPoints(fitPoints);
    } else {
      const originParam = hasValidPoint(pickup) ? { lat: pickup.lat, lng: pickup.lng } : pickup.address;
      const destParam = hasValidPoint(dropoff) ? { lat: dropoff.lat, lng: dropoff.lng } : dropoff.address;

      if (originParam && destParam) {
        const directionsService = new google.maps.DirectionsService();
        directionsService.route(
          {
            origin: originParam,
            destination: destParam,
            travelMode: google.maps.TravelMode.DRIVING,
          },
          (result: any, status: any) => {
            if (status === google.maps.DirectionsStatus.OK && directionsRendererRef.current) {
              directionsRendererRef.current.setDirections(result);

              const legs = result.routes[0].legs;
              const pathPoints: LatLng[] = [];
              for (let i = 0; i < legs.length; i++) {
                const steps = legs[i].steps;
                for (let j = 0; j < steps.length; j++) {
                  const nextSegment = steps[j].path;
                  for (let k = 0; k < nextSegment.length; k++) {
                    pathPoints.push({
                      lat: nextSegment[k].lat(),
                      lng: nextSegment[k].lng(),
                    });
                  }
                }
              }

              const fitPoints: LatLng[] = [...pathPoints];
              if (hasValidPoint(pickup)) fitPoints.push({ lat: pickup.lat, lng: pickup.lng });
              if (hasValidPoint(dropoff)) fitPoints.push({ lat: dropoff.lat, lng: dropoff.lng });
              if (hasValidPoint(driverLoc)) fitPoints.push({ lat: driverLoc.lat, lng: driverLoc.lng });
              fitMapToPoints(fitPoints);
            } else {
              if (hasValidPoint(pickup) && hasValidPoint(dropoff)) {
                const fallbackCoords = [{ lat: pickup.lat, lng: pickup.lng }, { lat: dropoff.lat, lng: dropoff.lng }];
                drawRoutePolyline(fallbackCoords);
                fitMapToPoints(fallbackCoords);
              }
            }
          }
        );
      }
    }

    const geocoder = new google.maps.Geocoder();

    const renderPickupMarker = (lat: number, lng: number) => {
      markersRef.current.push(new google.maps.Marker({
        position: { lat, lng },
        map,
        title: `Điểm nhận: ${pickup.address}`,
        label: { text: "A", color: "#ffffff", fontWeight: "900" },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 16,
          fillColor: "#2563eb",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 3,
        },
      }));
    };

    const renderDropoffMarker = (lat: number, lng: number) => {
      markersRef.current.push(new google.maps.Marker({
        position: { lat, lng },
        map,
        title: `Điểm giao: ${dropoff.address}`,
        label: { text: "B", color: "#ffffff", fontWeight: "900" },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 16,
          fillColor: "#ef4444",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 3,
        },
      }));
    };

    if (hasValidPoint(pickup)) {
      renderPickupMarker(pickup.lat, pickup.lng);
    } else if (pickup.address) {
      geocoder.geocode({ address: pickup.address }, (results: any, status: any) => {
        if (status === "OK" && results[0]) {
          const loc = results[0].geometry.location;
          renderPickupMarker(loc.lat(), loc.lng());
        }
      });
    }

    if (hasValidPoint(dropoff)) {
      renderDropoffMarker(dropoff.lat, dropoff.lng);
    } else if (dropoff.address) {
      geocoder.geocode({ address: dropoff.address }, (results: any, status: any) => {
        if (status === "OK" && results[0]) {
          const loc = results[0].geometry.location;
          renderDropoffMarker(loc.lat(), loc.lng());
        }
      });
    }

    if (hasValidPoint(driverLoc)) {
      markersRef.current.push(new google.maps.Marker({
        position: { lat: driverLoc.lat, lng: driverLoc.lng },
        map,
        title: `Vị trí tài xế - ${Math.round(driverLoc.speed || 0)} km/h`,
        icon: {
          path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale: 7,
          fillColor: "#4f46e5",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
          rotation: driverLoc.heading || 0,
        },
        zIndex: 10,
      }));
    }

    const historyCoords = (data.historyLocations || [])
      .filter(hasValidPoint)
      .map((point) => ({ lat: point.lat, lng: point.lng }));

    if (historyCoords.length > 1) {
      polylinesRef.current.push(new google.maps.Polyline({
        path: historyCoords,
        geodesic: true,
        strokeColor: "#0f172a",
        strokeOpacity: 0.35,
        strokeWeight: 3,
        map,
      }));
    }
  };

  useEffect(() => {
    if (!code) {
      setError("Thiếu mã vận đơn để định vị GPS");
      setLoading(false);
      return;
    }

    hasUserInteractedRef.current = false;
    lastFitKeyRef.current = null;
    fetchTracking(true);
    const interval = setInterval(() => fetchTracking(false), TRACKING_REFRESH_MS);
    return () => clearInterval(interval);
  }, [code]);

  useEffect(() => {
    loadGoogleMaps()
      .then(() => initMap())
      .catch((err) => {
        setMapLoading(false);
        setError(err instanceof Error ? err.message : "Không thể tải Google Maps");
      });
  }, []);

  useEffect(() => {
    if (!mapRef.current) initMap();
    updateMapLayers();
  }, [data]);

  const driverAvatarUrl = getServerMediaUrl(data?.driver?.avatar || null) || avatarUrl;

  return (
    <div className="relative flex min-h-[calc(100vh-80px)] w-full flex-1 flex-col">
      <div id={mapContainerId} className="z-10 min-h-[calc(100vh-80px)] w-full flex-1" />

      <div className="absolute left-6 top-24 z-20">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white/95 px-4 py-3 text-sm font-bold text-slate-800 shadow-xl backdrop-blur transition hover:bg-white cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Quay lại
        </button>
      </div>

      {data && (
        <div className="absolute bottom-6 left-6 right-6 z-20 rounded-lg border border-slate-200 bg-white/95 p-6 text-slate-800 shadow-2xl backdrop-blur md:left-auto md:right-6 md:w-96">
          <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Mã vận đơn</p>
              <p className="font-mono text-base font-bold text-slate-950">{data.order.orderCode}</p>
            </div>
            <span className="rounded-md border border-primary-100 bg-primary-50 px-3 py-1.5 text-xs font-bold text-primary-700">
              {getStatusText(data.order.status)}
            </span>
          </div>

          <div className="space-y-4">
            <div className="space-y-2 text-xs">
              <div className="flex gap-2">
                <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-600" />
                <p className="truncate font-semibold text-slate-600">A: {data.order.pickup.address}</p>
              </div>
              <div className="flex gap-2">
                <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-red-500" />
                <p className="truncate font-semibold text-slate-600">B: {data.order.dropoff.address}</p>
              </div>
            </div>

            {data.latestLocation ? (
              <div className="flex items-center justify-between rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-3 text-xs font-bold text-indigo-700">
                <span className="flex items-center gap-1.5">
                  <Navigation className="h-4 w-4 text-indigo-600" /> GPS tài xế
                </span>
                <span>{formatTrackingTime(data.latestLocation.createdAt)} · {Math.round(data.latestLocation.speed || 0)} km/h</span>
              </div>
            ) : (
              <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-center text-xs font-semibold text-slate-500">
                Tín hiệu GPS đang định tuyến...
              </div>
            )}

            {data.driver ? (
              <div className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white">
                  {driverAvatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={driverAvatarUrl} alt={data.driver.fullName} className="h-full w-full object-cover" />
                  ) : (
                    <Truck className="h-5 w-5 text-slate-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-slate-800">{data.driver.fullName}</p>
                  <p className="truncate text-xs font-bold text-slate-400">{data.driver.vehicleText || "Tài xế TXEPRO"}</p>
                </div>
                <a
                  href={`tel:${data.driver.phone}`}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:text-primary-600"
                >
                  <Phone className="h-3.5 w-3.5" />
                </a>
              </div>
            ) : (
              <p className="py-2 text-center text-xs text-slate-400">Đang tìm kiếm tài xế lân cận.</p>
            )}
          </div>
        </div>
      )}

      {(loading || mapLoading) && (
        <div className="absolute inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-900/60 text-white backdrop-blur-sm">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-white" />
          <p className="text-sm font-bold">Đang tải Google Maps và định vị Live GPS...</p>
        </div>
      )}

      {error && !loading && !mapLoading && (
        <div className="absolute inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-900/60 p-6 text-center text-white backdrop-blur-sm">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/20 text-red-400">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h3 className="mb-2 text-lg font-bold">Định vị thất bại</h3>
          <p className="mb-6 max-w-sm text-sm text-slate-300">{error}</p>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg bg-primary-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-primary-700 cursor-pointer"
          >
            Quay lại trang trước
          </button>
        </div>
      )}

      {!data && !loading && !error && (
        <div className="absolute inset-0 z-20 flex items-center justify-center text-slate-500">
          <div className="rounded-lg border border-slate-200 bg-white px-5 py-4 text-sm font-bold shadow-lg">
            <MapPin className="mr-2 inline h-4 w-4" /> Chưa có dữ liệu định vị
          </div>
        </div>
      )}
    </div>
  );
}

export default function RouteTrackingPage() {
  return (
    <>
      <Header />
      <main className="relative flex min-h-screen flex-col bg-slate-50 pt-20">
        <Suspense
          fallback={
            <div className="flex min-h-screen flex-1 items-center justify-center bg-slate-50">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-100 border-t-primary-600" />
            </div>
          }
        >
          <RouteTrackingContent />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
