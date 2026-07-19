"use client";
import { motion } from "framer-motion";
import { PenTool, Globe, Megaphone, ArrowRight, CheckCircle2, MonitorPlay, Palette, Code, Smartphone, Briefcase, Camera, Video, MessageSquare } from "lucide-react";
import Link from "next/link";

const iconMap = {
  PenTool, Globe, Megaphone, MonitorPlay, Palette, Code, Smartphone, Briefcase, Camera, Video, MessageSquare
};

const SERVICE_THEMES = [
  {
    accent: "#F5A623",
    accentLight: "rgba(245,166,35,0.08)",
    accentBorder: "rgba(245,166,35,0.2)",
    gradient: "from-[#FEF3E2] to-[#FDE8B4]",
    number: "01",
  },
  {
    accent: "#3B82F6",
    accentLight: "rgba(59,130,246,0.08)",
    accentBorder: "rgba(59,130,246,0.2)",
    gradient: "from-[#EFF6FF] to-[#DBEAFE]",
    number: "02",
  },
  {
    accent: "#8B5CF6",
    accentLight: "rgba(139,92,246,0.08)",
    accentBorder: "rgba(139,92,246,0.2)",
    gradient: "from-[#F5F3FF] to-[#EDE9FE]",
    number: "03",
  },
];

