"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Phone, Mail, MapPin, Send, CheckCircle, ArrowRight } from "lucide-react";

const SERVICES = [
  "Thiết kế Logo & Bộ nhận diện",
  "Thiết kế Website / Ứng dụng",
  "Quản trị Fanpage & Content",
  "Sản xuất Video / Media",
  "Chiến lược Marketing",
  "Khác",
];

function InputField({ name, label, type = "text", required, form, setForm, errors }) {
  const hasError = !!errors[name];
  return (
    <div>
      <label htmlFor={name} className="block text-footnote font-semibold text-[#424245] mb-2 uppercase tracking-wider">
        {label} {required && <span className="text-[#F5A623]">*</span>}
      </label>
      <input
        id={name}
        type={type}
        value={form[name]}
        onChange={(e) => setForm({ ...form, [name]: e.target.value })}
        placeholder={`Nhập ${label.toLowerCase()}...`}
        aria-invalid={hasError}
        className={`w-full px-4 py-3.5 rounded-[12px] text-subheadline text-[#1D1D1F] placeholder:text-[#C7C7CC] border bg-white outline-none transition-all duration-200 focus:ring-2 focus:ring-[rgba(245,166,35,0.3)] focus:border-[#F5A623] ${
          hasError ? "border-red-400 bg-red-50" : "border-[#D2D2D7] hover:border-[#A0A0A5]"
        }`}
      />
      {hasError && <p className="text-caption-1 text-red-500 font-medium mt-1.5">{errors[name]}</p>}
    </div>
  );
}

