import { NextResponse } from "next/server";
import { API_BASE } from "@/config/env";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
 const code = new URL(req.url).searchParams.get("code")?.trim().toUpperCase() || "";
 const headers = { "Cache-Control": "no-store" };
 if (!/^ORD-[A-Z0-9]+(?:-[A-Z0-9]+)*$/.test(code) || code.length > 100) return NextResponse.json({ error: "Mã đơn không hợp lệ." }, { status: 400, headers });
 const authorization = req.headers.get("authorization");
 try {
   let response: Response;
   if (authorization?.startsWith("Bearer ")) {
     response = await fetch(API_BASE + "/common/orders/by-code/" + encodeURIComponent(code) + "/tracking",
       { headers: { Authorization: authorization }, cache: "no-store", signal: AbortSignal.timeout(15000) });
     // An unrelated signed-in account receives only the same public view as a guest.
     if (response.status === 404) response = await readPublic(code);
   } else response = await readPublic(code);
   const body = await response.json().catch(() => null);
   if (!response.ok || !body?.data) return NextResponse.json({ error: body?.message || "Chưa tải được thông tin đơn." }, { status: response.ok ? 502 : response.status, headers });
   return NextResponse.json(body.data, { headers });
 } catch { return NextResponse.json({ error: "Chưa kết nối được hệ thống. Vui lòng thử lại." }, { status: 502, headers }); }
}
function readPublic(code: string) {
 return fetch(API_BASE + "/public/tracking/" + encodeURIComponent(code), { cache: "no-store", credentials: "omit", signal: AbortSignal.timeout(15000) });
}
