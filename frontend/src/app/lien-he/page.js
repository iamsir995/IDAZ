"use client";
import PublicNavbar from "../../components/public/PublicNavbar";
import PublicFooter from "../../components/public/PublicFooter";
import ContactSection from "../../components/public/ContactSection";

export default function ContactPage() {
 return (
 <main className="min-h-screen bg-white flex flex-col">
 <PublicNavbar />

 {/* Hero Mini */}
 <section className="pt-36 pb-8 bg-idaz-black">
 {/* We keep this section very minimal since the ContactSection itself has a dark background and looks like a hero */}
 </section>

 {/* Reusing ContactSection */}
 <div className="flex-1">
 <ContactSection />
 </div>
 
 {/* Map or Office Image placeholder */}
 <section className="h-[400px] w-full bg-gray-200 relative">
 <img 
 src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=2000" 
 alt="IDAZ Office" 
 className="w-full h-full object-cover grayscale" 
 />
 <div className="absolute inset-0 bg-black/20" />
 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-8 py-6 rounded-2xl shadow-xl text-center">
 <h4 className="text-xl font-bold font-montserrat text-idaz-black mb-2">Trụ sở IDAZ</h4>
 <p className="text-idaz-text-muted text-sm">Quận 1, TP. Hồ Chí Minh, Việt Nam</p>
 </div>
 </section>

 <PublicFooter />
 </main>
 );
}
