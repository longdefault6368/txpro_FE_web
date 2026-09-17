export type VehicleCategory = "passenger_car" | "cargo_truck" | "container_or_tractor" | "cargo_crane" | "other";

export interface VehicleCapabilities {
  category: VehicleCategory;
  hasSeats: boolean;
  hasCapacity: boolean;
  hasCargoTypes: boolean;
}

const normalize = (value?: string | null) => (value || "")
  .trim()
  .toLocaleLowerCase("vi")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/đ/g, "d")
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

export function getVehicleCapabilities(input?: {
  vehicleTypeParent?: string | null;
  vehicleTypeChild?: string | null;
  type?: string | null;
} | null): VehicleCapabilities {
  if (!input) {
    return {
      category: "other",
      hasSeats: false,
      hasCapacity: false,
      hasCargoTypes: false,
    };
  }

  const parent = normalize(input.vehicleTypeParent);
  const child = normalize(input.vehicleTypeChild);
  const type = normalize(input.type);
  const all = [parent, child, type].filter(Boolean).join(" ");

  // Container / xe đầu kéo: có tải trọng và loại hàng hóa, không có số chỗ.
  const isContainerOrTractor =
    parent.includes("container") ||
    parent.includes("dau keo") ||
    all.includes("container") ||
    all.includes("dau keo") ||
    all.includes("mooc") ||
    all.includes("trailer");

  if (isContainerOrTractor) {
    return {
      category: "container_or_tractor",
      hasSeats: false,
      hasCapacity: true,
      hasCargoTypes: true,
    };
  }

  // Xe cẩu / xe tải cẩu: có tải trọng và loại hàng hóa, không có số chỗ.
  // Match cụ thể để không nhận nhầm "xe cứu hộ" thành xe cẩu.
  const isCargoCrane =
    all.includes("xe tai cau") ||
    all.includes("tai cau") ||
    all.includes("xe cau") ||
    all.includes("cau tu hanh") ||
    all.includes("can cau") ||
    (all.includes("cau") && !all.includes("cuu ho"));

  if (isCargoCrane) {
    return {
      category: "cargo_crane",
      hasSeats: false,
      hasCapacity: true,
      hasCargoTypes: true,
    };
  }

  // Other/special vehicles which can contain ambiguous words such as
  // `o to` or `xe tai`, but do not support seats, capacity or cargo types.
  const isSpecialOrOther =
    all.includes("cho o to") ||
    all.includes("ben") ||
    all.includes("ban tai") ||
    all.includes("van") ||
    all.includes("bon") ||
    all.includes("cuu ho") ||
    all.includes("cong trinh") ||
    all.includes("gia suc") ||
    all.includes("phuong tien khac");

  // 2. Ô tô chở khách: có số chỗ, KHÔNG hàng hóa, KHÔNG tải trọng
  const isPassengerCar =
    !isSpecialOrOther &&
    (
      parent === "o to" ||
      parent === "oto" ||
      parent === "xe khach" ||
      parent === "o to cho khach" ||
      parent === "xe du lich" ||
      (parent === "" && (type === "o to" || type === "oto" || type === "xe khach" || /^\d+\s*(ghe|cho)/.test(child) || /^\d+\s*(ghe|cho)/.test(type)))
    );

  if (isPassengerCar) {
    return {
      category: "passenger_car",
      hasSeats: true,
      hasCapacity: false,
      hasCargoTypes: false,
    };
  }

  // 3. Các loại xe tải (thùng bạt, thùng kín, thùng lửng, đông lạnh...): có tấn (tải trọng), có hàng hóa, KHÔNG có số chỗ
  const isCargoTruck =
    !isSpecialOrOther &&
    (
      parent === "xe tai" ||
      parent.startsWith("xe tai ") ||
      all.startsWith("xe tai") ||
      all.includes("thung bat") ||
      all.includes("thung kin") ||
      all.includes("thung lung") ||
      all.includes("dong lanh")
    );

  if (isCargoTruck) {
    return {
      category: "cargo_truck",
      hasSeats: false,
      hasCapacity: true,
      hasCargoTypes: true,
    };
  }

  // Các loại xe còn lại: không số chỗ, không hàng hóa, không tải trọng.
  return {
    category: "other",
    hasSeats: false,
    hasCapacity: false,
    hasCargoTypes: false,
  };
}
