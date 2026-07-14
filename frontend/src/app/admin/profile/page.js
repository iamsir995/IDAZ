"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../services/api";
import toast from "react-hot-toast";
import { User as UserIcon, Lock, Camera, Phone, MapPin, Save, ShieldCheck, Activity, Code as Github, MessageCircle as Twitter, Link as Linkedin, Star } from "lucide-react";
import { motion } from "framer-motion";

export default function ProfilePage() {
 const { user: authUser } = useAuth();
 const [activeTab, setActiveTab] = useState("info");
 
 // States cho Form
 const [profile, setProfile] = useState({
 name: "", email: "", role: "", phone: "", bio: "", avatar: "", coverImage: "", statusText: "",
 socialLinks: { linkedin: "", facebook: "", portfolio: "" },
 skills: [],
 activityLog: [],
 lastLocation: null,
 is2FAEnabled: false
 });
 const [skillInput, setSkillInput] = useState("");
 const [passwords, setPasswords] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
 const [isLoading, setIsLoading] = useState(false);
 const [locationLoading, setLocationLoading] = useState(false);

 useEffect(() => {
 fetchProfile();
 }, []);

 const fetchProfile = async () => {
 try {
 const { data } = await api.get("/users/me");
 if (data.success) {
 setProfile({
 name: data.data.name || "",
 email: data.data.email || "",
 role: data.data.role || "",
 phone: data.data.phone || "",
 bio: data.data.bio || "",
 avatar: data.data.avatar || "",
 coverImage: data.data.coverImage || "",
 statusText: data.data.statusText || "",
 socialLinks: data.data.socialLinks || { linkedin: "", facebook: "", portfolio: "" },
 skills: data.data.skills || [],
 activityLog: data.data.activityLog || [],
 lastLocation: data.data.lastLocation || null,
 is2FAEnabled: data.data.is2FAEnabled || false
 });
 }
 } catch (error) {
 toast.error("Không thể tải thông tin cá nhân");
 }
 };

 const handleUpdateProfile = async (e) => {
 e.preventDefault();
 setIsLoading(true);
 try {
 const { data } = await api.put("/users/me/profile", {
 name: profile.name,
 phone: profile.phone,
 bio: profile.bio,
 statusText: profile.statusText,
 socialLinks: profile.socialLinks,
 skills: profile.skills
 });
 if (data.success) {
 toast.success("Cập nhật thông tin thành công!");
 }
 } catch (error) {
 toast.error("Lỗi khi cập nhật thông tin");
 } finally {
 setIsLoading(false);
 }
 };

 const handleUpdatePassword = async (e) => {
 e.preventDefault();
 if (passwords.newPassword !== passwords.confirmPassword) {
 return toast.error("Mật khẩu xác nhận không khớp!");
 }
 setIsLoading(true);
 try {
 const { data } = await api.put("/users/me/password", {
 oldPassword: passwords.oldPassword,
 newPassword: passwords.newPassword
 });
 if (data.success) {
 toast.success("Đổi mật khẩu thành công!");
 setPasswords({ oldPassword: "", newPassword: "", confirmPassword: "" });
 }
 } catch (error) {
 toast.error(error.response?.data?.message || "Đổi mật khẩu thất bại");
 } finally {
 setIsLoading(false);
 }
 };

 const handleAddSkill = (e) => {
 if (e.key === 'Enter' && skillInput.trim()) {
 e.preventDefault();
 if (!profile.skills.includes(skillInput.trim())) {
 setProfile({ ...profile, skills: [...profile.skills, skillInput.trim()] });
 }
 setSkillInput("");
 }
 };

 const removeSkill = (skillToRemove) => {
 setProfile({ ...profile, skills: profile.skills.filter(s => s !== skillToRemove) });
 };

 const handleAvatarChange = async (e) => {
 const file = e.target.files[0];
 if (!file) return;

 const formData = new FormData();
 formData.append("avatar", file);

 try {
 const { data } = await api.post("/users/me/avatar", formData, {
 headers: { "Content-Type": "multipart/form-data" }
 });
 if (data.success) {
 setProfile({ ...profile, avatar: data.data.avatar });
 toast.success("Cập nhật ảnh đại diện thành công!");
 }
 } catch (error) {
 toast.error("Lỗi upload ảnh");
 }
 };

 const handleCoverChange = async (e) => {
 const file = e.target.files[0];
 if (!file) return;

 const formData = new FormData();
 formData.append("coverImage", file);

 try {
 const { data } = await api.post("/users/me/cover", formData, {
 headers: { "Content-Type": "multipart/form-data" }
 });
 if (data.success) {
 setProfile({ ...profile, coverImage: data.data.coverImage });
 toast.success("Cập nhật ảnh bìa thành công!");
 }
 } catch (error) {
 toast.error("Lỗi upload ảnh bìa");
 }
 };

 const handleCheckIn = () => {
 if (!navigator.geolocation) {
 toast.error("Trình duyệt không hỗ trợ định vị");
 return;
 }
 setLocationLoading(true);
 navigator.geolocation.getCurrentPosition(
 async (position) => {
 try {
 const lat = position.coords.latitude;
 const lng = position.coords.longitude;
 
 // Reverse Geocoding using OpenStreetMap Nominatim
 let addressName = "Tọa độ GPS (Không xác định được địa chỉ)";
 try {
 const geocodeRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
 if (geocodeRes.ok) {
 const geocodeData = await geocodeRes.json();
 addressName = geocodeData.display_name || addressName;
 }
 } catch (e) {
 console.warn("Lỗi khi reverse geocoding:", e);
 }

 const res = await api.put("/users/me/location", { lat, lng, address: addressName });
 if (res.data.success) {
 setProfile({ ...profile, lastLocation: res.data.data.lastLocation });
 toast.success("Check-in vị trí thành công!");
 }
 } catch (error) {
 toast.error("Lỗi cập nhật vị trí lên server");
 } finally {
 setLocationLoading(false);
 }
 },
 (error) => {
 setLocationLoading(false);
 toast.error("Bạn đã từ chối cấp quyền định vị hoặc có lỗi xảy ra.");
 }
 );
 };

 const toggle2FA = async () => {
 try {
 // Vì là Admin nên ta có thể call API /users/:id/2fa
 const res = await api.put(`/users/${authUser.id}/2fa`, { is2FAEnabled: !profile.is2FAEnabled });
 if (res.data.success) {
 setProfile({ ...profile, is2FAEnabled: !profile.is2FAEnabled });
 toast.success(profile.is2FAEnabled ? "Đã tắt 2FA" : "Đã bật 2FA thành công!");
 }
 } catch (error) {
 toast.error("Lỗi cài đặt 2FA");
 }
 };

 // Tính phần trăm Profile
 const calculateProgress = () => {
 let score = 0;
 if (profile.name) score += 20;
 if (profile.phone) score += 20;
 if (profile.bio) score += 20;
 if (profile.avatar) score += 20;
 if (profile.skills.length > 0) score += 20;
 return score;
 };

 return (
 <div className="max-w-7xl mx-auto pb-12 space-y-8">
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-3xl font-bold text-idaz-black mb-2 tracking-tight">Hồ sơ cá nhân</h1>
 <p className="text-gray-400">Quản lý thông tin, chuyên môn và bảo mật tài khoản.</p>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
 {/* Left Column: Avatar & Quick Info */}
 <div className="space-y-6">
 <div className="glass-panel border border-white/40 rounded-3xl p-8 text-center shadow-xl relative overflow-hidden group">
 {profile.coverImage ? (
 <img src={profile.coverImage} className="absolute top-0 left-0 w-full h-32 object-cover opacity-50" alt="Cover" />
 ) : (
 <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-indigo-600/20 to-purple-600/20"></div>
 )}
 
 <label className="absolute top-4 right-4 bg-white/50 hover:bg-white/80 text-idaz-black p-2 rounded-3xl cursor-pointer transition-colors backdrop-blur-md opacity-0 group-hover:opacity-100 border border-white/60 z-20">
 <Camera size={16} />
 <input type="file" className="hidden" accept="image/*" onChange={handleCoverChange} />
 </label>

 <div className="relative z-10 pt-4">
 <div className="relative w-32 h-32 mx-auto mb-6 group">
 <div className="w-full h-full rounded-full bg-gray-100 border-4 border-zinc-900 overflow-hidden shadow-2xl">
 {profile.avatar ? (
 <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
 ) : (
 <UserIcon size={64} className="text-gray-500 m-auto mt-6" />
 )}
 </div>
 <label className="absolute bottom-0 right-0 bg-indigo-600 hover:bg-indigo-500 text-idaz-black p-2 rounded-full cursor-pointer transition-colors shadow-lg border border-white/60">
 <Camera size={20} />
 <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
 </label>
 </div>

 <h2 className="text-2xl font-bold text-idaz-black mb-1">{profile.name}</h2>
 <p className="text-indigo-400 font-medium mb-2 capitalize">{profile.role}</p>
 
 <div className="mb-6 flex justify-center items-center gap-2">
 <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
 <input 
 type="text" 
 value={profile.statusText} 
 onChange={e => setProfile({...profile, statusText: e.target.value})} 
 onBlur={handleUpdateProfile} // Tự động lưu khi bấm ra ngoài
 className="bg-transparent border-b border-transparent hover:border-gray-300 focus:border-indigo-500 focus:outline-none text-gray-400 text-sm text-center max-w-[150px] transition-colors"
 placeholder="Cập nhật trạng thái..."
 />
 </div>

 <div className="mb-6 text-left">
 <div className="flex justify-between text-sm text-gray-400 mb-2">
 <span>Hoàn thiện hồ sơ</span>
 <span className="font-bold text-idaz-black">{calculateProgress()}%</span>
 </div>
 <div className="w-full bg-gray-100 rounded-full h-2">
 <div className="bg-indigo-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${calculateProgress()}%` }}></div>
 </div>
 </div>

 <div className="flex justify-center gap-3">
 <a href={profile.socialLinks.linkedin || '#'} target="_blank" className="p-3 bg-gray-100 hover:bg-gray-700 rounded-3xl text-gray-400 hover:text-idaz-black transition-colors">
 <Linkedin size={20} />
 </a>
 <a href={profile.socialLinks.facebook || '#'} target="_blank" className="p-3 bg-gray-100 hover:bg-gray-700 rounded-3xl text-gray-400 hover:text-idaz-black transition-colors">
 <Twitter size={20} />
 </a>
 <a href={profile.socialLinks.portfolio || '#'} target="_blank" className="p-3 bg-gray-100 hover:bg-gray-700 rounded-3xl text-gray-400 hover:text-idaz-black transition-colors">
 <Github size={20} />
 </a>
 </div>
 </div>
 </div>

 {/* Location & Check-in */}
 <div className="glass-panel border border-white/40 rounded-3xl p-6 shadow-xl flex flex-col h-auto">
 <div className="flex-1">
 <h3 className="text-lg font-bold text-idaz-black mb-4 flex items-center gap-2">
 <MapPin className="text-rose-500" /> Vị trí hiện tại
 </h3>
 {profile.lastLocation ? (
 <div className="bg-rose-500/10 border border-rose-500/20 rounded-3xl p-4 mb-4">
 <p className="text-xs text-rose-400 font-medium mb-2">Cập nhật lúc: {new Date(profile.lastLocation.updatedAt).toLocaleString('vi-VN')}</p>
 
 {/* Address Text */}
 <p className="text-idaz-black text-sm font-medium mb-3 line-clamp-2" title={profile.lastLocation.address}>
 {profile.lastLocation.address || 'Không xác định địa chỉ'}
 </p>
 
 {/* Embedded Map */}
 <div className="w-full h-40 rounded-3xl overflow-hidden border border-white/60 mb-3 bg-gray-100">
 <iframe 
 width="100%" 
 height="100%" 
 frameBorder="0" 
 scrolling="no" 
 marginHeight="0" 
 marginWidth="0" 
 src={`https://www.openstreetmap.org/export/embed.html?bbox=${profile.lastLocation.lng - 0.005}%2C${profile.lastLocation.lat - 0.005}%2C${profile.lastLocation.lng + 0.005}%2C${profile.lastLocation.lat + 0.005}&layer=mapnik&marker=${profile.lastLocation.lat}%2C${profile.lastLocation.lng}`}
 ></iframe>
 </div>
 
 <div className="flex items-center justify-between text-gray-400 text-xs font-mono bg-white/30 p-2 rounded-xl">
 <span>Lat: {profile.lastLocation.lat.toFixed(6)}</span>
 <span>Lng: {profile.lastLocation.lng.toFixed(6)}</span>
 </div>
 </div>
 ) : (
 <p className="text-gray-500 text-sm mb-4">Chưa có dữ liệu vị trí. Hãy Check-in để lưu lại vị trí của bạn.</p>
 )}
 </div>
 
 <button 
 onClick={handleCheckIn}
 disabled={locationLoading}
 className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-idaz-black rounded-3xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-auto shadow-[0_0_15px_rgba(225,29,72,0.3)]"
 >
 {locationLoading ? (
 <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
 ) : (
 <MapPin size={18} />
 )}
 {locationLoading ? "Đang định vị..." : "Check-in Vị trí (GPS)"}
 </button>
 </div>
 </div>

 {/* Right Column: Tabs & Forms */}
 <div className="lg:col-span-2">
 <div className="glass-panel border border-white/40 rounded-3xl overflow-hidden shadow-xl">
 <div className="flex border-b border-white/40">
 <button 
 onClick={() => setActiveTab("info")}
 className={`flex-1 py-4 font-bold text-sm transition-colors ${activeTab === 'info' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-gray-500 hover:text-gray-600'}`}
 >
 Thông tin Chung
 </button>
 <button 
 onClick={() => setActiveTab("security")}
 className={`flex-1 py-4 font-bold text-sm transition-colors ${activeTab === 'security' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-gray-500 hover:text-gray-600'}`}
 >
 Bảo mật & Mật khẩu
 </button>
 <button 
 onClick={() => setActiveTab("activity")}
 className={`flex-1 py-4 font-bold text-sm transition-colors ${activeTab === 'activity' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-gray-500 hover:text-gray-600'}`}
 >
 Nhật ký Hoạt động
 </button>
 </div>

 <div className="p-8">
 {activeTab === "info" && (
 <form onSubmit={handleUpdateProfile} className="space-y-6">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div>
 <label className="block text-sm font-medium text-gray-400 mb-2">Họ và tên</label>
 <input type="text" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} className="w-full glass-panel border border-white/60 rounded-3xl px-4 py-3 text-idaz-black focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
 </div>
 <div>
 <label className="block text-sm font-medium text-gray-400 mb-2">Số điện thoại</label>
 <input type="text" value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} className="w-full glass-panel border border-white/60 rounded-3xl px-4 py-3 text-idaz-black focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
 </div>
 </div>
 
 <div>
 <label className="block text-sm font-medium text-gray-400 mb-2">Giới thiệu bản thân</label>
 <textarea rows="3" value={profile.bio} onChange={e => setProfile({...profile, bio: e.target.value})} className="w-full glass-panel border border-white/60 rounded-3xl px-4 py-3 text-idaz-black focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none" placeholder="Một vài dòng về chuyên môn của bạn..." />
 </div>

 <div>
 <label className="block text-sm font-medium text-gray-400 mb-2">Kỹ năng chuyên môn (Nhấn Enter để thêm)</label>
 <div className="glass-panel border border-white/60 rounded-3xl p-3 flex flex-wrap gap-2 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
 {profile.skills.map((skill, idx) => (
 <span key={idx} className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-xl text-sm font-medium flex items-center gap-2">
 {skill} <button type="button" onClick={() => removeSkill(skill)} className="hover:text-indigo-100">&times;</button>
 </span>
 ))}
 <input 
 type="text" 
 value={skillInput}
 onChange={(e) => setSkillInput(e.target.value)}
 onKeyDown={handleAddSkill}
 className="bg-transparent text-idaz-black border-none focus:ring-0 flex-1 min-w-[120px] outline-none text-sm px-2 py-1"
 placeholder="Thêm kỹ năng..."
 />
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div>
 <label className="block text-sm font-medium text-gray-400 mb-2">LinkedIn URL</label>
 <input type="text" value={profile.socialLinks.linkedin} onChange={e => setProfile({...profile, socialLinks: {...profile.socialLinks, linkedin: e.target.value}})} className="w-full glass-panel border border-white/60 rounded-3xl px-4 py-3 text-idaz-black focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
 </div>
 <div>
 <label className="block text-sm font-medium text-gray-400 mb-2">Portfolio/Website</label>
 <input type="text" value={profile.socialLinks.portfolio} onChange={e => setProfile({...profile, socialLinks: {...profile.socialLinks, portfolio: e.target.value}})} className="w-full glass-panel border border-white/60 rounded-3xl px-4 py-3 text-idaz-black focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
 </div>
 </div>

 <div className="pt-4 flex justify-end">
 <button type="submit" disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-700 text-idaz-black px-8 py-3 rounded-3xl font-bold transition-all flex items-center gap-2 disabled:opacity-50">
 <Save size={20} /> Lưu Thay đổi
 </button>
 </div>
 </form>
 )}

 {activeTab === "security" && (
 <div className="space-y-8">
 {/* 2FA Section */}
 <div className="bg-idaz-gray border border-white/40 rounded-3xl p-6 flex items-center justify-between">
 <div>
 <h4 className="text-idaz-black font-bold mb-1 flex items-center gap-2">
 <ShieldCheck className="text-emerald-500" /> Xác thực 2 bước (2FA)
 </h4>
 <p className="text-sm text-gray-400">Bảo vệ tài khoản bằng mã xác thực trên ứng dụng Google Authenticator.</p>
 </div>
 <button 
 onClick={toggle2FA}
 className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${profile.is2FAEnabled ? 'bg-emerald-500' : 'bg-gray-700'}`}
 >
 <span className={`inline-block h-5 w-5 transform rounded-full glass-panel transition-transform ${profile.is2FAEnabled ? 'translate-x-8' : 'translate-x-1'}`} />
 </button>
 </div>

 <form onSubmit={handleUpdatePassword} className="space-y-6 border-t border-white/40 pt-8">
 <h3 className="text-lg font-bold text-idaz-black mb-4">Đổi Mật khẩu</h3>
 <div>
 <label className="block text-sm font-medium text-gray-400 mb-2">Mật khẩu hiện tại</label>
 <input type="password" required value={passwords.oldPassword} onChange={e => setPasswords({...passwords, oldPassword: e.target.value})} className="w-full glass-panel border border-white/60 rounded-3xl px-4 py-3 text-idaz-black focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
 </div>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div>
 <label className="block text-sm font-medium text-gray-400 mb-2">Mật khẩu mới</label>
 <input type="password" required value={passwords.newPassword} onChange={e => setPasswords({...passwords, newPassword: e.target.value})} className="w-full glass-panel border border-white/60 rounded-3xl px-4 py-3 text-idaz-black focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
 </div>
 <div>
 <label className="block text-sm font-medium text-gray-400 mb-2">Xác nhận mật khẩu mới</label>
 <input type="password" required value={passwords.confirmPassword} onChange={e => setPasswords({...passwords, confirmPassword: e.target.value})} className="w-full glass-panel border border-white/60 rounded-3xl px-4 py-3 text-idaz-black focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
 </div>
 </div>
 <div className="pt-4 flex justify-end">
 <button type="submit" disabled={isLoading} className="bg-gray-100 hover:bg-gray-700 text-idaz-black px-8 py-3 rounded-3xl font-bold transition-all flex items-center gap-2 disabled:opacity-50">
 <Lock size={20} /> Đổi Mật khẩu
 </button>
 </div>
 </form>
 </div>
 )}

 {activeTab === "activity" && (
 <div className="space-y-4">
 {profile.activityLog.length === 0 ? (
 <div className="text-center py-12 text-gray-500">Chưa có hoạt động nào được ghi lại.</div>
 ) : (
 <div className="relative border-l-2 border-zinc-800 ml-4 pl-6 space-y-8 py-4">
 {profile.activityLog.slice().reverse().map((log, idx) => (
 <div key={idx} className="relative">
 <div className="absolute -left-[35px] top-1 w-4 h-4 rounded-full bg-indigo-500 border-4 border-zinc-900"></div>
 <p className="text-idaz-black font-medium mb-1">{log.action}</p>
 <p className="text-sm text-gray-500">{new Date(log.timestamp).toLocaleString('vi-VN')}</p>
 </div>
 ))}
 </div>
 )}
 </div>
 )}
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}
