"use client";

import { useState, useEffect } from "react";
import api from "../../../services/api";
import { LifeBuoy, Plus, MessageCircle, AlertCircle, Clock, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function ClientSupport() {
 const [tickets, setTickets] = useState([]);
 const [loading, setLoading] = useState(true);
 const [showModal, setShowModal] = useState(false);
 const [formData, setFormData] = useState({ title: '', priority: 'medium', description: '' });

 useEffect(() => {
 fetchTickets();
 }, []);

 const fetchTickets = async () => {
 try {
 const res = await api.get('/tickets');
 if (res.data.success) {
 setTickets(res.data.data);
 }
 } catch (error) {
 toast.error("Không tải được dữ liệu hỗ trợ");
 } finally {
 setLoading(false);
 }
 };

 const handleSubmit = async (e) => {
 e.preventDefault();
 if (!formData.title || !formData.description) {
 toast.error("Vui lòng điền đủ thông tin");
 return;
 }
 try {
 const res = await api.post('/tickets', formData);
 if (res.data.success) {
 toast.success("Đã gửi yêu cầu hỗ trợ!");
 setTickets([res.data.data, ...tickets]);
 setShowModal(false);
 setFormData({ title: '', priority: 'medium', description: '' });
 }
 } catch (error) {
 toast.error("Lỗi gửi yêu cầu.");
 }
 };

 const getStatusColor = (status) => {
 switch (status) {
 case 'open': return 'bg-rose-100 text-rose-600 border-rose-200';
 case 'in_progress': return 'bg-amber-100 text-amber-600 border-amber-200';
 case 'resolved': return 'bg-emerald-100 text-emerald-600 border-emerald-200';
 default: return 'bg-gray-100 text-gray-600 border-white/60';
 }
 };

 const getStatusLabel = (status) => {
 switch (status) {
 case 'open': return 'Đang mở';
 case 'in_progress': return 'Đang xử lý';
 case 'resolved': return 'Đã giải quyết';
 default: return status;
 }
 };

 if (loading) return <div className="p-8 text-gray-500">Đang tải...</div>;

 return (
 <div className="max-w-5xl mx-auto py-8">
 <div className="flex justify-between items-end mb-8">
 <div>
 <h1 className="text-3xl font-bold text-idaz-black mb-2 flex items-center gap-2">
 <LifeBuoy className="text-idaz-orange" /> Hỗ trợ Khách hàng
 </h1>
 <p className="text-gray-500">Gửi yêu cầu hỗ trợ nếu bạn gặp vấn đề với dự án hoặc hệ thống.</p>
 </div>
 <button 
 onClick={() => setShowModal(true)}
 className="bg-idaz-orange hover:bg-idaz-orange-dark text-white px-6 py-3 rounded-3xl font-bold transition-all shadow-md flex items-center gap-2"
 >
 <Plus size={20} /> Tạo Ticket Hỗ trợ
 </button>
 </div>

 {tickets.length === 0 ? (
 <div className="glass-panel border border-white/60 rounded-3xl p-12 text-center shadow-sm">
 <MessageCircle size={48} className="text-slate-300 mx-auto mb-4" />
 <h3 className="text-xl font-bold text-idaz-black mb-2">Bạn chưa có yêu cầu hỗ trợ nào</h3>
 <p className="text-gray-500 mb-6">Nếu có bất kỳ thắc mắc nào, đừng ngần ngại tạo Ticket mới.</p>
 </div>
 ) : (
 <div className="glass-panel border border-white/60 rounded-3xl overflow-hidden shadow-sm">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-idaz-gray border-b border-white/60 text-sm font-bold text-gray-500 uppercase tracking-wider">
 <th className="p-6">Tiêu đề</th>
 <th className="p-6">Trạng thái</th>
 <th className="p-6">Độ ưu tiên</th>
 <th className="p-6">Ngày tạo</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 {tickets.map(ticket => (
 <tr key={ticket._id} className="hover:bg-idaz-gray transition-colors cursor-pointer" onClick={() => window.location.href = `/client/support/${ticket._id}`}>
 <td className="p-6">
 <div className="font-bold text-idaz-black">{ticket.title}</div>
 <div className="text-sm text-gray-500 truncate max-w-xs">{ticket.description}</div>
 </td>
 <td className="p-6">
 <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(ticket.status)}`}>
 {getStatusLabel(ticket.status)}
 </span>
 </td>
 <td className="p-6">
 <span className={`text-sm font-semibold capitalize ${ticket.priority === 'high' ? 'text-rose-600' : ticket.priority === 'medium' ? 'text-amber-600' : 'text-gray-600'}`}>
 {ticket.priority}
 </span>
 </td>
 <td className="p-6 text-sm text-gray-500">
 {new Date(ticket.createdAt).toLocaleDateString('vi-VN')}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}

 {/* Modal */}
 {showModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-idaz-black/50 backdrop-blur-sm">
 <div className="glass-panel rounded-3xl p-8 max-w-lg w-full shadow-2xl">
 <h3 className="text-2xl font-bold text-idaz-black mb-6">Tạo Ticket Hỗ trợ</h3>
 <form onSubmit={handleSubmit} className="space-y-4">
 <div>
 <label className="block text-sm font-bold text-gray-700 mb-1">Tiêu đề</label>
 <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-idaz-gray border border-white/60 rounded-3xl px-4 py-3 text-idaz-black focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="Vấn đề của bạn là gì?" />
 </div>
 <div>
 <label className="block text-sm font-bold text-gray-700 mb-1">Mức độ ưu tiên</label>
 <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})} className="w-full bg-idaz-gray border border-white/60 rounded-3xl px-4 py-3 text-idaz-black focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
 <option value="low">Thấp</option>
 <option value="medium">Trung bình</option>
 <option value="high">Cao / Khẩn cấp</option>
 </select>
 </div>
 <div>
 <label className="block text-sm font-bold text-gray-700 mb-1">Mô tả chi tiết</label>
 <textarea rows="4" required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-idaz-gray border border-white/60 rounded-3xl px-4 py-3 text-idaz-black focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none" placeholder="Mô tả lỗi hoặc câu hỏi của bạn..." />
 </div>
 <div className="flex justify-end gap-3 pt-4">
 <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 rounded-3xl font-bold text-gray-600 hover:bg-gray-100 transition-colors">Hủy</button>
 <button type="submit" className="px-6 py-3 bg-idaz-orange hover:bg-idaz-orange-dark text-white rounded-3xl font-bold transition-all shadow-md">Gửi Yêu cầu</button>
 </div>
 </form>
 </div>
 </div>
 )}
 </div>
 );
}
