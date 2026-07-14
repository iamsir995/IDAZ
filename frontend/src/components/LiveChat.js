"use client";

import { useState, useEffect, useRef } from "react";
import api from "../services/api";
import { MessageCircle, X, Send, User as UserIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";

export default function LiveChat() {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!user || !socket || ['superadmin', 'admin'].includes(user.role)) return;

    let supportRoomId = `support_${user._id}`;
    let fetchedChannelId = null;

    const initSupportChat = async () => {
      try {
        const res = await api.get('/chat/support-channel');
        if (res.data.success) {
          fetchedChannelId = res.data.data._id;
          socket.emit("join_channel", supportRoomId);
          
          const msgsRes = await api.get(`/chat/channels/${fetchedChannelId}/messages?limit=50`);
          if (msgsRes.data.success) {
            setMessages(msgsRes.data.data);
          }
        }
      } catch (err) {
        console.error("Lỗi khởi tạo support chat", err);
      }
    };

    initSupportChat();

    const handleReceiveMsg = (data) => {
      if (data.channelId === fetchedChannelId || data.type === 'support') {
        setMessages((prev) => {
          if (prev.find(m => m._id === data._id)) return prev;
          return [...prev, data];
        });
      }
    };

    socket.on("receive_support_message", handleReceiveMsg);

    return () => {
      socket.emit("leave_channel", supportRoomId);
      socket.off("receive_support_message", handleReceiveMsg);
    };
  }, [user, socket]);

  useEffect(() => {
    // Scroll xuống cuối khi có tin nhắn mới
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !user || !socket) return;

    const msgData = {
      senderId: user._id,
      senderName: user.name,
      senderRole: user.role,
      text: inputText,
      type: 'support'
    };

    socket.emit("send_support_message", msgData);
    setInputText("");
  };

  // Chỉ hiển thị Live Chat cho khách hàng, Admin dùng /admin/chat
  if (!user || ['superadmin', 'admin'].includes(user.role)) return null;

  return (
    <>
      {/* Nút bật Chat */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 rounded-full shadow-2xl z-50 text-idaz-black bg-idaz-orange shadow-indigo-500/50 ${isOpen ? 'hidden' : 'flex'}`}
      >
        <MessageCircle size={28} />
      </motion.button>

      {/* Cửa sổ Chat */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-6 right-6 w-80 md:w-96 glass-card border border-white/60 rounded-3xl shadow-2xl overflow-hidden z-50 flex flex-col h-[500px]"
          >
            {/* Header */}
            <div className={`p-4 flex items-center justify-between bg-idaz-orange`}>
              <div className="flex items-center gap-2 text-idaz-black">
                <MessageCircle size={20} />
                <h3 className="font-bold">Hỗ trợ Trực tuyến</h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-idaz-black/80 hover:text-idaz-black transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Khung chat */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-white/50">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 text-sm">
                  <MessageCircle size={32} className="mb-2 opacity-50" />
                  <p>Chưa có tin nhắn nào.</p>
                  <p>Hãy bắt đầu cuộc trò chuyện!</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = msg.senderId === user._id;
                  const isAdmin = msg.senderRole === 'admin';
                  
                  return (
                    <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      {!isMe && (
                        <span className="text-[10px] text-gray-500 mb-1 ml-1 flex items-center gap-1">
                          <UserIcon size={10} /> {msg.senderName} {isAdmin && '(Admin)'}
                        </span>
                      )}
                      <div className={`px-4 py-2 rounded-3xl max-w-[85%] text-sm ${
                        isMe 
                          ? 'bg-idaz-orange text-idaz-black rounded-br-sm'
                          : (isAdmin ? 'bg-rose-500/20 border border-rose-500/30 text-rose-100 rounded-bl-sm' : 'bg-gray-100 text-zinc-200 rounded-bl-sm')
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Form nhập */}
            <div className="p-3 glass-card border-t border-white/60">
              <form onSubmit={handleSend} className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 glass-card border border-white/60 rounded-2xl px-4 py-2.5 text-sm text-idaz-black focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className={`p-2.5 rounded-2xl text-idaz-black transition-all ${
                    !inputText.trim() ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                    : 'bg-idaz-orange hover:bg-idaz-orange-dark'
                  }`}
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
