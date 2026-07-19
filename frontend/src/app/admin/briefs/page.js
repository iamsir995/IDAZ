"use client";

import { useState, useEffect } from "react";
import api from "../../../services/api";
import { ClipboardList, Sparkles, User, Calendar, CheckCircle, Target, Zap, FileText } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminBriefs() {
 const [briefs, setBriefs] = useState([]);
 const [loading, setLoading] = useState(true);
 const [aiSummaries, setAiSummaries] = useState({});
 const [summarizingId, setSummarizingId] = useState(null);
 const [editingBrief, setEditingBrief] = useState(null);
 const [editFormData, setEditFormData] = useState({});

 useEffect(() => {
 fetchBriefs();
 }, []);

 const fetchBriefs = async () => {
 try {
 // Vì không có route get tất cả brief, có thể cần cập nhật Backend hoặc viết tạm route nếu có
 // Theo schema, chỉ có getMyBrief (của client). Cần bổ sung GET /api/brief cho admin.
 const res = await api.get('/brief'); 
 if (res.data.success) {
 setBriefs(res.data.data);
 }
 } catch (error) {
 toast.error("Không tải được danh sách Khảo sát");
 } finally {
 setLoading(false);
 }
 };

 const handleAISummary = async (id) => {
 if (aiSummaries[id]) return; // Đã có tóm tắt thì ko gọi lại
 setSummarizingId(id);
 try {
 const res = await api.get(`/brief/${id}/ai-summary`);
 if (res.data.success) {
 setAiSummaries(prev => ({ ...prev, [id]: res.data.data }));
 toast.success("AI đã hoàn tất tóm tắt!");
 }
 } catch (error) {
 toast.error("Lỗi khi AI phân tích bản khảo sát");
 } finally {
 setSummarizingId(null);
 }
 };

 const openEditModal = (brief) => {
 setEditingBrief(brief);
 setEditFormData({
 companyName: brief.companyName || "",
 industry: brief.industry || "",
 targetAudience: brief.targetAudience || "",
 status: brief.status || "submitted",
 budget: brief.budget || "",
 timeline: brief.timeline || ""
 });
 };

 const handleUpdateBrief = async (e) => {
 e.preventDefault();
 try {
 const res = await api.put(`/brief/${editingBrief._id}`, editFormData);
 if (res.data.success) {
 toast.success("Đã cập nhật bản khảo sát");
 setBriefs(briefs.map(b => b._id === editingBrief._id ? res.data.data : b));
 setEditingBrief(null);
 }
 } catch (error) {
 toast.error("Lỗi cập nhật Khảo sát");
 }
 };

 if (loading) return <div className="p-8 text-gray-500">Đang tải...</div>;

 return (
 <div className="max-w-7xl mx-auto pb-12">
 <div className="flex justify-between items-end mb-8">
 <div>
 <h1 className="text-3xl font-bold text-idaz-black tracking-tight flex items-center gap-3">
 <ClipboardList className="text-indigo-500" /> Quản lý Khảo sát (Briefs)
 </h1>
 <p className="text-gray-500 mt-1">Xem các bản khảo sát yêu cầu thiết kế từ khách hàng và phân tích bằng AI.</p>
 </div>
 </div>

 <div className="space-y-6">
 {briefs.length === 0 ? (
 <div className="text-center py-12 bg-gray-50 rounded-3xl border border-white/40 text-gray-500">
 Chưa có bản khảo sát nào.
 </div>
 ) : briefs.map(brief => (
 <div key={brief._id} className="glass-panel border border-white/40 rounded-3xl p-6 shadow-lg">
 <div className="flex justify-between items-start mb-6 border-b border-white/40 pb-6">
 <div>
 <h2 className="text-2xl font-bold text-idaz-black flex items-center gap-2 mb-2">
 {brief.companyName}
 <span className="text-xs px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-full font-medium ml-2 uppercase">
 {brief.status}
 </span>
 </h2>
 <div className="flex items-center gap-6 text-sm text-gray-400">
 <span className="flex items-center gap-1"><User size={16} /> User ID: {brief.userId?.name || brief.userId}</span>
 <span className="flex items-center gap-1"><Calendar size={16} /> {new Date(brief.createdAt).toLocaleDateString('vi-VN')}</span>
 <span className="flex items-center gap-1"><Target size={16} /> Ngành: <strong className="text-idaz-black">{brief.industry}</strong></span>
 </div>
 </div>
 <div className="flex gap-2">
 <button 
 onClick={() => handleAISummary(brief._id)}
 disabled={summarizingId === brief._id}
 className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-idaz-black rounded-3xl font-bold transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] flex items-center gap-2 disabled:opacity-50"
 >
 {summarizingId === brief._id ? (
 <span className="animate-pulse">Đang phân tích...</span>
 ) : (
 <><Sparkles size={18} /> Phân tích bằng AI</>
 )}
 </button>
 <button
 onClick={() => openEditModal(brief)}
 className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-idaz-black rounded-3xl font-bold transition-all shadow-sm flex items-center gap-2"
 >
 Chỉnh sửa
 </button>
 </div>
 </div>

 <div className="grid md:grid-cols-2 gap-8">
 {/* Nguyên bản */}
 <div className="space-y-4">
 <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Dữ liệu gốc</h3>
 <div className="bg-white/50 p-4 rounded-3xl border border-white/40">
 <p className="text-sm text-gray-400 mb-1">Khách hàng mục tiêu:</p>
 <p className="text-idaz-black text-sm">{brief.targetAudience || "Chưa cung cấp"}</p>
 </div>
 <div className="bg-white/50 p-4 rounded-3xl border border-white/40">
 <p className="text-sm text-gray-400 mb-1">Phong cách thương hiệu:</p>
 <p className="text-idaz-black text-sm">{brief.brandPersonality?.join(', ') || "Chưa cung cấp"}</p>
 </div>
 <div className="bg-white/50 p-4 rounded-3xl border border-white/40">
 <p className="text-sm text-gray-400 mb-1">Đối thủ cạnh tranh / Ghi chú thêm:</p>
 <p className="text-idaz-black text-sm mb-2">{brief.competitors || "Không có đối thủ cụ thể"}</p>
 <p className="text-idaz-black text-sm">{brief.additionalNotes || ""}</p>
 </div>
 </div>

 {/* AI Summary */}
 <div>
 <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-2">
 <Sparkles size={16} /> AI Insight & Action Items
 </h3>
 {aiSummaries[brief._id] ? (
 <div className="bg-indigo-950/30 p-6 rounded-3xl border border-indigo-500/20 h-full flex flex-col">
 <div className="mb-6 flex-1">
 <p className="text-sm text-indigo-200 leading-relaxed font-medium">
 "{aiSummaries[brief._id].summary}"
 </p>
 </div>
 <div>
 <h4 className="text-xs font-bold text-indigo-400 uppercase mb-3">Hành động đề xuất (Action Items)</h4>
 <ul className="space-y-2">
 {aiSummaries[brief._id].actionItems.map((item, idx) => (
 <li key={idx} className="flex items-start gap-2 text-sm text-indigo-100">
 <CheckCircle size={16} className="text-indigo-400 shrink-0 mt-0.5" />
 {item}
 </li>
 ))}
 </ul>
 </div>
 </div>
 ) : (
 <div className="bg-white/20 p-6 rounded-3xl border border-white/40 h-full flex flex-col items-center justify-center text-center">
 <Zap size={32} className="text-gray-300 mb-3" />
 <p className="text-sm text-gray-500">Chưa có phân tích AI. Nhấn nút "Phân tích bằng AI" để AI đọc và tóm tắt bản brief này.</p>
 </div>
 )}
 </div>
 </div>
 </div>
 ))}
 </div>

 {/* Edit Modal */}
 {editingBrief && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
 <div className="glass-panel rounded-3xl p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
 <h3 className="text-2xl font-bold text-idaz-black mb-6">Chỉnh sửa Brief: {editingBrief.companyName}</h3>
 <form onSubmit={handleUpdateBrief} className="space-y-4">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-bold text-gray-700 mb-1">Tên doanh nghiệp</label>
 <input type="text" value={editFormData.companyName} onChange={e => setEditFormData({...editFormData, companyName: e.target.value})} className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-2 text-idaz-black focus:border-indigo-500 focus:outline-none" />
 </div>
 <div>
 <label className="block text-sm font-bold text-gray-700 mb-1">Trạng thái</label>
 <select value={editFormData.status} onChange={e => setEditFormData({...editFormData, status: e.target.value})} className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-2 text-idaz-black focus:border-indigo-500 focus:outline-none">
 <option value="submitted">Đã nộp (Mới)</option>
 <option value="reviewed">Đang xem xét</option>
 <option value="approved">Đã chấp nhận</option>
 <option value="rejected">Từ chối</option>
 </select>
 </div>
 <div>
 <label className="block text-sm font-bold text-gray-700 mb-1">Ngành nghề</label>
 <input type="text" value={editFormData.industry} onChange={e => setEditFormData({...editFormData, industry: e.target.value})} className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-2 text-idaz-black focus:border-indigo-500 focus:outline-none" />
 </div>
 <div>
 <label className="block text-sm font-bold text-gray-700 mb-1">Khách hàng mục tiêu</label>
 <input type="text" value={editFormData.targetAudience} onChange={e => setEditFormData({...editFormData, targetAudience: e.target.value})} className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-2 text-idaz-black focus:border-indigo-500 focus:outline-none" />
 </div>
 <div>
 <label className="block text-sm font-bold text-gray-700 mb-1">Ngân sách</label>
 <input type="text" value={editFormData.budget} onChange={e => setEditFormData({...editFormData, budget: e.target.value})} className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-2 text-idaz-black focus:border-indigo-500 focus:outline-none" />
 </div>
 <div>
 <label className="block text-sm font-bold text-gray-700 mb-1">Thời gian</label>
 <input type="text" value={editFormData.timeline} onChange={e => setEditFormData({...editFormData, timeline: e.target.value})} className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-2 text-idaz-black focus:border-indigo-500 focus:outline-none" />
 </div>
 </div>
 
 <div className="flex justify-end gap-3 pt-6">
 <button type="button" onClick={() => setEditingBrief(null)} className="px-6 py-2.5 rounded-2xl font-bold text-gray-600 hover:bg-gray-100 transition-colors">Hủy</button>
 <button type="submit" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all shadow-md">Lưu thay đổi</button>
 </div>
 </form>
 </div>
 </div>
 )}

 </div>
 );
}
