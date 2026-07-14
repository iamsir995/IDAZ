import PublicNavbar from "../../components/public/PublicNavbar";
import PublicFooter from "../../components/public/PublicFooter";
import BlogSection from "../../components/public/BlogSection";
import ContactSection from "../../components/public/ContactSection";
import api from "../../services/api";

export const revalidate = 60; // Cache 60s

export default async function BlogPage() {
  let posts = [];
  try {
    const { data } = await api.get('/posts/public?limit=50'); // Load nhiều hơn trên trang Blog
    if (data.success) {
      posts = data.data;
    }
  } catch (error) {
    console.error("Lỗi khi fetch bài viết:", error);
  }

  return (
    <main className="min-h-screen bg-white">
      <PublicNavbar />

      {/* Hero Mini */}
      <section className="pt-36 pb-16 bg-gradient-to-br from-idaz-black to-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/40" />
        <div className="max-w-7xl mx-auto px-6 md:px-12 w-full relative z-10 text-center">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black font-montserrat text-white mb-6">
            Kiến thức & <span className="text-idaz-orange">Insight</span>
          </h1>
          <p className="text-white/80 max-w-2xl mx-auto text-lg leading-relaxed">
            Chia sẻ góc nhìn, kinh nghiệm thực chiến và cập nhật xu hướng mới nhất về thiết kế, công nghệ và truyền thông.
          </p>
        </div>
      </section>

      {/* Reusing BlogSection */}
      <div className="py-8">
        <BlogSection posts={posts} />
      </div>

      <ContactSection />
      <PublicFooter />
    </main>
  );
}
