import PublicNavbar from "../../../components/public/PublicNavbar";
import PublicFooter from "../../../components/public/PublicFooter";
import ContactSection from "../../../components/public/ContactSection";
import { ArrowLeft, CheckCircle2, ChevronRight, Layers, Layout, Zap, Shield, Sparkles, Smartphone, MonitorPlay, TrendingUp } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

// Tắt cache để luôn lấy dữ liệu mới nhất khi develop, hoặc set revalidate hợp lý
async function getServiceData(slug) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
    const res = await fetch(`${backendUrl}/api/services/public/${slug}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data;
  } catch (error) {
    return null;
  }
}

// Icon mapper for dynamic icons from DB
const IconMap = {
  Palette: Layout,
  Smartphone: Smartphone,
  MonitorPlay: MonitorPlay,
  Sparkles: Sparkles,
  TrendingUp: TrendingUp,
  Shield: Shield,
  Zap: Zap,
  Layers: Layers
};

export default async function ServiceDetailPage({ params }) {
  const resolvedParams = await params;
  const service = await getServiceData(resolvedParams.slug);

  if (!service) {
    notFound();
  }

  const IconComponent = IconMap[service.icon] || Layout;

  return (
    <main className="min-h-screen bg-idaz-gray selection:bg-idaz-orange selection:text-white">
      <PublicNavbar />

      {/* Hero Mini - Liquid Glass Style */}
      <section className="pt-40 pb-24 relative overflow-hidden bg-idaz-black">
        {/* Abstract Liquid Orbs */}
        <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] rounded-full bg-idaz-orange opacity-20 blur-[120px] pointer-events-none mix-blend-screen" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] rounded-full bg-purple-500 opacity-20 blur-[100px] pointer-events-none mix-blend-screen" />
        
        <div className="max-w-7xl mx-auto px-6 md:px-12 w-full relative z-10">
          <Link href="/dich-vu" className="inline-flex items-center gap-2 text-white/50 hover:text-white mb-8 text-sm font-semibold transition-colors uppercase tracking-wider" >
            <ArrowLeft size={16} />
            Quay lại Dịch vụ
          </Link>
          
          <div className="grid lg:grid-cols-[1fr_400px] gap-12 lg:gap-24 items-center">
            <div>
              <div className="w-16 h-16 rounded-2xl glass-panel flex items-center justify-center mb-8 border border-white/20">
                <IconComponent className="text-white" size={32} strokeWidth={1.5} />
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black font-montserrat text-white mb-6 leading-[1.1] tracking-tight">
                {service.title}
              </h1>
              <p className="text-white/70 text-xl md:text-2xl leading-relaxed max-w-2xl font-light">
                {service.description}
              </p>
            </div>
            
            {/* Right side floating glass card */}
            <div className="glass-panel p-8 rounded-3xl border border-white/10 hidden lg:block">
              <h3 className="text-white font-bold text-xl mb-6">Liên hệ tư vấn ngay</h3>
              <p className="text-white/60 mb-8 text-sm leading-relaxed">
                Các chuyên gia của IDAZ luôn sẵn sàng lắng nghe bài toán của bạn và đề xuất giải pháp tối ưu nhất.
              </p>
              <Link href="#contact" className="block w-full py-4 px-6 bg-white text-idaz-black text-center rounded-xl font-bold hover:bg-idaz-orange hover:text-white transition-all duration-300">
                Nhận Báo Giá Tư Vấn
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-24 md:py-32 bg-white relative">
        <div className="max-w-7xl mx-auto px-6 md:px-12 w-full">
          <div className="max-w-4xl">
            {/* HTML Content (if any) or long description */}
            <div className="prose prose-lg md:prose-xl prose-idaz max-w-none text-idaz-text-muted font-light leading-relaxed mb-20">
              {service.content ? (
                <div dangerouslySetInnerHTML={{ __html: service.content }} />
              ) : (
                <p>{service.description}</p>
              )}
            </div>

            {/* Features (if exist in mock data) */}
            {service.features && service.features.length > 0 && (
              <div className="mb-20">
                <h2 className="text-3xl md:text-4xl font-black font-montserrat text-idaz-black mb-10 tracking-tight">
                  Đặc điểm Nổi bật
                </h2>
                <div className="grid sm:grid-cols-2 gap-6">
                  {service.features.map((feature, i) => (
                    <div key={i} className="bg-idaz-gray p-8 rounded-3xl border border-gray-100 hover:border-idaz-orange/30 transition-colors group">
                      <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                        <CheckCircle2 className="text-idaz-orange" size={24} />
                      </div>
                      <h4 className="text-xl font-bold text-idaz-black mb-3">{feature}</h4>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Legacy Benefits */}
            <div className="grid md:grid-cols-2 gap-12 lg:gap-16">
              {service.benefits && service.benefits.length > 0 && (
                <div>
                  <h3 className="text-2xl font-black font-montserrat text-idaz-black mb-8 flex items-center gap-4">
                    <span className="w-8 h-1 rounded-full bg-idaz-orange inline-block"></span>
                    Lợi ích cốt lõi
                  </h3>
                  <ul className="space-y-4">
                    {service.benefits.map((item, i) => (
                      <li key={i} className="flex items-start gap-4 p-5 rounded-2xl bg-idaz-gray border border-gray-100">
                        <CheckCircle2 className="text-idaz-orange flex-shrink-0 mt-0.5" size={24} strokeWidth={2} />
                        <span className="text-idaz-text-muted text-base leading-relaxed" >{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {service.deliverables && service.deliverables.length > 0 && (
                <div className="bg-idaz-black p-10 rounded-[32px] border border-gray-800 shadow-2xl">
                  <h3 className="text-2xl font-black font-montserrat text-white mb-8">Bạn nhận được gì?</h3>
                  <ul className="space-y-5">
                    {service.deliverables.map((item, i) => (
                      <li key={i} className="flex items-start gap-4">
                        <div className="w-2 h-2 rounded-full bg-idaz-orange mt-2.5 flex-shrink-0 shadow-[0_0_10px_rgba(245,166,35,0.5)]"></div>
                        <span className="text-white/80 font-medium text-base leading-relaxed" >{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section - Glassmorphism Style */}
      {service.pricingPlans && service.pricingPlans.length > 0 && (
        <section className="py-24 md:py-32 bg-idaz-gray relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 md:px-12 w-full relative z-10">
            <div className="text-center mb-20 max-w-2xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-black font-montserrat text-idaz-black mb-6 tracking-tight">Bảng giá Dịch vụ</h2>
              <p className="text-idaz-text-muted text-lg">Các gói dịch vụ được thiết kế linh hoạt, phù hợp với từng giai đoạn phát triển của doanh nghiệp bạn.</p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
              {service.pricingPlans.map((plan, i) => (
                <div 
                  key={i} 
                  className={`relative p-8 rounded-[32px] flex flex-col h-full bg-white border border-gray-200 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] transition-all duration-300 ${plan.isPopular ? 'border-idaz-orange shadow-lg scale-[1.02] z-10' : ''}`}
                >
                  {plan.isPopular && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-idaz-orange text-white text-xs font-bold uppercase tracking-wider py-1.5 px-4 rounded-full">
                      Phổ biến nhất
                    </div>
                  )}
                  
                  <h3 className="text-2xl font-black font-montserrat text-idaz-black mb-2">{plan.name}</h3>
                  <div className="text-idaz-text-muted text-sm mb-8 h-10">{plan.description}</div>
                  
                  <div className="mb-8">
                    <span className="text-4xl font-black font-montserrat text-idaz-black">{plan.price}</span>
                  </div>
                  
                  <ul className="space-y-4 mb-10 flex-grow">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm text-idaz-text-muted">
                        <CheckCircle2 className="text-idaz-orange flex-shrink-0 w-5 h-5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Link 
                    href="#contact"
                    className={`block w-full py-4 text-center rounded-xl font-bold transition-all ${plan.isPopular ? 'bg-idaz-black text-white hover:bg-idaz-orange' : 'bg-idaz-gray text-idaz-black hover:bg-gray-200'}`}
                  >
                    Chọn Gói Này
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact Section */}
      <div id="contact">
        <ContactSection />
      </div>
      <PublicFooter />
    </main>
  );
}
