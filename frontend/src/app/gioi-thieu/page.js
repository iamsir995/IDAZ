import PublicNavbar from "../../components/public/PublicNavbar";
import PublicFooter from "../../components/public/PublicFooter";
import WhyUsSection from "../../components/public/WhyUsSection";
import TestimonialsSection from "../../components/public/TestimonialsSection";
import { ArrowRight, Trophy, Users, Globe, Target } from "lucide-react";
import Link from "next/link";

const stats = [
 { label: "Năm hình thành", value: "2019" },
 { label: "Nhân sự chuyên môn", value: "45+" },
 { label: "Giải thưởng thiết kế", value: "12" },
 { label: "Đối tác quốc tế", value: "8" },
];

const team = [
 { name: "Lê Minh Quân", role: "Creative Director", img: "https://i.pravatar.cc/300?img=11" },
 { name: "Trần Bảo Ngọc", role: "Lead Brand Strategist", img: "https://i.pravatar.cc/300?img=5" },
 { name: "Phạm Tuấn Anh", role: "Head of Digital UI/UX", img: "https://i.pravatar.cc/300?img=12" },
 { name: "Nguyễn Hương Giang", role: "Marketing Director", img: "https://i.pravatar.cc/300?img=9" },
];

export default function AboutPage() {
 return (
 <main className="min-h-screen bg-white">
 <PublicNavbar />

 {/* Hero Section */}
 <section className="pt-36 pb-20 bg-gradient-to-br from-idaz-black to-gray-900 relative overflow-hidden">
 {/* Overlay mesh */}
 <div className="absolute inset-0 bg-black/40" />
 <div className="max-w-7xl mx-auto px-6 md:px-12 w-full relative z-10 text-center">
 <div className="inline-flex items-center justify-center gap-2 mb-4 px-4 py-1.5 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm">
 <span className="w-2 h-2 rounded-full bg-idaz-orange animate-pulse" />
 <span className="text-white text-xs font-bold tracking-widest uppercase">Câu chuyện IDAZ</span>
 </div>
 <h1 className="text-4xl md:text-6xl lg:text-7xl font-black font-montserrat text-white mb-6">
 Đằng sau mỗi <span className="text-idaz-orange">thương hiệu lớn</span>
 <br /> là một chiến lược vững chắc.
 </h1>
 <p className="text-white/80 max-w-2xl mx-auto text-lg leading-relaxed">
 Chúng tôi sinh ra với sứ mệnh kiến tạo những thương hiệu dẫn đầu, kết hợp giữa nghệ thuật thị giác và tư duy kinh doanh sắc bén.
 </p>
 </div>
 </section>

 {/* Story & Vision */}
 <section className="py-20 md:py-32">
 <div className="max-w-7xl mx-auto px-6 md:px-12 w-full">
 <div className="grid lg:grid-cols-2 gap-16 items-center">
 <div>
 <div className="text-sm font-bold text-idaz-orange uppercase tracking-wider mb-2">Về chúng tôi</div>
 <h2 className="text-3xl md:text-4xl font-black font-montserrat text-idaz-black mt-2 mb-6">Hành trình từ đam mê đến sự <span className="text-idaz-orange">chuyên nghiệp</span>.</h2>
 <div className="space-y-4 text-base text-idaz-text-muted leading-relaxed">
 <p>
 Thành lập từ năm 2019, IDAZ BRANDING bắt đầu như một studio thiết kế nhỏ với khát khao nâng tầm chất lượng nhận diện thương hiệu tại Việt Nam.
 </p>
 <p>
 Chúng tôi nhận ra rằng: Rất nhiều doanh nghiệp có sản phẩm tuyệt vời nhưng lại thất bại trong việc truyền tải giá trị đó đến khách hàng vì hình ảnh thiếu nhất quán và thiếu điểm chạm chiến lược.
 </p>
 <p>
 Ngày nay, IDAZ tự hào là một Creative Agency toàn diện, cung cấp giải pháp từ A-Z cho hơn 200+ doanh nghiệp. Chúng tôi không bán logo, chúng tôi xây dựng nền móng để doanh nghiệp của bạn phát triển trường tồn.
 </p>
 </div>
 <div className="mt-8 flex gap-4">
 <Link href="/portfolio" className="inline-flex items-center gap-2 bg-idaz-orange text-white font-bold px-6 py-3 rounded-xl transition-all hover:bg-idaz-orange-dark hover:shadow-lg hover:shadow-orange-500/30">Xem dự án</Link>
 <Link href="/lien-he" className="inline-flex items-center gap-2 border-2 border-idaz-gray-mid text-idaz-black font-bold px-6 py-3 rounded-xl transition-all hover:border-idaz-black hover:bg-idaz-black hover:text-white">Liên hệ với chúng tôi</Link>
 </div>
 </div>
 
 {/* Mission/Vision grid */}
 <div className="grid grid-cols-2 gap-4">
 {[
 { icon: Target, title: "Sứ mệnh", desc: "Giúp doanh nghiệp Việt Nam tỏa sáng qua ngôn ngữ thiết kế." },
 { icon: Globe, title: "Tầm nhìn", desc: "Trở thành Top 10 Creative Agency hàng đầu Đông Nam Á vào năm 2030." },
 { icon: Trophy, title: "Giá trị", desc: "Độc bản - Thực chiến - Tận tâm." },
 { icon: Users, title: "Văn hóa", desc: "Tôn trọng sự sáng tạo và đề cao kỷ luật thực thi." },
 ].map((item, i) => (
 <div key={i} className="p-6 rounded-2xl bg-idaz-gray border border-gray-100 hover:border-orange-200 transition-colors">
 <item.icon size={28} className="text-idaz-orange mb-4" />
 <h4 className="font-bold text-lg mb-2 text-idaz-black font-['Montserrat']">{item.title}</h4>
 <p className="text-sm text-idaz-text-muted leading-relaxed">{item.desc}</p>
 </div>
 ))}
 </div>
 </div>
 </div>
 </section>

 {/* Stats */}
 <section className="py-16 bg-idaz-black text-white">
 <div className="max-w-7xl mx-auto px-6 md:px-12 w-full">
 <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-white/10">
 {stats.map((stat, i) => (
 <div key={i} className="text-center px-4">
 <div className="text-4xl md:text-5xl font-black mb-2 text-idaz-orange font-['Montserrat']">
 {stat.value}
 </div>
 <div className="text-sm text-white/60 uppercase tracking-widest font-bold">
 {stat.label}
 </div>
 </div>
 ))}
 </div>
 </div>
 </section>

 {/* Team */}
 <section className="py-20 md:py-32 bg-idaz-gray">
 <div className="max-w-7xl mx-auto px-6 md:px-12 w-full">
 <div className="text-center mb-16">
 <div className="text-sm font-bold text-idaz-orange uppercase tracking-wider mb-2 justify-center">Đội ngũ nòng cốt</div>
 <h2 className="text-3xl md:text-4xl font-black font-montserrat text-idaz-black mt-2">Gặp gỡ những <span className="text-idaz-orange">khối óc sáng tạo</span></h2>
 </div>

 <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
 {team.map((member, i) => (
 <div key={i} className="group rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300">
 <div className="aspect-[4/5] overflow-hidden relative bg-gray-200">
 <img src={member.img} alt={member.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 group-hover:scale-105" />
 {/* Overlay */}
 <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
 <p className="text-white text-sm font-semibold italic">"We design for business growth."</p>
 </div>
 </div>
 <div className="p-5 text-center">
 <h3 className="font-bold text-lg font-['Montserrat'] text-idaz-black">{member.name}</h3>
 <p className="text-sm text-idaz-orange font-semibold mt-1">{member.role}</p>
 </div>
 </div>
 ))}
 </div>
 </div>
 </section>

 {/* Reused sections */}
 <WhyUsSection />
 <TestimonialsSection />
 <PublicFooter />
 </main>
 );
}
