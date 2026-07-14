"use client";

import { useState, useEffect, useRef } from "react";
import api from "../../../services/api";
import toast from "react-hot-toast";
import { useAuth } from "../../../context/AuthContext";
import { MessageSquare, Send, CheckCircle, Image as ImageIcon, Edit, Trash2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function ClientFeedbacksContent() {
 const { user } = useAuth();
 const searchParams = useSearchParams();
 const projectId = searchParams.get('projectId');
 
 const [files, setFiles] = useState([]);
 const [activeFile, setActiveFile] = useState(null);
 const [feedbacks, setFeedbacks] = useState([]);
 const [newFeedbackForm, setNewFeedbackForm] = useState(null); // { x, y }
 const [commentContent, setCommentContent] = useState("");
 const imgRef = useRef(null);

 // Các state hỗ trợ sửa đổi và lọc feedbacks
 const [editingFeedbackId, setEditingFeedbackId] = useState(null);
 const [editingFeedbackContent, setEditingFeedbackContent] = useState("");
 const [activeFilter, setActiveFilter] = useState("all"); // "all" | "mine" | "staff"

 useEffect(() => {
 fetchFiles();
 }, [projectId]);

 const fetchFiles = async () => {
 try {
 // In a real scenario, we might filter files by projectId if it exists
 // For now, get all assets for this client
 const { data } = await api.get('/feedbacks/files');
 if (data.success && data.data.length > 0) {
 setFiles(data.data);
 setActiveFile(data.data[0]);
 fetchFeedbacks(data.data[0]._id);
 }
 } catch (error) {
 toast.error("Không tải được danh sách files");
 }
 };

 const fetchFeedbacks = async (fileId) => {
 try {
 const { data } = await api.get(`/feedbacks/files/${fileId}`);
 if (data.success) {
 setFeedbacks(data.data);
 }
 } catch (error) {
 toast.error("Không tải được feedbacks");
 }
 };

 const handleImageClick = (e) => {
 if (!imgRef.current) return;
 const rect = imgRef.current.getBoundingClientRect();
 
 const x = ((e.clientX - rect.left) / rect.width) * 100;
 const y = ((e.clientY - rect.top) / rect.height) * 100;

 setNewFeedbackForm({ x, y });
 };

 const submitFeedback = async (e) => {
 e.preventDefault();
 if (!commentContent.trim() || !activeFile || !newFeedbackForm) return;

 try {
 const { data } = await api.post('/feedbacks', {
 fileId: activeFile._id,
 coordinateX: newFeedbackForm.x,
 coordinateY: newFeedbackForm.y,
 content: commentContent
 });

 if (data.success) {
 setFeedbacks([data.data, ...feedbacks]);
 setNewFeedbackForm(null);
 setCommentContent("");
 toast.success("Đã ghim nhận xét thành công!");
 }
 } catch (error) {
 toast.error("Lỗi khi gửi feedback");
 }
 };

 const resolveFeedback = async (id) => {
 try {
 const { data } = await api.put(`/feedbacks/${id}/resolve`);
 if (data.success) {
 setFeedbacks(feedbacks.map(f => f._id === id ? { ...f, status: 'resolved' } : f));
 toast.success("Đã đánh dấu hoàn tất!");
 }
 } catch (error) {
 toast.error(error.response?.data?.message || "Lỗi khi hoàn tất feedback");
 }
 };

 const handleUpdateFeedback = async (id) => {
 if (!editingFeedbackContent.trim()) return;
 try {
 const { data } = await api.put(`/feedbacks/${id}`, { content: editingFeedbackContent });
 if (data.success) {
 setFeedbacks(feedbacks.map(f => f._id === id ? { ...f, content: editingFeedbackContent } : f));
 setEditingFeedbackId(null);
 setEditingFeedbackContent("");
 toast.success("Đã chỉnh sửa phản hồi thành công!");
 }
 } catch (error) {
 toast.error("Lỗi khi cập nhật phản hồi");
 }
 };

 const handleDeleteFeedback = async (id) => {
 if (!confirm("Bạn có chắc chắn muốn xóa phản hồi này?")) return;
 try {
 const { data } = await api.delete(`/feedbacks/${id}`);
 if (data.success) {
 setFeedbacks(feedbacks.filter(f => f._id !== id));
 toast.success("Đã xóa phản hồi thành công!");
 }
 } catch (error) {
 toast.error("Lỗi khi xóa phản hồi");
 }
 };

 const filteredFeedbacks = feedbacks.filter(fb => {
 const isMine = fb.creatorId === user?._id || fb.creatorId === user?.id;
 if (activeFilter === "mine") return isMine;
 if (activeFilter === "staff") return !isMine;
 return true;
 });

 return (
 <div className="flex h-[calc(100vh-80px)] overflow-hidden -m-8 relative">
 
 {/* Left Column: File List */}
 <div className="w-72 glass-panel border-r border-white/60 flex flex-col z-10 shadow-sm">
 <div className="p-6 border-b border-white/40 bg-idaz-gray/50">
 <h2 className="text-xl font-bold text-idaz-black flex items-center gap-2">
 <ImageIcon size={20} className="text-idaz-orange" /> Bản Thiết Kế
 </h2>
 <p className="text-gray-500 text-sm mt-1">Review & Feedback</p>
 </div>
 <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-idaz-gray">
 {files.map(file => (
 <div 
 key={file._id}
 onClick={() => { setActiveFile(file); fetchFeedbacks(file._id); setNewFeedbackForm(null); }}
 className={`p-3 rounded-3xl cursor-pointer transition-all border ${activeFile?._id === file._id ? 'glass-panel border-orange-200 shadow-md shadow-indigo-100' : 'glass-panel border-white/60 hover:border-gray-300 shadow-sm'}`}
 >
 <div className="aspect-video w-full rounded-3xl overflow-hidden mb-3 bg-gray-100 border border-white/40">
 <img src={file.url} alt={file.title} className="w-full h-full object-cover" />
 </div>
 <h3 className="font-bold text-idaz-black text-sm truncate">{file.title}</h3>
 <p className="text-xs text-gray-500 mt-1">Ngày tải lên: {new Date(file.createdAt).toLocaleDateString()}</p>
 </div>
 ))}
 {files.length === 0 && (
 <div className="text-center text-gray-500 mt-10 text-sm">Chưa có bản thiết kế nào.</div>
 )}
 </div>
 </div>

 {/* Main Area: Canvas */}
 <div className="flex-1 bg-gray-100 overflow-y-auto custom-scrollbar relative p-8">
 {!activeFile ? (
 <div className="h-full flex items-center justify-center text-gray-500">
 Vui lòng chọn một Bản thiết kế để Review
 </div>
 ) : (
 <div className="max-w-5xl mx-auto">
 <div className="mb-6 flex justify-between items-center glass-panel p-4 rounded-3xl shadow-sm border border-white/60">
 <h1 className="text-xl font-bold text-idaz-black">{activeFile.name}</h1>
 <span className="px-4 py-1.5 bg-idaz-orange-light text-idaz-orange rounded-full text-xs font-bold border border-orange-100 animate-pulse flex items-center gap-2">
 <MessageSquare size={14} /> Click vào ảnh để ghim Feedback
 </span>
 </div>

 <div className="relative glass-panel rounded-3xl overflow-hidden border border-white/60 shadow-xl inline-block max-w-full">
 <img 
 ref={imgRef}
 src={activeFile.url} 
 alt={activeFile.name}
 onClick={handleImageClick}
 className="max-w-full h-auto cursor-crosshair block"
 />

 {feedbacks.map((fb, index) => (
 <motion.div
 initial={{ scale: 0 }}
 animate={{ scale: 1 }}
 key={fb._id}
 className={`absolute w-8 h-8 -ml-4 -mt-4 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg cursor-pointer group hover:z-50 transition-colors ${fb.status === 'resolved' ? 'bg-emerald-500 shadow-emerald-500/40' : 'bg-rose-500 shadow-rose-500/40'}`}
 style={{ top: `${fb.coordinateY}%`, left: `${fb.coordinateX}%` }}
 >
 {index + 1}
 
 <div className="absolute top-10 left-1/2 -translate-x-1/2 glass-panel border border-white/60 p-4 rounded-3xl shadow-xl w-64 opacity-0 group-hover:opacity-100 pointer-events-none transition-all scale-95 group-hover:scale-100 origin-top z-50">
 <div className="flex justify-between items-start mb-2">
 <span className="font-bold text-idaz-black text-sm">{fb.creatorName}</span>
 {fb.status === 'resolved' ? (
 <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-200">Đã xử lý</span>
 ) : (
 <span className="text-[10px] bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full border border-rose-200">Đang chờ</span>
 )}
 </div>
 <p className="text-gray-600 text-sm whitespace-pre-wrap">{fb.content}</p>
 </div>
 </motion.div>
 ))}

 <AnimatePresence>
 {newFeedbackForm && (
 <motion.div 
 initial={{ opacity: 0, scale: 0.9, y: 10 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.9 }}
 className="absolute glass-panel border border-white/60 p-4 rounded-3xl shadow-2xl w-72 z-40"
 style={{ 
 top: `calc(${newFeedbackForm.y}% + 15px)`, 
 left: `calc(${newFeedbackForm.x}% - 140px)` 
 }}
 >
 <div 
 className="absolute w-8 h-8 bg-idaz-orange rounded-full flex items-center justify-center border-2 border-white shadow-lg shadow-indigo-600/50"
 style={{ top: '-20px', left: '124px' }}
 >
 <MessageSquare size={14} className="text-white" />
 </div>

 <form onSubmit={submitFeedback} className="mt-2">
 <textarea 
 autoFocus
 value={commentContent}
 onChange={(e) => setCommentContent(e.target.value)}
 placeholder="Để lại nhận xét tại điểm này..."
 className="w-full bg-idaz-gray border border-white/60 rounded-3xl p-3 text-idaz-black text-sm focus:outline-none focus:border-indigo-500 focus:glass-panel transition-colors resize-none h-24"
 />
 <div className="flex gap-2 mt-3">
 <button 
 type="button" 
 onClick={() => setNewFeedbackForm(null)}
 className="flex-1 py-2 rounded-3xl text-gray-500 bg-gray-100 hover:bg-gray-200 text-sm font-medium transition-colors"
 >
 Hủy
 </button>
 <button 
 type="submit" 
 className="flex-1 py-2 rounded-3xl bg-idaz-orange hover:bg-idaz-orange-dark text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors"
 >
 Gửi <Send size={14} />
 </button>
 </div>
 </form>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 </div>
 )}
 </div>

 {/* Right Column: Activity Log */}
 <div className="w-80 glass-panel border-l border-white/60 flex flex-col z-10 shadow-sm">
 <div className="p-6 border-b border-white/40 bg-idaz-gray/50 space-y-3">
 <div className="flex justify-between items-center">
 <h2 className="text-lg font-bold text-idaz-black">Lịch sử Feedback</h2>
 <span className="px-2.5 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-bold">
 {filteredFeedbacks.length} comments
 </span>
 </div>

 {/* Segmented Filter Control */}
 <div className="flex bg-gray-100 p-1 rounded-3xl text-xs font-medium">
 <button 
 onClick={() => setActiveFilter("all")}
 className={`flex-1 py-1.5 rounded-xl transition-all ${activeFilter === "all" ? "glass-panel text-idaz-orange shadow-sm" : "text-gray-600 hover:text-idaz-black"}`}
 >
 Tất cả
 </button>
 <button 
 onClick={() => setActiveFilter("mine")}
 className={`flex-1 py-1.5 rounded-xl transition-all ${activeFilter === "mine" ? "glass-panel text-idaz-orange shadow-sm" : "text-gray-600 hover:text-idaz-black"}`}
 >
 Của tôi
 </button>
 <button 
 onClick={() => setActiveFilter("staff")}
 className={`flex-1 py-1.5 rounded-xl transition-all ${activeFilter === "staff" ? "glass-panel text-idaz-orange shadow-sm" : "text-gray-600 hover:text-idaz-black"}`}
 >
 Admins
 </button>
 </div>
 </div>

 <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-idaz-gray">
 {filteredFeedbacks.map((fb, index) => {
 const isMine = fb.creatorId === user?._id || fb.creatorId === user?.id;
 const isEditing = editingFeedbackId === fb._id;

 return (
 <div key={fb._id} className={`p-4 rounded-3xl border glass-panel shadow-sm transition-all group/item ${fb.status === 'resolved' ? 'border-emerald-200 bg-emerald-50/10' : 'border-white/60'}`}>
 <div className="flex justify-between items-start mb-2">
 <div className="flex items-center gap-2">
 <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${fb.status === 'resolved' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
 {index + 1}
 </div>
 <span className="font-bold text-idaz-black text-sm">{fb.creatorName}</span>
 </div>

 {/* Actions for client feedbacks */}
 {fb.status === 'pending' && isMine && (
 <div className="flex items-center gap-1.5 opacity-0 group-hover/item:opacity-100 transition-opacity">
 {!isEditing && (
 <>
 <button 
 onClick={() => {
 setEditingFeedbackId(fb._id);
 setEditingFeedbackContent(fb.content);
 }} 
 className="p-1 text-gray-400 hover:text-idaz-orange transition-colors"
 title="Sửa phản hồi"
 >
 <Edit size={14} />
 </button>
 <button 
 onClick={() => handleDeleteFeedback(fb._id)} 
 className="p-1 text-gray-400 hover:text-rose-600 transition-colors"
 title="Xóa phản hồi"
 >
 <Trash2 size={14} />
 </button>
 <button 
 onClick={() => resolveFeedback(fb._id)} 
 className="p-1 text-gray-400 hover:text-emerald-500 transition-colors" 
 title="Đánh dấu hoàn tất"
 >
 <CheckCircle size={14} />
 </button>
 </>
 )}
 </div>
 )}
 </div>

 {isEditing ? (
 <div className="mt-2 space-y-2">
 <textarea
 value={editingFeedbackContent}
 onChange={(e) => setEditingFeedbackContent(e.target.value)}
 className="w-full bg-idaz-gray border border-white/60 rounded-3xl p-2.5 text-idaz-black text-sm focus:outline-none focus:border-indigo-500 resize-none h-20"
 />
 <div className="flex gap-2 justify-end">
 <button
 onClick={() => {
 setEditingFeedbackId(null);
 setEditingFeedbackContent("");
 }}
 className="px-3 py-1.5 text-xs text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
 >
 Hủy
 </button>
 <button
 onClick={() => handleUpdateFeedback(fb._id)}
 className="px-3 py-1.5 text-xs text-white bg-idaz-orange hover:bg-idaz-orange-dark font-bold rounded-xl transition-colors"
 >
 Lưu
 </button>
 </div>
 </div>
 ) : (
 <p className="text-gray-600 text-sm whitespace-pre-wrap leading-relaxed mt-2">{fb.content}</p>
 )}
 </div>
 );
 })}
 {feedbacks.length === 0 && (
 <div className="text-center text-gray-400 mt-10 text-sm">Chưa có feedback nào.</div>
 )}
 </div>
 </div>

 </div>
 );
}

export default function ClientFeedbacksPage() {
 return (
 <Suspense fallback={<div className="p-8 text-center text-gray-500 animate-pulse">Đang tải giao diện...</div>}>
 <ClientFeedbacksContent />
 </Suspense>
 );
}
