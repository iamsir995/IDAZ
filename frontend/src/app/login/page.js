"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Mail, Lock, ArrowRight, Loader2, ShieldCheck, KeyRound } from "lucide-react";
import { GoogleLogin } from '@react-oauth/google';
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1); // 1: Email/Pass, 2: OTP
  const [isLoading, setIsLoading] = useState(false);
  const [googleClientId, setGoogleClientId] = useState("");
  const { user, loading, login, verify2FA } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Fetch public settings for Google Client ID
    api.get('/settings').then(res => {
      if (res.data?.success && res.data?.data?.googleClientId) {
        setGoogleClientId(res.data.data.googleClientId);
      }
    }).catch(console.error);
  }, []);

  // Tự động chuyển hướng nếu đã đăng nhập
  useEffect(() => {
    if (!loading && user) {
      if (['superadmin', 'admin', 'manager', 'developer', 'designer', 'account', 'copywriter', 'marketing', 'sales'].includes(user.role)) {
        router.push('/admin/crm');
      } else {
        router.push('/client');
      }
    }
  }, [user, loading, router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    const res = await login(email, password);
    setIsLoading(false);
    
    if (res?.success) {
      if (res.require2FA) {
        toast.success(res.message);
        if (res.devNote) {
          toast.custom((t) => (
            <div className="bg-slate-800 text-white p-4 rounded-xl shadow-2xl border border-rose-500/50">
              <h4 className="font-bold text-rose-400 mb-1">Môi trường Dev</h4>
              <p className="text-sm">{res.devNote}</p>
            </div>
          ), { duration: 10000 });
        }
        setStep(2);
      } else {
        toast.success("Đăng nhập thành công!");
        if (['superadmin', 'admin', 'manager', 'developer', 'designer', 'account', 'copywriter', 'marketing', 'sales'].includes(res.data?.role)) router.push("/admin/crm");
        else router.push("/client");
      }
    } else {
      toast.error(res?.message || "Lỗi đăng nhập");
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/google', { token: credentialResponse.credential });
      setIsLoading(false);
      if (res.data.success) {
        toast.success("Đăng nhập Google thành công!");
        if (['superadmin', 'admin', 'manager', 'developer', 'designer', 'account', 'copywriter', 'marketing', 'sales'].includes(res.data.user.role)) router.push("/admin/crm");
        else router.push("/client");
      }
    } catch (err) {
      setIsLoading(false);
      toast.error("Lỗi xác thực Google");
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    const res = await verify2FA(email, otp);
    setIsLoading(false);
    
    if (res?.success) {
      toast.success("Xác thực 2FA thành công!");
    } else {
      toast.error(res?.message || "Mã OTP không đúng");
    }
  };

  return (
    <main className="min-h-screen bg-mesh-light flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans selection:bg-idaz-orange/30">
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 text-center mt-4 sm:mt-0">
        <Link href="/" className="font-bold text-4xl tracking-tighter text-idaz-black hover:opacity-80 transition-opacity flex justify-center items-center gap-2">
          IDAZ<span className="text-idaz-orange">.</span>
        </Link>
        <h2 className="mt-4 sm:mt-6 text-center text-2xl sm:text-3xl font-extrabold text-idaz-black">
          Cổng Khách Hàng
        </h2>
        <p className="mt-2 text-center text-sm text-gray-500">
          {step === 1 ? "Đăng nhập để quản lý dự án và thanh toán" : "Hệ thống đã gửi mã OTP gồm 6 chữ số qua Email."}
        </p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mt-6 sm:mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10"
      >
        <div className="glass-card py-6 px-4 sm:py-8 sm:rounded-[2rem] sm:px-10 border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.04)]">
          
          {step === 1 ? (
            <form className="space-y-6" onSubmit={handleLogin}>
              <div>
                <label htmlFor="login-email" className="block text-sm font-bold text-gray-700 ml-1 mb-2">
                  Email / Tài khoản
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 text-gray-400" size={20} />
                  <input
                    id="login-email"
                    name="username"
                    type="email"
                    autoComplete="username"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full glass-panel border border-white/60 rounded-2xl py-3 pl-12 pr-4 text-idaz-black placeholder-gray-400 focus:outline-none focus:border-idaz-orange focus:ring-1 focus:ring-idaz-orange transition-all shadow-inner"
                    placeholder="email@doanhnghiep.com"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between ml-1 mb-2">
                  <label htmlFor="login-password" className="block text-sm font-bold text-gray-700">
                    Mật khẩu
                  </label>
                  <Link href="/forgot-password" className="text-sm font-bold text-idaz-orange hover:text-idaz-orange-dark transition-colors">
                    Quên mật khẩu?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 text-gray-400" size={20} />
                  <input
                    id="login-password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
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
                  {isLoading ? <Loader2 className="animate-spin" size={18} /> : "Tiếp tục"}
                  {!isLoading && <ArrowRight size={18} />}
                </button>
              </div>

              {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID !== 'mock_client_id' && (
                <>
                  <div className="relative mt-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-3 glass-panel rounded-full text-gray-500 font-medium">Hoặc tiếp tục với</span>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-center">
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={() => toast.error('Google Login Failed')}
                      theme="outline"
                      shape="pill"
                      text="continue_with"
                    />
                  </div>
                </>
              )}

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Chưa có tài khoản?{" "}
                  <Link href="/register" className="font-bold text-idaz-orange hover:text-idaz-orange-dark transition-colors">
                    Đăng ký ngay
                  </Link>
                </p>
              </div>
            </form>
          ) : (
            <form className="space-y-6" onSubmit={handleVerifyOTP}>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck size={32} className="text-emerald-500" />
                </div>
                <h3 className="text-lg font-bold text-idaz-black">Xác thực 2 bước (2FA)</h3>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 ml-1 mb-2 text-center">
                  Nhập mã OTP 6 số từ Email
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-3.5 text-gray-400" size={20} />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full glass-panel border border-white/60 rounded-2xl py-3 pl-12 pr-4 text-idaz-black placeholder-gray-300 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono tracking-[0.5em] text-center text-2xl shadow-inner"
                    placeholder="------"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading || otp.length !== 6}
                  className="w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent rounded-3xl shadow-sm text-base font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none transition-all shadow-[0_4px_15px_rgba(16,185,129,0.3)] disabled:opacity-70"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={18} /> : "Xác minh & Đăng nhập"}
                </button>
                <button 
                  type="button" 
                  onClick={() => setStep(1)}
                  className="w-full mt-4 py-3 text-sm font-bold text-gray-500 hover:text-idaz-black transition-colors"
                >
                  Quay lại
                </button>
              </div>
            </form>
          )}

        </div>
      </motion.div>
    </main>
  );
}
