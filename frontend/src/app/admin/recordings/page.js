"use client";

import { useState, useEffect } from "react";
import api from "../../../services/api";
import { Disc2, Phone, Video, Calendar, Clock, Download, Play, User as UserIcon } from "lucide-react";

export default function AdminRecordings() {
 const [recordings, setRecordings] = useState([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 fetchRecordings();
 }, []);

 const fetchRecordings = async () => {
 try {
 const res = await api.get('/recordings');
 if (res.data.success) {
 setRecordings(res.data.data);
 }
 } catch (error) {
 console.error("Lỗi tải danh sách ghi âm", error);
 } finally {
 setLoading(false);
 }
 };

 const formatDuration = (secs) => {
 if (!secs) return "00:00";
 const m = Math.floor(secs / 60).toString().padStart(2, '0');
 const s = (secs % 60).toString().padStart(2, '0');
 return `${m}:${s}`;
 };

 return (
 <div className="h-full flex flex-col p-8">
 <div className="flex justify-between items-center mb-8">
 <div>
 <h1 className="text-3xl font-bold text-idaz-black mb-2 flex items-center gap-3">
 <Disc2 className="text-rose-500" size={32} />
 Lịch sử Cuộc gọi / Ghi âm
 </h1>
 <p className="text-gray-400">Quản lý và xem lại các cuộc trao đổi với khách hàng.</p>
 </div>
 </div>

 <div className="flex-1 glass-panel border border-white/40 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
 <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/60 text-xs font-bold text-gray-500 uppercase tracking-wider bg-white/50">
 <div className="col-span-4">Thông tin cuộc gọi</div>
 <div className="col-span-2">Khách hàng</div>
 <div className="col-span-2">Thời lượng</div>
 <div className="col-span-2">Ngày tạo</div>
 <div className="col-span-2 text-right">Thao tác</div>
 </div>

 <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
 {loading ? (
 <div className="p-8 text-center text-gray-500">Đang tải dữ liệu...</div>
 ) : recordings.length === 0 ? (
 <div className="p-12 text-center text-gray-500 flex flex-col items-center">
 <Disc2 size={48} className="mb-4 opacity-50" />
 <p>Chưa có file ghi âm nào.</p>
 </div>
 ) : (
 recordings.map((rec) => (
 <div key={rec._id} className="grid grid-cols-12 gap-4 p-4 items-center bg-white/20 hover:bg-white/5 border border-transparent hover:border-white/60 rounded-3xl transition-all group">
 <div className="col-span-4 flex items-center gap-4">
 <div className={`w-12 h-12 rounded-3xl flex items-center justify-center shrink-0 ${rec.callType === 'audio' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-indigo-500/10 text-indigo-500'}`}>
 {rec.callType === 'audio' ? <Phone size={20} /> : <Video size={20} />}
 </div>
 <div>
 <h3 className="text-idaz-black font-bold text-sm">Cuộc gọi {rec.callType === 'audio' ? 'Thoại' : 'Video'}</h3>
 <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
 <UserIcon size={12} /> {rec.adminId?.name || 'Admin'}
 </p>
 </div>
 </div>
 
 <div className="col-span-2 text-sm text-gray-600 flex items-center gap-2">
 <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-idaz-black shrink-0">
 {rec.clientId?.name ? rec.clientId.name.charAt(0) : 'KH'}
 </div>
 <span className="truncate">{rec.clientId?.name || 'Khách vãng lai'}</span>
 </div>

 <div className="col-span-2 text-sm text-gray-400 flex items-center gap-2">
 <Clock size={14} className="text-gray-500" />
 {formatDuration(rec.duration)}
 </div>

 <div className="col-span-2 text-sm text-gray-400 flex items-center gap-2">
 <Calendar size={14} className="text-gray-500" />
 {new Date(rec.createdAt).toLocaleDateString('vi-VN')}
 </div>

 <div className="col-span-2 flex justify-end gap-2">
 <a href={`http://localhost:5000${rec.fileUrl}`} target="_blank" rel="noreferrer" className="p-2 bg-indigo-600 hover:bg-indigo-700 text-idaz-black rounded-xl transition-colors shadow-lg shadow-indigo-600/20" title="Phát">
 <Play size={16} />
 </a>
 <a href={`http://localhost:5000${rec.fileUrl}`} download className="p-2 bg-gray-100 hover:bg-gray-700 text-idaz-black rounded-xl transition-colors" title="Tải xuống">
 <Download size={16} />
 </a>
 </div>
 </div>
 ))
 )}
 </div>
 </div>
 </div>
 );
}
