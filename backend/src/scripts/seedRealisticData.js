const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { fakerVI } = require('@faker-js/faker');

// Models
const User = require('../models/User');
const Service = require('../models/Service');
const Portfolio = require('../models/Portfolio');
const Post = require('../models/Post');
const Brief = require('../models/Brief');
const Ticket = require('../models/Ticket');
const Project = require('../models/Project');
const Channel = require('../models/Channel');
const Message = require('../models/Message');

dotenv.config();

const importData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected...');
    
    console.log('🗑️ Clearing target collections...');
    await Service.deleteMany();
    await Portfolio.deleteMany();
    await Post.deleteMany();
    await Brief.deleteMany();
    await Ticket.deleteMany();
    await Channel.deleteMany();
    await Message.deleteMany();
    // Do not delete Users and Projects here so we can reference existing ones

    const admin = await User.findOne({ role: 'admin' });
    let clients = await User.find({ role: 'client' });
    let projects = await Project.find();
    
    if (!admin || clients.length === 0) {
      console.log('⚠️ Không tìm thấy admin hoặc clients, vui lòng chạy seeder.js trước.');
      process.exit();
    }

    console.log('🌱 Bắt đầu tạo dữ liệu Agency (Realistic Data)...');

    // 1. SERVICES
    const servicesData = [
      {
        title: 'Thiết kế Nhận diện Thương hiệu (Branding)',
        slug: 'thiet-ke-nhan-dien-thuong-hieu',
        description: 'Tạo dựng hình ảnh thương hiệu chuyên nghiệp, khác biệt và đáng nhớ trong tâm trí khách hàng. Chúng tôi cung cấp bộ quy chuẩn logo, màu sắc, typography và các ấn phẩm truyền thông đồng bộ.',
        shortDescription: 'Giải pháp xây dựng thương hiệu toàn diện.',
        icon: 'Palette',
        price: 'Từ 15.000.000đ',
        features: ['Thiết kế Logo 3 options', 'Bộ quy chuẩn Brand Guideline', 'Thiết kế danh thiếp, phong bì', 'Thiết kế Profile / Hồ sơ năng lực']
      },
      {
        title: 'Thiết kế & Lập trình Website (Web Development)',
        slug: 'thiet-ke-lap-trinh-website',
        description: 'Phát triển website chuẩn SEO, tốc độ cao với trải nghiệm người dùng (UX) tối ưu. Áp dụng công nghệ hiện đại nhất (React, Next.js, Node.js) để website hoạt động mượt mà và bảo mật.',
        shortDescription: 'Website chuyên nghiệp, tốc độ và chuẩn SEO.',
        icon: 'MonitorPlay',
        price: 'Từ 20.000.000đ',
        features: ['Giao diện độc quyền (UI/UX)', 'Tối ưu tốc độ tải trang (Core Web Vitals)', 'Quản trị nội dung CMS dễ dùng', 'Tích hợp thanh toán online']
      },
      {
        title: 'Performance Marketing & SEO',
        slug: 'performance-marketing-seo',
        description: 'Tối ưu hóa công cụ tìm kiếm và chạy quảng cáo chuyển đổi cao. Giúp doanh nghiệp của bạn tiếp cận hàng triệu khách hàng tiềm năng với chi phí tối ưu nhất.',
        shortDescription: 'Tăng trưởng doanh thu đột phá qua Digital Marketing.',
        icon: 'TrendingUp',
        price: 'Từ 10.000.000đ/tháng',
        features: ['SEO Tổng thể & On-page/Off-page', 'Chạy quảng cáo Google/Facebook Ads', 'Báo cáo hiệu suất theo thời gian thực', 'Tối ưu hóa tỷ lệ chuyển đổi (CRO)']
      }
    ];
    
    const services = await Service.insertMany(servicesData);
    console.log('✅ Created 3 Services.');

    // 2. PORTFOLIOS (Case Studies)
    const portfoliosData = [
      {
        title: 'Tái định vị thương hiệu Chuỗi Cà phê The Local',
        slug: 'branding-the-local-coffee',
        description: 'Dự án tái định vị thương hiệu cho The Local - chuỗi cà phê specialty đang mở rộng nhanh chóng. Mục tiêu là tạo ra sự gần gũi nhưng vẫn giữ được nét hiện đại, tối giản.',
        category: 'Branding',
        clientName: 'The Local Coffee',
        challenge: 'Khách hàng mục tiêu đang bị nhầm lẫn The Local với các thương hiệu cà phê bình dân khác do hình ảnh cũ chưa đủ sắc nét và thiếu điểm nhấn.',
        solution: 'Chúng tôi thiết kế lại toàn bộ hệ thống nhận diện, từ logo với typography độc bản đến màu cam đất chủ đạo ấm áp. Bao bì sản phẩm được thiết kế tối giản, tập trung vào chất lượng hạt cà phê.',
        results: 'Sau 3 tháng ra mắt nhận diện mới, doanh thu của The Local tăng 35% nhờ thu hút thêm tệp khách hàng Gen Z. Mức độ nhận diện trên Mạng xã hội tăng 150%.',
        projectUrl: 'https://thelocal.coffee',
        coverImage: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=800&auto=format&fit=crop',
        images: ['https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=800&auto=format&fit=crop'],
        isFeatured: true,
        tags: ['Logo', 'Packaging', 'Brand Guideline']
      },
      {
        title: 'Website Thương Mại Điện Tử Cho Vento Shoes',
        slug: 'ecommerce-vento-shoes',
        description: 'Xây dựng nền tảng thương mại điện tử hiện đại, tốc độ cao giúp Vento Shoes chuyển đổi số toàn diện mô hình kinh doanh bán lẻ giày dép.',
        category: 'Web Development',
        clientName: 'Vento Việt Nam',
        challenge: 'Website cũ load chậm (>5s), tỷ lệ rớt đơn tại giỏ hàng cao. Khó khăn trong việc quản lý kho hàng đồng bộ với cửa hàng vật lý.',
        solution: 'Sử dụng kiến trúc Headless E-commerce với Next.js và Node.js. Thiết kế lại luồng Check-out tối giản chỉ còn 2 bước. Tích hợp thanh toán VNPay và tự động đồng bộ kho.',
        results: 'Tốc độ tải trang giảm xuống dưới 1s. Tỷ lệ chuyển đổi mua hàng tăng 40% trong tháng đầu tiên.',
        projectUrl: 'https://ventoshoes.com',
        coverImage: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800&auto=format&fit=crop',
        images: ['https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=800&auto=format&fit=crop'],
        isFeatured: true,
        tags: ['E-commerce', 'React', 'NodeJS', 'UI/UX']
      }
    ];

    await Portfolio.insertMany(portfoliosData);
    console.log('✅ Created 2 Portfolio Case Studies.');

    // 3. POSTS (Blog SEO)
    const postsData = [
      {
        title: '7 Xu Hướng Thiết Kế Website Nổi Bật Nhất Năm 2026',
        slug: '7-xu-huong-thiet-ke-website-2026',
        content: '<p>Thiết kế website luôn thay đổi không ngừng. Trong năm 2026, chúng ta sẽ chứng kiến sự bùng nổ của giao diện kính (Glassmorphism) kết hợp với AI-driven UI.</p><p>Hơn bao giờ hết, tốc độ tải trang sẽ quyết định thứ hạng SEO...</p>',
        excerpt: 'Khám phá 7 xu hướng thiết kế web đang thống trị năm 2026, giúp doanh nghiệp bạn đi trước thời đại và thu hút khách hàng hiệu quả.',
        author: admin._id,
        coverImage: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=800&auto=format&fit=crop',
        tags: ['Web Design', 'UI/UX', 'Trends'],
        metaTitle: '7 Xu Hướng Thiết Kế Website Nổi Bật Nhất Năm 2026 | IDAZ',
        metaDescription: 'Tổng hợp 7 xu hướng thiết kế web hàng đầu năm 2026 giúp tăng chuyển đổi. Tối ưu UI/UX, Glassmorphism và AI trong thiết kế.',
        status: 'published'
      },
      {
        title: 'Performance Marketing Là Gì? Tại Sao Doanh Nghiệp Cần Nó?',
        slug: 'performance-marketing-la-gi',
        content: '<p>Khác với Marketing truyền thống tập trung vào Branding, Performance Marketing tính tiền dựa trên KẾT QUẢ THỰC TẾ (Click, Lead, Sale).</p><p>Điều này giúp các chủ doanh nghiệp tối ưu từng đồng ngân sách quảng cáo...</p>',
        excerpt: 'Hiểu rõ về Performance Marketing và lý do nó đang trở thành vũ khí sắc bén nhất của các công ty E-commerce.',
        author: admin._id,
        coverImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800&auto=format&fit=crop',
        tags: ['Marketing', 'Ads', 'Business'],
        metaTitle: 'Performance Marketing Là Gì? Tại Sao Doanh Nghiệp Cần Nó',
        metaDescription: 'Giải ngố về Performance Marketing. Cách tối ưu chi phí quảng cáo (CPA, ROAS) mang lại doanh thu thực tế cho doanh nghiệp.',
        status: 'published'
      }
    ];

    await Post.insertMany(postsData);
    console.log('✅ Created 2 Blog Posts.');

    // 4. BRIEFS
    for (let i = 0; i < 3; i++) {
      const client = clients[i];
      await Brief.create({
        userId: client._id,
        companyName: client.company,
        industry: ['Bất động sản', 'F&B', 'Bán lẻ'][i],
        targetAudience: 'Giới trẻ 18-35 tuổi, thu nhập trung bình khá.',
        brandPersonality: ['Hiện đại', 'Tối giản', 'Năng động'],
        competitors: 'Các đối thủ trong cùng phân khúc.',
        additionalNotes: 'Cần làm gấp trong tháng này.',
        budget: ['50tr - 100tr', 'Dưới 50tr', 'Trên 200tr'][i],
        timeline: '1 tháng',
        serviceIds: [services[i % services.length]._id],
        status: 'submitted'
      });
    }
    console.log('✅ Created 3 Realistic Briefs.');

    // 5. TICKETS
    for (let i = 0; i < 3; i++) {
      const client = clients[i];
      const project = projects.find(p => p.client?.toString() === client._id.toString());
      
      const ticket = await Ticket.create({
        title: 'Lỗi không hiển thị ảnh trên điện thoại',
        description: 'Chào đội ngũ kỹ thuật, hôm nay mình check website trên iPhone thì thấy ảnh banner bị mất.',
        priority: 'high',
        status: 'in_progress',
        userId: client._id,
        projectId: project ? project._id : null
      });

      // Thêm 2 replies mô phỏng
      ticket.replies.push({
        senderId: admin._id,
        senderName: admin.name,
        senderRole: admin.role,
        message: 'Chào bạn, bên mình đã ghi nhận lỗi. Lỗi này do Safari trên iOS caching ảnh sai. Đội kỹ thuật sẽ fix ngay trong 30p nhé.',
        createdAt: new Date(Date.now() - 3600000)
      });

      ticket.replies.push({
        senderId: client._id,
        senderName: client.name,
        senderRole: client.role,
        message: 'Cảm ơn admin, fix xong báo lại mình nhé.',
        createdAt: new Date(Date.now() - 1800000)
      });

      await ticket.save();
    }
    console.log('✅ Created 3 Tickets with replies.');

    // 6. WORKSPACE CHAT
    for (let i = 0; i < 2; i++) {
      const client = clients[i];
      const project = projects.find(p => p.client?.toString() === client._id.toString());
      
      if (project) {
        // Tạo Project Channel
        const channel = await Channel.create({
          name: `project-${project._id.toString().substring(18)}`,
          type: 'project',
          projectId: project._id,
          members: [admin._id, client._id]
        });

        // Tạo hội thoại trong channel
        await Message.create({
          channelId: channel._id,
          senderId: admin._id,
          content: `Chào anh/chị ${client.name}, em đã tạo nhóm chat cho dự án ${project.title}. Mọi người trao đổi tiến độ ở đây nhé.`
        });
        
        await Message.create({
          channelId: channel._id,
          senderId: client._id,
          content: 'Cảm ơn em. Tuần này mình chốt được bản wireframe đầu tiên không em?'
        });
      }
    }
    console.log('✅ Created Workspace Channels & Messages.');

    console.log('🎉 TOÀN BỘ DỮ LIỆU AGENCY (REALISTIC DATA) ĐÃ ĐƯỢC CHÈN THÀNH CÔNG!');
    process.exit();
  } catch (error) {
    console.error('❌ Error importing realistic data: ', error);
    process.exit(1);
  }
};

importData();
