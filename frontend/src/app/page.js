import PublicNavbar from "../components/public/PublicNavbar";
import HeroSection from "../components/public/HeroSection";
import ServicesSection from "../components/public/ServicesSection";
import WhyUsSection from "../components/public/WhyUsSection";
import ProcessSection from "../components/public/ProcessSection";
import PortfolioSection from "../components/public/PortfolioSection";
import TestimonialsSection from "../components/public/TestimonialsSection";
import BlogSection from "../components/public/BlogSection";
import ContactSection from "../components/public/ContactSection";
import PublicFooter from "../components/public/PublicFooter";
import api from "../services/api";

// Cấu hình revalidate nếu muốn cache data (tuỳ chọn)
export const revalidate = 60; // revalidate every 60 seconds

export default async function Home() {
  let services = [];
  let portfolios = [];
  let posts = [];

  try {
    const [servicesRes, portfoliosRes, postsRes] = await Promise.all([
      api.get('/services/public'),
      api.get('/portfolios/public?limit=6'),
      api.get('/posts/public?limit=3')
    ]);
    
    if (servicesRes.data.success) services = servicesRes.data.data;
    if (portfoliosRes.data.success) portfolios = portfoliosRes.data.data;
    if (postsRes.data.success) posts = postsRes.data.data;
  } catch (error) {
    console.error("Lỗi khi tải dữ liệu Public Homepage:", error);
  }


  return (
    <main className="min-h-screen">
      <PublicNavbar />
      
      {/* 
      Mỗi section đã được bọc trong các thẻ <section> có id tương ứng, 
      và padding/margins đã được xử lý trong các component.
      */}
      <HeroSection />
      <ServicesSection services={services} />
      <WhyUsSection />
      <ProcessSection />
      <PortfolioSection initialPortfolios={portfolios} />
      <TestimonialsSection />
      <BlogSection posts={posts} />
      <ContactSection />
      
      <PublicFooter />
    </main>
  );
}
