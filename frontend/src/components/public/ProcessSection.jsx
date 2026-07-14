"use client";
import { motion } from "framer-motion";

const steps = [
 {
 number: "01",
 title: "Lắng nghe & Khám phá",
 desc: "Tiếp nhận yêu cầu, phân tích thị trường, đối thủ cạnh tranh và mục tiêu kinh doanh để hiểu rõ bản chất thương hiệu của bạn.",
 duration: "1–3 ngày",
 },
 {
 number: "02",
 title: "Định hướng Chiến lược",
 desc: "Xây dựng brief sáng tạo, định vị thương hiệu và lên concept dựa trên insight từ giai đoạn khám phá. Trình bày và thống nhất cùng khách hàng.",
 duration: "2–5 ngày",
 },
 {
 number: "03",
 title: "Thiết kế & Sáng tạo",
 desc: "Đội ngũ thiết kế triển khai ý tưởng thành sản phẩm thực tế. Mọi chi tiết đều được chăm chút với tiêu chuẩn cao nhất.",
 duration: "5–15 ngày",
 },
 {
 number: "04",
 title: "Phản hồi & Hoàn thiện",
 desc: "Trình bày kết quả, lắng nghe phản hồi và điều chỉnh cho đến khi bạn hoàn toàn hài lòng. Tối đa 3 vòng revise theo gói dịch vụ.",
 duration: "3–7 ngày",
 },
 {
 number: "05",
 title: "Bàn giao & Hỗ trợ",
 desc: "Bàn giao toàn bộ file gốc cùng hướng dẫn sử dụng chi tiết. Hỗ trợ kỹ thuật miễn phí trong 30 ngày sau bàn giao.",
 duration: "1 ngày",
 },
];

export default function ProcessSection() {
 return (
 <section id="process" className="py-20 md:py-32" style={{ background: "var(--color-idaz-black)" }}>
 <div className="max-w-7xl mx-auto px-6 md:px-12 w-full">
 {/* Header */}
 <div className="text-center mb-16">
 <div
 className="inline-flex items-center gap-2 text-caption-1 font-bold tracking-widest uppercase mb-3"
 style={{ color: "var(--color-idaz-orange)" }}
 >
 <span className="w-8 h-px" style={{ background: "var(--color-idaz-orange)" }} />
 Quy trình làm việc
 <span className="w-8 h-px" style={{ background: "var(--color-idaz-orange)" }} />
 </div>
 <h2
 className="text-idaz-black mb-4"
 style={{
 
 fontWeight: 800,
 fontSize: "clamp(1.8rem, 4vw, 2.75rem)",
 lineHeight: 1.15,
 letterSpacing: "-0.02em",
 }}
 >
 Quy trình{" "}
 <span style={{ color: "var(--color-idaz-orange)" }}>5 bước</span> chuẩn mực
 </h2>
 <p className="text-gray-400 max-w-xl mx-auto text-callout" >
 Minh bạch, có hệ thống và luôn hướng đến kết quả kinh doanh thực tế.
 </p>
 </div>

 {/* Steps */}
 <div className="relative">
 {/* Connector line (desktop) */}
 <div
 className="hidden lg:block absolute top-8 left-0 right-0 h-px"
 style={{ background: "linear-gradient(to right, transparent, var(--color-idaz-orange), transparent)", opacity: 0.3 }}
 />

 <div className="grid lg:grid-cols-5 gap-8">
 {steps.map((step, i) => (
 <motion.div
 key={step.number}
 initial={{ opacity: 0, y: 40 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true, margin: "-40px" }}
 transition={{ duration: 0.6, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
 className="relative flex flex-col"
 >
 {/* Step number circle */}
 <div className="flex items-center gap-4 lg:flex-col lg:items-start mb-5">
 <div
 className="w-14 h-14 rounded-full flex items-center justify-center font-black text-lg flex-shrink-0 relative z-10"
 style={{
 background: i === 0 ? "var(--color-idaz-orange)" : "rgba(245,166,35,0.12)",
 color: i === 0 ? "white" : "var(--color-idaz-orange)",
 border: "2px solid rgba(245,166,35,0.3)",
 
 }}
 >
 {step.number}
 </div>

 {/* Mobile connector line */}
 {i < steps.length - 1 && (
 <div
 className="lg:hidden flex-1 h-px"
 style={{ background: "rgba(245,166,35,0.2)" }}
 />
 )}
 </div>

 <h4
 className="text-idaz-black font-bold text-callout mb-3"
 
 >
 {step.title}
 </h4>
 <p
 className="text-idaz-black/45 text-subheadline leading-relaxed flex-1 mb-4"
 
 >
 {step.desc}
 </p>
 <div
 className="inline-flex items-center gap-1.5 text-caption-1 font-bold px-3 py-1.5 rounded-full"
 style={{
 background: "rgba(245,166,35,0.08)",
 color: "var(--color-idaz-orange)",
 border: "1px solid rgba(245,166,35,0.2)",
 }}
 >
 ⏱ {step.duration}
 </div>
 </motion.div>
 ))}
 </div>
 </div>
 </div>
 </section>
 );
}
