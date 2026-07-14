import axios from 'axios';

// Tạo một instance của axios với cấu hình mặc định
const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Cổng backend đang chạy
  withCredentials: true, // BẮT BUỘC để trình duyệt tự động đính kèm HTTP-Only Cookie (Refresh Token) vào mỗi request
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor Response: Tự động refresh token nếu gặp lỗi 401 TOKEN_EXPIRED
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401) {
      const isAuthRoute = originalRequest.url?.includes('/auth/login') || 
                          originalRequest.url?.includes('/auth/verify-2fa') || 
                          originalRequest.url?.includes('/auth/register') ||
                          originalRequest.url?.includes('/auth/refresh');

      if (!isAuthRoute) {
        if (error.response?.data?.code === 'TOKEN_EXPIRED' && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            const { data } = await axios.post('http://localhost:5000/api/auth/refresh', {}, { withCredentials: true });
            if (data.success && data.accessToken) {
              api.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;
              originalRequest.headers['Authorization'] = `Bearer ${data.accessToken}`;
              return api(originalRequest);
            }
          } catch (refreshError) {
            // Refresh token cũng đã hết hạn -> Đăng xuất
            delete api.defaults.headers.common['Authorization'];
            if (typeof window !== 'undefined') window.dispatchEvent(new Event('force-logout'));
            return Promise.reject(refreshError);
          }
        } else {
          // Token không hợp lệ / không có quyền truy cập -> Đăng xuất
          delete api.defaults.headers.common['Authorization'];
          if (typeof window !== 'undefined') window.dispatchEvent(new Event('force-logout'));
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
