"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Mail, Lock, User as UserIcon, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function Register() {
 const [name, setName] = useState("");
 const [email, setEmail] = useState("");
 const [password, setPassword] = useState("");
 const [isLoading, setIsLoading] = useState(false);
 const { register, login } = useAuth();
 const router = useRouter();

 const handleRegister = async (e) => {
 e.preventDefault();
 setIsLoading(true);
 
 // Đăng ký
 const res = await register(name, email, password);
 
 if (res?.success) {
 toast.success("Khởi tạo tài khoản thành công!");
 // Đăng ký xong tự động login luôn cho tiện (Bỏ qua 2FA vì mặc định người mới tắt)
 const loginRes = await login(email, password);
 setIsLoading(false);
 
 if (loginRes?.success && !loginRes?.require2FA) {
 toast.success("Tự động đăng nhập thành công!");
 router.push("/client");
 } else {
 router.push("/login");
 }
 } else {
 setIsLoading(false);
 toast.error(res?.message || "Lỗi đăng ký");
 }
 };

 return (
 <main className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans selection:bg-rose-500/30">
 <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-rose-900/20 via-slate-950 to-slate-950 -z-10" />

 <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 text-center">
 <Link href="/" className="font-bold text-4xl tracking-tighter text-white hover:opacity-80 transition-opacity flex justify-center items-center gap-2">
 Agency<span className="text-rose-500">.</span> <Sparkles className="text-rose-400" size={24} />
 </Link>
 <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
 Bắt đầu Dự án mới
 </h2>
 <p className="mt-2 text-center text-sm text-slate-400">
 Tạo tài khoản chỉ trong 30 giây để quản lý dự án
 </p>
 </div>

 <motion.div 
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.5 }}
 className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10"
 >
 <div className="bg-white/5 border border-white/10 py-8 px-4 shadow-[0_0_40px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:rounded-3xl sm:px-10">
 <form className="space-y-6" onSubmit={handleRegister}>
 <div>
 <label className="block text-sm font-medium text-slate-300 ml-1">
 Họ và Tên
 </label>
 <div className="mt-2 relative">
 <UserIcon className="absolute left-4 top-3.5 text-slate-500" size={20} />
 <input
 type="text"
 required
 value={name}
 onChange={(e) => setName(e.target.value)}
 className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
 placeholder="Nguyễn Văn A"
 />
 </div>
 </div>

 <div>
 <label className="block text-sm font-medium text-slate-300 ml-1">
 Email Doanh nghiệp
 </label>
 <div className="mt-2 relative">
 <Mail className="absolute left-4 top-3.5 text-slate-500" size={20} />
 <input
 type="email"
 required
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
 placeholder="email@doanhnghiep.com"
 />
 </div>
 </div>

 <div>
 <label className="block text-sm font-medium text-slate-300 ml-1">
 Mật khẩu
 </label>
 <div className="mt-2 relative">
 <Lock className="absolute left-4 top-3.5 text-slate-500" size={20} />
 <input
 type="password"
 required
 minLength={6}
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
 placeholder="Ít nhất 6 ký tự"
 />
 </div>
 </div>

 <div>
 <button
 type="submit"
 disabled={isLoading}
 className="w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 focus:outline-none transition-all shadow-[0_0_20px_rgba(225,29,72,0.3)] disabled:opacity-70"
 >
 {isLoading ? <Loader2 className="animate-spin" size={18} /> : "Tạo Tài Khoản"}
 {!isLoading && <ArrowRight size={18} />}
 </button>
 </div>
 </form>

 <div className="mt-8 relative">
 <div className="absolute inset-0 flex items-center">
 <div className="w-full border-t border-white/10" />
 </div>
 <div className="relative flex justify-center text-sm">
 <span className="px-4 bg-slate-950 text-slate-500 rounded-full">Đã có tài khoản?</span>
 </div>
 </div>
 
 <div className="mt-6 text-center">
 <Link href="/login" className="text-sm font-medium text-rose-400 hover:text-white transition-colors">
 Đăng nhập ngay
 </Link>
 </div>
 </div>
 </motion.div>
 </main>
 );
}
