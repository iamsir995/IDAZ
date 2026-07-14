import PublicNavbar from "../../components/public/PublicNavbar";
import PublicFooter from "../../components/public/PublicFooter";
import ProcessSection from "../../components/public/ProcessSection";
import ContactSection from "../../components/public/ContactSection";
import { ArrowRight, PenTool, Globe, Megaphone, CheckCircle2, MonitorPlay, Palette, Code, Smartphone, Briefcase, Camera, Video, MessageSquare } from "lucide-react";
import Link from "next/link";
import api from "../../services/api";

const iconMap = {
  PenTool, Globe, Megaphone, MonitorPlay, Palette, Code, Smartphone, Briefcase, Camera, Video, MessageSquare
};

const defaultColors = [
  { color: "var(--color-idaz-orange)", bg: "rgba(245,166,35,0.08)" },
  { color: "#3B82F6", bg: "rgba(59,130,246,0.08)" },
  { color: "#8B5CF6", bg: "rgba(139,92,246,0.08)" },
  { color: "#10B981", bg: "rgba(16,185,129,0.08)" },
  { color: "#EC4899", bg: "rgba(236,72,153,0.08)" }
];

export default async function ServicesPage() {
  let allServices = [];
  try {
    // Gọi API từ Backend để lấy danh sách Dịch Vụ
    const res = await api.get('/services/public');
    if (res.data.success) {
      allServices = res.data.data;
    }
  } catch (error) {
    console.error("Lỗi khi fetch Services:", error);
  }

  return (
 <main className="min-h-screen bg-idaz-gray">
 <PublicNavbar />

 {/* Hero */}
 <section className="pt-36 pb-20 bg-gradient-to-br from-idaz-black to-gray-900 relative overflow-hidden">
 <div className="absolute inset-0 bg-black/40" />
 <div className="max-w-7xl mx-auto px-6 md:px-12 w-full relative z-10 text-center">
 <h1 className="text-4xl md:text-6xl lg:text-7xl font-black font-montserrat text-white mb-6">
 Dịch vụ của <span className="text-idaz-orange">IDAZ</span>
 </h1>
 <p className="text-white/80 max-w-2xl mx-auto text-lg leading-relaxed">
 Hệ sinh thái giải pháp toàn diện giúp doanh nghiệp xây dựng, củng cố và phát triển thương hiệu một cách mạnh mẽ nhất.
 </p>
 </div>
 </section>

 {/* Services List */}
 <section className="py-20 md:py-32">
 <div className="max-w-7xl mx-auto px-6 md:px-12 w-full max-w-5xl">
 <div className="space-y-12">
 {allServices.map((svc, i) => {
   const IconComponent = iconMap[svc.icon] || PenTool;
   const theme = defaultColors[i % defaultColors.length];
   return (
 <div key={svc.slug} className="bg-white rounded-3xl p-8 md:p-12 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300">
 <div className="flex flex-col md:flex-row gap-8 lg:gap-12 items-start">
 
 {/* Left Icon */}
 <div className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: theme.bg }}>
 <IconComponent size={40} style={{ color: theme.color }} strokeWidth={1.5} />
 </div>

 {/* Right Content */}
 <div className="flex-1">
 <h2 className="text-3xl md:text-4xl font-black font-montserrat text-idaz-black mb-4 text-2xl md:text-3xl">{svc.title}</h2>
 <p className="text-idaz-text-muted font-sans leading-relaxed text-base mb-8">{svc.description}</p>
 
 <div className="grid sm:grid-cols-2 gap-x-6 gap-y-4 mb-8">
 {svc.features && svc.features.map(f => (
 <div key={f} className="flex items-start gap-3">
 <CheckCircle2 size={20} className="text-idaz-orange flex-shrink-0 mt-0.5" />
 <span className="text-sm font-semibold text-idaz-black">{f}</span>
 </div>
 ))}
 </div>

 <Link href={`/dich-vu/${svc.slug}`} className="inline-flex items-center gap-2 border-2 border-idaz-gray-mid text-idaz-black font-bold px-6 py-3 rounded-xl transition-all hover:border-idaz-black hover:bg-idaz-black hover:text-white text-sm">
 Khám phá chi tiết
 <ArrowRight size={16} />
 </Link>
 </div>
 </div>
 </div>
   );
 })}
 </div>
 </div>
 </section>

 <ProcessSection />
 <ContactSection />
 <PublicFooter />
 </main>
 );
}
