"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

const ChatWidget = dynamic(() => import("./ChatWidget"), { ssr: false });

export default function GlobalChatWidget() {
  const pathname = usePathname();

  if (pathname?.startsWith("/admin")) return null;

  return <ChatWidget />;
}
