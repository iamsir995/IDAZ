import PublicNavbar from "../components/public/PublicNavbar";
import HeroSection from "../components/public/HeroSection";
import ServicesSection from "../components/public/ServicesSection";
import dynamic from 'next/dynamic';

const WhyUsSection = dynamic(() => import('../components/public/WhyUsSection'), { ssr: true });
const ProcessSection = dynamic(() => import('../components/public/ProcessSection'), { ssr: true });
const PortfolioSection = dynamic(() => import('../components/public/PortfolioSection'), { ssr: true });
const TestimonialsSection = dynamic(() => import('../components/public/TestimonialsSection'), { ssr: true });
const BlogSection = dynamic(() => import('../components/public/BlogSection'), { ssr: true });
const ContactSection = dynamic(() => import('../components/public/ContactSection'), { ssr: true });
const PublicFooter = dynamic(() => import('../components/public/PublicFooter'), { ssr: true });

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
      api.get('/posts/public?limit=5')
    ]);
    
    if (servicesRes.data.success) services = servicesRes.data.data;
    if (portfoliosRes.data.success) portfolios = portfoliosRes.data.data;
    if (postsRes.data.success) posts = postsRes.data.data;
  } catch (error) {
    console.error("Lỗi khi tải dữ liệu Public Homepage:", error);
  }


  return (
    <main className="min-h-screen bg-apple-light text-[#1D1D1F] font-sans overflow-x-hidden selection:bg-[#F5A623]/30">
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
