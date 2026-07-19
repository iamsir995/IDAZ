import axios from 'axios';

// Tạo một instance của axios với cấu hình mặc định
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api', // Dùng biến môi trường
  withCredentials: true, // BẮT BUỘC để trình duyệt tự động đính kèm HTTP-Only Cookie (Refresh Token) vào mỗi request
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

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
          if (isRefreshing) {
            return new Promise(function(resolve, reject) {
              failedQueue.push({ resolve, reject });
            }).then(token => {
              originalRequest.headers['Authorization'] = 'Bearer ' + token;
              return api(originalRequest);
            }).catch(err => {
              return Promise.reject(err);
            });
          }

          originalRequest._retry = true;
          isRefreshing = true;

          try {
            const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
            const { data } = await axios.post(`${backendUrl}/auth/refresh`, {}, { withCredentials: true });
            if (data.success && data.accessToken) {
              api.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;
              originalRequest.headers['Authorization'] = `Bearer ${data.accessToken}`;
              processQueue(null, data.accessToken);
              return api(originalRequest);
            }
          } catch (refreshError) {
            processQueue(refreshError, null);
            delete api.defaults.headers.common['Authorization'];
            if (typeof window !== 'undefined') window.dispatchEvent(new Event('force-logout'));
            return Promise.reject(refreshError);
          } finally {
            isRefreshing = false;
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
