import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quản lý Tin tức | TXE PRO Admin",
  robots: { index: false, follow: false },
};

export default function AdminNewsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