export default function ServicesSection({ services = [] }) {
  if (!services || services.length === 0) {
    return (
      <section id="services" className="py-20 md:py-28 bg-[#F5F5F7] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-5 md:px-8 w-full">
          <div className="glass-panel rounded-[24px] p-10 md:p-16 text-center border border-white flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-[16px] bg-[#F5F5F7] border border-[rgba(0,0,0,0.05)] flex items-center justify-center mb-6">
              <span className="text-[28px] opacity-20">⚙️</span>
            </div>
            <h3 className="text-title-2 font-bold text-[#1D1D1F] mb-3">Dịch vụ đang được cập nhật</h3>
            <p className="text-body text-[#6E6E73] max-w-md mx-auto mb-8">
              Hệ thống đang đồng bộ dữ liệu dịch vụ mới nhất. Quý khách vui lòng liên hệ trực tiếp để nhận tư vấn.
            </p>
            <Link href="/lien-he" className="btn-primary">
              Liên hệ ngay
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const [featured, ...rest] = services.slice(0, 3);
  const featuredTheme = SERVICE_THEMES[0];
  const FeaturedIcon = iconMap[featured?.icon] || PenTool;

  return (
    <section id="services" className="py-20 md:py-28 relative overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full opacity-30 pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(245,166,35,0.1) 0%, transparent 70%)" }}
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-5 md:px-8 w-full">
        {/* Section Header */}
        <div className="mb-14 md:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex flex-col sm:flex-row sm:items-end justify-between gap-6"
          >
            <div>
              <span className="badge-pill mb-4 inline-flex">Dịch vụ cốt lõi</span>
              <h2 className="font-display font-black text-[#1D1D1F] tracking-[-0.025em] leading-[1.1]"
                style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
                Giải pháp thương hiệu{" "}
                <span style={{ color: "var(--color-idaz-orange)" }}>toàn diện</span>
              </h2>
            </div>
            <Link
              href="/dich-vu"
              className="flex items-center gap-2 text-footnote font-bold text-[#6E6E73] hover:text-[#D4891A] transition-colors duration-200 group flex-shrink-0 pb-1"
              
            >
              Xem tất cả dịch vụ
              <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </div>

        {/* Services Layout: Featured (large) + 2 smaller */}
        <div className="grid lg:grid-cols-[1fr_1fr] gap-6">

          {/* Featured Card — Left, full height */}
          {featured && (
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            >
              <Link href={`/dich-vu/${featured.slug}`} className="block h-full group">
                <article className="glass-frosted rounded-[24px] p-8 md:p-10 h-full flex flex-col border border-white hover:shadow-[0_20px_60px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-400">
                  {/* Number + Icon */}
                  <div className="flex items-start justify-between mb-8">
                    <span
                      className="text-[52px] font-black leading-none opacity-[0.08] select-none"
                      style={{  color: featuredTheme.accent }}
                    >
                      {featuredTheme.number}
                    </span>
                    <div
                      className="w-14 h-14 rounded-[16px] flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                      style={{ background: featuredTheme.accentLight, border: `1px solid ${featuredTheme.accentBorder}` }}
                    >
                      <FeaturedIcon size={28} style={{ color: featuredTheme.accent }} strokeWidth={1.5} />
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="font-display font-black text-[#1D1D1F] mb-4 tracking-tight leading-tight"
                    style={{ fontSize: "clamp(1.4rem, 2.5vw, 1.8rem)" }}>
                    {featured.title}
                  </h3>
                  <p className="text-subheadline text-[#6E6E73] leading-relaxed flex-1 mb-8"
                    >
                    {featured.description || featured.desc}
                  </p>

                  {/* Feature list */}
                  {featured.features && featured.features.length > 0 && (
                    <div className="space-y-3 mb-8">
                      {featured.features.slice(0, 4).map((feature) => (
                        <div key={feature} className="flex items-center gap-3">
                          <CheckCircle2 size={16} style={{ color: featuredTheme.accent }} strokeWidth={2} className="flex-shrink-0" />
                          <span className="text-footnote font-medium text-[#424245]" >
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Gradient preview strip */}
                  <div className={`rounded-[14px] h-2 mb-6 bg-gradient-to-r ${featuredTheme.gradient}`} />

                  {/* CTA */}
                  <div className="flex items-center gap-2 text-subheadline font-bold group-hover:gap-3 transition-all duration-300"
                    style={{ color: featuredTheme.accent, }}>
                    Tìm hiểu thêm
                    <ArrowRight size={16} />
                  </div>
                </article>
              </Link>
            </motion.div>
          )}

          {/* Right column — 2 stacked cards */}
          <div className="flex flex-col gap-6">
            {rest.slice(0, 2).map((svc, i) => {
              const theme = SERVICE_THEMES[i + 1];
              const IconComponent = iconMap[svc.icon] || Globe;

              return (
                <motion.div
                  key={svc.slug || svc.title}
                  initial={{ opacity: 0, y: 32 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.6, delay: (i + 1) * 0.12, ease: [0.4, 0, 0.2, 1] }}
                  className="flex-1"
                >
                  <Link href={`/dich-vu/${svc.slug}`} className="block h-full group">
                    <article className="glass-frosted rounded-[24px] p-7 md:p-8 h-full flex flex-col border border-white hover:shadow-[0_16px_48px_rgba(0,0,0,0.07)] hover:-translate-y-1 transition-all duration-400">
                      {/* Number + Icon */}
                      <div className="flex items-start justify-between mb-6">
                        <span
                          className="text-[40px] font-black leading-none opacity-[0.07] select-none"
                          style={{  color: theme.accent }}
                        >
                          {theme.number}
                        </span>
                        <div
                          className="w-12 h-12 rounded-[14px] flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                          style={{ background: theme.accentLight, border: `1px solid ${theme.accentBorder}` }}
                        >
                          <IconComponent size={22} style={{ color: theme.accent }} strokeWidth={1.5} />
                        </div>
                      </div>

                      {/* Content */}
                      <h3 className="font-display font-black text-[#1D1D1F] mb-3 tracking-tight text-[1.2rem] leading-tight">
                        {svc.title}
                      </h3>
                      <p className="text-footnote text-[#6E6E73] leading-relaxed flex-1 mb-6"
                        >
                        {svc.description || svc.desc}
                      </p>

                      {/* Feature tags */}
                      {svc.features && svc.features.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-5">
                          {svc.features.slice(0, 2).map((f) => (
                            <span
                              key={f}
                              className="text-caption-1 font-semibold px-3 py-1 rounded-full"
                              style={{ background: theme.accentLight, color: theme.accent, }}
                            >
                              {f}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* CTA */}
                      <div className="flex items-center gap-2 text-footnote font-bold group-hover:gap-3 transition-all duration-300"
                        style={{ color: theme.accent, }}>
                        Tìm hiểu thêm
                        <ArrowRight size={15} />
                      </div>
                    </article>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 glass-panel rounded-[20px] px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-5 border border-white/80"
        >
          <div>
            <div className="font-display font-black text-[#1D1D1F] text-headline mb-1">Không tìm thấy dịch vụ phù hợp?</div>
            <div className="text-footnote text-[#86868B]" >
              Chúng tôi thiết kế giải pháp tùy chỉnh theo nhu cầu của bạn.
            </div>
          </div>
          <Link href="/lien-he" className="btn-primary flex-shrink-0">
            Tư vấn miễn phí
            <ArrowRight size={16} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
