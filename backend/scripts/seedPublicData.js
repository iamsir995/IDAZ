const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Service = require('../src/models/Service');
const Portfolio = require('../src/models/Portfolio');
const Post = require('../src/models/Post');
const User = require('../src/models/User');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/idaz-agency';

async function seedData() {
  try {
    console.log('🔗 Đang kết nối tới MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Đã kết nối MongoDB thành công!');

    console.log('🗑️ Đang xóa dữ liệu cũ (Services, Portfolios, Posts)...');
    await Service.deleteMany({});
    await Portfolio.deleteMany({});
    await Post.deleteMany({});
    console.log('✅ Xóa dữ liệu cũ thành công!');

    // Get an admin user for authors
    const admin = await User.findOne({ role: 'admin' });
    const adminId = admin ? admin._id : null;

    console.log('🌱 Đang khởi tạo dữ liệu Services...');
    const services = [
      {
        title: 'Thiết Kế Giao Diện UI/UX',
        slug: 'thiet-ke-giao-dien-ui-ux',
        description: 'Tạo ra những trải nghiệm người dùng mượt mà, trực quan và đầy cảm xúc với triết lý thiết kế lấy con người làm trung tâm (Human-Centric Design).',
        icon: 'Palette',
        features: ['Phân tích Hành vi Người dùng', 'Wireframing & Prototyping', 'Design System Độc quyền', 'Kiểm thử Usability Testing'],
        order: 1
      },
      {
        title: 'Phát Triển Ứng Dụng Di Động',
        slug: 'phat-trien-ung-dung-di-dong',
        description: 'Xây dựng ứng dụng di động hiệu năng cao trên cả iOS và Android bằng Flutter/React Native, đảm bảo tính ổn định và bảo mật tuyệt đối.',
        icon: 'Smartphone',
        features: ['Đồng bộ Thời gian thực (Real-time)', 'Kiến trúc Microservices', 'Bảo mật Sinh trắc học', 'Tối ưu Pin và Bộ nhớ'],
        order: 2
      },
      {
        title: 'Xây Dựng Website Doanh Nghiệp',
        slug: 'xay-dung-website-doanh-nghiep',
        description: 'Phát triển nền tảng Web độc bản, tối ưu hóa tốc độ tải trang (LCP < 2.5s) và thân thiện với các công cụ tìm kiếm (Chuẩn SEO).',
        icon: 'MonitorPlay',
        features: ['Kiến trúc Headless CMS', 'Tốc độ tải siêu tốc (Next.js)', 'Thiết kế Responsive Đa thiết bị', 'Tích hợp Thanh toán Online'],
        order: 3
      },
      {
        title: 'Nhận Diện Thương Hiệu (Branding)',
        slug: 'nhan-dien-thuong-hieu',
        description: 'Định hình DNA của doanh nghiệp thông qua bộ nhận diện thương hiệu đồng nhất, từ Logo đến tài liệu Marketing truyền thông.',
        icon: 'Sparkles',
        features: ['Thiết kế Logo Độc quyền', 'Brand Guidelines Chuẩn quốc tế', 'Bộ ấn phẩm Văn phòng', 'Sáng tạo Slogan / Tagline'],
        order: 4
      },
      {
        title: 'Tiếp Thị Số (Digital Marketing)',
        slug: 'tiep-thi-so-digital-marketing',
        description: 'Đẩy mạnh doanh số và độ phủ sóng của thương hiệu thông qua chiến dịch đa kênh (Omnichannel) được cá nhân hóa bởi dữ liệu.',
        icon: 'TrendingUp',
        features: ['Tối ưu hóa SEO / SEM', 'Chạy quảng cáo Facebook / Google', 'Tiếp thị Nội dung (Content)', 'Phân tích Dữ liệu Data-driven'],
        order: 5
      },
      {
        title: 'Hệ Thống Quản Lý Nội Bộ (ERP/CRM)',
        slug: 'he-thong-quan-ly-noi-bo',
        description: 'Tự động hóa luồng công việc với hệ thống phần mềm quản trị doanh nghiệp chuyên biệt, được tinh chỉnh cho từng mô hình kinh doanh.',
        icon: 'Shield',
        features: ['Quản trị Khách hàng CRM', 'Hệ thống Quản lý Kho bãi', 'Báo cáo Thống kê Tự động', 'Phân quyền Truy cập Bảo mật'],
        order: 6
      }
    ];
    await Service.insertMany(services);

    console.log('🌱 Đang khởi tạo dữ liệu Portfolios...');
    const portfolios = [
      {
        title: 'Nền tảng Thương mại Điện tử V-Shop',
        slug: 'nen-tang-thuong-mai-dien-tu-v-shop',
        description: 'Xây dựng hệ thống bán lẻ trực tuyến quy mô lớn có khả năng chịu tải hàng triệu lượt truy cập đồng thời.',
        category: 'Thiết kế Web',
        clientName: 'Tập đoàn V-Shop',
        coverImage: 'https://images.unsplash.com/photo-1661956602116-aa6865609028?w=1080&auto=format&fit=crop',
        isFeatured: true,
        tags: ['Next.js', 'Node.js', 'E-commerce', 'Tailwind CSS']
      },
      {
        title: 'Ứng dụng Đặt đồ ăn Sinh Thái EcoFood',
        slug: 'ung-dung-dat-do-an-ecofood',
        description: 'Thiết kế UX/UI và lập trình ứng dụng di động cho startup giao thức ăn chú trọng vào sức khỏe và môi trường.',
        category: 'Mobile App',
        clientName: 'EcoFood VN',
        coverImage: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=1080&auto=format&fit=crop',
        isFeatured: true,
        tags: ['Flutter', 'Firebase', 'Google Maps API']
      },
      {
        title: 'Định vị Thương hiệu Alpha Group',
        slug: 'dinh-vi-thuong-hieu-alpha-group',
        description: 'Tái thiết kế toàn bộ hệ thống nhận diện thương hiệu cho tập đoàn công nghệ Alpha, mang đến diện mạo tương lai và bền vững.',
        category: 'Branding',
        clientName: 'Alpha Tech Group',
        coverImage: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1080&auto=format&fit=crop',
        isFeatured: true,
        tags: ['Logo Design', 'Brand Identity', 'Illustration']
      },
      {
        title: 'Cổng thông tin Đào tạo EduStar',
        slug: 'cong-thong-tin-dao-tao-edustar',
        description: 'Phát triển hệ thống E-Learning tích hợp phòng học ảo và AI chấm điểm tự động cho hơn 50.000 học viên.',
        category: 'Thiết kế Web',
        clientName: 'Học viện EduStar',
        coverImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1080&auto=format&fit=crop',
        isFeatured: true,
        tags: ['React', 'WebRTC', 'AI Integration']
      },
      {
        title: 'Ví Điện tử Thanh toán Nhanh PayNow',
        slug: 'vi-dien-tu-thanh-toan-nhanh-paynow',
        description: 'Giao diện ứng dụng ví điện tử với ngôn ngữ thiết kế Liquid Glass, tạo cảm giác an toàn, hiện đại và sang trọng.',
        category: 'Mobile App',
        clientName: 'PayNow Financial',
        coverImage: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1080&auto=format&fit=crop',
        isFeatured: false,
        tags: ['Fintech', 'UI/UX', 'Swift', 'Kotlin']
      },
      {
        title: 'Hệ thống Quản lý Kho vận Global Logis',
        slug: 'he-thong-quan-ly-kho-van-global-logis',
        description: 'Thiết kế lại Dashboard hệ thống ERP quản lý kho hàng với hàng chục ngàn SKU, giúp giảm 40% thời gian xử lý đơn hàng.',
        category: 'Phần mềm',
        clientName: 'Global Logistics',
        coverImage: 'https://images.unsplash.com/photo-1586528116311-ad8ed7c80a30?w=1080&auto=format&fit=crop',
        isFeatured: false,
        tags: ['Dashboard', 'CRM', 'Data Viz']
      }
    ];
    await Portfolio.insertMany(portfolios);

    console.log('🌱 Đang khởi tạo dữ liệu Bài viết Blog...');
    const posts = [
      {
        title: 'Xu Hướng Thiết Kế Giao Diện UI/UX Thống Trị Năm 2026',
        slug: 'xu-huong-thiet-ke-giao-dien-ui-ux-thong-tri-nam-2026',
        content: `
          <h2>Sự trỗi dậy của Liquid Glassmorphism</h2>
          <p>Năm 2026 đánh dấu sự trưởng thành của ngôn ngữ thiết kế Glassmorphism, tiến hóa thành <strong>Liquid Glass</strong>. Thay vì chỉ là những lớp kính mờ tĩnh lặng, Liquid Glass mang đến sự chuyển động mượt mà, kết hợp với các dải màu gradient tương tác theo thao tác của người dùng.</p>
          <h2>Tối giản hóa Nhận thức (Cognitive Minimalism)</h2>
          <p>Người dùng đang bị quá tải thông tin. Các Designer hàng đầu hiện nay áp dụng triết lý "Tối giản nhận thức" — ẩn đi các tính năng phức tạp bằng AI và chỉ hiển thị đúng thứ người dùng cần vào đúng thời điểm.</p>
          <ul>
            <li>Giao diện không viền (Borderless Design)</li>
            <li>Typography kích thước khổng lồ làm điểm nhấn</li>
            <li>Micro-interactions tạo cảm xúc</li>
          </ul>
        `,
        excerpt: 'Khám phá sự tiến hóa của ngôn ngữ Liquid Glass và cách ứng dụng triết lý tối giản nhận thức vào thiết kế sản phẩm.',
        author: adminId,
        coverImage: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=1080&auto=format&fit=crop',
        tags: ['Design', 'UI/UX', 'Trends'],
        status: 'published'
      },
      {
        title: 'Bí Quyết Tối Ưu Tốc Độ Tải Trang (LCP) Cho Ứng Dụng Next.js',
        slug: 'bi-quyet-toi-uu-toc-do-tai-trang-lcp-cho-ung-dung-nextjs',
        content: `
          <h2>Tại sao Largest Contentful Paint (LCP) lại quan trọng?</h2>
          <p>LCP là một trong ba chỉ số Core Web Vitals cốt lõi của Google. Nó đo lường thời gian hiển thị phần tử nội dung lớn nhất trên màn hình. Nếu LCP > 2.5s, website của bạn sẽ bị đánh giá thấp và rớt hạng SEO.</p>
          <h2>Cách tối ưu trên Next.js 15+</h2>
          <p>Sử dụng <code>next/image</code> kết hợp với cờ <code>priority</code> cho hình ảnh Hero là bắt buộc. Ngoài ra, bạn cần cấu hình caching HTTP Header và tận dụng React Server Components để giảm lượng JavaScript tải xuống thiết bị người dùng.</p>
        `,
        excerpt: 'Hướng dẫn chi tiết cách đạt 100 điểm Lighthouse Performance với framework Next.js 15 và Turbopack.',
        author: adminId,
        coverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1080&auto=format&fit=crop',
        tags: ['Frontend', 'Performance', 'Next.js'],
        status: 'published'
      },
      {
        title: 'Xây Dựng Nhận Diện Thương Hiệu Trong Kỷ Nguyên AI',
        slug: 'xay-dung-nhan-dien-thuong-hieu-trong-ky-nguyen-ai',
        content: `
          <h2>AI không thay thế sự sáng tạo, nó khuếch đại sự sáng tạo</h2>
          <p>Nhiều doanh nghiệp lầm tưởng rằng có thể dùng AI để tự tạo logo và bộ nhận diện thương hiệu. Thực tế, AI chỉ tạo ra sự trung bình. Để thương hiệu thực sự nổi bật, nó cần một linh hồn (DNA) do con người thổi vào.</p>
          <p>Tại IDAZ Agency, chúng tôi sử dụng AI như một trợ lý nghiên cứu thị trường và moodboard, nhưng những quyết định về Typography, Tỷ lệ vàng và Thông điệp truyền thông luôn được thực hiện bởi các Giám đốc Nghệ thuật (Art Directors) dày dạn kinh nghiệm.</p>
        `,
        excerpt: 'Cách kết hợp trí tuệ nhân tạo (AI) vào quy trình thiết kế thương hiệu mà không làm mất đi "DNA" cốt lõi của doanh nghiệp.',
        author: adminId,
        coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1080&auto=format&fit=crop',
        tags: ['Branding', 'AI', 'Strategy'],
        status: 'published'
      },
      {
        title: 'Tối Ưu Tỷ Lệ Chuyển Đổi (CRO) Cho Website Bán Hàng',
        slug: 'toi-uu-ty-le-chuyen-doi-cro-cho-website-ban-hang',
        content: `
          <h2>Đừng chỉ tập trung vào Traffic</h2>
          <p>Kéo hàng ngàn người truy cập vào website sẽ vô nghĩa nếu tỷ lệ chuyển đổi (CRO) của bạn dưới 1%. Việc thiết kế lại nút CTA, rút ngắn quy trình Checkout và thêm các tín hiệu Trust (Đánh giá, Chứng nhận) có thể tăng gấp đôi doanh thu mà không cần tăng ngân sách quảng cáo.</p>
          <h2>Vai trò của Micro-copy</h2>
          <p>Thay vì sử dụng các từ ngữ chung chung như "Mua ngay", hãy thử nghiệm các micro-copy mang tính lợi ích cao hơn như "Thêm vào giỏ - Giảm ngay 20%". Từ ngữ tác động trực tiếp đến tâm lý học hành vi của khách hàng.</p>
        `,
        excerpt: 'Các kỹ thuật Tâm lý học Hành vi ứng dụng trong thiết kế UI/UX nhằm tăng gấp đôi doanh thu E-commerce.',
        author: adminId,
        coverImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1080&auto=format&fit=crop',
        tags: ['Marketing', 'E-commerce', 'CRO'],
        status: 'published'
      }
    ];
    await Post.insertMany(posts);

    console.log('🎉 Hoàn tất quá trình tạo dữ liệu mẫu chuyên nghiệp!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khi khởi tạo dữ liệu mẫu:', error);
    process.exit(1);
  }
}

seedData();
