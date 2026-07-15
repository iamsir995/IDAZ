"use client";

import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import io from "socket.io-client";
import { useAuth } from "./AuthContext";
import toast from "react-hot-toast";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [socketInstance, setSocketInstance] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Listeners registry để các component subscribe events mà không cần socket riêng
  const listenersRef = useRef({});

  // Đăng ký lắng nghe event (dùng bởi các component con)
  const subscribe = useCallback((event, id, handler) => {
    if (!listenersRef.current[event]) listenersRef.current[event] = {};
    listenersRef.current[event][id] = handler;
    return () => {
      if (listenersRef.current[event]) delete listenersRef.current[event][id];
    };
  }, []);

  // Emit event qua socket trung tâm
  const emit = useCallback((event, data) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  // Join socket room
  const joinRoom = useCallback((room) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join_channel', room);
    }
  }, []);

  // Leave socket room
  const leaveRoom = useCallback((room) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave_channel', room);
    }
  }, []);

  // Thêm notification mới vào state
  const addNotification = useCallback((notif) => {
    setNotifications(prev => {
      if (prev.find(n => n._id === notif._id)) return prev;
      return [notif, ...prev];
    });
    setUnreadCount(c => c + 1);
  }, []);

  // Đánh dấu notification đã đọc
  const markNotificationRead = useCallback((id) => {
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    setUnreadCount(c => Math.max(0, c - 1));
  }, []);

  // Đánh dấu tất cả đã đọc
  const markAllNotificationsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  // Set notifications từ API fetch ban đầu
  const setInitialNotifications = useCallback((notifs) => {
    setNotifications(notifs);
    setUnreadCount(notifs.filter(n => !n.read).length);
  }, []);

  useEffect(() => {
    if (!user) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      // eslint-disable-next-line
      setIsConnected(false);
      // eslint-disable-next-line
      setOnlineUsers([]);
      return;
    }

    // Chỉ tạo 1 socket connection duy nhất cho toàn app
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000", {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;
    setSocketInstance(socket);

    socket.on("connect", () => {
      setIsConnected(true);
      // Join personal room để nhận thông báo riêng
      socket.emit("join_user", user._id || user.id);
      // Join global room
      socket.emit("join_room", "agency_global_room");
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("connect_error", (err) => {
      console.warn("Socket connection error:", err.message);
    });

    // ==========================================
    // ONLINE PRESENCE
    // ==========================================
    socket.on("online_users", (users) => {
      setOnlineUsers(users);
    });

    // ==========================================
    // NOTIFICATIONS (tập trung tại đây)
    // ==========================================
    socket.on("new_notification", (notif) => {
      addNotification(notif);
      // Hiển thị toast đẹp
      toast.custom((t) => (
        <div
          className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-sm w-full bg-zinc-900 border border-white/10 shadow-2xl rounded-2xl pointer-events-auto flex gap-3 p-4`}
          
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-lg shrink-0">
            {notif.type === 'invoice' ? '🧾' : notif.type === 'task' ? '✅' : notif.type === 'message' ? '💬' : '🔔'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">{notif.title}</p>
            <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2">{notif.message}</p>
          </div>
          <button onClick={() => toast.dismiss(t.id)} className="text-zinc-600 hover:text-zinc-400 shrink-0">✕</button>
        </div>
      ), { duration: 5000, position: 'top-right' });
    });

    // ==========================================
    // REALTIME EVENTS — lan phát cho subscribers
    // ==========================================
    const realtimeEvents = [
      'receive_message',
      'message_read_update',
      'user_typing',
      'user_stop_typing',
      'task_updated',        // Khi task thay đổi status
      'project_updated',     // Khi project cập nhật tiến độ
      'dashboard_refresh',   // Trigger reload dashboard
      'invoice_paid',        // Khi hóa đơn được thanh toán
      'ticket_replied',      // Khi ticket được trả lời
      'incoming_call',       // Video call
      'call_incoming',
      'call_accepted',
      'call_ended',
      'ice_candidate',
    ];

    realtimeEvents.forEach(event => {
      socket.on(event, (data) => {
        // Lan phát đến tất cả subscribers đã đăng ký
        if (listenersRef.current[event]) {
          Object.values(listenersRef.current[event]).forEach(handler => handler(data));
        }
      });
    });

    return () => {
      socket.disconnect();
      setIsConnected(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);  // Chỉ 1 lần khi user thay đổi

  const value = {
    socket: socketInstance,
    isConnected,
    onlineUsers,
    notifications,
    unreadCount,
    // Actions
    emit,
    joinRoom,
    leaveRoom,
    subscribe,
    addNotification,
    markNotificationRead,
    markAllNotificationsRead,
    setInitialNotifications,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
