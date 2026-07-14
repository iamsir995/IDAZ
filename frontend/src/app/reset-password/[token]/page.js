"use client";

import { useState, use } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Lock, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import api from "../../../services/api";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function ResetPassword({ params }) {
 // Fix Next.js 15: params is a promise, use React.use()
 const resolvedParams = use(params);
 const token = resolvedParams.token;
 
 const [password, setPassword] = useState("");
 const [confirmPassword, setConfirmPassword] = useState("");
 const [isLoading, setIsLoading] = useState(false);
 const [isSuccess, setIsSuccess] = useState(false);
 const router = useRouter();

 const handleResetPassword = async (e) => {
 e.preventDefault();
 if (password !== confirmPassword) {
 return toast.error("Mật khẩu không khớp!");
 }
 if (password.length < 6) {
 return toast.error("Mật khẩu phải từ 6 ký tự trở lên");
 }

 setIsLoading(true);
 
 try {
 const res = await api.put(`/auth/resetpassword/${token}`, { password });
 if (res.data.success) {
 setIsSuccess(true);
 toast.success("Đổi mật khẩu thành công!");
 }
 } catch (error) {
 toast.error(error.response?.data?.message || "Token không hợp lệ hoặc đã hết hạn");
 } finally {
 setIsLoading(false);
 }
 };

 return (
 <div className="min-h-screen bg-black flex flex-col justify-center items-center p-4 selection:bg-indigo-500/30">
 {/* Background Effects */}
 <div className="absolute inset-0 overflow-hidden pointer-events-none">
 <div className="absolute top-0 right-0 w-full h-full bg-indigo-500/10 blur-[120px] rounded-full mix-blend-screen"></div>
 </div>

 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 className="w-full max-w-md relative z-10"
 >
 <div className="bg-zinc-950 border border-white/10 rounded-[2rem] p-8 shadow-2xl backdrop-blur-xl">
 <div className="text-center mb-8">
 <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Đặt Lại Mật Khẩu</h2>
 <p className="text-slate-400 text-sm">
 Vui lòng nhập mật khẩu mới của bạn.
 </p>
 </div>

 {!isSuccess ? (
 <form className="space-y-6" onSubmit={handleResetPassword}>
 <div>
 <label className="block text-sm font-medium text-slate-300 ml-1">
 Mật khẩu mới
 </label>
 <div className="mt-2 relative">
 <Lock className="absolute left-4 top-3.5 text-slate-500" size={20} />
 <input
 type="password"
 required
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
 placeholder="••••••••"
 />
 </div>
 </div>

 <div>
 <label className="block text-sm font-medium text-slate-300 ml-1">
 Xác nhận mật khẩu
 </label>
 <div className="mt-2 relative">
 <Lock className="absolute left-4 top-3.5 text-slate-500" size={20} />
 <input
 type="password"
 required
 value={confirmPassword}
 onChange={(e) => setConfirmPassword(e.target.value)}
 className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
 placeholder="••••••••"
 />
 </div>
 </div>

 <div>
 <button
 type="submit"
 disabled={isLoading}
 className="w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] disabled:opacity-70"
 >
 {isLoading ? <Loader2 className="animate-spin" size={18} /> : "Đổi mật khẩu"}
 {!isLoading && <ArrowRight size={18} />}
 </button>
 </div>
 </form>
 ) : (
 <div className="text-center bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-2xl">
 <CheckCircle2 className="mx-auto text-emerald-400 mb-4" size={40} />
 <h3 className="text-lg font-bold text-white mb-2">Thành công!</h3>
 <p className="text-sm text-slate-400 mb-6">
 Mật khẩu của bạn đã được cập nhật an toàn.
 </p>
 <Link
 href="/login"
 className="inline-block bg-white text-black font-bold px-6 py-2 rounded-xl"
 >
 Đăng nhập ngay
 </Link>
 </div>
 )}
 </div>
 </motion.div>
 </div>
 );
}
