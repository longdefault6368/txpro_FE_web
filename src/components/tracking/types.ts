export type TrackingPoint = { lat: number; lng: number; speed?: number | null; heading?: number | null; sampledAt?: string | null; createdAt?: string | null };
export type TrackingLocation = { address: string; lat: number | null; lng: number | null };
export type TrackingData = {
 access: "public" | "private";
 order: { id?: string; orderCode: string; status: string; vehicleType?: string | null;
 createdAt?: string | null; acceptedAt?: string | null; startedAt?: string | null; deliveredAt?: string | null; cancelledAt?: string | null;
 pickup?: TrackingLocation; dropoff?: TrackingLocation;
 route?: { distanceMeters?: number | null; durationSeconds?: number | null; polyline?: string | null };
 offerPrice?: number | null; paymentMethod?: string | null; cargoType?: string };
 driver?: { fullName: string; phone: string; avatar?: string | null; plateNumber?: string | null; vehicleText?: string | null; vehicleType?: string | null } | null;
 latestLocation?: TrackingPoint | null;
};
export function trackingDate(value?: string | null) {
 const date = value ? new Date(value) : null;
 return date && Number.isFinite(date.getTime()) ? date.toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Ho_Chi_Minh" }) : null;
}
export function gpsAge(value?: string | null, now = Date.now()) {
 const time = value ? Date.parse(value) : NaN;
 if (!Number.isFinite(time)) return "Chưa có thời gian cập nhật";
 const minutes = Math.max(0, Math.floor((now - time) / 60000));
 if (!minutes) return "Vừa cập nhật";
 if (minutes < 60) return "Cập nhật " + minutes + " phút trước";
 if (minutes < 1440) return "Cập nhật " + Math.floor(minutes / 60) + " giờ trước";
 return "Cập nhật " + Math.floor(minutes / 1440) + " ngày trước";
}
