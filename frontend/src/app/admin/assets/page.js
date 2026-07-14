"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
 Folder, Link as LinkIcon, FileText, Image as ImageIcon, Video, Trash2, Plus, X, 
 ChevronRight, ChevronDown, FolderOpen, UploadCloud, Search, MoreVertical, Edit2
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../../services/api";
import { useAuth } from "../../../context/AuthContext";

// --- Recursive Folder Tree Component ---
const FolderTreeItem = ({ folder, allFolders, activeFolderId, onSelect, level = 0 }) => {
 const [isExpanded, setIsExpanded] = useState(false);
 const children = allFolders.filter(f => f.parentId === folder._id);
 const hasChildren = children.length > 0;
 const isActive = activeFolderId === folder._id;

 return (
 <div>
 <div 
 className={`flex items-center gap-2 px-3 py-2 rounded-3xl cursor-pointer transition-all ${isActive ? 'bg-indigo-600/20 text-indigo-400 font-medium' : 'text-gray-400 hover:bg-white/5 hover:text-zinc-200'}`}
 style={{ paddingLeft: `${level * 16 + 12}px` }}
 onClick={() => {
 onSelect(folder._id);
 if (hasChildren && !isActive) setIsExpanded(true);
 }}
 >
 <button 
 className="p-1 -ml-1 hover:bg-white/10 rounded"
 onClick={(e) => {
 e.stopPropagation();
 setIsExpanded(!isExpanded);
 }}
 >
 {hasChildren ? (isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : <span className="w-[14px]"></span>}
 </button>
 {isExpanded || isActive ? <FolderOpen size={16} className="text-indigo-400" /> : <Folder size={16} />}
 <span className="truncate flex-1 text-sm">{folder.name}</span>
 </div>
 
 {isExpanded && hasChildren && (
 <div className="mt-1">
 {children.map(child => (
 <FolderTreeItem 
 key={child._id} 
 folder={child} 
 allFolders={allFolders} 
 activeFolderId={activeFolderId} 
 onSelect={onSelect}
 level={level + 1} 
 />
 ))}
 </div>
 )}
 </div>
 );
};


export default function AdminAssets() {
 const { user } = useAuth();
 
 const [projects, setProjects] = useState([]);
 const [activeProjectId, setActiveProjectId] = useState(null);
 
 const [folders, setFolders] = useState([]);
 const [activeFolderId, setActiveFolderId] = useState(null);
 
 const [assets, setAssets] = useState([]);
 const [users, setUsers] = useState([]);
 
 // Modals state
 const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
 const [isUploadOpen, setIsUploadOpen] = useState(false);
 
 // Form states
 const [newFolderName, setNewFolderName] = useState('');
 
 const [uploadFiles, setUploadFiles] = useState([]);
 const [uploadProgress, setUploadProgress] = useState(0);
 const [uploadController, setUploadController] = useState(null);
 const [uploadError, setUploadError] = useState(false);
 
 // Drag & Drop
 const [isDragging, setIsDragging] = useState(false);
 
 // Preview
 const [previewAsset, setPreviewAsset] = useState(null);

 // Context Menu
 const [contextMenu, setContextMenu] = useState(null);

 // Rename Modal
 const [isRenameOpen, setIsRenameOpen] = useState(false);
 const [renameTarget, setRenameTarget] = useState(null); // { id, name, isFolder }
 const [newName, setNewName] = useState("");

 // Search & Filters & View
 const [searchQuery, setSearchQuery] = useState("");
 const [filterType, setFilterType] = useState("all"); // 'all' | 'image' | 'video' | 'document' | 'link'
 const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'list'
 const [selectedAssets, setSelectedAssets] = useState([]);

 useEffect(() => {
 fetchProjects();
 fetchUsers();
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
 }
 }, [activeProjectId, activeFolderId]);

 useEffect(() => {
 const handleClickOutside = () => setContextMenu(null);
 document.addEventListener('click', handleClickOutside);
 return () => document.removeEventListener('click', handleClickOutside);
 }, []);

 const fetchProjects = async () => {
 try {
 const res = await api.get('/projects');
 if (res.data.success) {
 setProjects(res.data.data);
 if (res.data.data.length > 0) setActiveProjectId(res.data.data[0]._id);
 }
 } catch (error) {}
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
 let url = `/assets/project/${projectId}`;
 if (folderId) url += `?folderId=${folderId}`;
 const res = await api.get(url);
 if (res.data.success) {
 setAssets(res.data.data);
 }
 } catch (error) {}
 };

 const fetchUsers = async () => {
 try {
 const res = await api.get('/users');
 if (res.data.success) setUsers(res.data.data.filter(u => u.role === 'client'));
 } catch (error) {}
 };

 const handleCreateFolder = async (e) => {
 e.preventDefault();
 if (!newFolderName.trim() || !activeProjectId) return;
 try {
 const res = await api.post('/folders', {
 name: newFolderName,
 projectId: activeProjectId,
 parentId: activeFolderId || null
 });
 if (res.data.success) {
 toast.success("Tạo thư mục thành công");
 setNewFolderName('');
 setIsNewFolderOpen(false);
 fetchFolders(activeProjectId);
 }
 } catch (error) {
 toast.error(error.response?.data?.message || "Lỗi tạo thư mục");
 }
 };

 const handleDeleteFolder = async (folderId) => {
 if(!confirm('Xóa thư mục sẽ xóa tất cả file bên trong. Tiếp tục?')) return;
 try {
 const res = await api.delete(`/folders/${folderId}`);
 if (res.data.success) {
 toast.success("Đã xóa thư mục");
 if (activeFolderId === folderId) setActiveFolderId(null);
 fetchFolders(activeProjectId);
 fetchAssets(activeProjectId, activeFolderId === folderId ? null : activeFolderId);
 }
 } catch (error) {
 toast.error("Lỗi xóa thư mục");
 }
 };

 const handleRenameSubmit = async (e) => {
 e.preventDefault();
 if (!newName.trim() || !renameTarget) return;

 try {
 if (renameTarget.isFolder) {
 const res = await api.put(`/folders/${renameTarget.id}`, { name: newName });
 if (res.data.success) {
 toast.success("Đã đổi tên thư mục");
 fetchFolders(activeProjectId);
 }
 } else {
 const res = await api.put(`/assets/${renameTarget.id}`, { name: newName });
 if (res.data.success) {
 toast.success("Đã đổi tên file");
 fetchAssets(activeProjectId, activeFolderId);
 }
 }
 setIsRenameOpen(false);
 setRenameTarget(null);
 } catch (error) {
 toast.error(error.response?.data?.message || "Lỗi khi đổi tên");
 }
 };

 const handleFileChange = (e) => {
 if (e.target.files) {
 const filesArr = Array.from(e.target.files).map(f => {
 if (f.type.startsWith('image/')) {
 f.previewUrl = URL.createObjectURL(f);
 }
 return f;
 });
 setUploadFiles(filesArr);
 }
 };

 const handleUpload = async (e) => {
 e.preventDefault();
 if (uploadFiles.length === 0 || !activeProjectId) return;

 setUploadError(false);
 const controller = new AbortController();
 setUploadController(controller);

 const formData = new FormData();
 formData.append('projectId', activeProjectId);
 if (activeFolderId) formData.append('folderId', activeFolderId);
 
 uploadFiles.forEach(file => {
 formData.append('files', file);
 });

 try {
 const res = await api.post('/assets/upload', formData, {
 headers: { 'Content-Type': 'multipart/form-data' },
 signal: controller.signal,
 onUploadProgress: (progressEvent) => {
 const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
 setUploadProgress(percentCompleted);
 }
 });

 if (res.data.success) {
 toast.success("Tải file thành công!");
 setIsUploadOpen(false);
 setUploadFiles([]);
 setUploadProgress(0);
 fetchAssets(activeProjectId, activeFolderId);
 }
 } catch (error) {
 setUploadError(true);
 if (error.name === 'CanceledError' || error.message === 'canceled') {
 toast.error("Đã hủy tải lên");
 } else {
 toast.error(error.response?.data?.message || "Lỗi tải file");
 }
 setUploadProgress(0);
 } finally {
 setUploadController(null);
 }
 };

 const cancelUpload = () => {
 if (uploadController) uploadController.abort();
 };

 // Drag & Drop Handlers
 const handleDragOver = (e) => {
 e.preventDefault();
 if (!isDragging) setIsDragging(true);
 };
 const handleDragLeave = (e) => {
 e.preventDefault();
 setIsDragging(false);
 };
 const handleDrop = (e) => {
 e.preventDefault();
 setIsDragging(false);
 if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
 const filesArr = Array.from(e.dataTransfer.files).map(f => {
 if (f.type.startsWith('image/')) {
 f.previewUrl = URL.createObjectURL(f);
 }
 return f;
 });
 setUploadFiles(filesArr);
 setIsUploadOpen(true);
 }
 };

 const handleContextMenu = (e, item, isFolder) => {
 e.preventDefault();
 setContextMenu({
 x: e.clientX,
 y: e.clientY,
 item,
 isFolder
 });
 };

 const handleDeleteAsset = async (id) => {
 if(!confirm('Xóa vĩnh viễn file này?')) return;
 try {
 const res = await api.delete(`/assets/${id}`);
 if (res.data.success) {
 toast.success("Đã xóa file");
 fetchAssets(activeProjectId, activeFolderId);
 setSelectedAssets(prev => prev.filter(assetId => assetId !== id));
 }
 } catch (error) {
 toast.error("Lỗi xóa file");
 }
 };

 const handleBulkDelete = async () => {
 if (!confirm(`Xóa vĩnh viễn ${selectedAssets.length} file đã chọn?`)) return;
 try {
 const res = await api.post('/assets/bulk-delete', { ids: selectedAssets });
 if (res.data.success) {
 toast.success(res.data.message);
 setSelectedAssets([]);
 fetchAssets(activeProjectId, activeFolderId);
 }
 } catch (error) {
 toast.error(error.response?.data?.message || "Lỗi xóa hàng loạt");
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

 // Lọc thư mục gốc
 const rootFolders = folders.filter(f => !f.parentId);

 // Breadcrumbs logic
 const getBreadcrumbs = () => {
 let crumbs = [{ name: 'Root', id: null }];
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

 return (
 <div className="h-full flex flex-col md:flex-row glass-panel overflow-hidden -mx-8 -my-8 rounded-tr-3xl">
 
 {/* Sidebar - Cây thư mục */}
 <div className="w-full md:w-72 border-r border-white/40 flex flex-col bg-idaz-gray/50 shrink-0">
 <div className="p-6 border-b border-white/40">
 <h2 className="text-xl font-bold text-idaz-black mb-4">Drive Dự án</h2>
 <select 
 value={activeProjectId || ''} 
 onChange={(e) => {
 setActiveProjectId(e.target.value);
 setActiveFolderId(null);
 }}
 className="w-full bg-white/5 border border-white/60 rounded-3xl px-4 py-2 text-idaz-black text-sm focus:border-indigo-500 outline-none"
 >
 {projects.map(p => (
 <option key={p._id} value={p._id} className="glass-panel">{p.title}</option>
 ))}
 </select>
 </div>

 <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
 <div className="flex items-center justify-between mb-4 px-2">
 <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Thư mục</span>
 <button onClick={() => setIsNewFolderOpen(true)} className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-idaz-black transition-colors" title="Thêm thư mục">
 <Plus size={16} />
 </button>
 </div>

 <div className="space-y-1">
 <div 
 className={`flex items-center gap-3 px-3 py-2 rounded-3xl cursor-pointer transition-all ${!activeFolderId ? 'bg-indigo-600 text-idaz-black font-medium shadow-lg shadow-indigo-500/20' : 'text-gray-400 hover:bg-white/5'}`}
 onClick={() => setActiveFolderId(null)}
 >
 <FolderOpen size={16} />
 <span className="text-sm">Gốc (Root)</span>
 </div>

 {rootFolders.map(folder => (
 <FolderTreeItem 
 key={folder._id} 
 folder={folder} 
 allFolders={folders} 
 activeFolderId={activeFolderId}
 onSelect={setActiveFolderId}
 />
 ))}
 </div>
 </div>
 </div>

 {/* Main Content - Quản lý File */}
 <div 
 className="flex-1 flex flex-col glass-panel relative"
 onDragOver={handleDragOver}
 onDragLeave={handleDragLeave}
 onDrop={handleDrop}
 >
 {isDragging && (
 <div className="absolute inset-0 bg-indigo-600/20 backdrop-blur-sm z-50 flex items-center justify-center border-4 border-dashed border-indigo-500 rounded-3xl m-4">
 <div className="flex flex-col items-center pointer-events-none">
 <UploadCloud size={64} className="text-indigo-400 mb-4 animate-bounce" />
 <h2 className="text-3xl font-bold text-idaz-black">Thả file vào đây để Upload</h2>
 </div>
 </div>
 )}
 
 {/* Header */}
 <div className="h-20 border-b border-white/40 px-8 flex items-center justify-between bg-idaz-gray/30 backdrop-blur-md sticky top-0 z-10 shrink-0">
 <div className="flex items-center gap-2 text-sm w-1/3">
 {getBreadcrumbs().map((crumb, idx, arr) => (
 <div key={idx} className="flex items-center gap-2">
 <button 
 onClick={() => setActiveFolderId(crumb.id)}
 className={`hover:text-indigo-400 transition-colors ${idx === arr.length - 1 ? 'text-idaz-black font-bold' : 'text-gray-500'} truncate max-w-[150px]`}
 >
 {crumb.name}
 </button>
 {idx < arr.length - 1 && <ChevronRight size={14} className="text-zinc-600 shrink-0" />}
 </div>
 ))}
 </div>

 <div className="flex items-center gap-4 flex-1 justify-center px-4">
 <div className="relative w-full max-w-md">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
 <input 
 type="text"
 placeholder="Tìm kiếm file..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="w-full glass-panel border border-white/60 rounded-full py-2 pl-10 pr-4 text-sm text-idaz-black focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
 />
 </div>
 <select 
 value={filterType}
 onChange={(e) => setFilterType(e.target.value)}
 className="glass-panel border border-white/60 rounded-full py-2 px-4 text-sm text-idaz-black focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors appearance-none cursor-pointer"
 >
 <option value="all">Tất cả định dạng</option>
 <option value="image">Hình ảnh</option>
 <option value="video">Video</option>
 <option value="document">Tài liệu</option>
 <option value="link">Liên kết</option>
 </select>
 </div>

 <div className="flex items-center gap-3 w-1/3 justify-end">
 {activeFolderId && (
 <button onClick={() => handleDeleteFolder(activeFolderId)} className="p-2.5 bg-white/5 hover:bg-rose-500/20 text-gray-400 hover:text-rose-500 rounded-3xl transition-all" title="Xóa thư mục này">
 <Trash2 size={18} />
 </button>
 )}
 <button onClick={() => setIsUploadOpen(true)} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-idaz-black rounded-3xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20 whitespace-nowrap">
 <UploadCloud size={18} /> Tải file lên
 </button>
 </div>
 </div>

 {/* File Grid */}
 <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
 {/* Render Folders (Nếu đang ở root, hiện thư mục con) */}
 {folders.filter(f => f.parentId === activeFolderId && f.name.toLowerCase().includes(searchQuery.toLowerCase())).length > 0 && filterType === 'all' && (
 <div className="mb-8">
 <h3 className="text-sm font-bold text-gray-500 mb-4">Thư mục con</h3>
 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
 {folders.filter(f => f.parentId === activeFolderId && f.name.toLowerCase().includes(searchQuery.toLowerCase())).map(folder => (
 <div 
 key={folder._id} 
 onClick={() => setActiveFolderId(folder._id)}
 onContextMenu={(e) => handleContextMenu(e, folder, true)}
 className="glass-panel border border-white/40 rounded-3xl p-4 flex items-center gap-3 cursor-pointer hover:bg-white/5 hover:border-white/60 transition-all group"
 >
 <Folder size={24} className="text-indigo-400 group-hover:scale-110 transition-transform" />
 <span className="font-bold text-sm text-idaz-black truncate">{folder.name}</span>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* Render Files */}
 <div>
 <div className="flex items-center justify-between mb-4">
 <h3 className="text-sm font-bold text-gray-500">Files</h3>
 <div className="flex items-center gap-4">
 {selectedAssets.length > 0 && (
 <button onClick={handleBulkDelete} className="text-xs font-bold bg-rose-500/10 text-rose-500 px-3 py-1.5 rounded-xl border border-rose-500/20 hover:bg-rose-500/20 transition-colors flex items-center gap-1">
 <Trash2 size={14} /> Xóa {selectedAssets.length} file
 </button>
 )}
 <div className="glass-panel border border-white/40 rounded-xl p-1 flex">
 <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-indigo-600 text-idaz-black' : 'text-gray-500 hover:text-idaz-black'}`}><Folder size={14}/></button>
 <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-indigo-600 text-idaz-black' : 'text-gray-500 hover:text-idaz-black'}`}><MoreVertical size={14}/></button>
 </div>
 </div>
 </div>

 {viewMode === 'grid' ? (
 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
 {assets.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()) && (filterType === 'all' || a.type === filterType)).length === 0 && <div className="col-span-full text-center py-12 text-gray-500">Chưa có file nào phù hợp.</div>}
 
 {assets.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()) && (filterType === 'all' || a.type === filterType)).map((asset, idx) => (
 <motion.div 
 initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.05 }}
 key={asset._id} 
 onContextMenu={(e) => handleContextMenu(e, asset, false)}
 className={`bg-gray-50 border rounded-3xl p-1 transition-all group relative flex flex-col cursor-pointer ${selectedAssets.includes(asset._id) ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/40 hover:border-gray-300'}`}
 onClick={() => toggleSelectAsset(asset._id)}
 >
 {/* Checkbox */}
 <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
 <input type="checkbox" checked={selectedAssets.includes(asset._id)} onChange={() => toggleSelectAsset(asset._id)} onClick={(e) => e.stopPropagation()} className="w-4 h-4 rounded border-zinc-700 bg-white/50 accent-indigo-500 cursor-pointer" />
 </div>

 {/* Thumbnail / Icon area */}
 <div className="h-32 glass-panel rounded-3xl overflow-hidden relative flex items-center justify-center mb-2 group-hover:glass-panel transition-colors">
 {asset.type === 'image' && asset.url ? (
 <img src={asset.url} alt={asset.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
 ) : (
 getTypeIcon(asset.type, asset.mimeType)
 )}
 
 {/* Hover actions overlay */}
 <div className="absolute inset-0 bg-white/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
 <button onClick={(e) => { e.stopPropagation(); setPreviewAsset(asset); }} className="p-2 bg-indigo-600 text-idaz-black rounded-full hover:bg-indigo-500 transition-colors shadow-lg" title="Xem trước">
 <Search size={16} />
 </button>
 <button onClick={(e) => { e.stopPropagation(); handleDeleteAsset(asset._id); }} className="p-2 bg-rose-500/80 text-idaz-black rounded-full hover:bg-rose-500 transition-colors shadow-lg" title="Xóa">
 <Trash2 size={16} />
 </button>
 </div>
 </div>

 <div className="px-3 pb-3">
 <h3 className="font-bold text-idaz-black text-sm truncate mb-1" title={asset.name}>{asset.name}</h3>
 <div className="flex items-center justify-between text-[11px] text-gray-500">
 <span>{(asset.fileSize / 1024 / 1024).toFixed(2)} MB</span>
 <span>v{asset.version}</span>
 </div>
 </div>
 </motion.div>
 ))}
 </div>
 ) : (
 <div className="flex flex-col gap-2">
 {assets.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()) && (filterType === 'all' || a.type === filterType)).length === 0 && <div className="text-center py-12 text-gray-500 bg-white/30 rounded-3xl border border-white/40">Chưa có file nào phù hợp.</div>}
 {assets.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()) && (filterType === 'all' || a.type === filterType)).map((asset, idx) => (
 <motion.div 
 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
 key={asset._id} 
 onContextMenu={(e) => handleContextMenu(e, asset, false)}
 className={`flex items-center justify-between p-3 rounded-3xl border transition-all cursor-pointer ${selectedAssets.includes(asset._id) ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/40 bg-gray-50 hover:bg-white/5'}`}
 onClick={() => toggleSelectAsset(asset._id)}
 >
 <div className="flex items-center gap-4 flex-1 overflow-hidden">
 <input type="checkbox" checked={selectedAssets.includes(asset._id)} onChange={() => toggleSelectAsset(asset._id)} onClick={(e) => e.stopPropagation()} className="w-4 h-4 rounded border-zinc-700 bg-white/50 accent-indigo-500 cursor-pointer shrink-0" />
 <div className="w-10 h-10 rounded-xl glass-panel flex items-center justify-center shrink-0">
 {asset.type === 'image' && asset.url ? <img src={asset.url} className="w-full h-full object-cover rounded-xl" /> : getTypeIcon(asset.type, asset.mimeType)}
 </div>
 <div className="min-w-0">
 <h3 className="font-bold text-idaz-black text-sm truncate">{asset.name}</h3>
 <div className="text-xs text-gray-500 flex gap-3">
 <span>{(asset.fileSize / 1024 / 1024).toFixed(2)} MB</span>
 <span>Upload bởi: {asset.uploadedBy?.name || 'Admin'}</span>
 </div>
 </div>
 </div>
 
 <div className="flex items-center gap-2 shrink-0">
 <button onClick={(e) => { e.stopPropagation(); setPreviewAsset(asset); }} className="p-2 text-gray-400 hover:text-idaz-black hover:bg-white/10 rounded-xl transition-colors"><Search size={16} /></button>
 <button onClick={(e) => { e.stopPropagation(); handleDeleteAsset(asset._id); }} className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors"><Trash2 size={16} /></button>
 </div>
 </motion.div>
 ))}
 </div>
 )}
 </div>
 </div>
 </div>

 {/* MODALS */}
 
 {/* New Folder Modal */}
 <AnimatePresence>
 {isNewFolderOpen && (
 <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
 <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-panel border border-white/60 rounded-3xl w-full max-w-sm overflow-hidden">
 <div className="p-6">
 <div className="flex justify-between items-center mb-6">
 <h3 className="text-xl font-bold text-idaz-black">Thêm Thư mục</h3>
 <button onClick={() => setIsNewFolderOpen(false)} className="text-gray-500 hover:text-idaz-black"><X size={20} /></button>
 </div>
 <form onSubmit={handleCreateFolder}>
 <input 
 type="text" 
 autoFocus
 required 
 value={newFolderName} 
 onChange={e => setNewFolderName(e.target.value)} 
 className="w-full glass-panel border border-white/60 rounded-3xl px-4 py-3 text-idaz-black focus:border-indigo-500 mb-6" 
 placeholder="Tên thư mục..." 
 />
 <button type="submit" className="w-full py-3 rounded-3xl font-bold text-idaz-black bg-indigo-600 hover:bg-indigo-700 transition-colors">
 Tạo mới
 </button>
 </form>
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>

 {/* Upload File Modal */}
 <AnimatePresence>
 {isUploadOpen && (
 <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
 <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-panel border border-white/60 rounded-3xl w-full max-w-lg overflow-hidden flex flex-col">
 <div className="p-6 border-b border-white/40 flex justify-between items-center bg-white/50">
 <h3 className="text-xl font-bold text-idaz-black flex items-center gap-2"><UploadCloud size={24} className="text-indigo-400"/> Tải File Lên</h3>
 <button onClick={() => setIsUploadOpen(false)} className="text-gray-500 hover:text-idaz-black"><X size={20} /></button>
 </div>
 
 <div className="p-6 flex-1 flex flex-col">
 <label className="border-2 border-dashed border-white/60 rounded-3xl p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all group">
 <input type="file" multiple onChange={handleFileChange} className="hidden" />
 <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
 <UploadCloud size={32} className="text-indigo-400" />
 </div>
 <h4 className="font-bold text-idaz-black text-lg mb-1">Click để chọn file</h4>
 <p className="text-gray-500 text-sm">hoặc kéo thả file vào đây. Hỗ trợ JPG, PNG, PDF, ZIP...</p>
 <p className="text-zinc-600 text-xs mt-2">Tối đa 50MB / file</p>
 </label>

 {uploadFiles.length > 0 && (
 <div className="mt-6">
 <h5 className="text-sm font-bold text-idaz-black mb-3">File đã chọn ({uploadFiles.length})</h5>
 <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-2 pr-2">
 {uploadFiles.map((f, i) => (
 <div key={i} className="flex items-center justify-between p-3 glass-panel rounded-3xl border border-white/40">
 <div className="flex items-center gap-3 overflow-hidden">
 {f.previewUrl ? (
 <img src={f.previewUrl} className="w-8 h-8 rounded object-cover shrink-0" />
 ) : (
 <FileText size={16} className="text-gray-400 shrink-0" />
 )}
 <span className="text-sm text-gray-600 truncate font-medium">{f.name}</span>
 </div>
 <span className="text-xs text-gray-500 shrink-0 ml-4">{(f.size / 1024 / 1024).toFixed(2)} MB</span>
 </div>
 ))}
 </div>
 </div>
 )}

 {uploadProgress > 0 && uploadProgress < 100 && (
 <div className="mt-6">
 <div className="flex justify-between text-xs text-gray-400 mb-2">
 <span>Đang tải lên...</span>
 <span>{uploadProgress}%</span>
 </div>
 <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
 <div className="bg-indigo-500 h-full rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
 </div>
 </div>
 )}

 {uploadError && (
 <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-3xl text-rose-500 text-sm">
 {uploadError}
 </div>
 )}
 </div>

 <div className="p-6 border-t border-white/40 bg-white/50 flex gap-3">
 {uploadProgress > 0 && uploadController && (
 <button onClick={cancelUpload} className="px-6 py-3 rounded-3xl font-bold text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 transition-colors border border-rose-500/20">
 Hủy tải lên
 </button>
 )}
 {uploadError && uploadProgress === 0 ? (
 <button onClick={handleUpload} disabled={uploadFiles.length === 0} className="flex-1 py-3 rounded-3xl font-bold text-idaz-black bg-amber-600 hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
 Thử lại (Retry)
 </button>
 ) : (
 <button onClick={handleUpload} disabled={uploadFiles.length === 0 || uploadProgress > 0} className="flex-1 py-3 rounded-3xl font-bold text-idaz-black bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
 {uploadProgress > 0 ? 'Đang xử lý...' : 'Bắt đầu tải lên'}
 </button>
 )}
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>

 {/* Rename Modal */}
 <AnimatePresence>
 {isRenameOpen && (
 <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-[80] p-4">
 <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-panel border border-white/60 p-6 rounded-3xl w-full max-w-sm shadow-2xl">
 <h3 className="text-xl font-bold text-idaz-black mb-4">Đổi tên {renameTarget?.isFolder ? 'Thư mục' : 'File'}</h3>
 <form onSubmit={handleRenameSubmit}>
 <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nhập tên mới..." className="w-full glass-panel border border-white/60 rounded-3xl py-2 px-4 text-idaz-black focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors mb-4" autoFocus />
 <div className="flex justify-end gap-3">
 <button type="button" onClick={() => setIsRenameOpen(false)} className="px-4 py-2 hover:bg-white/10 rounded-3xl text-idaz-black font-medium transition-colors">Hủy</button>
 <button type="submit" disabled={!newName.trim() || newName === renameTarget?.name} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-idaz-black rounded-3xl font-medium transition-colors disabled:opacity-50">Lưu thay đổi</button>
 </div>
 </form>
 </motion.div>
 </div>
 )}
 </AnimatePresence>

 {/* Preview Modal */}
 <AnimatePresence>
 {previewAsset && (
 <div className="fixed inset-0 bg-white/90 backdrop-blur-md flex items-center justify-center z-[60] p-4">
 <button onClick={() => setPreviewAsset(null)} className="absolute top-6 right-6 text-gray-400 hover:text-idaz-black bg-white/50 p-2 rounded-full backdrop-blur-sm"><X size={24} /></button>
 <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-5xl max-h-[90vh] flex flex-col relative">
 <div className="flex-1 overflow-hidden rounded-3xl border border-white/60 glass-panel flex items-center justify-center min-h-[500px]">
 {previewAsset.type === 'image' ? (
 <img src={previewAsset.url} alt={previewAsset.name} className="max-w-full max-h-[80vh] object-contain" />
 ) : previewAsset.type === 'video' ? (
 <video src={previewAsset.url} controls className="max-w-full max-h-[80vh]"></video>
 ) : previewAsset.type === 'document' && previewAsset.url.endsWith('.pdf') ? (
 <iframe src={previewAsset.url} className="w-full h-[80vh] glass-panel"></iframe>
 ) : (
 <div className="text-center text-gray-500 flex flex-col items-center">
 {getTypeIcon(previewAsset.type, previewAsset.mimeType)}
 <p className="mt-4 font-bold text-idaz-black">Không có bản xem trước cho định dạng này.</p>
 <a href={previewAsset.url} download target="_blank" rel="noreferrer" className="mt-4 px-6 py-2 bg-indigo-600 text-idaz-black rounded-full font-bold inline-block hover:bg-indigo-700">Tải xuống ngay</a>
 </div>
 )}
 </div>
 <div className="mt-4 bg-white/80 backdrop-blur-md border border-white/60 rounded-3xl p-4 flex items-center justify-between">
 <div>
 <h3 className="text-idaz-black font-bold text-lg">{previewAsset.name}</h3>
 <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
 <span>Kích thước: {(previewAsset.fileSize / 1024 / 1024).toFixed(2)} MB</span>
 <span>Upload bởi: {previewAsset.uploadedBy?.name || 'Admin'}</span>
 <span>Phiên bản: {previewAsset.version}</span>
 </div>
 </div>
 <div className="flex gap-2">
 <a href={previewAsset.url} target="_blank" rel="noreferrer" className="px-4 py-2 bg-white/10 hover:bg-white/20 text-idaz-black rounded-3xl text-sm font-bold transition-all">
 Mở Link Mới
 </a>
 <a href={previewAsset.url} download className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-idaz-black rounded-3xl text-sm font-bold transition-all">
 Tải Xuống
 </a>
 </div>
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>

 {/* Context Menu */}
 <AnimatePresence>
 {contextMenu && (
 <motion.div 
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 exit={{ opacity: 0, scale: 0.95 }}
 className="fixed z-[70] glass-panel border border-white/60 rounded-3xl shadow-2xl py-2 w-48"
 style={{ top: contextMenu.y, left: contextMenu.x }}
 onClick={(e) => e.stopPropagation()}
 >
 {contextMenu.isFolder ? (
 <>
 <button onClick={() => { setRenameTarget({ id: contextMenu.item._id, name: contextMenu.item.name, isFolder: true }); setNewName(contextMenu.item.name); setIsRenameOpen(true); setContextMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-white/10 text-gray-600 text-sm flex items-center gap-3"><Edit2 size={16} /> Đổi tên</button>
 <div className="h-px bg-white/10 my-1"></div>
 <button onClick={() => { handleDeleteFolder(contextMenu.item._id); setContextMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-rose-500/20 text-rose-500 text-sm flex items-center gap-3"><Trash2 size={16} /> Xóa thư mục</button>
 </>
 ) : (
 <>
 <button onClick={() => { setPreviewAsset(contextMenu.item); setContextMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-white/10 text-gray-600 text-sm flex items-center gap-3"><Search size={16} /> Xem trước</button>
 <a href={contextMenu.item.url} target="_blank" rel="noreferrer" onClick={() => setContextMenu(null)} className="w-full text-left px-4 py-2 hover:bg-white/10 text-gray-600 text-sm flex items-center gap-3"><LinkIcon size={16} /> Mở file gốc</a>
 <button onClick={() => { setRenameTarget({ id: contextMenu.item._id, name: contextMenu.item.name, isFolder: false }); setNewName(contextMenu.item.name); setIsRenameOpen(true); setContextMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-white/10 text-gray-600 text-sm flex items-center gap-3"><Edit2 size={16} /> Đổi tên</button>
 <div className="h-px bg-white/10 my-1"></div>
 <button onClick={() => { handleDeleteAsset(contextMenu.item._id); setContextMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-rose-500/20 text-rose-500 text-sm flex items-center gap-3"><Trash2 size={16} /> Xóa file</button>
 </>
 )}
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 );
}
