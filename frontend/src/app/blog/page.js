import PublicNavbar from "../../components/public/PublicNavbar";
import PublicFooter from "../../components/public/PublicFooter";
import ContactSection from "../../components/public/ContactSection";
import BlogContainer from "../../components/public/BlogContainer";
import api from "../../services/api";

export const revalidate = 60; // Cache 60s

export default async function BlogPage() {
  let posts = [];
  try {
    // Lấy 15 bài viết
    const { data } = await api.get('/posts/public?limit=15'); 
    if (data.success) {
      posts = data.data;
    }
  } catch (error) {
    console.error("Lỗi khi fetch bài viết:", error);
  }

  return (
    <main className="min-h-screen bg-[#F5F5F7] selection:bg-idaz-orange selection:text-white">
      <PublicNavbar />

      {/* Hero Mini */}
      <section className="pt-36 pb-20 bg-idaz-black relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-idaz-orange/20 via-transparent to-transparent opacity-50" />
        <div className="max-w-7xl mx-auto px-6 md:px-12 w-full relative z-10 text-center">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black font-montserrat text-white mb-6">
            Tạp chí <span className="text-idaz-orange">IDAZ</span>
          </h1>
          <p className="text-white/80 max-w-2xl mx-auto text-lg leading-relaxed font-light">
            Chia sẻ góc nhìn, kinh nghiệm thực chiến và cập nhật xu hướng mới nhất về thiết kế, công nghệ và truyền thông.
          </p>
        </div>
      </section>

      {/* Client Component chứa Widget Logic */}
      <BlogContainer initialPosts={posts} />

      <div id="contact">
        <ContactSection />
      </div>
      <PublicFooter />
    </main>
  );
}
