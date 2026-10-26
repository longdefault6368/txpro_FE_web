import { redirect } from "next/navigation";
// Old full-map links now use the same permissions, icons and tracking screen.
export default async function LegacyRouteTracking({ searchParams }: {
 searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
 const params = await searchParams;
 const code = typeof params.code === "string" ? params.code.trim().slice(0, 100) : "";
 redirect("/tracking" + (code ? "?code=" + encodeURIComponent(code) : ""));
}
