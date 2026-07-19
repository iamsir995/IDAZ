"use client";
import { motion } from "framer-motion";
import { Zap, Shield, Palette, MessageCircle, TrendingUp, Headphones, CheckCircle } from "lucide-react";

const reasons = [
  {
    icon: Palette,
    title: "Thiết kế độc bản",
    desc: "Mỗi sản phẩm được thiết kế riêng biệt, phù hợp với DNA và giá trị cốt lõi của từng thương hiệu.",
  },
  {
    icon: Shield,
    title: "Cam kết chất lượng",
    desc: "Quy trình kiểm soát chất lượng nghiêm ngặt, đảm bảo mọi deliverable đều đạt mức xuất sắc.",
  },
  {
    icon: Zap,
    title: "Tiến độ đúng hạn",
    desc: "Chúng tôi tôn trọng timeline của khách hàng. Mọi dự án được bàn giao đúng cam kết.",
  },
  {
    icon: TrendingUp,
    title: "Tư duy chiến lược",
    desc: "Không chỉ thiết kế đẹp — chúng tôi xây dựng thương hiệu có chiến lược tạo giá trị thực.",
  },
  {
    icon: MessageCircle,
    title: "Giao tiếp minh bạch",
    desc: "Cập nhật tiến độ thường xuyên, lắng nghe phản hồi và điều chỉnh linh hoạt.",
  },
  {
    icon: Headphones,
    title: "Hỗ trợ dài hạn",
    desc: "Mối quan hệ không kết thúc khi bàn giao. Chúng tôi đồng hành hỗ trợ sau ra mắt.",
  },
];

const highlights = [
  "200+ dự án thành công",
  "150+ khách hàng tin tưởng",
  "98% tỷ lệ hài lòng",
  "5+ năm kinh nghiệm",
];

export default function WhyUsSection() {
  return (
    <section id="why-us" className="py-20 md:py-28 relative overflow-hidden">
      {/* Subtle decoration */}
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full opacity-20 pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(245,166,35,0.15) 0%, transparent 70%)" }}
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-5 md:px-8 w-full">
        <div className="grid lg:grid-cols-[480px_1fr] xl:grid-cols-[520px_1fr] gap-12 lg:gap-16 items-start">

          {/* Left — sticky content */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            className="lg:sticky lg:top-24"
          >
            <span className="badge-pill mb-6 inline-flex">Tại sao chọn IDAZ</span>
            <h2
              className="font-display font-black text-[#1D1D1F] mb-6 tracking-[-0.025em] leading-[1.1]"
              style={{ fontSize: "clamp(2rem, 3.5vw, 2.8rem)" }}
            >
              Chúng tôi không chỉ{" "}
              <span style={{ color: "var(--color-idaz-orange)" }}>thiết kế đẹp</span>
            </h2>
            <p
              className="text-callout leading-relaxed text-[#6E6E73] mb-8 font-[400]"
              
            >
              IDAZ được xây dựng trên nền tảng của sự thấu hiểu kinh doanh sâu sắc. Chúng tôi tin rằng thương hiệu mạnh là tài sản chiến lược — không chỉ là bộ hình ảnh đẹp.
            </p>

            {/* Highlights list */}
            <div className="space-y-3 mb-8">
              {highlights.map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(245,166,35,0.12)" }}>
                    <CheckCircle size={12} style={{ color: "var(--color-idaz-orange)" }} strokeWidth={3} />
                  </div>
                  <span className="text-subheadline font-semibold text-[#1D1D1F]" >
                    {item}
                  </span>
                </div>
              ))}
            </div>

            {/* Key stat card */}
            <div className="glass-panel rounded-[20px] p-6 border border-white/80">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-[14px] flex items-center justify-center flex-shrink-0" style={{ background: "var(--color-idaz-orange)" }}>
                  <TrendingUp size={24} color="white" strokeWidth={2} />
                </div>
                <div>
                  <div className="font-display font-black text-[#1D1D1F] text-title-3 tracking-tight">
                    200+ dự án thành công
                  </div>
                  <div className="text-footnote text-[#86868B] mt-0.5" >
                    Phục vụ từ startup đến tập đoàn, tỷ lệ hài lòng 98%
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right — reasons grid */}
          <div className="grid sm:grid-cols-2 gap-4">
            {reasons.map((reason, i) => (
              <motion.div
                key={reason.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: [0.4, 0, 0.2, 1] }}
              >
                <div className="glass-frosted rounded-[20px] p-6 border border-white hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300 group h-full">
                  <div
                    className="w-10 h-10 rounded-[12px] flex items-center justify-center mb-4 transition-colors duration-300 group-hover:bg-[#F5A623]"
                    style={{ background: "rgba(245,166,35,0.08)" }}
                  >
                    <reason.icon
                      size={20}
                      className="transition-colors duration-300 group-hover:text-white"
                      style={{ color: "var(--color-idaz-orange)" }}
                      strokeWidth={1.8}
                    />
                  </div>
                  <h4
                    className="font-display font-[800] text-[#1D1D1F] text-subheadline mb-2 tracking-tight"
                  >
                    {reason.title}
                  </h4>
                  <p className="text-footnote leading-relaxed text-[#6E6E73]" >
                    {reason.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
