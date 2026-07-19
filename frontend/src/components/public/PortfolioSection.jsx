"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ExternalLink, Image as ImageIcon } from "lucide-react";
import Link from "next/link";

const ALL_CATEGORIES = ["Tất cả", "Thiết kế Web", "Mobile App", "Branding", "UI/UX Design", "Marketing"];
const ACCENT_COLORS = ["#F5A623", "#3B82F6", "#10B981", "#8B5CF6", "#EF4444", "#F59E0B"];

export default function PortfolioSection({ initialPortfolios = [] }) {
  const [active, setActive] = useState("Tất cả");

  if (!initialPortfolios || initialPortfolios.length === 0) {
    return (
      <section id="portfolio" className="py-20 md:py-28 relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[rgba(0,0,0,0.07)] to-transparent" />
        <div className="max-w-7xl mx-auto px-5 md:px-8 w-full">
          <div className="glass-panel bg-[#F5F5F7]/50 rounded-[24px] p-10 md:p-16 text-center border border-black/5 flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-[16px] bg-white border border-[rgba(0,0,0,0.05)] shadow-sm flex items-center justify-center mb-6">
              <span className="text-[28px] opacity-30">🎨</span>
            </div>
            <h3 className="text-title-2 font-bold text-[#1D1D1F] mb-3">Dự án đang được cập nhật</h3>
            <p className="text-body text-[#6E6E73] max-w-md mx-auto mb-8">
              Chúng tôi đang tổng hợp các case study mới nhất. Quý khách vui lòng quay lại sau hoặc liên hệ trực tiếp để nhận hồ sơ năng lực.
            </p>
            <Link href="/lien-he" className="btn-secondary">
              Nhận Profile Agency
            </Link>
          </div>
        </div>
      </section>
    );
  }
  const filtered =
    active === "Tất cả"
      ? initialPortfolios
      : initialPortfolios.filter((p) => p.category === active);

  return (
    <section id="portfolio" className="py-20 md:py-28 relative">
      {/* Top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[rgba(0,0,0,0.07)] to-transparent" />

      <div className="max-w-7xl mx-auto px-5 md:px-8 w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="badge-pill mb-4 inline-flex">Dự án nổi bật</span>
            <h2
              className="font-display font-black text-[#1D1D1F] tracking-[-0.025em] leading-[1.1]"
              style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
            >
              Portfolio{" "}
              <span style={{ color: "var(--color-idaz-orange)" }}>thực chiến</span>
            </h2>
          </motion.div>
          <Link
            href="/portfolio"
            className="flex items-center gap-2 text-footnote font-bold text-[#6E6E73] hover:text-[#D4891A] transition-colors duration-200 group flex-shrink-0 pb-1"
            
          >
            Xem tất cả
            <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {ALL_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              className={`px-4 py-2 rounded-full text-footnote font-semibold transition-all duration-200 ${
                active === cat
                  ? "bg-[#1D1D1F] text-white shadow-sm"
                  : "bg-transparent text-[#6E6E73] border border-[rgba(0,0,0,0.1)] hover:border-[rgba(0,0,0,0.2)] hover:text-[#1D1D1F]"
              }`}
              
              aria-pressed={active === cat}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        <motion.div layout className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence>
            {filtered.map((project, i) => {
              const color = ACCENT_COLORS[i % ACCENT_COLORS.length];
              return (
                <motion.div
                  key={project._id}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.3 }}
                >
                  <Link href={`/portfolio/${project.slug}`} className="block group h-full">
                    <article className="glass-frosted rounded-[20px] overflow-hidden border border-white hover:shadow-[0_16px_48px_rgba(0,0,0,0.07)] hover:-translate-y-1 transition-all duration-400 h-full flex flex-col">
                      {/* Image */}
                      <div className="relative h-[200px] bg-[#F5F5F7] overflow-hidden">
                        {project.coverImage ? (
                          <img
                            src={project.coverImage.startsWith('/') ? (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000') + project.coverImage : project.coverImage}
                            alt={project.title}
                            className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${color}15, ${color}30)` }}>
                            <ImageIcon size={36} style={{ color: `${color}60` }} />
                          </div>
                        )}

                        {/* Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(0,0,0,0.7)] via-[rgba(0,0,0,0.1)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400" />

                        {/* Category badge */}
                        <span className="absolute top-3 left-3 text-caption-2 font-bold px-3 py-1 rounded-full bg-white/90 text-[#424245] backdrop-blur-sm shadow-sm">
                          {project.category}
                        </span>

                        {/* Hover link icon */}
                        <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0 shadow-md">
                          <ExternalLink size={14} style={{ color: "#1D1D1F" }} />
                        </div>

                        {/* Title on hover */}
                        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-400">
                          <h3 className="text-white font-display font-black text-callout leading-tight line-clamp-2">
                            {project.title}
                          </h3>
                        </div>
                      </div>

                      {/* Card body */}
                      <div className="p-5 flex flex-col flex-1">
                        <h3 className="font-display font-[800] text-[#1D1D1F] text-subheadline leading-snug tracking-tight mb-2 line-clamp-1">
                          {project.title}
                        </h3>
                        <p className="text-footnote text-[#86868B] leading-relaxed line-clamp-2 flex-1 mb-4" >
                          {project.description}
                        </p>
                        {project.tags && project.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {project.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="text-caption-2 font-semibold px-2.5 py-1 rounded-full"
                                style={{ background: `${color}12`, color }}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </article>
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
