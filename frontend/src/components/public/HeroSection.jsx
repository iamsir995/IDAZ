"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronDown, Award, Clock, Users, Star } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

function CountUp({ target, suffix = "", duration = 1800 }) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStarted(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    let startTime = null;
    const step = (ts) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [started, target, duration]);

  return <span ref={ref} className="tabular-nums">{count}{suffix}</span>;
}

const stats = [
  { icon: Award, value: 200, suffix: "+", label: "Dự án hoàn thành" },
  { icon: Clock, value: 5, suffix: "+", label: "Năm kinh nghiệm" },
  { icon: Users, value: 150, suffix: "+", label: "Khách hàng tin tưởng" },
  { icon: Star, value: 98, suffix: "%", label: "Tỷ lệ hài lòng" },
];

export default function HeroSection() {
  return (
    <section
      id="home"
      className="relative min-h-[calc(100vh-60px)] flex flex-col overflow-hidden bg-apple-light"
    >
      {/* Subtle warm blobs — light tones only */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div
          className="absolute top-[-15%] right-[-5%] w-[600px] h-[600px] rounded-full opacity-40 animate-blob"
          style={{ background: "radial-gradient(circle, rgba(245,166,35,0.18) 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-[-10%] left-[-8%] w-[500px] h-[500px] rounded-full opacity-30 animate-blob animation-delay-4000"
          style={{ background: "radial-gradient(circle, rgba(255,200,80,0.15) 0%, transparent 70%)" }}
        />
        <div
          className="absolute top-[40%] left-[40%] w-[400px] h-[400px] rounded-full opacity-20 animate-blob animation-delay-2000"
          style={{ background: "radial-gradient(circle, rgba(245,166,35,0.12) 0%, transparent 70%)" }}
        />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: `linear-gradient(#1D1D1F 1px, transparent 1px), linear-gradient(90deg, #1D1D1F 1px, transparent 1px)`,
          backgroundSize: "64px 64px",
        }}
        aria-hidden="true"
      />

      {/* Hero Content */}
      <div className="relative z-10 flex-1 flex flex-col justify-center">
        <div className="max-w-7xl mx-auto px-5 md:px-8 w-full py-16 md:py-20">
          <div className="grid lg:grid-cols-[1fr_420px] xl:grid-cols-[1fr_480px] gap-12 lg:gap-16 items-center">

            {/* Left — Text content */}
            <div>
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                className="mb-6"
              >
                <span className="badge-pill">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F5A623] animate-pulse" />
                  Thương hiệu chuyên nghiệp tại Việt Nam
                </span>
              </motion.div>

              {/* Heading */}
              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
                className="font-display font-black text-[#1D1D1F] mb-6 tracking-[-0.03em] leading-[1.0]"
                style={{ fontSize: "clamp(2.8rem, 6vw, 5rem)" }}
              >
                Nâng Tầm{" "}
                <span style={{ color: "var(--color-idaz-orange)" }}>
                  Thương Hiệu
                </span>
                <br />
                <span className="text-[#424245]">Doanh Nghiệp Việt</span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
                className="text-title-3 text-[#6E6E73] mb-10 max-w-xl"
                
              >
                Từ logo đến chiến lược marketing — IDAZ đồng hành cùng doanh nghiệp xây dựng hình ảnh chuyên nghiệp, nhất quán trên mọi nền tảng.
              </motion.p>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
                className="flex flex-wrap gap-4"
              >
                <Link href="/lien-he" className="btn-primary mobile-full-btn">
                  Nhận tư vấn miễn phí
                  <ArrowRight size={18} strokeWidth={2.5} />
                </Link>
                <Link href="/portfolio" className="btn-secondary mobile-full-btn">
                  Xem dự án thực tế
                </Link>
              </motion.div>

              {/* Trust indicators */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="flex flex-wrap items-center gap-6 mt-10 pt-10 border-t border-[rgba(0,0,0,0.07)]"
              >
                <div className="flex -space-x-2">
                  {["#F5A623", "#3B82F6", "#10B981", "#8B5CF6"].map((color, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white text-[10px] font-bold"
                      style={{ background: color }}
                    >
                      {String.fromCharCode(65 + i)}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-0.5">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#F5A623">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    ))}
                  </div>
                  <p className="text-footnote font-medium text-[#86868B]" >
                    <strong className="text-[#1D1D1F]">150+ khách hàng</strong> tin tưởng
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Right — Floating showcase card */}
            <motion.div
              initial={{ opacity: 0, x: 40, y: 20 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="hidden lg:block"
            >
              <div className="glass-panel rounded-[28px] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.1)]">
                {/* Card header */}
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <div className="text-footnote font-semibold text-[#86868B] uppercase tracking-wider mb-1">Dự án nổi bật</div>
                    <div className="text-headline font-extrabold text-[#1D1D1F]" >IDAZ Portfolio 2024</div>
                  </div>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(245,166,35,0.12)" }}>
                    <Award size={20} style={{ color: "var(--color-idaz-orange)" }} />
                  </div>
                </div>

                {/* Preview placeholder — gradient visual */}
                <div className="rounded-[18px] h-[200px] mb-5 overflow-hidden relative"
                  style={{ background: "linear-gradient(135deg, #FEF3E2 0%, #FDE8B4 50%, #F5A623 100%)" }}
                >
                  {/* Decorative elements */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: "rgba(255,255,255,0.5)", backdropFilter: "blur(10px)" }}>
                        <span className="font-black text-2xl text-[#1D1D1F]" >I</span>
                      </div>
                      <span className="text-[13px] font-[700] text-[#1D1D1F]/60 uppercase tracking-wider">IDAZ Branding</span>
                    </div>
                  </div>
                  {/* Floating glass badge */}
                  <div className="absolute top-3 right-3 glass-panel rounded-full px-3 py-1.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <span className="text-[11px] font-[600] text-[#1D1D1F]">Hoàn thành</span>
                  </div>
                </div>

                {/* Stats mini */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: "200+", label: "Dự án" },
                    { value: "5+", label: "Năm" },
                    { value: "98%", label: "Hài lòng" },
                  ].map(({ value, label }) => (
                    <div key={label} className="glass-frosted rounded-[12px] p-3 text-center">
                      <div className="text-title-3 font-black text-[#1D1D1F]" >{value}</div>
                      <div className="text-caption-2 font-medium text-[#86868B] mt-0.5">{label}</div>
                    </div>
                  ))}
                </div>

                {/* CTA in card */}
                <Link
                  href="/portfolio"
                  className="flex items-center justify-center gap-2 mt-4 py-3.5 rounded-full text-[14px] font-[700] transition-all duration-300 hover:scale-[1.02]"
                  style={{ background: "var(--color-idaz-orange)", color: "#1D1D1F", }}
                >
                  Khám phá portfolio
                  <ArrowRight size={15} />
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Stats bar — bottom of hero */}
      <div className="relative z-10 max-w-7xl mx-auto px-5 md:px-8 w-full pb-10 md:pb-14">
        <div className="glass-panel rounded-[20px] px-6 py-5 border border-white/80">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-6 divide-y md:divide-y-0 md:divide-x divide-[rgba(0,0,0,0.06)]">
            {stats.map(({ icon: Icon, value, suffix, label }, i) => (
              <div key={label} className={`flex items-center gap-4 ${i > 0 && i < 2 ? "pt-5 md:pt-0" : ""} ${i >= 2 ? "pt-5 md:pt-0" : ""} md:px-6 first:pl-0 last:pr-0`}>
                <div
                  className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(245,166,35,0.1)" }}
                >
                  <Icon size={20} style={{ color: "var(--color-idaz-orange)" }} strokeWidth={1.8} />
                </div>
                <div>
                  <div className="text-title-2 font-black text-[#1D1D1F] leading-none" >
                    <CountUp target={value} suffix={suffix} />
                  </div>
                  <div className="text-caption-1 font-medium text-[#86868B] mt-1">{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <button
        className="hidden md:flex absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex-col items-center gap-1.5 text-[#86868B] hover:text-[#F5A623] transition-colors duration-300 group"
        onClick={() => document.querySelector("#services")?.scrollIntoView({ behavior: "smooth" })}
        aria-label="Cuộn xuống xem dịch vụ"
      >
        <span className="text-[10px] tracking-[0.15em] uppercase font-[600]">Khám phá</span>
        <ChevronDown size={18} className="animate-bounce" strokeWidth={2.5} />
      </button>
    </section>
  );
}
