import Image from "next/image";
import { vehicleImage as catalogVehicleImage } from "@/utils/catalog-presentation";
import { getVehicleCapabilities } from "@/utils/vehicleCapabilities";
// The same catalog artwork is used in pickers, tracking markers and information cards.
export function vehicleImage(type: string) {
 const category = getVehicleCapabilities({ type }).category;
 return catalogVehicleImage(category === "passenger_car" ? "ô tô" : category === "motorcycle" ? "xe máy" : type);
}
export default function VehicleIcon({ type, size = 64, label }: { type?: string | null; size?: number; label?: string }) {
 return <Image src={vehicleImage(type || "")} alt={label || ""} width={size} height={Math.round(size * .72)}
   style={{ width: size, height: Math.round(size * .72), objectFit: "contain", flexShrink: 0 }} />;
}
