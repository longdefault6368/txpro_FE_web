"use client";

import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

// Common Components
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import ScrollToTop from "@/components/common/ScrollToTop";
import ChatWidget from "@/components/common/ChatWidget";

// Section Components
import Hero from "@/components/sections/Hero";
import HowItWorks from "@/components/sections/HowItWorks";
import Features from "@/components/sections/Features";
import Savings from "@/components/sections/Savings";
import Stats from "@/components/sections/Stats";
import Download from "@/components/sections/Download";

export default function Home() {
  useEffect(() => {
    AOS.init({
      once: true,
      offset: 100,
      easing: "ease-out-cubic",
      duration: 800,
    });
  }, []);

  return (
    <>
      {/* Background Blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-primary-200 rounded-full mix-blend-multiply filter blur-[100px] opacity-60 animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-purple-200 rounded-full mix-blend-multiply filter blur-[100px] opacity-60 animate-blob" style={{ animationDelay: "2s" }}></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[700px] h-[700px] bg-blue-200 rounded-full mix-blend-multiply filter blur-[120px] opacity-50 animate-blob" style={{ animationDelay: "4s" }}></div>
      </div>

      <Header />
      <main className="overflow-hidden">
        <Hero />
        <HowItWorks />
        <Features />
        <Savings />
        <Stats />
        <Download />
      </main>
      <Footer />

      {/* Interactive Floating Utilities */}
      <ScrollToTop />
      <ChatWidget />
    </>
  );
}
