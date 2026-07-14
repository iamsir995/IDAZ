"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
 FolderKanban, MessageSquare, CheckCircle2, X, Edit2, Trash2,
 Sparkles, Loader2, Calendar, Clock, Receipt, ListTodo,
 AlertTriangle, ChevronRight, Plus, TrendingUp, Target
} from "lucide-react";
import api from "../../../services/api";
import toast from "react-hot-toast";
import ImageUpload from "../../../components/admin/ImageUpload";

const STATUS_MAP = {
 pending: { label: "Chờ xử lý", color: "bg-amber-500/20 text-amber-400 border-amber-500/20" },
 designing: { label: "Thiết kế", color: "bg-purple-500/20 text-purple-400 border-purple-500/20" },
 coding: { label: "Lập trình", color: "bg-indigo-500/20 text-indigo-400 border-indigo-500/20" },
 done: { label: "Hoàn thành", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/20" },
};

function getDeadlineAlert(deadline) {
 if (!deadline) return null;
 const diff = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
 if (diff < 0) return { label: "Trễ hạn!", color: "border-zinc-700 bg-gray-100/20", badge: "bg-gray-700 text-gray-600" };
 if (diff <= 3) return { label: `⚠ ${diff} ngày!`, color: "border-red-500/50 bg-red-500/5", badge: "bg-red-500/20 text-red-400" };
 if (diff <= 7) return { label: `${diff} ngày`, color: "border-amber-500/30 bg-amber-500/5", badge: "bg-amber-500/20 text-amber-400" };
 return null;
}

const generateAiDescription = async (data, setData) => {
 if (!data.title) {
 import("react-hot-toast").then(mod => mod.default.error("Vui lòng nhập Tên dự án trước khi nhờ AI viết"));
 return;
 }
 import("react-hot-toast").then(async mod => {
 const toast = mod.default;
 const toastId = toast.loading("AI đang viết nội dung...");
 try {
 const res = await api.post('/projects/ai-generate', { topic: data.title });
 if (res.data.success) {
 setData({ ...data, description: res.data.data });
 toast.success("Đã sinh nội dung thành công!", { id: toastId });
 }
 } catch (err) {
 toast.error("Lỗi khi sinh nội dung", { id: toastId });
 }
 });
};

const ProjectForm = ({ data, setData, onSubmit, title, submitLabel, onClose, clients }) => (
 <form onSubmit={onSubmit} className="space-y-4">
 <div>
 <ImageUpload 
  label="Ảnh bìa dự án" 
  folder="projects" 
  value={data.imageUrl} 
  onChange={(url) => setData({ ...data, imageUrl: url })} 
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-gray-400 mb-1">Tên dự án</label>
 <input required type="text" value={data.title} onChange={e => setData({ ...data, title: e.target.value })}
 className="w-full glass-panel border border-white/60 rounded-3xl px-4 py-3 text-idaz-black text-sm focus:outline-none focus:border-rose-500 transition-colors"
 placeholder="VD: Thiết kế App CRM" />
 </div>
 <div>
 <label className="block text-sm font-medium text-gray-400 mb-1">Khách hàng</label>
 <select value={data.clientId || ''} onChange={e => setData({ ...data, clientId: e.target.value })}
 className="w-full glass-panel border border-white/60 rounded-3xl px-4 py-3 text-idaz-black text-sm focus:outline-none focus:border-rose-500 transition-colors">
 <option value="">-- Chọn khách hàng --</option>
 {clients.map(c => <option key={c._id} value={c._id}>{c.name} ({c.email})</option>)}
 </select>
 </div>
 <div>
 <label className="block text-sm font-medium text-gray-400 mb-1">Danh mục</label>
 <select value={data.category || 'Website'} onChange={e => setData({ ...data, category: e.target.value })}
 className="w-full glass-panel border border-white/60 rounded-3xl px-4 py-3 text-idaz-black text-sm focus:outline-none focus:border-rose-500 transition-colors">
 <option value="Website">Website</option>
 <option value="Mobile App">Mobile App</option>
 <option value="Branding">Branding</option>
 <option value="Marketing">Marketing</option>
 </select>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-medium text-gray-400 mb-1">Trạng thái</label>
 <select value={data.status} onChange={e => setData({ ...data, status: e.target.value })}
 className="w-full glass-panel border border-white/60 rounded-3xl px-4 py-3 text-idaz-black text-sm focus:outline-none focus:border-rose-500 transition-colors">
 <option value="pending">Chờ xử lý</option>
 <option value="designing">Thiết kế</option>
 <option value="coding">Lập trình</option>
 <option value="done">Hoàn thành</option>
 </select>
 </div>
 <div>
 <label className="block text-sm font-medium text-gray-400 mb-1">Deadline</label>
 <input type="date" value={data.deadline ? data.deadline.slice(0, 10) : ''} onChange={e => setData({ ...data, deadline: e.target.value })}
 className="w-full glass-panel border border-white/60 rounded-3xl px-4 py-3 text-idaz-black text-sm focus:outline-none focus:border-rose-500 transition-colors" />
 </div>
 </div>
 {data.progress !== undefined && (
 <div>
 <label className="block text-sm font-medium text-gray-400 mb-1">Tiến độ: <span className="text-idaz-black">{data.progress}%</span></label>
 <input type="range" min="0" max="100" value={data.progress || 0} onChange={e => setData({ ...data, progress: Number(e.target.value) })}
 className="w-full" style={{ background: `linear-gradient(to right, #e11d48 ${data.progress || 0}%, #ffffff ${data.progress || 0}%)` }} />
 </div>
 )}
 {/* Tách Brief và Description */}
 <div>
 <label className="block text-sm font-medium text-gray-400 mb-1">Brief (Yêu cầu gốc của khách)</label>
 <textarea rows={2} value={data.brief || ''} onChange={e => setData({ ...data, brief: e.target.value })}
 className="w-full glass-panel border border-white/60 rounded-3xl px-4 py-3 text-idaz-black text-sm focus:outline-none focus:border-rose-500 transition-colors resize-none"
 placeholder="Yêu cầu thô ban đầu..." />
 </div>
 <div>
 <div className="flex items-center justify-between mb-1">
 <label className="block text-sm font-medium text-gray-400">Mô tả chuyên nghiệp</label>
 <button type="button" onClick={() => generateAiDescription(data, setData)} className="text-xs text-indigo-400 flex items-center gap-1 hover:text-indigo-300 transition-colors">
 <Sparkles size={12} /> Viết bằng AI
 </button>
 </div>
 <textarea rows={4} value={data.description || ''} onChange={e => setData({ ...data, description: e.target.value })}
 className="w-full glass-panel border border-white/60 rounded-3xl px-4 py-3 text-idaz-black text-sm focus:outline-none focus:border-rose-500 transition-colors resize-none whitespace-pre-wrap font-mono text-[13px]"
 placeholder="Mô tả chuyên nghiệp, Markdown..." />
 </div>
 <div className="pt-2 flex gap-3">
 <button type="button" onClick={onClose} className="flex-1 bg-white/5 hover:bg-white/10 text-gray-600 rounded-3xl py-3 font-bold transition-all">Huỷ</button>
 <button type="submit" className="flex-1 bg-rose-600 hover:bg-rose-700 text-idaz-black rounded-3xl py-3 font-bold transition-all shadow-[0_0_15px_rgba(225,29,72,0.3)]">{submitLabel}</button>
 </div>
 </form>
);

export default function ProjectsBoard() {
 const [projects, setProjects] = useState([]);
 const [clients, setClients] = useState([]);
 const [isLoading, setIsLoading] = useState(true);

 // Add modal
 const [isAddModalOpen, setIsAddModalOpen] = useState(false);
 const [newProject, setNewProject] = useState({ title: '', category: 'Website', clientId: '', deadline: '', status: 'pending', description: '', brief: '' });

 // Edit modal
 const [isEditModalOpen, setIsEditModalOpen] = useState(false);
 const [editProject, setEditProject] = useState(null);

 // Drawer
 const [drawerProject, setDrawerProject] = useState(null);
 const [drawerTab, setDrawerTab] = useState("overview");
 const [drawerTasks, setDrawerTasks] = useState([]);
 const [drawerInvoices, setDrawerInvoices] = useState([]);
 const [drawerLoading, setDrawerLoading] = useState(false);

 // AI brief panel
 const [selectedBrief, setSelectedBrief] = useState(null);
 const [isAiLoading, setIsAiLoading] = useState(false);
 const [aiSummary, setAiSummary] = useState(null);

 const fetchProjects = async () => {
 try {
 const { data } = await api.get('/projects');
 if (data.success) setProjects(data.data);
 } catch { toast.error("Không thể tải danh sách dự án"); }
 finally { setIsLoading(false); }
 };

 const fetchClients = async () => {
 try {
 const { data } = await api.get('/users', { params: { role: 'client', limit: 100 } });
 if (data.success) setClients(data.data);
 } catch { /**/ }
 };

 useEffect(() => {
 fetchProjects();
 fetchClients();
 }, []);

 const openDrawer = async (project) => {
 setDrawerProject(project);
 setDrawerTab("overview");
 setDrawerLoading(true);
 try {
 const [taskRes, invoiceRes] = await Promise.all([
 api.get(`/tasks?projectId=${project._id}`),
 api.get('/invoices'),
 ]);
 if (taskRes.data.success) setDrawerTasks(taskRes.data.data);
 if (invoiceRes.data.success)
 setDrawerInvoices(invoiceRes.data.data.filter(inv =>
 inv.projectId?._id === project._id || inv.projectId === project._id
 ));
 } catch { /**/ }
 finally { setDrawerLoading(false); }
 };

 const handleCreateProject = async (e) => {
 e.preventDefault();
 try {
 const payload = { ...newProject };
 if (!payload.clientId) delete payload.clientId;
 if (!payload.deadline) delete payload.deadline;
 if (!payload.description) payload.description = 'Đang cập nhật...';
 const { data } = await api.post('/projects', payload);
 if (data.success) {
 toast.success("Tạo dự án thành công!");
 setIsAddModalOpen(false);
 setNewProject({ title: '', category: 'Website', clientId: '', deadline: '', status: 'pending', description: '', brief: '' });
 fetchProjects();
 }
 } catch (err) { toast.error(err.response?.data?.message || "Lỗi tạo dự án"); }
 };

 const handleEditProject = async (e) => {
 e.preventDefault();
 try {
 const payload = { ...editProject };
 if (!payload.clientId) delete payload.clientId;
 if (!payload.deadline) delete payload.deadline;
 if (!payload.description) payload.description = 'Đang cập nhật...';
 const { data } = await api.put(`/projects/${editProject._id}`, payload);
 if (data.success) {
 toast.success("Cập nhật dự án thành công!");
 setIsEditModalOpen(false);
 setEditProject(null);
 fetchProjects();
 if (drawerProject?._id === editProject._id) openDrawer({ ...drawerProject, ...editProject });
 }
 } catch { toast.error("Lỗi cập nhật dự án"); }
 };

 const handleUpdateProgress = async (id, progress, status) => {
 try {
 const { data } = await api.put(`/projects/${id}`, { progress, status });
 if (data.success) { fetchProjects(); }
 } catch { toast.error("Lỗi cập nhật tiến độ"); }
 };

 const handleDeleteProject = async (id) => {
 if (!confirm("Xóa dự án này?")) return;
 try {
 const { data } = await api.delete(`/projects/${id}`);
 if (data.success) {
 toast.success("Đã xóa dự án");
 if (drawerProject?._id === id) setDrawerProject(null);
 fetchProjects();
 }
 } catch { toast.error("Lỗi xóa dự án"); }
 };

 const handleAiSummarize = () => {
 setIsAiLoading(true);
 setTimeout(() => {
 setAiSummary({
 summary: selectedBrief.brief || "Khách hàng từ lĩnh vực Công nghệ. Họ nhắm đến tệp khách hàng: Doanh nghiệp B2B. Phong cách thiết kế yêu cầu: Sang trọng, Hiện đại.",
 actionItems: ["Lên moodboard tập trung vào sự sang trọng, hiện đại", "Nghiên cứu tệp B2B để chọn tone màu xanh đậm/đen", "Gửi bản nháp UI trong 3 ngày tới"]
 });
 setIsAiLoading(false);
 }, 1500);
 };

 return (
 <div className="max-w-7xl mx-auto h-full flex flex-col relative">
 {/* Header */}
 <div className="flex items-center justify-between mb-6 shrink-0">
  <div>
  <h1 className="text-title-1 font-bold text-idaz-black mb-1">Dự án & Tiến độ</h1>
  <p className="text-gray-400 text-footnote">Theo dõi toàn bộ dự án — Click vào thẻ để xem chi tiết, Tasks và Hóa đơn.</p>
  </div>
  <button onClick={() => setIsAddModalOpen(true)}
  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-idaz-black rounded-3xl text-footnote font-bold transition-all shadow-[0_0_15px_rgba(225,29,72,0.3)] flex items-center gap-2">
 <Plus size={18} /> Tạo dự án mới
 </button>
 </div>

 <div className="grid md:grid-cols-3 gap-6 flex-1 overflow-hidden">
 {/* Cột 1: Danh sách Dự án */}
 <div className="md:col-span-2 space-y-4 overflow-y-auto pr-2 custom-scrollbar pb-10">
  {isLoading ? (
  <div className="glass-panel border border-white/60 rounded-3xl p-10 flex flex-col items-center justify-center text-center opacity-70">
  <Loader2 size={40} className="text-rose-500 animate-spin mb-4" />
  <h3 className="text-title-3 font-bold text-idaz-black mb-1">Đang tải dữ liệu</h3>
  <p className="text-footnote text-gray-500">Vui lòng đợi một lát...</p>
  </div>
  ) : projects.length === 0 ? (
  <div className="glass-panel border border-white/60 rounded-3xl p-10 flex flex-col items-center justify-center text-center">
  <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mb-4">
  <FolderKanban size={32} className="text-rose-400" />
  </div>
  <h3 className="text-title-3 font-bold text-idaz-black mb-1">Chưa có dự án nào</h3>
  <p className="text-footnote text-gray-500 max-w-sm mb-6">Bạn chưa tạo dự án nào. Bấm nút "Tạo dự án mới" ở góc phải để bắt đầu.</p>
  <button onClick={() => setIsAddModalOpen(true)}
  className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-idaz-black rounded-3xl text-footnote font-bold transition-all shadow-[0_0_15px_rgba(225,29,72,0.3)] flex items-center gap-2">
  <Plus size={18} /> Tạo dự án mới
  </button>
  </div>
  ) : projects.map((project) => {
 const alert = getDeadlineAlert(project.deadline);
 const status = STATUS_MAP[project.status] || STATUS_MAP.pending;
 return (
 <motion.div
 key={project._id}
 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
 className={`glass-panel border p-5 rounded-3xl transition-all cursor-pointer group ${
 alert?.color || 'border-white/40 hover:border-white/15'
 } ${drawerProject?._id === project._id ? 'border-rose-500/50 shadow-[0_0_20px_rgba(225,29,72,0.1)]' : ''}`}
 onClick={() => openDrawer(project)}
 >
 <div className="flex items-start justify-between gap-4">
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 mb-2 flex-wrap">
 <span className="text-xs text-zinc-600 font-mono">{project._id?.slice(-5).toUpperCase()}</span>
 <span className={`px-2 py-0.5 rounded text-xs font-bold border ${status.color}`}>{status.label}</span>
 {alert && (
 <span className={`px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1 ${alert.badge}`}>
 <AlertTriangle size={10} /> {alert.label}
 </span>
 )}
 </div>
  <h3 className="text-title-3 font-bold text-idaz-black mb-1 truncate">{project.title}</h3>
  <p className="text-footnote text-gray-500">Khách hàng: <span className="text-gray-600 font-medium">{project.clientName || project.clientId?.name || 'N/A'}</span></p>
 </div>

 <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
 <button onClick={e => { e.stopPropagation(); setEditProject({ ...project, progress: project.progress || 0 }); setIsEditModalOpen(true); }}
 className="p-2 bg-white/5 hover:bg-indigo-500/20 hover:text-indigo-400 text-gray-400 rounded-xl transition-colors"><Edit2 size={14} /></button>
 <button onClick={e => { e.stopPropagation(); handleDeleteProject(project._id); }}
 className="p-2 bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-gray-400 rounded-xl transition-colors"><Trash2 size={14} /></button>
 </div>
 </div>

 {/* Progress slider */}
 <div className="mt-4 flex items-center gap-3" onClick={e => e.stopPropagation()}>
 <input type="range" min="0" max="100"
 value={project.progress || 0}
 onChange={e => handleUpdateProgress(project._id, e.target.value, project.status)}
 className="flex-1 h-2 glass-panel rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-rose-500 [&::-webkit-slider-thumb]:rounded-full"
 style={{ background: `linear-gradient(to right, #e11d48 ${project.progress || 0}%, #ffffff ${project.progress || 0}%)` }}
 />
  <span className="text-caption-1 text-gray-400 font-medium w-8 text-right">{project.progress || 0}%</span>
  <div className="flex items-center gap-1 text-caption-1 text-gray-500">
  <Calendar size={12} />
  <span>{project.deadline ? new Date(project.deadline).toLocaleDateString('vi-VN') : '—'}</span>
 </div>
 <ChevronRight size={16} className="text-zinc-600 group-hover:text-gray-400 transition-colors" />
 </div>
 </motion.div>
 );
 })}
 </div>

 {/* Cột 2: AI Panel / Drawer Placeholder */}
 {!drawerProject ? (
  <div className="glass-panel border border-white/60 rounded-3xl p-6 h-[70vh] flex flex-col relative overflow-hidden">
  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full" />
  <h2 className="text-title-3 font-bold text-idaz-black mb-4 flex items-center gap-2">
  <Sparkles className="text-indigo-400" size={20} /> Trợ lý AI
  </h2>
  {!selectedBrief ? (
  <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
  <Target size={40} className="text-zinc-600 mb-4" />
  <p className="text-footnote text-gray-400">Click vào dự án bên trái để xem chi tiết hoặc nhờ AI phân tích Brief.</p>
  </div>
 ) : (
 <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
 <div className="mb-4 p-4 glass-panel rounded-3xl border border-white/40 text-sm text-gray-600 whitespace-pre-wrap">
 {selectedBrief.brief || "Chưa có Brief chi tiết."}
 </div>
 {!aiSummary ? (
 <button onClick={handleAiSummarize} disabled={isAiLoading}
 className="w-full bg-indigo-600 hover:bg-indigo-700 text-idaz-black px-6 py-3 rounded-3xl font-bold text-sm transition-all flex items-center justify-center gap-2">
 {isAiLoading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
 {isAiLoading ? "AI đang phân tích..." : "Nhờ AI phân tích Brief"}
 </button>
 ) : (
 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
 <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-3xl">
 <h4 className="text-xs font-bold text-indigo-400 uppercase mb-2">Tóm tắt Cốt lõi</h4>
 <p className="text-sm text-gray-600 leading-relaxed">{aiSummary.summary}</p>
 </div>
 <ul className="space-y-2">
 {aiSummary.actionItems.map((item, i) => (
 <li key={i} className="flex items-start gap-2 glass-panel p-3 rounded-3xl border border-white/40">
 <CheckCircle2 size={15} className="text-emerald-500 mt-0.5 shrink-0" />
 <span className="text-sm text-gray-600">{item}</span>
 </li>
 ))}
 </ul>
 </motion.div>
 )}
 </div>
 )}
 </div>
 ) : null}
 </div>

 {/* ═══ PROJECT DRAWER ═══ */}
 <AnimatePresence>
 {drawerProject && (
 <>
 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
 className="fixed inset-0 bg-white/50 z-40" onClick={() => setDrawerProject(null)} />
 <motion.div
 initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
 transition={{ type: "spring", stiffness: 300, damping: 30 }}
 className="fixed top-0 right-0 h-full w-full max-w-lg bg-idaz-gray border-l border-white/60 z-50 flex flex-col shadow-2xl"
 >
 {/* Drawer Header */}
 <div className="p-6 border-b border-white/60 shrink-0">
 <div className="flex items-start justify-between mb-4">
 <div className="flex-1 min-w-0 pr-4">
 <div className="flex items-center gap-2 mb-2">
 <span className={`px-2 py-0.5 rounded text-xs font-bold border ${STATUS_MAP[drawerProject.status]?.color || ''}`}>
 {STATUS_MAP[drawerProject.status]?.label}
 </span>
 {getDeadlineAlert(drawerProject.deadline) && (
 <span className={`px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1 ${getDeadlineAlert(drawerProject.deadline).badge}`}>
 <AlertTriangle size={10} /> {getDeadlineAlert(drawerProject.deadline).label}
 </span>
 )}
 </div>
 <h2 className="text-xl font-bold text-idaz-black truncate">{drawerProject.title}</h2>
 <p className="text-sm text-gray-400 mt-1">KH: {drawerProject.clientName || drawerProject.clientId?.name || 'N/A'}</p>
 </div>
 <div className="flex items-center gap-2 shrink-0">
 <button onClick={() => { setEditProject({ ...drawerProject, progress: drawerProject.progress || 0 }); setIsEditModalOpen(true); }}
 className="p-2 bg-white/5 hover:bg-indigo-500/20 hover:text-indigo-400 text-gray-400 rounded-xl transition-colors"><Edit2 size={16} /></button>
 <button onClick={() => setDrawerProject(null)} className="p-2 hover:bg-white/10 text-gray-400 hover:text-idaz-black rounded-xl transition-colors"><X size={18} /></button>
 </div>
 </div>

 {/* Progress bar */}
 <div className="flex items-center gap-3">
 <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
 <motion.div className="h-full bg-gradient-to-r from-rose-500 to-indigo-500 rounded-full"
 initial={{ width: 0 }} animate={{ width: `${drawerProject.progress || 0}%` }} />
 </div>
 <span className="text-sm font-bold text-idaz-black w-10 text-right">{drawerProject.progress || 0}%</span>
 </div>

 {/* Tab nav */}
 <div className="flex gap-1 mt-4">
 {[
 { id: "overview", label: "Tổng quan", icon: <TrendingUp size={14} /> },
 { id: "tasks", label: `Tasks (${drawerTasks.length})`, icon: <ListTodo size={14} /> },
 { id: "invoices", label: `Hóa đơn (${drawerInvoices.length})`, icon: <Receipt size={14} /> },
 ].map(tab => (
 <button key={tab.id} onClick={() => setDrawerTab(tab.id)}
 className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
 drawerTab === tab.id ? 'bg-rose-600 text-idaz-black' : 'text-gray-400 hover:text-idaz-black hover:bg-white/5'
 }`}>
 {tab.icon} {tab.label}
 </button>
 ))}
 </div>
 </div>

 {/* Drawer Content */}
 <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
 {drawerLoading ? (
 <div className="flex items-center justify-center h-32 text-gray-500"><Loader2 size={24} className="animate-spin" /></div>
 ) : (
 <>
 {/* Tab: Tổng quan */}
 {drawerTab === "overview" && (
 <div className="space-y-5">
 <div className="grid grid-cols-2 gap-3">
 <div className="glass-panel rounded-3xl p-4">
 <div className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Calendar size={12} /> Deadline</div>
 <div className="font-bold text-idaz-black text-sm">{drawerProject.deadline ? new Date(drawerProject.deadline).toLocaleDateString('vi-VN') : 'Chưa có'}</div>
 </div>
 <div className="glass-panel rounded-3xl p-4">
 <div className="text-xs text-gray-500 mb-1 flex items-center gap-1"><ListTodo size={12} /> Tasks</div>
 <div className="font-bold text-idaz-black text-sm">{drawerTasks.length} nhiệm vụ</div>
 </div>
 <div className="glass-panel rounded-3xl p-4">
 <div className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Receipt size={12} /> Doanh thu</div>
 <div className="font-bold text-rose-400 text-sm">{(drawerProject.revenue || 0).toLocaleString('vi-VN')} ₫</div>
 </div>
 <div className="glass-panel rounded-3xl p-4">
 <div className="text-xs text-gray-500 mb-1 flex items-center gap-1"><CheckCircle2 size={12} /> Hóa đơn</div>
 <div className="font-bold text-idaz-black text-sm">{drawerInvoices.length} hóa đơn</div>
 </div>
 </div>

 {(drawerProject.brief || drawerProject.description) && (
 <div>
 <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Brief / Mô tả</h4>
 <div className="glass-panel rounded-3xl p-4 text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
 {drawerProject.brief || drawerProject.description}
 </div>
 </div>
 )}

 <div>
 <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Trạng thái tiến độ chỉnh nhanh</h4>
 <select value={drawerProject.status}
 onChange={e => { handleUpdateProgress(drawerProject._id, drawerProject.progress || 0, e.target.value); setDrawerProject({ ...drawerProject, status: e.target.value }); }}
 className="w-full glass-panel border border-white/60 rounded-3xl px-4 py-3 text-idaz-black text-sm focus:outline-none focus:border-rose-500 transition-colors">
 <option value="pending">Chờ xử lý</option>
 <option value="designing">Thiết kế</option>
 <option value="coding">Lập trình</option>
 <option value="done">Hoàn thành</option>
 </select>
 </div>
 </div>
 )}

 {/* Tab: Tasks */}
 {drawerTab === "tasks" && (
 <div className="space-y-2">
 {drawerTasks.length === 0 ? (
 <div className="text-center py-12 text-zinc-600">
 <ListTodo size={32} className="mx-auto mb-3 opacity-50" />
 <p className="text-sm">Chưa có task nào thuộc dự án này</p>
 </div>
 ) : drawerTasks.map(task => (
 <div key={task._id} className="glass-panel rounded-3xl p-3 flex items-center justify-between">
 <div className="flex-1 min-w-0">
 <div className="font-medium text-idaz-black text-sm truncate">{task.title}</div>
 <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
 <span className={`${task.status === 'done' ? 'text-emerald-400' : task.status === 'in_progress' ? 'text-amber-400' : 'text-gray-500'}`}>
 {task.status === 'done' ? '✓ Xong' : task.status === 'in_progress' ? '⟳ Đang xử lý' : '○ Chờ'}
 </span>
 {task.assignee && <span>• {task.assignee.name}</span>}
 {task.dueDate && <span>• {new Date(task.dueDate).toLocaleDateString('vi-VN')}</span>}
 </div>
 </div>
 {task.priority && task.priority !== 'normal' && (
 <span className={`text-xs font-bold px-2 py-0.5 rounded-full ml-2 ${task.priority === 'urgent' ? 'text-red-400 bg-red-500/10' : 'text-orange-400 bg-orange-500/10'}`}>
 {task.priority}
 </span>
 )}
 </div>
 ))}
 </div>
 )}

 {/* Tab: Invoices */}
 {drawerTab === "invoices" && (
 <div className="space-y-2">
 {drawerInvoices.length === 0 ? (
 <div className="text-center py-12 text-zinc-600">
 <Receipt size={32} className="mx-auto mb-3 opacity-50" />
 <p className="text-sm">Chưa có hóa đơn nào cho dự án này</p>
 </div>
 ) : drawerInvoices.map(inv => (
 <div key={inv._id} className="glass-panel rounded-3xl p-3 flex items-center justify-between">
 <div>
 <div className="font-medium text-idaz-black text-sm">{inv.title}</div>
 <div className="text-xs text-gray-500 mt-0.5">{inv.invoiceNumber}</div>
 </div>
 <div className="text-right">
 <div className="font-bold text-idaz-black text-sm">{inv.amount?.toLocaleString('vi-VN')} ₫</div>
 <span className={`text-xs font-bold ${inv.status === 'paid' ? 'text-emerald-400' : inv.status === 'cancelled' ? 'text-gray-500' : 'text-amber-400'}`}>
 {inv.status === 'paid' ? '✓ Đã thu' : inv.status === 'cancelled' ? '✕ Đã huỷ' : '⏳ Chờ thu'}
 </span>
 </div>
 </div>
 ))}
 </div>
 )}
 </>
 )}
 </div>

 {/* Drawer Footer - AI brief */}
 <div className="p-4 border-t border-white/60 shrink-0">
 <button onClick={() => { setSelectedBrief(drawerProject); setAiSummary(null); setDrawerProject(null); }}
 className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/20 rounded-3xl text-sm font-bold transition-all">
 <Sparkles size={16} /> Nhờ AI phân tích Brief
 </button>
 </div>
 </motion.div>
 </>
 )}
 </AnimatePresence>

 {/* ═══ MODAL Tạo Dự án ═══ */}
 <AnimatePresence>
 {isAddModalOpen && (
 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
 className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
 <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
 className="bg-idaz-gray border border-white/60 rounded-3xl p-6 w-full max-w-md shadow-2xl">
 <div className="flex items-center justify-between mb-6">
 <h3 className="text-xl font-bold text-idaz-black">Tạo Dự Án Mới</h3>
 <button onClick={() => setIsAddModalOpen(false)} className="text-gray-500 hover:text-idaz-black transition-colors"><X size={20} /></button>
 </div>
 <ProjectForm data={newProject} setData={setNewProject} onSubmit={handleCreateProject}
 submitLabel="Tạo Dự Án" onClose={() => setIsAddModalOpen(false)} clients={clients} />
 </motion.div>
 </motion.div>
 )}
 </AnimatePresence>

 {/* ═══ MODAL Edit Dự án ═══ */}
 <AnimatePresence>
 {isEditModalOpen && editProject && (
 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
 className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
 <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
 className="bg-idaz-gray border border-white/60 rounded-3xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
 <div className="flex items-center justify-between mb-6">
 <h3 className="text-xl font-bold text-idaz-black">Chỉnh sửa Dự án</h3>
 <button onClick={() => { setIsEditModalOpen(false); setEditProject(null); }} className="text-gray-500 hover:text-idaz-black transition-colors"><X size={20} /></button>
 </div>
 <ProjectForm data={editProject} setData={setEditProject} onSubmit={handleEditProject}
 submitLabel="Lưu thay đổi" onClose={() => { setIsEditModalOpen(false); setEditProject(null); }} clients={clients} />
 </motion.div>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 );
}
