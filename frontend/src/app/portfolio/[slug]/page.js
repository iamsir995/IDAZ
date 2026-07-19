import PublicNavbar from "../../../components/public/PublicNavbar";
import PublicFooter from "../../../components/public/PublicFooter";
import ContactSection from "../../../components/public/ContactSection";
import { ArrowLeft, ExternalLink, Calendar, User, Tag, Sparkles, FileText } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

async function getPortfolioData(slug) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
    const res = await fetch(`${backendUrl}/api/portfolios/public/${slug}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data;
  } catch (error) {
    return null;
  }
}

export default async function PortfolioDetailPage({ params }) {
  const resolvedParams = await params;
  const project = await getPortfolioData(resolvedParams.slug);

  if (!project) {
    notFound();
  }

  const coverSrc = project.coverImage?.startsWith('/') 
    ? `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}${project.coverImage}` 
    : project.coverImage;

  return (
    <main className="min-h-screen bg-white selection:bg-idaz-orange selection:text-white">
      <PublicNavbar />

      {/* Hero Full Screen Immersive */}
      <section className="relative w-full h-[80vh] min-h-[600px] flex items-end pb-24 overflow-hidden bg-idaz-black">
        {coverSrc && (
          <div className="absolute inset-0 z-0">
            <img 
              src={coverSrc} 
              alt={project.title} 
              className="w-full h-full object-cover opacity-60 scale-105 hover:scale-100 transition-transform duration-[2s] ease-out" 
            />
            {/* Liquid Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-idaz-black via-idaz-black/40 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-idaz-black/80 to-transparent"></div>
          </div>
        )}
        
        <div className="max-w-7xl mx-auto px-6 md:px-12 w-full relative z-10">
          <Link href="/portfolio" className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-8 text-sm font-bold uppercase tracking-widest transition-colors backdrop-blur-md bg-black/20 px-4 py-2 rounded-full border border-white/10">
            <ArrowLeft size={16} />
            Quay lại Portfolio
          </Link>
          
          <div className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <span className="inline-block px-4 py-1.5 rounded-full bg-idaz-orange text-white text-xs font-bold uppercase tracking-widest shadow-lg shadow-idaz-orange/30" >
                {project.category}
              </span>
              {project.isFeatured && (
                <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-bold uppercase tracking-widest" >
                  Featured
                </span>
              )}
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black font-montserrat text-white mb-8 leading-[1.1] tracking-tight text-balance">
              {project.title}
            </h1>
          </div>
        </div>
      </section>

      {/* Meta Data Bar - Glassmorphism */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 w-full relative z-20 -mt-12">
        <div className="glass-panel bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-white flex flex-wrap lg:flex-nowrap gap-8 lg:gap-16 justify-between items-center">
          
          <div className="flex-1 min-w-[200px]">
            <div className="text-idaz-text-muted text-xs uppercase tracking-widest font-bold mb-2 flex items-center gap-2"><User size={14}/> Khách hàng</div>
            <div className="text-idaz-black font-bold text-lg">{project.clientName || 'Đang cập nhật'}</div>
          </div>
          
          <div className="flex-1 min-w-[150px]">
            <div className="text-idaz-text-muted text-xs uppercase tracking-widest font-bold mb-2 flex items-center gap-2"><Calendar size={14}/> Năm thực hiện</div>
            <div className="text-idaz-black font-bold text-lg">{new Date(project.createdAt).getFullYear()}</div>
          </div>
          
          <div className="flex-1 min-w-[250px]">
            <div className="text-idaz-text-muted text-xs uppercase tracking-widest font-bold mb-2 flex items-center gap-2"><Tag size={14}/> Công nghệ / Services</div>
            <div className="flex flex-wrap gap-2">
              {project.tags?.length > 0 ? project.tags.map(tag => (
                <span key={tag} className="text-sm font-semibold bg-gray-100 text-gray-700 px-3 py-1 rounded-full">{tag}</span>
              )) : <span className="text-idaz-black font-bold text-lg">-</span>}
            </div>
          </div>

          {project.projectUrl && (
            <div className="flex-shrink-0">
              <a 
                href={project.projectUrl} 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-idaz-black text-white rounded-xl font-bold hover:bg-idaz-orange transition-colors"
              >
                Xem trực tiếp <ExternalLink size={18} />
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <section className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6 md:px-12 w-full">
          
          <div className="grid lg:grid-cols-[1fr_400px] gap-16 lg:gap-24">
            {/* Main Content Area */}
            <div className="space-y-16">
              
              {/* Overview / Description */}
              <div>
                <h3 className="text-sm font-bold font-montserrat text-idaz-orange uppercase tracking-widest mb-4">Tổng quan</h3>
                <p className="text-idaz-text-muted text-xl md:text-2xl leading-relaxed font-light">
                  {project.description}
                </p>
              </div>

              {/* Conditional rendering for detailed sections */}
              {(project.challenge || project.solution || project.results) && (
                <div className="w-full h-px bg-gray-200"></div>
              )}

              {project.challenge && (
                <div>
                  <h3 className="text-3xl font-black font-montserrat text-idaz-black mb-6">Thách thức</h3>
                  <p className="text-idaz-text-muted text-lg leading-relaxed whitespace-pre-wrap">
                    {project.challenge}
                  </p>
                </div>
              )}

              {project.solution && (
                <div>
                  <h3 className="text-3xl font-black font-montserrat text-idaz-black mb-6">Giải pháp IDAZ</h3>
                  <p className="text-idaz-text-muted text-lg leading-relaxed whitespace-pre-wrap">
                    {project.solution}
                  </p>
                </div>
              )}

              {project.results && (
                <div className="bg-idaz-gray p-10 rounded-[32px] border border-gray-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-idaz-orange/10 rounded-full blur-3xl"></div>
                  <h3 className="text-3xl font-black font-montserrat text-idaz-black mb-6 relative z-10">Kết quả Đạt được</h3>
                  <p className="text-idaz-text-muted text-lg leading-relaxed whitespace-pre-wrap relative z-10">
                    {project.results}
                  </p>
                </div>
              )}
            </div>

            {/* Sidebar / Additional Images */}
            <div className="space-y-8">
              {project.images && project.images.length > 0 ? (
                project.images.map((img, idx) => {
                  const fullUrl = img.startsWith('/') ? `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}${img}` : img;
                  const isDocument = img.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx)$/i);
                  return (
                    <div key={idx} className="rounded-3xl overflow-hidden bg-gray-100 flex items-center justify-center">
                      {isDocument ? (
                        <a href={fullUrl} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center p-12 w-full text-indigo-500 hover:bg-indigo-50 transition-colors">
                          <FileText size={64} className="mb-4" />
                          <span className="text-sm font-bold text-gray-700 text-center break-all">{img.split('/').pop()}</span>
                          <span className="text-xs text-indigo-600 font-bold mt-2 bg-indigo-100 px-3 py-1 rounded-full">Bấm để tải xuống</span>
                        </a>
                      ) : (
                        <img 
                          src={fullUrl} 
                          alt={`${project.title} - Preview ${idx + 1}`}
                          className="w-full h-auto object-cover hover:scale-105 transition-transform duration-500"
                        />
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="glass-panel p-8 rounded-3xl border border-gray-200 bg-gray-50 text-center">
                  <div className="w-16 h-16 bg-idaz-orange/10 text-idaz-orange rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sparkles size={24} />
                  </div>
                  <h4 className="font-bold text-idaz-black mb-2">Dự án Độc bản</h4>
                  <p className="text-sm text-idaz-text-muted leading-relaxed">
                    Mọi chi tiết trong thiết kế này đều được tinh chỉnh riêng biệt dựa trên DNA của thương hiệu.
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* Call to action */}
      <section className="py-24 bg-idaz-black relative overflow-hidden text-center">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-idaz-orange via-transparent to-transparent"></div>
        <div className="max-w-3xl mx-auto px-6 relative z-10">
          <h2 className="text-4xl md:text-5xl font-black font-montserrat text-white mb-6">Bạn muốn tạo ra một sản phẩm tương tự?</h2>
          <p className="text-white/70 text-lg mb-10">Hãy để IDAZ biến ý tưởng của bạn thành hiện thực với chất lượng quốc tế.</p>
          <Link href="#contact" className="inline-flex items-center justify-center px-10 py-5 bg-white text-idaz-black rounded-full font-bold hover:bg-idaz-orange hover:text-white transition-colors text-lg">
            Khởi động Dự án
          </Link>
        </div>
      </section>

      <div id="contact">
        <ContactSection />
      </div>
      <PublicFooter />
    </main>
  );
}
