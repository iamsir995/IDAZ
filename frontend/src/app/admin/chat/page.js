"use client";

import { useState, useEffect, useRef, useId } from "react";
import api from "../../../services/api";
import { useAuth } from "../../../context/AuthContext";
import { useSocket } from "../../../context/SocketContext";
import { Send, Search, Phone, Video, Info, Hash, Users, Paperclip, Check, CheckCheck, X, Reply, Download, FileText, Pin, Edit, Trash2, Lock, Eye, Sparkles, Volume2, VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import dynamic from 'next/dynamic';
const VideoCallModal = dynamic(() => import('../../../components/VideoCallModal'), { ssr: false });
import FilePreviewModal from "../../../components/FilePreviewModal";

export default function AdminChat() {
 const { user } = useAuth();
 const { socket, emit, subscribe, joinRoom, leaveRoom, isConnected } = useSocket();
 const componentId = useId();
 
 const [contacts, setContacts] = useState([]);
 const [channels, setChannels] = useState([]);
 const [activeChat, setActiveChat] = useState(null);
 const [messages, setMessages] = useState([]);
 const [newMessage, setNewMessage] = useState("");
 const [searchQuery, setSearchQuery] = useState("");
 
 const [attachments, setAttachments] = useState([]);
 const [replyToMsg, setReplyToMsg] = useState(null);
 const fileInputRef = useRef(null);
 const [previewAttachment, setPreviewAttachment] = useState(null);

 const [editingMsgId, setEditingMsgId] = useState(null);
 const [editingMsgText, setEditingMsgText] = useState("");
 const [sendPrivate, setSendPrivate] = useState(false);
 const [activeImage, setActiveImage] = useState(null);
 const [messagesLoading, setMessagesLoading] = useState(false);
 const [msgSearchQuery, setMsgSearchQuery] = useState("");
 const [searchMatches, setSearchMatches] = useState([]);
 const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);

 const [typingUsers, setTypingUsers] = useState({});
 const [page, setPage] = useState(1);
 const [hasMore, setHasMore] = useState(true);
 const [isLoadingMore, setIsLoadingMore] = useState(false);

 // Online users state
 const [onlineUserIds, setOnlineUserIds] = useState([]);

 // E2EE states & helpers
 const [e2eeEnabled, setE2eeEnabled] = useState(false);

 // Drag-and-drop state
 const [isDragging, setIsDragging] = useState(false);

 const renderUserBadge = (role) => {
 const roleNormalized = (role || '').toLowerCase();
 if (['superadmin', 'admin'].includes(roleNormalized)) {
 return (
 <span className="ml-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase tracking-wide">
 QTV
 </span>
 );
 } else if (roleNormalized === 'manager') {
 return (
 <span className="ml-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase tracking-wide">
 Quản lý
 </span>
 );
 } else if (roleNormalized === 'client') {
 return (
 <span className="ml-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wide">
 Khách hàng
 </span>
 );
 } else if (['cskh', 'staff'].includes(roleNormalized)) {
 return (
 <span className="ml-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase tracking-wide">
 CSKH
 </span>
 );
 }
 return null;
 };

 const validateFile = (file) => {
 const maxSizeBytes = 10 * 1024 * 1024; // 10MB
 const blockedExtensions = ['.exe', '.bat', '.sh', '.cmd', '.msi', '.dmg', '.com', '.bin'];
 const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
 
 if (file.size > maxSizeBytes) {
 toast.error(`Tệp ${file.name} quá lớn! Giới hạn tối đa là 10MB để đảm bảo ổn định.`);
 return false;
 }
 if (blockedExtensions.includes(ext)) {
 toast.error(`Định dạng tệp ${ext} không được hỗ trợ vì lý do bảo mật.`);
 return false;
 }
 return true;
 };

 const handleDragOver = (e) => {
 e.preventDefault();
 if (activeChat) {
 setIsDragging(true);
 }
 };

 const handleDrop = (e) => {
 e.preventDefault();
 setIsDragging(false);
 const rawFiles = Array.from(e.dataTransfer.files);
 if (!rawFiles.length) return;
 const files = rawFiles.filter(validateFile);
 if (!files.length) return;

 files.forEach(file => {
 const reader = new FileReader();
 reader.onloadend = () => {
 const type = file.type.startsWith('image/') ? 'image' : 'document';
 setAttachments(prev => [...prev, {
 url: reader.result,
 name: file.name,
 type: type,
 size: file.size
 }]);
 };
 reader.readAsDataURL(file);
 });
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

 const [incomingCall, setIncomingCall] = useState(null);
 const [callUser, setCallUser] = useState(null);

 // Mute notification audio state
 const [isMuted, setIsMuted] = useState(false);

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

 const scrollToBottom = () => {
 messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
 };

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

 const fetchContacts = async () => {
 try {
 const res = await api.get('/chat/contacts');
 if (res.data.success) {
 setContacts(res.data.data);
 }
 } catch (error) {
 toast.error("Lỗi lấy danh bạ");
 }
 };

 const fetchChannels = async () => {
 try {
 const res = await api.get('/channels');
 if (res.data.success) {
 setChannels(res.data.data);
 }
 } catch (error) {
 toast.error("Lỗi tải channels");
 }
 };

 const fetchHistory = async (userId) => {
 try {
 const res = await api.get(`/chat/${userId}`);
 if (res.data.success) {
 setMessages(res.data.data);
 }
 } catch (error) {
 console.log(error);
 }
 };

 const fetchChannelMessages = async (channelId, pageNum, replace = false) => {
 setIsLoadingMore(true);
 try {
 const res = await api.get(`/chat/channels/${channelId}/messages?page=${pageNum}`);
 if (res.data.success) {
 const newMsgs = res.data.data;
 if (newMsgs.length < 30) setHasMore(false);
 
 // Lưu lại vị trí scroll hiện tại để không bị nhảy khung nhìn khi unshift tin nhắn mới
 const container = scrollContainerRef.current;
 const previousScrollHeight = container ? container.scrollHeight : 0;

 setMessages(prev => {
 const combined = replace ? newMsgs : [...newMsgs, ...prev];
 return combined;
 });

 // Restore scroll position sau khi render
 if (!replace && container) {
 setTimeout(() => {
 container.scrollTop = container.scrollHeight - previousScrollHeight;
 }, 10);
 }
 }
 } catch (error) {
 console.log(error);
 } finally {
 setIsLoadingMore(false);
 }
 };

 const handleScroll = (e) => {
 const { scrollTop } = e.target;
 if (scrollTop === 0 && hasMore && !isLoadingMore && activeChat?.type === 'channel') {
 const nextPage = page + 1;
 setPage(nextPage);
 fetchChannelMessages(activeChat.id, nextPage, false);
 }
 };

 useEffect(() => {
 activeChatRef.current = activeChat;
 }, [activeChat]);

 useEffect(() => {
 // eslint-disable-next-line react-hooks/set-state-in-effect
 fetchContacts();
 // eslint-disable-next-line react-hooks/set-state-in-effect
 fetchChannels();
 }, []);

 // Subscribe to socket events qua SocketContext (không tạo socket mới)
 useEffect(() => {
 const unsubs = [
 subscribe('receive_message', componentId, (msg) => {
 const currentChat = activeChatRef.current;
 setMessages(prev => {
 if (prev.find(m => m._id === msg._id)) return prev;
 if (currentChat?.type === 'channel' && msg.channelId === currentChat.id) return [...prev, msg];
 if (currentChat?.type === 'user' && !msg.channelId && (msg.senderId?._id === currentChat.id || msg.senderId === currentChat.id || msg.receiverId === currentChat.id)) return [...prev, msg];
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
 subscribe('user_typing', componentId, ({ channelId, userName }) => {
 setTypingUsers(prev => ({ ...prev, [channelId]: userName }));
 }),
 subscribe('user_stop_typing', componentId, ({ channelId }) => {
 setTypingUsers(prev => { const n = { ...prev }; delete n[channelId]; return n; });
 }),
 subscribe('message_read_update', componentId, ({ messageId, userId }) => {
 setMessages(prev => prev.map(m =>
 m._id === messageId && !m.readBy?.find(r => r.user === userId)
 ? { ...m, readBy: [...(m.readBy || []), { user: userId, readAt: new Date() }] }
 : m
 ));
 }),
 subscribe('message_updated', componentId, (updatedMsg) => {
 setMessages(prev => prev.map(m => m._id === updatedMsg._id ? updatedMsg : m));
 }),
 subscribe('message_deleted', componentId, ({ messageId }) => {
 setMessages(prev => prev.filter(m => m._id !== messageId));
 }),
 subscribe('call_incoming', componentId, (data) => setIncomingCall(data)),
 subscribe('incoming_call', componentId, (data) => setIncomingCall(data)),
 subscribe('online_users', componentId, (users) => {
 setOnlineUserIds(users);
 }),
 ];
 return () => unsubs.forEach(fn => fn && fn());
 }, [subscribe, emit, user, isMuted]);

 const handleStartCall = (type = 'video') => {
 if (!activeChat) return;
 if (activeChat.type === 'channel') {
 setCallUser({ id: activeChat.id, callerName: user.name, type, isGroup: true });
 return;
 }
 setCallUser({ id: activeChat.id, callerName: user.name, type });
 };

 useEffect(() => {
 if (activeChat) {
 // eslint-disable-next-line react-hooks/set-state-in-effect
 setPage(1);
 // eslint-disable-next-line react-hooks/set-state-in-effect
 setHasMore(true);
 if (activeChat.type === 'channel') {
 // eslint-disable-next-line react-hooks/set-state-in-effect
 fetchChannelMessages(activeChat.id, 1, true);
 joinRoom(activeChat.id);
 } else {
 // eslint-disable-next-line react-hooks/set-state-in-effect
 fetchHistory(activeChat.id);
 }
 }
 return () => {
 if (activeChat?.type === 'channel') {
 leaveRoom(activeChat.id);
 }
 }
 }, [activeChat, joinRoom, leaveRoom]);

 useEffect(() => {
 // Chỉ cuộn xuống nếu đang ở trang 1 (vừa load hoặc nhắn tin mới)
 if (page === 1) {
 scrollToBottom();
 }
 }, [messages, typingUsers, page]);



 const typingTimeoutRef = useRef(null);
 const handleTyping = (e) => {
 setNewMessage(e.target.value);
 if (activeChat?.type === 'channel') {
 emit('typing', { channelId: activeChat.id, userName: user.name });
 if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
 typingTimeoutRef.current = setTimeout(() => {
 emit('stop_typing', { channelId: activeChat.id, userName: user.name });
 }, 2000);
 }
 };

 const isMessageEditable = (msg) => {
 // eslint-disable-next-line react-hooks/purity
 const diffMs = Date.now() - new Date(msg.createdAt).getTime();
 return diffMs < 5 * 60 * 1000;
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
 const handleFileChange = (e) => {
 const rawFiles = Array.from(e.target.files);
 if (!rawFiles.length) return;
 const files = rawFiles.filter(validateFile);
 if (!files.length) return;

 files.forEach(file => {
 const reader = new FileReader();
 reader.onloadend = () => {
 const type = file.type.startsWith('image/') ? 'image' : 'document';
 setAttachments(prev => [...prev, {
 url: reader.result,
 name: file.name,
 type: type,
 size: file.size
 }]);
 };
 reader.readAsDataURL(file);
 });
 };

 const removeAttachment = (index) => {
 setAttachments(prev => prev.filter((_, i) => i !== index));
 };

 const isSendingRef = useRef(false);

 const sendMessage = async (e) => {
 if (e?.preventDefault) e.preventDefault();
 if ((!newMessage.trim() && attachments.length === 0) || !activeChat || isSendingRef.current) return;

 isSendingRef.current = true;
 const textToSend = e2eeEnabled ? encryptText(newMessage) : newMessage;
 if (activeChat.type === 'channel') {
 try {
 await api.post('/chat/messages', {
 channelId: activeChat.id,
 text: textToSend,
 attachments,
 replyTo: replyToMsg?._id || null
 });
 emit('stop_typing', { channelId: activeChat.id, userName: user.name });
 } catch (err) {
 toast.error("Lỗi gửi tin nhắn");
 }
 } else {
 const msgData = {
 senderId: user._id,
 receiverId: activeChat.id,
 senderName: user.name,
 senderRole: user.role,
 text: textToSend
 };
 emit("send_message", msgData);
 }
 
 setNewMessage("");
 setAttachments([]);
 setReplyToMsg(null);
 setPage(1);
 scrollToBottom();
 isSendingRef.current = false;
 };

 return (
 <div className="h-full flex flex-col md:flex-row glass-panel overflow-hidden -mx-8 -my-8 rounded-tr-3xl">
 {/* Sidebar Channels & Contacts */}
 <div className="w-full md:w-80 border-r border-white/40 flex flex-col bg-idaz-gray/50 shrink-0">
 <div className="p-6 border-b border-white/40">
 <h2 className="text-xl font-bold text-idaz-black mb-4">Giao tiếp</h2>
 <div className="relative">
 <Search size={18} className="absolute left-3 top-3 text-gray-500" />
 <input 
 type="text" 
 placeholder="Tìm kiếm..." 
 value={searchQuery}
 onChange={e => setSearchQuery(e.target.value)}
 className="w-full bg-white/50 border border-white/60 rounded-3xl pl-10 pr-4 py-2 text-idaz-black text-sm focus:border-indigo-500 transition-colors"
 />
 </div>
 </div>

 <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-6">
 {/* Channels */}
 <div>
 <h3 className="px-3 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Channels Dự án</h3>
 <div className="space-y-1">
 {channels
 .filter(c => c.type === 'project' && (!searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase())))
 .map((channel) => (
 <button
 key={channel._id}
 onClick={() => setActiveChat({ type: 'channel', id: channel._id, data: channel })}
 className={`w-full flex items-center gap-3 p-3 rounded-3xl transition-all ${
 activeChat?.id === channel._id ? 'bg-indigo-600/20 text-idaz-black' : 'hover:bg-white/50 text-gray-400'
 }`}
 >
 <div className="w-10 h-10 rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center border border-white/60 shrink-0">
 <Hash size={18} className="text-indigo-400" />
 </div>
 <div className="text-left flex-1 min-w-0">
 <div className="font-bold truncate text-idaz-black">{channel.name}</div>
 <div className="text-xs truncate opacity-70">
 {channel.lastMessage ? 'Có tin nhắn mới' : 'Chưa có tin nhắn'}
 </div>
 </div>
 </button>
 ))}
 </div>
 </div>

 {/* Support Channels */}
 <div>
 <h3 className="px-3 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 mt-4 text-emerald-500/80">Hỗ trợ CSKH</h3>
 <div className="space-y-1">
 {channels
 .filter(c => c.type === 'support' && (!searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase())))
 .map((channel) => (
 <button
 key={channel._id}
 onClick={() => setActiveChat({ type: 'channel', id: channel._id, data: channel })}
 className={`w-full flex items-center gap-3 p-3 rounded-3xl transition-all ${
 activeChat?.id === channel._id ? 'bg-emerald-600/20 text-idaz-black' : 'hover:bg-white/50 text-gray-400'
 }`}
 >
 <div className="w-10 h-10 rounded-3xl bg-gradient-to-br from-emerald-800 to-emerald-900 flex items-center justify-center border border-emerald-500/20 shrink-0 relative">
 <Hash size={18} className="text-emerald-400" />
 {channel.members?.some(m => (m.role === 'client' || (m && m.role === 'client')) && onlineUserIds.includes(m._id || m)) && (
 <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-black animate-pulse"></div>
 )}
 </div>
 <div className="text-left flex-1 min-w-0">
 <div className="font-bold truncate text-idaz-black">{channel.name}</div>
 <div className="text-xs truncate opacity-70">
 {channel.lastMessage ? 'Có tin nhắn mới' : 'Chưa có tin nhắn'}
 </div>
 </div>
 </button>
 ))}
 </div>
 </div>

 {/* Direct Messages */}
 <div>
 <h3 className="px-3 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 mt-4">Tin nhắn trực tiếp</h3>
 <div className="space-y-1">
 {contacts
 .filter(c => !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.email.toLowerCase().includes(searchQuery.toLowerCase()))
 .map((contact) => (
 <button
 key={contact._id}
 onClick={() => setActiveChat({ type: 'user', id: contact._id, data: contact })}
 className={`w-full flex items-center gap-3 p-3 rounded-3xl transition-all ${
 activeChat?.id === contact._id ? 'bg-indigo-600/20 text-idaz-black' : 'hover:bg-white/50 text-gray-400'
 }`}
 >
 <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-idaz-black shrink-0 relative">
  <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-500 font-bold flex items-center justify-center shrink-0">
  {(contact.name || 'U').charAt(0).toUpperCase()}
  </div>
 {onlineUserIds.includes(contact._id) ? (
 <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-black animate-pulse"></div>
 ) : (
 <div className="absolute bottom-0 right-0 w-3 h-3 bg-zinc-600 rounded-full border-2 border-black"></div>
 )}
 </div>
 <div className="text-left flex-1 min-w-0">
 <div className="font-bold truncate text-idaz-black">{contact.name}</div>
 <div className="text-xs truncate opacity-70 capitalize">{contact.role}</div>
 </div>
 </button>
 ))}
 </div>
 </div>
 </div>

 {/* Tích hợp Modal Video Call (WebRTC) */}
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

 {/* Chat Area */}
 <div className="flex-1 flex flex-col glass-panel relative" onDragOver={handleDragOver}>
 {isDragging && (
 <div 
 onDragOver={(e) => e.preventDefault()}
 onDragLeave={() => setIsDragging(false)}
 onDrop={handleDrop}
 className="absolute inset-0 bg-white/80 backdrop-blur-md z-50 flex flex-col items-center justify-center border-4 border-dashed border-indigo-500/50 m-4 rounded-3xl transition-all duration-300"
 >
 <div className="bg-indigo-500/20 p-6 rounded-full border border-indigo-200 text-indigo-400 mb-4 animate-bounce">
 <Paperclip size={40} />
 </div>
 <h3 className="text-xl font-bold text-idaz-black mb-2">Thả tệp tin tại đây</h3>
 <p className="text-sm text-gray-400">Tải lên tài liệu hoặc hình ảnh bảo mật (Tối đa 25MB)</p>
 </div>
 )}
 {activeChat ? (
 <>
 {/* Chat Header */}
 <div className="p-6 border-b border-white/40 flex items-center justify-between bg-idaz-gray shrink-0">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
 {activeChat.type === 'channel' ? <Hash size={24} /> : activeChat.data.name?.charAt(0)}
 </div>
 <div>
 <h2 className="text-xl font-bold text-idaz-black">
 {activeChat.type === 'channel' ? activeChat.data.name : activeChat.data.name}
 </h2>
 {activeChat.type === 'channel' ? (
 <p className="text-sm text-gray-500 flex items-center gap-1">
 <Users size={14} /> {activeChat.data.members?.length || 0} thành viên
 </p>
 ) : (
 <p className="text-sm text-gray-500">{activeChat.data.role}</p>
 )}
 </div>
 </div>
 <div className="flex items-center gap-2">
 {/* E2EE Toggle Button */}
 <button
 onClick={() => setE2eeEnabled(!e2eeEnabled)}
 className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
 e2eeEnabled
 ? 'bg-rose-500/20 text-rose-400 border-rose-500/30 animate-pulse'
 : 'glass-panel text-gray-500 border-white/40 hover:bg-gray-100'
 }`}
 title={e2eeEnabled ? "Tắt mã hóa đầu cuối" : "Bật mã hóa đầu cuối"}
 >
 <Lock size={14} className={e2eeEnabled ? "text-rose-400" : "text-gray-500"} />
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
 className="pl-8 pr-7 py-1.5 bg-gray-100 hover:bg-gray-700/60 focus:glass-panel text-xs border border-white/40 focus:border-white/60 text-idaz-black rounded-3xl w-32 focus:w-48 transition-all duration-300 focus:outline-none"
 />
 <Search size={12} className="absolute left-2.5 text-gray-500 pointer-events-none" />
 {msgSearchQuery && (
 <button 
 onClick={() => setMsgSearchQuery("")}
 className="absolute right-2 text-gray-500 hover:text-gray-600 p-0.5"
 >
 <X size={10} />
 </button>
 )}
 </div>
 {searchMatches.length > 0 && (
 <div className="flex items-center gap-1.5 bg-gray-100/80 px-2 py-1 rounded-3xl text-[10px] text-gray-400 font-semibold border border-white/40 shadow-inner">
 <span>{currentMatchIndex + 1}/{searchMatches.length}</span>
 <button onClick={handlePrevMatch} className="hover:text-indigo-400 font-bold px-0.5 text-[11px] transition-colors" title="Trận trước">↑</button>
 <button onClick={handleNextMatch} className="hover:text-indigo-400 font-bold px-0.5 text-[11px] transition-colors" title="Trận sau">↓</button>
 </div>
 )}
 </div>
 <button 
 onClick={() => {
 setIsMuted(!isMuted);
 toast.success(!isMuted ? "Đã tắt âm thanh thông báo" : "Đã bật âm thanh thông báo");
 }} 
 className={`p-3 rounded-3xl transition-colors ${isMuted ? 'text-rose-400 bg-rose-950/20' : 'text-gray-400 hover:bg-white/50 hover:text-idaz-black'}`}
 title={isMuted ? "Bật âm thanh" : "Tắt âm thanh thông báo"}
 >
 {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
 </button>

 <button onClick={() => handleStartCall('audio')} className="p-3 text-gray-400 hover:bg-white/50 hover:text-idaz-black rounded-3xl transition-colors">
 <Phone size={20} />
 </button>
 <button onClick={() => handleStartCall('video')} className="p-3 text-gray-400 hover:bg-white/50 hover:text-idaz-black rounded-3xl transition-colors">
 <Video size={20} />
 </button>
 <button className="p-3 text-gray-400 hover:bg-white/50 hover:text-idaz-black rounded-3xl transition-colors">
 <Info size={20} />
 </button>
 </div>
 </div>

 {/* Thanh Tin nhắn đã ghim (Pinned Messages Header Banner) */}
 {pinnedMessages.length > 0 && (
 <div className="bg-amber-950/40 border-b border-amber-900/30 px-6 py-2.5 flex items-center justify-between z-10 text-xs text-amber-200 shrink-0">
 <div className="flex items-center gap-2 truncate">
 <Pin size={12} className="text-amber-500 rotate-45 shrink-0 animate-pulse" />
 <span className="font-semibold shrink-0">Tin nhắn đã ghim ({pinnedMessages.length}):</span>
 <span className="truncate text-amber-300 italic">
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
 element.classList.add('bg-amber-900/20');
 setTimeout(() => element.classList.remove('bg-amber-900/20'), 2000);
 } else {
 toast.error("Tin nhắn đã ghim ở quá xa hoặc chưa tải hết.");
 }
 }}
 className="text-amber-400 hover:text-amber-200 font-bold hover:underline transition-all"
 >
 Xem chi tiết
 </button>
 <button 
 onClick={() => handleTogglePin(pinnedMessages[pinnedMessages.length - 1]._id)}
 className="text-amber-500 hover:text-amber-400 p-0.5 rounded-full hover:bg-amber-900/30"
 title="Bỏ ghim"
 >
 <X size={12} />
 </button>
 </div>
 </div>
 )}

 {/* Chat Messages */}
 <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar flex flex-col">
 {isLoadingMore && <div className="text-center text-gray-500 text-xs py-2">Đang tải thêm...</div>}
 {messages.length === 0 && !isLoadingMore && (
 <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
 <div className="w-16 h-16 bg-white/50 rounded-full flex items-center justify-center mb-4">👋</div>
 <p>Bắt đầu cuộc trò chuyện trong {activeChat.data.name}</p>
 </div>
 )}
 {messages.map((msg, idx) => {
 const senderIdStr = typeof msg.senderId === 'object' ? msg.senderId._id : msg.senderId;
 const isMe = senderIdStr === user._id;
 
 const prevMsg = messages[idx - 1];
 const isSameSenderAsPrev = prevMsg && (typeof prevMsg.senderId === 'object' ? prevMsg.senderId._id : prevMsg.senderId) === senderIdStr;
 
 return (
 <div key={idx} id={`msg-${msg._id}`} className={`flex items-end gap-2.5 max-w-[85%] ${isMe ? 'flex-row-reverse ml-auto' : 'mr-auto'} mt-4 group`}>
 {/* Avatar with online status */}
 <div className="relative shrink-0 mb-1">
 <div className="w-8 h-8 rounded-full overflow-hidden border border-white/60 shadow-sm bg-gray-100">
 <img 
 src={isMe ? (user?.avatar || 'https://api.dicebear.com/7.x/adventurer/svg?seed=admin') : (msg.senderId?.avatar || msg.senderAvatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${msg.senderName || 'user'}`)} 
 alt={msg.senderName} 
 className="w-full h-full object-cover"
 />
 </div>
 {!isMe && onlineUserIds.includes(senderIdStr) && (
 <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-zinc-950" />
 )}
 </div>

 <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
 {!isMe && (
 <span className="text-[10px] font-bold text-gray-400 mb-1 ml-1 leading-none flex items-center">
 {msg.senderId?.name || msg.senderName}
 {renderUserBadge(msg.senderRole || msg.senderId?.role)}
 </span>
 )}
 {/* Quote / Reply Preview */}
 {msg.replyTo && (
 <div className={`text-xs p-2 rounded-3xl mb-1 flex items-center gap-2 border border-white/40 ${isMe ? 'bg-indigo-50 text-indigo-700' : 'bg-white/60 text-gray-700'}`}>
 <div className="w-1 bg-indigo-500 h-full rounded-full self-stretch"></div>
 <div>
 <span className="font-bold opacity-70">{msg.replyTo.senderName}:</span>
 <p className="truncate max-w-[200px]">{decryptText(msg.replyTo.text)}</p>
 </div>
 </div>
 )}

 <div className={`relative max-w-[400px] rounded-3xl px-5 py-3 ${
 isMe 
 ? 'bg-indigo-600 text-idaz-black rounded-br-none shadow-lg shadow-indigo-600/20' 
 : 'bg-white/10 text-idaz-black rounded-bl-none'
 }`}>
 {/* Hover Actions */}
 <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-white/60 p-1.5 rounded-3xl z-20 shadow-lg border border-white/40">
 {/* Quick Emoji Reactions */}
 <div className="flex items-center border-r border-white/60 pr-2 mr-2 gap-1.5 bg-white/90 rounded-full px-2 py-0.5 border border-white/40">
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

 <button 
 onClick={() => setReplyToMsg({ _id: msg._id, senderName: msg.senderId?.name || msg.senderName || "Người dùng", text: decryptText(msg.text) })}
 className="p-0.5 text-gray-600 hover:text-indigo-300 transition-colors"
 title="Trả lời tin nhắn"
 >
 <Reply size={10} />
 </button>
 {isMe && isMessageEditable(msg) && (
 <button 
 onClick={() => {
 setEditingMsgId(msg._id);
 setEditingMsgText(decryptText(msg.text));
 }}
 className="p-0.5 text-gray-600 hover:text-indigo-300 transition-colors animate-fade-in"
 title="Sửa tin nhắn"
 >
 <Edit size={10} />
 </button>
 )}
 <button 
 onClick={() => handleTogglePin(msg._id)}
 className={`p-0.5 transition-colors ${msg.isPinned ? 'text-amber-400 hover:text-amber-300' : 'text-gray-600 hover:text-amber-200'}`}
 title={msg.isPinned ? "Bỏ ghim tin nhắn" : "Ghim tin nhắn"}
 >
 <Pin size={10} className={msg.isPinned ? 'rotate-45' : ''} />
 </button>
 {isMe && (
 <button 
 onClick={() => handleDeleteMessage(msg._id)}
 className="p-0.5 text-gray-600 hover:text-rose-400 transition-colors"
 title="Xóa tin nhắn"
 >
 <Trash2 size={10} />
 </button>
 )}
 </div>


 
 {/* Attachments rendering */}
 {msg.attachments && msg.attachments.length > 0 && (
 <div className="flex flex-wrap gap-2 mb-2">
 {msg.attachments.map((att, attIdx) => (
 att.type === 'image' ? (
 <img key={attIdx} src={att.url} alt="attachment" onClick={() => setPreviewAttachment(att)} className="max-w-[200px] rounded-xl border border-white/60 object-cover cursor-pointer hover:opacity-90 transition-opacity" />
 ) : (
 <div key={attIdx} onClick={() => setPreviewAttachment(att)} className="flex items-center gap-3 p-3 bg-white/20 rounded-3xl border border-white/40 w-full cursor-pointer hover:bg-white/30 transition-colors">
 <FileText size={24} className={isMe ? "text-indigo-700" : "text-emerald-400"} />
 <div className="flex-1 min-w-0">
 <div className="text-sm font-bold truncate">{att.name}</div>
 <div className="text-xs opacity-70">{(att.size / 1024 / 1024).toFixed(2)} MB</div>
 </div>
 <a href={att.url} download={att.name || 'document'} onClick={(e) => e.stopPropagation()} className="p-2 hover:bg-white/80 rounded-full transition-colors flex items-center justify-center">
 <Download size={16} />
 </a>
 </div>
 )
 ))}
 </div>
 )}

 {editingMsgId === msg._id ? (
 <div className="space-y-2 py-1 min-w-[200px]">
 <textarea
 value={editingMsgText}
 onChange={(e) => setEditingMsgText(e.target.value)}
 className="w-full bg-white/40 border border-white/60 rounded-3xl p-2 text-xs focus:outline-none focus:border-indigo-500 resize-none h-16 text-idaz-black"
 />
 <div className="flex gap-1.5 justify-end">
 <button
 onClick={() => {
 setEditingMsgId(null);
 setEditingMsgText("");
 }}
 className="px-2.5 py-1 text-[10px] bg-gray-200/50 hover:bg-gray-200 rounded-xl transition-colors text-gray-600"
 >
 Hủy
 </button>
 <button
 onClick={() => handleEditMessage(msg._id)}
 className="px-2.5 py-1 text-[10px] bg-indigo-600 hover:bg-indigo-700 text-idaz-black font-bold rounded-xl transition-colors"
 >
 Lưu
 </button>
 </div>
 </div>
 ) : (
 msg.text && <p className="text-[15px] leading-relaxed break-words">{renderHighlightedText(decryptText(msg.text), msgSearchQuery)}</p>
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
 ? 'bg-indigo-500/20 border-indigo-400 text-idaz-black' 
 : 'bg-white/50 border-white/60 text-gray-600 hover:bg-white/10'
 }`}
 >
 <span>{emoji}</span>
 <span className="font-bold">{users.length}</span>
 </button>
 );
 })}
 </div>
 )}
 
 <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${isMe ? 'text-indigo-700' : 'text-gray-400'}`}>
 <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
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
 <CheckCheck size={14} className="text-blue-400 font-bold" />
 ) : (
 <Check size={14} className="text-gray-700" />
 )}
 </div>
 )}
 </div>
 </div>
 </div>
 </div>
 );
 })}
 
 {/* Typing indicator */}
 {activeChat.type === 'channel' && Object.keys(typingUsers).length > 0 && typingUsers[activeChat.id] && (
 <div className="flex justify-start mt-6">
 <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-xs text-idaz-black shrink-0 mr-2 self-end mb-1">
  <div className="w-5 h-5 rounded-full bg-idaz-orange-dark flex items-center justify-center text-[10px] text-white font-bold">
  {(typingUsers[activeChat.id] || 'U').charAt(0).toUpperCase()}
  </div>
  </div>
  <div className="bg-white/10 rounded-3xl rounded-bl-none px-4 py-3 flex gap-1 items-center">
 <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
 <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
 <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
 </div>
 </div>
 )}
 
 <div ref={messagesEndRef} className="h-4" />
 </div>

 {/* Chat Input */}
 <div className="p-4 bg-idaz-gray/30 border-t border-white/40 shrink-0 flex flex-col gap-2">
 
 {/* Context Preview (Reply & Attachments) */}
 <AnimatePresence>
 {(replyToMsg || attachments.length > 0) && (
 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} className="flex flex-col gap-2 px-2">
 {/* Reply Preview */}
 {replyToMsg && (
 <div className="flex items-center justify-between bg-white/60 border border-indigo-200 rounded-3xl p-3">
 <div className="flex items-center gap-3">
 <Reply size={16} className="text-indigo-400" />
 <div className="flex flex-col">
 <span className="text-xs font-bold text-indigo-300">Trả lời: {replyToMsg.senderName || replyToMsg.senderId?.name}</span>
 <span className="text-sm text-gray-600 truncate max-w-md">{decryptText(replyToMsg.text)}</span>
 </div>
 </div>
 <button type="button" onClick={() => setReplyToMsg(null)} className="p-1 hover:bg-white/80 rounded-full text-gray-400 transition-colors">
 <X size={16} />
 </button>
 </div>
 )}
 
 {/* Attachments Preview */}
 {attachments.length > 0 && (
 <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2">
 {attachments.map((att, idx) => (
 <div key={idx} className="relative shrink-0 w-20 h-20 bg-gray-50 rounded-3xl border border-white/60 flex items-center justify-center group overflow-hidden">
 {att.type === 'image' ? (
 <img src={att.url} alt="preview" className="w-full h-full object-cover" />
 ) : (
 <div className="flex flex-col items-center justify-center p-2 text-center text-xs text-gray-400">
 <FileText size={24} className="mb-1 text-indigo-400" />
 <span className="truncate w-full">{att.name}</span>
 </div>
 )}
 <button type="button" onClick={() => removeAttachment(idx)} className="absolute top-1 right-1 w-5 h-5 bg-white/60 rounded-full flex items-center justify-center text-idaz-black opacity-0 group-hover:opacity-100 transition-opacity">
 <X size={12} />
 </button>
 </div>
 ))}
 </div>
 )}
 </motion.div>
 )}
 </AnimatePresence>

 <form onSubmit={sendMessage} className="flex items-end gap-3 bg-white/50 border border-white/60 rounded-3xl p-2 pl-4 focus-within:border-indigo-500/50 transition-colors relative">
 <input 
 type="file" 
 ref={fileInputRef} 
 className="hidden" 
 multiple 
 onChange={handleFileChange}
 />
 <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 mb-0.5 text-gray-400 hover:text-idaz-black hover:bg-white/50 rounded-3xl transition-colors">
 <Paperclip size={20} />
 </button>
 <textarea 
 value={newMessage}
 onChange={handleTyping}
 placeholder="Nhập tin nhắn..." 
 className="flex-1 bg-transparent text-idaz-black focus:outline-none resize-none py-2 max-h-32 min-h-[40px] custom-scrollbar"
 rows={1}
 onKeyDown={(e) => {
 if (e.key === 'Enter' && !e.shiftKey) {
 e.preventDefault();
 sendMessage(e);
 }
 }}
 />
 <button 
 type="submit" 
 disabled={!newMessage.trim() && attachments.length === 0}
 className="w-10 h-10 shrink-0 rounded-3xl bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center text-idaz-black transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-0.5"
 >
 <Send size={18} className="ml-1" />
 </button>
 </form>
 </div>
 </>
 ) : (
 <div className="h-full flex flex-col items-center justify-center text-gray-500 bg-idaz-gray/30">
 <div className="w-24 h-24 bg-white/50 rounded-full flex items-center justify-center mb-6">
 <Hash size={40} className="text-gray-300" />
 </div>
 <h3 className="text-2xl font-bold text-idaz-black mb-2">Agency Chat Hub</h3>
 <p className="text-center max-w-md">Chọn một Channel dự án hoặc liên hệ để bắt đầu thảo luận.</p>
 </div>
 )}
 <FilePreviewModal asset={previewAttachment} onClose={() => setPreviewAttachment(null)} />
 </div>
 </div>
 );
}
