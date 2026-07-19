"use client";

import { LayoutDashboard, Users, FolderKanban, Receipt, Link as LinkIcon, CheckSquare, MessageSquare, Briefcase, PlusSquare, Menu, X, Bell, Settings, User, Headphones, LogOut, FileText, Lock, Edit3, Image as ImageIcon, Video, Folder, Box, ClipboardList, LifeBuoy, Disc2 } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import dynamic from 'next/dynamic';
const NotificationCenter = dynamic(() => import('../../components/NotificationCenter'), { ssr: false });
import { useEffect, useState } from "react";

export default function AdminLayout({ children }) {
 const pathname = usePathname();
 const router = useRouter();
 const { user, loading, logout } = useAuth();
 const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
 
 useEffect(() => {
 if (!loading) {
 if (!user) {
 router.push('/login');
 } else if (['client'].includes(user.role)) {
 router.push('/client');
 }
 }
 }, [user, loading, router]);

 // Close mobile menu on route change
 useEffect(() => {
   setIsMobileMenuOpen(false);
 }, [pathname]);

 if (loading) return <div className="h-screen w-full bg-white flex items-center justify-center text-idaz-black">Loading...</div>;
 if (!user || ['client'].includes(user.role)) return null; // Tránh flash content


 const menuGroups = [
 {
 title: "Tổng quan",
 items: [
 { name: "Dashboard", icon: <LayoutDashboard size={20} />, path: "/admin" },
 ]
 },
 {
 title: "CRM & Sales",
 items: [
 { name: "Khách hàng", icon: <Users size={20} />, path: "/admin/crm" },
 { name: "Bản yêu cầu (Briefs)", icon: <ClipboardList size={20} />, path: "/admin/briefs" },
 { name: "Hóa đơn & Thanh toán", icon: <Receipt size={20} />, path: "/admin/billing" },
 { name: "Hỗ trợ (Tickets)", icon: <LifeBuoy size={20} />, path: "/admin/support" },
 ]
 },
 {
 title: "Sản xuất & Dự án",
 items: [
 { name: "Dự án", icon: <FolderKanban size={20} />, path: "/admin/projects" },
 { name: "Nhiệm vụ (Tasks)", icon: <CheckSquare size={20} />, path: "/admin/tasks" },
 { name: "Tài nguyên (Assets)", icon: <ImageIcon size={20} />, path: "/admin/assets" },
 ]
 },
 {
 title: "Giao tiếp",
 items: [
 { name: "Workspace Chat", icon: <MessageSquare size={20} />, path: "/admin/chat" },
 { name: "Video Call", icon: <Disc2 size={20} />, path: "/admin/recordings" },
 ]
 },
 {
 title: "Website Public",
 items: [
 { name: "Quản lý Bài viết", icon: <CheckSquare size={20} />, path: "/admin/blog" },
 { name: "Dịch vụ (Services)", icon: <Box size={20} />, path: "/admin/services" },
 { name: "Dự án Dịch vụ", icon: <FolderKanban size={20} />, path: "/admin/portfolio" },
 ]
 },
 {
 title: "Hệ thống",
 items: [
 { name: "Quản lý Đội ngũ", icon: <Users size={20} />, path: "/admin/team" },
 { name: "Hồ sơ cá nhân", icon: <Settings size={20} />, path: "/admin/profile" },
 { name: "Cài đặt", icon: <Settings size={20} />, path: "/admin/settings" },
 ]
 }
 ];

 return (
 <div className="min-h-screen bg-apple-light flex font-sans selection:bg-idaz-orange/30 text-idaz-black">
 
 {/* Mobile Overlay */}
 {isMobileMenuOpen && (
   <div 
     className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
     onClick={() => setIsMobileMenuOpen(false)}
   />
 )}

 {/* Sidebar Admin (Glassmorphism & IDAZ Style) */}
 <aside className={`fixed md:relative inset-y-0 left-0 w-72 m-4 h-[calc(100vh-2rem)] rounded-3xl glass-panel z-50 flex flex-col overflow-hidden transition-transform duration-300 md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-[120%]'}`}>
 <div className="h-24 flex items-center justify-between px-8 border-b border-gray-100/50">
 <Link href="/admin" className="font-black font-montserrat text-title-2 tracking-tighter text-idaz-black">
 IDAZ<span className="text-idaz-orange">.</span> Admin
 </Link>
 <button 
   className="md:hidden text-gray-500 hover:text-idaz-orange"
   onClick={() => setIsMobileMenuOpen(false)}
 >
   <X size={24} />
 </button>
 </div>
 
 <nav className="flex-1 py-6 px-4 space-y-6 overflow-y-auto custom-scrollbar">
 {menuGroups.map((group, idx) => (
 <div key={idx}>
 <div className="text-caption-2 font-bold text-gray-400 uppercase tracking-widest mb-3 px-4">
 {group.title}
 </div>
 <div className="space-y-1">
 {group.items.map((item) => {
 const isActive = item.path === '/admin' ? pathname === '/admin' : pathname.startsWith(item.path);
 return (
 <Link 
 key={item.name} 
 href={item.path}
 className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-footnote ${
 isActive 
 ? 'bg-idaz-orange-light text-idaz-orange shadow-sm' 
 : 'text-gray-500 hover:bg-gray-50 hover:text-idaz-black'
 }`}
 >
 {item.icon}
 <span>{item.name}</span>
 </Link>
 )
 })}
 </div>
 </div>
 ))}
 </nav>

 <div className="p-4 border-t border-gray-100/50 bg-white/30">
 <button 
 onClick={logout}
 className="flex items-center gap-3 px-4 py-3 w-full text-left text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all font-medium text-footnote"
 >
 <LogOut size={20} />
 <span>Đăng xuất</span>
 </button>
 </div>
 </aside>

 {/* Main Content */}
 <main className="flex-1 flex flex-col h-screen overflow-hidden">
 {/* Top Header */}
 <header className="h-20 mx-4 mt-4 mb-2 rounded-3xl glass-panel flex items-center justify-between px-4 md:px-8 shrink-0 z-10 sticky top-4">
 <div className="flex items-center gap-3">
   {/* Mobile Menu Toggle */}
   <button 
     className="md:hidden p-2 text-gray-500 hover:text-idaz-orange hover:bg-orange-50 rounded-xl transition-all"
     onClick={() => setIsMobileMenuOpen(true)}
   >
     <Menu size={24} />
   </button>
   
   <div className="hidden md:flex font-semibold text-gray-500 items-center gap-2 text-footnote">
     <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
     Hệ thống IDAZ đang trực tuyến
   </div>
   <div className="md:hidden font-black font-montserrat text-headline tracking-tighter text-idaz-black">
     IDAZ<span className="text-idaz-orange">.</span>
   </div>
 </div>
 
 <div className="flex items-center gap-3 md:gap-5">
 <NotificationCenter />
 <div className="w-px h-8 bg-gray-200 hidden sm:block"></div>
 <div className="text-right hidden sm:block">
 <div className="text-footnote font-bold text-idaz-black">{user?.name || "Admin"}</div>
 <div className="text-caption-1 text-idaz-orange font-medium capitalize">{user?.role || "Quản trị viên"}</div>
 </div>
 <Link href="/admin/profile">
 <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-idaz-orange to-idaz-orange-dark flex items-center justify-center text-idaz-black font-bold cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all overflow-hidden border-2 border-white ring-2 ring-gray-100">
 {user?.avatar ? (
 <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
 ) : (
 user?.name?.charAt(0)?.toUpperCase() || "A"
 )}
 </div>
 </Link>
 </div>
 </header>

 {/* Page Content */}
 <div className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar">
 {children}
 </div>
 </main>
 </div>
 );
}
