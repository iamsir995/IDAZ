"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Users, Mail, Phone, Calendar, ArrowUpRight, Search, X, Edit2, Briefcase, Receipt, TrendingUp, ChevronRight, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import api from "../../../services/api";
import toast from "react-hot-toast";
import { useAuth } from "../../../context/AuthContext";
import SHA256 from "crypto-js/sha256";
import { useSocket } from "../../../context/SocketContext";

const STATUS_TABS = [
 { id: "all", label: "Tất cả" },
 { id: "lead", label: "Tiềm năng" },
 { id: "active", label: "Đang triển khai" },
 { id: "vip", label: "VIP" },
];

const STATUS_STYLES = {
 vip: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
 active: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
 lead: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
};

export default function CRMDashboard() {
 const { onlineUsers = [] } = useSocket() || {};
 const [clients, setClients] = useState([]);
 const [isLoading, setIsLoading] = useState(true);
 const [searchQuery, setSearchQuery] = useState("");
 const [activeTab, setActiveTab] = useState("all");

 // Add Modal
 const [isAddModalOpen, setIsAddModalOpen] = useState(false);
 const [newClient, setNewClient] = useState({ name: "", email: "", password: "", phone: "", company: "", customerStatus: "lead" });

 // Edit Modal
 const [isEditModalOpen, setIsEditModalOpen] = useState(false);
 const [editClient, setEditClient] = useState(null);

 // Drawer
 const [selectedClient, setSelectedClient] = useState(null);
 const [clientProjects, setClientProjects] = useState([]);
 const [clientInvoices, setClientInvoices] = useState([]);
 const [drawerLoading, setDrawerLoading] = useState(false);

 const fetchClients = async () => {
 setIsLoading(true);
 try {
 const { data } = await api.get('/users', {
 params: { search: searchQuery, role: 'client', limit: 100 }
 });
 if (data.success) {
 setClients(data.data.map(u => ({
 id: u._id,
 name: u.name,
 company: u.company || `Công ty của ${u.name}`,
 email: u.email,
 phone: u.phone || "Chưa cập nhật",
 status: u.customerStatus || "lead",
 revenue: u.revenue || 0,
 rawRevenue: u.revenue || 0,
 })));
 }
 } catch {
 toast.error("Không thể tải danh sách khách hàng");
 } finally {
 setIsLoading(false);
 }
 };

 const openDrawer = async (client) => {
 setSelectedClient(client);
 setDrawerLoading(true);
 try {
 const { data } = await api.get(`/users/${client.id}`);
 if (data.success) {
 setClientProjects(data.data.recentProjects || []);
 setClientInvoices(data.data.recentInvoices || []);
 // Có thể update số liệu thống kê realtime ở đây nếu cần
 }
 } catch { 
 toast.error("Lỗi tải chi tiết khách hàng");
 } finally {
 setDrawerLoading(false);
 }
 };

 // Fetch danh sách khi searchQuery thay đổi (debounce 500ms)
 useEffect(() => {
 const delayDebounceFn = setTimeout(() => {
 fetchClients();
 }, 500);

 return () => clearTimeout(delayDebounceFn);
 }, [searchQuery]);

 const handleAddClient = async (e) => {
 e.preventDefault();
 try {
 const payload = { ...newClient, role: "client" };
 if (payload.password) {
 payload.password = SHA256(payload.password).toString();
 }
 const res = await api.post("/users", payload);
 if (res.data.success) {
 toast.success("Tạo khách hàng thành công!");
 setIsAddModalOpen(false);
 setNewClient({ name: "", email: "", password: "", phone: "", company: "", customerStatus: "lead" });
 fetchClients();
 }
 } catch (error) {
 toast.error(error.response?.data?.message || "Lỗi tạo khách hàng");
 }
 };

 const handleEditClient = async (e) => {
 e.preventDefault();
 try {
 const { data } = await api.put(`/users/${editClient.id}`, {
 name: editClient.name,
 phone: editClient.phone,
 company: editClient.company,
 customerStatus: editClient.status,
 });
 if (data.success) {
 toast.success("Cập nhật thành công!");
 setIsEditModalOpen(false);
 setEditClient(null);
 fetchClients();
 }
 } catch {
 toast.error("Lỗi cập nhật khách hàng");
 }
 };

 const handleDeleteClient = async (id, e) => {
 e.stopPropagation();
 if (!window.confirm("Bạn có chắc muốn vô hiệu hóa khách hàng này? (Hóa đơn và Dự án sẽ vẫn được giữ lại)")) return;
 
 try {
 const { data } = await api.delete(`/users/${id}`);
 if (data.success) {
 toast.success("Đã vô hiệu hóa khách hàng!");
 fetchClients();
 }
 } catch (error) {
 toast.error("Lỗi khi vô hiệu hóa khách hàng");
 }
 };

 // Không filter Client Side name/email nữa, chỉ filter Tab (Status)
 const filteredClients = clients.filter(c => {
 return activeTab === "all" || c.status === activeTab;
 });

 const totalRevenue = clients.reduce((s, c) => s + c.rawRevenue, 0);
 const vipCount = clients.filter(c => c.status === 'vip').length;

 return (
 <div className="max-w-7xl mx-auto h-full flex flex-col relative">
 {/* Header */}
 <div className="flex items-center justify-between mb-6 shrink-0">
 <div>
 <h1 className="text-3xl font-bold text-idaz-black mb-1">Quản lý Khách hàng (CRM)</h1>
 <p className="text-gray-400 text-sm">Danh sách đối tác, khách hàng tiềm năng và doanh thu.</p>
 </div>
 <div className="flex gap-3">
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
 <input
 type="text"
 placeholder="Tìm kiếm..."
 value={searchQuery}
 onChange={e => setSearchQuery(e.target.value)}
 className="glass-panel border border-white/60 rounded-3xl py-2 pl-9 pr-4 text-idaz-black text-sm focus:outline-none focus:border-rose-500 w-52 transition-colors"
 />
 </div>
 <button onClick={() => setIsAddModalOpen(true)} className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-idaz-black rounded-3xl text-sm font-bold transition-all shadow-[0_0_15px_rgba(225,29,72,0.3)] flex items-center gap-2">
 + Thêm Khách Hàng
 </button>
 </div>
 </div>

 {/* Stats */}
 <div className="grid grid-cols-4 gap-4 mb-6 shrink-0">
 <div className="glass-panel border border-white/40 rounded-3xl p-5">
 <div className="flex items-center gap-2 text-gray-400 mb-2 text-sm"><Users size={16} /> Tổng KH</div>
 <div className="text-3xl font-bold text-idaz-black">{clients.length}</div>
 </div>
 <div className="glass-panel border border-white/40 rounded-3xl p-5">
 <div className="flex items-center gap-2 text-gray-400 mb-2 text-sm"><TrendingUp size={16} /> Khách VIP</div>
 <div className="text-3xl font-bold text-amber-400">{vipCount}</div>
 </div>
 <div className="bg-gradient-to-br from-rose-600 to-rose-900 border border-rose-500/30 rounded-3xl p-5 col-span-2 shadow-[0_0_30px_rgba(225,29,72,0.15)]">
 <div className="text-rose-200 mb-2 text-sm font-medium">Tổng Doanh thu (tích lũy)</div>
 <div className="text-3xl font-extrabold text-idaz-black">{totalRevenue.toLocaleString('vi-VN')} ₫</div>
 </div>
 </div>

 {/* Tab Filter */}
 <div className="flex gap-2 mb-4 shrink-0">
 {STATUS_TABS.map(tab => (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id)}
 className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
 activeTab === tab.id
 ? 'bg-rose-600 text-idaz-black shadow-[0_0_10px_rgba(225,29,72,0.4)]'
 : 'glass-panel text-gray-400 hover:text-idaz-black border border-white/40'
 }`}
 >
 {tab.label}
 <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-white/20' : 'bg-white/5'}`}>
 {tab.id === 'all' ? clients.length : clients.filter(c => c.status === tab.id).length}
 </span>
 </button>
 ))}
 </div>

 {/* Table */}
 <div className="glass-panel border border-white/40 rounded-3xl overflow-hidden flex-1 flex flex-col">
 <div className="overflow-y-auto flex-1 custom-scrollbar">
 <table className="w-full text-left border-collapse">
 <thead className="sticky top-0 z-10 bg-idaz-gray/80 backdrop-blur-md">
 <tr className="border-b border-white/40">
 <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Khách hàng</th>
 <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Liên hệ</th>
 <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Trạng thái</th>
 <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Doanh thu</th>
 <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">Hành động</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-white/5">
 {isLoading ? (
 <tr><td colSpan="5" className="p-10 text-center text-gray-500">Đang tải...</td></tr>
 ) : filteredClients.length === 0 ? (
 <tr><td colSpan="5" className="p-10 text-center text-gray-500">Không tìm thấy khách hàng nào.</td></tr>
 ) : filteredClients.map(client => (
 <tr
 key={client.id}
 className="hover:glass-panel/[0.02] transition-colors group cursor-pointer"
 onClick={() => openDrawer(client)}
 >
 <td className="p-4">
 <div className="flex items-center gap-3">
 <div className="relative">
 <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center text-idaz-black font-bold text-sm border border-white/60 uppercase shrink-0">
 {client.name.charAt(0)}
 </div>
 {onlineUsers.includes(client.id) && (
 <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-zinc-950 rounded-full"></span>
 )}
 </div>
 <div>
 <div className="font-bold text-idaz-black">{client.name}</div>
 <div className="text-xs text-gray-500">{client.company}</div>
 </div>
 </div>
 </td>
 <td className="p-4">
 <div className="flex flex-col gap-1">
 <span className="flex items-center gap-2 text-sm text-gray-600"><Mail size={13} className="text-gray-500" /> {client.email}</span>
 <span className="flex items-center gap-2 text-sm text-gray-400"><Phone size={13} className="text-gray-500" /> {client.phone}</span>
 </div>
 </td>
 <td className="p-4">
 <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase ${STATUS_STYLES[client.status] || STATUS_STYLES.lead}`}>
 {client.status}
 </span>
 </td>
 <td className="p-4 text-right font-bold text-idaz-black">{client.revenue.toLocaleString('vi-VN')} ₫</td>
 <td className="p-4 text-center">
 <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
 <button
 onClick={e => { e.stopPropagation(); setEditClient(client); setIsEditModalOpen(true); }}
 className="p-1.5 bg-white/10 hover:bg-indigo-500/20 hover:text-indigo-400 text-gray-400 rounded-xl transition-colors"
 title="Sửa"
 >
 <Edit2 size={14} />
 </button>
 <button
 onClick={e => handleDeleteClient(client.id, e)}
 className="p-1.5 bg-white/10 hover:bg-rose-500/20 hover:text-rose-400 text-gray-400 rounded-xl transition-colors"
 title="Vô hiệu hóa"
 >
 <Trash2 size={14} />
 </button>
 <ChevronRight size={16} className="text-zinc-600 group-hover:text-gray-400 transition-colors" />
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>

 {/* ═══ DRAWER Chi tiết KH ═══ */}
 <AnimatePresence>
 {selectedClient && (
 <>
 <motion.div
 initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
 className="fixed inset-0 bg-white/60 z-40"
 onClick={() => setSelectedClient(null)}
 />
 <motion.div
 initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
 transition={{ type: "spring", stiffness: 300, damping: 30 }}
 className="fixed top-0 right-0 h-full w-full max-w-md bg-idaz-gray border-l border-white/60 z-50 flex flex-col shadow-2xl"
 >
 {/* Drawer Header */}
 <div className="p-6 border-b border-white/60 flex items-start justify-between shrink-0">
 <div className="flex items-center gap-4">
 <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center text-idaz-black font-bold text-xl uppercase">
 {selectedClient.name.charAt(0)}
 </div>
 <div>
 <h3 className="text-xl font-bold text-idaz-black">{selectedClient.name}</h3>
 <p className="text-gray-400 text-sm">{selectedClient.company}</p>
 <span className={`mt-1 inline-flex px-2 py-0.5 rounded-full text-xs font-bold uppercase ${STATUS_STYLES[selectedClient.status] || STATUS_STYLES.lead}`}>
 {selectedClient.status}
 </span>
 </div>
 </div>
 <button onClick={() => setSelectedClient(null)} className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-idaz-black transition-colors">
 <X size={20} />
 </button>
 </div>

 <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
 {/* Thông tin liên hệ */}
 <div className="space-y-2">
 <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Thông tin liên hệ</h4>
 <div className="glass-panel rounded-3xl p-4 space-y-3">
 <div className="flex items-center gap-3 text-sm"><Mail size={14} className="text-rose-400" /><span className="text-gray-600">{selectedClient.email}</span></div>
 <div className="flex items-center gap-3 text-sm"><Phone size={14} className="text-rose-400" /><span className="text-gray-600">{selectedClient.phone}</span></div>
 </div>
 </div>

 {/* Doanh thu */}
 <div className="bg-gradient-to-br from-rose-600/20 to-purple-600/10 border border-rose-500/20 rounded-3xl p-4">
 <div className="text-xs text-rose-300 font-semibold uppercase tracking-wider mb-1">Tổng Doanh Thu</div>
 <div className="text-2xl font-extrabold text-idaz-black">{selectedClient.revenue.toLocaleString('vi-VN')} ₫</div>
 </div>

 {/* Dự án */}
 <div>
 <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
 <Briefcase size={13} /> Dự án ({clientProjects.length})
 </h4>
 {drawerLoading ? (
 <div className="text-gray-500 text-sm text-center py-4">Đang tải...</div>
 ) : clientProjects.length === 0 ? (
 <div className="text-zinc-600 text-sm text-center py-4 glass-panel rounded-3xl">Chưa có dự án</div>
 ) : clientProjects.map(p => (
 <div key={p._id} className="glass-panel rounded-3xl p-3 mb-2 flex items-center justify-between">
 <div>
 <div className="font-medium text-idaz-black text-sm">{p.title}</div>
 <div className="text-xs text-gray-500 mt-0.5">{p.progress || 0}% hoàn thành</div>
 </div>
 <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
 <div className="h-full bg-rose-500 rounded-full" style={{ width: `${p.progress || 0}%` }} />
 </div>
 </div>
 ))}
 </div>

 {/* Hóa đơn */}
 <div>
 <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
 <Receipt size={13} /> Hóa đơn ({clientInvoices.length})
 </h4>
 {clientInvoices.length === 0 ? (
 <div className="text-zinc-600 text-sm text-center py-4 glass-panel rounded-3xl">Chưa có hóa đơn</div>
 ) : clientInvoices.map(inv => (
 <div key={inv._id} className="glass-panel rounded-3xl p-3 mb-2 flex items-center justify-between">
 <div>
 <div className="font-medium text-idaz-black text-sm">{inv.title}</div>
 <div className="text-xs text-gray-500">{inv.invoiceNumber}</div>
 </div>
 <div className="text-right">
 <div className="text-sm font-bold text-idaz-black">{inv.amount?.toLocaleString('vi-VN')} ₫</div>
 <span className={`text-xs font-bold ${inv.status === 'paid' ? 'text-emerald-400' : inv.status === 'cancelled' ? 'text-gray-500' : 'text-amber-400'}`}>
 {inv.status === 'paid' ? 'Đã thanh toán' : inv.status === 'cancelled' ? 'Đã huỷ' : 'Chờ thanh toán'}
 </span>
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* Drawer Footer */}
 <div className="p-6 border-t border-white/60 shrink-0">
 <button
 onClick={() => { setEditClient(selectedClient); setIsEditModalOpen(true); }}
 className="w-full bg-indigo-600 hover:bg-indigo-700 text-idaz-black rounded-3xl py-3 font-bold text-sm transition-all flex items-center justify-center gap-2"
 >
 <Edit2 size={16} /> Chỉnh sửa thông tin
 </button>
 </div>
 </motion.div>
 </>
 )}
 </AnimatePresence>

 {/* ═══ MODAL Thêm KH ═══ */}
 <AnimatePresence>
 {isAddModalOpen && (
 <motion.div
 initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
 className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
 >
 <motion.div
 initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
 className="bg-idaz-gray border border-white/60 rounded-3xl p-6 w-full max-w-md shadow-2xl"
 >
 <div className="flex items-center justify-between mb-6">
 <h3 className="text-xl font-bold text-idaz-black">Thêm Khách Hàng</h3>
 <button onClick={() => setIsAddModalOpen(false)} className="text-gray-500 hover:text-idaz-black transition-colors"><X size={20} /></button>
 </div>
 <form onSubmit={handleAddClient} className="space-y-4">
 {[
 { label: "Họ tên", key: "name", type: "text", placeholder: "Nguyễn Văn A" },
 { label: "Tên công ty", key: "company", type: "text", placeholder: "Công ty CP XYZ" },
 { label: "Email", key: "email", type: "email", placeholder: "email@congty.com" },
 { label: "Số điện thoại", key: "phone", type: "text", placeholder: "0987654321" },
 { label: "Mật khẩu cấp phát", key: "password", type: "password", placeholder: "••••••" },
 ].map(f => (
 <div key={f.key}>
 <label className="block text-sm font-medium text-gray-400 mb-1">{f.label}</label>
 <input required type={f.type} value={newClient[f.key]} onChange={e => setNewClient({ ...newClient, [f.key]: e.target.value })}
 className="w-full glass-panel border border-white/60 rounded-3xl px-4 py-3 text-idaz-black text-sm focus:outline-none focus:border-rose-500 transition-colors"
 placeholder={f.placeholder} />
 </div>
 ))}
 <div>
 <label className="block text-sm font-medium text-gray-400 mb-1">Phân loại</label>
 <select value={newClient.customerStatus} onChange={e => setNewClient({ ...newClient, customerStatus: e.target.value })}
 className="w-full glass-panel border border-white/60 rounded-3xl px-4 py-3 text-idaz-black text-sm focus:outline-none focus:border-rose-500 transition-colors">
 <option value="lead">Tiềm năng (Lead)</option>
 <option value="active">Đang triển khai (Active)</option>
 <option value="vip">Khách hàng VIP</option>
 </select>
 </div>
 <div className="pt-4">
 <button type="submit" className="w-full bg-rose-600 hover:bg-rose-700 text-idaz-black rounded-3xl py-3 font-bold transition-all shadow-[0_0_15px_rgba(225,29,72,0.3)]">
 Tạo Tài Khoản
 </button>
 </div>
 </form>
 </motion.div>
 </motion.div>
 )}
 </AnimatePresence>

 {/* ═══ MODAL Edit KH ═══ */}
 <AnimatePresence>
 {isEditModalOpen && editClient && (
 <motion.div
 initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
 className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
 >
 <motion.div
 initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
 className="bg-idaz-gray border border-white/60 rounded-3xl p-6 w-full max-w-md shadow-2xl"
 >
 <div className="flex items-center justify-between mb-6">
 <h3 className="text-xl font-bold text-idaz-black">Chỉnh sửa: <span className="text-rose-400">{editClient.name}</span></h3>
 <button onClick={() => { setIsEditModalOpen(false); setEditClient(null); }} className="text-gray-500 hover:text-idaz-black transition-colors"><X size={20} /></button>
 </div>
 <form onSubmit={handleEditClient} className="space-y-4">
 {[
 { label: "Họ tên", key: "name", type: "text" },
 { label: "Tên công ty", key: "company", type: "text" },
 { label: "Số điện thoại", key: "phone", type: "text" },
 ].map(f => (
 <div key={f.key}>
 <label className="block text-sm font-medium text-gray-400 mb-1">{f.label}</label>
 <input type={f.type} value={editClient[f.key] || ''} onChange={e => setEditClient({ ...editClient, [f.key]: e.target.value })}
 className="w-full glass-panel border border-white/60 rounded-3xl px-4 py-3 text-idaz-black text-sm focus:outline-none focus:border-indigo-500 transition-colors" />
 </div>
 ))}
 <div>
 <label className="block text-sm font-medium text-gray-400 mb-1">Trạng thái</label>
 <select value={editClient.status} onChange={e => setEditClient({ ...editClient, status: e.target.value })}
 className="w-full glass-panel border border-white/60 rounded-3xl px-4 py-3 text-idaz-black text-sm focus:outline-none focus:border-indigo-500 transition-colors">
 <option value="lead">Tiềm năng</option>
 <option value="active">Đang triển khai</option>
 <option value="vip">VIP</option>
 </select>
 </div>
 <div className="pt-4 flex gap-3">
 <button type="button" onClick={() => { setIsEditModalOpen(false); setEditClient(null); }}
 className="flex-1 bg-white/5 hover:bg-white/10 text-gray-600 rounded-3xl py-3 font-bold transition-all">
 Huỷ
 </button>
 <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-idaz-black rounded-3xl py-3 font-bold transition-all shadow-lg shadow-indigo-500/20">
 Lưu thay đổi
 </button>
 </div>
 </form>
 </motion.div>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 );
}
