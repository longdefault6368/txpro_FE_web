import { getVehicleCapabilities } from './vehicleCapabilities';
import type { PostingVehicle } from './posting-contract';
export type VehicleImages = { vehicleFronts: string[]; vehicleSides: string[]; registrationFrontPath: string; registrationBackPath?: string | null };
export type RegisteredVehicle = PostingVehicle & { id: string; brand: string; capacityMin?: number | null; imageGroups?: VehicleImages; licenseImages?: string[]; registrationVerificationStatus?: string };
export type VehicleVerification = { plateNumber: string; verificationToken: string; brand?: string; capacityTons?: number | null };
export type VehicleForm = { type: string; child: string; brand: string; seats: string; min: string; max: string; cargo: string[] };
export function buildVehicleRegistration(form: VehicleForm, images: VehicleImages, verification: VehicleVerification | null, requestId: string, existing?: RegisteredVehicle | null) {
  if (!form.type || !form.brand.trim()) throw new Error('Chọn loại xe và nhập hãng / tên xe.');
  const caps = getVehicleCapabilities({ type: form.type, vehicleTypeParent: form.type, vehicleTypeChild: form.child });
  const needsCapacity = caps.hasCapacity && caps.category !== 'construction';
  const min = Number(form.min), max = Number(form.max), seats = Number(form.seats);
  if (needsCapacity && (!form.min.trim() || !form.max.trim() || !Number.isFinite(min) || !Number.isFinite(max) || min < 0 || max <= 0 || max > 200 || min > max)) throw new Error('Khoảng tải trọng không hợp lệ.');
  if (caps.hasSeats && (!Number.isInteger(seats) || seats <= 0)) throw new Error('Chọn số chỗ của phương tiện.');
  if (caps.hasCargoTypes && !form.cargo.length) throw new Error('Chọn hàng hóa muốn chở.');
  if (!existing && (!images.vehicleFronts.length || !images.vehicleSides.length || !images.registrationFrontPath || !images.registrationBackPath)) throw new Error('Cần đủ ảnh xe mặt trước, mặt ngang và cà vẹt hai mặt.');
  if (!existing && (!verification?.plateNumber || !verification.verificationToken)) throw new Error('Quét cà vẹt để đọc biển số trước khi lưu.');
  if (existing && verification && verification.plateNumber.replace(/[^A-Z0-9]/gi, '').toUpperCase() !== existing.plateNumber.replace(/[^A-Z0-9]/gi, '').toUpperCase()) throw new Error('Không được đổi biển số của phương tiện đã đăng ký.');
  const licenseImages = [...new Set([...images.vehicleFronts, ...images.vehicleSides, images.registrationFrontPath, images.registrationBackPath].filter(Boolean) as string[])];
  return { type: form.type, vehicleTypeParent: form.type, vehicleTypeChild: form.child || null,
    brand: form.brand.trim(), seats: caps.hasSeats ? seats : null,
    capacity: needsCapacity ? max : 0, capacityMin: needsCapacity ? min : null, capacityMax: needsCapacity ? max : null,
    cargoTypes: caps.hasCargoTypes ? form.cargo : [],
    // Do not reintroduce dimensions, engine/chassis or editable OCR plate fields.
    ...(images.registrationFrontPath ? { imageGroups: images, licenseImages } : {}),
    ...(existing ? verification ? { vehicleVerificationToken: verification.verificationToken } : {} : { plateNumber: verification!.plateNumber, vehicleVerificationToken: verification!.verificationToken, registrationRequestId: requestId }),
  };
}

export function registrationPlateFromText(text: string): string {
  const normalized = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toUpperCase();
  const lines = normalized.split(/\r?\n/);
  const labels = /BIEN\s*(?:KIEM\s*SOAT|SO(?:\s*XE|\s*DANG\s*KY)?)|(?:NUMBER|LICENSE|REGISTRATION)\s*PLATE|PLATE\s*(?:NUMBER|NO)/;
  const candidates = new Set<string>(), labelled = lines.some(line => labels.test(line));
  const scan = (line: string) => {
    const pattern = /(?<![A-Z0-9])(\d{2})\s*([A-Z]{1,2}\d(?=\s*[-–—−])|[A-Z]{1,3})\s*[-–—−]?\s*(\d{3}[.,·•]\d{2}|\d{4,5})(?![A-Z0-9\d.,])/g;
    for (const match of line.matchAll(pattern)) {
      const digits = match[3].replace(/\D/g, '');
      candidates.add(match[1] + match[2] + '-' + (digits.length === 5 ? digits.slice(0, 3) + '.' + digits.slice(3) : digits));
    }
  };
  if (labelled) lines.forEach((line, index) => {
    const label = labels.exec(line);
    if (!label) return;
    scan(line.slice(label.index + label[0].length));
    for (let offset = 1; offset <= 2 && index + offset < lines.length; offset++) {
      const next = lines[index + offset];
      if (/SO\s*(?:MAY|KHUNG)|ENGINE|CHASSIS|NHAN\s*HIEU|HO\s*TEN/.test(next)) break;
      scan(next);
    }
  }); else lines.forEach(scan);
  if (candidates.size !== 1) throw new Error(candidates.size ? 'Ảnh có nhiều biển số khác nhau. Chọn ảnh chỉ có một cà vẹt.' : 'Chưa đọc rõ biển số. Chụp lại mặt có mục Biển số, đủ sáng và gần hơn.');
  return [...candidates][0];
}
