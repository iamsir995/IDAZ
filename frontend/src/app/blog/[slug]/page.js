import PublicNavbar from "../../../components/public/PublicNavbar";
import PublicFooter from "../../../components/public/PublicFooter";
import ContactSection from "../../../components/public/ContactSection";
import { ArrowLeft, Clock, Calendar, User } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

// Mock blog database
const blogData = {
 "xu-huong-thiet-ke-logo-2024": {
 title: "7 xu hướng thiết kế logo năm 2024 mà mọi thương hiệu cần biết",
 category: "Branding",
 date: "15 tháng 6, 2024",
 readTime: "5 phút",
 author: "Lê Minh Quân",
 content: `
 Năm 2024 chứng kiến sự chuyển mình mạnh mẽ trong phong cách thiết kế nhận diện thương hiệu. Các doanh nghiệp ngày càng hướng tới sự tối giản, nhưng vẫn đảm bảo tính độc bản và khả năng linh hoạt trên môi trường số.
 
 Dưới đây là 7 xu hướng đáng chú ý nhất:
 
 1. Tối giản hóa (Minimalism) tiếp tục lên ngôi.
 2. Typography sáng tạo và có thể tùy biến (Variable Fonts).
 3. Sự trở lại của phong cách Y2K và Retro.
 4. Logo động (Animated Logos) tối ưu cho nền tảng digital.
 5. Không gian âm (Negative Space) được tận dụng triệt để.
 6. Hình học cơ bản kết hợp màu sắc tương phản mạnh.
 7. Tích hợp AI trong quá trình lên ý tưởng.
 
 Đối với các doanh nghiệp Việt Nam, việc nắm bắt những xu hướng này sẽ giúp thương hiệu luôn tươi mới và không bị tụt hậu so với đối thủ cạnh tranh.
 `,
 color: "#F5A623"
 },
 "website-chuẩn-seo-la-gi": {
 title: "Website chuẩn SEO là gì? Checklist 20 điểm cần kiểm tra ngay",
 category: "Website",
 date: "8 tháng 6, 2024",
 readTime: "8 phút",
 author: "Phạm Tuấn Anh",
 content: `
 Một website thiết kế đẹp chỉ là bước khởi đầu. Để thu hút khách hàng tiềm năng, website của bạn cần phải "thân thiện" với các công cụ tìm kiếm, đặc biệt là Google.
 
 Website chuẩn SEO không chỉ xoay quanh từ khóa, mà còn liên quan mật thiết đến cấu trúc kỹ thuật và trải nghiệm người dùng (UX). 
 
 Một số yếu tố cốt lõi bao gồm:
 - Tốc độ tải trang (Page Speed) dưới 3 giây.
 - Thân thiện với thiết bị di động (Mobile-friendly).
 - Cấu trúc URL rõ ràng, chứa từ khóa.
 - Thẻ Meta Title và Description tối ưu.
 - Sử dụng thẻ Heading (H1, H2, H3) đúng cách.
 - Tối ưu hóa dung lượng hình ảnh và thẻ Alt.
 - Sơ đồ trang web (Sitemap.xml) và file Robots.txt hợp lệ.
 
 Hãy kiểm tra ngay website của bạn theo những tiêu chí này!
 `,
 color: "#3B82F6"
 }
};

export default async function BlogPostPage({ params }) {
 const resolvedParams = await params;
 const post = blogData[resolvedParams.slug];

 if (!post) {
 notFound();
 }

 return (
 <main className="min-h-screen bg-white">
 <PublicNavbar />

 {/* Hero Mini */}
 <section className="pt-36 pb-16 bg-idaz-gray">
 <div className="max-w-7xl mx-auto px-6 md:px-12 w-full max-w-4xl">
 <Link href="/blog" className="inline-flex items-center gap-2 text-idaz-text-muted hover:text-idaz-orange mb-8 text-sm transition-colors font-medium">
 <ArrowLeft size={16} />
 Quay lại Blog
 </Link>
 
 <div className="mb-6 flex flex-wrap gap-4">
 <span className="inline-block px-3 py-1 rounded-full text-white text-xs font-bold" style={{ background: post.color, }}>
 {post.category}
 </span>
 </div>
 
 <h1 className="text-3xl md:text-4xl font-black font-montserrat text-idaz-black mb-6 md:text-4xl leading-tight">
 {post.title}
 </h1>
 
 <div className="flex flex-wrap items-center gap-6 border-t border-gray-200 pt-6">
 <div className="flex items-center gap-2 text-idaz-text-muted text-sm font-medium">
 <User size={16} />
 {post.author}
 </div>
 <div className="flex items-center gap-2 text-idaz-text-muted text-sm font-medium">
 <Calendar size={16} />
 {post.date}
 </div>
 <div className="flex items-center gap-2 text-idaz-text-muted text-sm font-medium">
 <Clock size={16} />
 {post.readTime}
 </div>
 </div>
 </div>
 </section>

 {/* Content */}
 <section className="py-20 md:py-32">
 <div className="max-w-7xl mx-auto px-6 md:px-12 w-full max-w-3xl">
 <article className="prose prose-lg prose-orange max-w-none">
 {/* Simple text formatting for mock data */}
 {post.content.split('\n').map((paragraph, idx) => {
 if (!paragraph.trim()) return null;
 
 // Simple list rendering
 if (paragraph.trim().match(/^- |\d+\./)) {
 return (
 <p key={idx} className="flex items-start gap-2 text-idaz-black text-lg leading-relaxed mb-4 font-semibold">
 {paragraph.trim()}
 </p>
 )
 }
 
 return (
 <p key={idx} className="text-idaz-text-muted text-lg leading-relaxed mb-6">
 {paragraph.trim()}
 </p>
 )
 })}
 </article>
 
 <div className="mt-16 pt-8 border-t border-gray-200">
 <h3 className="text-xl font-bold font-montserrat text-idaz-black mb-6">Chia sẻ bài viết</h3>
 <div className="flex gap-4">
 <button className="px-6 py-2 rounded-full border border-gray-200 text-sm font-bold hover:border-idaz-orange hover:text-idaz-orange transition-colors">Facebook</button>
 <button className="px-6 py-2 rounded-full border border-gray-200 text-sm font-bold hover:border-idaz-orange hover:text-idaz-orange transition-colors">LinkedIn</button>
 <button className="px-6 py-2 rounded-full border border-gray-200 text-sm font-bold hover:border-idaz-orange hover:text-idaz-orange transition-colors">Copy Link</button>
 </div>
 </div>
 </div>
 </section>

 <ContactSection />
 <PublicFooter />
 </main>
 );
}
