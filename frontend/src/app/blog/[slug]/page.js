import PublicNavbar from "../../../components/public/PublicNavbar";
import PublicFooter from "../../../components/public/PublicFooter";
import ContactSection from "../../../components/public/ContactSection";
import { ArrowLeft, Clock, Calendar, User, Share2, Link as LinkIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { sanitizeHtml } from "../../../utils/sanitize";

async function getPostData(slug) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
    const res = await fetch(`${backendUrl}/api/posts/public/${slug}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data;
  } catch (error) {
    return null;
  }
}

export default async function BlogPostPage({ params }) {
  const resolvedParams = await params;
  const post = await getPostData(resolvedParams.slug);

  if (!post) {
    notFound();
  }

  const coverSrc = post.coverImage?.startsWith('/') 
    ? `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}${post.coverImage}` 
    : post.coverImage;

  return (
    <main className="min-h-screen bg-white selection:bg-idaz-orange selection:text-white">
      <PublicNavbar />

      {/* Hero Blog Article */}
      <section className="pt-36 pb-12 bg-white">
        <div className="max-w-4xl mx-auto px-6 md:px-8 w-full">
          <Link href="/blog" className="inline-flex items-center gap-2 text-idaz-text-muted hover:text-idaz-orange mb-10 text-sm transition-colors font-bold uppercase tracking-widest">
            <ArrowLeft size={16} />
            Quay lại Tin tức
          </Link>
          
          <div className="mb-6 flex flex-wrap gap-3">
            {post.category && (
              <span className="inline-block px-4 py-1.5 rounded-full bg-idaz-gray text-idaz-orange text-xs font-bold uppercase tracking-widest">
                {post.category}
              </span>
            )}
            {post.tags?.map(tag => (
              <span key={tag} className="inline-block px-4 py-1.5 rounded-full bg-gray-100 text-idaz-text-muted text-xs font-bold uppercase tracking-widest">
                {tag}
              </span>
            ))}
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black font-montserrat text-idaz-black mb-8 leading-[1.15] tracking-tight text-balance">
            {post.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-6 py-6 border-y border-gray-100 mb-12">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-idaz-orange/10 flex items-center justify-center text-idaz-orange">
                <User size={18} />
              </div>
              <span className="text-idaz-black font-bold">{post.author?.name || post.author || 'IDAZ Team'}</span>
            </div>
            
            <div className="h-4 w-px bg-gray-200 hidden md:block"></div>
            
            <div className="flex items-center gap-2 text-idaz-text-muted font-medium">
              <Calendar size={18} />
              {post.date || new Date(post.createdAt || Date.now()).toLocaleDateString('vi-VN')}
            </div>
            
            <div className="flex items-center gap-2 text-idaz-text-muted font-medium">
              <Clock size={18} />
              {post.readTime || '5 phút đọc'}
            </div>
          </div>
        </div>
      </section>

      {/* Cover Image */}
      {coverSrc && (
        <section className="max-w-6xl mx-auto px-6 md:px-8 w-full mb-20">
          <div className="rounded-[32px] overflow-hidden bg-gray-100 shadow-2xl relative">
            <div className="aspect-[21/9] w-full">
              <img 
                src={coverSrc} 
                alt={post.title} 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </section>
      )}

      {/* Article Content */}
      <section className="pb-32">
        <div className="max-w-3xl mx-auto px-6 md:px-8 w-full">
          
          {post.excerpt && (
            <p className="text-2xl text-idaz-black font-light leading-relaxed mb-12 italic border-l-4 border-idaz-orange pl-6 py-2">
              {post.excerpt}
            </p>
          )}

          <article className="prose prose-lg md:prose-xl prose-idaz max-w-none text-idaz-text-muted font-light leading-relaxed">
            {/* 
              Tự động parse HTML chuẩn sinh ra từ Wysiwyg Editor / Seed data 
              Class `prose-idaz` (tự định nghĩa trong global.css) sẽ handle style cho h2, h3, p, ul, li
            */}
            {post.content ? (
              <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }} />
            ) : (
              <p>Nội dung đang được cập nhật...</p>
            )}
          </article>
          
          {/* Share & Interactions */}
          <div className="mt-20 pt-10 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-8">
            <h3 className="text-xl font-bold font-montserrat text-idaz-black m-0">Chia sẻ bài viết</h3>
            <div className="flex gap-4">
              <button className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center text-idaz-text-muted hover:border-[#1877F2] hover:text-[#1877F2] hover:bg-[#1877F2]/5 transition-colors">
                <span className="font-bold text-xs">FB</span>
              </button>
              <button className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center text-idaz-text-muted hover:border-[#1DA1F2] hover:text-[#1DA1F2] hover:bg-[#1DA1F2]/5 transition-colors">
                <span className="font-bold text-xs">X</span>
              </button>
              <button className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center text-idaz-text-muted hover:border-[#0A66C2] hover:text-[#0A66C2] hover:bg-[#0A66C2]/5 transition-colors">
                <span className="font-bold text-xs">IN</span>
              </button>
              <button className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center text-idaz-text-muted hover:border-idaz-orange hover:text-idaz-orange hover:bg-idaz-orange/5 transition-colors">
                <LinkIcon size={20} />
              </button>
            </div>
          </div>
        </div>
      </section>

      <div id="contact">
        <ContactSection />
      </div>
      <PublicFooter />
    </main>
  );
}
