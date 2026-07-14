"use client";

import { useState, useEffect } from "react";
import api from "../../../services/api";
import { 
 Folder, Link as LinkIcon, FileText, Image as ImageIcon, Video, 
 ExternalLink, ChevronRight, Download, FolderOpen, Search, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../../context/AuthContext";

export default function ClientAssets() {
 const { user } = useAuth();
 const [projects, setProjects] = useState([]);
 const [activeProjectId, setActiveProjectId] = useState(null);
 
 const [folders, setFolders] = useState([]);
 const [activeFolderId, setActiveFolderId] = useState(null);
 
 const [assets, setAssets] = useState([]);
 const [loading, setLoading] = useState(true);

 // Search, Filter, ViewMode
 const [searchQuery, setSearchQuery] = useState("");
 const [filterType, setFilterType] = useState("all");
 const [viewMode, setViewMode] = useState("grid");
 const [selectedAssets, setSelectedAssets] = useState([]);

 // Preview
 const [previewAsset, setPreviewAsset] = useState(null);

 useEffect(() => {
 fetchMyProjects();
 }, []);

 useEffect(() => {
 setActiveFolderId(null);
 }, [activeProjectId]);

 useEffect(() => {
 if (activeProjectId) {
 fetchFolders(activeProjectId);
 fetchAssets(activeProjectId, activeFolderId);
 } else {
 setFolders([]);
 setAssets([]);
 setLoading(false);
 }
 }, [activeProjectId, activeFolderId]);

 const fetchMyProjects = async () => {
 try {
 const res = await api.get('/projects/my-projects');
 if (res.data.success) {
 setProjects(res.data.data);
 if (res.data.data.length > 0) setActiveProjectId(res.data.data[0]._id);
 else setLoading(false);
 }
 } catch (error) {
 console.log(error);
 setLoading(false);
 }
 };

 const fetchFolders = async (projectId) => {
 try {
 const res = await api.get(`/folders/project/${projectId}`);
 if (res.data.success) {
 setFolders(res.data.data);
 }
 } catch (error) {}
 };

 const fetchAssets = async (projectId, folderId) => {
 try {
 setLoading(true);
 let url = `/assets/project/${projectId}`;
 if (folderId) url += `?folderId=${folderId}`;
 const res = await api.get(url);
 if (res.data.success) {
 setAssets(res.data.data);
 }
 } catch (error) {} finally {
 setLoading(false);
 }
 };

 const handleBulkDelete = async () => {
 if (!confirm(`Xóa vĩnh viễn ${selectedAssets.length} file đã chọn?`)) return;
 try {
 const res = await api.post('/assets/bulk-delete', { ids: selectedAssets });
 if (res.data.success) {
 // toast.success(res.data.message);
 setSelectedAssets([]);
 fetchAssets(activeProjectId, activeFolderId);
 }
 } catch (error) {
 // toast.error("Lỗi xóa hàng loạt");
 }
 };

 const toggleSelectAsset = (id) => {
 setSelectedAssets(prev => prev.includes(id) ? prev.filter(aId => aId !== id) : [...prev, id]);
 };

 const getTypeIcon = (type, mimeType) => {
 if (type === 'image') return <ImageIcon size={24} className="text-pink-500" />;
 if (type === 'video') return <Video size={24} className="text-purple-500" />;
 if (type === 'document' || mimeType?.includes('pdf')) return <FileText size={24} className="text-blue-500" />;
 if (type === 'design') return <Folder size={24} className="text-amber-500" />;
 return <LinkIcon size={24} className="text-emerald-500" />;
 };

 const getBreadcrumbs = () => {
 let crumbs = [{ name: 'Gốc (Root)', id: null }];
 if (activeFolderId) {
 const buildPath = (fId, currentPath = []) => {
 const folder = folders.find(f => f._id === fId);
 if (!folder) return currentPath;
 const newPath = [{ name: folder.name, id: folder._id }, ...currentPath];
 if (folder.parentId) return buildPath(folder.parentId, newPath);
 return newPath;
 };
 crumbs = [...crumbs, ...buildPath(activeFolderId)];
 }
 return crumbs;
 };

 if (loading && projects.length === 0) return <div className="p-8 text-gray-500">Đang tải...</div>;

 return (
 <div className="max-w-7xl mx-auto h-[calc(100vh-100px)] flex flex-col glass-panel rounded-3xl border border-white/60 shadow-xl overflow-hidden">
 
 {/* Header */}
 <div className="p-6 border-b border-white/60 bg-idaz-gray/50 flex flex-wrap gap-4 items-center justify-between shrink-0">
 <div>
 <h1 className="text-2xl font-bold text-idaz-black">Kho Tài Sản</h1>
 <p className="text-gray-500 text-sm mt-1">Các file thiết kế, tài liệu từ Agency gửi cho bạn.</p>
 </div>
 
 {projects.length > 0 && (
 <select 
 value={activeProjectId || ''} 
 onChange={(e) => {
 setActiveProjectId(e.target.value);
 setActiveFolderId(null);
 }}
 className="glass-panel border border-gray-300 rounded-3xl px-4 py-2 text-gray-700 font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none shadow-sm"
 >
 {projects.map(p => (
 <option key={p._id} value={p._id}>{p.title}</option>
 ))}
 </select>
 )}
 </div>

 <div className="flex-1 flex overflow-hidden">
 {/* Left Sidebar - Folders (Hiển thị đơn giản) */}
 <div className="w-64 border-r border-white/60 bg-idaz-gray/30 p-4 overflow-y-auto hidden md:block shrink-0">
 <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-2">Cây Thư mục</h3>
 
 <div 
 onClick={() => setActiveFolderId(null)}
 className={`flex items-center gap-3 px-3 py-2.5 rounded-3xl cursor-pointer transition-colors mb-1 ${!activeFolderId ? 'bg-idaz-orange-light text-idaz-orange-dark font-bold' : 'text-gray-600 hover:bg-gray-100'}`}
 >
 <FolderOpen size={18} className={!activeFolderId ? 'text-idaz-orange' : 'text-gray-400'} />
 <span className="text-sm">Tất cả File (Gốc)</span>
 </div>

 {folders.filter(f => !f.parentId).map(folder => (
 <div 
 key={folder._id}
 onClick={() => setActiveFolderId(folder._id)}
 className={`flex items-center gap-3 px-3 py-2.5 rounded-3xl cursor-pointer transition-colors mb-1 ${activeFolderId === folder._id ? 'bg-idaz-orange-light text-idaz-orange-dark font-bold' : 'text-gray-600 hover:bg-gray-100'}`}
 >
 <Folder size={18} className={activeFolderId === folder._id ? 'text-idaz-orange' : 'text-gray-400'} />
 <span className="text-sm truncate">{folder.name}</span>
 </div>
 ))}
 </div>

 {/* Main Content */}
 <div className="flex-1 flex flex-col relative overflow-hidden glass-panel">
 {/* Breadcrumbs */}
 <div className="px-8 py-4 border-b border-white/40 flex items-center gap-2 text-sm glass-panel shrink-0">
 {getBreadcrumbs().map((crumb, idx, arr) => (
 <div key={idx} className="flex items-center gap-2">
 <button 
 onClick={() => setActiveFolderId(crumb.id)}
 className={`hover:text-idaz-orange transition-colors ${idx === arr.length - 1 ? 'text-idaz-black font-bold' : 'text-gray-500'}`}
 >
 {crumb.name}
 </button>
 {idx < arr.length - 1 && <ChevronRight size={14} className="text-slate-300" />}
 </div>
 ))}
 </div>

 {/* Header Action */}
 <div className="px-8 py-3 border-b border-white/40 flex items-center justify-between bg-idaz-gray/50 shrink-0">
 <div className="flex items-center gap-4 flex-1">
 <div className="relative w-full max-w-sm">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
 <input 
 type="text"
 placeholder="Tìm kiếm file..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="w-full glass-panel border border-white/60 rounded-full py-2 pl-9 pr-4 text-sm text-gray-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors shadow-sm"
 />
 </div>
 <select 
 value={filterType}
 onChange={(e) => setFilterType(e.target.value)}
 className="glass-panel border border-white/60 rounded-full py-2 px-4 text-sm text-gray-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors shadow-sm cursor-pointer"
 >
 <option value="all">Tất cả định dạng</option>
 <option value="image">Hình ảnh</option>
 <option value="video">Video</option>
 <option value="document">Tài liệu</option>
 <option value="link">Liên kết</option>
 </select>
 </div>
 </div>

 {/* Grid/List */}
 <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
 {loading ? (
 <div className="text-center text-gray-400 py-10">Đang tải dữ liệu...</div>
 ) : (
 <>
 {/* Folders in current view */}
 {folders.filter(f => f.parentId === activeFolderId && f.name.toLowerCase().includes(searchQuery.toLowerCase())).length > 0 && filterType === 'all' && (
 <div className="mb-8">
 <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase">Thư mục con</h3>
 <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
 {folders.filter(f => f.parentId === activeFolderId && f.name.toLowerCase().includes(searchQuery.toLowerCase())).map(folder => (
 <div 
 key={folder._id} 
 onClick={() => setActiveFolderId(folder._id)}
 className="glass-panel border border-white/60 rounded-3xl p-4 flex items-center gap-3 cursor-pointer hover:border-indigo-500 hover:shadow-md transition-all group"
 >
 <Folder size={24} className="text-indigo-400 group-hover:scale-110 transition-transform" />
 <span className="font-bold text-sm text-gray-700 truncate">{folder.name}</span>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* Files */}
 <div>
 <div className="flex items-center justify-between mb-4">
 <h3 className="text-sm font-bold text-gray-400 uppercase">Danh sách File</h3>
 <div className="flex items-center gap-4">
 {selectedAssets.length > 0 && (
 <button onClick={handleBulkDelete} className="text-xs font-bold bg-rose-50 text-rose-600 px-3 py-1.5 rounded-xl border border-rose-200 hover:bg-rose-100 transition-colors flex items-center gap-1">
 Xóa {selectedAssets.length} file (nếu có quyền)
 </button>
 )}
 <div className="bg-gray-100 border border-white/60 rounded-xl p-1 flex">
 <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'glass-panel shadow-sm text-idaz-orange' : 'text-gray-400 hover:text-gray-600'}`}><Folder size={14}/></button>
 <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'glass-panel shadow-sm text-idaz-orange' : 'text-gray-400 hover:text-gray-600'}`}><FileText size={14}/></button>
 </div>
 </div>
 </div>
 
 {viewMode === 'grid' ? (
 <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
 {assets.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()) && (filterType === 'all' || a.type === filterType)).length === 0 && <div className="col-span-full text-center py-12 text-gray-400 bg-idaz-gray rounded-3xl border border-white/40 border-dashed">Chưa có file nào phù hợp.</div>}
 
 {assets.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()) && (filterType === 'all' || a.type === filterType)).map((asset, idx) => (
 <motion.div 
 initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.05 }}
 key={asset._id} 
 className="glass-panel border border-white/60 rounded-3xl p-1 hover:border-indigo-300 hover:shadow-xl transition-all group relative flex flex-col"
 >
 <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
 <input type="checkbox" checked={selectedAssets.includes(asset._id)} onChange={() => toggleSelectAsset(asset._id)} onClick={(e) => e.stopPropagation()} className="w-4 h-4 rounded border-gray-300 text-idaz-orange focus:ring-indigo-500 cursor-pointer" />
 </div>

 <div className="h-36 bg-idaz-gray rounded-3xl overflow-hidden relative flex items-center justify-center mb-2 group-hover:bg-gray-100 transition-colors">
 {asset.type === 'image' && asset.url ? (
 <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />
 ) : (
 getTypeIcon(asset.type, asset.mimeType)
 )}
 
 <div className="absolute inset-0 bg-idaz-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 backdrop-blur-[2px]">
 <div className="flex gap-2">
 <button onClick={() => setPreviewAsset(asset)} className="p-2 glass-panel text-idaz-black rounded-full hover:bg-idaz-orange-light transition-colors shadow-lg" title="Xem trước">
 <Search size={18} />
 </button>
 <a href={asset.url} download target="_blank" rel="noreferrer" className="p-2 bg-idaz-orange text-white rounded-full hover:bg-idaz-orange-dark transition-colors shadow-lg" title="Tải xuống">
 <Download size={18} />
 </a>
 </div>
 {asset.type === 'image' && (
 <button onClick={() => alert('Chuyển hướng đến công cụ Feedback Design...')} className="px-4 py-1.5 mt-2 bg-pink-500 text-white text-xs font-bold rounded-full hover:bg-pink-600 transition-colors shadow-lg">
 Gửi Feedback
 </button>
 )}
 </div>
 </div>

 <div className="px-3 pb-3">
 <h3 className="font-bold text-idaz-black text-sm truncate mb-1" title={asset.name}>{asset.name}</h3>
 <div className="flex items-center justify-between text-[11px] text-gray-500">
 <span>{(asset.fileSize / 1024 / 1024).toFixed(2)} MB</span>
 <span className="bg-gray-100 px-1.5 py-0.5 rounded font-medium">v{asset.version}</span>
 </div>
 </div>
 </motion.div>
 ))}
 </div>
 ) : (
 <div className="flex flex-col gap-2">
 {assets.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()) && (filterType === 'all' || a.type === filterType)).length === 0 && <div className="text-center py-12 text-gray-400 bg-idaz-gray rounded-3xl border border-white/40 border-dashed">Chưa có file nào phù hợp.</div>}
 {assets.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()) && (filterType === 'all' || a.type === filterType)).map((asset, idx) => (
 <motion.div 
 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
 key={asset._id} 
 className={`flex items-center justify-between p-3 rounded-3xl border transition-all cursor-pointer ${selectedAssets.includes(asset._id) ? 'border-indigo-500 bg-idaz-orange-light' : 'border-white/60 hover:border-indigo-300'}`}
 onClick={() => toggleSelectAsset(asset._id)}
 >
 <div className="flex items-center gap-4 flex-1 overflow-hidden">
 <input type="checkbox" checked={selectedAssets.includes(asset._id)} onChange={() => toggleSelectAsset(asset._id)} onClick={(e) => e.stopPropagation()} className="w-4 h-4 rounded border-gray-300 text-idaz-orange focus:ring-indigo-500 cursor-pointer shrink-0" />
 <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
 {asset.type === 'image' && asset.url ? <img src={asset.url} className="w-full h-full object-cover rounded-xl" /> : getTypeIcon(asset.type, asset.mimeType)}
 </div>
 <div className="min-w-0">
 <h3 className="font-bold text-idaz-black text-sm truncate">{asset.name}</h3>
 <div className="text-xs text-gray-500 flex gap-3">
 <span>{(asset.fileSize / 1024 / 1024).toFixed(2)} MB</span>
 <span className="bg-gray-100 px-1.5 py-0.5 rounded font-medium">v{asset.version}</span>
 </div>
 </div>
 </div>
 
 <div className="flex items-center gap-2 shrink-0">
 <button onClick={(e) => { e.stopPropagation(); setPreviewAsset(asset); }} className="p-2 text-gray-400 hover:text-idaz-orange hover:bg-idaz-orange-light rounded-xl transition-colors"><Search size={16} /></button>
 <a href={asset.url} download target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="p-2 text-gray-400 hover:text-idaz-orange hover:bg-idaz-orange-light rounded-xl transition-colors"><Download size={16} /></a>
 </div>
 </motion.div>
 ))}
 </div>
 )}
 </div>
 </>
 )}
 </div>
 </div>
 </div>

 {/* Preview Modal for Client */}
 <AnimatePresence>
 {previewAsset && (
 <div className="fixed inset-0 bg-idaz-black/90 backdrop-blur-md flex items-center justify-center z-[60] p-4">
 <button onClick={() => setPreviewAsset(null)} className="absolute top-6 right-6 text-white/50 hover:text-white bg-black/50 p-2 rounded-full backdrop-blur-sm"><X size={24} /></button>
 <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-5xl max-h-[90vh] flex flex-col relative">
 <div className="flex-1 overflow-hidden rounded-3xl border border-white/10 bg-black flex items-center justify-center min-h-[500px]">
 {previewAsset.type === 'image' ? (
 <img src={previewAsset.url} alt={previewAsset.name} className="max-w-full max-h-[80vh] object-contain" />
 ) : previewAsset.type === 'video' ? (
 <video src={previewAsset.url} controls className="max-w-full max-h-[80vh]"></video>
 ) : previewAsset.type === 'document' && previewAsset.url.endsWith('.pdf') ? (
 <iframe src={previewAsset.url} className="w-full h-[80vh] glass-panel"></iframe>
 ) : (
 <div className="text-center text-zinc-400 flex flex-col items-center">
 {getTypeIcon(previewAsset.type, previewAsset.mimeType)}
 <p className="mt-4 font-bold text-white">Không có bản xem trước cho định dạng này.</p>
 <a href={previewAsset.url} download target="_blank" rel="noreferrer" className="mt-4 px-6 py-2 bg-idaz-orange text-white rounded-full font-bold inline-block hover:bg-idaz-orange-dark">Tải xuống ngay</a>
 </div>
 )}
 </div>
 <div className="mt-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-4 flex items-center justify-between">
 <div>
 <h3 className="text-white font-bold text-lg">{previewAsset.name}</h3>
 <div className="flex items-center gap-4 text-xs text-white/60 mt-1">
 <span>Kích thước: {(previewAsset.fileSize / 1024 / 1024).toFixed(2)} MB</span>
 <span>Upload ngày: {new Date(previewAsset.createdAt).toLocaleDateString('vi-VN')}</span>
 </div>
 </div>
 <div className="flex gap-2">
 <a href={previewAsset.url} download className="px-5 py-2.5 bg-idaz-orange hover:bg-idaz-orange text-white rounded-3xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20">
 <Download size={18} /> Tải Xuống
 </a>
 </div>
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>
 </div>
 );
}
