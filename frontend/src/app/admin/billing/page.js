"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Receipt, DollarSign, ArrowUpRight, ArrowDownRight, CreditCard, CheckCircle2, Clock, Plus, X, Trash2, Ban, Search, Edit2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../../services/api";

export default function BillingDashboard() {
 const [invoices, setInvoices] = useState([]);
 const [users, setUsers] = useState([]);
 const [projects, setProjects] = useState([]);
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [filterStatus, setFilterStatus] = useState('all');
 const [searchQuery, setSearchQuery] = useState('');
 const [editingId, setEditingId] = useState(null);
 const [newInvoice, setNewInvoice] = useState({
 userId: '', projectId: '', title: '', amount: '', dueDate: '', status: 'pending', invoiceNumber: `INV-${Date.now().toString().slice(-6)}`
 });

 useEffect(() => {
 fetchInvoices();
 fetchUsers();
 fetchProjects();
 }, []);

 const fetchProjects = async () => {
 try {
 const res = await api.get('/projects');
 if (res.data.success) {
 setProjects(res.data.data);
 }
 } catch (error) {
 console.log(error);
 }
 };

 const fetchInvoices = async () => {
 try {
 const res = await api.get('/invoices');
 if (res.data.success) {
 setInvoices(res.data.data);
 }
 } catch (error) {
 toast.error('Không tải được danh sách hóa đơn');
 }
 };

 const fetchUsers = async () => {
 try {
 const res = await api.get('/users', { params: { role: 'client', limit: 100 } });
 if (res.data.success) {
 setUsers(res.data.data);
 }
 } catch (error) {
 console.log(error);
 }
 };

 const handleSaveInvoice = async (e) => {
 e.preventDefault();
 try {
 const payload = { ...newInvoice, amount: Number(newInvoice.amount) };
 let res;
 if (editingId) {
 res = await api.put(`/invoices/${editingId}`, payload);
 } else {
 res = await api.post('/invoices', payload);
 }

 if (res.data.success) {
 toast.success(editingId ? 'Cập nhật hóa đơn thành công' : 'Tạo hóa đơn thành công');
 setIsModalOpen(false);
 setEditingId(null);
 setNewInvoice({ userId: '', projectId: '', title: '', amount: '', dueDate: '', invoiceNumber: `INV-${Date.now().toString().slice(-6)}` });
 fetchInvoices();
 }
 } catch (error) {
 toast.error(editingId ? 'Lỗi cập nhật hóa đơn' : 'Lỗi tạo hóa đơn');
 }
 };

 const openCreateModal = () => {
 setEditingId(null);
 setNewInvoice({ userId: '', projectId: '', title: '', amount: '', dueDate: '', status: 'pending', invoiceNumber: `INV-${Date.now().toString().slice(-6)}` });
 setIsModalOpen(true);
 };

 const openEditModal = (inv) => {
 setEditingId(inv._id);
 setNewInvoice({
 userId: inv.userId?._id || inv.userId || '',
 projectId: inv.projectId?._id || inv.projectId || '',
 title: inv.title || '',
 amount: inv.amount || '',
 dueDate: inv.dueDate ? inv.dueDate.split('T')[0] : '',
 status: inv.status || 'pending',
 invoiceNumber: inv.invoiceNumber || ''
 });
 setIsModalOpen(true);
 };

 const markAsPaid = async (id) => {
 try {
 const res = await api.put(`/invoices/${id}/pay`);
 if (res.data.success) {
 toast.success('Đã xác nhận thanh toán!');
 fetchInvoices();
 }
 } catch (error) {
 toast.error('Lỗi khi cập nhật trạng thái');
 }
 };

 const handleDeleteInvoice = async (id) => {
 if (!confirm('Xóa hóa đơn này vĩnh viễn?')) return;
 try {
 const res = await api.delete(`/invoices/${id}`);
 if (res.data.success) {
 toast.success('Đã xóa hóa đơn');
 fetchInvoices();
 }
 } catch { toast.error('Lỗi xóa hóa đơn'); }
 };

 const handleCancelInvoice = async (id) => {
 if (!confirm('Huỷ hóa đơn này?')) return;
 try {
 const res = await api.put(`/invoices/${id}/cancel`);
 if (res.data.success) {
 toast.success('Đã huỷ hóa đơn');
 fetchInvoices();
 }
 } catch { toast.error('Lỗi huỷ hóa đơn'); }
 };

  const handleExportPDF = async (inv) => {
    try {
      const { jsPDF } = await import("jspdf");
      
      const doc = new jsPDF();
      doc.setFontSize(22);
      doc.text("IDAZ AGENCY", 105, 20, { align: "center" });
      
      doc.setFontSize(14);
      doc.text("HOA DON THANH TOAN", 105, 30, { align: "center" });
      
      doc.setFontSize(11);
      doc.text(`Ma hoa don: ${inv.invoiceNumber}`, 20, 50);
      doc.text(`Ngay tao: ${new Date().toLocaleDateString('vi-VN')}`, 20, 60);
      doc.text(`Han thanh toan: ${new Date(inv.dueDate).toLocaleDateString('vi-VN')}`, 20, 70);
      
      doc.text(`Khach hang: ${inv.userId?.name || 'N/A'}`, 20, 90);
      doc.text(`Email: ${inv.userId?.email || 'N/A'}`, 20, 100);
      if (inv.projectId) doc.text(`Du an: ${inv.projectId.title}`, 20, 110);
      
      doc.text(`Dich vu: ${inv.title}`, 20, 130);
      doc.setFontSize(14);
      doc.text(`TONG TIEN: ${inv.amount.toLocaleString('vi-VN')} VND`, 20, 150);
      
      doc.setFontSize(11);
      doc.text(`Trang thai: ${inv.status === 'paid' ? 'Da Thu' : inv.status === 'cancelled' ? 'Da Huy' : 'Cho Thu'}`, 20, 160);
      
      doc.save(`HoaDon_${inv.invoiceNumber}.pdf`);
      toast.success("Đã tải xuống hóa đơn PDF");
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi tạo PDF");
    }
  };

 // Tính toán thống kê
 const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0);
 const totalPending = invoices.filter(i => i.status === 'pending').reduce((sum, i) => sum + i.amount, 0);

 const filteredInvoices = invoices.filter(inv => {
 const matchStatus = filterStatus === 'all' || inv.status === filterStatus;
 const matchSearch = !searchQuery || 
 inv.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
 inv.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
 inv.userId?.name?.toLowerCase().includes(searchQuery.toLowerCase());
 return matchStatus && matchSearch;
 });

 return (
 <div className="max-w-7xl mx-auto h-full flex flex-col">
 <div className="flex items-center justify-between mb-8 shrink-0">
 <div>
 <h1 className="text-3xl font-bold text-idaz-black mb-2 flex items-center gap-3">
 Hóa đơn & Dòng tiền
 </h1>
 <p className="text-gray-400">Quản lý doanh thu, báo giá và theo dõi công nợ khách hàng.</p>
 </div>
 <button 
 onClick={openCreateModal}
 className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-idaz-black rounded-3xl text-sm font-bold transition-all shadow-[0_0_15px_rgba(225,29,72,0.3)] flex items-center gap-2"
 >
 <Receipt size={18} /> Tạo Hóa đơn mới
 </button>
 </div>

 {/* Thống kê Tổng quan */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 shrink-0">
 <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel border border-white/40 rounded-3xl p-6 relative overflow-hidden group hover:border-emerald-500/50 transition-colors">
 <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full group-hover:bg-emerald-500/20 transition-all"></div>
 <div className="flex justify-between items-start mb-4">
 <div className="p-3 bg-emerald-500/10 rounded-3xl">
 <DollarSign size={24} className="text-emerald-500" />
 </div>
 </div>
 <p className="text-sm font-medium text-gray-400 mb-1">Đã Thu</p>
 <h2 className="text-3xl font-bold text-idaz-black">{totalRevenue.toLocaleString()} ₫</h2>
 </motion.div>

 <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel border border-white/40 rounded-3xl p-6 relative overflow-hidden group hover:border-amber-500/50 transition-colors">
 <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full group-hover:bg-amber-500/20 transition-all"></div>
 <div className="flex justify-between items-start mb-4">
 <div className="p-3 bg-amber-500/10 rounded-3xl">
 <Clock size={24} className="text-amber-500" />
 </div>
 </div>
 <p className="text-sm font-medium text-gray-400 mb-1">Công nợ (Chưa thu)</p>
 <h2 className="text-3xl font-bold text-idaz-black">{totalPending.toLocaleString()} ₫</h2>
 </motion.div>
 </div>

 {/* Danh sách Hóa đơn */}
 <div className="flex-1 glass-panel border border-white/40 rounded-3xl overflow-hidden flex flex-col min-h-[400px]">
 <div className="p-4 border-b border-white/40 flex items-center justify-between gap-3 shrink-0 flex-wrap">
 <h3 className="font-bold text-idaz-black text-lg">Danh sách Hóa đơn</h3>
 <div className="flex items-center gap-3">
 <div className="relative">
 <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
 <input type="text" placeholder="Tìm kiếm..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
 className="glass-panel border border-white/60 rounded-xl pl-8 pr-3 py-1.5 text-idaz-black text-sm focus:outline-none focus:border-rose-500 w-48 transition-colors" />
 </div>
 {['all', 'pending', 'paid', 'cancelled'].map(s => (
 <button key={s} onClick={() => setFilterStatus(s)}
 className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
 filterStatus === s ? 'bg-rose-600 text-idaz-black' : 'bg-white/5 text-gray-400 hover:text-idaz-black'
 }`}>
 {s === 'all' ? 'Tất cả' : s === 'pending' ? 'Chờ thu' : s === 'paid' ? 'Đã thu' : 'Đã huỷ'}
 </button>
 ))}
 </div>
 </div>
 
 <div className="flex-1 overflow-auto custom-scrollbar">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="border-b border-white/40 glass-panel/[0.02] text-sm font-medium text-gray-400">
 <th className="p-4 pl-6 font-medium">Mã Hóa đơn</th>
 <th className="p-4 font-medium">Khách hàng</th>
 <th className="p-4 font-medium">Hạn thanh toán</th>
 <th className="p-4 font-medium">Số tiền</th>
 <th className="p-4 font-medium">Trạng thái</th>
 <th className="p-4 pr-6 text-right font-medium">Hành động</th>
 </tr>
 </thead>
 <tbody>
 {filteredInvoices.length === 0 && (
 <tr><td colSpan="6" className="text-center p-8 text-gray-500">Không có hóa đơn nào</td></tr>
 )}
 {filteredInvoices.map((inv, idx) => (
 <motion.tr
 initial={{ opacity: 0, x: -10 }}
 animate={{ opacity: 1, x: 0 }}
 transition={{ delay: idx * 0.04 }}
 key={inv._id}
 className="border-b border-white/40 hover:glass-panel/[0.02] transition-colors group text-sm"
 >
 <td className="p-4 pl-6 font-bold text-gray-600">{inv.invoiceNumber}</td>
 <td className="p-4">
 <h3 className="text-idaz-black font-bold mb-1">{inv.title}</h3>
 <p className="text-sm text-gray-400">
 Cho: <span className="text-gray-600 font-medium">{inv.userId?.name || 'N/A'}</span>
 {inv.projectId && <span className="ml-2 text-rose-400">({inv.projectId.title})</span>}
 </p>
 </td>
 <td className="p-4 text-gray-400">{new Date(inv.dueDate).toLocaleDateString('vi-VN')}</td>
 <td className="p-4 text-idaz-black font-bold">{inv.amount.toLocaleString('vi-VN')} ₫</td>
 <td className="p-4">
 <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
 inv.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
 inv.status === 'cancelled' ? 'bg-zinc-500/10 text-gray-400 border-zinc-500/20' :
 'bg-amber-500/10 text-amber-400 border-amber-500/20'
 }`}>
 {inv.status === 'paid' ? <CheckCircle2 size={12} /> : null}
 {inv.status === 'paid' ? 'Đã thu' : inv.status === 'cancelled' ? 'Đã huỷ' : 'Chờ thu'}
 </span>
 </td>
  <td className="p-4 pr-6">
    <div className="flex items-center justify-end gap-2">
      {inv.status === 'pending' && (
        <>
          <button onClick={() => markAsPaid(inv._id)}
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 px-3 py-1.5 rounded-xl transition-all border border-emerald-500/20">
            Xác nhận Thu
          </button>
          <button onClick={() => handleCancelInvoice(inv._id)}
            className="text-xs font-bold text-gray-400 hover:text-zinc-200 bg-white/5 px-2 py-1.5 rounded-xl transition-all border border-white/60"
            title="Huỷ">
            <Ban size={13} />
          </button>
        </>
      )}
      <button onClick={() => handleExportPDF(inv)}
        className="opacity-0 group-hover:opacity-100 text-xs text-gray-500 hover:text-indigo-400 bg-white/5 hover:bg-indigo-500/10 p-1.5 rounded-xl transition-all border border-white/60"
        title="Xuất PDF">
        <Receipt size={13} />
      </button>
      <button onClick={() => openEditModal(inv)}
        className="opacity-0 group-hover:opacity-100 text-xs text-gray-500 hover:text-blue-400 bg-white/5 hover:bg-blue-500/10 p-1.5 rounded-xl transition-all border border-white/60"
        title="Chỉnh sửa">
        <Edit2 size={13} />
      </button>
      <button onClick={() => handleDeleteInvoice(inv._id)}
        className="opacity-0 group-hover:opacity-100 text-xs text-gray-500 hover:text-red-400 bg-white/5 hover:bg-red-500/10 p-1.5 rounded-xl transition-all border border-white/60"
        title="Xóa">
        <Trash2 size={13} />
      </button>
    </div>
  </td>
 </motion.tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>

 {/* Modal Tạo Hóa đơn */}
 <AnimatePresence>
 {isModalOpen && (
 <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
 <motion.div 
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 exit={{ opacity: 0, scale: 0.95 }}
 className="glass-panel border border-white/60 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
 >
 <div className="flex justify-between items-center p-6 border-b border-white/60">
 <h3 className="text-xl font-bold text-idaz-black">{editingId ? 'Chỉnh sửa Hóa đơn' : 'Tạo Hóa đơn mới'}</h3>
 <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-idaz-black">
 <X size={24} />
 </button>
 </div>
 
 <form onSubmit={handleSaveInvoice} className="p-6 space-y-4">
 <div>
 <label className="block text-sm font-medium text-gray-400 mb-1">Khách hàng</label>
 <select 
 required
 value={newInvoice.userId} onChange={e => setNewInvoice({...newInvoice, userId: e.target.value})}
 className="w-full glass-panel border border-white/60 rounded-3xl px-4 py-3 text-idaz-black focus:outline-none focus:border-rose-500"
 >
 <option value="">-- Chọn Khách hàng --</option>
 {users.map(u => (
 <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
 ))}
 </select>
 </div>
 
 <div>
 <label className="block text-sm font-medium text-gray-400 mb-1">Dự án</label>
 <select 
 value={newInvoice.projectId} onChange={e => setNewInvoice({...newInvoice, projectId: e.target.value})}
 className="w-full glass-panel border border-white/60 rounded-3xl px-4 py-3 text-idaz-black focus:outline-none focus:border-rose-500"
 >
 <option value="">-- Không liên kết dự án --</option>
 {projects.map(p => (
 <option key={p._id} value={p._id}>{p.title}</option>
 ))}
 </select>
 </div>
 
 <div>
 <label className="block text-sm font-medium text-gray-400 mb-1">Dịch vụ (Tên hóa đơn)</label>
 <input 
 type="text" required
 value={newInvoice.title} onChange={e => setNewInvoice({...newInvoice, title: e.target.value})}
 className="w-full glass-panel border border-white/60 rounded-3xl px-4 py-3 text-idaz-black focus:outline-none focus:border-rose-500"
 placeholder="VD: Thiết kế Website Giai đoạn 1"
 />
 </div>

 <div>
 <label className="block text-sm font-medium text-gray-400 mb-1">Số tiền (VNĐ)</label>
 <input 
 type="number" required min="0"
 value={newInvoice.amount} onChange={e => setNewInvoice({...newInvoice, amount: e.target.value})}
 className="w-full glass-panel border border-white/60 rounded-3xl px-4 py-3 text-idaz-black focus:outline-none focus:border-rose-500"
 placeholder="15000000"
 />
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-medium text-gray-400 mb-1">Hạn thanh toán</label>
 <input 
 type="date" required
 value={newInvoice.dueDate} onChange={e => setNewInvoice({...newInvoice, dueDate: e.target.value})}
 className="w-full glass-panel border border-white/60 rounded-3xl px-4 py-3 text-idaz-black focus:outline-none focus:border-rose-500"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-gray-400 mb-1">Trạng thái</label>
 <select 
 value={newInvoice.status} onChange={e => setNewInvoice({...newInvoice, status: e.target.value})}
 className="w-full glass-panel border border-white/60 rounded-3xl px-4 py-3 text-idaz-black focus:outline-none focus:border-rose-500"
 >
 <option value="pending">Chờ thu</option>
 <option value="paid">Đã thu</option>
 <option value="cancelled">Đã huỷ</option>
 </select>
 </div>
 </div>

 <div className="pt-4 flex gap-3">
 <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 rounded-3xl font-bold text-gray-600 bg-white/5 hover:bg-white/10">
 Hủy
 </button>
 <button type="submit" className="flex-1 px-4 py-3 rounded-3xl font-bold text-idaz-black bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-500/25">
 {editingId ? 'Cập nhật' : 'Tạo Hóa đơn'}
 </button>
 </div>
 </form>
 </motion.div>
 </div>
 )}
 </AnimatePresence>

 </div>
 );
}
