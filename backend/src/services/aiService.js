// Mô phỏng dịch vụ AI Tóm tắt bản khảo sát của khách hàng
// Trong thực tế, bạn có thể gọi OpenAI API (ChatGPT) hoặc Google Gemini API tại đây

exports.summarizeBrief = async (briefData) => {
  // Trì hoãn 1.5s để tạo cảm giác AI đang "suy nghĩ"
  await new Promise(resolve => setTimeout(resolve, 1500));

  const personalityStr = briefData.brandPersonality && briefData.brandPersonality.length > 0 
    ? briefData.brandPersonality.join(', ') 
    : 'Không rõ';

  return {
    summary: `Khách hàng từ lĩnh vực ${briefData.industry || 'Chưa xác định'}. Họ nhắm đến tệp khách hàng: ${briefData.targetAudience || 'Đại chúng'}. Phong cách thiết kế yêu cầu phải toát lên vẻ: ${personalityStr}.`,
    actionItems: [
      "Lên moodboard tập trung vào sự " + personalityStr.toLowerCase(),
      "Nghiên cứu kỹ tệp khách hàng " + (briefData.targetAudience || 'đại chúng') + " để chọn tone màu phù hợp",
      "Gửi bản nháp UI/UX đầu tiên trong 3 ngày tới"
    ]
  };
};

exports.generateProjectDescription = async (topic) => {
  // Trì hoãn 1.5s để mô phỏng AI
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Một prompt đơn giản để generate nội dung chuyên nghiệp
  return `**Mục tiêu dự án:**
Thiết kế và phát triển [${topic || 'Giải pháp toàn diện'}] chuyên nghiệp, tập trung vào việc nâng cao trải nghiệm người dùng (UX) và tối ưu hóa hiệu suất hệ thống.

**Các hạng mục chính:**
- Phân tích yêu cầu và lên Wireframe/UI Design.
- Xây dựng hệ thống Backend với kiến trúc mở rộng cao.
- Triển khai Frontend với giao diện Responsive, hỗ trợ đa nền tảng.
- Kiểm thử toàn diện và bàn giao mã nguồn.

**Yêu cầu kỹ thuật cốt lõi:**
- Mã nguồn tuân thủ các nguyên tắc Clean Code và SOLID.
- Tối ưu SEO và Core Web Vitals.
- Bảo mật dữ liệu với chuẩn mã hóa cao nhất.`;
};
