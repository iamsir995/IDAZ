"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";

const testimonials = [
 {
 id: 1,
 name: "Nguyễn Minh Tuấn",
 role: "CEO, TechStart Vietnam",
 content: "IDAZ đã giúp chúng tôi định hình lại toàn bộ hình ảnh thương hiệu. Từ logo đến website — mọi thứ đều vượt kỳ vọng. Tỷ lệ chuyển đổi tăng 45% ngay sau khi ra mắt giao diện mới.",
 rating: 5,
 avatar: "MT",
 color: "#F5A623",
 },
 {
 id: 2,
 name: "Trần Thị Lan Anh",
 role: "Giám đốc Marketing, GreenLife",
 content: "Đội ngũ IDAZ cực kỳ chuyên nghiệp và sáng tạo. Chiến dịch truyền thông họ thiết kế cho chúng tôi đã đạt 300% mục tiêu nhận diện thương hiệu trong quý đầu tiên.",
 rating: 5,
 avatar: "LA",
 color: "#10B981",
 },
 {
 id: 3,
 name: "Phạm Quốc Bảo",
 role: "Founder, LuxeHome Interior",
 content: "Từ concept đến bàn giao chỉ 3 tuần. Bộ nhận diện thương hiệu mới của chúng tôi nhận được rất nhiều phản hồi tích cực từ khách hàng và đối tác. Rất khuyến khích!",
 rating: 5,
 avatar: "QB",
 color: "#8B5CF6",
 },
 {
 id: 4,
 name: "Lê Hoàng Nam",
 role: "CTO, HealthPlus App",
 content: "Landing page IDAZ thiết kế cho HealthPlus đạt conversion rate 8.5% — cao hơn gấp đôi benchmark ngành. Họ thực sự hiểu về tâm lý người dùng và UX design.",
 rating: 5,
 avatar: "HN",
 color: "#EF4444",
 },
];

export default function TestimonialsSection() {
 const [current, setCurrent] = useState(0);
 const [direction, setDirection] = useState(1);
 const intervalRef = useRef(null);

 const startAutoPlay = () => {
 intervalRef.current = setInterval(() => {
 setDirection(1);
 setCurrent((prev) => (prev + 1) % testimonials.length);
 }, 5000);
 };

 useEffect(() => {
 startAutoPlay();
 return () => clearInterval(intervalRef.current);
 }, []);

 const goTo = (index, dir = 1) => {
 clearInterval(intervalRef.current);
 setDirection(dir);
 setCurrent(index);
 startAutoPlay();
 };

 const prev = () => goTo((current - 1 + testimonials.length) % testimonials.length, -1);
 const next = () => goTo((current + 1) % testimonials.length, 1);

 const variants = {
 enter: (dir) => ({ opacity: 0, x: dir > 0 ? 80 : -80 }),
 center: { opacity: 1, x: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
 exit: (dir) => ({ opacity: 0, x: dir > 0 ? -80 : 80, transition: { duration: 0.3 } }),
 };

 const t = testimonials[current];

 return (
 <section className="py-20 md:py-32 overflow-hidden relative">
 <div className="max-w-7xl mx-auto px-6 md:px-12 w-full">
 {/* Header */}
 <div className="text-center mb-14">
 <div className="text-sm font-bold text-idaz-orange uppercase tracking-wider mb-2 justify-center">Khách hàng nói gì</div>
 <h2 className="text-3xl md:text-4xl font-black font-montserrat text-idaz-black mt-2">
 Niềm tin được{" "}
 <span className="text-idaz-orange">xây dựng qua kết quả</span>
 </h2>
 </div>

 {/* Slider */}
 <div className="max-w-3xl mx-auto relative">
 <AnimatePresence custom={direction} mode="wait">
 <motion.div
 key={current}
 custom={direction}
 variants={variants}
 initial="enter"
 animate="center"
 exit="exit"
 className="bg-transparent rounded-2xl p-8 border border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.06)]"
 >
 {/* Quote icon */}
 <div
 className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6"
 style={{ background: `${t.color}15` }}
 >
 <Quote size={22} style={{ color: t.color }} />
 </div>

 {/* Stars */}
 <div className="flex gap-1 mb-5">
 {Array.from({ length: t.rating }).map((_, i) => (
 <Star key={i} size={18} fill={t.color} style={{ color: t.color }} />
 ))}
 </div>

 {/* Content */}
 <blockquote
 className="text-lg leading-relaxed mb-8"
 style={{
 color: "var(--color-idaz-black)",
 
 fontStyle: "italic",
 }}
 >
 &ldquo;{t.content}&rdquo;
 </blockquote>

 {/* Author */}
 <div className="flex items-center gap-4">
 <div
 className="w-14 h-14 rounded-full flex items-center justify-center font-black text-idaz-black text-lg flex-shrink-0"
 style={{ background: t.color, }}
 >
 {t.avatar}
 </div>
 <div>
 <div
 className="font-bold text-base"
 style={{  color: "var(--color-idaz-black)" }}
 >
 {t.name}
 </div>
 <div className="text-sm" style={{ color: "var(--color-idaz-text-muted)" }}>
 {t.role}
 </div>
 </div>
 </div>
 </motion.div>
 </AnimatePresence>

 {/* Controls */}
 <div className="flex items-center justify-between mt-8">
 {/* Dots */}
 <div className="flex gap-2">
 {testimonials.map((_, i) => (
 <button
 key={i}
 onClick={() => goTo(i, i > current ? 1 : -1)}
 className="rounded-full transition-all duration-300"
 style={{
 width: i === current ? "2rem" : "0.5rem",
 height: "0.5rem",
 background: i === current ? "var(--color-idaz-orange)" : "var(--color-idaz-gray-mid)",
 }}
 />
 ))}
 </div>

 {/* Prev/Next */}
 <div className="flex gap-2">
 <button
 onClick={prev}
 className="w-11 h-11 rounded-full border-2 flex items-center justify-center transition-all hover:bg-idaz-orange hover:border-idaz-orange hover:text-idaz-black group"
 style={{ borderColor: "var(--color-idaz-gray-mid)", color: "var(--color-idaz-text-muted)" }}
 >
 <ChevronLeft size={18} />
 </button>
 <button
 onClick={next}
 className="w-11 h-11 rounded-full flex items-center justify-center transition-all text-idaz-black"
 style={{ background: "var(--color-idaz-orange)" }}
 >
 <ChevronRight size={18} />
 </button>
 </div>
 </div>
 </div>

 {/* Logo strip */}
 <div className="mt-16 pt-12 border-t border-gray-200">
 <p className="text-center text-xs font-bold tracking-widest uppercase mb-8" style={{ color: "var(--color-idaz-text-muted)" }}>
 Đã tin dùng bởi hơn 150 doanh nghiệp
 </p>
 <div className="flex items-center justify-center gap-10 flex-wrap opacity-40">
 {["VinaCafé", "TechStart", "GreenLife", "LuxeHome", "HealthPlus", "FreshFood"].map((brand) => (
 <div
 key={brand}
 className="font-black text-xl tracking-tight"
 style={{  color: "var(--color-idaz-black)" }}
 >
 {brand}
 </div>
 ))}
 </div>
 </div>
 </div>
 </section>
 );
}
