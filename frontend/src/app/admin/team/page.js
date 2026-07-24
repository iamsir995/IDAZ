"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Users, Mail, Phone, Search, X, Edit2, Shield, Trash2, KeyRound } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../../../context/AuthContext";
import { userService } from "../../../services/userService";
import { useDebounce } from "../../../hooks/useDebounce";

const ROLE_LABELS = {
  superadmin: "Super Admin",
  admin: "Admin",
  manager: "Manager",
  developer: "Developer",
  designer: "Designer",
  account: "Account Executive",
  copywriter: "Copywriter",
  marketing: "Marketing",
  sales: "Sales",
};

const ROLE_STYLES = {
  superadmin: "bg-rose-500/10 text-rose-500 border border-rose-500/20",
  admin: "bg-indigo-500/10 text-indigo-500 border border-indigo-500/20",
  manager: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
  developer: "bg-blue-500/10 text-blue-500 border border-blue-500/20",
  designer: "bg-fuchsia-500/10 text-fuchsia-500 border border-fuchsia-500/20",
  account: "bg-amber-500/10 text-amber-500 border border-amber-500/20",
  copywriter: "bg-cyan-500/10 text-cyan-500 border border-cyan-500/20",
  marketing: "bg-pink-500/10 text-pink-500 border border-pink-500/20",
  sales: "bg-orange-500/10 text-orange-500 border border-orange-500/20",
};

