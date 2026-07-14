"use client";
import { motion } from "framer-motion";
import { ArrowRight, Clock, Tag } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const CATEGORY_COLORS = {
  "Thiết kế": { bg: "rgba(245,166,35,0.1)", text: "#D4891A" },
  "Marketing": { bg: "rgba(59,130,246,0.1)", text: "#2563EB" },
  "Branding": { bg: "rgba(139,92,246,0.1)", text: "#7C3AED" },
  "UI/UX": { bg: "rgba(16,185,129,0.1)", text: "#059669" },
  "Kinh doanh": { bg: "rgba(236,72,153,0.1)", text: "#DB2777" },
  "default": { bg: "rgba(245,166,35,0.1)", text: "#D4891A" },
};

function getCategoryStyle(tag) {
  return CATEGORY_COLORS[tag] || CATEGORY_COLORS["default"];
}

function formatDate(dateStr) {
  try {
    return new Date(dateStr).toLocaleDateString("vi-VN", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return "";
  }
}

function estimateReadTime(content = "") {
  const words = content.replace(/<[^>]*>/g, "").split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

function PostImage({ src, alt, className }) {
  if (!src) {
    return (
      <div className={`${className} bg-gradient-to-br from-[#FEF3E2] to-[#FDE8B4] flex items-center justify-center`}>
        <span className="font-black text-4xl text-[#F5A623]/30" >IDAZ</span>
      </div>
    );
  }
  return <img src={src} alt={alt} className={`${className} object-cover`} loading="lazy" />;
}

export default function BlogSection({ posts = [] }) {
  if (!posts || posts.length === 0) {
    return (
      <section className="py-20 md:py-28 bg-white relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[rgba(0,0,0,0.08)] to-transparent" />
        <div className="max-w-7xl mx-auto px-5 md:px-8 w-full">
          <div className="glass-panel bg-[#F5F5F7]/50 rounded-[24px] p-10 md:p-16 text-center border border-black/5 flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-[16px] bg-white border border-[rgba(0,0,0,0.05)] shadow-sm flex items-center justify-center mb-6">
              <span className="text-[28px] opacity-30">📰</span>
            </div>
            <h3 className="text-title-2 font-bold text-[#1D1D1F] mb-3">Chuyên mục đang hoàn thiện</h3>
            <p className="text-body text-[#6E6E73] max-w-md mx-auto mb-8">
              Chúng tôi đang chuẩn bị những bài viết và kiến thức mới nhất về thương hiệu để gửi đến bạn.
            </p>
            <Link href="/" className="btn-secondary">
              Quay lại trang chủ
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const [featured, ...secondaryPosts] = posts.slice(0, 5);
  const secondary = secondaryPosts.slice(0, 4);

  return (
    <section className="py-20 md:py-28 bg-white relative">
      {/* Top border accent */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[rgba(0,0,0,0.08)] to-transparent" />

      <div className="max-w-7xl mx-auto px-5 md:px-8 w-full">

        {/* Magazine Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-10 pb-8 border-b-2 border-[#1D1D1F]"
        >
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-6 h-6 rounded-sm flex items-center justify-center" style={{ background: "var(--color-idaz-orange)" }}>
                <span className="text-caption-2 font-black text-white">I</span>
              </div>
              <span className="text-caption-2 font-extrabold tracking-[0.15em] uppercase text-[#86868B]" >
                IDAZ MAGAZINE
              </span>
            </div>
            <h2 className="font-display font-black text-[#1D1D1F] tracking-[-0.025em] leading-[1.0]"
              style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
              Kiến thức &{" "}
              <span style={{ color: "var(--color-idaz-orange)" }}>Insight</span>
            </h2>
          </div>

          <div className="flex items-center gap-5 pb-1">
            <span className="text-footnote font-medium text-[#86868B]" >
              {posts.length} bài viết
            </span>
            <Link
              href="/blog"
              className="flex items-center gap-2 text-footnote font-bold text-[#1D1D1F] hover:text-[#D4891A] transition-colors group"
              
            >
              Xem tất cả
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </motion.div>

        {/* Main magazine grid */}
        <div className="grid lg:grid-cols-[1.6fr_1fr] gap-8 mb-10">

          {/* Featured article — large left */}
          {featured && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            >
              <Link href={`/blog/${featured.slug}`} className="block group h-full">
                <article className="h-full flex flex-col">
                  {/* Featured image */}
                  <div className="relative rounded-[20px] overflow-hidden mb-6 aspect-[16/9]">
                    <PostImage
                      src={featured.coverImage}
                      alt={featured.title}
                      className="w-full h-full transition-transform duration-700 group-hover:scale-[1.03]"
                    />
                    {/* Category overlay */}
                    {featured.tags?.[0] && (
                      <div className="absolute top-4 left-4">
                        <span
                          className="text-caption-1 font-bold px-3 py-1.5 rounded-full glass-panel border border-white/60"
                          style={getCategoryStyle(featured.tags[0])}
                        >
                          {featured.tags[0]}
                        </span>
                      </div>
                    )}
                    {/* Featured badge */}
                    <div className="absolute top-4 right-4 glass-panel px-3 py-1.5 rounded-full border border-white/60">
                      <span className="text-caption-2 font-bold text-[#1D1D1F] uppercase tracking-wider">Nổi bật</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    {/* Meta */}
                    <div className="flex items-center gap-4 mb-4">
                      <span className="text-footnote font-medium text-[#86868B]" >
                        {formatDate(featured.createdAt)}
                      </span>
                      <span className="text-[#D2D2D7]">·</span>
                      <div className="flex items-center gap-1.5 text-footnote font-medium text-[#86868B]">
                        <Clock size={13} strokeWidth={2} />
                        {estimateReadTime(featured.content || featured.excerpt)} phút đọc
                      </div>
                    </div>

                    {/* Title */}
                    <h3
                      className="font-display font-black text-[#1D1D1F] mb-3 leading-tight tracking-tight group-hover:text-[#D4891A] transition-colors duration-300"
                      style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)" }}
                    >
                      {featured.title}
                    </h3>

                    {/* Excerpt */}
                    <p className="text-subheadline text-[#6E6E73] leading-relaxed mb-6 line-clamp-3"
                      >
                      {featured.excerpt || (featured.content || "").replace(/<[^>]*>/g, "").substring(0, 180) + "..."}
                    </p>

                    {/* Read more */}
                    <div className="flex items-center gap-2 text-footnote font-bold text-[#1D1D1F] group-hover:gap-3 transition-all duration-300"
                      >
                      Đọc bài viết
                      <ArrowRight size={15} />
                    </div>
                  </div>
                </article>
              </Link>
            </motion.div>
          )}

          {/* Right column — 2 secondary posts stacked */}
          <div className="flex flex-col gap-6">
            {secondary.slice(0, 2).map((post, i) => (
              <motion.div
                key={post.slug}
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: [0.4, 0, 0.2, 1] }}
                className="flex-1"
              >
                <Link href={`/blog/${post.slug}`} className="block group h-full">
                  <article className="flex gap-5 h-full border-b border-[rgba(0,0,0,0.06)] pb-6 last:border-0 last:pb-0">
                    {/* Thumbnail */}
                    <div className="relative w-[120px] h-[90px] md:w-[140px] md:h-[105px] rounded-[14px] overflow-hidden flex-shrink-0">
                      <PostImage
                        src={post.coverImage}
                        alt={post.title}
                        className="w-full h-full transition-transform duration-500 group-hover:scale-[1.06]"
                      />
                    </div>

                    {/* Text */}
                    <div className="flex flex-col justify-between flex-1 min-w-0">
                      {/* Tag */}
                      {post.tags?.[0] && (
                        <span
                          className="text-caption-2 font-bold uppercase tracking-wider mb-2 inline-block"
                          style={getCategoryStyle(post.tags[0])}
                        >
                          {post.tags[0]}
                        </span>
                      )}

                      <h3 className="font-display font-[800] text-[#1D1D1F] text-callout leading-snug tracking-tight group-hover:text-[#D4891A] transition-colors duration-200 line-clamp-2 mb-2">
                        {post.title}
                      </h3>

                      <div className="flex items-center gap-3 text-caption-1 font-medium text-[#86868B]" >
                        <span>{formatDate(post.createdAt)}</span>
                        <span>·</span>
                        <span>{estimateReadTime(post.content || post.excerpt)} phút</span>
                      </div>
                    </div>
                  </article>
                </Link>
              </motion.div>
            ))}

            {/* More posts link */}
            <Link
              href="/blog"
              className="flex items-center justify-between p-4 rounded-[14px] border border-[rgba(0,0,0,0.08)] hover:border-[#F5A623] hover:bg-[rgba(245,166,35,0.04)] transition-all duration-300 group"
            >
              <span className="text-footnote font-semibold text-[#424245] group-hover:text-[#D4891A] transition-colors" >
                Xem thêm {Math.max(0, posts.length - 3)} bài viết khác
              </span>
              <ArrowRight size={16} className="text-[#86868B] group-hover:text-[#D4891A] transition-colors" />
            </Link>
          </div>
        </div>

        {/* Bottom row — smaller articles grid */}
        {secondary.slice(2, 4).length > 0 && (
          <>
            <div className="apple-divider mb-10" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-6">
              {secondary.slice(2, 4).map((post, i) => (
                <motion.div
                  key={post.slug}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  <Link href={`/blog/${post.slug}`} className="block group">
                    <article className="flex gap-4 items-start">
                      <div className="relative w-[80px] h-[60px] rounded-[10px] overflow-hidden flex-shrink-0">
                        <PostImage
                          src={post.coverImage}
                          alt={post.title}
                          className="w-full h-full transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        {post.tags?.[0] && (
                          <span
                            className="text-caption-2 font-bold uppercase tracking-wider mb-1.5 inline-block"
                            style={getCategoryStyle(post.tags[0])}
                          >
                            {post.tags[0]}
                          </span>
                        )}
                        <h3 className="font-display font-[700] text-footnote text-[#1D1D1F] leading-snug tracking-tight group-hover:text-[#D4891A] transition-colors line-clamp-2 mb-1">
                          {post.title}
                        </h3>
                        <span className="text-caption-1 font-medium text-[#86868B]">{formatDate(post.createdAt)}</span>
                      </div>
                    </article>
                  </Link>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
