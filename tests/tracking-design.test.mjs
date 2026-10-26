import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { createRequire } from "node:module";
import vm from "node:vm";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
const root = resolve(import.meta.dirname, ".."), nativeRequire = createRequire(import.meta.url);
function loader({ states = {}, code = "ORD-PUBLIC-CHECK001", send } = {}) {
 const cache = new Map();
 const load = file => {
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} }; cache.set(file, module);
  let index = 0;
  const js = ts.transpileModule(readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  const require = id => {
   if (id === "react") return { ...React, useEffect: () => {}, useRef: value => ({ current: value }),
    useState: value => [file.endsWith("TrackingWorkspace.tsx") && index in states ? states[index++] : (index++, value), () => {}] };
   if (id === "next/link") return ({children, ...props}) => React.createElement("a", props, children);
   if (id === "next/image") return ({priority, fill, ...props}) => React.createElement("img", props);
   if (id === "next/navigation") return { useRouter: () => ({ push() {} }), useSearchParams: () => new URLSearchParams({code}) };
   if (id === "next/server") return { NextResponse: { json: (body, init = {}) => Response.json(body, init) } };
   if (id === "@/config/env") return { API_BASE: "https://chosen.test/api/v1" };
   if (id === "@/utils/api") return { fetchWithAuth: () => { throw new Error("Unexpected render request"); } };
   if (id === "@/components/common/Header" || id === "@/components/common/Footer") return () => null;
   if (id === "./TrackingMap") return () => React.createElement("div", { "data-private-map": true });
   if (id.endsWith(".module.css")) return new Proxy({}, {get: (_, key) => key === "__esModule" ? false : String(key)});
   if (id.startsWith("@/") || id.startsWith(".")) {
    const path = id.startsWith("@/") ? resolve(root, "src", id.slice(2)) : resolve(dirname(file), id);
    return load(path + (existsSync(path + ".tsx") ? ".tsx" : ".ts"));
   }
   return nativeRequire(id);
  };
  vm.runInNewContext("(function(require,module,exports){" + js + "\n})", { URL, URLSearchParams, AbortSignal, Response, Headers, fetch: send || fetch, console })(require, module, module.exports);
  return module.exports;
 };
 return path => load(resolve(root, path));
}
const order = { orderCode: "ORD-PUBLIC-CHECK001", vehicleType: "xe máy", status: "in_progress", createdAt: "2026-10-20T00:00:00Z", startedAt: "2026-10-20T02:00:00Z" };
test("guest view renders shipment map, addresses and price without requiring login", () => {
 const publicOrder = {...order, pickup:{address:"Public route A",lat:10,lng:106},dropoff:{address:"Public route B",lat:11,lng:107},offerPrice:150000};
 const Page = loader({states:{1:{access:"public",order:publicOrder}}})("src/components/tracking/TrackingWorkspace.tsx").default;
 const html = renderToStaticMarkup(React.createElement(Page));
 assert.ok(html.includes(order.orderCode));
 assert.ok(html.includes("Thông tin tra cứu công khai"));
 assert.ok(html.includes("vehicle_picker_motorcycle.webp"));
 assert.ok(html.includes("data-private-map"));
 assert.ok(html.includes("Giá chuyến"));
 assert.ok(html.includes("Public route A"));
 assert.ok(html.includes("150.000"));
 assert.ok(!html.includes('/login?next='));
 assert.ok(!html.includes('href="tel:'));
});
test("authorized view renders matching vehicle artwork, route and real driver details", () => {
 const data = {access:"private",order:{...order,vehicleType:"5 chỗ",offerPrice:null,pickup:{address:"Actual A",lat:0,lng:106},dropoff:{address:"Actual B",lat:10,lng:107}},
  driver:{fullName:"Test Driver",phone:"+84901234567",vehicleType:"5 chỗ",plateNumber:"51A-12345"},latestLocation:{lat:0,lng:106,createdAt:"2026-10-20T02:00:00Z"}};
 const Page = loader({states:{1:data}})("src/components/tracking/TrackingWorkspace.tsx").default;
 const html = renderToStaticMarkup(React.createElement(Page));
 assert.ok(html.includes("data-private-map"));
 assert.ok(html.includes("vehicle_picker_car.webp"));
 assert.ok(html.includes("Actual A")); assert.ok(html.includes("Test Driver"));
 assert.ok(html.includes('href="tel:+84901234567"'));
 assert.ok(html.includes("Chưa có giá"));
});
test("GPS age uses minutes, hours and days without inventing missing timestamps", () => {
 const { gpsAge, trackingDate } = loader()("src/components/tracking/types.ts");
 const now = Date.parse("2026-10-26T10:00:00Z");
 assert.equal(gpsAge("2026-10-26T09:55:00Z",now),"Cập nhật 5 phút trước");
 assert.equal(gpsAge("2026-10-26T07:00:00Z",now),"Cập nhật 3 giờ trước");
 assert.equal(gpsAge("2026-10-23T07:00:00Z",now),"Cập nhật 3 ngày trước");
 assert.equal(trackingDate("invalid"),null);
 assert.ok(gpsAge(undefined).includes("Chưa có"));
});
test("tracking proxy calls public endpoint without credentials and keeps private queries on the chosen backend", async () => {
 const calls = [];
 const send = async (url, options) => { calls.push([url,options]); return Response.json({data:{access:"public",order}}); };
 const { GET } = loader({send})("src/app/api/tracking/route.ts");
 const result = await GET(new Request("http://site.test/api/tracking?code=" + order.orderCode));
 assert.equal(result.status,200);
 assert.equal(calls[0][0],"https://chosen.test/api/v1/public/tracking/" + order.orderCode);
 assert.equal(calls[0][1].headers,undefined);
 assert.equal(calls[0][1].cache,"no-store");
 const privateCalls = [];
 const handler = loader({send: async(url, options) => { privateCalls.push([url,options]); return privateCalls.length === 1 ? Response.json({message:"Not found"},{status:404}) : Response.json({data:{access:"public",order}}); }})("src/app/api/tracking/route.ts").GET;
 assert.equal((await handler(new Request("http://site.test/api/tracking?code=" + order.orderCode,{headers:{Authorization:"Bearer test-token"}}))).status,200);
 assert.equal(privateCalls[0][1].headers.Authorization,"Bearer test-token");
 assert.ok(privateCalls[0][0].includes("/common/orders/by-code/"));
 assert.equal(privateCalls[1][1].headers,undefined);
 assert.ok(privateCalls[1][0].includes("/public/tracking/"));
 assert.equal((await GET(new Request("http://site.test/api/tracking?code=bad"))).status,400);
});
