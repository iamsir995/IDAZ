export default function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-white/40 pt-20 pb-10 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
        <div className="md:col-span-2">
          <div className="font-bold text-3xl tracking-tighter text-idaz-black mb-4">
            Agency<span className="text-indigo-500">.</span>
          </div>
          <p className="text-gray-400 max-w-sm">
            Giải pháp xây dựng thương hiệu toàn diện, từ thiết kế logo, website đến chiến lược truyền thông đa kênh.
          </p>
        </div>
        <div>
          <h4 className="text-idaz-black font-bold mb-4">Liên kết</h4>
          <ul className="space-y-2 text-gray-400">
            <li><a href="#" className="hover:text-indigo-400 transition-colors">Về chúng tôi</a></li>
            <li><a href="#" className="hover:text-indigo-400 transition-colors">Dịch vụ</a></li>
            <li><a href="#" className="hover:text-indigo-400 transition-colors">Dự án tiêu biểu</a></li>
            <li><a href="#" className="hover:text-indigo-400 transition-colors">Client Portal</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-idaz-black font-bold mb-4">Liên hệ</h4>
          <ul className="space-y-2 text-gray-400">
            <li>contact@idaz.com.vn</li>
            <li>+84 123 456 789</li>
            <li>Tòa nhà ABC, Quận 1, TP.HCM</li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto text-center border-t border-white/40 pt-8 text-gray-500 text-sm">
        &copy; {new Date().getFullYear()} Agency. Được xây dựng độc quyền.
      </div>
    </footer>
  );
}
