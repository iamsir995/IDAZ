"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "../../../../services/api";
import { useAuth } from "../../../../context/AuthContext";
import { LifeBuoy, ArrowLeft, Send } from "lucide-react";
import toast from "react-hot-toast";

export default function TicketDetail() {
 const params = useParams();
 const router = useRouter();
 const { user } = useAuth();
 const [ticket, setTicket] = useState(null);
 const [loading, setLoading] = useState(true);
 const [replyMessage, setReplyMessage] = useState("");
 const [isReplying, setIsReplying] = useState(false);

 useEffect(() => {
 fetchTicket();
 }, [params.id]);

 const fetchTicket = async () => {
 try {
 const res = await api.get(`/tickets/${params.id}`);
 if (res.data.success) {
 setTicket(res.data.data);
 }
 } catch (error) {
 toast.error("Không tải được chi tiết ticket");
 router.push('/client/support');
 } finally {
 setLoading(false);
 }
 };

 const handleReply = async (e) => {
 e.preventDefault();
 if (!replyMessage.trim()) return;
 setIsReplying(true);
 try {
 const res = await api.post(`/tickets/${params.id}/reply`, { message: replyMessage });
 if (res.data.success) {
 setTicket(res.data.data);
 setReplyMessage("");
 }
 } catch (error) {
 toast.error("Lỗi gửi phản hồi.");
 } finally {
 setIsReplying(false);
 }
 };

 const getStatusColor = (status) => {
 switch (status) {
 case 'open': return 'bg-rose-100 text-rose-600 border-rose-200';
 case 'in_progress': return 'bg-amber-100 text-amber-600 border-amber-200';
 case 'resolved': return 'bg-emerald-100 text-emerald-600 border-emerald-200';
 default: return 'bg-gray-100 text-gray-600 border-white/60';
 }
 };

 const getStatusLabel = (status) => {
 switch (status) {
 case 'open': return 'Đang mở';
 case 'in_progress': return 'Đang xử lý';
 case 'resolved': return 'Đã giải quyết';
 default: return status;
 }
 };

 if (loading) return <div className="p-8 text-gray-500">Đang tải...</div>;
 if (!ticket) return null;

 return (
 <div className="max-w-4xl mx-auto py-8">
 <button 
 onClick={() => router.push('/client/support')}
 className="flex items-center gap-2 text-gray-500 hover:text-idaz-black transition-colors mb-6 font-medium"
 >
 <ArrowLeft size={18} /> Quay lại
 </button>

 <div className="glass-panel border border-white/60 rounded-3xl p-8 shadow-sm mb-6">
 <div className="flex justify-between items-start mb-6">
 <div>
 <h1 className="text-2xl font-bold text-idaz-black mb-2">{ticket.title}</h1>
 <p className="text-sm text-gray-500">
 Tạo ngày {new Date(ticket.createdAt).toLocaleString('vi-VN')}
 </p>
 </div>
 <span className={`px-4 py-1.5 rounded-full text-sm font-bold border ${getStatusColor(ticket.status)}`}>
 {getStatusLabel(ticket.status)}
 </span>
 </div>

 <div className="space-y-6">
 {/* Initial Message */}
 <div className="flex gap-4 flex-row-reverse">
 <div className="w-10 h-10 rounded-full bg-idaz-orange overflow-hidden shrink-0 flex items-center justify-center text-white font-bold">
 {ticket.userId?.name?.charAt(0) || user?.name?.charAt(0)}
 </div>
 <div className="max-w-[80%] text-right">
 <div className="text-sm font-semibold text-gray-700 mb-1">
 {ticket.userId?.name || user?.name} <span className="text-xs text-gray-400 font-normal ml-2">{new Date(ticket.createdAt).toLocaleString('vi-VN')}</span>
 </div>
 <div className="p-4 rounded-3xl bg-idaz-orange text-white rounded-tr-none whitespace-pre-wrap">
 {ticket.description}
 </div>
 </div>
 </div>

 {/* Replies */}
 {ticket.replies?.map((reply, idx) => {
 const isMe = reply.senderId === user?.id;
 return (
 <div key={idx} className={`flex gap-4 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
 <div className={`w-10 h-10 rounded-full overflow-hidden shrink-0 flex items-center justify-center font-bold text-white ${isMe ? 'bg-idaz-orange' : 'bg-indigo-600'}`}>
 {reply.senderName?.charAt(0)}
 </div>
 <div className={`max-w-[80%] ${isMe ? 'text-right' : 'text-left'}`}>
 <div className="text-sm font-semibold text-gray-700 mb-1">
 {reply.senderName} 
 {!isMe && <span className="ml-2 text-[10px] bg-black/5 text-gray-500 px-1.5 py-0.5 rounded uppercase">{reply.senderRole}</span>}
 <span className="text-xs text-gray-400 font-normal mx-2">{new Date(reply.createdAt).toLocaleString('vi-VN')}</span>
 </div>
 <div className={`p-4 rounded-3xl whitespace-pre-wrap ${isMe ? 'bg-idaz-orange text-white rounded-tr-none' : 'bg-gray-100 text-idaz-black rounded-tl-none'}`}>
 {reply.message}
 </div>
 </div>
 </div>
 )})}
 </div>
 </div>

 {ticket.status !== 'resolved' && (
 <form onSubmit={handleReply} className="flex gap-4">
 <input 
 type="text" 
 value={replyMessage}
 onChange={(e) => setReplyMessage(e.target.value)}
 placeholder="Nhập tin nhắn của bạn..." 
 className="flex-1 glass-panel border border-white/60 rounded-3xl px-6 py-4 text-idaz-black focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm"
 />
 <button 
 type="submit" 
 disabled={isReplying}
 className="bg-idaz-orange hover:bg-idaz-orange-dark text-white px-8 py-4 rounded-3xl font-bold shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
 >
 <Send size={20} /> Gửi
 </button>
 </form>
 )}
 {ticket.status === 'resolved' && (
 <div className="bg-gray-100 text-gray-500 text-center py-4 rounded-3xl border border-white/60 font-medium">
 Ticket này đã được giải quyết và đóng lại.
 </div>
 )}
 </div>
 );
}
