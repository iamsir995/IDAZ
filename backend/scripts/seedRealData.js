require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const Service = require('../src/models/Service');
const Portfolio = require('../src/models/Portfolio');
const Post = require('../src/models/Post');
const User = require('../src/models/User');

const seedDB = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/agency_platform_db';
    await mongoose.connect(uri);
    console.log('Đã kết nối MongoDB. Đang xoá dữ liệu cũ...');

    await Service.deleteMany({});
    await Portfolio.deleteMany({});
    await Post.deleteMany({});

    // Tìm admin để gán tác giả cho Post
    const admin = await User.findOne({ role: 'admin' });
    const authorId = admin ? admin._id : null;

    // --- SEED SERVICES ---
    const servicesData = [
      {
        title: "Thiết kế Logo & Thương hiệu",
        slug: "thiet-ke-logo-thuong-hieu",
        description: "Xây dựng bản sắc độc bản, chuyên nghiệp và nhất quán.",
        shortDescription: "Giải pháp toàn diện từ logo cốt lõi đến hệ thống nhận diện ứng dụng.",
        icon: "PenTool",
        price: "Từ 5.000.000đ",
        content: "Một logo đẹp chưa đủ để tạo nên một thương hiệu mạnh. Tại IDAZ, chúng tôi tin rằng nhận diện thương hiệu phải phản ánh đúng chiến lược kinh doanh và tính cách của doanh nghiệp. Chúng tôi cung cấp giải pháp thiết kế toàn diện, từ logo cốt lõi đến hệ thống nhận diện ứng dụng trên mọi điểm chạm.",
        features: ["Bản sắc độc bản", "Ứng dụng đa nền tảng", "Nhất quán hệ thống"],
        benefits: [
          "Khẳng định sự chuyên nghiệp và uy tín trong mắt khách hàng, đối tác.",
          "Tăng khả năng ghi nhớ và nhận diện trên thị trường.",
          "Tạo nền tảng vững chắc cho các hoạt động truyền thông và marketing.",
          "Chuẩn hóa hình ảnh trên mọi nền tảng (Online & Offline)."
        ],
        deliverables: [
          "03 Phương án thiết kế Logo độc quyền",
          "Cẩm nang hướng dẫn sử dụng Logo (Brand Guidelines)",
          "Bộ nhận diện văn phòng (Namecard, Tiêu đề thư, Phong bì...)",
          "Toàn bộ file gốc (AI, PDF, PNG, JPG)"
        ],
        pricingPlans: [
          {
            name: "Khởi nghiệp",
            price: "5.000.000đ",
            description: "Gói cơ bản phù hợp với các Startup mới thành lập.",
            isPopular: false,
            features: ["02 Concept Logo", "Chỉnh sửa 3 lần", "Quy chuẩn Logo", "File gốc (AI, PNG, PDF)"]
          },
          {
            name: "Chuyên nghiệp",
            price: "12.000.000đ",
            description: "Giải pháp toàn diện cho doanh nghiệp đang phát triển.",
            isPopular: true,
            features: ["04 Concept Logo", "Chỉnh sửa không giới hạn", "Bộ nhận diện văn phòng", "Brand Guidelines cơ bản", "Hỗ trợ đăng ký sở hữu trí tuệ"]
          },
          {
            name: "Toàn diện",
            price: "25.000.000đ",
            description: "Bộ nhận diện đẳng cấp cho các tập đoàn lớn.",
            isPopular: false,
            features: ["05 Concept Logo", "Bộ nhận diện văn phòng Full", "Bộ nhận diện marketing", "Brand Guidelines chi tiết", "Tư vấn chiến lược thương hiệu"]
          }
        ],
        order: 1
      },
      {
        title: "Thiết kế Website & UI/UX",
        slug: "thiet-ke-website",
        description: "Kiến tạo văn phòng số chuẩn SEO, tối ưu tỷ lệ chuyển đổi.",
        shortDescription: "Tập trung vào yếu tố thẩm mỹ và luồng trải nghiệm người dùng.",
        icon: "MonitorPlay",
        price: "Từ 15.000.000đ",
        content: "Website là bộ mặt số của doanh nghiệp. IDAZ thiết kế website không chỉ tập trung vào yếu tố thẩm mỹ (UI) mà còn tối ưu hóa luồng trải nghiệm người dùng (UX), đảm bảo website load nhanh, chuẩn SEO và tương thích hoàn hảo trên mọi thiết bị.",
        features: ["Tối ưu UX/UI", "Chuẩn SEO Google", "Tương thích đa thiết bị"],
        benefits: [
          "Nâng tầm hình ảnh doanh nghiệp trên Internet 24/7.",
          "Tăng tỷ lệ giữ chân khách hàng qua UX tốt.",
          "Thân thiện với công cụ tìm kiếm Google.",
          "Dễ dàng quản trị và cập nhật nội dung."
        ],
        deliverables: [
          "Bản vẽ Wireframe & UI/UX Design trên Figma",
          "Lập trình Frontend & Backend tối ưu hiệu năng",
          "Hệ thống quản trị nội dung (CMS)",
          "Bảo hành kỹ thuật 12 tháng"
        ],
        pricingPlans: [
          {
            name: "Landing Page",
            price: "8.000.000đ",
            description: "Trang đích giới thiệu sản phẩm/dịch vụ tối ưu chuyển đổi.",
            isPopular: false,
            features: ["Thiết kế UI/UX tuỳ chỉnh", "Responsive Mobile/Tablet", "Tối ưu chuẩn SEO Onpage", "Tích hợp Form liên hệ", "Tốc độ tải trang < 3s"]
          },
          {
            name: "Web Doanh Nghiệp",
            price: "15.000.000đ",
            description: "Trang web giới thiệu công ty chuyên nghiệp.",
            isPopular: true,
            features: ["Tối đa 10 trang con", "Thiết kế độc quyền, không dùng theme", "Hệ thống quản trị (CMS) dễ dùng", "Bảo hành lỗi kỹ thuật 1 năm", "Miễn phí 1 năm Hosting/Domain"]
          },
          {
            name: "Thương mại điện tử",
            price: "Liên hệ",
            description: "Hệ thống bán hàng trực tuyến toàn diện.",
            isPopular: false,
            features: ["Quản lý sản phẩm không giới hạn", "Tích hợp cổng thanh toán", "Hệ thống quản lý đơn hàng/kho", "Quản lý mã giảm giá", "Hỗ trợ tích hợp ERP/CRM"]
          }
        ],
        order: 2
      },
      {
        title: "Truyền thông & Marketing",
        slug: "truyen-thong-marketing",
        description: "Lan tỏa giá trị, thu hút khách hàng tiềm năng đa nền tảng.",
        shortDescription: "Chiến dịch quảng cáo tối ưu ngân sách, sáng tạo nội dung.",
        icon: "Megaphone",
        price: "Từ 10.000.000đ",
        content: "Dịch vụ truyền thông của IDAZ giúp thương hiệu kể câu chuyện của mình một cách hấp dẫn nhất trên các nền tảng mạng xã hội và kênh kỹ thuật số. Chúng tôi sản xuất nội dung sáng tạo, chụp ảnh, quay video và quản lý các chiến dịch quảng cáo tối ưu ngân sách.",
        features: ["Quản trị Fanpage", "Quảng cáo FB/Google", "Media Production"],
        benefits: [
          "Tăng mức độ nhận diện thương hiệu trên thị trường.",
          "Xây dựng cộng đồng khách hàng trung thành.",
          "Thúc đẩy doanh số bằng quảng cáo hiệu quả.",
          "Sở hữu nguồn tư liệu media chuyên nghiệp."
        ],
        deliverables: [
          "Kế hoạch nội dung (Content Plan) hàng tháng",
          "Thiết kế hình ảnh/Video Social Media định kỳ",
          "Báo cáo hiệu quả chiến dịch minh bạch"
        ],
        pricingPlans: [
          {
            name: "Social Care Cơ bản",
            price: "5.000.000đ/tháng",
            description: "Duy trì hoạt động Fanpage thường xuyên.",
            isPopular: false,
            features: ["8 Bài viết/tháng (Nội dung + Thiết kế)", "Quản lý 1 nền tảng (Facebook)", "Lên kế hoạch content định kỳ", "Báo cáo tăng trưởng cơ bản"]
          },
          {
            name: "Social Care Nâng cao",
            price: "12.000.000đ/tháng",
            description: "Gói tiêu chuẩn để phát triển thương hiệu toàn diện.",
            isPopular: true,
            features: ["15 Bài viết/tháng (Bao gồm 2 video ngắn)", "Quản lý đa nền tảng (FB, IG, Tiktok)", "Thiết kế banner sự kiện", "Quản lý và tối ưu 1 chiến dịch Ads", "Báo cáo chỉ số chi tiết hàng tháng"]
          },
          {
            name: "Performance Ads",
            price: "Từ 15% NS",
            description: "Tập trung chạy quảng cáo chuyển đổi.",
            isPopular: false,
            features: ["Setup chiến dịch Facebook/Google Ads", "A/B Testing liên tục", "Tối ưu hóa phễu khách hàng", "Viết bài PR báo chí", "Tư vấn chiến lược tổng thể"]
          }
        ],
        order: 3
      }
    ];

    await Service.insertMany(servicesData);
    console.log('✅ Đã tạo 3 Dịch vụ với Bảng giá chi tiết.');

    // --- SEED PORTFOLIOS ---
    const portfoliosData = [
      {
        title: "Breeze Coffee - Nhận diện thương hiệu",
        slug: "breeze-coffee",
        description: "Tái định vị và thiết kế toàn bộ hệ thống nhận diện cho chuỗi cà phê Breeze.",
        category: "Branding",
        clientName: "Breeze F&B Group",
        challenge: "Breeze Coffee có một thiết kế cũ mờ nhạt, không tạo được ấn tượng mạnh mẽ để cạnh tranh trong thị trường F&B sôi động tại TP.HCM. Họ cần một diện mạo mới trẻ trung, hiện đại nhưng vẫn giữ được hồn cốt của thương hiệu ban đầu.",
        solution: "IDAZ đã nghiên cứu sâu về tệp khách hàng mục tiêu của Breeze (Gen Z và Millennials). Chúng tôi thiết kế một logo typography kết hợp cùng biểu tượng chiếc lá cách điệu, sử dụng tông màu Xanh rêu - Cam đất làm chủ đạo. Bộ nhận diện được ứng dụng triệt để từ đồng phục, menu, đến bao bì ly take-away.",
        results: "- Tăng 40% doanh thu trong tháng đầu ra mắt bộ nhận diện mới.\n- Tăng lượng tương tác trên mạng xã hội nhờ bao bì 'Instagrammable'.\n- Mở thêm 3 chi nhánh mới thành công rực rỡ.",
        coverImage: "https://images.unsplash.com/photo-1559925393-8be0aaff477c?w=800&q=80",
        images: [
          "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=800&q=80",
          "https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?w=800&q=80"
        ],
        isFeatured: true,
        tags: ["Logo Design", "Packaging", "F&B"]
      },
      {
        title: "E-Commerce App - TechStore",
        slug: "techstore-ecommerce-app",
        description: "Thiết kế UI/UX ứng dụng di động mua sắm đồ công nghệ hiện đại.",
        category: "Mobile App",
        clientName: "TechStore Vietnam",
        challenge: "Tối ưu hoá luồng thanh toán và nâng cao trải nghiệm tìm kiếm sản phẩm trên nền tảng di động, giúp giảm tỷ lệ bỏ rơi giỏ hàng.",
        solution: "Áp dụng các nguyên tắc Human-Centered Design, tối giản hoá giao diện, sử dụng white-space hợp lý và tái cấu trúc navigation bar. Thêm tính năng One-Click Checkout.",
        results: "- Giảm 35% tỷ lệ bỏ rơi giỏ hàng.\n- Tăng 50% thời gian trung bình người dùng ở lại trên app.",
        coverImage: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&q=80",
        images: [],
        isFeatured: true,
        tags: ["UI/UX", "Mobile", "E-Commerce"]
      },
      {
        title: "KOR Spa & Wellness - Web Design",
        slug: "kor-spa-web",
        description: "Thiết kế website đặt lịch spa với phong cách tinh tế, sang trọng.",
        category: "Thiết kế Web",
        clientName: "KOR Spa",
        challenge: "Cần một website vừa có thẩm mỹ cao cấp, truyền tải cảm giác thư giãn, vừa tích hợp hệ thống booking phức tạp theo khung giờ và nhân viên.",
        solution: "Thiết kế layout thoáng đãng với tone màu pastel dịu nhẹ. Tích hợp form booking trực quan sử dụng React, giúp khách hàng chọn ngày giờ và dịch vụ dễ dàng.",
        results: "- Tăng 200% lượt booking online trực tiếp.\n- Giảm 60% cuộc gọi tư vấn về giá và dịch vụ.",
        coverImage: "https://images.unsplash.com/photo-1600334129128-685054110de4?w=800&q=80",
        images: [],
        isFeatured: true,
        tags: ["Web Design", "Frontend", "Booking"]
      },
      {
        title: "Nova Edu - Digital Marketing Campaign",
        slug: "nova-edu-marketing",
        description: "Chiến dịch tuyển sinh toàn diện cho hệ thống giáo dục quốc tế.",
        category: "Marketing",
        clientName: "Nova Education",
        challenge: "Thị trường giáo dục cạnh tranh khốc liệt, chi phí thu hút học viên (CAC) ngày càng tăng cao.",
        solution: "Xây dựng chiến lược content tập trung vào câu chuyện thành công của cựu học viên. Triển khai quảng cáo đa kênh (Facebook, TikTok, Google Search).",
        results: "- Đạt mục tiêu 500 học viên đăng ký sớm.\n- Giảm 30% chi phí CPA so với năm trước.",
        coverImage: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80",
        images: [],
        isFeatured: false,
        tags: ["Digital Ads", "Social Media", "Education"]
      },
      {
        title: "Zenith Architecture - Website Portfolio",
        slug: "zenith-architecture",
        description: "Thiết kế website trưng bày dự án kiến trúc tối giản.",
        category: "Thiết kế Web",
        clientName: "Zenith Arch",
        challenge: "Trình diễn các công trình kiến trúc một cách ấn tượng nhất mà không làm website tải chậm.",
        solution: "Sử dụng Next.js để tối ưu hình ảnh, kết hợp với các hiệu ứng cuộn mượt mà (smooth scrolling, parallax) để tăng trải nghiệm xem.",
        results: "- Website load dưới 2s.\n- Nhận giải thưởng Awwwards Honorable Mention.",
        coverImage: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80",
        images: [],
        isFeatured: false,
        tags: ["Web Design", "Architecture", "NextJS"]
      },
      {
        title: "FinTech App - Lumina",
        slug: "lumina-fintech-app",
        description: "Thiết kế UI/UX ứng dụng quản lý tài chính cá nhân thế hệ mới.",
        category: "UI/UX Design",
        clientName: "Lumina Tech",
        challenge: "Biến các số liệu tài chính khô khan thành các biểu đồ trực quan, dễ hiểu và truyền cảm hứng cho giới trẻ quản lý tiền bạc.",
        solution: "Sử dụng ngôn ngữ thiết kế Neumorphism pha trộn Glassmorphism, dùng các gam màu neon trên nền tối (Dark Mode) để làm nổi bật dữ liệu.",
        results: "- Đạt 10.000 lượt tải trong tháng đầu.\n- Đánh giá 4.8/5 sao trên App Store về giao diện.",
        coverImage: "https://images.unsplash.com/photo-1616423640778-28d1b53229bd?w=800&q=80",
        images: [],
        isFeatured: false,
        tags: ["Fintech", "UI/UX", "Dashboard"]
      }
    ];

    await Portfolio.insertMany(portfoliosData);
    console.log('✅ Đã tạo 6 Portfolios chất lượng cao.');

    // --- SEED POSTS ---
    if (authorId) {
      const postsData = [
        {
          title: "7 xu hướng thiết kế logo năm 2024 mà mọi thương hiệu cần biết",
          slug: "xu-huong-thiet-ke-logo-2024",
          content: `Năm 2024 chứng kiến sự chuyển mình mạnh mẽ trong phong cách thiết kế nhận diện thương hiệu. Các doanh nghiệp ngày càng hướng tới sự tối giản, nhưng vẫn đảm bảo tính độc bản và khả năng linh hoạt trên môi trường số.

Dưới đây là 7 xu hướng đáng chú ý nhất:

- Tối giản hóa (Minimalism) tiếp tục lên ngôi, lược bỏ những chi tiết rườm rà.
- Typography sáng tạo và có thể tùy biến (Variable Fonts).
- Sự trở lại của phong cách Y2K và Retro những năm 90.
- Logo động (Animated Logos) tối ưu cho nền tảng digital và video.
- Không gian âm (Negative Space) được tận dụng triệt để mang lại chiều sâu.
- Hình học cơ bản kết hợp màu sắc tương phản mạnh.
- Tích hợp AI trong quá trình lên ý tưởng thiết kế.

Đối với các doanh nghiệp Việt Nam, việc nắm bắt những xu hướng này sẽ giúp thương hiệu luôn tươi mới và không bị tụt hậu so với đối thủ cạnh tranh. Một logo tốt không chỉ là hình ảnh đẹp, nó là một tuyên ngôn kinh doanh.`,
          excerpt: "Nắm bắt các xu hướng thiết kế nhận diện thương hiệu mới nhất trong năm 2024 để giữ cho thương hiệu của bạn luôn tươi mới và nổi bật.",
          author: authorId,
          coverImage: "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800&q=80",
          tags: ["Branding", "Design Trends"],
          status: "published"
        },
        {
          title: "Website chuẩn SEO là gì? Checklist 20 điểm cần kiểm tra ngay",
          slug: "website-chuan-seo-la-gi",
          content: `Một website thiết kế đẹp chỉ là bước khởi đầu. Để thu hút khách hàng tiềm năng, website của bạn cần phải "thân thiện" với các công cụ tìm kiếm, đặc biệt là Google.

Website chuẩn SEO không chỉ xoay quanh từ khóa, mà còn liên quan mật thiết đến cấu trúc kỹ thuật và trải nghiệm người dùng (UX). Dưới đây là những yếu tố kỹ thuật then chốt:

1. **Tốc độ tải trang (Page Speed):** Đảm bảo website tải dưới 3 giây. Sử dụng công cụ Google PageSpeed Insights để kiểm tra.
2. **Mobile-friendly:** Website phải hiển thị và thao tác hoàn hảo trên các thiết bị di động. Google áp dụng chính sách Mobile-first indexing.
3. **Cấu trúc URL:** URL cần ngắn gọn, rõ ràng và chứa từ khóa chính. Tránh các URL chứa ký tự vô nghĩa.
4. **Tối ưu Meta Tags:** Mọi trang đều cần thẻ Title (dưới 60 ký tự) và Description (dưới 160 ký tự) hấp dẫn, kích thích Click-through-rate (CTR).
5. **Thẻ Heading chuẩn:** Cấu trúc bài viết cần dùng 1 thẻ H1 duy nhất, sau đó đến các thẻ H2, H3 theo thứ bậc logic.
6. **Hình ảnh được nén tối đa:** Luôn thêm thuộc tính "alt" cho hình ảnh và sử dụng các định dạng hiện đại như WebP.
7. **Sitemap.xml và Robots.txt:** Giúp bot Google thu thập dữ liệu website của bạn dễ dàng hơn.

Nếu website của bạn đang gặp vấn đề trong việc lên top Google, hãy bắt đầu rà soát lại các điểm cơ bản trên trước khi đầu tư vào nội dung hoặc backlink.`,
          excerpt: "Khám phá các tiêu chí kỹ thuật và nội dung cốt lõi giúp website của bạn đạt chuẩn SEO và tăng thứ hạng trên Google.",
          author: authorId,
          coverImage: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
          tags: ["Website", "SEO"],
          status: "published"
        },
        {
          title: "Tối ưu hóa tỷ lệ chuyển đổi (CRO) qua UI/UX Design",
          slug: "toi-uu-hoa-ty-le-chuyen-doi-cro",
          content: `Tỷ lệ chuyển đổi (Conversion Rate) là mạch máu của bất kỳ nền tảng thương mại điện tử hoặc trang đích (landing page) nào. Một thiết kế UI/UX xuất sắc không chỉ làm người dùng "sướng mắt", mà còn điều hướng hành vi của họ một cách mượt mà dẫn đến hành động mua hàng hoặc để lại thông tin.

**Hiệu ứng chim mồi (Decoy Effect) trong bảng giá**
Bạn có để ý tại sao Starbucks luôn có 3 size ly: Tall, Grande, Venti? Size Grande ở giữa thường có giá gần bằng Venti để thúc đẩy bạn mua ly lớn nhất. Trong thiết kế bảng giá, hãy luôn cung cấp một gói "Chim mồi" để làm nổi bật gói mà bạn thực sự muốn khách hàng chọn (Gói Popular).

**Vị trí và màu sắc của nút CTA**
Nút Call-to-action (CTA) cần có độ tương phản cao với nền. Tại IDAZ, chúng tôi thường khuyên dùng màu Cam hoặc Xanh lá cho các hành động mang tính chuyển đổi cao. Ngoài ra, hãy đặt CTA ở những khu vực Dễ chạm (Thumb zone) trên màn hình di động.

**Đơn giản hoá quá trình Checkout**
Mỗi trường điền form thừa là một lý do để người dùng rời bỏ website. Hãy loại bỏ những thông tin không cần thiết, hỗ trợ đăng nhập qua Google/Facebook, và sử dụng auto-fill bất cứ khi nào có thể.

Đầu tư vào UI/UX là đầu tư mang lại ROI cao nhất cho các doanh nghiệp số. Bạn đã sẵn sàng để audit lại thiết kế của mình chưa?`,
          excerpt: "Làm thế nào để áp dụng tâm lý học hành vi vào thiết kế giao diện giúp tăng tỷ lệ chốt đơn và doanh thu cho doanh nghiệp.",
          author: authorId,
          coverImage: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
          tags: ["UI/UX", "Marketing"],
          status: "published"
        },
        {
          title: "Quy trình xây dựng Brand Guidelines chuyên nghiệp",
          slug: "quy-trinh-xay-dung-brand-guidelines",
          content: `Brand Guidelines (Cẩm nang thương hiệu) là "cuốn kinh thánh" quy định mọi quy chuẩn hình ảnh của doanh nghiệp. Nếu không có bộ quy chuẩn này, hình ảnh thương hiệu sẽ dần trở nên lộn xộn mỗi khi có một nhân viên thiết kế mới hoặc khi hợp tác với agency bên ngoài.

**1. Xác định giá trị cốt lõi và tiếng nói thương hiệu (Tone of Voice)**
Trước khi vẽ logo, bạn cần hiểu thương hiệu của mình là ai. Cá tính của thương hiệu là chuyên nghiệp, nghiêm túc hay trẻ trung, phá cách?

**2. Quy chuẩn Logo**
Đây là phần quan trọng nhất. Quy định về kích thước tối thiểu, khoảng cách an toàn (clear space), các phiên bản màu sắc cho phép, và đặc biệt là danh sách "Những điều không được làm với logo".

**3. Bảng màu (Color Palette)**
Xác định màu chính (Primary colors) và màu phụ trợ (Secondary colors). Cần chỉ định rõ mã màu HEX, RGB cho Digital và CMYK, Pantone cho in ấn.

**4. Typography (Phông chữ)**
Thương hiệu dùng font chữ gì cho Tiêu đề (Headings), font gì cho Văn bản (Body text)? Khoảng cách dòng và kích thước quy chuẩn là bao nhiêu?

**5. Hình ảnh và Đồ họa**
Quy chuẩn về phong cách nhiếp ảnh (sáng, tối, filter màu) và phong cách icon (stroke, fill, 3D hay flat).

Sở hữu một Brand Guidelines chuẩn mực giúp tiết kiệm hàng trăm giờ đồng hồ trao đổi, đảm bảo thương hiệu luôn hiện diện một cách chuyên nghiệp nhất ở mọi nơi.`,
          excerpt: "Hướng dẫn từng bước thiết lập cẩm nang nhận diện thương hiệu giúp giữ vững tính nhất quán trên mọi nền tảng truyền thông.",
          author: authorId,
          coverImage: "https://images.unsplash.com/photo-1542744094-24638ea0bc40?w=800&q=80",
          tags: ["Branding", "Guide"],
          status: "published"
        }
      ];

      await Post.insertMany(postsData);
      console.log('✅ Đã tạo 4 bài viết Blog chuẩn SEO.');
    } else {
      console.log('⚠️ Không tìm thấy tài khoản admin, bỏ qua tạo Posts.');
    }

    console.log('Tất cả dữ liệu đã được seed thành công!');
    process.exit(0);
  } catch (error) {
    console.error('Lỗi khi seed data:', error);
    process.exit(1);
  }
};

seedDB();
