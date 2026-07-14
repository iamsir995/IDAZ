"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Mail, ArrowLeft, Loader2, Send } from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";

export default function ForgotPassword() {
 const [email, setEmail] = useState("");
 const [isLoading, setIsLoading] = useState(false);
 const [isSent, setIsSent] = useState(false);

 const handleForgotPassword = async (e) => {
 e.preventDefault();
 setIsLoading(true);
 
 try {
 const res = await api.post('/auth/forgotpassword', { email });
 if (res.data.success) {
 setIsSent(true);
 toast.success("Đã gửi link khôi phục mật khẩu. Vui lòng kiểm tra Email.");
 }
 } catch (error) {
 toast.error(error.response?.data?.message || "Lỗi gửi email");
 } finally {
 setIsLoading(false);
 }
 };

 return (
 <div className="min-h-screen bg-black flex flex-col justify-center items-center p-4 selection:bg-indigo-500/30">
 {/* Background Effects */}
 <div className="absolute inset-0 overflow-hidden pointer-events-none">
 <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-indigo-500/10 blur-[120px] rounded-full mix-blend-screen"></div>
 <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-rose-500/10 blur-[120px] rounded-full mix-blend-screen"></div>
 </div>

 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 className="w-full max-w-md relative z-10"
 >
 <div className="bg-zinc-950 border border-white/10 rounded-[2rem] p-8 shadow-2xl backdrop-blur-xl">
 <div className="text-center mb-8">
 <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Quên Mật Khẩu</h2>
 <p className="text-slate-400 text-sm">
 Nhập email đăng ký của bạn. Chúng tôi sẽ gửi một liên kết để bạn đặt lại mật khẩu mới.
 </p>
 </div>

 {!isSent ? (
 <form className="space-y-6" onSubmit={handleForgotPassword}>
 <div>
 <label className="block text-sm font-medium text-slate-300 ml-1">
 Địa chỉ Email
 </label>
 <div className="mt-2 relative">
 <Mail className="absolute left-4 top-3.5 text-slate-500" size={20} />
 <input
 type="email"
 required
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
 placeholder="email@doanhnghiep.com"
 />
 </div>
 </div>

 <div>
 <button
 type="submit"
 disabled={isLoading}
 className="w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] disabled:opacity-70"
 >
 {isLoading ? <Loader2 className="animate-spin" size={18} /> : "Gửi liên kết"}
 {!isLoading && <Send size={18} />}
 </button>
 </div>
 </form>
 ) : (
 <div className="text-center bg-indigo-500/10 border border-indigo-500/20 p-6 rounded-2xl">
 <Mail className="mx-auto text-indigo-400 mb-4" size={40} />
 <h3 className="text-lg font-bold text-white mb-2">Đã gửi Email!</h3>
 <p className="text-sm text-slate-400">
 Hãy kiểm tra hòm thư của <strong>{email}</strong> và click vào liên kết để đổi mật khẩu nhé.
 </p>
 </div>
 )}

 <div className="mt-8 text-center border-t border-white/5 pt-6">
 <Link
 href="/login"
 className="text-sm font-medium text-slate-400 hover:text-white transition-colors inline-flex items-center gap-2"
 >
 <ArrowLeft size={16} /> Quay lại Đăng nhập
 </Link>
 </div>
 </div>
 </motion.div>
 </div>
 );
}
