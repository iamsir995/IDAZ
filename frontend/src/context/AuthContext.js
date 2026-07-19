"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../services/api';
import SHA256 from 'crypto-js/sha256';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Kiểm tra đăng nhập khi mở web
  useEffect(() => {
    const initAuth = async () => {
      // Vì accessToken không được lưu localStorage nữa (bảo mật), ta sẽ thử dùng refresh token trong cookie để lấy access token mới
      try {
        const { data } = await api.post('/auth/refresh');
        if (data.success && data.accessToken) {
          // Lưu tạm access token vào api instance (Axios)
          api.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;
          
          // Fetch thông tin chi tiết user (thay vì decode JWT thủ công)
          const meRes = await api.get('/users/me');
          if (meRes.data.success) {
            setUser(meRes.data.data);
          }
        }
      } catch (error) {
        // Cookie hết hạn hoặc không có cookie -> Chưa đăng nhập
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  // Đăng ký (Register)
  const register = async (name, email, password) => {
    try {
      const hashedPassword = SHA256(password).toString();
      const { data } = await api.post('/auth/register', { name, email, password: hashedPassword });
      return data;
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Lỗi đăng ký' 
      };
    }
  };

  // Bước 1: Gửi email/pass để nhận OTP (hoặc vào thẳng)
  const login = async (email, password) => {
    try {
      const hashedPassword = SHA256(password).toString();
      const { data } = await api.post('/auth/login', { email, password: hashedPassword });
      
      // Nếu không yêu cầu 2FA (người dùng tắt 2FA) -> Set user luôn
      if (data.success && !data.require2FA) {
        api.defaults.headers.common['Authorization'] = `Bearer ${data.data.accessToken}`;
        const meRes = await api.get('/users/me');
        if (meRes.data.success) {
          setUser(meRes.data.data);
        }
      }
      
      return data; // Chứa { success, require2FA, devNote, data }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Lỗi đăng nhập' 
      };
    }
  };

  // Bước 2: Xác minh OTP
  const verify2FA = async (email, otp) => {
    try {
      const { data } = await api.post('/auth/verify-2fa', { email, otp });
      
      if (data.success) {
        api.defaults.headers.common['Authorization'] = `Bearer ${data.data.accessToken}`;
        
        const meRes = await api.get('/users/me');
        if (meRes.data.success) {
          setUser(meRes.data.data);
          
          // Phân luồng đăng nhập (Role-Based Routing)
          if (['superadmin', 'admin', 'manager', 'developer', 'designer', 'account', 'copywriter', 'marketing', 'sales'].includes(meRes.data.data.role)) {
            router.push('/admin/crm');
          } else {
            router.push('/client');
          }
        }
        return { success: true };
      }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'OTP không hợp lệ' 
      };
    }
  };

  // Đăng xuất (xóa cookie trên server)
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.error(e);
    }
    setUser(null);
    delete api.defaults.headers.common['Authorization'];
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  // Xử lý Force Logout (do token hết hạn hoặc lỗi xác thực từ Interceptor)
  useEffect(() => {
    const handleForceLogout = () => {
      setUser(null);
      delete api.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/login');
    };

    window.addEventListener('force-logout', handleForceLogout);
    return () => window.removeEventListener('force-logout', handleForceLogout);
  }, [router]);

  // Hàm làm mới thông tin user (ví dụ sau khi update avatar)
  const refreshUser = async () => {
    try {
      const meRes = await api.get('/users/me');
      if (meRes.data.success) {
        setUser(meRes.data.data);
      }
    } catch (error) {
      console.error("Lỗi làm mới user", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, verify2FA, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