export default function AdminTeam() {
  const { user: currentUser } = useAuth();
  const [teamMembers, setTeamMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newMember, setNewMember] = useState({ name: "", email: "", password: "", phone: "", role: "manager", jobTitle: "" });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editMember, setEditMember] = useState(null);

  const fetchTeam = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await userService.getTeamMembers(debouncedSearch, 100);
      if (data.success) {
        setTeamMembers(data.data);
      }
    } catch {
      toast.error("Không thể tải danh sách đội ngũ");
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      const data = await userService.createUser(newMember);
      if (data.success) {
        toast.success("Thêm nhân sự thành công!");
        setIsAddModalOpen(false);
        setNewMember({ name: "", email: "", password: "", phone: "", role: "manager", jobTitle: "" });
        fetchTeam();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi tạo thành viên");
    }
  };

  const handleEditMember = async (e) => {
    e.preventDefault();
    try {
      const data = await userService.updateUser(editMember._id, {
        name: editMember.name,
        phone: editMember.phone,
        role: editMember.role,
        jobTitle: editMember.jobTitle,
      });
      if (data.success) {
        toast.success("Cập nhật thành công!");
        setIsEditModalOpen(false);
        setEditMember(null);
        fetchTeam();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi cập nhật thành viên");
    }
  };

  const handleDeleteMember = async (id) => {
    if (!window.confirm("Bạn có chắc muốn vô hiệu hóa tài khoản này?")) return;
    try {
      const data = await userService.deleteUser(id);
      if (data.success) {
        toast.success("Đã vô hiệu hóa thành viên!");
        fetchTeam();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi khi vô hiệu hóa thành viên");
    }
  };

  return (
    <div className="max-w-7xl mx-auto h-full flex flex-col relative">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-idaz-black mb-1">Quản lý Đội ngũ</h1>
          <p className="text-gray-400 text-sm">Quản lý tài khoản Admin, Manager và phân quyền hệ thống.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input
              type="text"
              placeholder="Tìm kiếm thành viên..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="glass-panel border border-white/60 rounded-3xl py-2 pl-9 pr-4 text-idaz-black text-sm focus:outline-none focus:border-indigo-500 w-64 transition-colors shadow-inner"
            />
          </div>
          {(currentUser?.role === 'superadmin' || currentUser?.role === 'admin') && (
            <button onClick={() => setIsAddModalOpen(true)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-3xl text-sm font-bold transition-all shadow-[0_4px_15px_rgba(79,70,229,0.3)] flex items-center gap-2">
              + Thêm Thành Viên
            </button>
          )}
        </div>
      </div>

      <div className="glass-card border border-white/60 rounded-3xl overflow-hidden flex-1 flex flex-col shadow-[0_8px_32px_rgba(0,0,0,0.04)]">
        <div className="overflow-auto flex-1 custom-scrollbar min-w-0">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="sticky top-0 z-10 bg-white/40 backdrop-blur-md">
              <tr className="border-b border-white/60">
                <th className="p-4 pl-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Thành viên</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Liên hệ</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Vai trò</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Trạng thái 2FA</th>
                <th className="p-4 pr-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/40">
              {isLoading ? (
                <tr><td colSpan="5" className="p-10 text-center text-gray-500 font-medium">Đang tải dữ liệu...</td></tr>
              ) : teamMembers.length === 0 ? (
                <tr><td colSpan="5" className="p-10 text-center text-gray-500 font-medium">Không tìm thấy thành viên.</td></tr>
              ) : teamMembers.map(member => (
                <tr key={member._id} className="hover:bg-white/30 transition-colors group">
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md uppercase shrink-0">
                        {member.avatar ? <img src={member.avatar} alt="Avatar" className="w-full h-full object-cover rounded-2xl" /> : member.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-idaz-black">{member.name} {member._id === currentUser?._id && <span className="text-xs text-indigo-500 font-medium ml-1">(Bạn)</span>}</div>
                        <div className="text-xs text-gray-500">
                          {member.jobTitle ? <span className="font-semibold text-idaz-orange mr-2">{member.jobTitle}</span> : ''}
                          ID: {member._id.substring(18)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      <span className="flex items-center gap-2 text-sm text-gray-700 font-medium"><Mail size={13} className="text-gray-400" /> {member.email}</span>
                      {member.phone && <span className="flex items-center gap-2 text-sm text-gray-500"><Phone size={13} className="text-gray-400" /> {member.phone}</span>}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase ${ROLE_STYLES[member.role] || ROLE_STYLES.manager}`}>
                      {ROLE_LABELS[member.role] || member.role}
                    </span>
                  </td>
                  <td className="p-4">
                    {member.is2FAEnabled ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                        <Shield size={12} /> Đã Bật
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-500 border border-gray-200">
                        Chưa Bật
                      </span>
                    )}
                  </td>
                  <td className="p-4 pr-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {(currentUser?.role === 'superadmin' || currentUser?.role === 'admin') && (
                        <button
                          onClick={() => { setEditMember(member); setIsEditModalOpen(true); }}
                          className="p-2 bg-white hover:bg-indigo-50 hover:text-indigo-600 text-gray-500 rounded-xl transition-all shadow-sm border border-gray-100"
                          title="Sửa"
                        >
                          <Edit2 size={14} />
                        </button>
                      )}
                      {(currentUser?.role === 'superadmin' && member._id !== currentUser?._id) && (
                        <button
                          onClick={() => handleDeleteMember(member._id)}
                          className="p-2 bg-white hover:bg-rose-50 hover:text-rose-600 text-gray-500 rounded-xl transition-all shadow-sm border border-gray-100"
                          title="Vô hiệu hóa"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Thêm Thành Viên */}
      <AnimatePresence>
        {isAddModalOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="glass-card border border-white/60 rounded-3xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
                <h3 className="text-xl font-bold text-idaz-black flex items-center gap-2">
                  <Shield size={20} className="text-indigo-500" /> Thêm Quản trị viên
                </h3>
                <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-idaz-black transition-colors bg-gray-50 hover:bg-gray-100 p-2 rounded-full"><X size={18} /></button>
              </div>

              <form onSubmit={handleAddMember} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">Họ tên</label>
                  <input required type="text" value={newMember.name} onChange={e => setNewMember({ ...newMember, name: e.target.value })}
                    className="w-full glass-panel border border-white/60 rounded-2xl px-4 py-3 text-idaz-black text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
                    placeholder="VD: Trần Văn B" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">Chức danh / Tag</label>
                  <input type="text" value={newMember.jobTitle} onChange={e => setNewMember({ ...newMember, jobTitle: e.target.value })}
                    className="w-full glass-panel border border-white/60 rounded-2xl px-4 py-3 text-idaz-black text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
                    placeholder="VD: CEO, Co-Founder, Trưởng phòng..." />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">Email</label>
                  <input required type="email" value={newMember.email} onChange={e => setNewMember({ ...newMember, email: e.target.value })}
                    className="w-full glass-panel border border-white/60 rounded-2xl px-4 py-3 text-idaz-black text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
                    placeholder="admin@doanhnghiep.com" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">Số điện thoại</label>
                  <input type="text" value={newMember.phone} onChange={e => setNewMember({ ...newMember, phone: e.target.value })}
                    className="w-full glass-panel border border-white/60 rounded-2xl px-4 py-3 text-idaz-black text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
                    placeholder="0987654321" />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1 ml-1 flex items-center justify-between">
                    <span>Mật khẩu</span>
                    <span className="text-[10px] text-gray-400 font-normal">Để trống sẽ tự tạo ngẫu nhiên</span>
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-4 top-3.5 text-gray-400" size={16} />
                    <input type="password" value={newMember.password} onChange={e => setNewMember({ ...newMember, password: e.target.value })}
                      className="w-full glass-panel border border-white/60 rounded-2xl py-3 pl-10 pr-4 text-idaz-black text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
                      placeholder="••••••••" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">Vai trò phân quyền</label>
                  <select value={newMember.role} onChange={e => setNewMember({ ...newMember, role: e.target.value })}
                    className="w-full glass-panel border border-white/60 rounded-2xl px-4 py-3 text-idaz-black text-sm font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner">
                    <option value="manager">Manager (Quản lý dự án)</option>
                    <option value="developer">Developer (Lập trình viên)</option>
                    <option value="designer">Designer (Thiết kế)</option>
                    <option value="account">Account (Quản lý khách hàng)</option>
                    <option value="copywriter">Copywriter (Sáng tạo nội dung)</option>
                    <option value="marketing">Marketing</option>
                    <option value="sales">Sales (Kinh doanh)</option>
                    <option value="admin">Admin (Toàn quyền ngoại trừ hệ thống)</option>
                    {currentUser?.role === 'superadmin' && <option value="superadmin">Super Admin (Quản trị tối cao)</option>}
                  </select>
                </div>

                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 bg-white hover:bg-gray-50 text-gray-600 rounded-2xl py-3 font-bold transition-all border border-gray-200">
                    Huỷ
                  </button>
                  <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl py-3 font-bold transition-all shadow-[0_4px_15px_rgba(79,70,229,0.3)]">
                    Thêm Thành Viên
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Edit Thành Viên */}
      <AnimatePresence>
        {isEditModalOpen && editMember && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="glass-card border border-white/60 rounded-3xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
                <h3 className="text-xl font-bold text-idaz-black">Sửa: <span className="text-indigo-600">{editMember.name}</span></h3>
                <button onClick={() => { setIsEditModalOpen(false); setEditMember(null); }} className="text-gray-400 hover:text-idaz-black transition-colors bg-gray-50 hover:bg-gray-100 p-2 rounded-full"><X size={18} /></button>
              </div>
              <form onSubmit={handleEditMember} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">Họ tên</label>
                  <input type="text" value={editMember.name || ''} onChange={e => setEditMember({ ...editMember, name: e.target.value })}
                    className="w-full glass-panel border border-white/60 rounded-2xl px-4 py-3 text-idaz-black text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">Chức danh / Tag</label>
                  <input type="text" value={editMember.jobTitle || ''} onChange={e => setEditMember({ ...editMember, jobTitle: e.target.value })}
                    className="w-full glass-panel border border-white/60 rounded-2xl px-4 py-3 text-idaz-black text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
                    placeholder="VD: CEO, Co-Founder, Trưởng phòng..." />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">Số điện thoại</label>
                  <input type="text" value={editMember.phone || ''} onChange={e => setEditMember({ ...editMember, phone: e.target.value })}
                    className="w-full glass-panel border border-white/60 rounded-2xl px-4 py-3 text-idaz-black text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">Vai trò phân quyền</label>
                  <select value={editMember.role} onChange={e => setEditMember({ ...editMember, role: e.target.value })}
                    disabled={editMember.role === 'superadmin' && currentUser?.role !== 'superadmin'}
                    className="w-full glass-panel border border-white/60 rounded-2xl px-4 py-3 text-idaz-black text-sm font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner disabled:opacity-50 disabled:cursor-not-allowed">
                    <option value="manager">Manager</option>
                    <option value="developer">Developer</option>
                    <option value="designer">Designer</option>
                    <option value="account">Account</option>
                    <option value="copywriter">Copywriter</option>
                    <option value="marketing">Marketing</option>
                    <option value="sales">Sales</option>
                    <option value="admin">Admin</option>
                    {currentUser?.role === 'superadmin' && <option value="superadmin">Super Admin</option>}
                  </select>
                </div>

                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => { setIsEditModalOpen(false); setEditMember(null); }}
                    className="flex-1 bg-white hover:bg-gray-50 text-gray-600 rounded-2xl py-3 font-bold transition-all border border-gray-200">
                    Huỷ
                  </button>
                  <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl py-3 font-bold transition-all shadow-[0_4px_15px_rgba(79,70,229,0.3)]">
                    Lưu thay đổi
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
