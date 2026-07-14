"use client";

import { useState, useEffect, useRef, useId } from "react";
import api from "../../../services/api";
import { useAuth } from "../../../context/AuthContext";
import { useSocket } from "../../../context/SocketContext";
import { useTheme } from "../../../context/ThemeContext";
import { 
 Send, Search, Phone, Video, Info, Hash, Users, Paperclip, 
 Check, CheckCheck, X, Reply, Download, FileText, 
 Lock, Eye, ShieldAlert, PhoneIncoming, PhoneOutgoing, PhoneOff, 
 Play, ExternalLink, Calendar, Clock, Sparkles, ChevronRight, Pin, Image as ImageIcon,
 Edit, Trash2, Volume2, VolumeX
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import VideoCallModal from "../../../components/VideoCallModal";

export default function ClientChat() {
 const { user } = useAuth();
 const { socket, emit, subscribe, joinRoom, leaveRoom, isConnected } = useSocket();
 const { settings } = useTheme();
 const componentId = useId();
 
 const [channels, setChannels] = useState([]);
 const [activeChat, setActiveChat] = useState(null);
 const [messages, setMessages] = useState([]);
 const [newMessage, setNewMessage] = useState("");
 const [searchQuery, setSearchQuery] = useState("");
 const [loading, setLoading] = useState(true);
 const [messagesLoading, setMessagesLoading] = useState(false);
 
 const [attachments, setAttachments] = useState([]);
 const [replyToMsg, setReplyToMsg] = useState(null);
 const fileInputRef = useRef(null);

 const [typingUsers, setTypingUsers] = useState({});
 const [onlineUserIds, setOnlineUserIds] = useState([]);
 
 // Call History State
 const [callHistory, setCallHistory] = useState([]);
 const [activeTab, setActiveTab] = useState("chat"); // "chat" or "calls"
 
 // Custom personalization state: private messaging toggle
 const [sendPrivate, setSendPrivate] = useState(false);

 // Info pane state
 const [showInfoPane, setShowInfoPane] = useState(true);

 // Lightbox modal state
 const [activeImage, setActiveImage] = useState(null);

 // States for message search, edit & delete
 const [msgSearchQuery, setMsgSearchQuery] = useState("");
 const [searchMatches, setSearchMatches] = useState([]);
 const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);
 const [editingMsgId, setEditingMsgId] = useState(null);
 const [editingMsgText, setEditingMsgText] = useState("");

 const [incomingCall, setIncomingCall] = useState(null);
 const [callUser, setCallUser] = useState(null);

 // Mute notification audio state
 const [isMuted, setIsMuted] = useState(false);
 const [uploadingFiles, setUploadingFiles] = useState({});
 const [isDragging, setIsDragging] = useState(false);

 const playNotificationSound = () => {
 if (isMuted) return;
 try {
 const AudioContextClass = window.AudioContext || window.webkitAudioContext;
 const ctx = new AudioContextClass();
 const osc = ctx.createOscillator();
 const gain = ctx.createGain();
 
 osc.type = "sine";
 osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
 osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5
 
 gain.gain.setValueAtTime(0.08, ctx.currentTime);
 gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
 
 osc.connect(gain);
 gain.connect(ctx.destination);
 osc.start();
 osc.stop(ctx.currentTime + 0.25);
 
 setTimeout(() => {
 ctx.close();
 }, 300);
 } catch (e) {
 console.warn("Failed to play notification sound:", e);
 }
 };

 const activeChatRef = useRef(activeChat);
 const messagesEndRef = useRef(null);
 const scrollContainerRef = useRef(null);
 const typingTimeoutRef = useRef(null);

 // Pagination states
 const [page, setPage] = useState(1);
 const [hasMore, setHasMore] = useState(true);
 const [isLoadingMore, setIsLoadingMore] = useState(false);

 // E2EE states & helpers
 const [e2eeEnabled, setE2eeEnabled] = useState(false);

 const validateFile = (file) => {
 const maxSizeBytes = 25 * 1024 * 1024; // 25MB
 const blockedExtensions = ['.exe', '.bat', '.sh', '.cmd', '.msi', '.dmg', '.com', '.bin'];
 const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
 
 if (file.size > maxSizeBytes) {
 toast.error(`Tệp ${file.name} quá lớn! Giới hạn tối đa là 25MB.`);
 return false;
 }
 if (blockedExtensions.includes(ext)) {
 toast.error(`Định dạng tệp ${ext} không được hỗ trợ vì lý do bảo mật.`);
 return false;
 }
 return true;
 };

 const renderUserBadge = (role) => {
 const roleNormalized = (role || '').toLowerCase();
 if (['superadmin', 'admin'].includes(roleNormalized)) {
 return (
 <span className="ml-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-50 text-purple-600 border border-purple-100 uppercase tracking-wide">
 QTV
 </span>
 );
 } else if (roleNormalized === 'manager') {
 return (
 <span className="ml-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-600 border border-blue-100 uppercase tracking-wide">
 Quản lý
 </span>
 );
 } else if (roleNormalized === 'client') {
 return (
 <span className="ml-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase tracking-wide">
 Khách hàng
 </span>
 );
 } else if (['cskh', 'staff'].includes(roleNormalized)) {
 return (
 <span className="ml-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-cyan-50 text-cyan-600 border border-cyan-100 uppercase tracking-wide">
 CSKH
 </span>
 );
 } else {
  return (
  <span className="ml-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-cyan-50 text-cyan-600 border border-cyan-100 uppercase tracking-wide">
  Nhân viên
  </span>
  );
  }
 };

 const processUpload = async (files) => {
 const uploaded = [];
 for (const file of files) {
 const tempId = file.name + '-' + Date.now();
 setUploadingFiles(prev => ({ ...prev, [tempId]: { name: file.name, progress: 0 } }));
 
 const formData = new FormData();
 formData.append('file', file);

 try {
 const res = await api.post('/assets/upload-single', formData, {
 headers: { 'Content-Type': 'multipart/form-data' },
 onUploadProgress: (progressEvent) => {
 const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
 setUploadingFiles(prev => ({
 ...prev,
 [tempId]: { ...prev[tempId], progress: percentCompleted }
 }));
 }
 });
 if (res.data.success) {
 let fileType = 'other';
 if (file.type.startsWith('image/')) fileType = 'image';
 else if (file.type.startsWith('video/')) fileType = 'video';
 else if (file.type === 'application/pdf') fileType = 'document';

 uploaded.push({
 url: res.data.data.url,
 name: file.name,
 type: fileType,
 size: file.size
 });
 }
 } catch (err) {
 toast.error(`Lỗi khi tải file ${file.name} lên`);
 } finally {
 setUploadingFiles(prev => {
 const next = { ...prev };
 delete next[tempId];
 return next;
 });
 }
 }
 setAttachments(prev => [...prev, ...uploaded]);
 };

 const handleDragOver = (e) => {
 e.preventDefault();
 setIsDragging(true);
 };

 const handleDragLeave = (e) => {
 e.preventDefault();
 setIsDragging(false);
 };

 const handleDrop = async (e) => {
 e.preventDefault();
 setIsDragging(false);
 if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
 await processUpload(Array.from(e.dataTransfer.files));
 }
 };

 const encryptText = (plainText, secretKey = 'agency-secret') => {
 if (!plainText) return '';
 const key = secretKey;
 const textBytes = Array.from(plainText).map((c, i) => c.charCodeAt(0) ^ key.charCodeAt(i % key.length));
 const hex = textBytes.map(b => b.toString(16).padStart(2, '0')).join('');
 return `[E2EE-ENCRYPTED:${hex}]`;
 };

 const decryptText = (cipherText, secretKey = 'agency-secret') => {
 if (!cipherText) return '';
 if (!cipherText.startsWith('[E2EE-ENCRYPTED:') || !cipherText.endsWith(']')) {
 return cipherText;
 }
 try {
 const hex = cipherText.substring(16, cipherText.length - 1);
 const key = secretKey;
 const textBytes = [];
 for (let i = 0; i < hex.length; i += 2) {
 textBytes.push(parseInt(hex.substr(i, 2), 16));
 }
 const plain = textBytes.map((b, i) => String.fromCharCode(b ^ key.charCodeAt(i % key.length))).join('');
 return plain;
 } catch (e) {
 return '[Lỗi Giải Mã E2EE]';
 }
 };

 const fetchChannels = async () => {
 try {
 const res = await api.get('/channels');
 if (res.data.success) {
 setChannels(res.data.data);
 const supportCh = res.data.data.find(c => c.type === 'support');
 if (supportCh) {
 setActiveChat({ type: 'channel', id: supportCh._id, data: supportCh });
 } else if (res.data.data.length > 0) {
 setActiveChat({ type: 'channel', id: res.data.data[0]._id, data: res.data.data[0] });
 }
 }
 } catch (err) {
 toast.error("Không thể tải danh sách kênh");
 } finally {
 setLoading(false);
 }
 };

 const fetchCallHistory = async () => {
 try {
 const res = await api.get('/calls/history');
 if (res.data.success) {
 setCallHistory(res.data.data);
 }
 } catch (err) {
 console.error("Lỗi tải lịch sử cuộc gọi:", err);
 }
 };

 const handleCallBack = (call) => {
 const isIncoming = call.callerId?._id !== user?._id;
 const partner = isIncoming 
 ? call.callerId 
 : (call.participants?.find(p => p.user?._id !== user?._id)?.user || call.participants?.find(p => p.user !== user?._id)?.user);
 if (!partner) {
 toast.error("Không thể xác định đối phương để gọi lại.");
 return;
 }
 const partnerId = partner._id || partner;
 const partnerName = partner.name || "Nhân sự hỗ trợ";
 setCallUser({ id: partnerId, callerName: partnerName, type: call.type || 'video' });
 };

 const fetchChannelMessages = async (channelId, search = "", pageNum = 1, replace = true) => {
 if (replace) {
 setMessagesLoading(true);
 } else {
 setIsLoadingMore(true);
 }
 try {
 const url = `/chat/channels/${channelId}/messages?page=${pageNum}&limit=30` + (search ? `&search=${encodeURIComponent(search)}` : "");
 const res = await api.get(url);
 if (res.data.success) {
 const newMsgs = res.data.data;
 if (newMsgs.length < 30) setHasMore(false);

 const container = scrollContainerRef.current;
 const previousScrollHeight = container ? container.scrollHeight : 0;

 setMessages(prev => {
 return replace ? newMsgs : [...newMsgs, ...prev];
 });

 if (!replace && container) {
 setTimeout(() => {
 container.scrollTop = container.scrollHeight - previousScrollHeight;
 }, 10);
 }
 }
 } catch (err) {
 toast.error("Không thể tải tin nhắn");
 } finally {
 setMessagesLoading(false);
 setIsLoadingMore(false);
 }
 };

 const handleScroll = (e) => {
 const { scrollTop } = e.target;
 if (scrollTop === 0 && hasMore && !isLoadingMore && activeChat?.type === 'channel') {
 const nextPage = page + 1;
 setPage(nextPage);
 fetchChannelMessages(activeChat.id, msgSearchQuery, nextPage, false);
 }
 };

 useEffect(() => {
 activeChatRef.current = activeChat;
 }, [activeChat]);

 useEffect(() => {
 // eslint-disable-next-line react-hooks/set-state-in-effect
 fetchChannels();
 fetchCallHistory();
 }, []);

 // Listen to socket status updates and typing indicators
 useEffect(() => {
 const unsubs = [
 subscribe('receive_message', componentId, (msg) => {
 const currentChat = activeChatRef.current;
 setMessages(prev => {
 if (prev.find(m => m._id === msg._id)) return prev;
 if (currentChat?.type === 'channel' && msg.channelId === currentChat.id) return [...prev, msg];
 return prev;
 });
 const isFromOthers = msg.senderId?._id ? (msg.senderId._id !== user?._id) : (msg.senderId !== user?._id);
 if (isFromOthers) {
 playNotificationSound();
 }
 if (currentChat?.type === 'channel' && isFromOthers) {
 emit('message_read', { messageId: msg._id, channelId: msg.channelId, userId: user?._id });
 }
 }),
 subscribe('message_updated', componentId, (updatedMsg) => {
 setMessages(prev => prev.map(m => m._id === updatedMsg._id ? updatedMsg : m));
 }),
 subscribe('message_deleted', componentId, ({ messageId }) => {
 setMessages(prev => prev.filter(m => m._id !== messageId));
 }),
 subscribe('user_typing', componentId, ({ channelId, userName }) => {
 setTypingUsers(prev => ({ ...prev, [channelId]: userName }));
 }),
 subscribe('user_stop_typing', componentId, ({ channelId }) => {
 setTypingUsers(prev => { const n = { ...prev }; delete n[channelId]; return n; });
 }),
 subscribe('online_users', componentId, (users) => {
 setOnlineUserIds(users);
 }),
 subscribe('message_read_update', componentId, ({ messageId, userId }) => {
 setMessages(prev => prev.map(m =>
 m._id === messageId && !m.readBy?.find(r => r.user === userId)
 ? { ...m, readBy: [...(m.readBy || []), { user: userId, readAt: new Date() }] }
 : m
 ));
 }),
 subscribe('call_incoming', componentId, (data) => setIncomingCall(data)),
 subscribe('incoming_call', componentId, (data) => setIncomingCall(data)),
 subscribe('call_ended', componentId, () => {
 fetchCallHistory();
 })
 ];
 return () => unsubs.forEach(fn => fn && fn());
 }, [subscribe, emit, user, isMuted]);

 const handleStartCall = (type = 'video') => {
 if (!activeChat) return;
 if (activeChat.type === 'channel') {
 setCallUser({ id: activeChat.id, callerName: user?.name || "Khách hàng", type, isGroup: true });
 return;
 }
 const staffMember = activeChat.data.members?.find(m => m.role !== 'client');
 if (!staffMember) {
 toast.error("Không tìm thấy nhân sự quản trị trong nhóm để kết nối.");
 return;
 }
 setCallUser({ id: staffMember._id, callerName: staffMember.name, type });
 };

 useEffect(() => {
 if (activeChat) {
 if (activeChat.type === 'channel') {
 joinRoom(activeChat.id);
 }
 }
 return () => {
 if (activeChat && activeChat.type === 'channel') {
 leaveRoom(activeChat.id);
 }
 };
 }, [activeChat]);

 useEffect(() => {
 if (!activeChat || activeChat.type !== 'channel') return;
 
 const delayDebounceFn = setTimeout(() => {
 setPage(1);
 setHasMore(true);
 fetchChannelMessages(activeChat.id, msgSearchQuery, 1, true);
 }, msgSearchQuery ? 400 : 0);

 return () => clearTimeout(delayDebounceFn);
 }, [activeChat, msgSearchQuery]);

 useEffect(() => {
 if (page === 1) {
 messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
 }
 }, [messages, typingUsers, page]);

 const scrollToMessage = (msgId) => {
 const element = document.getElementById(`msg-${msgId}`);
 if (element) {
 element.scrollIntoView({ behavior: 'smooth', block: 'center' });
 element.classList.add('ring-4', 'ring-yellow-400/30', 'bg-yellow-100/10', 'transition-all', 'duration-500');
 setTimeout(() => {
 element.classList.remove('ring-4', 'ring-yellow-400/30', 'bg-yellow-100/10');
 }, 2500);
 }
 };

 useEffect(() => {
 if (!msgSearchQuery) {
 // eslint-disable-next-line react-hooks/set-state-in-effect
 setSearchMatches([]);
 // eslint-disable-next-line react-hooks/set-state-in-effect
 setCurrentMatchIndex(-1);
 return;
 }
 const query = msgSearchQuery.toLowerCase();
 const matches = [];
 messages.forEach((m, idx) => {
 const decrypted = decryptText(m.text || "");
 if (decrypted && decrypted.toLowerCase().includes(query)) {
 matches.push({ id: m._id, index: idx });
 }
 });
 // eslint-disable-next-line react-hooks/set-state-in-effect
 setSearchMatches(matches);
 if (matches.length > 0) {
 // eslint-disable-next-line react-hooks/set-state-in-effect
 setCurrentMatchIndex(0);
 scrollToMessage(matches[0].id);
 } else {
 // eslint-disable-next-line react-hooks/set-state-in-effect
 setCurrentMatchIndex(-1);
 }
 }, [msgSearchQuery, messages]);

 const handleNextMatch = () => {
 if (searchMatches.length === 0) return;
 const nextIdx = (currentMatchIndex + 1) % searchMatches.length;
 setCurrentMatchIndex(nextIdx);
 scrollToMessage(searchMatches[nextIdx].id);
 };

 const handlePrevMatch = () => {
 if (searchMatches.length === 0) return;
 const prevIdx = (currentMatchIndex - 1 + searchMatches.length) % searchMatches.length;
 setCurrentMatchIndex(prevIdx);
 scrollToMessage(searchMatches[prevIdx].id);
 };

 // Auto mark loaded messages as read (Step 15)
 useEffect(() => {
 if (activeChat && messages.length > 0 && socket) {
 messages.forEach(m => {
 const isFromMe = m.senderId?._id === user?._id || m.senderId === user?._id;
 const isReadByMe = m.readBy?.some(r => r.user === user?._id || r.user?._id === user?._id);
 if (!isFromMe && !isReadByMe) {
 socket.emit('message_read', { messageId: m._id, channelId: activeChat.id, userId: user?._id });
 }
 });
 }
 }, [messages, activeChat, socket, user]);

 const renderHighlightedText = (text, query) => {
 if (!query) return text;
 const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
 const parts = text.split(new RegExp(`(${escapQuery})`, 'gi'));
 return parts.map((part, idx) => 
 part.toLowerCase() === query.toLowerCase() 
 ? <mark key={idx} className="bg-yellow-300 text-black px-0.5 rounded font-bold">{part}</mark> 
 : part
 );
 };



 const handleEditMessage = async (msgId) => {
 if (!editingMsgText.trim()) return;
 try {
 const textToSave = e2eeEnabled ? encryptText(editingMsgText) : editingMsgText;
 const res = await api.put(`/chat/messages/${msgId}`, { text: textToSave });
 if (res.data.success) {
 setMessages(prev => prev.map(m => m._id === msgId ? res.data.data : m));
 setEditingMsgId(null);
 setEditingMsgText("");
 toast.success("Đã chỉnh sửa tin nhắn!");
 }
 } catch (err) {
 toast.error(err.response?.data?.message || "Lỗi khi sửa tin nhắn");
 }
 };

 const handleDeleteMessage = async (msgId) => {
 if (!confirm("Bạn có chắc muốn xóa tin nhắn này?")) return;
 try {
 const res = await api.delete(`/chat/messages/${msgId}`);
 if (res.data.success) {
 setMessages(prev => prev.filter(m => m._id !== msgId));
 toast.success("Đã xóa tin nhắn!");
 }
 } catch (err) {
 toast.error(err.response?.data?.message || "Lỗi khi xóa tin nhắn");
 }
 };

 const isMessageEditable = (msg) => {
 // eslint-disable-next-line react-hooks/purity
 const diffMs = Date.now() - new Date(msg.createdAt).getTime();
 return diffMs < 5 * 60 * 1000;
 };

 const handleTogglePin = async (msgId) => {
 try {
 const res = await api.put(`/chat/messages/${msgId}/pin`);
 if (res.data.success) {
 setMessages(prev => prev.map(m => m._id === msgId ? res.data.data : m));
 toast.success(res.data.data.isPinned ? "Đã ghim tin nhắn!" : "Đã bỏ ghim tin nhắn!");
 }
 } catch (err) {
 toast.error("Lỗi khi ghim tin nhắn");
 }
 };

 const handleSendReaction = async (msgId, emoji) => {
 try {
 const res = await api.put(`/chat/messages/${msgId}/react`, { emoji });
 if (res.data.success) {
 setMessages(prev => prev.map(m => m._id === msgId ? res.data.data : m));
 }
 } catch (err) {
 toast.error("Lỗi khi thả cảm xúc");
 }
 };

 const pinnedMessages = messages.filter(m => m.isPinned);

 const handleFileUpload = async (e) => {
 const rawFiles = Array.from(e.target.files);
 if (!rawFiles.length) return;
 const files = rawFiles.filter(validateFile);
 if (!files.length) return;
 await processUpload(files);
 };


 const handleSend = async (e) => {
 e.preventDefault();
 if (!newMessage.trim() && !attachments.length) return;

 let targetAdminId = null;
 if (sendPrivate && activeChat?.data?.members) {
 const targetAdmin = activeChat.data.members.find(m => m.role !== 'client');
 if (targetAdmin) {
 targetAdminId = targetAdmin._id;
 } else {
 toast.error("Kênh này chưa có Admin hỗ trợ nhận tin nhắn riêng.");
 return;
 }
 }

 try {
 const textToSend = e2eeEnabled ? encryptText(newMessage) : newMessage;
 const res = await api.post('/chat/messages', {
 channelId: activeChat.id,
 text: textToSend,
 attachments: attachments,
 replyTo: replyToMsg?._id || null,
 private: sendPrivate,
 recipientId: targetAdminId
 });

 if (res.data.success) {
 setNewMessage("");
 setAttachments([]);
 setReplyToMsg(null);
 setSendPrivate(false);
 }
 } catch (err) {
 toast.error("Lỗi gửi tin nhắn");
 }
 };

 const handleTyping = (e) => {
 setNewMessage(e.target.value);
 if (!socket || !activeChat) return;

 socket.emit('typing', { channelId: activeChat.id, userName: user.name });
 
 if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
 typingTimeoutRef.current = setTimeout(() => {
 socket.emit('stop_typing', { channelId: activeChat.id, userName: user.name });
 }, 2000);
 };

 const isStaffOnline = (members) => {
 if (!members) return false;
 return members.some(m => m.role !== 'client' && onlineUserIds.includes(m._id));
 };

 const getSharedAssets = () => {
 return messages
 .filter(m => m.attachments && m.attachments.length > 0)
 .flatMap(m => m.attachments);
 };

 return (
 <div className="h-[calc(100vh-100px)] flex bg-white/70 backdrop-blur-md rounded-3xl overflow-hidden border border-white/40/80 shadow-lg font-sans text-gray-700">
 {/* Sidebar Trái */}
 <div className="w-80 border-r border-white/40 flex flex-col bg-idaz-gray/50 backdrop-blur-sm shrink-0">
 {/* Navigation Tabs */}
 <div className="p-4 border-b border-white/40 flex gap-2">
 <button 
 onClick={() => setActiveTab("chat")}
 style={{ backgroundColor: activeTab === 'chat' ? (settings.primaryColor || '#4f46e5') : '' }}
 className={`flex-1 py-2.5 px-3 text-xs font-bold rounded-3xl transition-all ${
 activeTab === 'chat' 
 ? 'text-white shadow-md shadow-indigo-600/10' 
 : 'glass-panel hover:bg-gray-100 text-gray-600 border border-white/40'
 }`}
 >
 Trò chuyện
 </button>
 <button 
 onClick={() => setActiveTab("calls")}
 style={{ backgroundColor: activeTab === 'calls' ? (settings.primaryColor || '#4f46e5') : '' }}
 className={`flex-1 py-2.5 px-3 text-xs font-bold rounded-3xl transition-all ${
 activeTab === 'calls' 
 ? 'text-white shadow-md shadow-indigo-600/10' 
 : 'glass-panel hover:bg-gray-100 text-gray-600 border border-white/40'
 }`}
 >
 Cuộc gọi
 </button>
 </div>

 {activeTab === 'chat' ? (
 <>
 <div className="p-4 border-b border-white/40">
 <div className="relative">
 <Search size={16} className="absolute left-3.5 top-3 text-gray-400" />
 <input 
 type="text"
 placeholder="Tìm kiếm dự án..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="w-full pl-10 pr-4 py-2 glass-panel border border-white/60 rounded-3xl text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
 />
 </div>
 </div>

 {/* Danh sách Channel (Với Skeleton Loader) */}
 <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
 {loading ? (
 // Channel list skeleton loaders
 <div className="space-y-3 p-2">
 {[1, 2, 3].map(n => (
 <div key={n} className="flex items-center gap-3 animate-pulse">
 <div className="w-10 h-10 bg-gray-200 rounded-3xl" />
 <div className="flex-1 space-y-2">
 <div className="h-3 bg-gray-200 rounded w-3/4" />
 <div className="h-2.5 bg-gray-200 rounded w-1/2" />
 </div>
 </div>
 ))}
 </div>
 ) : (
 <>
 <div className="mb-4">
 <h4 className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Hỗ trợ khẩn cấp</h4>
 {channels
 .filter(c => c.type === 'support')
 .map(c => (
 <button
 key={c._id}
 onClick={() => setActiveChat({ type: 'channel', id: c._id, data: c })}
 className={`w-full flex items-center gap-3 p-3 rounded-3xl transition-all ${
 activeChat?.id === c._id ? 'bg-idaz-orange-light/80 text-indigo-950 font-semibold' : 'hover:bg-gray-100 text-gray-600'
 }`}
 >
 <div className="w-10 h-10 rounded-3xl bg-gradient-to-tr from-emerald-400 to-teal-500 flex items-center justify-center text-white shrink-0 relative shadow-sm">
 <Users size={16} />
 {isStaffOnline(c.members) && (
 <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full animate-ping" />
 )}
 {isStaffOnline(c.members) && (
 <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
 )}
 </div>
 <div className="text-left flex-1 min-w-0">
 <div className="text-xs truncate">{c.name}</div>
 <div className="text-[10px] text-gray-400 truncate">Hỗ trợ khách hàng</div>
 </div>
 </button>
 ))}
 </div>

 <div>
 <h4 className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Dự án của bạn</h4>
 {channels
 .filter(c => c.type !== 'support' && (!searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase())))
 .map(c => (
 <button
 key={c._id}
 onClick={() => setActiveChat({ type: 'channel', id: c._id, data: c })}
 className={`w-full flex items-center gap-3 p-3 rounded-3xl transition-all ${
 activeChat?.id === c._id ? 'bg-idaz-orange-light/80 text-indigo-950 font-semibold' : 'hover:bg-gray-100 text-gray-600'
 }`}
 >
 <div className="w-10 h-10 rounded-3xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white shrink-0 relative shadow-sm">
 <Hash size={16} />
 {isStaffOnline(c.members) && (
 <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full animate-ping" />
 )}
 {isStaffOnline(c.members) && (
 <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
 )}
 </div>
 <div className="text-left flex-1 min-w-0">
 <div className="text-xs truncate">{c.name}</div>
 <div className="text-[10px] text-gray-400 truncate">Nhóm dự án</div>
 </div>
 </button>
 ))}
 </div>
 </>
 )}
 </div>
 </>
 ) : (
 /* Cuộc gọi History Tab */
 <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
 <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Nhật ký cuộc gọi</h4>
 {callHistory.length === 0 ? (
 <div className="text-center py-8 text-gray-400 text-sm">Chưa có cuộc gọi nào.</div>
 ) : (
 callHistory.map(call => {
 const isIncoming = call.callerId?._id !== user?._id;
 const formattedDate = new Date(call.startTime).toLocaleDateString('vi-VN', {
 month: 'short', day: 'numeric'
 });
 const formattedTime = new Date(call.startTime).toLocaleTimeString('vi-VN', {
 hour: '2-digit', minute: '2-digit'
 });
 
 return (
 <div key={call._id} className="p-3 glass-panel border border-white/40 rounded-3xl flex items-center justify-between shadow-sm">
 <div className="flex items-center gap-3">
 <div className={`w-9 h-9 rounded-3xl flex items-center justify-center shrink-0 ${
 call.status === 'missed' 
 ? 'bg-rose-50 text-rose-500' 
 : 'bg-emerald-50 text-emerald-500'
 }`}>
 {isIncoming ? <PhoneIncoming size={16} /> : <PhoneOutgoing size={16} />}
 </div>
 <div>
 <div className="font-semibold text-xs">
 {isIncoming ? call.callerId?.name : (call.participants?.find(p => p.user !== user?._id)?.name || 'Hỗ trợ CSKH')}
 </div>
 <div className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
 <Calendar size={10} /> <span>{formattedDate} lúc {formattedTime}</span>
 </div>
 </div>
 </div>
 <div className="flex items-center gap-3">
 <div className="text-right">
 <div className={`text-xs font-bold ${
 call.status === 'missed' ? 'text-rose-500' : 'text-gray-500'
 }`}>
 {call.status === 'missed' ? 'Bỏ lỡ' : `${Math.floor(call.duration / 60)}p ${call.duration % 60}s`}
 </div>
 <div className="text-[9px] text-gray-400 capitalize mt-0.5">{call.type} call</div>
 </div>
 <button 
 onClick={() => handleCallBack(call)}
 style={{ backgroundColor: settings.primaryColor || '#4f46e5' }}
 className="p-2 text-white rounded-3xl hover:opacity-90 transition-opacity flex items-center justify-center shadow-md shadow-indigo-600/10"
 title="Gọi lại"
 >
 {call.type === 'video' ? <Video size={13} /> : <Phone size={13} />}
 </button>
 </div>
 </div>
 );
 })
 )}
 </div>
 )}
 </div>

 {/* Vùng Chat Chính */}
 {activeChat ? (
 <div className="flex-1 flex glass-panel overflow-hidden">
 <div className="flex-1 flex flex-col min-w-0 relative" onDragOver={handleDragOver}>
 {isDragging && (
 <div 
 onDragOver={(e) => e.preventDefault()}
 onDragLeave={() => setIsDragging(false)}
 onDrop={handleDrop}
 className="absolute inset-0 bg-idaz-black/60 backdrop-blur-md z-50 flex flex-col items-center justify-center border-4 border-dashed border-indigo-500/50 m-4 rounded-3xl transition-all duration-300"
 >
 <div className="bg-idaz-orange/20 p-6 rounded-full border border-indigo-500/30 text-indigo-400 mb-4 animate-bounce">
 <Paperclip size={40} />
 </div>
 <h3 className="text-xl font-bold text-white mb-2">Thả tệp tin tại đây</h3>
 <p className="text-sm text-slate-300">Tải lên tài liệu hoặc hình ảnh bảo mật (Tối đa 25MB)</p>
 </div>
 )}
 {/* Header */}
 <div className="h-16 px-6 border-b border-white/40 flex items-center justify-between shrink-0 bg-idaz-gray/50 backdrop-blur-md">
 <div className="flex items-center gap-3">
 <div 
 style={{ backgroundColor: settings.primaryColor || '#4f46e5' }}
 className="w-10 h-10 rounded-3xl text-white flex items-center justify-center font-bold"
 >
 {activeChat.data.name.charAt(0).toUpperCase()}
 </div>
 <div>
 <div className="font-bold text-idaz-black text-sm flex items-center gap-1.5">
 {activeChat.data.name}
 {activeChat.data.type === 'support' && (
 <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-100">CSKH</span>
 )}
 </div>
 <div className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
 <span className={`w-2 h-2 rounded-full ${isStaffOnline(activeChat.data.members) ? 'bg-emerald-500' : 'bg-slate-300'}`} />
 {isStaffOnline(activeChat.data.members) ? 'Hỗ trợ trực tuyến' : 'Ngoại tuyến'}
 </div>
 </div>
 </div>

 <div className="flex items-center gap-2">
 {/* E2EE Toggle Button */}
 <button
 onClick={() => setE2eeEnabled(!e2eeEnabled)}
 className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
 e2eeEnabled
 ? 'bg-rose-50 text-rose-600 border-rose-200 shadow-sm animate-pulse'
 : 'bg-idaz-gray text-gray-500 border-white/60 hover:bg-gray-100'
 }`}
 title={e2eeEnabled ? "Tắt mã hóa đầu cuối" : "Bật mã hóa đầu cuối"}
 >
 <Lock size={14} className={e2eeEnabled ? "text-rose-500 animate-bounce" : "text-gray-400"} />
 <span>{e2eeEnabled ? "E2EE Mở" : "Mã hóa"}</span>
 </button>

 {/* Thanh tìm kiếm tin nhắn */}
 <div className="relative flex items-center mr-1 gap-1.5">
 <div className="relative flex items-center">
 <input
 type="text"
 placeholder="Tìm tin nhắn..."
 value={msgSearchQuery}
 onChange={(e) => setMsgSearchQuery(e.target.value)}
 className="pl-8 pr-7 py-1.5 bg-gray-100 hover:bg-gray-200/60 focus:glass-panel text-xs border border-transparent focus:border-white/60 rounded-3xl w-32 focus:w-48 transition-all duration-300 focus:outline-none"
 />
 <Search size={12} className="absolute left-2.5 text-gray-400 pointer-events-none" />
 {msgSearchQuery && (
 <button 
 onClick={() => setMsgSearchQuery("")}
 className="absolute right-2 text-gray-400 hover:text-gray-600 p-0.5"
 >
 <X size={10} />
 </button>
 )}
 </div>
 {searchMatches.length > 0 && (
 <div className="flex items-center gap-1.5 bg-gray-100/80 px-2 py-1 rounded-3xl text-[10px] text-gray-500 font-semibold border border-white/60/40">
 <span>{currentMatchIndex + 1}/{searchMatches.length}</span>
 <button onClick={handlePrevMatch} className="hover:text-idaz-orange font-bold px-0.5 text-[11px] transition-colors" title="Trận trước">↑</button>
 <button onClick={handleNextMatch} className="hover:text-idaz-orange font-bold px-0.5 text-[11px] transition-colors" title="Trận sau">↓</button>
 </div>
 )}
 </div>

 <button 
 onClick={() => {
 setIsMuted(!isMuted);
 toast.success(!isMuted ? "Đã tắt âm thanh thông báo" : "Đã bật âm thanh thông báo");
 }} 
 className={`p-2 rounded-3xl transition-all ${isMuted ? 'text-rose-500 bg-rose-50' : 'text-gray-500 hover:bg-gray-100'}`}
 title={isMuted ? "Bật âm thanh" : "Tắt âm thanh thông báo"}
 >
 {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
 </button>

 <button 
 onClick={() => handleStartCall('audio')} 
 className="p-2 text-gray-500 hover:text-idaz-orange hover:bg-gray-100 rounded-3xl transition-all"
 title="Cuộc gọi âm thanh"
 >
 <Phone size={16} />
 </button>
 <button 
 onClick={() => handleStartCall('video')} 
 className="p-2 text-gray-500 hover:text-idaz-orange hover:bg-gray-100 rounded-3xl transition-all"
 title="Cuộc gọi video"
 >
 <Video size={16} />
 </button>
 <button 
 onClick={() => setShowInfoPane(!showInfoPane)} 
 className={`p-2 rounded-3xl transition-all ${
 showInfoPane ? 'text-idaz-orange bg-idaz-orange-light' : 'text-gray-500 hover:bg-gray-100'
 }`}
 title="Thông tin nhóm"
 >
 <Info size={16} />
 </button>
 </div>
 </div>

 {/* Thanh Tin nhắn đã ghim (Pinned Messages Header Banner) */}
 {pinnedMessages.length > 0 && (
 <div className="bg-amber-50/70 border-b border-amber-100/60 px-6 py-2.5 flex items-center justify-between z-10 text-xs text-amber-900 shrink-0">
 <div className="flex items-center gap-2 truncate">
 <Pin size={12} className="text-amber-600 rotate-45 shrink-0 animate-pulse" />
 <span className="font-semibold shrink-0">Tin nhắn đã ghim ({pinnedMessages.length}):</span>
 <span className="truncate text-amber-800 italic">
 {"\"" + (pinnedMessages[pinnedMessages.length - 1].text || "Tài liệu đính kèm") + "\""}
 </span>
 </div>
 <div className="flex items-center gap-3">
 <button 
 onClick={() => {
 const msgId = pinnedMessages[pinnedMessages.length - 1]._id;
 const element = document.getElementById(`msg-${msgId}`);
 if (element) {
 element.scrollIntoView({ behavior: 'smooth', block: 'center' });
 element.classList.add('bg-amber-100/40');
 setTimeout(() => element.classList.remove('bg-amber-100/40'), 2000);
 } else {
 toast.error("Tin nhắn đã ghim ở quá xa hoặc chưa tải hết.");
 }
 }}
 className="text-amber-700 hover:text-amber-900 font-bold hover:underline transition-all"
 >
 Xem chi tiết
 </button>
 <button 
 onClick={() => handleTogglePin(pinnedMessages[pinnedMessages.length - 1]._id)}
 className="text-amber-500 hover:text-amber-700 p-0.5 rounded-full hover:bg-amber-100/60"
 title="Bỏ ghim"
 >
 <X size={12} />
 </button>
 </div>
 </div>
 )}

 {/* Vùng Tin nhắn */}
 <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-idaz-gray/20 custom-scrollbar" ref={scrollContainerRef} onScroll={handleScroll}>
 {isLoadingMore && (
 <div className="flex justify-center py-2">
 <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
 </div>
 )}
 {messagesLoading ? (
 // Message list skeleton loaders
 <div className="space-y-4">
 {[1, 2, 3].map(n => (
 <div key={n} className={`flex gap-3 ${n % 2 === 0 ? 'flex-row-reverse' : ''}`}>
 <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
 <div className="space-y-1.5 max-w-[60%]">
 <div className="h-8 bg-gray-200 rounded-3xl w-64 animate-pulse" />
 <div className="h-2 bg-gray-200 rounded w-12 animate-pulse" />
 </div>
 </div>
 ))}
 </div>
 ) : messages.length === 0 ? (
 <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
 <Sparkles size={32} className="opacity-30 text-indigo-500 animate-pulse" />
 <p className="text-xs">Bắt đầu cuộc thảo luận trong nhóm này.</p>
 </div>
 ) : (
 <div className="space-y-4">
 {messages.map((msg, idx) => {
 const isMe = msg.senderId?._id === user?._id || msg.senderId === user?._id;
 const formattedTime = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
 
 return (
 <motion.div 
 key={msg._id || idx}
 id={`msg-${msg._id}`}
 initial={{ opacity: 0, y: 12 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.25 }}
 className={`flex items-end gap-2.5 max-w-[85%] ${isMe ? 'flex-row-reverse ml-auto' : 'mr-auto'}`}
 >
 {/* Avatar with online status */}
 <div className="relative shrink-0 mb-1">
 <div className="w-8 h-8 rounded-full overflow-hidden border border-white/40 shadow-sm bg-gray-100">
 <img 
 src={isMe ? (user?.avatar || 'https://api.dicebear.com/7.x/adventurer/svg?seed=me') : (msg.senderId?.avatar || msg.senderAvatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${msg.senderName || 'user'}`)} 
 alt={msg.senderName} 
 className="w-full h-full object-cover"
 />
 </div>
 {!isMe && onlineUserIds.includes(msg.senderId?._id || msg.senderId) && (
 <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-white" />
 )}
 </div>

 <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
 {!isMe && (
 <span className="text-[10px] font-bold text-gray-500 mb-1 ml-1 flex items-center">
 {msg.senderId?.name || msg.senderName}
 {renderUserBadge(msg.senderRole || msg.senderId?.role)}
 </span>
 )}
 
 <div className={`max-w-[450px] rounded-3xl px-4 py-2.5 shadow-sm text-xs relative group transition-all ${
 isMe 
 ? 'text-white rounded-br-none bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-md shadow-indigo-600/10' 
 : msg.private 
 ? 'bg-rose-50 border border-rose-100 text-rose-950 rounded-bl-none'
 : 'glass-panel border border-white/40 text-gray-700 rounded-bl-none'
 }`}
 style={{ backgroundColor: (isMe && settings.primaryColor && settings.primaryColor !== '#4f46e5') ? settings.primaryColor : undefined }}
 >
 {msg.private && (
 <div className="flex items-center gap-1 text-[9px] text-rose-500 font-bold mb-1.5">
 <Lock size={10} /> Tin nhắn riêng tư (Chỉ QTV thấy)
 </div>
 )}

 {msg.replyTo && (
 <div className={`text-[10px] mb-2 p-2 rounded-xl border-l-2 bg-black/5 ${
 isMe ? 'border-indigo-300 text-indigo-100' : 'border-gray-300 text-gray-500'
 }`}>
 <div className="font-bold">{msg.replyTo.senderName}</div>
 <div className="truncate">{decryptText(msg.replyTo.text)}</div>
 </div>
 )}

 {editingMsgId === msg._id ? (
 <div className="space-y-2 py-1 min-w-[200px]">
 <textarea
 value={editingMsgText}
 onChange={(e) => setEditingMsgText(e.target.value)}
 className="w-full bg-idaz-black/10 border border-slate-900/20 rounded-3xl p-2 text-xs focus:outline-none focus:border-indigo-500 resize-none h-16"
 style={{ color: isMe ? 'white' : 'inherit' }}
 />
 <div className="flex gap-1.5 justify-end">
 <button
 onClick={() => {
 setEditingMsgId(null);
 setEditingMsgText("");
 }}
 className="px-2.5 py-1 text-[10px] bg-idaz-gray0/10 hover:bg-idaz-gray0/20 rounded-xl transition-colors"
 >
 Hủy
 </button>
 <button
 onClick={() => handleEditMessage(msg._id)}
 className="px-2.5 py-1 text-[10px] bg-idaz-orange hover:bg-idaz-orange-dark text-white font-bold rounded-xl transition-colors"
 >
 Lưu
 </button>
 </div>
 </div>
 ) : (
 <p className="leading-relaxed whitespace-pre-wrap break-all">{renderHighlightedText(decryptText(msg.text), msgSearchQuery)}</p>
 )}

 {/* Reactions List */}
 {msg.reactions && msg.reactions.length > 0 && (
 <div className="flex flex-wrap gap-1 mt-1.5">
 {Object.entries(
 msg.reactions.reduce((acc, r) => {
 acc[r.emoji] = acc[r.emoji] || [];
 acc[r.emoji].push(r.userName);
 return acc;
 }, {})
 ).map(([emoji, users]) => {
 const hasReacted = msg.reactions.some(r => r.user === user?._id && r.emoji === emoji);
 return (
 <button
 key={emoji}
 onClick={() => handleSendReaction(msg._id, emoji)}
 title={users.join(', ')}
 className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[10px] transition-all hover:scale-105 ${
 hasReacted 
 ? isMe 
 ? 'bg-idaz-orange/20 border-indigo-400 text-white' 
 : 'bg-idaz-orange-light border-orange-100 text-idaz-orange-dark'
 : isMe 
 ? 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10'
 : 'bg-idaz-gray border-white/40 text-gray-500 hover:bg-gray-100'
 }`}
 >
 <span>{emoji}</span>
 <span className="font-bold">{users.length}</span>
 </button>
 );
 })}
 </div>
 )}

 {/* Message Actions */}
 {!msg.systemMessage && (
 <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 p-1.5 rounded-3xl z-20 shadow-lg border border-white/5">
 {/* Quick Emoji Reactions */}
 <div className="flex items-center border-r border-white/10 pr-2 mr-2 gap-1.5 bg-zinc-900/90 rounded-full px-2 py-0.5 border border-white/5">
 {['👍', '❤️', '😂', '😮', '😢', '🔥', '🎉', '👏', '✅', '❌'].map(emoji => (
 <button 
 key={emoji}
 onClick={() => handleSendReaction(msg._id, emoji)}
 className="hover:scale-135 hover:rotate-3 transition-all p-1 text-[16px] leading-none select-none active:scale-95"
 title={emoji}
 >
 {emoji}
 </button>
 ))}
 </div>

 {isMe && isMessageEditable(msg) && (
 <button 
 onClick={() => {
 setEditingMsgId(msg._id);
 setEditingMsgText(decryptText(msg.text));
 }}
 className="p-0.5 text-zinc-300 hover:text-indigo-300 transition-colors animate-fade-in"
 title="Sửa tin nhắn"
 >
 <Edit size={10} />
 </button>
 )}
 <button 
 onClick={() => setReplyToMsg({ _id: msg._id, senderName: msg.senderId?.name || msg.senderName || "Người dùng", text: decryptText(msg.text) })}
 className="p-0.5 text-zinc-300 hover:text-indigo-300 transition-colors"
 title="Trả lời tin nhắn"
 >
 <Reply size={10} />
 </button>
 <button 
 onClick={() => handleTogglePin(msg._id)}
 className={`p-0.5 transition-colors ${msg.isPinned ? 'text-amber-400 hover:text-amber-300' : 'text-zinc-300 hover:text-amber-200'}`}
 title={msg.isPinned ? "Bỏ ghim tin nhắn" : "Ghim tin nhắn"}
 >
 <Pin size={10} className={msg.isPinned ? 'rotate-45' : ''} />
 </button>
 {isMe && (
 <button 
 onClick={() => handleDeleteMessage(msg._id)}
 className="p-0.5 text-zinc-300 hover:text-rose-400 transition-colors"
 title="Xóa tin nhắn"
 >
 <Trash2 size={10} />
 </button>
 )}
 </div>
 )}
 
 {/* File Attachments Previews */}
 {msg.attachments && msg.attachments.length > 0 && (
 <div className="mt-2.5 space-y-2">
 {msg.attachments.map((file, fIdx) => (
 <div key={fIdx} className="rounded-3xl overflow-hidden border border-black/5 bg-black/5 p-2">
 {file.type === 'image' ? (
 <div className="relative group/img cursor-zoom-in" onClick={() => setActiveImage(file.url)}>
 <img src={file.url} alt={file.name} className="max-h-60 rounded-xl object-contain w-full bg-idaz-black" />
 <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center gap-2 transition-all rounded-xl text-white">
 <Eye size={16} /> Xem ảnh
 </div>
 </div>
 ) : file.type === 'video' ? (
 <div className="relative">
 <video src={file.url} controls className="max-h-60 rounded-xl w-full bg-idaz-black" />
 </div>
 ) : (
 <div className="flex items-center justify-between gap-3 p-1">
 <div className="flex items-center gap-2 min-w-0">
 <FileText size={16} className="text-indigo-400 shrink-0" />
 <span className="truncate font-semibold text-[11px]">{file.name}</span>
 </div>
 <a 
 href={file.url} 
 download
 target="_blank"
 className="p-1.5 bg-idaz-orange hover:bg-idaz-orange text-white rounded-xl transition-all"
 title="Tải về"
 >
 <Download size={12} />
 </a>
 </div>
 )}
 </div>
 ))}
 </div>
 )}

 <div className={`flex items-center justify-end gap-1 mt-1 text-[9px] ${isMe ? 'text-indigo-200' : 'text-gray-400'}`}>
 <span>{formattedTime}</span>
 {isMe && (
 <div 
 className="cursor-help"
 title={
 msg.readBy && msg.readBy.length > 0 
 ? `Đã đọc bởi:\n${msg.readBy.map(r => `• ${r.user?.name || 'Bạn'} (${r.user?.role === 'admin' ? 'QTV' : 'Nhân viên'})`).join('\n')}`
 : "Chưa có ai đọc"
 }
 >
 {msg.readBy && msg.readBy.some(r => r.user !== user?._id && r.user?._id !== user?._id) ? (
 <CheckCheck size={10} className="text-blue-400 font-bold" />
 ) : (
 <Check size={10} className="text-slate-300" />
 )}
 </div>
 )}
 </div>
 </div>
 </div>
 </motion.div>
 );
 })}
 </div>
 )}

 {typingUsers[activeChat.id] && (
 <div className="flex items-start">
 <div className="glass-panel border border-white/40 rounded-3xl rounded-bl-none px-4 py-2.5 flex gap-1 items-center shadow-sm">
 <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0ms]" />
 <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:150ms]" />
 <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:300ms]" />
 <span className="text-[10px] text-gray-400 ml-1 font-semibold">{typingUsers[activeChat.id]} đang nhập...</span>
 </div>
 </div>
 )}
 <div ref={messagesEndRef} />
 </div>

 {attachments.length > 0 && (
 <div className="px-6 py-3 bg-idaz-gray border-t border-white/40 flex flex-wrap gap-2">
 {attachments.map((file, idx) => (
 <div key={idx} className="flex items-center gap-2 glass-panel px-3 py-1.5 rounded-3xl border border-white/60 text-xs shadow-sm">
 <FileText size={12} className="text-indigo-500" />
 <span className="max-w-[120px] truncate font-medium">{file.name}</span>
 <button onClick={() => setAttachments(p => p.filter((_, i) => i !== idx))} className="text-rose-500 hover:bg-rose-50 p-0.5 rounded-xl">
 <X size={12} />
 </button>
 </div>
 ))}
 </div>
 )}

 {/* Thanh Input Gửi Tin Nhắn */}
 <div className="p-4 border-t border-white/40 shrink-0 glass-panel">
 <form onSubmit={handleSend} className="space-y-3">
 <div className="flex items-center justify-between">
 <label className="flex items-center gap-2 cursor-pointer text-[10px] font-bold text-gray-400 hover:text-gray-600 transition-colors">
 <input 
 type="checkbox" 
 checked={sendPrivate}
 onChange={(e) => setSendPrivate(e.target.checked)}
 className="rounded border-gray-300 text-idaz-orange focus:ring-indigo-500"
 />
 <div className="flex items-center gap-1">
 <Lock size={12} className={sendPrivate ? 'text-idaz-orange' : ''} />
 <span>Gửi tin nhắn riêng (Chỉ Admin & CSKH thấy)</span>
 </div>
 </label>

 {replyToMsg && (
 <div className="flex items-center gap-2 bg-idaz-orange-light text-idaz-orange-dark text-[10px] px-2.5 py-1 rounded-xl">
 <span>Trả lời: <span className="font-bold">{replyToMsg.senderName}</span></span>
 <button type="button" onClick={() => setReplyToMsg(null)} className="text-indigo-900">
 <X size={10} />
 </button>
 </div>
 )}
 </div>

 <div className="flex items-center gap-2">
 <button 
 type="button"
 onClick={() => fileInputRef.current?.click()}
 className="p-2.5 text-gray-400 hover:text-idaz-orange hover:bg-idaz-gray rounded-3xl transition-all"
 title="Đính kèm file"
 >
 <Paperclip size={18} />
 </button>
 <input 
 type="file" 
 ref={fileInputRef} 
 onChange={handleFileUpload} 
 multiple 
 className="hidden" 
 />

 <input 
 type="text"
 value={newMessage}
 onChange={handleTyping}
 placeholder={sendPrivate ? "Nhập tin nhắn riêng tư gửi Admin..." : "Nhập tin nhắn..."}
 className="flex-1 bg-idaz-gray border border-white/60 rounded-3xl px-4 py-3 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-idaz-black"
 />

 <button 
 type="submit"
 disabled={!newMessage.trim() && !attachments.length}
 style={{ backgroundColor: newMessage.trim() || attachments.length ? (settings.primaryColor || '#4f46e5') : '' }}
 className="p-3 bg-idaz-orange text-white rounded-3xl hover:bg-idaz-orange-dark disabled:opacity-50 transition-all shadow-md shadow-indigo-600/10"
 >
 <Send size={16} />
 </button>
 </div>
 </form>
 </div>
 </div>

 {/* Right Info Pane (Collapsible Info Pane - Step 7) */}
 <AnimatePresence>
 {showInfoPane && (
 <motion.div 
 initial={{ width: 0, opacity: 0 }}
 animate={{ width: 280, opacity: 1 }}
 exit={{ width: 0, opacity: 0 }}
 transition={{ duration: 0.3 }}
 className="border-l border-white/40 flex flex-col bg-idaz-gray/50 backdrop-blur-sm shrink-0 overflow-hidden"
 >
 <div className="p-4 border-b border-white/40 flex items-center justify-between">
 <h3 className="font-bold text-xs text-gray-700 uppercase tracking-wider">Thông tin Kênh</h3>
 <button onClick={() => setShowInfoPane(false)} className="text-gray-400 hover:text-gray-600">
 <X size={16} />
 </button>
 </div>

 <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar text-xs">
 <div>
 <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Thành viên hỗ trợ</h4>
 <div className="space-y-2">
 {activeChat.data.members?.filter(m => m.role !== 'client').map(member => (
 <div key={member._id} className="flex items-center gap-2">
 <div className="w-7 h-7 rounded-full bg-indigo-150 flex items-center justify-center font-bold text-idaz-orange-dark">
 {member.name.charAt(0)}
 </div>
 <div>
 <div className="font-semibold text-idaz-black">{member.name}</div>
 <div className="text-[10px] text-gray-400 capitalize">{member.role}</div>
 </div>
 </div>
 ))}
 </div>
 </div>

 <div>
 <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Tài liệu đã chia sẻ</h4>
 <div className="space-y-2">
 {getSharedAssets().length === 0 ? (
 <div className="text-gray-400 text-xs italic">Chưa chia sẻ tài liệu nào</div>
 ) : (
 getSharedAssets().slice(0, 5).map((asset, index) => (
 <a 
 key={index}
 href={asset.url}
 target="_blank"
 className="flex items-center gap-2 p-2 glass-panel rounded-3xl border border-white/40 hover:bg-idaz-gray transition-all text-gray-600 block truncate"
 >
 <FileText size={14} className="text-indigo-500 shrink-0" />
 <span className="truncate">{asset.name}</span>
 </a>
 ))
 )}
 </div>
 </div>
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 ) : (
 <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-2">
 <Hash size={48} className="opacity-20 text-indigo-500 animate-bounce" />
 <p className="text-xs">Vui lòng chọn một dự án hoặc kênh hỗ trợ.</p>
 </div>
 )}

 {/* Image Lightbox Preview Modal (Step 10) */}
 <AnimatePresence>
 {activeImage && (
 <motion.div 
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
 >
 <button 
 onClick={() => setActiveImage(null)}
 className="absolute top-4 right-4 text-white hover:bg-white/10 p-2 rounded-full transition-all"
 >
 <X size={24} />
 </button>
 <img src={activeImage} alt="Preview" className="max-w-full max-h-[90vh] object-contain rounded-3xl shadow-2xl" />
 </motion.div>
 )}
 </AnimatePresence>

 {/* Glowing Incoming Call Ring Indicator (Step 5) */}
 <AnimatePresence>
 {incomingCall && (
 <motion.div 
 initial={{ scale: 0.8, opacity: 0 }}
 animate={{ scale: 1, opacity: 1 }}
 exit={{ scale: 0.8, opacity: 0 }}
 className="fixed bottom-6 right-6 z-50 bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-3xl p-5 w-80 shadow-[0_0_50px_10px_rgba(16,185,129,0.35)] border border-emerald-400/20"
 >
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center animate-bounce shadow-inner">
 <Video size={24} className="text-white" />
 </div>
 <div>
 <h4 className="font-bold text-sm">Cuộc gọi đến...</h4>
 <p className="text-xs text-emerald-100">{incomingCall.name || 'Quản trị viên'}</p>
 </div>
 </div>
 
 <div className="flex gap-2 mt-4">
 <button 
 onClick={() => setCallUser({ id: incomingCall.from, callerName: incomingCall.name, type: incomingCall.type })}
 className="flex-1 py-2 px-3 glass-panel text-emerald-800 text-xs font-bold rounded-3xl flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/20"
 >
 Nhận cuộc gọi
 </button>
 <button 
 onClick={() => setIncomingCall(null)}
 className="flex-1 py-2 px-3 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-3xl flex items-center justify-center gap-1.5"
 >
 Bỏ qua
 </button>
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
 isCallMuted={isMuted}
 />
 </div>
 );
}
