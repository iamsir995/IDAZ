# Báo cáo Lỗi từ Next.js và Backend

## 1. Kết quả Linting Frontend (`npm run lint`)
Hệ thống đã chạy `npm run lint` trên thư mục `frontend` và phát hiện tổng cộng **116 vấn đề (55 lỗi, 61 cảnh báo)**.

**Các loại lỗi chính:**
- **`react-hooks/set-state-in-effect` (Error):** Gọi `setState` đồng bộ bên trong `useEffect`, có thể gây ra cascading renders và giảm hiệu năng (ví dụ ở `FloatingChat.js`, `TaskDetailModal.js`, v.v.).
- **`react-hooks/purity` (Error):** Gọi hàm không thuần túy (như `Date.now()`) trong quá trình render (ví dụ ở `FloatingChat.js` dòng 13, `admin/page.js` dòng 16).
- **`react-hooks/immutability` / Lỗi truy cập trước khi khai báo (Error):** Truy cập biến (như các hàm `fetchProjects`, `fetchUsers` khai báo bằng arrow function) trước khi chúng được định nghĩa. Lỗi do gọi các hàm này trong `useEffect` trong khi hàm lại được đặt dưới `useEffect`.
- **`@next/next/no-img-element` (Warning):** Sử dụng thẻ `<img>` thông thường thay vì `<Image />` của Next.js, làm chậm LCP (có mặt ở rất nhiều component như `FloatingChat.js`, `BlogSection.jsx`, `PortfolioSection.jsx`, `admin/chat/page.js`, v.v.).
- **`jsx-a11y/alt-text` (Warning):** Thiếu thuộc tính `alt` cho thẻ `<img>`.
- **`react-hooks/exhaustive-deps` (Warning):** Thiếu dependencies trong `useEffect`.
- **`react-hooks/refs` (Error):** Truy cập trực tiếp giá trị ref (`ref.current`) trong lúc render (ví dụ ở `admin/page.js`).

**Giải pháp đề xuất cho Frontend:**
- Chuyển các hàm fetch lên trước `useEffect` hoặc định nghĩa chúng bên trong `useEffect`.
- Cấu hình lại `useRef` hoặc `useState` thay cho `Date.now()` khi tạo ID component.
- Thay thế toàn bộ các thẻ `<img>` sang `next/image` và bổ sung `alt`.
- Review lại toàn bộ logic `setState` trong `useEffect`.

## 2. Kiểm tra `backend/server.js`
Đã rà soát `backend/server.js` và phát hiện 16 câu lệnh `console.log` có khả năng rò rỉ thông tin (như trạng thái DB, dữ liệu Seed, Socket ID, v.v.).
Tất cả đã được tự động bọc lại trong điều kiện `if (process.env.NODE_ENV !== 'production')` để đảm bảo an toàn cho môi trường Production.
