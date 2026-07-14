"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../services/api";
import { motion } from "framer-motion";
import { ClipboardList, Target, Briefcase, Zap, FileText } from "lucide-react";
import toast from "react-hot-toast";

export default function ClientBrief() {
 const { user } = useAuth();
 const [brief, setBrief] = useState(null);
 const [loading, setLoading] = useState(true);
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [isEditing, setIsEditing] = useState(false);
 const [formData, setFormData] = useState({
 companyName: "",
 industry: "",
 targetAudience: "",
 brandPersonality: [],
 competitors: "",
 additionalNotes: ""
 });

 const personalities = [
 "Sang trọng", "Tối giản", "Hiện đại", "Cổ điển", "Năng động", "Thân thiện", "Sáng tạo", "Đột phá"
 ];

 useEffect(() => {
 fetchMyBrief();
 }, []);

 const fetchMyBrief = async () => {
 try {
 const res = await api.get('/brief/my-brief');
 if (res.data.success && res.data.data) {
 setBrief(res.data.data);
 }
 } catch (error) {
 console.log("No brief found");
 } finally {
 setLoading(false);
 }
 };

 const handleTogglePersonality = (trait) => {
 if (formData.brandPersonality.includes(trait)) {
 setFormData({
 ...formData,
 brandPersonality: formData.brandPersonality.filter(t => t !== trait)
 });
 } else {
 if (formData.brandPersonality.length >= 3) {
 toast.error("Vui lòng chọn tối đa 3 phong cách");
 return;
 }
 setFormData({
 ...formData,
 brandPersonality: [...formData.brandPersonality, trait]
 });
 }
 };

 const handleSubmit = async (e) => {
 e.preventDefault();
 setIsSubmitting(true);
 try {
 let res;
 if (isEditing) {
 res = await api.put('/brief', formData);
 } else {
 res = await api.post('/brief', formData);
 }
 
 if (res.data.success) {
 toast.success(isEditing ? "Đã cập nhật bản khảo sát!" : "Đã gửi bản khảo sát thành công!");
 setBrief(res.data.data);
 setIsEditing(false);
 }
 } catch (error) {
 toast.error(error.response?.data?.message || "Lỗi khi gửi bản khảo sát");
 } finally {
 setIsSubmitting(false);
 }
 };

 const handleEdit = () => {
 setFormData({
 companyName: brief.companyName || "",
 industry: brief.industry || "",
 targetAudience: brief.targetAudience || "",
 brandPersonality: brief.brandPersonality || [],
 competitors: brief.competitors || "",
 additionalNotes: brief.additionalNotes || ""
 });
 setIsEditing(true);
 };

 if (loading) return <div className="p-8 text-gray-500">Đang tải...</div>;

 if (brief && !isEditing) {
 return (
 <div className="max-w-4xl mx-auto py-8">
 <div className="glass-panel border border-emerald-200 rounded-3xl p-8 shadow-sm flex items-start gap-6">
 <div className="w-16 h-16 rounded-3xl bg-emerald-100 flex items-center justify-center shrink-0">
 <ClipboardList size={32} className="text-emerald-600" />
 </div>
 <div>
 <h2 className="text-2xl font-bold text-idaz-black mb-2">Đã nhận Bản Khảo sát!</h2>
 <p className="text-gray-600 mb-6">
 Cảm ơn bạn đã cung cấp thông tin. Đội ngũ Account và Design của chúng tôi đang phân tích yêu cầu của <strong>{brief.companyName}</strong> và sẽ liên hệ lại với bạn trong thời gian sớm nhất để thống nhất hướng đi.
 </p>
 <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
 <div className="bg-idaz-gray p-4 rounded-3xl border border-white/40">
 <span className="block text-gray-400 font-medium mb-1">Ngành nghề</span>
 <span className="font-semibold">{brief.industry}</span>
 </div>
 <div className="bg-idaz-gray p-4 rounded-3xl border border-white/40">
 <span className="block text-gray-400 font-medium mb-1">Phong cách thương hiệu</span>
 <span className="font-semibold">{brief.brandPersonality?.join(', ')}</span>
 </div>
 </div>
 <div className="mt-6 border-t border-white/40 pt-6">
 <button 
 onClick={handleEdit}
 className="px-6 py-2.5 glass-panel border border-white/60 text-gray-700 font-medium rounded-3xl hover:bg-idaz-gray transition-colors shadow-sm"
 >
 Chỉnh sửa bản khảo sát
 </button>
 </div>
 </div>
 </div>
 </div>
 );
 }

 return (
 <div className="max-w-4xl mx-auto py-8">
 <div className="mb-8 flex items-center justify-between">
 <div>
 <h1 className="text-3xl font-bold text-idaz-black mb-2">
 {isEditing ? "Chỉnh sửa Khảo sát" : "Khảo sát Yêu cầu (Creative Brief)"}
 </h1>
 <p className="text-gray-500">Giúp chúng tôi hiểu rõ hơn về doanh nghiệp và mục tiêu của bạn để mang lại những sản phẩm thiết kế xuất sắc nhất.</p>
 </div>
 {isEditing && (
 <button 
 onClick={() => setIsEditing(false)}
 className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors font-medium"
 >
 Hủy chỉnh sửa
 </button>
 )}
 </div>

 <form onSubmit={handleSubmit} className="glass-panel border border-white/60 rounded-3xl p-8 shadow-sm space-y-8">
 
 {/* Company Info */}
 <div className="space-y-6">
 <h3 className="text-lg font-bold text-idaz-black flex items-center gap-2">
 <Briefcase size={20} className="text-idaz-orange" /> Thông tin Doanh nghiệp
 </h3>
 <div className="grid md:grid-cols-2 gap-6">
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-2">Tên công ty / Dự án</label>
 <input type="text" required value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} className="w-full bg-idaz-gray border border-white/60 rounded-3xl px-4 py-3 text-idaz-black focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors" placeholder="VD: Agency Inc." />
 </div>
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-2">Lĩnh vực hoạt động</label>
 <input type="text" required value={formData.industry} onChange={e => setFormData({...formData, industry: e.target.value})} className="w-full bg-idaz-gray border border-white/60 rounded-3xl px-4 py-3 text-idaz-black focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors" placeholder="VD: Công nghệ, F&B, Bán lẻ..." />
 </div>
 </div>
 </div>

 {/* Target Audience */}
 <div className="space-y-6">
 <h3 className="text-lg font-bold text-idaz-black flex items-center gap-2">
 <Target size={20} className="text-idaz-orange" /> Khách hàng Mục tiêu
 </h3>
 <div>
 <textarea required rows="3" value={formData.targetAudience} onChange={e => setFormData({...formData, targetAudience: e.target.value})} className="w-full bg-idaz-gray border border-white/60 rounded-3xl px-4 py-3 text-idaz-black focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors resize-none" placeholder="Độ tuổi, giới tính, sở thích, hành vi của khách hàng mà bạn nhắm tới..." />
 </div>
 </div>

 {/* Brand Personality */}
 <div className="space-y-6">
 <h3 className="text-lg font-bold text-idaz-black flex items-center gap-2">
 <Zap size={20} className="text-idaz-orange" /> Phong cách Thương hiệu (Tối đa 3)
 </h3>
 <div className="flex flex-wrap gap-3">
 {personalities.map(trait => {
 const isSelected = formData.brandPersonality.includes(trait);
 return (
 <button
 type="button"
 key={trait}
 onClick={() => handleTogglePersonality(trait)}
 className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${isSelected ? 'bg-idaz-orange text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
 >
 {trait}
 </button>
 );
 })}
 </div>
 </div>

 {/* Competitors & Notes */}
 <div className="space-y-6">
 <h3 className="text-lg font-bold text-idaz-black flex items-center gap-2">
 <FileText size={20} className="text-idaz-orange" /> Thông tin Bổ sung
 </h3>
 <div className="space-y-4">
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-2">Đối thủ cạnh tranh chính</label>
 <input type="text" value={formData.competitors} onChange={e => setFormData({...formData, competitors: e.target.value})} className="w-full bg-idaz-gray border border-white/60 rounded-3xl px-4 py-3 text-idaz-black focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors" placeholder="VD: Apple, Samsung..." />
 </div>
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-2">Yêu cầu đặc biệt (Màu sắc, Font chữ...)</label>
 <textarea rows="4" value={formData.additionalNotes} onChange={e => setFormData({...formData, additionalNotes: e.target.value})} className="w-full bg-idaz-gray border border-white/60 rounded-3xl px-4 py-3 text-idaz-black focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors resize-none" placeholder="VD: Tôi không thích màu đỏ, hãy dùng tone màu xanh lá..." />
 </div>
 </div>
 </div>

 <button disabled={isSubmitting} type="submit" className="w-full py-4 bg-idaz-orange hover:bg-idaz-orange-dark text-white font-bold rounded-3xl transition-all shadow-md disabled:opacity-50">
 {isSubmitting ? "Đang xử lý..." : (isEditing ? "Cập nhật Bản Khảo sát" : "Gửi Bản Khảo sát")}
 </button>

 </form>
 </div>
 );
}
