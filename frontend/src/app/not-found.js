"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-idaz-gray flex items-center justify-center p-4">
      <div className="glass-card max-w-lg w-full rounded-3xl p-10 text-center relative overflow-hidden border border-white/60 shadow-2xl">
        {/* Background blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-idaz-orange-light rounded-full mix-blend-multiply filter blur-3xl opacity-30 -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 translate-y-1/3 -translate-x-1/3"></div>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
          className="relative z-10"
        >
          <h1 className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-idaz-orange to-rose-500 tracking-tighter mb-4">
            404
          </h1>
          <h2 className="text-2xl font-bold text-idaz-black mb-4">Trang không tồn tại</h2>
          <p className="text-gray-500 mb-8 max-w-sm mx-auto leading-relaxed">
            Có vẻ như bạn đã đi lạc. Đường dẫn bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => window.history.back()}
              className="px-6 py-3 rounded-3xl font-bold text-gray-600 bg-white/50 hover:bg-white border border-white/60 shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft size={18} /> Quay lại
            </button>
            <Link 
              href="/"
              className="px-6 py-3 rounded-3xl font-bold text-white bg-idaz-orange hover:bg-idaz-orange-dark shadow-lg shadow-idaz-orange/30 transition-all flex items-center justify-center gap-2"
            >
              <Home size={18} /> Về Trang chủ
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
