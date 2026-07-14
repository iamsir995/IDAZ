"use client";

import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { FolderKanban, CheckCircle, Receipt, ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState, useRef, useCallback } from "react";
import api from "../../services/api";

export default function ClientDashboard() {
 const { user } = useAuth();
 const { subscribe } = useSocket();
 const componentId = useRef(`client-dash-${Date.now()}`).current;
 const [statsData, setStatsData] = useState({ activeProjects: 0, pendingTasks: 0, unpaidInvoices: 0 });
 const [recentProjects, setRecentProjects] = useState([]);
 const [notifications, setNotifications] = useState([]);

 const fetchData = useCallback(async () => {
 try {
 const [statsRes, invoicesRes, projectsRes, notifsRes] = await Promise.all([
 api.get('/projects/my-stats'),
 api.get('/invoices/my-invoices'),
 api.get('/projects/my-projects'),
 api.get('/notifications').catch(() => ({ data: { data: [] } }))
 ]);
 
 const unpaidCount = invoicesRes.data.data ? invoicesRes.data.data.filter(inv => inv.status !== 'paid').length : 0;
 
 if (statsRes.data.success) {
 setStatsData({
 activeProjects: statsRes.data.data.activeProjects,
 pendingTasks: statsRes.data.data.pendingTasks,
 unpaidInvoices: unpaidCount
 });
 }
 if (projectsRes.data.success) setRecentProjects(projectsRes.data.data.slice(0, 3));
 if (notifsRes.data.success) setNotifications(notifsRes.data.data.slice(0, 5));
 } catch (error) {
 console.error("Error fetching client dashboard:", error);
 }
 }, []);

 useEffect(() => {
 if (user) {
 fetchData();
 }
 }, [user, fetchData]);

 // Lắng nghe thay đổi realtime
 useEffect(() => {
 const unsub = subscribe('dashboard_refresh', componentId, () => {
 fetchData();
 });
 return () => unsub && unsub();
 }, [subscribe, fetchData, componentId]);

 const stats = [
 { title: "Dự án đang chạy", value: statsData.activeProjects, icon: <FolderKanban size={24} />, color: "text-idaz-orange", bg: "bg-idaz-orange-light", border: "border-orange-100" },
 { title: "Task chờ duyệt", value: statsData.pendingTasks, icon: <CheckCircle size={24} />, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
 { title: "Hóa đơn chưa thanh toán", value: statsData.unpaidInvoices, icon: <Receipt size={24} />, color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-100" },
 ];

 return (
 <div className="max-w-5xl mx-auto">
 <div className="mb-8">
 <h1 className="text-3xl font-bold text-idaz-black">Tổng quan</h1>
 <p className="text-gray-500 mt-2">Chào mừng trở lại, cùng theo dõi tiến độ các dự án của bạn nhé.</p>
 </div>

 {/* Stats Cards */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
 {stats.map((stat, i) => (
 <motion.div 
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: i * 0.1 }}
 key={i} 
 className={`glass-card glass-card-hover border border-white/60 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden p-8 md:p-10 rounded-3xl`}
 >
 <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${stat.bg} ${stat.color} border ${stat.border}`}>
 {stat.icon}
 </div>
 <h3 className="text-gray-500 text-sm font-medium">{stat.title}</h3>
 <p className="text-3xl font-bold text-idaz-black mt-1">{stat.value}</p>
 </motion.div>
 ))}
 </div>

 {/* Quick Access */}
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 <div className="glass-card p-8 md:p-10 rounded-3xl border border-white/60 hover:shadow-xl transition-all duration-300">
 <div className="flex justify-between items-center mb-6">
 <h2 className="text-lg font-bold text-idaz-black">Dự án Mới nhất</h2>
 <Link href="/client/projects" className="text-sm text-idaz-orange font-medium hover:underline flex items-center gap-1">
 Xem tất cả <ArrowRight size={14} />
 </Link>
 </div>
 
 <div className="space-y-4">
 {recentProjects.length > 0 ? recentProjects.map((project, i) => (
 <div key={project._id || i} className="flex items-center gap-4 p-4 rounded-xl hover:bg-idaz-gray transition-colors border border-transparent hover:border-gray-100 cursor-pointer">
 <div className="w-12 h-12 rounded-xl bg-idaz-orange-light flex items-center justify-center shrink-0">
 <FolderKanban size={20} className="text-idaz-orange" />
 </div>
 <div className="flex-1 min-w-0">
 <h3 className="font-bold text-idaz-black truncate">{project.title}</h3>
 <div className="flex items-center gap-2 mt-1">
 <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
 <div className="h-full bg-idaz-orange rounded-full" style={{ width: `${project.progress || 0}%` }}></div>
 </div>
 <span className="text-xs font-medium text-gray-500">{project.progress || 0}%</span>
 </div>
 </div>
 </div>
 )) : (
 <div className="text-center text-gray-500 py-4">Chưa có dự án nào</div>
 )}
 </div>
 </div>

 <div className="glass-card p-8 md:p-10 rounded-3xl border border-white/60 hover:shadow-xl transition-all duration-300">
 <h2 className="text-lg font-bold text-idaz-black mb-6">Hoạt động gần đây</h2>
 {notifications.length === 0 ? (
 <div className="text-center text-gray-400 py-8">
 <div className="text-slate-200 text-4xl mb-3">🔔</div>
 <p className="text-sm">Chưa có hoạt động nào gần đây</p>
 </div>
 ) : (
 <div className="space-y-3">
 {notifications.map((notif, i) => (
 <motion.div key={notif._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
 className={`flex gap-3 p-3 rounded-xl transition-colors ${notif.read ? 'bg-idaz-gray' : 'bg-idaz-orange-light border border-orange-100'}`}>
 <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${notif.read ? 'bg-slate-300' : 'bg-idaz-orange animate-pulse'}`} />
 <div className="flex-1 min-w-0">
 <p className="font-semibold text-idaz-black text-sm">{notif.title}</p>
 <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">{notif.message}</p>
 <span className="text-xs text-gray-400 mt-1 block">
 {new Date(notif.createdAt).toLocaleString('vi-VN')}
 </span>
 </div>
 </motion.div>
 ))}
 </div>
 )}
 </div>
 </div>
 </div>
 );
}
