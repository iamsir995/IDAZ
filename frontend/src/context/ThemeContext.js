"use client";

import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    agencyName: 'Agency',
    logoUrl: '',
    primaryColor: '#4f46e5'
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings');
        if (res.data.success && res.data.data) {
          const { agencyName, logoUrl, primaryColor } = res.data.data;
          setSettings({ agencyName, logoUrl, primaryColor });
          
          // Áp dụng CSS variables cho toàn hệ thống
          document.documentElement.style.setProperty('--primary-color', primaryColor || '#4f46e5');
          document.title = agencyName ? `${agencyName} - Portal` : 'Agency Portal';
        }
      } catch (error) {
        console.log("Error loading theme settings", error);
      }
    };
    
    fetchSettings();
  }, []);

  return (
    <ThemeContext.Provider value={{ settings }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
