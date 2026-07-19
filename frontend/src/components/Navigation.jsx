"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`fixed w-full z-50 top-0 transition-all duration-300 ${scrolled ? "bg-slate-950/80 backdrop-blur-md border-b border-white/40 py-4" : "bg-transparent py-6"}`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="font-bold text-2xl tracking-tighter text-idaz-black">
          Agency<span className="text-indigo-500">.</span>
        </Link>

        {/* Menu Items */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <Link href="#services" className="hover:text-idaz-black transition-colors">Dịch vụ</Link>
          <Link href="#portfolio" className="hover:text-idaz-black transition-colors">Dự án</Link>
          {user && (
            <Link href={user.role !== 'client' ? '/admin/crm' : '/client'} className="hover:text-idaz-black transition-colors">
              {user.role !== 'client' ? 'Buồng lái Admin' : 'Client Portal'}
            </Link>
          )}
        </div>

        {/* CTA Button */}
        <div className="flex items-center gap-4">
          {!user ? (
            <>
              <Link href="/login" className="hidden sm:block text-sm font-medium text-slate-300 hover:text-idaz-black transition-colors">
                Đăng nhập
              </Link>
              <Link href="/register" className="px-6 py-2.5 bg-idaz-orange text-idaz-black text-sm font-medium rounded-full hover:bg-idaz-orange-dark transition-colors shadow-[0_0_20px_rgba(79,70,229,0.3)]">
                Bắt đầu dự án
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-idaz-orange to-idaz-orange-dark flex items-center justify-center text-idaz-black font-bold cursor-pointer overflow-hidden border border-white/60 shadow-lg">
                {user?.avatar ? (
                  <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  user?.name?.charAt(0)?.toUpperCase()
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
