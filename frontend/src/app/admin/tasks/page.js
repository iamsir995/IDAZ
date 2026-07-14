"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
 CheckCircle2, Circle, Clock, LayoutGrid, 
 ListTodo, Sparkles, FolderKanban, Plus, X, Trash2, Edit2, AlertCircle, Calendar, UserCircle, Filter
} from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import toast from "react-hot-toast";
import api from "../../../services/api";
import { useAuth } from "../../../context/AuthContext";
import { useSocket } from "../../../context/SocketContext";
import TaskDetailModal from "../../../components/TaskDetailModal";

const PRIORITY_CONFIG = {
 urgent: { label: "Khẩn cấp", color: "bg-red-500/20 text-red-400 border-red-500/30" },
 high: { label: "Cao", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
 normal: { label: "Bình thường", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
 low: { label: "Thấp", color: "bg-zinc-500/20 text-gray-400 border-zinc-500/30" },
};

export default function TaskManagement() {
 const [activeTab, setActiveTab] = useState("all");
 const [tasks, setTasks] = useState([]);
 const [users, setUsers] = useState([]);
 const [projects, setProjects] = useState([]);
 const [isReady, setIsReady] = useState(false);
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [selectedTask, setSelectedTask] = useState(null);
 const [filterAssignee, setFilterAssignee] = useState("all");
 const { user } = useAuth();
 const { subscribe } = useSocket();
 const componentId = useRef(`tasks-${Date.now()}`).current;

 const emptyTask = { title: '', role: 'dev', projectId: '', assignee: '', dueDate: '', priority: 'normal' };
 const [newTask, setNewTask] = useState(emptyTask);

 // Edit task modal
 const [editingTask, setEditingTask] = useState(null);
 const [isEditModalOpen, setIsEditModalOpen] = useState(false);

 useEffect(() => {
 setIsReady(true);
 fetchTasks();
 fetchUsers();
 fetchProjects();
 }, []);

 // ✅ Realtime: Lắng nghe task_updated từ SocketContext
 useEffect(() => {
 const unsub = subscribe('task_updated', componentId, ({ taskId, status }) => {
 setTasks(prev => prev.map(t => 
 (t._id === taskId || t.id === taskId) ? { ...t, status, id: t._id } : t
 ));
 });
 return () => unsub && unsub();
 }, [subscribe]);

 const fetchProjects = async () => {
 try {
 const res = await api.get("/projects");
 if (res.data.success) setProjects(res.data.data);
 } catch { /**/ }
 };

 const fetchUsers = async () => {
 try {
 const res = await api.get("/users", { params: { limit: 100 } });
 if (res.data.success) setUsers(res.data.data.filter(u => u.role !== 'client'));
 } catch { /**/ }
 };

 const fetchTasks = async () => {
 try {
 const res = await api.get("/tasks");
 if (res.data.success) {
 setTasks(res.data.data.map(t => ({ ...t, id: t._id })));
 }
 } catch {
 toast.error("Không thể tải danh sách công việc");
 }
 };

 const handleCreateTask = async (e) => {
 e.preventDefault();
 try {
 const res = await api.post("/tasks", newTask);
 if (res.data.success) {
 toast.success("Tạo Task thành công!");
 setIsModalOpen(false);
 setNewTask(emptyTask);
 fetchTasks();
 }
 } catch {
 toast.error("Lỗi khi tạo Task");
 }
 };

 const handleUpdateTask = async (e) => {
 e.preventDefault();
 try {
 const res = await api.put(`/tasks/${editingTask._id || editingTask.id}`, editingTask);
 if (res.data.success) {
 toast.success("Cập nhật Task thành công!");
 setIsEditModalOpen(false);
 setEditingTask(null);
 fetchTasks();
 }
 } catch {
 toast.error("Lỗi cập nhật Task");
 }
 };

 const handleDeleteTask = async (taskId, e) => {
 e.stopPropagation();
 if (!confirm("Xóa task này?")) return;
 try {
 const res = await api.delete(`/tasks/${taskId}`);
 if (res.data.success) {
 toast.success("Đã xóa Task");
 setTasks(prev => prev.filter(t => t.id !== taskId));
 }
 } catch {
 toast.error("Lỗi xóa Task");
 }
 };

 const tabs = [
 { id: "all", label: "Tất cả" },
 { id: "manager", label: "Quản lý" },
 { id: "content", label: "Nội dung" },
 { id: "dev", label: "Lập trình" },
 { id: "intern", label: "Thực tập sinh" },
 { id: "affiliate", label: "Đối tác" }
 ];

 const filteredTasks = tasks.filter(t => {
 const matchTab = activeTab === "all" || t.role === activeTab;
 const matchAssignee = filterAssignee === "all" || t.assignee?._id === filterAssignee || t.assignee?.id === filterAssignee;
 return matchTab && matchAssignee;
 });

 const getRoleColor = (role) => {
 const map = {
 manager: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
 content: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
 dev: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
 intern: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
 affiliate: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
 };
 return map[role] || 'bg-zinc-500/10 text-gray-400 border-zinc-500/20';
 };

 const getRoleLabel = (role) => tabs.find(t => t.id === role)?.label || role;

 const isOverdue = (dueDate) => dueDate && new Date(dueDate) < new Date();
 const isDueSoon = (dueDate) => {
 if (!dueDate) return false;
 const diff = (new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24);
 return diff >= 0 && diff <= 2;
 };

 const onDragEnd = async (result) => {
 if (!result.destination) return;
 const { source, destination, draggableId } = result;
 if (source.droppableId === destination.droppableId) return;
 const newStatus = destination.droppableId;
 setTasks(prev => prev.map(t => t.id === draggableId ? { ...t, status: newStatus } : t));
 try {
 await api.put(`/tasks/${draggableId}/status`, { status: newStatus });
 if (newStatus === 'done') toast.success("🎉 Tuyệt vời! Hoàn thành 1 công việc.");
 else toast.success("Đã cập nhật trạng thái");
 } catch {
 toast.error("Lỗi cập nhật, đang hoàn tác...");
 fetchTasks();
 }
 };

 const TaskForm = ({ data, setData, onSubmit, title, submitLabel }) => (
 <form onSubmit={onSubmit} className="p-6 space-y-4">
 <div>
 <label className="block text-sm font-medium text-gray-400 mb-1">Tên nhiệm vụ</label>
 <input required type="text" value={data.title} onChange={e => setData({ ...data, title: e.target.value })}
 className="w-full glass-panel border border-white/60 rounded-3xl px-4 py-3 text-idaz-black focus:outline-none focus:border-indigo-500 transition-colors"
 placeholder="VD: Thiết kế banner trang chủ" />
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-medium text-gray-400 mb-1">Dự án</label>
 <select value={data.projectId || ''} onChange={e => setData({ ...data, projectId: e.target.value })}
 className="w-full glass-panel border border-white/60 rounded-3xl px-4 py-3 text-idaz-black focus:outline-none focus:border-indigo-500 transition-colors">
 <option value="">-- Chọn dự án --</option>
 {projects.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
 </select>
 </div>
 <div>
 <label className="block text-sm font-medium text-gray-400 mb-1">Nhóm quyền</label>
 <select value={data.role} onChange={e => setData({ ...data, role: e.target.value })}
 className="w-full glass-panel border border-white/60 rounded-3xl px-4 py-3 text-idaz-black focus:outline-none focus:border-indigo-500 transition-colors">
 <option value="dev">Lập trình</option>
 <option value="content">Nội dung</option>
 <option value="intern">Thực tập sinh</option>
 <option value="manager">Quản lý</option>
 <option value="affiliate">Đối tác</option>
 </select>
 </div>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-medium text-gray-400 mb-1">Mức độ ưu tiên</label>
 <select value={data.priority || 'normal'} onChange={e => setData({ ...data, priority: e.target.value })}
 className="w-full glass-panel border border-white/60 rounded-3xl px-4 py-3 text-idaz-black focus:outline-none focus:border-indigo-500 transition-colors">
 <option value="urgent">🔴 Khẩn cấp</option>
 <option value="high">🟠 Cao</option>
 <option value="normal">🔵 Bình thường</option>
 <option value="low">⚫ Thấp</option>
 </select>
 </div>
 <div>
 <label className="block text-sm font-medium text-gray-400 mb-1">Deadline</label>
 <input type="date" value={data.dueDate ? data.dueDate.slice(0, 10) : ''} onChange={e => setData({ ...data, dueDate: e.target.value })}
 className="w-full glass-panel border border-white/60 rounded-3xl px-4 py-3 text-idaz-black focus:outline-none focus:border-indigo-500 transition-colors" />
 </div>
 </div>

 <div>
 <label className="block text-sm font-medium text-gray-400 mb-1">Giao cho</label>
 <select value={data.assignee?._id || data.assignee || ''} onChange={e => setData({ ...data, assignee: e.target.value })}
 className="w-full glass-panel border border-white/60 rounded-3xl px-4 py-3 text-idaz-black focus:outline-none focus:border-indigo-500 transition-colors">
 <option value="">-- Chưa phân công --</option>
 {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.role})</option>)}
 </select>
 </div>

 <div className="pt-2 flex gap-3">
 <button type="button" onClick={() => { setIsModalOpen(false); setIsEditModalOpen(false); }}
 className="flex-1 px-4 py-3 rounded-3xl font-bold text-gray-600 bg-white/5 hover:bg-white/10 transition-colors">Huỷ</button>
 <button type="submit" className="flex-1 px-4 py-3 rounded-3xl font-bold text-idaz-black bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/25">
 {submitLabel}
 </button>
 </div>
 </form>
 );

 const renderTaskColumn = (status, title, icon) => {
 const colTasks = filteredTasks.filter(t => t.status === status);
 return (
 <div className="bg-gray-50 rounded-3xl p-5 border border-white/40 flex flex-col h-[calc(100vh-300px)]">
 <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/40 shrink-0">
 <h3 className="font-bold text-idaz-black text-subheadline flex items-center gap-2">{icon} {title}</h3>
 <span className="bg-white/10 text-idaz-black text-caption-1 px-2 py-1 rounded-md">{colTasks.length}</span>
 </div>

 <Droppable droppableId={status}>
 {(provided, snapshot) => (
 <div
 {...provided.droppableProps}
 ref={provided.innerRef}
 className={`flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-3 transition-colors ${snapshot.isDraggingOver ? 'bg-white/5 rounded-3xl p-2' : ''}`}
 >
 <AnimatePresence>
 {colTasks.map((task, index) => {
 const overdue = isOverdue(task.dueDate);
 const dueSoon = isDueSoon(task.dueDate);
 return (
 <Draggable key={task.id} draggableId={task.id} index={index}>
 {(provided, snapshot) => (
 <div
 ref={provided.innerRef}
 {...provided.draggableProps}
 {...provided.dragHandleProps}
 className={`glass-panel border p-4 rounded-3xl transition-all cursor-grab active:cursor-grabbing group ${
 snapshot.isDragging 
 ? 'shadow-[0_0_20px_rgba(225,29,72,0.3)] border-rose-500/50 scale-105 z-50' 
 : overdue ? 'border-red-500/30 hover:border-red-500/50' : 'border-white/40 hover:border-white/15'
 }`}
 style={{ ...provided.draggableProps.style }}
 onClick={() => setSelectedTask(task)}
 >
 {/* Priority + Role badges */}
 <div className="flex items-center justify-between mb-2">
 <div className="flex items-center gap-1.5 flex-wrap">
 <span className={`text-caption-2 font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getRoleColor(task.role)}`}>
 {getRoleLabel(task.role)}
 </span>
 {task.priority && task.priority !== 'normal' && (
 <span className={`text-caption-2 font-bold uppercase px-1.5 py-0.5 rounded border ${PRIORITY_CONFIG[task.priority]?.color}`}>
 {task.priority === 'urgent' ? '🔴' : '🟠'} {PRIORITY_CONFIG[task.priority]?.label}
 </span>
 )}
 </div>
 {/* Action buttons */}
 <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1" onClick={e => e.stopPropagation()}>
 <button
 onClick={e => { e.stopPropagation(); setEditingTask(task); setIsEditModalOpen(true); }}
 className="w-6 h-6 flex items-center justify-center bg-white/5 hover:bg-indigo-500/20 hover:text-indigo-400 rounded text-gray-400 transition-colors"
 ><Edit2 size={11} /></button>
 <button
 onClick={e => handleDeleteTask(task.id, e)}
 className="w-6 h-6 flex items-center justify-center bg-white/5 hover:bg-red-500/20 hover:text-red-400 rounded text-gray-400 transition-colors"
 ><Trash2 size={11} /></button>
 </div>
 </div>

 {/* Title */}
 <h4 className="text-idaz-black font-medium text-subheadline mb-3 leading-relaxed">{task.title}</h4>

 {/* Due Date */}
 {task.dueDate && (
 <div className={`flex items-center gap-1 text-caption-1 mb-2 ${overdue ? 'text-red-400' : dueSoon ? 'text-amber-400' : 'text-gray-500'}`}>
 <Calendar size={11} />
 <span>{overdue ? '⚠ Quá hạn: ' : ''}{new Date(task.dueDate).toLocaleDateString('vi-VN')}</span>
 </div>
 )}

 {/* Bottom: project + assignee */}
 <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/40">
 <div className="flex items-center gap-1.5 text-caption-1 text-gray-500">
 <FolderKanban size={12} />
 <span className="truncate max-w-[100px]">{task.projectId ? task.projectId.title : task.project}</span>
 </div>
 {task.assignee && (
 <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-idaz-black text-[10px] font-bold border border-gray-300" title={task.assignee.name}>
 {task.assignee.avatar
 ? <img src={task.assignee.avatar} className="w-full h-full rounded-full object-cover" alt="" />
 : task.assignee.name?.charAt(0)
 }
 </div>
 )}
 </div>
 </div>
 )}
 </Draggable>
 );
 })}
 </AnimatePresence>
 {provided.placeholder}
 {colTasks.length === 0 && !snapshot.isDraggingOver && (
 <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-2 opacity-50 pb-10">
 <ListTodo size={32} />
 <p className="text-footnote">Trống</p>
 </div>
 )}
 </div>
 )}
 </Droppable>
 </div>
 );
 };

 if (!isReady) return null;

 return (
 <DragDropContext onDragEnd={onDragEnd}>
 <div className="max-w-7xl mx-auto h-full flex flex-col">

 {/* Header */}
 <div className="flex items-center justify-between mb-6 shrink-0">
 <div>
 <h1 className="text-title-1 font-bold text-idaz-black mb-1 flex items-center gap-3">
 Nhiệm vụ & Giao việc
 <span className="bg-rose-500/10 text-rose-500 border border-rose-500/20 text-caption-1 px-2 py-1 rounded-xl flex items-center gap-1 font-medium">
 <Sparkles size={12} /> Kéo-Thả
 </span>
 </h1>
 <p className="text-gray-400 text-footnote">Kéo thả thẻ để chuyển trạng thái công việc tức thì.</p>
 </div>
 <div className="flex gap-3">
 {/* Assignee filter */}
 <select value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)}
 className="glass-panel border border-white/60 rounded-3xl px-3 py-2 text-idaz-black text-footnote focus:outline-none focus:border-indigo-500 transition-colors">
 <option value="all">👤 Tất cả thành viên</option>
 {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
 </select>
 <button onClick={() => setIsModalOpen(true)}
 className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-idaz-black rounded-3xl text-footnote font-bold transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(225,29,72,0.4)]">
 <Plus size={18} /> Thêm Task
 </button>
 </div>
 </div>

 {/* Role Tabs */}
 <div className="flex flex-wrap gap-2 mb-6 shrink-0">
 {tabs.map(tab => (
 <button key={tab.id} onClick={() => setActiveTab(tab.id)}
 className={`px-4 py-1.5 rounded-3xl text-footnote font-medium transition-all relative ${activeTab === tab.id ? 'text-idaz-black' : 'text-gray-400 hover:text-idaz-black hover:bg-white/5'}`}>
 {activeTab === tab.id && (
 <motion.div layoutId="activeTab" className="absolute inset-0 bg-white/10 border border-gray-300 rounded-3xl"
 transition={{ type: "spring", stiffness: 300, damping: 30 }} />
 )}
 <span className="relative z-10">{tab.label}</span>
 </button>
 ))}
 </div>

 {/* Kanban Board */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 min-h-0">
 {renderTaskColumn("todo", "Cần làm", <Circle size={18} className="text-gray-400" />)}
 {renderTaskColumn("in_progress", "Đang xử lý", <Clock size={18} className="text-amber-400" />)}
 {renderTaskColumn("done", "Hoàn thành", <CheckCircle2 size={18} className="text-emerald-400" />)}
 </div>
 </div>

 {/* Create Task Modal */}
 <AnimatePresence>
 {isModalOpen && (
 <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
 <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
 className="glass-panel border border-white/60 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
 <div className="flex justify-between items-center p-6 border-b border-white/60">
 <h3 className="text-xl font-bold text-idaz-black">Tạo Nhiệm vụ mới</h3>
 <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-idaz-black transition-colors"><X size={24} /></button>
 </div>
 <TaskForm data={newTask} setData={setNewTask} onSubmit={handleCreateTask} submitLabel="Tạo Nhiệm vụ" />
 </motion.div>
 </div>
 )}
 </AnimatePresence>

 {/* Edit Task Modal */}
 <AnimatePresence>
 {isEditModalOpen && editingTask && (
 <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
 <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
 className="glass-panel border border-white/60 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
 <div className="flex justify-between items-center p-6 border-b border-white/60">
 <h3 className="text-xl font-bold text-idaz-black">Sửa Task</h3>
 <button onClick={() => { setIsEditModalOpen(false); setEditingTask(null); }} className="text-gray-400 hover:text-idaz-black transition-colors"><X size={24} /></button>
 </div>
 <TaskForm data={editingTask} setData={setEditingTask} onSubmit={handleUpdateTask} submitLabel="Lưu thay đổi" />
 </motion.div>
 </div>
 )}
 </AnimatePresence>

 {/* Task Detail Modal */}
 <AnimatePresence>
 {selectedTask && (
 <TaskDetailModal
 task={selectedTask}
 currentUser={user}
 onClose={() => setSelectedTask(null)}
 onUpdate={fetchTasks}
 />
 )}
 </AnimatePresence>
 </DragDropContext>
 );
}
