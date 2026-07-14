import PublicNavbar from "../../components/public/PublicNavbar";
import PublicFooter from "../../components/public/PublicFooter";
import ContactSection from "../../components/public/ContactSection";
import PortfolioSection from "../../components/public/PortfolioSection";
import api from "../../services/api";

export const revalidate = 60; // Cache 60s

export default async function PortfolioPage() {
  let portfolios = [];
  try {
    const { data } = await api.get('/portfolios/public?limit=50'); // Load nhiều hơn trên trang Portfolio
    if (data.success) {
      portfolios = data.data;
    }
  } catch (error) {
    console.error("Lỗi khi fetch portfolios:", error);
  }

  return (
    <main className="min-h-screen bg-idaz-gray">
      <PublicNavbar />

      {/* Hero Mini */}
      <section className="pt-36 pb-20 bg-gradient-to-br from-idaz-black to-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/40" />
        <div className="max-w-7xl mx-auto px-6 md:px-12 w-full relative z-10 text-center">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black font-montserrat text-white mb-6">
            Dự án <span className="text-idaz-orange">Thực tế</span>
          </h1>
          <p className="text-white/80 max-w-2xl mx-auto text-lg leading-relaxed">
            Khám phá cách chúng tôi đồng hành cùng các thương hiệu giải quyết những bài toán hóc búa nhất.
          </p>
        </div>
      </section>

      {/* Reusing PortfolioSection since it already has the grid and filters */}
      <div className="py-8">
        <PortfolioSection initialPortfolios={portfolios} />
      </div>

      <ContactSection />
      <PublicFooter />
    </main>
  );
}
