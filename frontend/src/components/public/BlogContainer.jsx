"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, ChevronRight, Tag, Clock, TrendingUp, Mail, Star, PlayCircle } from "lucide-react";
import { motion } from "framer-motion";

const CATEGORIES = [
  "Tất cả",
  "Thiết kế", 
  "Marketing", 
  "Branding", 
  "UI/UX", 
  "Kinh doanh",
  "Công nghệ"
];

function formatDate(dateStr) {
  try {
    return new Date(dateStr).toLocaleDateString("vi-VN", { day: "numeric", month: "short", year: "numeric" });
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
  const finalSrc = src.startsWith('/') ? (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000') + src : src;
  return <img src={finalSrc} alt={alt} className={`${className} object-cover`} loading="lazy" />;
}

// Generate fallback mock posts if the API doesn't return enough posts
function generateMockPosts(count, startIndex) {
  const mocks = [];
  const tags = ["Branding", "UI/UX", "Marketing", "Thiết kế"];
  const titles = [
    "Xu hướng thiết kế thương hiệu bùng nổ năm 2026",
    "Tối ưu hóa UI/UX: Bí quyết giữ chân khách hàng trên App",
    "Storytelling: Xây dựng câu chuyện thương hiệu truyền cảm hứng",
    "Tương lai của Marketing dựa trên dữ liệu và AI",
    "Case Study: Hành trình tái định vị thương hiệu thành công"
  ];
  for (let i = 0; i < count; i++) {
    mocks.push({
      _id: `mock-${startIndex + i}`,
      slug: `mock-post-${startIndex + i}`,
      title: titles[i % titles.length] + ` - Phần ${Math.floor(i / titles.length) + 1}`,
      excerpt: "Trong bài viết này, chúng tôi sẽ đi sâu vào các yếu tố quan trọng nhất giúp doanh nghiệp của bạn bứt phá trong kỷ nguyên số hóa...",
      coverImage: `https://images.unsplash.com/photo-${1500000000000 + i * 10000}?w=800&auto=format&fit=crop&q=60`, // Just a dummy random looking string, actual image won't load but it will fallback to broken image icon or alt text. Actually let's use stable unsplash source.
      tags: [tags[i % tags.length]],
      createdAt: new Date(Date.now() - i * 86400000).toISOString()
    });
  }
  // Better reliable unsplash placeholders:
  const images = [
    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
    "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&q=80",
    "https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?w=800&q=80",
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
    "https://images.unsplash.com/photo-1558655146-d09347e92766?w=800&q=80"
  ];
  mocks.forEach((m, i) => m.coverImage = images[i % images.length]);
  return mocks;
}


export default function BlogContainer({ initialPosts = [] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");

  // Đảm bảo luôn có ít nhất 12 bài viết để test layout đa dạng
  const postsToUse = initialPosts.length >= 12 ? initialPosts : [...initialPosts, ...generateMockPosts(12 - initialPosts.length, initialPosts.length)];

  const filteredPosts = postsToUse.filter((post) => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (post.excerpt && post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === "Tất cả" || 
                            (post.tags && post.tags.includes(selectedCategory));

    return matchesSearch && matchesCategory;
  });

  const popularPosts = postsToUse.slice(0, 4);

  // Layout Logic
  const isDefaultView = searchTerm === "" && selectedCategory === "Tất cả";
  
  // Band 1: Featured (3 posts)
  const featuredHero = isDefaultView && filteredPosts.length > 0 ? filteredPosts[0] : null;
  const featuredSide = isDefaultView ? filteredPosts.slice(1, 3) : [];
  
  // Band 2: Editor's Picks (3 posts)
  const editorsPicks = isDefaultView ? filteredPosts.slice(3, 6) : [];

  // Band 3: Main Feed Grid (Remaining posts)
  const gridPosts = isDefaultView ? filteredPosts.slice(6) : filteredPosts;

  return (
    <div className="bg-[#F5F5F7]">
      
      {/* ---------------------------------------------------------
          BAND 1: FEATURED HIGHLIGHTS (1 Large + 2 Small) 
          --------------------------------------------------------- */}
      {isDefaultView && featuredHero && (
        <section className="pt-12 pb-16 px-6 md:px-12 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-3 mb-8">
            <span className="w-2 h-2 rounded-full bg-idaz-orange animate-pulse" />
            <h2 className="text-xl font-black font-montserrat tracking-wide uppercase text-idaz-black">Tiêu điểm hôm nay</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6">
            
            {/* Main Featured */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="relative group rounded-[32px] overflow-hidden bg-white shadow-sm hover:shadow-2xl transition-all duration-500 h-[500px]"
            >
              <Link href={`/blog/${featuredHero.slug}`} className="block w-full h-full relative">
                <PostImage 
                  src={featuredHero.coverImage} 
                  alt={featuredHero.title} 
                  className="w-full h-full transform transition-transform duration-700 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none" />
                
                <div className="absolute bottom-0 left-0 p-8 md:p-12 w-full">
                  {featuredHero.tags?.[0] && (
                    <span className="inline-block px-4 py-1.5 mb-4 rounded-full bg-idaz-orange text-white text-xs font-bold tracking-widest uppercase">
                      {featuredHero.tags[0]}
                    </span>
                  )}
                  <h3 className="text-3xl md:text-4xl font-black font-montserrat text-white leading-tight mb-4 group-hover:text-idaz-orange transition-colors line-clamp-3">
                    {featuredHero.title}
                  </h3>
                  <div className="flex items-center gap-4 text-white/80 text-sm font-medium">
                    <span className="flex items-center gap-1.5"><Clock size={16} /> {formatDate(featuredHero.createdAt)}</span>
                    <span className="w-1 h-1 bg-white/50 rounded-full" />
                    <span>{estimateReadTime(featuredHero.excerpt)} phút đọc</span>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Side Featured (2 stacked) */}
            <div className="flex flex-col gap-6">
              {featuredSide.map((post, idx) => (
                <motion.div 
                  key={post._id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 + idx * 0.1 }}
                  className="flex-1 group relative rounded-[28px] overflow-hidden bg-white shadow-sm hover:shadow-xl transition-all duration-300"
                >
                  <Link href={`/blog/${post.slug}`} className="block w-full h-full relative">
                    <PostImage 
                      src={post.coverImage} 
                      alt={post.title} 
                      className="w-full h-full transform transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10 pointer-events-none" />
                    
                    <div className="absolute bottom-0 left-0 p-6 w-full">
                      {post.tags?.[0] && (
                        <span className="inline-block px-3 py-1 mb-3 rounded-full bg-white/20 backdrop-blur-md text-white text-[10px] font-bold tracking-wider uppercase border border-white/20">
                          {post.tags[0]}
                        </span>
                      )}
                      <h3 className="text-lg md:text-xl font-black font-montserrat text-white leading-snug mb-2 group-hover:text-idaz-orange transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                      <div className="flex items-center gap-2 text-white/70 text-xs font-medium">
                        <span>{formatDate(post.createdAt)}</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

          </div>
        </section>
      )}

      {/* ---------------------------------------------------------
          BAND 2: EDITOR'S PICKS (Dark Mode Section)
          --------------------------------------------------------- */}
      {isDefaultView && editorsPicks.length > 0 && (
        <section className="py-16 md:py-24 bg-idaz-black relative overflow-hidden">
          {/* Subtle glow effect */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-idaz-orange/10 blur-[120px] rounded-full pointer-events-none" />
          
          <div className="max-w-7xl mx-auto px-6 md:px-12 w-full relative z-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
              <div>
                <h2 className="text-3xl md:text-4xl font-black font-montserrat text-white mb-3 flex items-center gap-3">
                  <Star className="text-idaz-orange" fill="currentColor" size={32} /> Lựa chọn của Biên tập viên
                </h2>
                <p className="text-white/60">Những bài viết chuyên sâu và được đánh giá cao nhất tuần qua.</p>
              </div>
              <Link href="#" className="hidden md:flex items-center gap-2 text-idaz-orange font-bold hover:text-white transition-colors">
                Xem toàn bộ <ChevronRight size={18} />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {editorsPicks.map((post, idx) => (
                <motion.article 
                  key={post._id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="group bg-white/5 backdrop-blur-xl border border-white/10 rounded-[24px] overflow-hidden hover:bg-white/10 transition-colors flex flex-col h-full"
                >
                  <Link href={`/blog/${post.slug}`} className="block relative aspect-video overflow-hidden">
                    <PostImage 
                      src={post.coverImage} 
                      alt={post.title} 
                      className="w-full h-full transform transition-transform duration-500 group-hover:scale-105 opacity-80 group-hover:opacity-100"
                    />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-idaz-orange/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-50 group-hover:scale-100 transition-all duration-300">
                       <PlayCircle size={24} />
                    </div>
                  </Link>
                  <div className="p-6 md:p-8 flex flex-col flex-1">
                    {post.tags?.[0] && (
                      <span className="text-idaz-orange text-xs font-bold uppercase tracking-widest mb-3 inline-block">
                        {post.tags[0]}
                      </span>
                    )}
                    <Link href={`/blog/${post.slug}`}>
                      <h3 className="text-xl font-bold font-montserrat text-white leading-tight mb-4 group-hover:text-idaz-orange transition-colors line-clamp-3">
                        {post.title}
                      </h3>
                    </Link>
                    <div className="mt-auto flex items-center justify-between text-white/50 text-xs font-medium">
                      <span>{formatDate(post.createdAt)}</span>
                      <span>{estimateReadTime(post.excerpt)} min read</span>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---------------------------------------------------------
          BAND 3: MAIN FEED & SIDEBAR
          --------------------------------------------------------- */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6 md:px-12 w-full">
          
          {isDefaultView && (
            <div className="flex items-center gap-3 mb-10">
              <span className="w-2 h-2 rounded-full bg-idaz-orange" />
              <h2 className="text-2xl md:text-3xl font-black font-montserrat text-idaz-black">Tất cả bài viết</h2>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-12 lg:gap-16">
            
            {/* Main Feed Column */}
            <div className="space-y-12">
              
              {/* Grid Posts */}
              {gridPosts.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {gridPosts.map((post, idx) => (
                      <motion.article 
                        key={post._id} 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: idx * 0.05 }}
                        className="group bg-white rounded-[24px] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-black/5 flex flex-col h-full"
                      >
                        <Link href={`/blog/${post.slug}`} className="relative aspect-[4/3] overflow-hidden block">
                          <PostImage 
                            src={post.coverImage} 
                            alt={post.title} 
                            className="w-full h-full transform transition-transform duration-500 group-hover:scale-[1.03]"
                          />
                          {post.tags?.[0] && (
                            <div className="absolute top-4 left-4 glass-panel px-3 py-1 rounded-full text-[10px] font-bold text-idaz-orange uppercase tracking-wider border border-white/40 shadow-sm backdrop-blur-md bg-white/90">
                              {post.tags[0]}
                            </div>
                          )}
                        </Link>

                        <div className="p-6 md:p-8 flex flex-col flex-1">
                          <div className="flex items-center gap-3 text-xs font-bold text-idaz-text-muted mb-3">
                            <span>{formatDate(post.createdAt)}</span>
                            <span>·</span>
                            <span>{estimateReadTime(post.excerpt)} phút</span>
                          </div>
                          
                          <Link href={`/blog/${post.slug}`}>
                            <h3 className="text-xl font-black font-montserrat text-idaz-black leading-snug mb-3 group-hover:text-idaz-orange transition-colors line-clamp-2">
                              {post.title}
                            </h3>
                          </Link>
                          
                          <p className="text-idaz-text-muted text-sm leading-relaxed line-clamp-3 mb-6">
                            {post.excerpt}
                          </p>

                          <Link href={`/blog/${post.slug}`} className="inline-flex items-center gap-2 text-idaz-black font-bold group-hover:text-idaz-orange hover:gap-3 transition-all mt-auto w-fit text-sm">
                            Đọc tiếp <ChevronRight size={16} />
                          </Link>
                        </div>
                      </motion.article>
                    ))}
                  </div>

                  {/* Newsletter Block (Inline Feed) */}
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="mt-12 bg-idaz-orange rounded-[32px] p-8 md:p-12 text-center relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
                    
                    <div className="relative z-10 max-w-lg mx-auto">
                      <div className="w-16 h-16 bg-white rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-xl rotate-3">
                        <Mail size={32} className="text-idaz-orange" />
                      </div>
                      <h3 className="text-3xl font-black font-montserrat text-white mb-4">Đừng bỏ lỡ tin tức mới!</h3>
                      <p className="text-white/90 mb-8 font-medium">Nhận các bài viết chuyên sâu về Branding và thiết kế UI/UX gửi trực tiếp vào hộp thư của bạn mỗi tuần.</p>
                      
                      <div className="flex flex-col sm:flex-row gap-3">
                        <input 
                          type="email" 
                          placeholder="Địa chỉ email của bạn..." 
                          className="flex-1 px-6 py-4 rounded-xl border-none outline-none focus:ring-4 focus:ring-white/30 text-idaz-black font-medium"
                        />
                        <button className="px-8 py-4 bg-idaz-black text-white font-bold rounded-xl hover:bg-black transition-colors whitespace-nowrap shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0">
                          Đăng ký ngay
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </>
              ) : (
                <div className="text-center py-24 bg-white rounded-[32px] border border-black/5 shadow-sm">
                  <div className="text-6xl mb-6 opacity-80">🔍</div>
                  <h3 className="text-2xl font-black font-montserrat text-idaz-black mb-3">Không tìm thấy bài viết</h3>
                  <p className="text-idaz-text-muted mb-8 max-w-md mx-auto">Chúng tôi không tìm thấy bài viết nào phù hợp với tìm kiếm của bạn. Hãy thử một từ khóa khác.</p>
                  <button 
                    onClick={() => { setSearchTerm(""); setSelectedCategory("Tất cả"); }}
                    className="px-8 py-3.5 bg-idaz-orange text-white rounded-full font-bold hover:bg-orange-600 transition-colors shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
                  >
                    Xóa bộ lọc tìm kiếm
                  </button>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <aside className="space-y-8 lg:sticky lg:top-32 lg:h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar pr-2 pb-8">
              
              {/* Search Widget */}
              <div className="bg-white rounded-[24px] p-6 md:p-8 shadow-sm border border-black/5">
                <h3 className="font-black text-idaz-black font-montserrat text-lg mb-5 uppercase tracking-wide">Tìm kiếm</h3>
                <div className="relative group">
                  <input 
                    type="text" 
                    placeholder="Nhập từ khóa..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-[#F5F5F7] border border-transparent rounded-[16px] py-3.5 pl-5 pr-12 focus:bg-white focus:border-idaz-orange focus:ring-4 focus:ring-idaz-orange/10 outline-none transition-all font-medium text-idaz-black"
                  />
                  <button className="absolute right-4 top-1/2 -translate-y-1/2 text-idaz-text-muted group-focus-within:text-idaz-orange transition-colors">
                    <Search size={20} />
                  </button>
                </div>
              </div>

              {/* Categories Widget */}
              <div className="bg-white rounded-[24px] p-6 md:p-8 shadow-sm border border-black/5">
                <h3 className="font-black text-idaz-black font-montserrat text-lg mb-5 uppercase tracking-wide">Chủ đề</h3>
                <ul className="space-y-2">
                  {CATEGORIES.map((category, idx) => {
                    const isActive = selectedCategory === category;
                    const count = category === "Tất cả" 
                      ? postsToUse.length 
                      : postsToUse.filter(p => p.tags?.includes(category)).length;

                    return (
                      <li key={idx}>
                        <button 
                          onClick={() => setSelectedCategory(category)}
                          className={`w-full flex items-center justify-between group px-4 py-3 rounded-[12px] transition-all ${isActive ? "bg-[rgba(245,166,35,0.1)] text-idaz-orange" : "hover:bg-[#F5F5F7] text-idaz-text-muted hover:text-idaz-black"}`}
                        >
                          <span className="flex items-center gap-3 font-semibold text-sm">
                            <Tag size={16} className={isActive ? "opacity-100" : "opacity-40 group-hover:opacity-70"} />
                            {category}
                          </span>
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-colors ${isActive ? "bg-idaz-orange text-white shadow-sm" : "bg-black/5 group-hover:bg-black/10 text-idaz-black"}`}>
                            {count}
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>

              {/* Popular Posts Widget */}
              <div className="bg-white rounded-[24px] p-6 md:p-8 shadow-sm border border-black/5">
                <h3 className="font-black text-idaz-black font-montserrat text-lg mb-6 flex items-center gap-2 uppercase tracking-wide">
                  <TrendingUp size={20} className="text-idaz-orange" />
                  Đọc nhiều nhất
                </h3>
                <div className="space-y-6">
                  {popularPosts.map((post, idx) => (
                    <Link href={`/blog/${post.slug}`} key={idx} className="flex gap-4 group items-center">
                      <div className="w-[84px] h-[84px] rounded-[16px] overflow-hidden flex-shrink-0 relative">
                        <PostImage 
                          src={post.coverImage} 
                          alt={post.title} 
                          className="w-full h-full transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute top-0 left-0 w-6 h-6 bg-idaz-orange text-white flex items-center justify-center text-[10px] font-black rounded-br-[12px] z-10 shadow-sm">
                          0{idx + 1}
                        </div>
                      </div>
                      <div className="flex flex-col flex-1 justify-center">
                        <h4 className="text-[13px] font-bold text-idaz-black leading-snug line-clamp-2 group-hover:text-idaz-orange transition-colors mb-2">
                          {post.title}
                        </h4>
                        <span className="text-[10px] font-bold text-idaz-text-muted tracking-widest uppercase">
                          {formatDate(post.createdAt)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}
