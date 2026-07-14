"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import api from "../../services/api";
import { Lock, KeyRound, ShieldAlert, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";

export default function MasterLogin() {
 const [masterKey, setMasterKey] = useState("");
 const [isLoading, setIsLoading] = useState(false);
 const router = useRouter();

 const handleMasterLogin = async (e) => {
 e.preventDefault();
 if (!masterKey.trim()) return;

 setIsLoading(true);
 try {
 const res = await api.post("/auth/master-login", { masterKey });
 if (res.data.success) {
 localStorage.setItem("user", JSON.stringify(res.data.user));
 toast.success("Truy cập quyền quản trị tối cao thành công!", {
 icon: '👑',
 style: {
 background: '#18181b',
 color: '#fbbf24',
 border: '1px solid #fbbf24'
 }
 });
 
 // Điều hướng dựa trên vai trò
 setTimeout(() => {
 router.push(['superadmin', 'admin', 'manager', 'developer', 'designer', 'account', 'copywriter', 'marketing', 'sales'].includes(res.data.user.role) ? "/admin/crm" : "/client");
 }, 1000);
 }
 } catch (err) {
 toast.error(err.response?.data?.message || "Từ chối truy cập. Khóa không hợp lệ.");
 } finally {
 setIsLoading(false);
 }
 };

 return (
 <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
 {/* Background Effects */}
 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-900/20 blur-[120px] rounded-full pointer-events-none" />
 
 <div className="w-full max-w-md bg-zinc-950/80 backdrop-blur-2xl border border-red-500/30 p-8 rounded-3xl shadow-2xl relative z-10">
 <div className="flex flex-col items-center mb-8">
 <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-4 border border-red-500/20">
 <ShieldAlert className="text-red-500" size={32} />
 </div>
 <h1 className="text-2xl font-bold text-white tracking-tight uppercase">Cổng An Ninh Cấp Cao</h1>
 <p className="text-zinc-500 text-sm mt-2 text-center">
 Khu vực hạn chế. Yêu cầu khóa mã hóa xác thực.
 </p>
 </div>

 <form onSubmit={handleMasterLogin} className="space-y-6">
 <div className="space-y-2">
 <label className="text-xs font-bold text-red-500 uppercase tracking-wider">
 Khóa Hệ Thống (Master Key)
 </label>
 <div className="relative group">
 <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
 <KeyRound className="text-zinc-500 group-focus-within:text-red-500 transition-colors" size={20} />
 </div>
 <input
 type="password"
 value={masterKey}
 onChange={(e) => setMasterKey(e.target.value)}
 required
 className="w-full bg-black border border-zinc-800 rounded-xl py-3 pl-11 pr-4 text-white placeholder-zinc-700 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all font-mono"
 placeholder="Nhập khóa..."
 />
 </div>
 </div>

 <button
 type="submit"
 disabled={isLoading || !masterKey.trim()}
 className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-red-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2 group"
 >
 {isLoading ? (
 <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
 ) : (
 <>
 <span>Truy Cập Hệ Thống</span>
 <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
 </>
 )}
 </button>
 </form>

 <div className="mt-8 flex items-center justify-center gap-2 text-xs text-zinc-600 font-mono">
 <Lock size={12} /> Được bảo vệ bởi mã hóa SHA-256
 </div>
 </div>
 </div>
 );
}
