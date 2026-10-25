import { catalogText, shipperTruckWeights, vehicleGroup, type PostingOptions } from "./posting-contract";

export type CatalogLanguage = "vi" | "en" | "zh";
type Labels = readonly [string, string, string];
export type VehicleSelection = { vehicleType: string; child: string; weightLabel: string };
export type CatalogChoice = { id: string; title: string; description?: string; image: string; selection?: VehicleSelection };
export const emptyVehicleSelection: VehicleSelection = { vehicleType: "", child: "", weightLabel: "" };
export const catalogLabel = (labels: Labels, language: string) => labels[language === "en" ? 1 : language === "zh" ? 2 : 0];
const groups: Record<string, Labels> = {
  motorcycle: ["Xe máy", "Motorcycle", "摩托车"], car: ["Ô tô", "Passenger car", "汽车"],
  truck: ["Xe tải", "Truck", "货车"], refrigerated: ["Xe đông lạnh", "Refrigerated truck", "冷藏车"],
  container: ["Container / Đầu kéo", "Container / Tractor", "集装箱 / 牵引车"],
  crane: ["Cẩu tự hành / Cần cẩu", "Loader / Mobile crane", "随车吊 / 起重机"],
  rescue: ["Xe cứu hộ", "Recovery vehicle", "救援车"], construction: ["Xe công trình", "Construction vehicle", "工程车"],
  carrier: ["Xe tải / Container lồng chở ô tô", "Car carrier", "汽车运输车"],
  van: ["Xe van / Bán tải", "Van / Pickup", "厢式车 / 皮卡"], ambulance: ["Xe cứu thương", "Ambulance", "救护车"],
  livestock: ["Xe chở gia súc", "Livestock truck", "牲畜运输车"], tanker: ["Xe bồn", "Tanker", "罐车"],
};
export const vehicleImage = (type: string) => "/images/catalog/vehicle_picker_" + (vehicleGroup(type) === "other" || !vehicleGroup(type) ? "truck" : vehicleGroup(type)) + ".webp";
export function vehicleChoices(options: PostingOptions, language: string): CatalogChoice[] {
  const result = Object.keys(groups).filter(id => options.vehicleTypes.some(value => vehicleGroup(value) === id)
    || (id === "carrier" && options.vehicleTypes.some(value => vehicleGroup(value) === "container") && options.containerTypes.some(value => vehicleGroup(value) === "carrier")))
    .map(id => ({ id, title: catalogLabel(groups[id], language), image: "/images/catalog/vehicle_picker_" + id + ".webp" }));
  // Preserve future backend categories rather than silently making them unavailable.
  return [...result, ...options.vehicleTypes.filter(value => vehicleGroup(value) === "other").map(value => ({ id: "other:" + value, title: value, image: vehicleImage(value) }))];
}
export function selectionForGroup(id: string, options: PostingOptions): VehicleSelection {
  const canonical: Record<string, string> = { truck: "xe tải", crane: "xe cẩu tự hành / cần cẩu", carrier: "xe tải / container lồng chở ô tô" };
  return { vehicleType: canonical[id] || (id.startsWith("other:") ? id.slice(6) : options.vehicleTypes.find(value => vehicleGroup(value) === id) || ""), child: "", weightLabel: "" };
}
export const hasVehicleChildren = (id: string) => ["car", "truck", "container"].includes(id);
export function containerFamily(value: string): string | null {
  const n = catalogText(value);
  if (["xe container", "xe container 20 feet", "xe container 40 feet", "xe container 45 feet", "xe container mo noc open top"].includes(n)) return "standard";
  if (n === "xe container lanh reefer") return "refrigerated";
  if (["xe container mooc san", "xe container phang flat rack", "xe container mooc lun low boy trailer", "xe container co can cau sidelifter"].includes(n)) return "flatbed";
  return null;
}
export function vehicleChildren(id: string, options: PostingOptions, language: string): CatalogChoice[] {
  const base = selectionForGroup(id, options);
  if (id === "truck") return shipperTruckWeights.map((weightLabel, index) => ({
    id: weightLabel,
    title: catalogLabel([
      ["Xe tải nhỏ", "Xe tải vừa", "Xe tải lớn", "Xe tải quá lớn"][index],
      ["Small truck", "Medium truck", "Large truck", "Heavy truck"][index],
      ["小型货车", "中型货车", "大型货车", "重型货车"][index],
    ], language),
    description: weightLabelForDisplay(weightLabel, language),
    image: "/images/catalog/vehicle_picker_" + ["small_truck", "truck", "heavy_truck", "heavy_truck"][index] + ".webp",
    selection: { ...base, child: weightLabel, weightLabel },
  }));
  if (id === "car") return options.seatTypes.map(child => {
    const seats = Number(child.match(/\d+/)?.[0]);
    return { id: child, title: seats ? catalogLabel([seats + " chỗ", seats + " seats", seats + " 座"], language) : child,
      image: "/images/catalog/vehicle_picker_" + (seats <= 5 ? "car" : seats <= 7 ? "suv" : seats <= 16 ? "passenger_van" : "bus") + ".webp",
      selection: { ...base, child } };
  });
  if (id === "container") {
    const families: { id: string; child: string; labels: Labels; image: string }[] = [
      { id: "standard", child: "xe container", labels: ["Xe container", "Container truck", "集装箱车"], image: "container" },
      { id: "refrigerated", child: "xe container lạnh (reefer)", labels: ["Xe container lạnh", "Refrigerated container", "冷藏集装箱车"], image: "container_reefer" },
      { id: "flatbed", child: "xe container moóc sàn", labels: ["Xe container moóc sàn", "Flatbed container", "平板半挂车"], image: "container_flatbed" },
    ];
    return families.filter(f => options.containerTypes.some(child => containerFamily(child) === f.id)).map(f => ({
      id: f.id, title: catalogLabel(f.labels, language), image: "/images/catalog/vehicle_picker_" + f.image + ".webp",
      selection: { ...base, child: f.child },
    }));
  }
  return [];
}
export function validVehicleSelection(value: VehicleSelection, options: PostingOptions) {
  const id = vehicleGroup(value.vehicleType);
  if (!id) return false;
  const group = vehicleChoices(options, "vi").find(choice => choice.id === id || choice.id === "other:" + value.vehicleType);
  if (!group || selectionForGroup(group.id, options).vehicleType !== value.vehicleType) return false;
  return !hasVehicleChildren(group.id) || vehicleChildren(group.id, options, "vi").some(choice =>
    choice.selection?.child === value.child && (id !== "truck" || choice.selection?.weightLabel === value.weightLabel));
}
export function selectionDisplay(value: VehicleSelection, options: PostingOptions, language: string): CatalogChoice | undefined {
  const id = vehicleGroup(value.vehicleType) || "";
  const group = vehicleChoices(options, language).find(choice => choice.id === id || choice.id === "other:" + value.vehicleType);
  if (!group) return;
  return vehicleChildren(id, options, language).find(choice => choice.selection?.child === value.child) || group;
}
export function weightLabelForDisplay(value: string, language: string) {
  const values = value.match(/\d+(?:[.,]\d+)?/g) || [];
  if (language === "vi") return value.replace(/(\d)\.(\d)/g, "$1,$2");
  const under = catalogText(value).startsWith("duoi");
  return language === "zh" ? (values.length > 1 ? values.join("–") + " 吨" : (under ? "低于 " : "") + values[0] + " 吨")
    : (values.length > 1 ? values.join("–") : (under ? "Under " : "") + values[0]) + " tonnes";
}
const cargoCatalog: Record<string, { image: string; labels: Labels }> = {
  "do gia dung noi that": { image: "furniture", labels: ["Đồ gia dụng / Nội thất", "Household / Furniture", "家居 / 家具"] },
  "vat lieu xay dung": { image: "construction", labels: ["Vật liệu xây dựng", "Building materials", "建筑材料"] },
  "hang thuc pham nong san": { image: "produce", labels: ["Thực phẩm / Nông sản", "Food / Produce", "食品 / 农产品"] },
  "hang dong lanh": { image: "frozen", labels: ["Hàng đông lạnh", "Frozen goods", "冷冻货物"] },
  "hang de vo": { image: "fragile", labels: ["Hàng dễ vỡ", "Fragile goods", "易碎品"] },
  "hang thiet bi dien tu": { image: "electronics", labels: ["Thiết bị điện tử", "Electronics", "电子设备"] },
  "may moc thiet bi": { image: "machinery", labels: ["Máy móc / Thiết bị", "Machinery / Equipment", "机械 / 设备"] },
  "sieu truong sieu trong": { image: "oversized", labels: ["Siêu trường / Siêu trọng", "Oversized / Heavy cargo", "超长 / 超重货物"] },
  "hang hoa long": { image: "liquid", labels: ["Hàng hóa lỏng", "Liquid cargo", "液体货物"] },
};
export function cargoChoice(value: string, language: string): CatalogChoice {
  const item = cargoCatalog[catalogText(value)];
  return { id: value, title: item ? catalogLabel(item.labels, language) : value,
    image: "/images/catalog/cargo_picker_" + (item?.image || "general") + ".webp" };
}
