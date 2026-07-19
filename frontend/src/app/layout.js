import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import { SocketProvider } from "../context/SocketContext";
import { ThemeProvider } from "../context/ThemeContext";
import { Toaster } from "react-hot-toast";
import LiveChat from "../components/LiveChat";
import GoogleAuthProviderClient from "../components/GoogleAuthProviderClient";

export const metadata = {
 title: "IDAZ Branding — Nâng Tầm Thương Hiệu Doanh Nghiệp Việt",
 description: "IDAZ chuyên thiết kế thương hiệu, website UI/UX, marketing truyền thông. Tư vấn miễn phí, bàn giao đúng hạn, cam kết chất lượng.",
 keywords: "thiết kế thương hiệu, thiết kế logo, thiết kế website, marketing, IDAZ Branding, agency Việt Nam",
};

export const viewport = {
 width: "device-width",
 initialScale: 1,
 maximumScale: 5,
};

export default function RootLayout({ children }) {
 return (
 <html lang="vi" suppressHydrationWarning>
 <body className="antialiased" suppressHydrationWarning>
 <GoogleAuthProviderClient>
 <ThemeProvider>
 <AuthProvider>
 <SocketProvider>
 {children}
 <LiveChat />
 </SocketProvider>
 </AuthProvider>
 </ThemeProvider>
 </GoogleAuthProviderClient>
 <Toaster position="top-right" />
 </body>
 </html>
 );
}
