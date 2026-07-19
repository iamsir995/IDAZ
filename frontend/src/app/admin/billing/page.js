"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Receipt, DollarSign, ArrowUpRight, ArrowDownRight, CreditCard, CheckCircle2, Clock, Plus, X, Trash2, Ban, Search, Edit2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../../services/api";
import { jsPDF } from "jspdf";

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
 const [printInvoice, setPrintInvoice] = useState(null);

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
 setNewInvoice({ userId: '', projectId: '', title: '', amount: '', dueDate: '', status: 'pending', invoiceNumber: `INV-${Date.now().toString().slice(-6)}` });
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

  const handleExportPDF = (inv) => {
    setPrintInvoice(inv);
    
    // Đợi render xong rồi capture
    setTimeout(async () => {
      try {
        const toastId = toast.loading("Đang tạo PDF...");
        
        const element = document.getElementById("invoice-print-area");
        if (!element) throw new Error("Không tìm thấy mẫu in");
        
        const htmlToImage = await import("html-to-image");
        const imgData = await htmlToImage.toPng(element, { pixelRatio: 2, backgroundColor: "#ffffff" });
        
        const pdf = new jsPDF("p", "mm", "a4");
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const imgProps = pdf.getImageProperties(imgData);
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
        pdf.save(`HoaDon_${inv.invoiceNumber}.pdf`);
        
        toast.success("Đã xuất hóa đơn PDF thành công!", { id: toastId });
      } catch (error) {
        console.error("Lỗi xuất PDF:", error);
        toast.error(`Lỗi: ${error.message}`, { id: toastId });
      } finally {
        setPrintInvoice(null);
      }
    }, 500);
  };

  const handleExportXML = (inv) => {
    try {
      const xmlData = `<?xml version="1.0" encoding="UTF-8"?>
<HDon>
  <DLHDon>
    <TTChung>
      <KHMSHDon>1C26TMC</KHMSHDon>
      <KHHDon>TMC</KHHDon>
      <SHDon>${inv.invoiceNumber}</SHDon>
      <TDLap>${new Date(inv.createdAt || Date.now()).toISOString().split('T')[0]}</TDLap>
      <TTHDon>01</TTHDon>
      <DVTTe>VND</DVTTe>
      <TGia>1.0</TGia>
    </TTChung>
    <NDHDon>
      <NMua>
        <Ten>${inv.userId?.name || 'Khach hang'}</Ten>
        <DCTDTu>${inv.userId?.email || ''}</DCTDTu>
        <SDThoai>${inv.userId?.phone || ''}</SDThoai>
      </NMua>
      <DSHHDVu>
        <HHDVu>
          <THHDVu>${inv.title}</THHDVu>
          <DVTinh>Goi</DVTinh>
          <SLuong>1</SLuong>
          <DGia>${inv.amount}</DGia>
          <TTCKhau>0</TTCKhau>
          <ThTien>${inv.amount}</ThTien>
          <TSuat>0</TSuat>
        </HHDVu>
      </DSHHDVu>
      <TToan>
        <TgTCThue>${inv.amount}</TgTCThue>
        <TgTThue>0</TgTThue>
        <TgTTTBSo>${inv.amount}</TgTTTBSo>
      </TToan>
    </NDHDon>
  </DLHDon>
</HDon>`;
      
      const blob = new Blob([xmlData], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `E_Invoice_${inv.invoiceNumber}.xml`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success("Đã xuất Hóa đơn điện tử (XML) thành công");
    } catch (error) {
      toast.error("Lỗi xuất Hóa đơn điện tử");
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
 
 <div className="flex-1 overflow-auto custom-scrollbar min-w-0 px-2">
  <table className="w-full text-left border-collapse min-w-[800px]">
  <thead>
  <tr className="border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
  <th className="p-5 pl-6">Mã Hóa đơn</th>
  <th className="p-5">Khách hàng</th>
  <th className="p-5">Hạn thanh toán</th>
  <th className="p-5 text-right">Số tiền</th>
  <th className="p-5 text-center">Trạng thái</th>
  <th className="p-5 pr-6 text-right">Hành động</th>
  </tr>
  </thead>
  <tbody>
  {filteredInvoices.length === 0 && (
  <tr><td colSpan="6" className="text-center p-12 text-gray-400 text-sm">Chưa có hóa đơn nào phù hợp.</td></tr>
  )}
  {filteredInvoices.map((inv, idx) => (
  <motion.tr
  initial={{ opacity: 0, y: 5 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: idx * 0.03 }}
  key={inv._id}
  className="border-b border-gray-100 hover:bg-white/80 transition-all group text-sm even:bg-gray-50/50"
  >
  <td className="p-5 pl-6">
    <span className="font-mono font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md text-xs">{inv.invoiceNumber}</span>
  </td>
  <td className="p-5">
  <div className="flex flex-col">
    <span className="text-idaz-black font-semibold">{inv.title}</span>
    <span className="text-xs text-gray-500 mt-0.5">
      KH: <span className="text-gray-700 font-medium">{inv.userId?.name || 'N/A'}</span>
      {inv.projectId && <span className="ml-2 text-indigo-500">({inv.projectId.title})</span>}
    </span>
  </div>
  </td>
  <td className="p-5 text-gray-500">{new Date(inv.dueDate).toLocaleDateString('vi-VN')}</td>
  <td className="p-5 text-right text-idaz-black font-bold text-base">{inv.amount.toLocaleString('vi-VN')} ₫</td>
  <td className="p-5 text-center">
  <span className={`inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
  inv.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
  inv.status === 'cancelled' ? 'bg-gray-100 text-gray-600 border-gray-200' :
  'bg-amber-50 text-amber-700 border-amber-200'
  }`}>
  {inv.status === 'paid' ? <CheckCircle2 size={12} className="text-emerald-600" /> : null}
  {inv.status === 'paid' ? 'Đã thu' : inv.status === 'cancelled' ? 'Đã huỷ' : 'Chờ thu'}
  </span>
  </td>
  <td className="p-5 pr-6">
    <div className="flex items-center justify-end gap-2 mt-2">
      <button onClick={() => handleExportPDF(inv)}
        className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-3 py-1.5 rounded-lg transition-colors font-bold border border-indigo-100">
        Xuất PDF
      </button>
      <button onClick={() => handleExportXML(inv)}
        className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-600 px-3 py-1.5 rounded-lg transition-colors font-bold border border-emerald-100">
        Xuất HĐĐT (XML)
      </button>
    </div>
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

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

      {/* Hidden Invoice Template for PDF Export */}
      {printInvoice && (
        <div style={{ position: 'absolute', left: '-9999px', top: 0, zIndex: -100 }}>
          <div id="invoice-print-area" className="w-[800px] bg-[#ffffff] p-12 font-sans text-[#1f2937]" style={{ minHeight: '1131px' }}>
            {/* Brand Header */}
            <div className="flex justify-between items-start border-b-2 border-[#f3f4f6] pb-8 mb-8">
              <div>
                <h1 className="text-4xl font-black text-[#4f46e5] tracking-tighter mb-2">IDAZ AGENCY</h1>
                <p className="text-sm text-[#6b7280]">Tầng 12, Tòa nhà Bitexco, Q1, TP.HCM</p>
                <p className="text-sm text-[#6b7280]">contact@idazagency.com | 0987.654.321</p>
              </div>
              <div className="text-right">
                <h2 className="text-3xl font-bold text-[#1f2937] uppercase tracking-widest mb-2">HÓA ĐƠN</h2>
                <p className="text-sm text-[#6b7280] font-bold">Số: {printInvoice.invoiceNumber}</p>
                <p className="text-sm text-[#6b7280]">Ngày lập: {new Date(printInvoice.createdAt || Date.now()).toLocaleDateString('vi-VN')}</p>
                <p className="text-sm text-gray-500">Hạn thanh toán: {new Date(printInvoice.dueDate).toLocaleDateString('vi-VN')}</p>
              </div>
            </div>
            
            {/* Client Info */}
            <div className="flex justify-between items-start mb-10 bg-gray-50 p-6 rounded-2xl border border-gray-100">
              <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Thông tin khách hàng</h3>
                <p className="text-lg font-bold text-gray-800">{printInvoice.userId?.name || 'Khách hàng'}</p>
                <p className="text-sm text-gray-600">{printInvoice.userId?.company || 'Cá nhân / Doanh nghiệp'}</p>
                <p className="text-sm text-gray-600">{printInvoice.userId?.email || ''}</p>
                <p className="text-sm text-gray-600">{printInvoice.userId?.phone || ''}</p>
              </div>
              <div className="text-right">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Dự án liên kết</h3>
                <p className="text-base font-bold text-gray-800">{printInvoice.projectId?.title || 'Dịch vụ rời'}</p>
                {printInvoice.projectId && (
                  <p className="text-sm text-gray-600">ID: {printInvoice.projectId?._id?.substring(18) || 'N/A'}</p>
                )}
              </div>
            </div>

            {/* Invoice Items */}
            <table className="w-full mb-10 text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-800">
                  <th className="py-4 text-sm font-bold text-gray-800 uppercase tracking-wider">Mô tả dịch vụ</th>
                  <th className="py-4 text-sm font-bold text-gray-800 uppercase tracking-wider text-right">Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-6">
                    <p className="font-bold text-gray-800 text-lg">{printInvoice.title}</p>
                    <p className="text-sm text-gray-500 mt-1">Hạng mục thanh toán theo thỏa thuận hoặc hợp đồng.</p>
                  </td>
                  <td className="py-6 text-right font-bold text-gray-800 text-lg">
                    {printInvoice.amount.toLocaleString('vi-VN')} VNĐ
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Summary */}
            <div className="flex justify-end mb-12">
              <div className="w-1/2">
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-500 font-medium">Tạm tính:</span>
                  <span className="font-bold text-gray-800">{printInvoice.amount.toLocaleString('vi-VN')} VNĐ</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-500 font-medium">VAT (0%):</span>
                  <span className="font-bold text-gray-800">0 VNĐ</span>
                </div>
                <div className="flex justify-between py-4 border-b-2 border-gray-800">
                  <span className="text-xl font-black text-gray-900">TỔNG CỘNG:</span>
                  <span className="text-2xl font-black text-indigo-600">{printInvoice.amount.toLocaleString('vi-VN')} VNĐ</span>
                </div>
              </div>
            </div>

            {/* Footer / Payment Info */}
            <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100">
              <h3 className="text-sm font-bold text-indigo-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                <CreditCard size={16} /> Thông tin thanh toán
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Ngân hàng</p>
                  <p className="text-sm font-bold text-indigo-900">Vietcombank</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Chi nhánh</p>
                  <p className="text-sm font-bold text-indigo-900">TP. Hồ Chí Minh</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Số tài khoản</p>
                  <p className="text-base font-black text-indigo-600">0123456789</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Chủ tài khoản</p>
                  <p className="text-sm font-bold text-indigo-900">IDAZ AGENCY VN</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-indigo-100">
                <p className="text-sm text-gray-500 mb-1">Nội dung chuyển khoản (Bắt buộc)</p>
                <p className="text-sm font-bold text-indigo-900 tracking-wider bg-white px-3 py-1.5 rounded-lg inline-block border border-indigo-100 shadow-sm">
                  {printInvoice.invoiceNumber} THANH TOAN
                </p>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400 font-medium">Cảm ơn quý khách đã tin tưởng và sử dụng dịch vụ của IDAZ Agency.</p>
              <p className="text-xs text-gray-400 mt-1">Hóa đơn này được xuất tự động từ hệ thống quản lý IDAZ CRM.</p>
            </div>
          </div>
        </div>
      )}
 </div>
 );
}
