"use client";

import { useEffect, useState } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import api from "../services/api";

export default function GoogleAuthProviderClient({ children }) {
  const [clientId, setClientId] = useState(null);

  useEffect(() => {
    // Ưu tiên lấy từ biến môi trường, nếu không có thì lấy từ DB Settings
    const envClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (envClientId && envClientId !== 'mock_client_id') {
      setClientId(envClientId);
      return;
    }

    api.get('/settings').then(res => {
      if (res.data?.success && res.data?.data?.googleClientId) {
        setClientId(res.data.data.googleClientId);
      } else {
        setClientId('mock_client_id'); // Fallback để tránh lỗi UI
      }
    }).catch(() => {
      setClientId('mock_client_id');
    });
  }, []);

  if (!clientId) {
    // Đang fetch, tạm thời render children bình thường nhưng không bọc Google
    return <>{children}</>;
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      {children}
    </GoogleOAuthProvider>
  );
}
