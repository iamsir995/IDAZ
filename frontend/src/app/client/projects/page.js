"use client";

import { useState, useEffect } from "react";
import { Search, Folder, Calendar, Download, Eye, Link as LinkIcon, MessageSquare, X, CheckCircle, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../../services/api";
import Link from "next/link";

export default function ClientProjects() {
 const [searchQuery, setSearchQuery] = useState("");
 const [projects, setProjects] = useState([]);
 const [loading, setLoading] = useState(true);
 const [selectedProject, setSelectedProject] = useState(null);
 const [projectTasks, setProjectTasks] = useState([]);
 const [tasksLoading, setTasksLoading] = useState(false);

 useEffect(() => {
 const fetchProjects = async () => {
 try {
 const res = await api.get('/projects/my-projects');
 if (res.data.success) {
 setProjects(res.data.data);
 }
 } catch (error) {
 console.error("Error fetching projects:", error);
 } finally {
 setLoading(false);
 }
 };
 fetchProjects();
 }, []);

 useEffect(() => {
 if (selectedProject) {
 setTasksLoading(true);
 api.get(`/tasks?projectId=${selectedProject._id}`)
 .then(res => {
 if (res.data.success) {
 // Chỉ lấy các task đã done hoặc liên quan đến client
 setProjectTasks(res.data.data.filter(t => t.status === 'done' || t.role === 'all' || t.status === 'in_progress'));
 }
 })
 .catch(console.error)
 .finally(() => setTasksLoading(false));
 } else {
 setProjectTasks([]);
 }
 }, [selectedProject]);

 const filteredProjects = projects.filter(p => p.title?.toLowerCase().includes(searchQuery.toLowerCase()));

 return (
 <div className="max-w-6xl mx-auto">
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
 <div>
 <h1 className="text-3xl font-bold text-idaz-black">Dự án của tôi</h1>
 <p className="text-gray-500 mt-1">Danh sách tất cả các dự án bạn đang hợp tác với chúng tôi</p>
 </div>
 
 <div className="relative w-full sm:w-auto">
 <input 
 type="text" 
 placeholder="Tìm kiếm dự án..." 
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="w-full sm:w-72 pl-10 pr-4 py-2 glass-panel border border-white/60 rounded-3xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
 />
 <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
 </div>
 </div>

 {loading ? (
 <div className="text-center py-20 text-gray-500">Đang tải danh sách dự án...</div>
 ) : filteredProjects.length === 0 ? (
 <div className="text-center py-20 text-gray-500">Không tìm thấy dự án nào.</div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {filteredProjects.map((project, index) => (
 <motion.div 
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: index * 0.1 }}
 key={project._id}
 className="glass-panel border border-white/60 rounded-[32px] overflow-hidden hover:shadow-xl transition-all group"
 >
 <div className="p-8">
 <div className="flex justify-between items-start mb-6">
 <div className="w-12 h-12 rounded-3xl bg-idaz-orange-light text-idaz-orange flex items-center justify-center border border-orange-100">
 <Folder size={24} />
 </div>
 <span className={`px-3 py-1 rounded-full text-xs font-bold border ${project.status === 'done' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : project.progress > 0 ? 'bg-idaz-orange-light text-idaz-orange border-orange-100' : 'bg-gray-100 text-gray-600 border-white/60'}`}>
 {project.status === 'done' ? 'Hoàn thành' : project.status === 'coding' ? 'Đang Lập trình' : project.status === 'designing' ? 'Đang Thiết kế' : 'Chờ xử lý'}
 </span>
 </div>
 
 <h3 className="font-bold text-lg text-idaz-black mb-1 line-clamp-1">{project.title}</h3>
 <p className="text-sm text-gray-500 flex items-center gap-1 mb-6">
 <Calendar size={14} /> Hạn chót: {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'Chưa có'}
 </p>

 <div className="mb-2 flex justify-between items-center text-sm">
 <span className="font-medium text-gray-700">Tiến độ</span>
 <span className="font-bold text-idaz-orange">{project.progress || 0}%</span>
 </div>
 <div className="w-full bg-gray-100 rounded-full h-2 mb-6">
 <div className="bg-idaz-orange h-2 rounded-full transition-all duration-1000" style={{ width: `${project.progress || 0}%` }}></div>
 </div>

 <div className="flex gap-2">
 <button 
 onClick={() => setSelectedProject(project)}
 className="flex-1 py-3 bg-idaz-orange hover:bg-orange-600 text-white rounded-2xl text-sm font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 hover:-translate-y-0.5"
 >
 <Eye size={16} /> Xem Chi Tiết
 </button>
 {project.progress > 0 && (
 <Link href={`/client/feedbacks?projectId=${project._id}`} className="py-3 px-5 bg-white/50 hover:bg-white border border-white/60 text-idaz-black rounded-2xl text-sm font-bold transition-all shadow-sm hover:shadow-md flex items-center justify-center hover:-translate-y-0.5" title="Xem File Feedback">
 <MessageSquare size={18} />
 </Link>
 )}
 </div>
 </div>
 </motion.div>
 ))}
 </div>
 )}

 {/* Project Detail Modal */}
 <AnimatePresence>
 {selectedProject && (
 <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
 <motion.div 
 initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
 onClick={() => setSelectedProject(null)}
 className="absolute inset-0 bg-idaz-black/60 backdrop-blur-sm"
 />
 <motion.div 
 initial={{ opacity: 0, scale: 0.95, y: 20 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.95, y: 20 }}
 className="relative w-full max-w-4xl glass-panel rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-white/40"
 >
 {/* Header */}
 <div className="p-8 border-b border-white/40 flex items-start justify-between bg-white/20 backdrop-blur-md">
 <div className="flex items-center gap-4">
 <div className="w-14 h-14 bg-orange-100 text-idaz-orange rounded-3xl flex items-center justify-center">
 <Folder size={28} />
 </div>
 <div>
 <h2 className="text-2xl font-bold text-idaz-black">{selectedProject.title}</h2>
 <div className="flex items-center gap-3 mt-1">
 <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${selectedProject.status === 'done' ? 'bg-emerald-100 text-emerald-700' : selectedProject.progress > 0 ? 'bg-orange-100 text-idaz-orange-dark' : 'bg-gray-200 text-gray-700'}`}>
 {selectedProject.status}
 </span>
 <span className="text-sm text-gray-500 flex items-center gap-1">
 <Calendar size={14} /> 
 {selectedProject.deadline ? new Date(selectedProject.deadline).toLocaleDateString('vi-VN') : 'Chưa có'}
 </span>
 </div>
 </div>
 </div>
 <button 
 onClick={() => setSelectedProject(null)}
 className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-3xl transition-colors"
 >
 <X size={24} />
 </button>
 </div>

 {/* Body */}
 <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-white/30 backdrop-blur-sm">
 <div className="mb-10 bg-white/40 border border-white/60 p-6 rounded-[24px] shadow-sm">
 <div className="flex justify-between items-end mb-4">
 <h3 className="text-sm font-bold text-idaz-black">Tiến độ tổng thể</h3>
 <span className="text-2xl font-extrabold text-idaz-orange">{selectedProject.progress}%</span>
 </div>
 <div className="w-full bg-gray-100 rounded-full h-3">
 <div 
 className="bg-idaz-orange h-3 rounded-full transition-all duration-1000 relative overflow-hidden" 
 style={{ width: `${selectedProject.progress}%` }}
 >
 <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]" style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)' }} />
 </div>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="space-y-8">
 <div>
 <h3 className="text-sm font-bold text-idaz-black uppercase tracking-wider mb-4 flex items-center gap-2"><Folder size={16} className="text-idaz-orange" /> Mô tả dự án</h3>
 <div className="glass-panel bg-white/60 rounded-[24px] p-6 text-gray-700 text-[15px] leading-relaxed whitespace-pre-wrap border border-white/60 shadow-sm">
 {selectedProject.description || "Chưa có mô tả."}
 </div>
 </div>
 <div>
 <h3 className="text-sm font-bold text-idaz-black uppercase tracking-wider mb-4 flex items-center gap-2"><MessageSquare size={16} className="text-indigo-500" /> Yêu cầu (Brief)</h3>
 <div className="glass-panel bg-white/60 rounded-[24px] p-6 text-gray-700 text-[15px] leading-relaxed whitespace-pre-wrap border border-white/60 max-h-[250px] overflow-y-auto custom-scrollbar shadow-sm">
 {selectedProject.brief || "Chưa có thông tin Brief."}
 </div>
 </div>
 {selectedProject.projectUrl && (
 <div>
 <h3 className="text-sm font-bold text-idaz-black uppercase tracking-wider mb-4 flex items-center gap-2"><LinkIcon size={16} className="text-emerald-500" /> Liên kết nghiệm thu</h3>
 <a href={selectedProject.projectUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 px-6 py-4 glass-panel bg-white/60 hover:bg-white border border-white/80 text-idaz-black rounded-[20px] transition-all font-bold text-[15px] shadow-sm hover:shadow-md hover:-translate-y-0.5">
 <span className="text-emerald-600">Truy cập Link</span>
 <ChevronRight size={18} className="text-gray-400" />
 </a>
 </div>
 )}
 </div>
 
 {/* Tasks / Feedback Loop */}
 <div className="flex flex-col h-full">
 <h3 className="text-sm font-bold text-idaz-black uppercase tracking-wider mb-4 flex items-center gap-2"><CheckCircle size={16} className="text-rose-500" /> Hạng mục cần duyệt</h3>
 <div className="glass-panel bg-white/40 rounded-[24px] p-6 border border-white/60 flex-1 overflow-y-auto custom-scrollbar max-h-[500px] shadow-inner">
 {tasksLoading ? (
 <div className="text-center py-8 text-gray-400 text-sm animate-pulse">Đang tải hạng mục...</div>
 ) : projectTasks.length === 0 ? (
 <div className="text-center py-12 text-gray-400 flex flex-col items-center">
 <CheckCircle size={32} className="mb-2 opacity-50" />
 <p className="text-sm">Chưa có hạng mục nào cần duyệt</p>
 </div>
 ) : (
 <div className="space-y-3">
 {projectTasks.map(task => (
 <div key={task._id} className="glass-panel p-3 rounded-3xl border border-white/60 shadow-sm flex flex-col gap-2 transition-shadow hover:shadow-md">
 <div className="flex justify-between items-start">
 <span className="font-bold text-sm text-idaz-black">{task.title}</span>
 <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
 task.status === 'done' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
 }`}>
 {task.status === 'done' ? 'Đã hoàn thành' : 'Đang xử lý'}
 </span>
 </div>
 {task.comments?.length > 0 && (
 <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
 <MessageSquare size={12} /> {task.comments.length} bình luận
 </div>
 )}
 {task.status === 'done' && (
 <button className="mt-2 w-full py-1.5 bg-idaz-orange-light text-idaz-orange-dark rounded-xl text-xs font-bold hover:bg-orange-100 transition-colors">
 Xem & Duyệt
 </button>
 )}
 </div>
 ))}
 </div>
 )}
 </div>
 </div>
 </div>
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>
 </div>
 );
}
