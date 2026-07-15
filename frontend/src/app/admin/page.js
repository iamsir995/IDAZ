"use client";

import { useState, useEffect } from "react";
import api from "../../services/api";
import { DollarSign, FolderKanban, CheckCircle, Users as UsersIcon, FileText, Lock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { useRef, useCallback } from "react";

export default function AnalyticsDashboard() {
 const { user } = useAuth();
 const { subscribe } = useSocket();
 const componentId = useRef(`admin-dash-${Date.now()}`).current;
 const [data, setData] = useState(null);
 const [loading, setLoading] = useState(true);

 const fetchDashboardData = useCallback(async () => {
 try {
 const res = await api.get('/dashboard/summary');
 if (res.data.success) {
 setData(res.data.data);
 }
 } catch (error) {
 toast.error("Không tải được dữ liệu Dashboard");
 } finally {
 setLoading(false);
 }
 }, []);

 useEffect(() => {
 fetchDashboardData();
 }, [fetchDashboardData]);

 // Lắng nghe thay đổi realtime
 useEffect(() => {
 const unsub = subscribe('dashboard_refresh', componentId, () => {
 fetchDashboardData();
 });
 return () => unsub && unsub();
 }, [subscribe, fetchDashboardData, componentId]);

 if (loading || !data) {
 return (
 <div className="h-full flex items-center justify-center">
 <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
 </div>
 );
 }

 const { stats, revenueData, taskStatusData, recentActivities } = data;

 const cards = [
 { title: "Tổng Doanh Thu", value: `${stats.totalRevenue.toLocaleString('vi-VN')} ₫`, icon: <DollarSign size={24} />, color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20" },
 { title: "Dự án đang chạy", value: stats.activeProjects, icon: <FolderKanban size={24} />, color: "text-indigo-500", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
 { title: "Task chờ xử lý", value: stats.pendingTasks, icon: <CheckCircle size={24} />, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" },
 { title: "Tỉ lệ chuyển đổi", value: `${stats.conversionRate}%`, icon: <UsersIcon size={24} />, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
 { title: "Hóa đơn chờ thu", value: stats.pendingInvoices, icon: <FileText size={24} />, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
 ];

 const CustomTooltip = ({ active, payload, label }) => {
 if (active && payload && payload.length) {
 return (
 <div className="bg-white border border-gray-200 p-3 rounded-xl shadow-2xl">
 <p className="text-idaz-black font-bold mb-2">{label}</p>
 {payload.map((entry, index) => (
 <p key={`item-${index}`} style={{ color: entry.color }} className="text-sm font-medium">
 {entry.name === 'revenue' ? 'Doanh thu' : 'Lợi nhuận'}: ${entry.value}
 </p>
 ))}
 </div>
 );
 }
 return null;
 };

 return (
 <div className="max-w-7xl mx-auto space-y-8 pb-10">
 <div className="flex justify-between items-end">
  <div>
  <h1 className="text-title-1 font-bold text-idaz-black tracking-tight">Tổng quan Hệ thống</h1>
  <p className="text-gray-500 text-body mt-1">Báo cáo hiệu suất và doanh thu của toàn bộ Agency.</p>
  </div>
 </div>

 {/* Stats Cards */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
 {cards.map((card, i) => {
 // Chỉ Admin / Manager mới thấy Doanh thu
 if (card.title === "Tổng Doanh Thu" && user?.role !== 'admin' && user?.role !== 'manager') return null;
 // Chỉ Admin / Manager mới thấy Hóa đơn chờ thu
 if (card.title === "Hóa đơn chờ thu" && user?.role !== 'admin' && user?.role !== 'manager') return null;
 
 return (
 <motion.div 
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: i * 0.1 }}
 key={i} 
 className="glass-card p-8 md:p-10 rounded-3xl border border-white/60 hover:-translate-y-1 hover:shadow-xl hover:bg-white/90 transition-all duration-300"
 >
  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${card.bg} ${card.color} border ${card.border}`}>
  {card.icon}
  </div>
  <h3 className="text-gray-500 text-footnote font-medium">{card.title}</h3>
  <p className="text-title-1 font-bold text-idaz-black mt-1">{card.value}</p>
  </motion.div>
 );
 })}
 </div>

 {/* Charts Row */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 {/* Bar Chart - Doanh thu (Chỉ admin/manager) */}
 {(['superadmin', 'admin', 'manager'].includes(user?.role)) ? (
 <motion.div 
 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
  className="lg:col-span-2 glass-card p-8 md:p-10 rounded-3xl border border-white/60 hover:-translate-y-1 hover:shadow-xl hover:bg-white/90 transition-all duration-300"
  >
  <h2 className="text-title-3 font-bold text-idaz-black mb-6">Doanh thu 7 tháng gần nhất</h2>
  <div className="h-80">
 <ResponsiveContainer width="100%" height="100%">
 <BarChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
 <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
 <XAxis dataKey="month" stroke="#e5e7eb" axisLine={false} tickLine={false} />
 <YAxis stroke="#e5e7eb" axisLine={false} tickLine={false} tickFormatter={(value) => `$${value}`} />
 <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#f9fafb' }} />
 <Bar dataKey="revenue" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={30} />
 <Bar dataKey="profit" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={30} />
 </BarChart>
 </ResponsiveContainer>
 </div>
 </motion.div>
 ) : (
  <div className="lg:col-span-2 p-8 md:p-10 rounded-3xl glass-card flex flex-col items-center justify-center">
  <Lock size={40} className="text-gray-300 mb-4" />
  <p className="text-gray-500 text-callout font-medium">Báo cáo tài chính yêu cầu quyền Quản lý</p>
  </div>
 )}

 {/* Pie Chart - Task Status */}
 <motion.div 
 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
  className="glass-card p-8 md:p-10 rounded-3xl border border-white/60 flex flex-col hover:-translate-y-1 hover:shadow-xl hover:bg-white/90 transition-all duration-300"
  >
  <h2 className="text-title-3 font-bold text-idaz-black mb-2">Phân bổ Công việc</h2>
  <p className="text-footnote text-gray-500 mb-6">Trạng thái các Task hiện tại</p>
  <div className="flex-1 flex flex-col items-center justify-center">
 <div className="h-48 w-full relative">
 <ResponsiveContainer width="100%" height="100%">
 <PieChart>
 <Pie
 data={taskStatusData}
 cx="50%"
 cy="50%"
 innerRadius={60}
 outerRadius={80}
 paddingAngle={5}
 dataKey="value"
 stroke="none"
 >
 {taskStatusData.map((entry, index) => (
 <Cell key={`cell-${index}`} fill={entry.color} />
 ))}
 </Pie>
 <RechartsTooltip 
 contentStyle={{ backgroundColor: '#ffffff', borderColor: '#f3f4f6', borderRadius: '12px', color: '#fff' }}
 itemStyle={{ color: '#fff', fontWeight: 'bold' }}
 />
 </PieChart>
 </ResponsiveContainer>
  <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
  <span className="text-title-1 font-bold text-idaz-black">100</span>
  <span className="text-caption-1 text-gray-500">Total Tasks</span>
  </div>
 </div>
 
 {/* Legend */}
 <div className="w-full mt-6 space-y-3">
  {taskStatusData.map((item, index) => (
  <div key={index} className="flex justify-between items-center text-footnote">
  <div className="flex items-center gap-2">
 <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
 <span className="text-gray-400">{item.name}</span>
 </div>
 <span className="font-bold text-idaz-black">{item.value}%</span>
 </div>
 ))}
 </div>
 </div>
 </motion.div>
 </div>

 {/* Recent Activities */}
 <motion.div 
 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
  className="glass-card p-8 md:p-10 rounded-3xl border border-white/60 hover:-translate-y-1 hover:shadow-xl hover:bg-white/90 transition-all duration-300"
  >
  <h2 className="text-title-3 font-bold text-idaz-black mb-6">Hoạt động gần đây</h2>
  <div className="space-y-4">
 {recentActivities.map((activity) => (
 <div key={activity.id} className="flex items-center justify-between p-4 rounded-xl glass-panel hover:bg-white/80 transition-colors">
 <div className="flex items-center gap-4">
 <div className={`w-10 h-10 rounded-full flex items-center justify-center text-idaz-black font-bold
 ${activity.type === 'file' ? 'bg-indigo-500' : activity.type === 'invoice' ? 'bg-emerald-500' : 'bg-rose-500'}`}
 >
 {activity.user.charAt(0)}
 </div>
  <div>
  <h4 className="font-bold text-idaz-black text-subheadline">{activity.action}</h4>
  <p className="text-caption-1 text-gray-500 mt-1">Bởi <span className="text-gray-600">{activity.user}</span> • {activity.target}</p>
  </div>
  </div>
  <div className="text-caption-1 font-medium text-gray-500">
  {activity.time}
  </div>
 </div>
 ))}
 </div>
 </motion.div>
 {/* Top Projects */}
 {data.topProjects && data.topProjects.length > 0 && (
 <motion.div
 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
  className="glass-card p-8 md:p-10 rounded-3xl border border-white/60 hover:-translate-y-1 hover:shadow-xl hover:bg-white/90 transition-all duration-300"
  >
  <h2 className="text-title-3 font-bold text-idaz-black mb-1">Top Dự án Doanh Thu</h2>
  <p className="text-footnote text-gray-500 mb-5">5 dự án đưa lại doanh thu cao nhất</p>
  <div className="space-y-3">
  {data.topProjects.map((p, i) => (
  <div key={p._id} className="flex items-center gap-4">
  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-caption-1 font-black text-idaz-black flex-shrink-0 ${
  i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-amber-700' : 'bg-gray-700'
  }`}>{i + 1}</div>
  <div className="flex-1 min-w-0">
  <div className="text-idaz-black font-semibold text-subheadline truncate">{p.title}</div>
  <div className="h-1.5 bg-gray-100 rounded-full mt-1">
    <div className="h-full bg-gradient-to-r from-rose-500 to-indigo-500 rounded-full"
      style={{ width: `${Math.min(100, (p.revenue / (data.topProjects[0]?.revenue || 1)) * 100)}%` }} />
  </div>
  </div>
  </div>
  ))}
  </div>
  </motion.div>
  )}
  </div>
  );
}
