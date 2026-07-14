"use client";
import { useState, useEffect, useRef } from "react";
import { Menu, X, ChevronDown, ArrowRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { label: "Trang chủ", href: "/" },
  { label: "Về IDAZ", href: "/gioi-thieu" },
  {
    label: "Dịch vụ",
    href: "/dich-vu",
    children: [
      { label: "Thiết kế Logo & Thương hiệu", href: "/dich-vu/thiet-ke-logo-thuong-hieu", desc: "Xây dựng nhận diện độc đáo" },
      { label: "Thiết kế Website & UI/UX", href: "/dich-vu/thiet-ke-website", desc: "Trải nghiệm kỹ thuật số đỉnh cao" },
      { label: "Truyền thông & Marketing", href: "/dich-vu/truyen-thong-marketing", desc: "Tiếp cận đúng khách hàng" },
    ],
  },
  { label: "Portfolio", href: "/portfolio" },
  { label: "Blog", href: "/blog" },
];

export default function PublicNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const pathname = usePathname();
  const dropdownRef = useRef(null);
  const closeTimer = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setActiveDropdown(null);
  }, [pathname]);

  // Close mobile menu on escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setMobileOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Prevent body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const handleDropdownEnter = (href) => {
    clearTimeout(closeTimer.current);
    setActiveDropdown(href);
  };

  const handleDropdownLeave = () => {
    closeTimer.current = setTimeout(() => setActiveDropdown(null), 120);
  };

  const isActive = (href) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Main Navbar */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          scrolled
            ? "top-3 px-4 md:px-6 lg:px-8"
            : "px-0"
        }`}
      >
        <div
          className={`mx-auto transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
            scrolled
              ? "max-w-6xl rounded-[20px] glass-panel shadow-[0_8px_32px_rgba(0,0,0,0.08)]"
              : "max-w-none bg-[rgba(245,245,247,0.85)] backdrop-blur-[40px] border-b border-[rgba(0,0,0,0.06)]"
          }`}
        >
          <div className="max-w-7xl mx-auto px-5 md:px-8 h-[60px] flex items-center justify-between gap-6">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 select-none group flex-shrink-0" aria-label="IDAZ Branding - Trang chủ">
              <div
                className="px-2.5 py-1 rounded-[8px] transition-all duration-300 group-hover:scale-105"
                style={{ background: "var(--color-idaz-orange)" }}
              >
                <span className="font-black text-headline tracking-tight text-[#1D1D1F]" >
                  IDAZ
                </span>
              </div>
              <span className="font-black text-headline tracking-tight text-[#1D1D1F] hidden sm:block" >
                BRANDING
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1" role="navigation" aria-label="Menu chính">
              {navLinks.map((link) =>
                link.children ? (
                  <div
                    key={link.href}
                    className="relative"
                    onMouseEnter={() => handleDropdownEnter(link.href)}
                    onMouseLeave={handleDropdownLeave}
                    ref={dropdownRef}
                  >
                    <button
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-footnote font-semibold transition-all duration-200 ${
                        isActive(link.href)
                          ? "bg-[rgba(245,166,35,0.1)] text-[#D4891A]"
                          : "text-[#424245] hover:bg-[rgba(0,0,0,0.04)] hover:text-[#1D1D1F]"
                      }`}
                      
                      aria-expanded={activeDropdown === link.href}
                      aria-haspopup="true"
                    >
                      {link.label}
                      <ChevronDown
                        size={13}
                        className={`transition-transform duration-300 ${activeDropdown === link.href ? "rotate-180" : ""}`}
                        strokeWidth={2.5}
                      />
                    </button>

                    {/* Dropdown */}
                    {activeDropdown === link.href && (
                      <div
                        className="absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 w-[280px] glass-panel rounded-[16px] py-2 px-2 shadow-[0_16px_48px_rgba(0,0,0,0.1)] animate-slide-down"
                        onMouseEnter={() => handleDropdownEnter(link.href)}
                        onMouseLeave={handleDropdownLeave}
                      >
                        {link.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            className="flex flex-col px-4 py-3 rounded-[10px] transition-all duration-200 hover:bg-[rgba(245,166,35,0.08)] group/item"
                          >
                            <span className="text-footnote font-semibold text-[#1D1D1F] group-hover/item:text-[#D4891A] transition-colors" >
                              {child.label}
                            </span>
                            <span className="text-caption-1 text-[#86868B] mt-0.5" >
                              {child.desc}
                            </span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-4 py-2 rounded-[10px] text-footnote font-semibold transition-all duration-200 ${
                      isActive(link.href)
                        ? "bg-[rgba(245,166,35,0.1)] text-[#D4891A]"
                        : "text-[#424245] hover:bg-[rgba(0,0,0,0.04)] hover:text-[#1D1D1F]"
                    }`}
                    
                  >
                    {link.label}
                  </Link>
                )
              )}
            </nav>

            {/* Desktop CTAs */}
            <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
              <Link
                href="/login"
                className="px-5 py-2 rounded-[10px] text-footnote font-semibold text-[#424245] hover:bg-[rgba(0,0,0,0.04)] hover:text-[#1D1D1F] transition-all duration-200"
                
              >
                Đăng nhập
              </Link>
              <Link
                href="/lien-he"
                className="flex items-center gap-2 px-5 py-2.5 rounded-full text-footnote font-bold transition-all duration-300 hover:shadow-[0_4px_20px_rgba(245,166,35,0.35)] hover:scale-[1.03] active:scale-[0.98]"
                style={{
                  background: "var(--color-idaz-orange)",
                  color: "#1D1D1F",
                  
                }}
              >
                Tư vấn miễn phí
                <ArrowRight size={14} strokeWidth={2.5} />
              </Link>
            </div>

            {/* Mobile hamburger */}
            <button
              className="lg:hidden w-10 h-10 flex items-center justify-center rounded-[10px] text-[#1D1D1F] hover:bg-[rgba(0,0,0,0.05)] transition-all duration-200"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? "Đóng menu" : "Mở menu"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={20} strokeWidth={2} /> : <Menu size={20} strokeWidth={2} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu — Full screen overlay */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="lg:hidden fixed inset-0 z-40 bg-[rgba(0,0,0,0.2)] backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          {/* Panel */}
          <div className="lg:hidden fixed top-0 left-0 right-0 z-50 glass-panel shadow-[0_8px_40px_rgba(0,0,0,0.12)] animate-slide-down">
            {/* Header */}
            <div className="flex items-center justify-between px-5 h-[60px] border-b border-[rgba(0,0,0,0.06)]">
              <Link href="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
                <div className="px-2.5 py-1 rounded-[8px]" style={{ background: "var(--color-idaz-orange)" }}>
                  <span className="font-black text-headline tracking-tight text-[#1D1D1F]" >IDAZ</span>
                </div>
                <span className="font-black text-headline tracking-tight text-[#1D1D1F]" >BRANDING</span>
              </Link>
              <button
                className="w-10 h-10 flex items-center justify-center rounded-[10px] text-[#1D1D1F] hover:bg-[rgba(0,0,0,0.05)]"
                onClick={() => setMobileOpen(false)}
                aria-label="Đóng menu"
              >
                <X size={20} strokeWidth={2} />
              </button>
            </div>

            {/* Links */}
            <div className="px-4 py-4 max-h-[calc(100dvh-60px-120px)] overflow-y-auto">
              {navLinks.map((link, i) => (
                <div key={link.href}>
                  <Link
                    href={link.href}
                    className={`flex items-center justify-between px-4 py-3.5 rounded-[12px] text-callout font-semibold transition-all duration-200 ${
                      isActive(link.href)
                        ? "bg-[rgba(245,166,35,0.08)] text-[#D4891A]"
                        : "text-[#1D1D1F] hover:bg-[rgba(0,0,0,0.04)]"
                    }`}
                    
                    onClick={() => !link.children && setMobileOpen(false)}
                  >
                    {link.label}
                    {link.children && <ChevronDown size={16} className="text-[#86868B]" />}
                  </Link>
                  {link.children?.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className="flex items-center gap-3 pl-8 pr-4 py-3 rounded-[12px] text-footnote font-medium text-[#6E6E73] hover:text-[#D4891A] hover:bg-[rgba(245,166,35,0.06)] transition-all duration-200"
                      
                      onClick={() => setMobileOpen(false)}
                    >
                      <span className="w-1 h-1 rounded-full bg-[#D2D2D7] flex-shrink-0" />
                      {child.label}
                    </Link>
                  ))}
                </div>
              ))}
            </div>

            {/* Mobile CTAs */}
            <div className="px-4 py-4 border-t border-[rgba(0,0,0,0.06)] flex flex-col gap-3">
              <Link
                href="/lien-he"
                className="flex items-center justify-center gap-2 py-4 rounded-full text-subheadline font-bold transition-all duration-300 hover:opacity-90 active:scale-[0.98]"
                style={{ background: "var(--color-idaz-orange)", color: "#1D1D1F", }}
                onClick={() => setMobileOpen(false)}
              >
                Nhận tư vấn miễn phí
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 py-4 rounded-full text-subheadline font-semibold text-[#424245] border border-[rgba(0,0,0,0.1)] hover:bg-[rgba(0,0,0,0.03)] transition-all duration-200"
                
                onClick={() => setMobileOpen(false)}
              >
                Đăng nhập cổng khách hàng
              </Link>
            </div>
          </div>
        </>
      )}

      {/* Spacer to push content below fixed navbar */}
      <div className="h-[60px]" aria-hidden="true" />
    </>
  );
}
