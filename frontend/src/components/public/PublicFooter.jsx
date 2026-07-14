"use client";
import Link from "next/link";
import { useState } from "react";
import { Phone, Mail, MapPin, ArrowRight, Send } from "lucide-react";

const footerNav = [
  {
    title: "Dịch vụ",
    links: [
      { label: "Thiết kế Logo & Thương hiệu", href: "/dich-vu/thiet-ke-logo-thuong-hieu" },
      { label: "Thiết kế Website & UI/UX", href: "/dich-vu/thiet-ke-website" },
      { label: "Truyền thông & Marketing", href: "/dich-vu/truyen-thong-marketing" },
      { label: "Tất cả dịch vụ", href: "/dich-vu" },
    ],
  },
  {
    title: "Công ty",
    links: [
      { label: "Về IDAZ", href: "/gioi-thieu" },
      { label: "Portfolio", href: "/portfolio" },
      { label: "Blog & Kiến thức", href: "/blog" },
      { label: "Liên hệ", href: "/lien-he" },
    ],
  },
  {
    title: "Khách hàng",
    links: [
      { label: "Đăng nhập cổng KH", href: "/login" },
      { label: "Đăng ký tài khoản", href: "/register" },
      { label: "Chính sách bảo mật", href: "#" },
      { label: "Điều khoản sử dụng", href: "#" },
    ],
  },
];

const socials = [
  {
    label: "Facebook",
    href: "https://facebook.com",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
    ),
  },
  {
    label: "Instagram",
    href: "https://instagram.com",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
    ),
  },
  {
    label: "YouTube",
    href: "https://youtube.com",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
    ),
  },
  {
    label: "LinkedIn",
    href: "https://linkedin.com",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
    ),
  },
];

