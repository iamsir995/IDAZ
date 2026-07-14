"use client";

import { useState, useEffect } from "react";
import api from "../../../services/api";
import { Save, Palette, Image as ImageIcon, Building2, CreditCard, Wallet, Building } from "lucide-react";
import toast from "react-hot-toast";
import SHA256 from "crypto-js/sha256";

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'payment' | 'system'
  const [settings, setSettings] = useState({
    agencyName: 'Agency',
    logoUrl: '',
    primaryColor: '#4f46e5',
    paymentGateways: {
      bankTransfer: { enabled: true, accountName: '', accountNumber: '', bankCode: '', sepayWebhookKey: '' },
      vnpay: { enabled: false, tmnCode: '', hashSecret: '', url: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html' },
      momo: { enabled: false, partnerCode: '', accessKey: '', secretKey: '' }
    }
  });
  const [systemSettings, setSystemSettings] = useState({ port: 5000, mongoUri: '', adminPassword: '' });
  const [loading, setLoading] = useState(true);

  // Trạng thái hiển thị secret key
  const [showSecret, setShowSecret] = useState({
    vnpay: false,
    momo: false,
    sepay: false
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings/admin');
      if (res.data.success && res.data.data) {
        setSettings(prev => ({
          ...prev,
          agencyName: res.data.data.agencyName || 'Agency',
          logoUrl: res.data.data.logoUrl || '',
          primaryColor: res.data.data.primaryColor || '#4f46e5',
          paymentGateways: {
            ...prev.paymentGateways,
            ...res.data.data.paymentGateways
          }
        }));
      }
    } catch (error) {
      console.log(error);
    }
    
    try {
      const resSys = await api.get('/settings/system');
      if (resSys.data.success && resSys.data.data) {
        setSystemSettings({
          port: resSys.data.data.port || 5000,
          mongoUri: resSys.data.data.mongoUri || ''
        });
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (activeTab === 'system') {
      if (!systemSettings.adminPassword) {
        toast.error("Vui lòng nhập Mật khẩu Quản trị viên để lưu cấu hình hệ thống.");
        return;
      }
      try {
        const payload = {
          ...systemSettings,
          adminPassword: SHA256(systemSettings.adminPassword).toString()
        };
        const res = await api.put('/settings/system', payload);
        if (res.data.success) {
          toast.success("Cập nhật hệ thống thành công. Vui lòng restart Server (Backend) để thay đổi có hiệu lực!", { duration: 5000 });
          setSystemSettings(s => ({ ...s, adminPassword: '' })); // clear password
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Lỗi khi lưu cấu hình hệ thống");
      }
    } else {
      try {
        const res = await api.put('/settings', settings);
        if (res.data.success) {
          toast.success("Đã lưu cấu hình!");
          document.documentElement.style.setProperty('--primary-color', settings.primaryColor);
          setTimeout(() => window.location.reload(), 1000);
        }
      } catch (error) {
        toast.error("Lỗi khi lưu");
      }
    }
  };

  if (loading) return <div className="p-8 text-gray-500">Đang tải...</div>;

  return (
    <div className="max-w-5xl mx-auto py-8">
      <div className="mb-8 flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-idaz-black">Cài đặt Hệ thống</h1>
        <p className="text-gray-400">Tùy chỉnh nhận diện thương hiệu và cấu hình thanh toán tự động.</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-white/40 mb-8">
        <button 
          onClick={() => setActiveTab('general')}
          className={`pb-4 px-2 font-medium transition-colors border-b-2 ${activeTab === 'general' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-gray-500 hover:text-idaz-black'}`}
        >
          Giao diện & Thương hiệu
        </button>
        <button 
          onClick={() => setActiveTab('payment')}
          className={`pb-4 px-2 font-medium transition-colors border-b-2 ${activeTab === 'payment' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-gray-500 hover:text-idaz-black'}`}
        >
          Cổng Thanh toán
        </button>
        <button 
          onClick={() => setActiveTab('system')}
          className={`pb-4 px-2 font-medium transition-colors border-b-2 ${activeTab === 'system' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-gray-500 hover:text-idaz-black'}`}
        >
          Hệ thống (Database)
        </button>
      </div>

      <div className="bg-idaz-gray border border-white/40 rounded-3xl p-8 shadow-xl">
        <form onSubmit={handleSave} className="space-y-8">
          
          {activeTab === 'general' && (
            <div className="space-y-8 animate-in fade-in">
              {/* Tên công ty */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-idaz-black mb-3">
                  <Building2 size={18} className="text-indigo-500" /> Tên Agency / Công ty
                </label>
                <input 
                  type="text" 
                  required
                  value={settings.agencyName}
                  onChange={(e) => setSettings({...settings, agencyName: e.target.value})}
                  className="w-full glass-panel border border-white/60 rounded-3xl px-4 py-3 text-idaz-black focus:border-indigo-500 transition-colors"
                  placeholder="VD: Meta Studio"
                />
              </div>

              {/* Logo URL */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-idaz-black mb-3">
                  <ImageIcon size={18} className="text-indigo-500" /> Logo URL (Tuỳ chọn)
                </label>
                <input 
                  type="url" 
                  value={settings.logoUrl}
                  onChange={(e) => setSettings({...settings, logoUrl: e.target.value})}
                  className="w-full glass-panel border border-white/60 rounded-3xl px-4 py-3 text-idaz-black focus:border-indigo-500 transition-colors"
                  placeholder="https://example.com/logo.png"
                />
              </div>

              {/* Màu sắc */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-idaz-black mb-3">
                  <Palette size={18} className="text-indigo-500" /> Màu sắc chủ đạo (Primary Color)
                </label>
                <div className="flex items-center gap-4">
                  <input 
                    type="color" 
                    value={settings.primaryColor}
                    onChange={(e) => setSettings({...settings, primaryColor: e.target.value})}
                    className="w-14 h-14 rounded-3xl cursor-pointer bg-transparent border-0 p-0"
                  />
                  <input 
                    type="text" 
                    value={settings.primaryColor}
                    onChange={(e) => setSettings({...settings, primaryColor: e.target.value})}
                    className="flex-1 glass-panel border border-white/60 rounded-3xl px-4 py-3 text-idaz-black font-mono uppercase"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'payment' && (
            <div className="space-y-8 animate-in fade-in">
              {/* CHUYỂN KHOẢN NGÂN HÀNG */}
              <div className="p-6 border border-white/40 bg-gray-50 rounded-3xl">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-3xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                      <Building size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-idaz-black">Chuyển khoản Ngân hàng (VietQR)</h3>
                      <p className="text-xs text-gray-500">Quét mã QR để chuyển khoản thủ công</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={settings.paymentGateways.bankTransfer.enabled} onChange={(e) => setSettings(s => ({...s, paymentGateways: {...s.paymentGateways, bankTransfer: {...s.paymentGateways.bankTransfer, enabled: e.target.checked}}}))} />
                    <div className="w-11 h-6 bg-gray-100 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:glass-panel after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                  </label>
                </div>
                {settings.paymentGateways.bankTransfer.enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Tên chủ tài khoản</label>
                      <input type="text" value={settings.paymentGateways.bankTransfer.accountName} onChange={e => setSettings(s => ({...s, paymentGateways: {...s.paymentGateways, bankTransfer: {...s.paymentGateways.bankTransfer, accountName: e.target.value}}}))} className="w-full glass-panel border border-white/60 rounded-xl px-3 py-2 text-sm text-idaz-black focus:border-indigo-500" placeholder="NGUYEN VAN A" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Số tài khoản</label>
                      <input type="text" value={settings.paymentGateways.bankTransfer.accountNumber} onChange={e => setSettings(s => ({...s, paymentGateways: {...s.paymentGateways, bankTransfer: {...s.paymentGateways.bankTransfer, accountNumber: e.target.value}}}))} className="w-full glass-panel border border-white/60 rounded-xl px-3 py-2 text-sm text-idaz-black focus:border-indigo-500" placeholder="1903..." />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs text-gray-400 mb-1 block">Mã Ngân hàng (BIN hoặc Tên viết tắt VD: VCB, TCB, MB)</label>
                      <input type="text" value={settings.paymentGateways.bankTransfer.bankCode} onChange={e => setSettings(s => ({...s, paymentGateways: {...s.paymentGateways, bankTransfer: {...s.paymentGateways.bankTransfer, bankCode: e.target.value}}}))} className="w-full glass-panel border border-white/60 rounded-xl px-3 py-2 text-sm text-idaz-black focus:border-indigo-500" placeholder="TCB" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs text-gray-400 mb-1 flex justify-between">
                        <span>SePay API Key (Webhook bảo mật)</span>
                        <span className="text-indigo-400 cursor-pointer" onClick={() => setShowSecret(s => ({...s, sepay: !s.sepay}))}>{showSecret.sepay ? 'Ẩn' : 'Hiện'}</span>
                      </label>
                      <input type={showSecret.sepay ? "text" : "password"} value={settings.paymentGateways.bankTransfer.sepayWebhookKey || ''} onChange={e => setSettings(s => ({...s, paymentGateways: {...s.paymentGateways, bankTransfer: {...s.paymentGateways.bankTransfer, sepayWebhookKey: e.target.value}}}))} className="w-full glass-panel border border-white/60 rounded-xl px-3 py-2 text-sm text-idaz-black focus:border-indigo-500" placeholder="••••••••••••••••" />
                      <p className="text-[10px] text-gray-500 mt-1">Đăng ký tại SePay.vn và lấy API Key. Cấu hình Endpoint: https://domain-cua-ban/api/payments/webhook/sepay</p>
                    </div>
                  </div>
                )}
              </div>

              {/* VNPAY */}
              <div className="p-6 border border-white/40 bg-gray-50 rounded-3xl">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-3xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                      <CreditCard size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-idaz-black">VNPay Gateway</h3>
                      <p className="text-xs text-gray-500">Thanh toán tự động qua ATM/Visa/MasterCard</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={settings.paymentGateways.vnpay.enabled} onChange={(e) => setSettings(s => ({...s, paymentGateways: {...s.paymentGateways, vnpay: {...s.paymentGateways.vnpay, enabled: e.target.checked}}}))} />
                    <div className="w-11 h-6 bg-gray-100 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:glass-panel after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                  </label>
                </div>
                {settings.paymentGateways.vnpay.enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">TmnCode (Terminal ID)</label>
                      <input type="text" value={settings.paymentGateways.vnpay.tmnCode} onChange={e => setSettings(s => ({...s, paymentGateways: {...s.paymentGateways, vnpay: {...s.paymentGateways.vnpay, tmnCode: e.target.value}}}))} className="w-full glass-panel border border-white/60 rounded-xl px-3 py-2 text-sm text-idaz-black focus:border-indigo-500" placeholder="" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 flex justify-between">
                        <span>Hash Secret</span>
                        <span className="text-indigo-400 cursor-pointer" onClick={() => setShowSecret(s => ({...s, vnpay: !s.vnpay}))}>{showSecret.vnpay ? 'Ẩn' : 'Hiện'}</span>
                      </label>
                      <input type={showSecret.vnpay ? "text" : "password"} value={settings.paymentGateways.vnpay.hashSecret} onChange={e => setSettings(s => ({...s, paymentGateways: {...s.paymentGateways, vnpay: {...s.paymentGateways.vnpay, hashSecret: e.target.value}}}))} className="w-full glass-panel border border-white/60 rounded-xl px-3 py-2 text-sm text-idaz-black focus:border-indigo-500" placeholder="••••••••••••••••" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs text-gray-400 mb-1 block">Payment URL</label>
                      <input type="text" value={settings.paymentGateways.vnpay.url} onChange={e => setSettings(s => ({...s, paymentGateways: {...s.paymentGateways, vnpay: {...s.paymentGateways.vnpay, url: e.target.value}}}))} className="w-full glass-panel border border-white/60 rounded-xl px-3 py-2 text-sm text-idaz-black focus:border-indigo-500" placeholder="https://sandbox.vnpayment.vn/paymentv2/vpcpay.html" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="space-y-8 animate-in fade-in">
              <div className="p-6 border border-rose-500/30 bg-rose-50 rounded-3xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 blur-3xl rounded-full" />
                <h3 className="font-bold text-idaz-black mb-2 text-rose-600 flex items-center gap-2">
                  <Building size={20} /> Cấu hình Cốt lõi
                </h3>
                <p className="text-xs text-gray-600 mb-6 relative z-10">
                  Lưu ý: Thay đổi các thông số này sẽ can thiệp trực tiếp vào file <code>.env</code>. Sau khi lưu, bạn bắt buộc phải khởi động lại (Restart) Backend Server để áp dụng.
                </p>
                
                <div className="space-y-4 relative z-10">
                  <div>
                    <label className="text-sm font-medium text-idaz-black mb-1 block">Cổng kết nối (PORT)</label>
                    <input type="number" value={systemSettings.port} onChange={e => setSystemSettings(s => ({...s, port: e.target.value}))} className="w-full bg-white border border-rose-200 rounded-xl px-4 py-3 text-idaz-black focus:border-rose-500" placeholder="5000" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-idaz-black mb-1 block">MongoDB URI</label>
                    <input type="password" value={systemSettings.mongoUri} onChange={e => setSystemSettings(s => ({...s, mongoUri: e.target.value}))} className="w-full bg-white border border-rose-200 rounded-xl px-4 py-3 text-idaz-black focus:border-rose-500 font-mono text-sm" placeholder="mongodb+srv://..." />
                    <p className="text-xs text-gray-500 mt-2">Dùng để kết nối đến MongoDB Atlas hoặc Database Server của bạn. Để trống nếu muốn dùng Database Memory (cho dev/test).</p>
                  </div>
                  <div className="pt-4 border-t border-rose-200/50 mt-4">
                    <label className="text-sm font-bold text-rose-600 mb-1 block flex items-center gap-2">Xác thực Quyền Quản trị</label>
                    <input type="password" required={activeTab === 'system'} value={systemSettings.adminPassword} onChange={e => setSystemSettings(s => ({...s, adminPassword: e.target.value}))} className="w-full bg-white border border-rose-300 rounded-xl px-4 py-3 text-idaz-black focus:border-rose-600" placeholder="Nhập mật khẩu Admin của bạn để xác nhận thay đổi" />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="pt-6 border-t border-white/40 flex justify-end">
            <button 
              type="submit" 
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-idaz-black font-bold rounded-3xl flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20"
              style={{ backgroundColor: settings.primaryColor }}
            >
              <Save size={20} /> Lưu Cài đặt
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
