import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, MapPin, Briefcase, Phone, Globe, Link, Camera, ShieldCheck, ShieldAlert } from "lucide-react";
import api from "../services/api";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

export default function ClientProfileModal({ isOpen, onClose }) {
  const { user, setUser } = useAuth();
  const [formData, setFormData] = useState({
    bio: "",
    company: "",
    phone: "",
    socialLinks: { facebook: "", linkedin: "" }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);

  useEffect(() => {
    if (isOpen && user) {
      setFormData({
        bio: user.bio || "",
        company: user.company || "",
        phone: user.phone || "",
        socialLinks: {
          facebook: user.socialLinks?.facebook || "",
          linkedin: user.socialLinks?.linkedin || ""
        }
      });
      setAvatarPreview(user.avatar || null);
    }
  }, [isOpen, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('social.')) {
      const socialKey = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        socialLinks: { ...prev.socialLinks, [socialKey]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setAvatarPreview(URL.createObjectURL(file));
    const uploadData = new FormData();
    uploadData.append('avatar', file);

    const loadId = toast.loading("Đang tải lên...");
    try {
      const res = await api.post('/users/me/avatar', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        toast.success("Cập nhật ảnh đại diện thành công", { id: loadId });
        setUser(res.data.data);
      }
    } catch (err) {
      toast.error("Lỗi khi tải ảnh lên", { id: loadId });
      setAvatarPreview(user.avatar);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await api.put('/users/me/profile', {
        name: user.name, // Keep existing
        bio: formData.bio,
        company: formData.company,
        phone: formData.phone,
        socialLinks: formData.socialLinks
      });
      
      if (res.data.success) {
        toast.success("Cập nhật hồ sơ thành công");
        setUser(res.data.data);
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi cập nhật hồ sơ");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle2FA = async () => {
    const newStatus = !user.is2FAEnabled;
    const loadId = toast.loading("Đang cập nhật bảo mật...");
    try {
      const res = await api.put('/users/me/2fa', { is2FAEnabled: newStatus });
      if (res.data.success) {
        toast.success(res.data.message, { id: loadId });
        setUser({ ...user, is2FAEnabled: newStatus });
      }
    } catch (err) {
      toast.error("Lỗi cập nhật 2FA", { id: loadId });
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-idaz-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="glass-card rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-white/40 flex justify-between items-center bg-idaz-gray shrink-0">
            <h2 className="text-xl font-bold text-idaz-black flex items-center gap-2">
              <User size={24} className="text-idaz-orange" />
              Hồ sơ Chuyên nghiệp
            </h2>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <form id="profile-form" onSubmit={handleSubmit} className="space-y-6">
              
              {/* Avatar Section */}
              <div className="flex items-center gap-6">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full bg-orange-100 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center font-bold text-3xl text-idaz-orange-dark">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      user?.name?.charAt(0)?.toUpperCase() || "U"
                    )}
                  </div>
                  <label className="absolute inset-0 bg-white/40 flex items-center justify-center text-idaz-black opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity rounded-full">
                    <Camera size={24} />
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  </label>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-idaz-black">{user?.name}</h3>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                  {user?.lastLocation && (
                    <p className="text-xs text-idaz-orange mt-1 flex items-center gap-1">
                      <MapPin size={12} /> 
                      Vị trí cập nhật lần cuối: {new Date(user.lastLocation.updatedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>

              {/* Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <Briefcase size={16} className="text-gray-400" /> Công ty / Tổ chức
                  </label>
                  <input 
                    type="text" 
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500" 
                    placeholder="VD: Agency Inc." 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <Phone size={16} className="text-gray-400" /> Số điện thoại
                  </label>
                  <input 
                    type="text" 
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500" 
                    placeholder="0123456789" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giới thiệu ngắn (Bio)</label>
                <textarea 
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2 h-24 resize-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500" 
                  placeholder="Một vài lời về bản thân hoặc yêu cầu chung..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <Link size={16} className="text-blue-600" /> LinkedIn
                  </label>
                  <input 
                    type="url" 
                    name="social.linkedin"
                    value={formData.socialLinks.linkedin}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500" 
                    placeholder="https://linkedin.com/in/..." 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <Globe size={16} className="text-blue-500" /> Facebook
                  </label>
                  <input 
                    type="url" 
                    name="social.facebook"
                    value={formData.socialLinks.facebook}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500" 
                    placeholder="https://facebook.com/..." 
                  />
                </div>
              </div>

              {/* Bảo mật 2FA */}
              <div className="bg-idaz-gray border border-white/60 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${user?.is2FAEnabled ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-200 text-gray-500'}`}>
                    {user?.is2FAEnabled ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}
                  </div>
                  <div>
                    <h4 className="font-bold text-idaz-black text-sm">Xác minh 2 bước (2FA)</h4>
                    <p className="text-xs text-gray-500">Nhận mã OTP qua email khi đăng nhập</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleToggle2FA}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${user?.is2FAEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full glass-card transition-transform ${user?.is2FAEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

            </form>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-idaz-gray border-t border-white/40 flex justify-end gap-3 shrink-0">
            <button 
              type="button" 
              onClick={onClose}
              className="px-6 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-xl transition-colors"
            >
              Hủy
            </button>
            <button 
              type="submit" 
              form="profile-form"
              disabled={isSubmitting}
              className="px-6 py-2 bg-idaz-orange text-idaz-black font-medium rounded-xl hover:bg-idaz-orange-dark transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Đang lưu..." : "Lưu Thay Đổi"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
