"use client";

import { useEffect } from "react";
import { Bell, CheckCircle, Clock, AlertCircle, Receipt, CheckSquare, MessageSquare } from "lucide-react";
import api from "../services/api";
import { useSocket } from "../context/SocketContext";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";

const NOTIF_ICONS = {
  invoice: <Receipt size={16} className="text-amber-400" />,
  task:    <CheckSquare size={16} className="text-emerald-400" />,
  message: <MessageSquare size={16} className="text-indigo-400" />,
  ticket:  <AlertCircle size={16} className="text-rose-400" />,
  default: <Bell size={16} className="text-gray-400" />,
};

export default function NotificationCenter() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    markNotificationRead,
    markAllNotificationsRead,
    setInitialNotifications,
  } = useSocket();

  // Fetch danh sách notification lúc đầu từ API
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { data } = await api.get('/notifications');
        if (data.success) setInitialNotifications(data.data);
      } catch (e) {
        console.error("Lỗi tải thông báo:", e);
      }
    };
    fetchNotifications();
  }, [setInitialNotifications]);

  const handleMarkRead = async (notif) => {
    if (!notif.read) {
      markNotificationRead(notif._id);
      try { await api.put(`/notifications/${notif._id}/read`); } catch {}
    }
    if (notif.link) {
      setIsOpen(false);
      router.push(notif.link);
    }
  };

  const handleMarkAll = async () => {
    markAllNotificationsRead();
    try { await api.put('/notifications/mark-all-read'); } catch {}
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-idaz-black transition-all"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-rose-500 rounded-full flex items-center justify-center text-[10px] font-bold text-idaz-black border-2 border-zinc-950 px-1"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-3 w-96 glass-card border border-white/60 shadow-2xl rounded-3xl z-50 overflow-hidden origin-top-right"
            >
              {/* Header */}
              <div className="px-4 py-3 border-b border-white/40 flex justify-between items-center bg-idaz-gray">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-idaz-black">Thông báo</h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 bg-rose-500/20 text-rose-400 text-xs font-bold rounded-full">
                      {unreadCount} mới
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAll}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors"
                  >
                    <CheckCircle size={13} /> Đọc tất cả
                  </button>
                )}
              </div>

              {/* List */}
              <div className="max-h-[420px] overflow-y-auto custom-scrollbar divide-y divide-white/5">
                {notifications.length === 0 ? (
                  <div className="p-8 flex flex-col items-center gap-2 text-center">
                    <Bell size={32} className="text-gray-300" />
                    <p className="text-gray-500 text-sm">Chưa có thông báo nào</p>
                  </div>
                ) : notifications.map(notif => (
                  <div
                    key={notif._id}
                    onClick={() => handleMarkRead(notif)}
                    className={`px-4 py-3 cursor-pointer transition-colors hover:bg-white/5 flex gap-3 ${!notif.read ? 'bg-idaz-orange/5' : ''}`}
                  >
                    {/* Icon */}
                    <div className={`mt-0.5 w-8 h-8 rounded-2xl flex items-center justify-center shrink-0 ${!notif.read ? 'bg-idaz-orange/15' : 'bg-gray-100'}`}>
                      {NOTIF_ICONS[notif.type] || NOTIF_ICONS.default}
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-semibold text-idaz-black leading-tight">{notif.title}</h4>
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-idaz-orange shrink-0 mt-1.5 animate-pulse" />
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 leading-relaxed line-clamp-2">{notif.message}</p>
                      <span className="text-[10px] text-zinc-600 font-medium mt-1 flex items-center gap-1">
                        <Clock size={9} />
                        {new Date(notif.createdAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="p-3 border-t border-white/40 bg-idaz-gray">
                  <p className="text-center text-xs text-zinc-600">
                    {notifications.length} thông báo · {unreadCount} chưa đọc
                  </p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
