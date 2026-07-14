"use client";

import { useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

export default function ErrorBoundary({ error, reset }) {
  useEffect(() => {
    // In ra console log để dev debug
    console.error("Caught by ErrorBoundary:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-idaz-gray flex items-center justify-center p-4">
      <div className="glass-card max-w-lg w-full rounded-3xl p-10 text-center relative overflow-hidden border border-white/60 shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 translate-y-1/3 -translate-x-1/3"></div>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
          className="relative z-10 flex flex-col items-center"
        >
          <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <AlertTriangle size={40} className="text-rose-500" />
          </div>
          
          <h1 className="text-2xl font-bold text-idaz-black mb-3">Đã xảy ra sự cố!</h1>
          
          <div className="bg-white/50 border border-white/60 rounded-2xl p-4 mb-8 w-full">
            <p className="text-sm text-gray-600 break-words font-mono text-left">
              {error.message || "Lỗi không xác định."}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center w-full">
            <button 
              onClick={() => reset()}
              className="flex-1 px-6 py-3 rounded-3xl font-bold text-white bg-idaz-black hover:bg-gray-800 shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw size={18} /> Thử lại
            </button>
            <Link 
              href="/"
              className="flex-1 px-6 py-3 rounded-3xl font-bold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <Home size={18} /> Trang chủ
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