export default function PublicFooter() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.includes("@")) {
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <footer className="bg-[#111111] text-white" role="contentinfo">

      {/* CTA Block */}
      <div className="relative overflow-hidden">
        <div
          className="py-16 md:py-20"
          style={{ background: "linear-gradient(135deg, #F5A623 0%, #D4891A 100%)" }}
        >
          {/* Decorative grid */}
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
              backgroundSize: "40px 40px",
            }}
            aria-hidden="true"
          />
          <div className="relative z-10 max-w-4xl mx-auto px-5 md:px-8 text-center">
            <h2
              className="font-display font-black text-[#1D1D1F] mb-4 tracking-[-0.025em] leading-[1.0]"
              style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
            >
              Bắt đầu dự án{" "}
              <span className="relative inline-block">
                thương hiệu
                <span className="absolute bottom-1 left-0 w-full h-[3px] bg-[rgba(29,29,31,0.2)] rounded-full" />
              </span>
              {" "}ngay hôm nay
            </h2>
            <p
              className="text-[#1D1D1F]/70 mb-8 text-callout md:text-body font-[400] max-w-xl mx-auto"
              
            >
              Tư vấn miễn phí · Không cam kết · Không ràng buộc
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/lien-he"
                className="flex items-center gap-2.5 px-8 py-4 rounded-full text-subheadline font-bold bg-[#1D1D1F] text-white transition-all duration-300 hover:bg-[#000] hover:shadow-[0_8px_32px_rgba(0,0,0,0.25)] hover:-translate-y-0.5 mobile-full-btn justify-center"
                
              >
                Liên hệ ngay
                <ArrowRight size={17} />
              </Link>
              <Link
                href="tel:0318845312"
                className="flex items-center gap-2.5 px-8 py-4 rounded-full text-subheadline font-bold border-2 border-[rgba(29,29,31,0.3)] text-[#1D1D1F] transition-all duration-300 hover:border-[rgba(29,29,31,0.6)] hover:-translate-y-0.5 mobile-full-btn justify-center"
                
              >
                <Phone size={16} strokeWidth={2} />
                031 884 5312
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-5 md:px-8 py-14 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-[200px_1fr_1fr_1fr] gap-8 lg:gap-10">

          {/* Brand column */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            {/* Logo */}
            <Link href="/" className="inline-flex items-center gap-2 mb-5 group" aria-label="IDAZ Branding">
              <div className="px-2.5 py-1 rounded-[8px] transition-transform duration-300 group-hover:scale-105" style={{ background: "var(--color-idaz-orange)" }}>
                <span className="font-black text-headline tracking-tight text-[#1D1D1F]" >IDAZ</span>
              </div>
              <span className="font-black text-headline tracking-tight text-white" >BRANDING</span>
            </Link>

            <p
              className="text-footnote leading-relaxed text-[rgba(255,255,255,0.45)] mb-6 font-[400]"
              
            >
              Đồng hành cùng doanh nghiệp xây dựng thương hiệu chuyên nghiệp, nhất quán và bền vững.
            </p>

            {/* Socials */}
            <div className="flex items-center gap-3">
              {socials.map(({ label, href, icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-9 h-9 rounded-[10px] flex items-center justify-center text-[rgba(255,255,255,0.4)] hover:text-white hover:bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.2)] transition-all duration-200"
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Nav columns */}
          {footerNav.map(({ title, links }) => (
            <div key={title}>
              <h3
                className="text-caption-1 font-bold uppercase tracking-[0.12em] text-[rgba(255,255,255,0.4)] mb-5"
                
              >
                {title}
              </h3>
              <ul className="space-y-3.5">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-footnote font-[400] text-[rgba(255,255,255,0.55)] hover:text-white transition-colors duration-200"
                      
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter + Contact row */}
        <div className="mt-12 pt-8 border-t border-[rgba(255,255,255,0.07)] grid md:grid-cols-2 gap-8 items-center">
          {/* Newsletter */}
          <div>
            <h3
              className="text-subheadline font-bold text-white mb-1"
              
            >
              Đăng ký nhận kiến thức miễn phí
            </h3>
            <p className="text-footnote text-[rgba(255,255,255,0.4)] mb-4 font-[400]" >
              Tips thiết kế, marketing và branding hàng tuần.
            </p>
            {subscribed ? (
              <div className="flex items-center gap-2 text-green-400 text-footnote font-semibold">
                <span>✓</span> Đăng ký thành công! Cảm ơn bạn.
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-2.5" noValidate>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  required
                  className="flex-1 min-w-0 px-4 py-2.5 rounded-[10px] bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] text-white text-footnote placeholder:text-[rgba(255,255,255,0.25)] outline-none focus:border-[#F5A623] focus:ring-1 focus:ring-[rgba(245,166,35,0.3)] transition-all duration-200"
                  
                />
                <button
                  type="submit"
                  className="flex-shrink-0 px-5 py-2.5 rounded-[10px] font-bold text-footnote transition-all duration-200 hover:opacity-90 hover:scale-[1.03] active:scale-[0.97]"
                  style={{ background: "var(--color-idaz-orange)", color: "#1D1D1F", }}
                  aria-label="Đăng ký nhận bản tin"
                >
                  <Send size={16} />
                </button>
              </form>
            )}
          </div>

          {/* Quick contact */}
          <div className="flex flex-col sm:flex-row gap-4 md:justify-end">
            {[
              { icon: Mail, value: "hello@idaz.vn", href: "mailto:hello@idaz.vn" },
              { icon: Phone, value: "031 884 5312", href: "tel:0318845312" },
            ].map(({ icon: Icon, value, href }) => (
              <a
                key={value}
                href={href}
                className="flex items-center gap-2.5 text-footnote text-[rgba(255,255,255,0.55)] hover:text-[#F5A623] transition-colors duration-200 font-[400]"
                
              >
                <Icon size={15} strokeWidth={1.8} className="text-[#F5A623] flex-shrink-0" />
                {value}
              </a>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-6 border-t border-[rgba(255,255,255,0.05)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-footnote text-[rgba(255,255,255,0.3)] font-[400] text-center sm:text-left" >
            © {new Date().getFullYear()} IDAZ Branding. Bảo lưu mọi quyền.
          </p>
          <p className="text-footnote text-[rgba(255,255,255,0.25)] font-[400]" >
            Thiết kế với ❤️ tại Việt Nam
          </p>
        </div>
      </div>
    </footer>
  );
}
