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
    <main className="min-h-screen bg-mesh-light flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans selection:bg-idaz-orange/30">
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 text-center mt-4 sm:mt-0">
        <Link href="/" className="font-bold text-4xl tracking-tighter text-idaz-black hover:opacity-80 transition-opacity flex justify-center items-center gap-2">
          IDAZ<span className="text-idaz-orange">.</span>
        </Link>
        <h2 className="mt-4 sm:mt-6 text-center text-2xl sm:text-3xl font-extrabold text-idaz-black">
          Bắt đầu Dự án mới
        </h2>
        <p className="mt-2 text-center text-sm text-gray-500">
          Tạo tài khoản chỉ trong 30 giây để quản lý dự án
        </p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mt-6 sm:mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10"
      >
        <div className="glass-card py-6 px-4 sm:py-8 sm:rounded-[2rem] sm:px-10 border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.04)]">
          <form className="space-y-6" onSubmit={handleRegister}>
            <div>
              <label className="block text-sm font-bold text-gray-700 ml-1 mb-2">
                Họ và Tên
              </label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-3.5 text-gray-400" size={20} />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full glass-panel border border-white/60 rounded-2xl py-3 pl-12 pr-4 text-idaz-black placeholder-gray-400 focus:outline-none focus:border-idaz-orange focus:ring-1 focus:ring-idaz-orange transition-all shadow-inner"
                  placeholder="Nguyễn Văn A"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 ml-1 mb-2">
                Email / Tài khoản
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 text-gray-400" size={20} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full glass-panel border border-white/60 rounded-2xl py-3 pl-12 pr-4 text-idaz-black placeholder-gray-400 focus:outline-none focus:border-idaz-orange focus:ring-1 focus:ring-idaz-orange transition-all shadow-inner"
                  placeholder="email@doanhnghiep.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 ml-1 mb-2">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 text-gray-400" size={20} />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full glass-panel border border-white/60 rounded-2xl py-3 pl-12 pr-4 text-idaz-black placeholder-gray-400 focus:outline-none focus:border-idaz-orange focus:ring-1 focus:ring-idaz-orange transition-all shadow-inner"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent rounded-3xl shadow-sm text-base font-bold text-white bg-idaz-orange hover:bg-idaz-orange-dark focus:outline-none transition-all shadow-[0_4px_15px_rgba(245,166,35,0.3)] disabled:opacity-70"
              >
                {isLoading ? <Loader2 className="animate-spin" size={18} /> : "Tạo Tài Khoản"}
                {!isLoading && <ArrowRight size={18} />}
              </button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Đã có tài khoản?{" "}
                <Link href="/login" className="font-bold text-idaz-orange hover:text-idaz-orange-dark transition-colors">
                  Đăng nhập
                </Link>
              </p>
            </div>
          </form>
        </div>
      </motion.div>
    </main>
  );
}
