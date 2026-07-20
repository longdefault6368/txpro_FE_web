"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X, LogOut, User, Globe } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface UserSession {
  name: string;
  role: string;
  rawRole?: string;
}

export default function Header() {
  const router = useRouter();
  const { t, language, changeLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [session, setSession] = useState<UserSession | null>(null);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target as Node)) {
        setShowLangDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  // Load session from localStorage on client-side mount
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    const loadSession = () => {
      const saved = localStorage.getItem("txpro_user_session");
      if (saved) {
        try {
          setSession(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to parse user session:", e);
        }
      } else {
        setSession(null);
      }
    };

    window.addEventListener("scroll", handleScroll);
    loadSession();

    // Listen for storage events (if user logs in/out in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "txpro_user_session") {
        loadSession();
      }
    };
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  const handleLogout = () => {
    localStorage.removeItem("txpro_user_session");
    localStorage.removeItem("txpro_token");
    setSession(null);
    closeMenu();
    window.dispatchEvent(new Event("storage")); // Trigger storage event for other components/tabs
    router.push("/login");
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/75 backdrop-blur-md shadow-[0_4px_25px_rgba(0,0,0,0.12)] h-16"
            : "bg-white/75 backdrop-blur-md shadow-[0_4px_25px_rgba(0,0,0,0.12)] h-20"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex justify-between items-center h-full">
            <Link href="/" className="flex-shrink-0 flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="TXEPRO Logo"
                width={40}
                height={40}
                className="rounded-full object-cover shadow-md hover:rotate-[360deg] hover:scale-110 transition-all duration-700"
              />
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link
                href="/#how-it-works"
                className="text-slate-600 hover:text-primary-600 font-semibold text-sm transition-colors"
              >
                {t("nav.howItWorks")}
              </Link>
              <Link
                href="/#features"
                className="text-slate-600 hover:text-primary-600 font-semibold text-sm transition-colors"
              >
                {t("nav.features")}
              </Link>
              <Link
                href="/#pricing"
                className="text-slate-600 hover:text-primary-600 font-semibold text-sm transition-colors"
              >
                {t("nav.pricing")}
              </Link>
              <Link
                href="/tracking"
                className="text-slate-600 hover:text-primary-600 font-semibold text-sm transition-colors"
              >
                {t("nav.tracking")}
              </Link>
              <span className="h-4 w-px bg-slate-200"></span>
              
              {session ? (
                <div className="flex items-center space-x-6">
                  <Link href={session.rawRole === "admin" ? "/admin" : "/user"} className="flex items-center gap-2 text-slate-700 hover:text-primary-600 bg-slate-100/80 hover:bg-slate-200/50 px-3.5 py-1.5 rounded-full border border-slate-200/50 transition-colors" title="Xem hồ sơ cá nhân">
                    <User className="w-3.5 h-3.5 text-primary-600" />
                    <span className="text-xs font-bold truncate max-w-[120px]">
                      {session.name}
                    </span>
                    <span className="text-[9px] bg-primary-600 text-white px-1.5 py-0.5 rounded font-bold uppercase">
                      {session.role}
                    </span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-slate-500 hover:text-red-600 font-semibold text-sm transition-colors flex items-center gap-1 cursor-pointer"
                    title="Đăng xuất tài khoản"
                  >
                    <LogOut className="w-4 h-4" /> {t("nav.logout")}
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-6">
                  <Link
                    href="/login"
                    className="text-slate-600 hover:text-primary-600 font-semibold text-sm transition-colors"
                  >
                    {t("nav.login")}
                  </Link>
                  <Link
                    href="/register"
                    className="text-slate-600 hover:text-primary-600 font-semibold text-sm transition-colors"
                  >
                    {t("nav.register")}
                  </Link>
                </div>
              )}
              
              <span className="h-4 w-px bg-slate-200"></span>

              {/* Language Selector Dropdown */}
              <div className="relative" ref={langDropdownRef}>
                <button 
                  onClick={() => setShowLangDropdown(!showLangDropdown)}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200/80 px-3.5 py-2 rounded-full border border-slate-200/50 transition-all cursor-pointer focus:outline-none"
                >
                  <Globe className="w-3.5 h-3.5 text-slate-500" />
                  <span>{language === "vi" ? "Tiếng Việt" : language === "en" ? "English" : "中文"}</span>
                </button>
                <div 
                  className={`absolute right-0 top-full mt-2 w-32 bg-white border border-slate-100 rounded-2xl shadow-xl py-2 transition-all origin-top-right duration-200 z-50 ${
                    showLangDropdown 
                      ? "opacity-100 scale-100 pointer-events-auto" 
                      : "opacity-0 scale-95 pointer-events-none"
                  }`}
                >
                  <button 
                    onClick={() => { changeLanguage("vi"); setShowLangDropdown(false); }}
                    className={`w-full text-left px-4 py-2 text-xs font-bold transition-colors cursor-pointer hover:bg-slate-50 ${language === "vi" ? "text-primary-600 bg-primary-50/50" : "text-slate-700"}`}
                  >
                    🇻🇳 Tiếng Việt
                  </button>
                  <button 
                    onClick={() => { changeLanguage("en"); setShowLangDropdown(false); }}
                    className={`w-full text-left px-4 py-2 text-xs font-bold transition-colors cursor-pointer hover:bg-slate-50 ${language === "en" ? "text-primary-600 bg-primary-50/50" : "text-slate-700"}`}
                  >
                    🇺🇸 English
                  </button>
                  <button 
                    onClick={() => { changeLanguage("zh"); setShowLangDropdown(false); }}
                    className={`w-full text-left px-4 py-2 text-xs font-bold transition-colors cursor-pointer hover:bg-slate-50 ${language === "zh" ? "text-primary-600 bg-primary-50/50" : "text-slate-700"}`}
                  >
                    🇨🇳 中文
                  </button>
                </div>
              </div>

              <span className="h-4 w-px bg-slate-200"></span>
              <a href="/#download" className="btn-primary shine-effect py-2.5 px-5 text-sm">
                {t("nav.download")}
              </a>
            </div>

            <button
              onClick={toggleMenu}
              className="md:hidden text-slate-600 hover:text-primary-600 transition-colors focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Menu */}
      <div
        onClick={closeMenu}
        className={`md:hidden fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm transition-all duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className={`absolute top-20 left-0 right-0 bg-white shadow-xl border-t border-slate-100 p-6 flex flex-col space-y-4 transition-transform duration-300 ${
            isOpen ? "translate-y-0" : "-translate-y-4"
          }`}
        >
          <Link
            href="/#how-it-works"
            onClick={closeMenu}
            className="mobile-nav-link text-lg text-slate-700 hover:text-primary-600 font-semibold transition-colors py-2"
          >
            {t("nav.howItWorks")}
          </Link>
          <Link
            href="/#features"
            onClick={closeMenu}
            className="mobile-nav-link text-lg text-slate-700 hover:text-primary-600 font-semibold transition-colors py-2"
          >
            {t("nav.features")}
          </Link>
          <Link
            href="/#pricing"
            onClick={closeMenu}
            className="mobile-nav-link text-lg text-slate-700 hover:text-primary-600 font-semibold transition-colors py-2"
          >
            {t("nav.pricing")}
          </Link>
          <Link
            href="/tracking"
            onClick={closeMenu}
            className="mobile-nav-link text-lg text-slate-700 hover:text-primary-600 font-semibold transition-colors py-2"
          >
            {t("nav.tracking")}
          </Link>
          <div className="h-px bg-slate-100 my-2"></div>
          
          {session ? (
            <div className="flex flex-col space-y-3 pt-2">
              <Link
                href={session.rawRole === "admin" ? "/admin" : "/user"}
                onClick={closeMenu}
                className="flex items-center justify-between bg-slate-50 hover:bg-slate-100 p-3 rounded-xl border border-slate-100 transition-colors"
              >
                <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <User className="w-4 h-4 text-primary-600" /> {session.name}
                </span>
                <span className="text-[10px] bg-primary-600 text-white px-2 py-0.5 rounded font-bold uppercase">
                  {session.role}
                </span>
              </Link>
              <button
                onClick={handleLogout}
                className="mobile-nav-link text-red-600 font-bold transition-colors py-2 text-center flex items-center justify-center gap-2 cursor-pointer border border-red-100 rounded-xl bg-red-50/50"
              >
                <LogOut className="w-4 h-4" /> {t("nav.logout")}
              </button>
            </div>
          ) : (
            <div className="flex flex-col space-y-2">
              <Link
                href="/login"
                onClick={closeMenu}
                className="mobile-nav-link text-lg text-slate-700 hover:text-primary-600 font-semibold transition-colors py-2 text-center"
              >
                {t("nav.login")}
              </Link>
              <Link
                href="/register"
                onClick={closeMenu}
                className="mobile-nav-link text-lg text-slate-700 hover:text-primary-600 font-semibold transition-colors py-2 text-center"
              >
                {t("nav.register")}
              </Link>
            </div>
          )}
          
          {/* Mobile Language Selector */}
          <div className="flex justify-center gap-3 py-2">
            <button 
              onClick={() => { changeLanguage("vi"); closeMenu(); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${language === "vi" ? "bg-primary-600 text-white border-primary-600 shadow-md shadow-primary-600/20" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"}`}
            >
              🇻🇳 Tiếng Việt
            </button>
            <button 
              onClick={() => { changeLanguage("en"); closeMenu(); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${language === "en" ? "bg-primary-600 text-white border-primary-600 shadow-md shadow-primary-600/20" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"}`}
            >
              🇺🇸 English
            </button>
            <button 
              onClick={() => { changeLanguage("zh"); closeMenu(); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${language === "zh" ? "bg-primary-600 text-white border-primary-600 shadow-md shadow-primary-600/20" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"}`}
            >
              🇨🇳 中文
            </button>
          </div>

          <div className="h-px bg-slate-100 my-2"></div>
          <a
            href="/#download"
            onClick={closeMenu}
            className="mobile-nav-link btn-primary text-center"
          >
            {t("nav.download")}
          </a>
        </div>
      </div>
    </>
  );
}
