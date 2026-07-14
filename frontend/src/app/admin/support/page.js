"use client";

import { useState, useEffect } from "react";
import api from "../../../services/api";
import { LifeBuoy, Search, AlertCircle, CheckCircle, Clock, MessageCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

export default function AdminSupport() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replyStatus, setReplyStatus] = useState("");

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
      toast.error("Không tải được danh sách hỗ trợ");
    } finally {
      setLoading(false);
    }
  };

  const openTicketModal = (ticket) => {
    setSelectedTicket(ticket);
    setReplyText("");
    setReplyStatus(ticket.status);
  };

  const handleUpdateStatus = async (newStatus) => {
    try {
      const res = await api.put(`/tickets/${selectedTicket._id}`, {
        status: newStatus
      });
      if (res.data.success) {
        toast.success("Đã cập nhật trạng thái");
        setReplyStatus(newStatus);
        setSelectedTicket(res.data.data);
        fetchTickets();
      }
    } catch (error) {
      toast.error("Lỗi cập nhật Ticket");
    }
  };

  const handleReplyTicket = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    try {
      const res = await api.post(`/tickets/${selectedTicket._id}/reply`, {
        message: replyText
      });
      if (res.data.success) {
        setReplyText("");
        setSelectedTicket(res.data.data);
        fetchTickets();
      }
    } catch (error) {
      toast.error("Lỗi gửi phản hồi");
    }
  };

  const filteredTickets = tickets.filter(t => {
    const matchStatus = filterStatus === 'all' || t.status === filterStatus;
    const matchSearch = !searchQuery || 
      t.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.userId?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex items-center justify-between mb-8 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-idaz-black mb-2 flex items-center gap-3">
            Hỗ trợ Khách hàng
          </h1>
          <p className="text-gray-400">Giải quyết các vấn đề, lỗi kỹ thuật và hỗ trợ yêu cầu từ khách hàng.</p>
        </div>
      </div>

      {/* Danh sách Ticket */}
      <div className="flex-1 glass-card border border-white/60 rounded-3xl overflow-hidden flex flex-col min-h-[400px]">
        <div className="p-4 border-b border-white/40 flex items-center justify-between gap-3 shrink-0 flex-wrap">
          <h3 className="font-bold text-idaz-black text-lg">Danh sách Ticket</h3>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input type="text" placeholder="Tìm kiếm khách hàng..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="glass-panel border border-white/60 rounded-xl pl-8 pr-3 py-1.5 text-idaz-black text-sm focus:outline-none focus:border-rose-500 w-48 transition-colors" />
            </div>
            {['all', 'open', 'in_progress', 'resolved'].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  filterStatus === s ? 'bg-indigo-600 text-white' : 'bg-white/5 text-gray-400 hover:text-idaz-black'
                }`}>
                {s === 'all' ? 'Tất cả' : s === 'open' ? 'Mới' : s === 'in_progress' ? 'Đang xử lý' : 'Đã xong'}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/40 glass-panel/[0.02] text-sm font-medium text-gray-400">
                <th className="p-4 pl-6 font-medium">Khách hàng</th>
                <th className="p-4 font-medium">Tiêu đề (Vấn đề)</th>
                <th className="p-4 font-medium">Mức độ</th>
                <th className="p-4 font-medium">Trạng thái</th>
                <th className="p-4 font-medium">Ngày tạo</th>
                <th className="p-4 pr-6 text-right font-medium">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="text-center p-8 text-gray-400">Đang tải...</td></tr>
              ) : filteredTickets.length === 0 ? (
                <tr><td colSpan="6" className="text-center p-8 text-gray-500">Không có dữ liệu ticket</td></tr>
              ) : (
                filteredTickets.map((t, idx) => (
                  <motion.tr
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.04 }}
                    key={t._id}
                    className="border-b border-white/40 hover:glass-panel/[0.02] transition-colors group text-sm"
                  >
                    <td className="p-4 pl-6">
                      <div className="font-bold text-idaz-black">{t.userId?.name || 'Unknown'}</div>
                      <div className="text-xs text-gray-500">{t.userId?.email}</div>
                    </td>
                    <td className="p-4">
                      <h3 className="text-idaz-black font-semibold truncate max-w-xs">{t.title}</h3>
                    </td>
                    <td className="p-4">
                      <span className={`text-xs font-bold uppercase ${
                        t.priority === 'high' ? 'text-rose-500' : t.priority === 'medium' ? 'text-amber-500' : 'text-emerald-500'
                      }`}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                        t.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                        t.status === 'in_progress' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                        'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'
                      }`}>
                        {t.status === 'resolved' ? <CheckCircle size={12} /> : t.status === 'in_progress' ? <Clock size={12} /> : <AlertCircle size={12} />}
                        {t.status === 'resolved' ? 'Đã xong' : t.status === 'in_progress' ? 'Đang xử lý' : 'Mới'}
                      </span>
                    </td>
                    <td className="p-4 text-gray-500">{new Date(t.createdAt).toLocaleDateString('vi-VN')}</td>
                    <td className="p-4 pr-6 text-right">
                      <button onClick={() => openTicketModal(t)}
                        className="text-xs font-bold text-indigo-500 hover:text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-xl transition-all border border-indigo-500/20">
                        Phản hồi
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Phản hồi */}
      <AnimatePresence>
        {selectedTicket && (
          <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel border border-white/60 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center p-6 border-b border-white/60 bg-white/50">
                <h3 className="text-xl font-bold text-idaz-black flex items-center gap-2">
                  <LifeBuoy size={24} className="text-indigo-500" /> Chi tiết Ticket
                </h3>
                <button onClick={() => setSelectedTicket(null)} className="text-gray-400 hover:text-idaz-black">
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 space-y-4">
                <div className="mb-4 text-center">
                  <span className="text-xs font-bold text-gray-400 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100">Vấn đề: {selectedTicket.title}</span>
                </div>
                
                {/* Tin nhắn gốc */}
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold shrink-0">
                    {selectedTicket.userId?.name?.charAt(0) || 'U'}
                  </div>
                  <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-gray-100 max-w-[85%]">
                    <p className="text-sm font-bold text-idaz-black mb-1">{selectedTicket.userId?.name}</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedTicket.description}</p>
                    <p className="text-[10px] text-gray-400 mt-2">{new Date(selectedTicket.createdAt).toLocaleString('vi-VN')}</p>
                  </div>
                </div>

                {/* Các phản hồi */}
                {selectedTicket.replies?.map((reply, index) => {
                  const isAdmin = reply.senderRole === 'admin' || reply.senderRole === 'manager' || reply.senderRole === 'dev' || reply.senderRole === 'content' || reply.senderRole === 'intern' || reply.senderRole === 'affiliate';
                  return (
                    <div key={index} className={`flex gap-4 ${isAdmin ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0 text-xs ${isAdmin ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600'}`}>
                        {reply.senderName?.charAt(0) || 'U'}
                      </div>
                      <div className={`p-4 rounded-2xl shadow-sm max-w-[85%] ${
                        isAdmin 
                          ? 'bg-gradient-to-br from-rose-500 to-orange-500 text-white rounded-tr-none' 
                          : 'bg-white border border-gray-100 text-gray-700 rounded-tl-none'
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-sm font-bold ${isAdmin ? 'text-white' : 'text-idaz-black'}`}>{reply.senderName}</span>
                          {isAdmin && <span className="text-[10px] bg-black/20 px-1.5 py-0.5 rounded text-white">{reply.senderRole}</span>}
                        </div>
                        <p className={`text-sm whitespace-pre-wrap ${isAdmin ? 'text-white' : 'text-gray-700'}`}>{reply.message}</p>
                        <p className={`text-[10px] mt-2 ${isAdmin ? 'text-white/70' : 'text-gray-400'}`}>{new Date(reply.createdAt).toLocaleString('vi-VN')}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="p-4 border-t border-gray-100 bg-white">
                <div className="flex items-center justify-between mb-4 px-2">
                  <div className="text-sm font-bold text-gray-500">Trạng thái xử lý:</div>
                  <select 
                    value={replyStatus} 
                    onChange={e => handleUpdateStatus(e.target.value)}
                    className="glass-panel text-sm border border-gray-200 rounded-xl px-3 py-1.5 text-idaz-black focus:outline-none focus:border-indigo-500"
                  >
                    <option value="open">Mới (Đang chờ)</option>
                    <option value="in_progress">Đang xử lý</option>
                    <option value="resolved">Đã giải quyết xong</option>
                  </select>
                </div>
                <form onSubmit={handleReplyTicket} className="flex gap-3 relative">
                  <textarea 
                    value={replyText} onChange={e => setReplyText(e.target.value)}
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 pr-14 text-sm text-idaz-black focus:outline-none focus:border-indigo-500 resize-none"
                    rows="2"
                    placeholder="Nhập nội dung trả lời..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleReplyTicket(e);
                      }
                    }}
                  />
                  <button type="submit" disabled={!replyText.trim()} className="absolute right-2 top-2 bottom-2 aspect-square bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center justify-center transition-colors disabled:opacity-50">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
