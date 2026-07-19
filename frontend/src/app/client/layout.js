"use client";

import { FolderKanban, Receipt, LayoutDashboard, LogOut, ImageIcon, ClipboardList, LifeBuoy, MessageSquare, Target, HelpCircle, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import NotificationCenter from "../../components/NotificationCenter";
import dynamic from 'next/dynamic';

const FloatingChat = dynamic(() => import('../../components/FloatingChat'), { ssr: false });
const ClientProfileModal = dynamic(() => import('../../components/ClientProfileModal'), { ssr: false });
import { useEffect, useState } from "react";

export default function ClientLayout({ children }) {
 const pathname = usePathname();
 const router = useRouter();
 const { user, loading, logout } = useAuth();
 const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
 const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
 
 // Protect route
 useEffect(() => {
 if (!loading) {
 if (!user) {
 router.push('/login');
 } else if (user.role !== 'client') {
 router.push('/admin/crm');
 }
 }
 }, [user, loading, router]);

 // Close mobile menu on route change
 useEffect(() => {
   setIsMobileMenuOpen(false);
 }, [pathname]);

 if (loading) return <div className="h-screen w-full bg-idaz-gray flex items-center justify-center text-gray-500">Loading...</div>;
 if (!user || user.role !== 'client') return null;


 const menuItems = [
 { name: "Tổng quan", icon: <LayoutDashboard size={20} />, path: "/client" },
 { name: "Tiến độ dự án", icon: <Target size={20} />, path: "/client/projects" },
 { name: "Khảo sát yêu cầu", icon: <ClipboardList size={20} />, path: "/client/brief" },
 { name: "Duyệt File / Thiết kế", icon: <MessageSquare size={20} />, path: "/client/feedbacks" },
 { name: "Kho Tài sản", icon: <FolderKanban size={20} />, path: "/client/assets" },
 { name: "Hóa đơn & Thanh toán", icon: <Receipt size={20} />, path: "/client/invoices" },
 { name: "Hỗ trợ (Tickets)", icon: <HelpCircle size={20} />, path: "/client/support" },
 { name: "Chat với Admin", icon: <MessageSquare size={20} />, path: "/client/chat" },
 ];

 return (
 <div className="min-h-screen bg-apple-light flex font-sans selection:bg-idaz-orange/30">
 
 {/* Mobile Overlay */}
 {isMobileMenuOpen && (
   <div 
     className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
     onClick={() => setIsMobileMenuOpen(false)}
   />
 )}

 {/* Sidebar Client */}
 <aside className={`fixed md:relative inset-y-0 left-0 w-64 m-4 h-[calc(100vh-2rem)] rounded-3xl glass-panel shadow-sm z-50 flex flex-col overflow-hidden transition-transform duration-300 md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-[120%]'}`}>
 <div className="h-24 flex items-center justify-between px-8 border-b border-gray-100/50">
  <Link href="/client" className="font-bold text-title-2 tracking-tighter text-idaz-black">
  Agency<span className="text-idaz-orange">.</span> Portal
  </Link>
  <button 
    className="md:hidden text-gray-500 hover:text-idaz-orange"
    onClick={() => setIsMobileMenuOpen(false)}
  >
    <X size={24} />
  </button>
 </div>
 
 <nav className="flex-1 py-8 px-4 space-y-2 overflow-y-auto custom-scrollbar">
 {menuItems.map((item) => {
 // Match exactly for /client, otherwise startsWith
 const isActive = item.path === '/client' ? pathname === '/client' : pathname.startsWith(item.path);
 return (
 <Link 
 key={item.name} 
 href={item.path}
 className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-idaz-orange-light text-idaz-orange-dark shadow-sm border border-orange-100 font-semibold' : 'text-gray-500 hover:bg-white/50 hover:text-idaz-black font-medium'}`}
 >
  {item.icon}
  <span className="text-footnote">{item.name}</span>
  </Link>
 )
 })}
 </nav>

 <div className="p-4 border-t border-gray-100/50 bg-white/30">
 <button 
 onClick={logout}
 className="flex items-center gap-3 px-4 py-3 w-full text-left text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all font-medium"
 >
  <LogOut size={20} />
  <span className="text-footnote">Đăng xuất</span>
  </button>
 </div>
 </aside>

 {/* Main Content */}
 <main className="flex-1 flex flex-col h-screen overflow-hidden">
 {/* Top Header */}
 <header className="h-20 mx-4 mt-4 mb-2 rounded-3xl glass-panel flex items-center justify-between px-4 md:px-8 shrink-0 shadow-sm z-10 sticky top-4">
  <div className="flex items-center gap-3">
    {/* Mobile Menu Toggle */}
    <button 
      className="md:hidden p-2 text-gray-500 hover:text-idaz-orange hover:bg-orange-50 rounded-xl transition-all"
      onClick={() => setIsMobileMenuOpen(true)}
    >
      <Menu size={24} />
    </button>
    
    <div className="hidden md:flex text-footnote font-medium text-gray-500 items-center gap-2">
      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
      Xin chào, {user?.name || "Quý khách"}
    </div>
    
    <div className="md:hidden font-bold text-headline tracking-tighter text-idaz-black">
      Agency<span className="text-idaz-orange">.</span>
    </div>
  </div>
 
 <div className="flex items-center gap-3 md:gap-4">
 <NotificationCenter />
  <div className="text-right hidden sm:block cursor-pointer" onClick={() => setIsProfileModalOpen(true)}>
  <div className="text-footnote font-bold text-idaz-black hover:text-idaz-orange transition-colors">{user?.name || "Client"}</div>
  <div className="text-caption-1 text-idaz-orange capitalize">Khách hàng</div>
  </div>
 <div 
 className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-idaz-orange-dark font-bold border border-orange-200 cursor-pointer hover:ring-2 hover:ring-orange-300 transition-all"
 onClick={() => setIsProfileModalOpen(true)}
 >
 {user?.avatar ? (
 <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover rounded-full" />
 ) : (
 user?.name?.charAt(0)?.toUpperCase() || "C"
 )}
 </div>
 </div>
 </header>

 {/* Page Content */}
 <div className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar">
 {children}
 </div>
 
 </main>

 {pathname !== '/client/chat' && <FloatingChat />}
 
 <ClientProfileModal 
 isOpen={isProfileModalOpen} 
 onClose={() => setIsProfileModalOpen(false)} 
 />
 </div>
 );
}
