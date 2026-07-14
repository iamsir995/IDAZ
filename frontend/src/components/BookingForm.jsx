"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, User, Mail, MessageSquare } from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";

export default function BookingForm() {
  const [formData, setFormData] = useState({ name: '', email: '', date: '', time: '', message: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/bookings', formData);
      if (res.data.success) {
        toast.success("Đặt lịch thành công! Chúng tôi sẽ liên hệ sớm.");
        setFormData({ name: '', email: '', date: '', time: '', message: '' });
      }
    } catch {
      toast.error("Lỗi gửi đặt lịch. Vui lòng thử lại sau.");
    }
  };

  return (
    <section id="booking" className="py-24 px-6 bg-slate-950 relative border-t border-white/40">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-idaz-black">Bắt đầu câu chuyện thương hiệu</h2>
          <p className="text-gray-400">Đặt lịch hẹn tư vấn miễn phí 1:1 với chuyên gia của chúng tôi</p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white/5 border border-white/60 rounded-3xl p-8 md:p-12 backdrop-blur-sm"
        >
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Name */}
              <div className="space-y-2">
                <label className="text-sm text-slate-300 font-medium ml-1">Họ và tên</label>
                <div className="relative">
                  <User className="absolute left-4 top-3.5 text-gray-500" size={20} />
                  <input 
                    type="text" 
                    className="w-full bg-idaz-black/50 border border-white/60 rounded-2xl py-3 pl-12 pr-4 text-idaz-black placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    placeholder="Nguyễn Văn A"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm text-slate-300 font-medium ml-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 text-gray-500" size={20} />
                  <input 
                    type="email" 
                    className="w-full bg-idaz-black/50 border border-white/60 rounded-2xl py-3 pl-12 pr-4 text-idaz-black placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    placeholder="email@doanhnghiep.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Date */}
              <div className="space-y-2">
                <label className="text-sm text-slate-300 font-medium ml-1">Ngày tư vấn (Dự kiến)</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-3.5 text-gray-500" size={20} />
                  <input 
                    type="date" 
                    className="w-full bg-idaz-black/50 border border-white/60 rounded-2xl py-3 pl-12 pr-4 text-idaz-black focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all [color-scheme:dark]"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              {/* Time */}
              <div className="space-y-2">
                <label className="text-sm text-slate-300 font-medium ml-1">Khung giờ</label>
                <div className="relative">
                  <Clock className="absolute left-4 top-3.5 text-gray-500" size={20} />
                  <select 
                    className="w-full bg-idaz-black/50 border border-white/60 rounded-2xl py-3 pl-12 pr-4 text-idaz-black appearance-none focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    value={formData.time}
                    onChange={(e) => setFormData({...formData, time: e.target.value})}
                    required
                  >
                    <option value="">Chọn khung giờ...</option>
                    <option value="morning">Sáng (09:00 - 11:30)</option>
                    <option value="afternoon">Chiều (14:00 - 17:00)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <label className="text-sm text-slate-300 font-medium ml-1">Mô tả ngắn về dự án của bạn</label>
              <div className="relative">
                <MessageSquare className="absolute left-4 top-3.5 text-gray-500" size={20} />
                <textarea 
                  rows="4"
                  className="w-full bg-idaz-black/50 border border-white/60 rounded-2xl py-3 pl-12 pr-4 text-idaz-black placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
                  placeholder="Website thương mại điện tử, Logo cho quán cafe..."
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                ></textarea>
              </div>
            </div>

            {/* Submit */}
            <button type="submit" className="w-full py-4 bg-idaz-orange hover:bg-idaz-orange-dark text-idaz-black font-bold rounded-2xl transition-colors shadow-[0_0_20px_rgba(79,70,229,0.3)]">
              Xác nhận Đặt lịch
            </button>
          </form>
        </motion.div>
      </div>
    </section>
  );
}
