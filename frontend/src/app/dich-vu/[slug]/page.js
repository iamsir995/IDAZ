import PublicNavbar from "../../../components/public/PublicNavbar";
import PublicFooter from "../../../components/public/PublicFooter";
import ContactSection from "../../../components/public/ContactSection";
import PortfolioSection from "../../../components/public/PortfolioSection";
import { ArrowLeft, CheckCircle2, Check } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

// Tắt cache để luôn lấy dữ liệu mới nhất khi develop, hoặc set revalidate hợp lý
async function getServiceData(slug) {
  try {
    const res = await fetch(`http://localhost:5000/api/services/public/${slug}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data;
  } catch (error) {
    return null;
  }
}

export default async function ServiceDetailPage({ params }) {
  const resolvedParams = await params;
  const service = await getServiceData(resolvedParams.slug);

  if (!service) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-white">
      <PublicNavbar />

      {/* Hero Mini */}
      <section className="pt-36 pb-16 bg-[#1D1D1F]">
        <div className="max-w-7xl mx-auto px-5 md:px-8 w-full">
          <Link href="/dich-vu" className="inline-flex items-center gap-2 text-white/50 hover:text-[#F5A623] mb-6 text-sm transition-colors" >
            <ArrowLeft size={16} />
            Quay lại Danh sách Dịch vụ
          </Link>
          <h1 className="font-display font-black text-white mb-4 tracking-tight leading-tight" style={{ fontSize: "clamp(2rem, 5vw, 4rem)" }}>
            {service.title}
          </h1>
          <p className="text-[#F5A623] text-lg md:text-xl font-semibold" >
            {service.description}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-20 md:py-28 bg-[#F5F5F7]">
        <div className="max-w-7xl mx-auto px-5 md:px-8 w-full">
          <div className="max-w-4xl">
            <p className="text-[16px] md:text-[18px] leading-relaxed text-[#424245] mb-16 font-[400]" >
              {service.content || service.description}
            </p>

            <div className="grid md:grid-cols-2 gap-10 lg:gap-16">
              {/* Benefits */}
              {service.benefits && service.benefits.length > 0 && (
                <div>
                  <h3 className="text-[20px] font-black font-display text-[#1D1D1F] mb-6 flex items-center gap-3">
                    <span className="w-8 h-[3px] rounded-full bg-[#F5A623] inline-block"></span>
                    Lợi ích mang lại
                  </h3>
                  <ul className="space-y-4">
                    {service.benefits.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 glass-panel p-4 rounded-[16px] border border-white/60">
                        <CheckCircle2 className="text-[#F5A623] flex-shrink-0 mt-0.5" size={20} strokeWidth={2.5} />
                        <span className="text-[#424245] text-[15px] leading-relaxed" >{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Deliverables */}
              {service.deliverables && service.deliverables.length > 0 && (
                <div className="glass-panel p-8 rounded-[24px] border border-white">
                  <h3 className="text-[20px] font-black font-display text-[#1D1D1F] mb-6">Bạn nhận được gì?</h3>
                  <ul className="space-y-4">
                    {service.deliverables.map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-[#1D1D1F] mt-2 flex-shrink-0"></div>
                        <span className="text-[#1D1D1F] font-semibold text-[15px] leading-relaxed" >{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      {service.pricingPlans && service.pricingPlans.length > 0 && (
        <section className="py-20 md:py-28 bg-white relative">
          {/* Subtle decoration */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-[0.03] pointer-events-none bg-black" />
          
          <div className="max-w-7xl mx-auto px-5 md:px-8 w-full relative z-10">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="badge-pill mb-4 inline-flex">Bảng giá minh bạch</span>
              <h2 className="font-display font-black text-[#1D1D1F] tracking-tight leading-tight mb-4" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
                Đầu tư thông minh cho <span style={{ color: "var(--color-idaz-orange)" }}>thương hiệu</span>
              </h2>
              <p className="text-[#6E6E73] text-[16px] font-[400]" >
                Chọn gói dịch vụ phù hợp nhất với giai đoạn phát triển của doanh nghiệp bạn. Không phí ẩn.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto items-end">
              {service.pricingPlans.map((plan, idx) => (
                <div 
                  key={idx} 
                  className={`rounded-[24px] p-8 ${
                    plan.isPopular 
                      ? "bg-[#1D1D1F] text-white shadow-[0_20px_40px_rgba(0,0,0,0.15)] md:-translate-y-4 border border-[rgba(255,255,255,0.1)] relative" 
                      : "bg-[#F5F5F7] text-[#1D1D1F] border border-[rgba(0,0,0,0.05)]"
                  }`}
                >
                  {plan.isPopular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-[#F5A623] text-[#1D1D1F] text-[12px] font-[800] uppercase tracking-wider rounded-full shadow-md">
                      Phổ biến nhất
                    </div>
                  )}
                  <h3 className={`font-display font-[800] text-[20px] mb-2 ${plan.isPopular ? "text-white" : "text-[#1D1D1F]"}`}>
                    {plan.name}
                  </h3>
                  <div className="mb-4">
                    <span className="text-[28px] md:text-[32px] font-black tracking-tight">{plan.price}</span>
                  </div>
                  <p className={`text-[14px] leading-relaxed mb-8 ${plan.isPopular ? "text-[rgba(255,255,255,0.6)]" : "text-[#6E6E73]"}`} >
                    {plan.description}
                  </p>
                  
                  <div className="h-px w-full mb-8" style={{ background: plan.isPopular ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)" }} />
                  
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-3">
                        <Check size={18} className={`flex-shrink-0 mt-0.5 ${plan.isPopular ? "text-[#F5A623]" : "text-[#1D1D1F]"}`} strokeWidth={2.5} />
                        <span className={`text-[14px] font-[500] ${plan.isPopular ? "text-white" : "text-[#424245]"}`} >
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Link 
                    href="/lien-he" 
                    className={`block w-full py-3.5 text-center rounded-[12px] text-[14px] font-[700] transition-all duration-300 ${
                      plan.isPopular 
                        ? "bg-[#F5A623] text-[#1D1D1F] hover:bg-white" 
                        : "bg-[#1D1D1F] text-white hover:bg-[#F5A623] hover:text-[#1D1D1F]"
                    }`}
                    
                  >
                    Chọn gói này
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Other components */}
      <PortfolioSection />
      <ContactSection />
      <PublicFooter />
    </main>
  );
}