function SelectField({ name, label, options, form, setForm }) {
  return (
    <div>
      <label htmlFor={name} className="block text-footnote font-semibold text-[#424245] mb-2 uppercase tracking-wider">
        {label}
      </label>
      <select
        id={name}
        value={form[name]}
        onChange={(e) => setForm({ ...form, [name]: e.target.value })}
        className="w-full px-4 py-3.5 rounded-[12px] text-subheadline text-[#1D1D1F] border border-[#D2D2D7] bg-white outline-none transition-all duration-200 focus:ring-2 focus:ring-[rgba(245,166,35,0.3)] focus:border-[#F5A623] hover:border-[#A0A0A5] appearance-none cursor-pointer"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2386868B' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 16px center" }}
      >
        <option value="">-- Chọn dịch vụ quan tâm --</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function TextareaField({ name, label, form, setForm, errors }) {
  const hasError = !!errors[name];
  return (
    <div>
      <label htmlFor={name} className="block text-footnote font-semibold text-[#424245] mb-2 uppercase tracking-wider">
        {label}
      </label>
      <textarea
        id={name}
        rows={4}
        value={form[name]}
        onChange={(e) => setForm({ ...form, [name]: e.target.value })}
        placeholder="Mô tả ngắn về dự án của bạn..."
        className={`w-full px-4 py-3.5 rounded-[12px] text-subheadline text-[#1D1D1F] placeholder:text-[#C7C7CC] border bg-white outline-none transition-all duration-200 focus:ring-2 focus:ring-[rgba(245,166,35,0.3)] focus:border-[#F5A623] resize-none ${
          hasError ? "border-red-400" : "border-[#D2D2D7] hover:border-[#A0A0A5]"
        }`}
      />
    </div>
  );
}

export default function ContactSection() {
  const [form, setForm] = useState({ name: "", phone: "", email: "", service: "", message: "" });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Vui lòng nhập họ và tên";
    if (!form.phone.trim()) e.phone = "Vui lòng nhập số điện thoại";
    else if (!/^[0-9]{9,11}$/.test(form.phone.replace(/\s/g, ""))) e.phone = "Số điện thoại không hợp lệ";
    if (!form.email.trim()) e.email = "Vui lòng nhập email";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Email không đúng định dạng";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <section id="contact" className="py-20 md:py-28 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-10 pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(245,166,35,0.4) 0%, transparent 70%)" }}
      />
      <div className="max-w-7xl mx-auto px-5 md:px-8 w-full relative z-10">
        <div className="grid lg:grid-cols-[1fr_520px] xl:grid-cols-[1fr_560px] gap-12 lg:gap-16">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }} className="flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 text-caption-1 font-bold tracking-[0.15em] uppercase text-[#F5A623] mb-5">
              <span className="w-6 h-px bg-[#F5A623]" /> Liên hệ
            </div>
            <h2 className="font-display font-black text-[#1D1D1F] mb-6 tracking-[-0.025em] leading-[1.0]" style={{ fontSize: "clamp(2.2rem, 4vw, 3.5rem)" }}>
              Sẵn sàng nâng tầm <br className="hidden md:block" />
              <span style={{ color: "var(--color-idaz-orange)" }}>thương hiệu?</span>
            </h2>
            <p className="text-[#6E6E73] text-callout leading-relaxed mb-10">
              Hãy để lại thông tin — đội ngũ IDAZ sẽ liên hệ tư vấn miễn phí trong vòng 2 giờ làm việc.
            </p>
            <div className="space-y-5 mb-10">
              {[
                { icon: Phone, label: "Hotline", value: "031 884 5312", href: "tel:0318845312" },
                { icon: Mail, label: "Email", value: "contact@idaz.com.vn", href: "mailto:contact@idaz.com.vn" },
                { icon: MapPin, label: "Văn phòng", value: "TP. Hồ Chí Minh, Việt Nam", href: "#" },
              ].map(({ icon: Icon, label, value, href }) => (
                <a key={label} href={href} className="flex items-center gap-4 group">
                  <div className="w-11 h-11 rounded-[13px] flex items-center justify-center flex-shrink-0 transition-colors duration-300 group-hover:bg-[#F5A623] border border-[#F5A623]/20 bg-[#F5A623]/10">
                    <Icon size={20} className="text-[#F5A623] group-hover:text-white transition-colors duration-300" strokeWidth={1.8} />
                  </div>
                  <div>
                    <div className="text-caption-2 text-[#86868B] font-semibold uppercase tracking-wider mb-0.5">{label}</div>
                    <div className="text-subheadline font-semibold text-[#1D1D1F] group-hover:text-[#F5A623] transition-colors duration-200">{value}</div>
                  </div>
                </a>
              ))}
            </div>
            <div className="glass-panel rounded-[16px] p-5 border border-white/80">
              <div className="text-caption-1 font-bold uppercase tracking-wider text-[#86868B] mb-3">Giờ làm việc</div>
              <div className="space-y-2">
                <div className="flex justify-between text-footnote">
                  <span className="text-[#6E6E73] font-normal">Thứ 2 – Thứ 6</span>
                  <span className="text-[#1D1D1F] font-semibold">8:00 – 17:30</span>
                </div>
                <div className="flex justify-between text-footnote">
                  <span className="text-[#6E6E73] font-normal">Thứ 7</span>
                  <span className="text-[#1D1D1F] font-semibold">8:00 – 12:00</span>
                </div>
              </div>
            </div>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.15, ease: [0.4, 0, 0.2, 1] }}>
            {submitted ? (
              <div className="bg-white rounded-[24px] p-10 text-center h-full flex flex-col items-center justify-center min-h-[400px] border border-black/5 shadow-sm">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 bg-emerald-100/50">
                  <CheckCircle size={40} className="text-emerald-500" />
                </div>
                <h3 className="font-display font-black text-[#1D1D1F] text-title-2 mb-3 tracking-tight">Gửi thành công! 🎉</h3>
                <p className="text-[#6E6E73] leading-relaxed font-normal">Cảm ơn bạn đã liên hệ. Đội ngũ IDAZ sẽ phản hồi trong vòng 2 giờ làm việc.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white rounded-[24px] p-7 md:p-9 flex flex-col gap-5 border border-black/5 shadow-sm" noValidate>
                <div>
                  <h3 className="font-display font-black text-[#1D1D1F] text-title-3 tracking-tight mb-1">Điền thông tin tư vấn</h3>
                  <p className="text-footnote text-[#86868B]">Chúng tôi sẽ liên hệ lại trong 2 giờ làm việc</p>
                </div>
                <div className="h-px bg-[rgba(0,0,0,0.06)]" />
                <div className="grid sm:grid-cols-2 gap-4">
                  <InputField name="name" label="Họ và tên" required form={form} setForm={setForm} errors={errors} />
                  <InputField name="phone" label="Số điện thoại" required form={form} setForm={setForm} errors={errors} />
                </div>
                <InputField name="email" label="Email" type="email" required form={form} setForm={setForm} errors={errors} />
                <SelectField name="service" label="Dịch vụ quan tâm" options={SERVICES} form={form} setForm={setForm} />
                <TextareaField name="message" label="Lời nhắn" form={form} setForm={setForm} errors={errors} />
                <button type="submit" disabled={loading} className="flex items-center justify-center gap-2.5 py-4 rounded-full text-subheadline font-bold transition-all duration-300 hover:shadow-[0_8px_24px_rgba(245,166,35,0.35)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed" style={{ background: "var(--color-idaz-orange)", color: "#1D1D1F" }}>
                  {loading ? (
                    <><span className="w-5 h-5 border-2 border-[rgba(29,29,31,0.3)] border-t-[#1D1D1F] rounded-full animate-spin" />Đang gửi...</>
                  ) : (
                    <><Send size={17} strokeWidth={2} />Gửi yêu cầu tư vấn</>
                  )}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
