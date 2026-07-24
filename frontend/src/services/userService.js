import api from "./api";
import { hashPassword } from "../utils/hash";

export const userService = {
  /**
   * Lấy danh sách khách hàng (role: client)
   */
  getClients: async (search = "", limit = 100) => {
    const { data } = await api.get('/users', {
      params: { search, role: 'client', limit }
    });
    return data;
  },

  /**
   * Lấy danh sách nhân sự (team members)
   */
  getTeamMembers: async (search = "", limit = 100) => {
    const { data } = await api.get('/users', {
      params: { search, limit }
    });
    if (data.success && Array.isArray(data.data)) {
      const teamRoles = ['superadmin', 'admin', 'manager', 'developer', 'designer', 'account', 'copywriter', 'marketing', 'sales'];
      data.data = data.data.filter(u => teamRoles.includes(u.role));
    }
    return data;
  },

  /**
   * Lấy chi tiết user theo ID (Client Profile)
   */
  getUserById: async (id) => {
    const { data } = await api.get(`/users/${id}`);
    return data;
  },

  /**
   * Tạo người dùng mới
   */
  createUser: async (userData) => {
    const payload = { ...userData };
    if (payload.password) {
      payload.password = hashPassword(payload.password);
    }
    const { data } = await api.post('/users', payload);
    return data;
  },

  /**
   * Cập nhật thông tin người dùng
   */
  updateUser: async (id, userData) => {
    const { data } = await api.put(`/users/${id}`, userData);
    return data;
  },

  /**
   * Vô hiệu hóa / Xóa người dùng
   */
  deleteUser: async (id) => {
    const { data } = await api.delete(`/users/${id}`);
    return data;
  }
};
