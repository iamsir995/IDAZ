import PublicNavbar from "../../../components/public/PublicNavbar";
import PublicFooter from "../../../components/public/PublicFooter";
import ContactSection from "../../../components/public/ContactSection";
import { ArrowLeft, ExternalLink } from "lucide-react";
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

 return (
 <main className="min-h-screen bg-white">
 <PublicNavbar />

 {/* Hero Mini */}
 <section className={`pt-36 pb-20 relative bg-idaz-black overflow-hidden`}>
 {project.coverImage && (
 <div className="absolute inset-0 z-0">
 <img src={project.coverImage} alt={project.title} className="w-full h-full object-cover opacity-40" />
 <div className="absolute inset-0 bg-gradient-to-t from-idaz-black via-idaz-black/60 to-transparent"></div>
 </div>
 )}
 <div className="max-w-7xl mx-auto px-6 md:px-12 w-full relative z-10">
 <Link href="/portfolio" className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-6 text-sm transition-colors">
 <ArrowLeft size={16} />
 Quay lại Portfolio
 </Link>
 
 <div className="grid lg:grid-cols-2 gap-12 items-end">
 <div>
 <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold mb-4" >
 {project.category}
 </span>
 <h1 className="text-4xl md:text-6xl lg:text-7xl font-black font-montserrat text-white mb-4 text-3xl md:text-5xl">{project.title}</h1>
 </div>
 
 <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 bg-black/40 p-6 rounded-2xl backdrop-blur-md border border-white/10">
 <div>
 <div className="text-white/50 text-xs uppercase tracking-widest font-bold mb-1">Khách hàng</div>
 <div className="text-white font-semibold text-sm">{project.clientName}</div>
 </div>
 <div>
 <div className="text-white/50 text-xs uppercase tracking-widest font-bold mb-1">Thời gian</div>
 <div className="text-white font-semibold text-sm">{new Date(project.createdAt).getFullYear()}</div>
 </div>
 <div className="col-span-2 sm:col-span-1">
 <div className="text-white/50 text-xs uppercase tracking-widest font-bold mb-1">Tags</div>
 <div className="text-white font-semibold text-sm leading-snug">
 {project.tags?.join(", ") || "-"}
 </div>
 </div>
 </div>
 </div>
 </div>
 </section>

 {/* Content */}
 <section className="py-20 md:py-32">
 <div className="max-w-7xl mx-auto px-6 md:px-12 w-full max-w-4xl">
 <div className="space-y-12">
 <div>
 <h3 className="text-xl font-bold font-montserrat text-idaz-black mb-4 flex items-center gap-2">
 <span className="w-8 h-1 bg-idaz-orange inline-block"></span>
 Thách thức
 </h3>
 <p className="text-idaz-text-muted text-lg leading-relaxed">
 {project.challenge}
 </p>
 </div>
 
 <div>
 <h3 className="text-xl font-bold font-montserrat text-idaz-black mb-4 flex items-center gap-2">
 <span className="w-8 h-1 bg-idaz-orange inline-block"></span>
 Giải pháp IDAZ
 </h3>
 <p className="text-idaz-text-muted text-lg leading-relaxed whitespace-pre-wrap">
 {project.solution}
 </p>
 </div>
 
 <div className="bg-idaz-gray p-8 rounded-2xl border border-gray-100">
 <h3 className="text-xl font-bold font-montserrat text-idaz-black mb-4 text-idaz-orange">Kết quả</h3>
 <p className="text-idaz-black font-semibold text-lg leading-relaxed whitespace-pre-wrap">
 {project.results}
 </p>
 </div>
 
 {project.images && project.images.length > 0 && (
 <div className="grid gap-6 mt-12">
 {project.images.map((img, idx) => (
 <img key={idx} src={img} alt={`${project.title} detail ${idx + 1}`} className="w-full h-auto rounded-2xl" />
 ))}
 </div>
 )}
 </div>
 
 <div className="mt-16 text-center">
 <Link href="/lien-he" className="inline-flex items-center gap-2 bg-idaz-orange text-white font-bold px-6 py-3 rounded-xl transition-all hover:bg-idaz-orange-dark hover:shadow-lg hover:shadow-orange-500/30">
 Bắt đầu dự án tương tự
 </Link>
 </div>
 </div>
 </section>

 <ContactSection />
 <PublicFooter />
 </main>
 );
}
