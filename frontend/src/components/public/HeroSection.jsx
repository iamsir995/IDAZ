"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronDown, Award, Clock, Users, Star, ArrowUpRight } from "lucide-react";
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
  { icon: Users, value: 150, suffix: "+", label: "Khách hàng" },
  { icon: Star, value: 98, suffix: "%", label: "Hài lòng" },
];

export default function HeroSection() {
  return (
    <section
      id="home"
      className="relative min-h-screen flex flex-col justify-center overflow-hidden bg-apple-light text-[#1D1D1F] pt-20"
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

      <div className="relative z-10 w-full max-w-7xl mx-auto px-5 md:px-8 py-16">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          
          {/* Left: Text Content */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
              className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#F5A623]/30 bg-[#F5A623]/10 backdrop-blur-md"
            >
              <span className="w-2 h-2 rounded-full bg-[#F5A623] animate-pulse" />
              <span className="text-sm font-semibold text-[#D4891A]">Marketing Agency Top 1 Việt Nam</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
              className="font-display font-black mb-6 tracking-tight leading-[1.1]"
              style={{ fontSize: "clamp(3rem, 6vw, 5rem)" }}
            >
              Thiết kế <span style={{ color: "var(--color-idaz-orange)" }}>Trải nghiệm.</span>
              <br />
              Chốt sale <span className="text-[#1D1D1F]">Tự động.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="text-lg md:text-xl text-[#6E6E73] mb-10 max-w-xl"
            >
              Chúng tôi không chỉ làm marketing, chúng tôi xây dựng cỗ máy bán hàng vô hình giúp doanh nghiệp bạn tăng trưởng gấp 3 lần doanh thu.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="flex flex-wrap gap-4"
            >
              <Link href="/lien-he" className="flex items-center gap-2 text-[#1D1D1F] font-bold py-4 px-8 rounded-full transition-all hover:scale-105 hover:shadow-[0_4px_20px_rgba(245,166,35,0.35)]" style={{ background: "var(--color-idaz-orange)" }}>
                Nhận chiến lược ngay
                <ArrowRight size={20} />
              </Link>
              <Link href="/portfolio" className="flex items-center gap-2 glass-panel hover:bg-white/90 text-[#1D1D1F] font-bold py-4 px-8 rounded-full transition-all shadow-sm">
                Xem Case Study
                <ArrowUpRight size={20} />
              </Link>
            </motion.div>
          </div>

          {/* Right: Bento Box Preview */}
          <motion.div
            initial={{ opacity: 0, x: 40, y: 20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="grid grid-cols-2 gap-4 lg:gap-6"
          >
            {/* Box 1: Growth */}
            <div className="glass-card rounded-3xl p-6 flex flex-col justify-between col-span-2 sm:col-span-1 h-48 hover:border-[#F5A623]/50 transition-colors group cursor-pointer shadow-md">
              <div className="w-12 h-12 rounded-full bg-[#F5A623]/20 flex items-center justify-center text-[#D4891A] mb-4 group-hover:scale-110 transition-transform">
                <ArrowUpRight size={24} />
              </div>
              <div>
                <div className="text-3xl font-black text-[#1D1D1F] mb-1"><CountUp target={300} suffix="%" /></div>
                <div className="text-sm font-medium text-[#6E6E73]">Tăng trưởng Traffic</div>
              </div>
            </div>

            {/* Box 2: Conversion */}
            <div className="glass-card rounded-3xl p-6 flex flex-col justify-between col-span-2 sm:col-span-1 h-48 hover:border-[#F5A623]/50 transition-colors group cursor-pointer shadow-md" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(245,166,35,0.1) 100%)" }}>
              <div className="w-12 h-12 rounded-full bg-[#F5A623]/20 flex items-center justify-center text-[#D4891A] mb-4 group-hover:scale-110 transition-transform">
                <Star size={24} />
              </div>
              <div>
                <div className="text-3xl font-black text-[#1D1D1F] mb-1"><CountUp target={98} suffix="%" /></div>
                <div className="text-sm font-medium text-[#6E6E73]">Tỷ lệ hài lòng</div>
              </div>
            </div>

            {/* Box 3: Realtime Dashboard */}
            <div className="glass-panel rounded-3xl p-6 col-span-2 hover:border-[#1D1D1F]/10 transition-colors group shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <div className="text-sm font-medium text-[#6E6E73] uppercase tracking-wider">Hệ thống Monitoring</div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  <span className="text-xs text-green-600 font-bold">Real-time</span>
                </div>
              </div>
              
              {/* Fake UI bars */}
              <div className="space-y-3">
                {[70, 45, 90].map((w, i) => (
                  <div key={i} className="h-3 w-full bg-[#1D1D1F]/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }} 
                      animate={{ width: `${w}%` }} 
                      transition={{ duration: 1.5, delay: 0.5 + (i * 0.2) }}
                      className={`h-full rounded-full ${i === 0 ? 'bg-[#F5A623]' : i === 1 ? 'bg-[#1D1D1F]' : 'bg-green-500'}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

        </div>
      </div>

    </section>
  );
}
