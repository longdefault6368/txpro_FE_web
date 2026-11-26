import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TXE PRO — Tìm xe chở hàng và kết nối tài xế",
    short_name: "TXE PRO",
    description:
      "Đăng nhu cầu tìm xe, chọn tài xế theo tuyến và theo dõi hành trình trên TXE PRO.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#136dec",
    lang: "vi",
    icons: [
      {
        src: "/logo-mark.webp",
        sizes: "192x192",
        type: "image/webp",
      },
      {
        src: "/logo-circle.png",
        sizes: "430x430",
        type: "image/png",
      },
    ],
  };
}
