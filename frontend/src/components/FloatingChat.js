import { useState, useEffect, useRef } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { MessageSquare, X, Send, Paperclip, Check, CheckCheck, Video, MapPin, Phone, PhoneOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import VideoCallModal from "./VideoCallModal";
import toast from "react-hot-toast";

export default function FloatingChat() {
  const { user } = useAuth();
  const { socket, emit, subscribe, joinRoom, leaveRoom } = useSocket();
  const [componentId] = useState(() => `floating-chat-${Math.random().toString(36).substring(7)}`);
  const [isOpen, setIsOpen] = useState(false);
  const [channels, setChannels] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);
  
  // Video Call State
  const [isVideoCallActive, setIsVideoCallActive] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [callUser, setCallUser] = useState(null);
  
  // Geolocation State
  const [isSendingLocation, setIsSendingLocation] = useState(false);
  const [isTypingIndicator, setIsTypingIndicator] = useState(false);

  // Ref để tránh stale closure
  const activeChannelRef = useRef(null);
  useEffect(() => { activeChannelRef.current = activeChannel; }, [activeChannel]);

  // Fetch channels khi mount
  useEffect(() => {
    if (!user || user.role !== 'client') return;
    const fetchChannels = async () => {
      try {
        const res = await api.get('/channels');
        if (res.data.success) {
          setChannels(res.data.data);
          if (res.data.data.length > 0) setActiveChannel(res.data.data[0]);
        }
      } catch (err) { console.error(err); }
    };
    fetchChannels();
  }, [user]);

  // Subscribe realtime events qua SocketContext (không tạo socket mới)
  useEffect(() => {
    if (!user || user.role !== 'client') return;
    const unsubs = [
      subscribe('receive_message', componentId, (msg) => {
        const currentChannel = activeChannelRef.current;
        setMessages(prev => {
          if (prev.find(m => m._id === msg._id)) return prev;
          if (currentChannel && msg.channelId === currentChannel._id) return [...prev, msg];
          return prev;
        });
        if (msg.senderId?._id !== user._id) {
          emit('message_read', { messageId: msg._id, channelId: msg.channelId, userId: user._id });
        }
      }),
      subscribe('message_read_update', componentId, ({ messageId, userId }) => {
        setMessages(prev => prev.map(m =>
          m._id === messageId && !m.readBy?.find(r => r.user === userId)
            ? { ...m, readBy: [...(m.readBy || []), { user: userId, readAt: new Date() }] }
            : m
        ));
      }),
      subscribe('incoming_call', componentId, (data) => {
        setIncomingCall(data);
        setIsOpen(true);
      }),
      subscribe('user_typing', componentId, ({ channelId }) => {
        if (channelId === activeChannelRef.current?._id) setIsTypingIndicator(true);
      }),
      subscribe('user_stop_typing', componentId, ({ channelId }) => {
        if (channelId === activeChannelRef.current?._id) setIsTypingIndicator(false);
      }),
    ];
    return () => unsubs.forEach(fn => fn && fn());
  }, [user, subscribe, emit]);

  // Fetch messages + join channel khi chuyển channel hoặc mở chat
  useEffect(() => {
    if (activeChannel && isOpen) {
      const fetchMessages = async () => {
        try {
          const res = await api.get(`/chat/channels/${activeChannel._id}/messages`);
          if (res.data.success) setMessages(res.data.data);
        } catch (err) { console.error(err); }
      };
      fetchMessages();
      joinRoom(activeChannel._id);
    }
    return () => {
      if (activeChannel) leaveRoom(activeChannel._id);
    };
  }, [activeChannel, isOpen, joinRoom, leaveRoom]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen, isTypingIndicator]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChannel) return;
    try {
      await api.post('/chat/messages', { channelId: activeChannel._id, text: newMessage });
      setNewMessage("");
    } catch (err) { console.error(err); }
  };

  const shareLocation = () => {
    if (!navigator.geolocation) { toast.error("Trình duyệt không hỗ trợ chia sẻ vị trí"); return; }
    setIsSendingLocation(true);
    toast.loading("Đang lấy vị trí...", { id: "loc" });
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          await api.put('/users/me/location', { lat: latitude, lng: longitude });
          if (activeChannel) {
            await api.post('/chat/messages', {
              channelId: activeChannel._id,
              text: `📍 Khách hàng đã chia sẻ vị trí hiện tại: https://www.google.com/maps?q=${latitude},${longitude}`
            });
          }
          toast.success("Đã gửi vị trí thành công", { id: "loc" });
        } catch { toast.error("Lỗi khi gửi vị trí", { id: "loc" }); }
        finally { setIsSendingLocation(false); }
      },
      () => { toast.error("Vui lòng cấp quyền truy cập vị trí", { id: "loc" }); setIsSendingLocation(false); }
    );
  };

  if (!user || user.role !== 'client') return null;

  return (
    <>
      {/* Incoming Call Banner — nổi bật khi có cuộc gọi đến */}
      <AnimatePresence>
        {incomingCall && !isVideoCallActive && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-50 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl shadow-2xl p-4 w-72 border border-emerald-400/30"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
                <Video size={20} className="text-idaz-black" />
              </div>
              <div>
                <p className="text-idaz-black font-bold text-sm">Cuộc gọi video đến</p>
                <p className="text-emerald-200 text-xs">{incomingCall.name || 'Agency Team'}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setIsVideoCallActive(true); setIsOpen(true); }}
                className="flex-1 glass-card text-emerald-700 font-bold text-sm py-2 rounded-2xl flex items-center justify-center gap-1.5 hover:bg-emerald-50 transition-colors"
              >
                <Phone size={15} /> Nghe máy
              </button>
              <button
                onClick={() => setIncomingCall(null)}
                className="flex-1 bg-white/20 text-idaz-black font-bold text-sm py-2 rounded-2xl flex items-center justify-center gap-1.5 hover:bg-white/30 transition-colors"
              >
                <PhoneOff size={15} /> Từ chối
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        animate={{ scale: isOpen ? 0 : 1 }}
        whileHover={{ scale: 1.1 }}
        className="fixed bottom-6 right-6 w-14 h-14 bg-idaz-orange hover:bg-idaz-orange-dark text-idaz-black rounded-full shadow-xl flex items-center justify-center z-40"
      >
        <MessageSquare size={24} />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed bottom-6 right-6 w-[380px] h-[600px] max-h-[85vh] glass-card rounded-3xl shadow-2xl border border-white/60 flex flex-col overflow-hidden z-50"
          >
            {/* Header */}
            <div className="h-16 bg-gradient-to-r from-indigo-600 to-violet-600 px-4 flex items-center justify-between shrink-0">
              <div className="flex flex-col text-idaz-black">
                <span className="font-bold">Hỗ trợ &amp; Thảo luận</span>
                <span className="text-xs text-indigo-700 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                  {activeChannel?.name || 'Chọn dự án'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { setCallUser({ id: activeChannel?._id }); setIsVideoCallActive(true); }}
                  className="text-idaz-black hover:bg-white/20 p-2 rounded-full transition-colors" title="Gọi Video"
                >
                  <Video size={18} />
                </button>
                <button onClick={() => setIsOpen(false)} className="text-idaz-black hover:bg-white/20 p-2 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Project Selector */}
            {channels.length > 1 && (
              <div className="bg-idaz-gray border-b border-white/60 p-2 shrink-0">
                <select
                  className="w-full glass-card border border-white/60 text-sm rounded-xl p-2 focus:outline-none focus:border-indigo-500"
                  value={activeChannel?._id || ''}
                  onChange={(e) => {
                    const ch = channels.find(c => c._id === e.target.value);
                    if (ch) setActiveChannel(ch);
                  }}
                >
                  {channels.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-idaz-gray custom-scrollbar">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                  <MessageSquare size={32} className="opacity-30" />
                  <p className="text-sm text-center">Gửi tin nhắn cho đội ngũ Agency<br />để được hỗ trợ ngay!</p>
                </div>
              )}
              {messages.map((msg, idx) => {
                const senderIdStr = typeof msg.senderId === 'object' ? msg.senderId._id : msg.senderId;
                const isMe = senderIdStr === user._id;
                return (
                  <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    {!isMe && <span className="text-[10px] font-semibold text-gray-500 mb-1 ml-1">{msg.senderId?.name || msg.senderName}</span>}
                    <div className={`max-w-[85%] rounded-3xl px-4 py-2 text-sm shadow-sm ${
                      isMe ? 'bg-idaz-orange text-idaz-black rounded-br-none' : 'glass-card border border-white/60 text-gray-700 rounded-bl-none'
                    }`}>
                      <p>{msg.text}</p>
                      <div className={`flex items-center justify-end gap-1 mt-1 text-[9px] ${isMe ? 'text-indigo-700' : 'text-gray-400'}`}>
                        <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {isMe && (msg.readBy?.length > 1 ? <CheckCheck size={12} className="text-blue-300"/> : <Check size={12} />)}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* Typing indicator */}
              {isTypingIndicator && (
                <div className="flex items-start">
                  <div className="glass-card border border-white/60 rounded-3xl rounded-bl-none px-4 py-2.5 flex gap-1 items-center shadow-sm">
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 glass-card border-t border-white/60 shrink-0">
              <form onSubmit={sendMessage} className="flex items-center gap-2">
                <button type="button" className="p-2 text-gray-400 hover:text-idaz-orange transition-colors" title="Đính kèm file">
                  <Paperclip size={20} />
                </button>
                <button
                  type="button"
                  onClick={shareLocation}
                  disabled={isSendingLocation}
                  className="p-2 text-gray-400 hover:text-emerald-600 transition-colors disabled:opacity-50"
                  title="Gửi vị trí hiện tại"
                >
                  <MapPin size={20} />
                </button>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 bg-gray-100 text-sm rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="p-2 bg-idaz-orange text-idaz-black rounded-full hover:bg-idaz-orange-dark disabled:opacity-50 transition-colors"
                >
                  <Send size={18} className="ml-0.5" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Call Modal */}
      <VideoCallModal
        socket={socket}
        userId={user?._id || user?.id}
        incomingCall={incomingCall}
        setIncomingCall={setIncomingCall}
        callUser={callUser}
        setCallUser={setCallUser}
      />
    </>
  );
}
