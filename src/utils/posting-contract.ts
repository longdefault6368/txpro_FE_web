export type LocationValue = { address: string; lat: number; lng: number; placeId?: string; district?: string; province?: string };
export type CatalogNode = { key: string; name: string; children?: CatalogNode[] };
export type PostingOptions = { vehicleTypes: string[]; cargoTypes: string[]; seatTypes: string[]; weightRanges: string[]; containerTypes: string[]; constructionVehicleTypes: string[]; weightVehicleTypes: string[]; vehicleTree?: CatalogNode[] };
export type PostingVehicle = { id?: string; _id?: string; type: string; vehicleTypeParent?: string; vehicleTypeChild?: string; plateNumber: string; seats?: number; capacity?: number; capacityMax?: number; cargoTypes?: string[]; status?: string };
export type PostingPage<T> = { items: T[]; pagination: { page: number; limit: number; total: number; hasMore: boolean } };
export function readPostingPage<T>(value: T[] | PostingPage<T>, limit = 20): { items: T[]; hasMore: boolean } {
  if (Array.isArray(value)) return { items: value, hasMore: value.length === limit };
  if (value && Array.isArray(value.items) && value.pagination && typeof value.pagination.hasMore === "boolean") {
    return { items: value.items, hasMore: value.pagination.hasMore };
  }
  throw new Error("Máy chủ trả danh sách không hợp lệ.");
}
export const normalizePostingText = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").trim();
// Mirrors Flutter's VehicleSelectionCatalog without rewriting stored API values.
export const catalogText = (s: string) => normalizePostingText(s).replace(/[^a-z0-9]+/g, " ").trim();
export function vehicleGroup(value: string): string | null {
  const n = catalogText(value);
  if (["xe may", "motorcycle"].includes(n)) return "motorcycle";
  if (!n || n.includes("ghep") || n.includes("xe ben")) return null;
  if (n.includes("cho o to") || n.includes("cho oto") || (n.includes("long") && (n.includes("container") || n.includes("xe tai")))) return "carrier";
  if (n.includes("cuu thuong") || n.includes("ambulance")) return "ambulance";
  if (n.includes("van") || n.includes("ban tai")) return "van";
  if (n.includes("cuu ho")) return "rescue";
  if (n.includes("gia suc")) return "livestock";
  if (n.includes("bon") || n.includes("tanker")) return "tanker";
  if (n.includes("cong trinh")) return "construction";
  if (n.includes("container") || n.includes("dau keo")) return "container";
  if (n.includes("cau")) return "crane";
  if (n.includes("dong lanh")) return "refrigerated";
  if (n.startsWith("xe tai") || /thung (bat|kin|lung)/.test(n)) return "truck";
  if (["o to", "oto", "xe o to", "xe oto", "xe khach"].includes(n)) return "car";
  return "other";
}
export const shipperTruckWeights = ["dưới 1 tấn", "1 - 5 tấn", "5 - 10 tấn", "10 - 40 tấn"];
export function allowedShipperVehicle(type: string, options: PostingOptions) {
  if (options.vehicleTypes.includes(type)) return vehicleGroup(type) !== null;
  const group = ({ "xe tải": "truck", "xe cẩu tự hành / cần cẩu": "crane", "xe tải / container lồng chở ô tô": "carrier" } as Record<string, string>)[type];
  return Boolean(group && (options.vehicleTypes.some(value => vehicleGroup(value) === group)
    || (group === "carrier" && options.vehicleTypes.some(value => vehicleGroup(value) === "container") && options.containerTypes.some(value => vehicleGroup(value) === "carrier"))));
}
export function postingCapabilities(type: string, options?: PostingOptions) {
  const n = normalizePostingText(type);
  const motorcycle = n === "xe may" || n === "motorcycle";
  const passenger = vehicleGroup(type) === "car" || n === "o to cho nguoi";
  const container = n.includes("container") || n.includes("dau keo");
  const mixedCarrier = vehicleGroup(type) === "carrier";
  const groupedCapacity = type === "xe tải" || type === "xe cẩu tự hành / cần cẩu";
  const capacity = !container && !passenger && !motorcycle && (groupedCapacity || (options?.weightVehicleTypes.includes(type)
    ?? (n.startsWith("xe tai ") || n === "xe tai" || n.includes("xe cau") || n.includes("can cau") || n.includes("cong trinh"))));
  return { motorcycle, passenger, capacity: Boolean(capacity), cargo: !mixedCarrier && (container || Boolean(capacity)) };
}
export function parseWeightRange(label: string) {
  const values = (label.replace(/,/g, ".").match(/\d+(?:\.\d+)?/g) || []).map(Number);
  if (!values.length) throw new Error("Vui lòng chọn tải trọng.");
  return { weight: values[0], weightLabel: label };
}
export function validLocation(value: LocationValue | null): value is LocationValue {
  return Boolean(value?.address.trim() && Number.isFinite(value.lat) && Number.isFinite(value.lng)
    && Math.abs(value.lat) <= 90 && Math.abs(value.lng) <= 180);
}
export function safePostingReturn(value: string | null) {
  return value && ["/chu-hang/form-tao-don", "/tai-xe/dang-tin", "/tai-xe/phuong-tien", "/user/ekyc", "/dang-tin", "/don-cua-ban", "/tracking"].includes(value.split("?")[0])
    && value.startsWith("/") && !value.startsWith("//") ? value : null;
}
export function buildShipperPosting(input: { pickup: LocationValue | null; dropoff: LocationValue | null; vehicleType: string; child: string; weightLabel: string; cargo: string; time: string; notes: string; images: string[] }, options: PostingOptions) {
  if (!validLocation(input.pickup) || !validLocation(input.dropoff)) throw new Error("Chọn địa chỉ từ kết quả tìm kiếm hoặc vị trí hiện tại.");
  if (!allowedShipperVehicle(input.vehicleType, options)) throw new Error("Vui lòng chọn loại phương tiện.");
  const caps = postingCapabilities(input.vehicleType, options);
  if (caps.cargo && !options.cargoTypes.includes(input.cargo)) throw new Error("Vui lòng chọn hàng hóa.");
  if (input.images.length > 3) throw new Error("Chỉ được tải tối đa 3 ảnh.");
  if (input.time && (!Number.isFinite(new Date(input.time).getTime()) || new Date(input.time).getTime() <= Date.now())) throw new Error("Thời gian đặt trước phải ở tương lai.");
  const weights = input.vehicleType === "xe tải" ? shipperTruckWeights : options.weightRanges;
  if (caps.capacity && !weights.includes(input.weightLabel)) throw new Error("Vui lòng chọn tải trọng từ danh sách.");
  if (caps.passenger && !options.seatTypes.includes(input.child)) throw new Error("Vui lòng chọn loại xe chi tiết.");
  const weight = caps.capacity ? parseWeightRange(input.weightLabel) : { weight: 0 };
  return { title: input.vehicleType + " · " + input.pickup.address + " → " + input.dropoff.address,
    pickup: input.pickup, dropoff: input.dropoff, vehicleType: input.vehicleType,
    vehicleTypeChild: caps.passenger || caps.capacity && vehicleGroup(input.vehicleType) !== "construction" ? null : input.child || null,
    seats: caps.passenger ? Number(input.child.match(/\d+/)?.[0]) || null : null,
    cargoType: caps.passenger || caps.motorcycle ? "Hành khách" : caps.cargo ? input.cargo : "", ...weight, volume: 0,
    pickupTimeType: input.time ? "scheduled" : "now", pickupTime: input.time ? new Date(input.time).toISOString() : null,
    notes: input.notes.trim(), cargoImageUrls: caps.cargo ? input.images : [] };
}
export function buildDriverPosting(input: { vehicle: PostingVehicle; pickup: LocationValue | null; dropoff: LocationValue | null; from: string; to: string; price: number; min: number; max: number; radius: number; note: string }, options: PostingOptions) {
  if (!validLocation(input.pickup) || !validLocation(input.dropoff)) throw new Error("Chọn đủ hai địa điểm có tọa độ.");
  const id = input.vehicle.id || input.vehicle._id;
  if (!id || !/^[a-f0-9]{24}$/i.test(id)) throw new Error("Vui lòng chọn phương tiện của bạn.");
  if (!Number.isFinite(input.price) || input.price <= 0) throw new Error("Nhập giá chuyến đi hợp lệ.");
  const from = new Date(input.from), to = new Date(input.to);
  if (!Number.isFinite(from.getTime()) || !Number.isFinite(to.getTime()) || to <= from || to.getTime() <= Date.now()) throw new Error("Thời gian kết thúc phải sau bắt đầu và chưa hết hạn.");
  if (!Number.isInteger(input.radius) || input.radius < 3 || input.radius > 300) throw new Error("Bán kính phải từ 3 đến 300 km.");
  const caps = postingCapabilities(input.vehicle.vehicleTypeParent || input.vehicle.type, options);
  if (caps.cargo && !input.vehicle.cargoTypes?.length) throw new Error("Phương tiện chưa khai báo hàng hóa nhận chở. Vui lòng cập nhật trên ứng dụng.");
  const limit = Math.floor(input.vehicle.capacityMax || input.vehicle.capacity || 0);
  if (caps.capacity && (input.min < 0 || input.max <= 0 || input.min > input.max || input.max > limit || !Number.isInteger(input.min) || !Number.isInteger(input.max))) throw new Error("Khoảng tải trọng không hợp lệ hoặc vượt tải trọng phương tiện.");
  return { vehicleId: id, scheduleType: "active", availableFrom: from.toISOString(), availableTo: to.toISOString(),
    route: { from: input.pickup.address, to: input.dropoff.address, pickupLat: input.pickup.lat, pickupLng: input.pickup.lng,
      dropoffLat: input.dropoff.lat, dropoffLng: input.dropoff.lng, pickupRadiusMeters: input.radius * 1000, dropoffRadiusMeters: input.radius * 1000 },
    pricing: { type: "fixed", minPrice: input.price, maxPrice: input.price }, price: input.price,
    pricingMode: caps.passenger || caps.motorcycle ? "full_trip" : "freight",
    ...(caps.passenger ? { vehicleSeats: input.vehicle.seats } : {}),
    ...(caps.capacity ? { availableCapacityMin: input.min, availableCapacityMax: input.max, availableCapacity: input.max } : {}),
    cargoTypes: caps.cargo ? input.vehicle.cargoTypes || [] : [], note: input.note.trim() };
}
