const express = require('express');
const cors = require('cors');
require('dotenv').config();
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Ensure public/uploads directory exists
const uploadDir = path.join(__dirname, 'public/uploads');
const recordingsDir = path.join(__dirname, 'public/uploads/recordings');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(recordingsDir)) {
  fs.mkdirSync(recordingsDir, { recursive: true });
}

const app = express();
const PORT = process.env.PORT || 5000;

// Kết nối MongoDB Persistent
const User = require('./src/models/User');
const Task = require('./src/models/Task');
const bcrypt = require('bcryptjs');

const connectDB = async () => {
  let uri = process.env.MONGO_URI;
  const isDevOrTest = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test' || !process.env.NODE_ENV;

  try {
    if (process.env.USE_MEMORY_DB === 'true') {
      throw new Error('Chủ động sử dụng Database Memory theo biến môi trường USE_MEMORY_DB');
    }
    if (process.env.NODE_ENV !== 'production') console.log('🔄 Đang kết nối đến Database chính (MongoDB Atlas)...');
    const options = isDevOrTest ? { serverSelectionTimeoutMS: 4000 } : {};
    await mongoose.connect(uri, options);
    if (process.env.NODE_ENV !== 'production') console.log(`✅ Kết nối MongoDB Atlas thành công!`);
  } catch (error) {
    console.warn('⚠️ Lỗi kết nối Atlas (chưa whitelist IP hoặc sai chuỗi kết nối):', error.message);
    if (error.message.includes('querySrv ENOTFOUND')) {
      console.warn('💡 GỢI Ý Render: Lỗi phân giải DNS (SRV). Vui lòng thử dùng chuỗi kết nối chuẩn (Standard mongodb://) thay vì mongodb+srv:// trong tab Environment của Render.');
    }
    if (isDevOrTest) {
      if (process.env.NODE_ENV !== 'production') console.log('🔄 Đang khởi tạo Database Memory dự phòng (mongodb-memory-server)...');
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create();
        uri = mongod.getUri();
        await mongoose.connect(uri);
        if (process.env.NODE_ENV !== 'production') console.log(`✅ Kết nối thành công Database Memory dự phòng tại: ${uri}`);
      } catch (memError) {
        console.error('❌ Lỗi kích hoạt Database Memory:', memError.message);
        process.exit(1);
      }
    } else {
      console.error('❌ Kết nối CSDL chính thất bại và không thể khởi tạo cơ chế dự phòng ở môi trường Production.');
      process.exit(1);
    }
  }

  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      if (process.env.NODE_ENV !== 'production') console.log('✅ Database đã có dữ liệu. Bỏ qua bước tạo dữ liệu mẫu (Seed Data).');
      return;
    }

    if (process.env.NODE_ENV !== 'production') console.log('🌱 Đang tạo dữ liệu mẫu lần đầu (Seeding)...');

    const { faker } = require('@faker-js/faker');
    const Project = require('./src/models/Project');
    const Invoice = require('./src/models/Invoice');
    const Message = require('./src/models/Message');
    const Service = require('./src/models/Service');
    const Portfolio = require('./src/models/Portfolio');
    const Post = require('./src/models/Post');

    // VIETNAMESE DATA ARRAYS
    const vnNames = [
      'Nguyễn Hoàng Nam', 'Phạm Minh Đức', 'Trần Thị Mai', 'Lê Khánh Huyền', 
      'Vũ Quốc Anh', 'Bùi Xuân Trường', 'Phan Văn Trị', 'Đỗ Thùy Linh', 
      'Ngô Gia Bảo', 'Dương Minh Khang', 'Lý Gia Hân', 'Hoàng Kim Chi', 
      'Trịnh Hồng Sơn', 'Đặng Tuấn Anh', 'Mai Phương Thảo'
    ];
    
    const vnCompanies = [
      'Tập đoàn Công nghệ Alpha', 'Công ty TNHH Giải pháp số Vega', 
      'Tổng công ty Bất động sản Minh Phát', 'Chuỗi bán lẻ thực phẩm EcoMart', 
      'Công ty Logistics Toàn Cầu Giao Hàng Việt', 'Học viện Anh ngữ EduStar',
      'Thương mại Điện tử V-Shop'
    ];

    const vnProjects = [
      { title: 'Hệ thống Quản lý Bán hàng Thương mại Điện tử V-Shop', category: 'Thiết kế Web', desc: 'Xây dựng website bán hàng đa kênh, tích hợp thanh toán trực tuyến, quản lý kho hàng và đơn hàng thời gian thực.' },
      { title: 'Ứng dụng Di động Đặt đồ ăn trực tuyến EcoFood', category: 'Mobile App', desc: 'Phát triển ứng dụng Android và iOS cho phép người dùng tìm kiếm nhà hàng, đặt món ăn sạch trực tuyến và giao hàng nhanh.' },
      { title: 'Website Giới thiệu Dự án Bất động sản Minh Phát', category: 'Thiết kế Web', desc: 'Thiết kế landing page và website cổng thông tin giới thiệu các phân khu căn hộ cao cấp, tích hợp tham quan thực tế ảo 3D.' },
      { title: 'Hệ thống CRM Quản lý Khách hàng Doanh nghiệp Alpha', category: 'Phần mềm Doanh nghiệp', desc: 'Phát triển hệ thống CRM nội bộ giúp quản lý thông tin khách hàng, lịch sử cuộc gọi hỗ trợ và tiến trình tiếp thị liên kết.' },
      { title: 'Phần mềm Quản lý Kho vận & Logistics Giao Hàng Việt', category: 'Phần mềm Doanh nghiệp', desc: 'Xây dựng module quản lý hành trình tài xế, quản lý phiếu xuất nhập kho và quét mã QR barcode phân loại hàng hóa.' },
      { title: 'Cổng thông tin Đào tạo Trực tuyến LMS EduStar', category: 'Thiết kế Web', desc: 'Hệ thống học tập trực tuyến tích hợp phát video bài giảng, làm bài tập trắc nghiệm và chấm điểm chứng chỉ tự động.' }
    ];

    const vnTaskTitles = [
      'Thiết kế wireframe giao diện Trang chủ và Trang chi tiết sản phẩm',
      'Phát triển API xác thực đăng nhập và phân quyền JWT bảo mật',
      'Tích hợp cổng thanh toán trực tuyến MoMo và VNPAY',
      'Tối ưu hóa tốc độ tải trang SEO và hiệu năng Largest Contentful Paint (LCP)',
      'Viết tài liệu Hướng dẫn sử dụng và kiểm thử hộp đen (Black-box testing)',
      'Cấu hình tự động triển khai CI/CD lên server Cloud AWS',
      'Soạn thảo kịch bản truyền thông Marketing và thiết kế Banner',
      'Phỏng vấn và thu thập ý kiến khách hàng về phiên bản thử nghiệm',
      'Thiết kế bộ nhận diện thương hiệu cho dự án (Logo, Font, Color palette)',
      'Kiểm tra rò rỉ bộ nhớ (Memory leak) và cấu hình chứng chỉ SSL HTTPS',
      'Nghiên cứu thị trường và phân tích hành vi người dùng mục tiêu',
      'Thiết lập cấu trúc cơ sở dữ liệu MongoDB và tối ưu chỉ mục (Index)',
      'Lập trình giao diện Dashboard hiển thị biểu đồ doanh thu',
      'Tích hợp gửi email thông báo tự động (Nodemailer)',
      'Review mã nguồn chuẩn chất lượng và tối ưu hóa truy vấn DB'
    ];

    const vnChecklists = [
      'Vẽ bản phác thảo wireframe sơ bộ trên Figma',
      'Họp team thống nhất layout và cấu trúc luồng người dùng',
      'Kiểm tra độ tương phản màu sắc đạt chuẩn WCAG AAA',
      'Lập trình giao diện Frontend chuẩn Responsive',
      'Viết tài liệu đặc tả API chi tiết gửi cho Frontend',
      'Kiểm thử tính năng đăng ký, đăng nhập với mật khẩu mã hóa',
      'Kiểm thử trường hợp mất mạng hoặc timeout từ API',
      'Đóng gói Docker image và deploy test trên staging server'
    ];

    const vnInvoiceTitles = [
      'Hợp đồng thiết kế UI/UX ứng dụng di động EcoFood',
      'Phát triển tính năng cốt lõi và bảo trì hệ thống Tháng 6',
      'Chi phí duy trì và cấu hình hạ tầng Cloud Server AWS',
      'Hợp đồng tối ưu hóa hiệu năng, bảo mật và chuẩn hóa SEO',
      'Chi phí tích hợp cổng thanh toán trực tuyến VNPAY/MoMo',
      'Hợp đồng thiết kế bộ nhận diện thương hiệu Alpha Group'
    ];

    const vnMessages = [
      'Chào admin, dự án thiết kế giao diện bên mình đã tiến hành đến đâu rồi?',
      'Chào anh, team thiết kế đang hoàn thiện trang chủ. Sẽ gửi anh duyệt trong chiều nay ạ.',
      'Tuyệt vời, nhớ kiểm tra kỹ phần hiển thị trên các thiết bị di động nhé.',
      'Vâng anh, bên em đã test responsive trên cả iOS và Android chạy rất mượt mà.',
      'Hóa đơn dịch vụ tháng này bên mình đã gửi qua mail chưa nhỉ?',
      'Chào chị, hóa đơn đã được xuất và gửi trong mục Hóa đơn trên cổng khách hàng rồi ạ.',
      'Tôi đã thanh toán qua VNPAY rồi nhé, admin kiểm tra và xác nhận giúp tôi.',
      'Bên em đã nhận được tiền thanh toán, trạng thái hóa đơn đã được cập nhật thành Đã thanh toán. Cảm ơn chị!',
      'Giao diện rất đẹp, màu sắc hài hòa và tốc độ tải trang nhanh vượt kỳ vọng.',
      'Cảm ơn anh chị đã phản hồi tích cực. Team sẽ tiếp tục tối ưu phần giỏ hàng.',
      'Admin hỗ trợ em cấu hình thêm tính năng gửi tin nhắn tự động khi có đơn hàng mới với.',
      'Dạ được chị nhé, tính năng này bên em sẽ thêm vào Task và báo giá cụ thể ạ.',
      'Mọi người kiểm tra lại nút Đặt hàng trên iPhone bị lệch một chút nhé.',
      'Cảm ơn chị đã phát hiện, bên em đã sửa lại CSS và deploy cập nhật thành công rồi ạ.',
      'Team làm việc rất chuyên nghiệp, phản hồi nhanh và hỗ trợ nhiệt tình.'
    ];

    // CREATE USERS
    const users = [];
    const admin = await User.create({
      name: 'Giám đốc Admin',
      email: 'admin@agency.com',
      password: '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',
      role: 'admin',
      is2FAEnabled: false,
      avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=admin'
    });
    users.push(admin);

    const roles = ['manager', 'developer', 'designer', 'account', 'copywriter'];
    const roleVnNames = {
      manager: 'Trưởng phòng dự án',
      developer: 'Lập trình viên',
      designer: 'Thiết kế đồ hoạ',
      account: 'Account Executive',
      copywriter: 'Chuyên viên nội dung'
    };
    const staffMembers = [];
    for (const role of roles) {
      for (let i = 0; i < 2; i++) {
        const staffName = vnNames[Math.floor(Math.random() * vnNames.length)] + ` (${roleVnNames[role]})`;
        const staff = await User.create({
          name: staffName,
          email: `${role}${i}@agency.com`,
          password: '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',
          role: role,
          avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${role}${i}`
        });
        users.push(staff);
        staffMembers.push(staff);
      }
    }

    const clients = [];
    for (let i = 0; i < 5; i++) {
      const name = vnNames[Math.floor(Math.random() * vnNames.length)];
      const email = `client${i}@agency.com`;
      const user = await User.create({
        name,
        email,
        password: '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',
        role: 'client',
        avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=client${i}`,
        phone: `09${Math.floor(10000000 + Math.random() * 90000000)}`,
        company: vnCompanies[i % vnCompanies.length],
        customerStatus: i % 2 === 0 ? 'vip' : 'active',
        revenue: faker.number.int({ min: 10000000, max: 100000000 }),
      });
      users.push(user);
      clients.push(user);
    }

    // CREATE PROJECTS
    const projectStatuses = ['pending', 'designing', 'coding', 'done'];
    const projects = [];
    for (let i = 0; i < vnProjects.length; i++) {
      const randomClient = clients[Math.floor(Math.random() * clients.length)];
      const projectData = vnProjects[i];
      const project = await Project.create({
        title: projectData.title,
        category: projectData.category,
        description: projectData.desc,
        clientName: randomClient.name,
        clientId: randomClient._id,
        status: projectStatuses[Math.floor(Math.random() * projectStatuses.length)],
        deadline: faker.date.future(),
        progress: faker.number.int({ min: 10, max: 95 }),
        brief: `Bản tóm tắt dự án ${projectData.title} nhằm giải quyết các bài toán kinh doanh, mở rộng kênh bán lẻ trực tuyến và tối ưu hóa hệ thống thông tin nội bộ của doanh nghiệp.`,
        imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&auto=format&fit=crop&q=60',
      });
      projects.push(project);
    }

    // CREATE TASKS
    const taskStatuses = ['todo', 'in_progress', 'reviewing', 'done'];
    const tasks = [];
    for (let i = 0; i < 30; i++) {
      const randomStaff = staffMembers[Math.floor(Math.random() * staffMembers.length)];
      const randomProject = projects[Math.floor(Math.random() * projects.length)];
      const taskStatus = taskStatuses[Math.floor(Math.random() * taskStatuses.length)];
      
      const checklists = [];
      const numChecklists = 2 + Math.floor(Math.random() * 3);
      for(let j=0; j<numChecklists; j++) {
        checklists.push({ 
          title: vnChecklists[Math.floor(Math.random() * vnChecklists.length)], 
          isCompleted: Math.random() > 0.5 
        });
      }

      const comments = [];
      const numComments = Math.floor(Math.random() * 3);
      for(let k=0; k<numComments; k++) {
        comments.push({
          user: (Math.random() > 0.5 ? admin._id : randomStaff._id),
          text: vnMessages[Math.floor(Math.random() * vnMessages.length)],
          createdAt: faker.date.recent()
        });
      }

      const timeTracking = [];
      if (taskStatus === 'in_progress' || taskStatus === 'done') {
        timeTracking.push({
          user: randomStaff._id,
          startTime: faker.date.recent(),
          endTime: new Date(),
          duration: faker.number.int({ min: 1800, max: 14400 })
        });
      }

      const task = await Task.create({
        title: vnTaskTitles[i % vnTaskTitles.length],
        role: randomStaff.role,
        status: taskStatus,
        project: randomProject.title,
        assignee: randomStaff._id,
        checklists,
        comments,
        timeTracking
      });
      tasks.push(task);
    }

    // CREATE INVOICES
    const invoiceStatuses = ['pending', 'paid', 'cancelled'];
    for (let i = 0; i < 10; i++) {
      const randomClient = clients[Math.floor(Math.random() * clients.length)];
      await Invoice.create({
        invoiceNumber: `INV-${1000 + i}`,
        title: vnInvoiceTitles[i % vnInvoiceTitles.length],
        userId: randomClient._id,
        amount: faker.number.int({ min: 5000000, max: 80000000 }),
        status: invoiceStatuses[Math.floor(Math.random() * invoiceStatuses.length)],
        dueDate: faker.date.future()
      });
    }

    // CREATE MESSAGES
    for(let i=0; i<vnMessages.length; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      await Message.create({
        senderId: randomUser._id,
        senderName: randomUser.name,
        senderRole: randomUser.role,
        text: vnMessages[i]
      });
    }

    // CREATE SERVICES
    const services = [
      {
        title: 'Thiết kế Website Cao Cấp',
        slug: 'thiet-ke-website-cao-cap',
        description: 'Giải pháp thiết kế Website đa nền tảng, tối ưu UX/UI và tốc độ tải trang.',
        icon: 'MonitorPlay',
        features: ['Chuẩn SEO', 'Tốc độ tải < 2s', 'Giao diện độc quyền'],
        order: 1
      },
      {
        title: 'Phát triển Mobile App',
        slug: 'phat-trien-mobile-app',
        description: 'Xây dựng ứng dụng di động iOS/Android hiệu năng cao.',
        icon: 'Smartphone',
        features: ['Đồng bộ thời gian thực', 'Bảo mật dữ liệu', 'Bảo trì trọn đời'],
        order: 2
      },
      {
        title: 'Nhận diện Thương hiệu',
        slug: 'nhan-dien-thuong-hieu',
        description: 'Định hình phong cách thương hiệu độc bản giúp tăng tỷ lệ nhận diện.',
        icon: 'Palette',
        features: ['Logo độc quyền', 'Guideline chi tiết', 'Hỗ trợ in ấn'],
        order: 3
      }
    ];
    for (const svc of services) {
      await Service.create(svc);
    }

    // CREATE PORTFOLIOS
    const portfolios = [
      {
        title: 'Hệ thống Thương mại Điện tử V-Shop',
        slug: 'he-thong-thuong-mai-dien-tu-v-shop',
        description: 'Xây dựng website bán lẻ với khả năng xử lý hàng ngàn đơn hàng mỗi phút.',
        category: 'Thiết kế Web',
        clientName: 'Tập đoàn V-Shop',
        coverImage: 'https://images.unsplash.com/photo-1661956602116-aa6865609028?w=800&auto=format&fit=crop',
        isFeatured: true,
        tags: ['E-commerce', 'React', 'Node.js']
      },
      {
        title: 'Ứng dụng Đặt đồ ăn EcoFood',
        slug: 'ung-dung-dat-do-an-ecofood',
        description: 'Phát triển ứng dụng di động đặt món với giao diện tối giản, tối ưu trải nghiệm.',
        category: 'Mobile App',
        clientName: 'EcoFood VN',
        coverImage: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&auto=format&fit=crop',
        isFeatured: true,
        tags: ['Flutter', 'iOS', 'Android']
      },
      {
        title: 'Nhận diện Thương hiệu Alpha Group',
        slug: 'nhan-dien-thuong-hieu-alpha-group',
        description: 'Tái định vị và thiết kế lại bộ nhận diện thương hiệu cho tập đoàn đa quốc gia.',
        category: 'Branding',
        clientName: 'Alpha Group',
        coverImage: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&auto=format&fit=crop',
        isFeatured: true,
        tags: ['Logo Design', 'Brand Identity']
      }
    ];
    for (const port of portfolios) {
      await Portfolio.create(port);
    }

    // CREATE POSTS
    const posts = [
      {
        title: 'Bí quyết Xây dựng Thương hiệu Cá nhân trong thời đại AI',
        slug: 'bi-quyet-xay-dung-thuong-hieu-ca-nhan-thoi-dai-ai',
        content: '<p>Trong bối cảnh AI phát triển mạnh mẽ, việc xây dựng thương hiệu cá nhân không còn chỉ là tạo hình ảnh đẹp mà là khẳng định giá trị độc bản. Đây là lúc con người cần trở nên "người" nhất để không bị thay thế...</p>',
        excerpt: 'Cách làm nổi bật giá trị bản thân khi AI đang dần làm tốt mọi thứ.',
        author: admin._id,
        coverImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop',
        tags: ['Branding', 'Kinh doanh'],
        status: 'published'
      },
      {
        title: 'Case Study: Tái định vị thương hiệu mang lại tăng trưởng x3',
        slug: 'case-study-tai-dinh-vi-thuong-hieu-mang-lai-tang-truong-x3',
        content: '<p>Quá trình tái định vị không chỉ là đổi logo, mà là cấu trúc lại toàn bộ trải nghiệm khách hàng. Bài viết này phân tích hành trình của một startup công nghệ đã lột xác ngoạn mục...</p>',
        excerpt: 'Phân tích sâu chiến lược tái định vị giúp startup bứt phá doanh thu.',
        author: admin._id,
        coverImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop',
        tags: ['Branding', 'Case Study'],
        status: 'published'
      },
      {
        title: 'Tối ưu hóa Tỷ lệ Chuyển đổi (CRO) bằng UI/UX',
        slug: 'toi-uu-hoa-ty-le-chuyen-doi-cro-bang-ui-ux',
        content: '<p>Một nút bấm đổi màu có thể tăng 15% tỷ lệ chuyển đổi. Trải nghiệm người dùng tốt là nền tảng của doanh thu vững chắc. Cùng tìm hiểu các kỹ thuật tối ưu UI/UX thực chiến...</p>',
        excerpt: 'Các thay đổi nhỏ trong giao diện mang lại hiệu quả kinh doanh lớn.',
        author: admin._id,
        coverImage: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&auto=format&fit=crop',
        tags: ['UI/UX', 'Marketing'],
        status: 'published'
      },
      {
        title: 'Hiểu đúng về Marketing dựa trên Dữ liệu (Data-Driven)',
        slug: 'hieu-dung-ve-marketing-dua-tren-du-lieu-data-driven',
        content: '<p>Đừng để dữ liệu đánh lừa bạn. Phân tích dữ liệu trong Marketing đòi hỏi trực giác kinh doanh để biến những con số khô khan thành Insight đắt giá...</p>',
        excerpt: 'Cách chuyển hóa số liệu thành chiến lược Marketing thực chiến.',
        author: admin._id,
        coverImage: 'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=800&auto=format&fit=crop',
        tags: ['Marketing', 'Công nghệ'],
        status: 'published'
      },
      {
        title: 'Xu hướng Thiết kế Giao diện (UI) nổi bật năm 2026',
        slug: 'xu-huong-thiet-ke-giao-dien-ui-noi-bat-nam-2026',
        content: '<p>Thiết kế giao diện đang ngày càng hướng tới sự tối giản, hiệu ứng chuyển động mượt mà (micro-interactions) và không gian âm (negative space)...</p>',
        excerpt: 'Khám phá các xu hướng thiết kế sẽ định hình năm 2026.',
        author: admin._id,
        coverImage: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&auto=format&fit=crop',
        tags: ['Thiết kế', 'UI/UX'],
        status: 'published'
      },
      {
        title: 'Tại sao ReactJS là lựa chọn hàng đầu cho Web App?',
        slug: 'tai-sao-reactjs-la-lua-chon-hang-dau-cho-web-app',
        content: '<p>Hệ sinh thái phong phú, kiến trúc Component mạnh mẽ và cộng đồng hỗ trợ lớn khiến ReactJS không bao giờ lỗi thời trong việc phát triển ứng dụng Web phức tạp...</p>',
        excerpt: 'Phân tích điểm mạnh của ReactJS trong lập trình Frontend.',
        author: admin._id,
        coverImage: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop',
        tags: ['Công nghệ', 'Thiết kế'],
        status: 'published'
      },
      {
        title: 'Nghệ thuật Storytelling trong Truyền thông',
        slug: 'nghe-thuat-storytelling-trong-truyen-thong',
        content: '<p>Khách hàng không mua sản phẩm, họ mua câu chuyện phía sau sản phẩm đó. Xây dựng một câu chuyện thương hiệu chạm đến cảm xúc là nghệ thuật đỉnh cao của Marketing...</p>',
        excerpt: 'Cách kể chuyện thương hiệu để tạo sự kết nối sâu sắc với khách hàng.',
        author: admin._id,
        coverImage: 'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?w=800&auto=format&fit=crop',
        tags: ['Marketing', 'Branding'],
        status: 'published'
      },
      {
        title: 'Thiết kế Logo: Bắt đầu từ đâu?',
        slug: 'thiet-ke-logo-bat-dau-tu-dau',
        content: '<p>Logo không chỉ là một biểu tượng đẹp, nó là bộ mặt của doanh nghiệp. Quy trình thiết kế logo chuẩn quốc tế bao gồm nghiên cứu, phác thảo, và tinh chỉnh không ngừng...</p>',
        excerpt: 'Hướng dẫn quy trình thiết kế Logo chuẩn chỉnh cho người mới.',
        author: admin._id,
        coverImage: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800&auto=format&fit=crop',
        tags: ['Thiết kế', 'Branding'],
        status: 'published'
      },
      {
        title: 'Quản trị Khủng hoảng Truyền thông Mạng xã hội',
        slug: 'quan-tri-khung-hoang-truyen-thong-mang-xa-hoi',
        content: '<p>Một bình luận tiêu cực có thể lan truyền như cháy rừng trên Facebook hay TikTok. Quy trình xử lý khủng hoảng truyền thông cần sự phản ứng nhanh, chân thành và minh bạch...</p>',
        excerpt: 'Bộ cẩm nang xử lý rủi ro trên nền tảng mạng xã hội.',
        author: admin._id,
        coverImage: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&auto=format&fit=crop',
        tags: ['Marketing', 'Kinh doanh'],
        status: 'published'
      },
      {
        title: 'Tự động hóa Quy trình Bán hàng (Sales Automation)',
        slug: 'tu-dong-hoa-quy-trinh-ban-hang-sales-automation',
        content: '<p>Sử dụng CRM và các công cụ Automation để tự động hóa việc chăm sóc khách hàng giúp tiết kiệm 40% thời gian cho đội ngũ Sales và tăng tỷ lệ chốt đơn...</p>',
        excerpt: 'Áp dụng công nghệ vào quy trình Sale để tối đa hóa doanh thu.',
        author: admin._id,
        coverImage: 'https://images.unsplash.com/photo-1558655146-d09347e92766?w=800&auto=format&fit=crop',
        tags: ['Kinh doanh', 'Công nghệ'],
        status: 'published'
      },
      {
        title: 'Màu sắc trong Thiết kế Tác động đến Tâm lý Khách hàng',
        slug: 'mau-sac-trong-thiet-ke-tac-dong-den-tam-ly-khach-hang',
        content: '<p>Tại sao các app ngân hàng thường dùng màu xanh dương? Tại sao các nút kêu gọi hành động (CTA) thường có màu đỏ hoặc cam? Tâm lý học màu sắc là chìa khóa của UI/UX...</p>',
        excerpt: 'Giải mã bí mật đằng sau việc lựa chọn màu sắc thương hiệu.',
        author: admin._id,
        coverImage: 'https://images.unsplash.com/photo-1502691857118-846f42440fce?w=800&auto=format&fit=crop',
        tags: ['UI/UX', 'Thiết kế'],
        status: 'published'
      },
      {
        title: 'Kinh nghiệm Mở rộng Quy mô (Scaling) cho Agency',
        slug: 'kinh-nghiem-mo-rong-quy-mo-scaling-cho-agency',
        content: '<p>Phát triển Agency từ 5 người lên 50 người là một thách thức lớn về mặt quản trị nhân sự, quy trình làm việc và duy trì chất lượng sáng tạo. Đây là bài học từ những người đi trước...</p>',
        excerpt: 'Chiến lược quản trị và phát triển bền vững cho Creative Agency.',
        author: admin._id,
        coverImage: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800&auto=format&fit=crop',
        tags: ['Kinh doanh', 'Quản trị'],
        status: 'published'
      }
    ];
    for (const post of posts) {
      await Post.create(post);
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('✅ Đã tạo các tài khoản mẫu cho Admin, Khách, và Nhân viên thành công.');
    }

  } catch (error) {
    console.error('Lỗi kết nối CSDL:', error);
    process.exit(1);
  }
};

connectDB();

// ==========================================
// BẢO MẬT HỆ THỐNG CAO CẤP (SECURITY LAYER)
// ==========================================

// 1. Helmet: Thiết lập các HTTP Headers bảo mật (Chống Clickjacking, XSS, Sniffing...)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

const cookieParser = require('cookie-parser');
app.use(cookieParser()); // Đọc HTTP-Only Cookies

// 2. CORS: Chỉ cho phép Frontend của bạn (localhost:3000 hoặc domain thật sau này) truy cập API
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000', 'http://localhost:3001',
      'http://127.0.0.1:3000', 'http://127.0.0.1:3001',
      'https://idaz.com.vn', 'https://www.idaz.com.vn',
      process.env.FRONTEND_URL
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Bắt buộc để Frontend gửi và nhận HTTP-Only Cookies
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// 3. Rate Limiting: Chống tấn công DDoS và Spam
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: process.env.NODE_ENV === 'production' ? 5000 : 10000, 
  message: { success: false, message: 'Bạn đã gửi quá nhiều yêu cầu, vui lòng thử lại sau 15 phút.' }
});
app.use('/api', limiter);

// 4. Body Parser: Đọc JSON từ request body và giới hạn kích thước (Chống quá tải RAM)
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Middleware tự động chuyển các đường dẫn tương đối /uploads/... thành URL tuyệt đối để frontend không bị lỗi 404
app.use((req, res, next) => {
  const originalJson = res.json;
  res.json = function (body) {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    const replaceUploads = (obj) => {
      if (obj && typeof obj.toJSON === 'function') {
        obj = obj.toJSON();
      }

      if (typeof obj === 'string' && obj.startsWith('/uploads/')) {
        return `${baseUrl}${obj}`;
      } else if (Array.isArray(obj)) {
        return obj.map(replaceUploads);
      } else if (obj !== null && typeof obj === 'object') {
        // Tránh loop vô hạn hoặc duyệt prototype chains
        const newObj = Array.isArray(obj) ? [] : {};
        for (let key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            newObj[key] = replaceUploads(obj[key]);
          }
        }
        return newObj;
      }
      return obj;
    };
    
    if (body && typeof body === 'object') {
      body = replaceUploads(body);
    }
    return originalJson.call(this, body);
  };
  next();
});

// Phục vụ thư mục static cho Uploads (Truy cập bằng url /uploads/...)
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// 5. Data Sanitization: Bảo vệ khỏi NoSQL Injection an toàn
const mongoSanitize = require('express-mongo-sanitize');
// Chỉ sanitize body, query, params (Bỏ qua stream của Multer)
app.use((req, res, next) => {
  if (req.body) mongoSanitize.sanitize(req.body, { replaceWith: '_' });
  if (req.query) mongoSanitize.sanitize(req.query, { replaceWith: '_' });
  if (req.params) mongoSanitize.sanitize(req.params, { replaceWith: '_' });
  next();
});
// ==========================================
// ROUTER & LOGIC
// ==========================================

const authRoutes = require('./src/routes/authRoutes');
const briefRoutes = require('./src/routes/briefRoutes');
const invoiceRoutes = require('./src/routes/invoiceRoutes');
const userRoutes = require('./src/routes/userRoutes');
const taskRoutes = require('./src/routes/taskRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const assetRoutes = require('./src/routes/assetRoutes');
const folderRoutes = require('./src/routes/folderRoutes');
const recordingRoutes = require('./src/routes/recordingRoutes');
const chatRoutes = require('./src/routes/chatRoutes');
const settingRoutes = require('./src/routes/settingRoutes');
const projectRoutes = require('./src/routes/projectRoutes');
const channelRoutes = require('./src/routes/channelRoutes');
const systemRoutes = require('./src/routes/systemRoutes');
const paymentRoutes = require('./src/routes/paymentRoutes');
const callRoutes = require('./src/routes/callRoutes');
const ticketRoutes = require('./src/routes/ticketRoutes');
const postRoutes = require('./src/routes/postRoutes');
const portfolioRoutes = require('./src/routes/portfolioRoutes');
const feedbackRoutes = require('./src/routes/feedbackRoutes');
const serviceRoutes = require('./src/routes/serviceRoutes');
const bookingRoutes = require('./src/routes/bookingRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/brief', briefRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/recordings', recordingRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/portfolios', portfolioRoutes);
app.use('/api/feedbacks', feedbackRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/bookings', bookingRoutes);

// Route cơ bản để kiểm tra server
app.get('/api', (req, res) => {
  res.json({ message: 'API Hệ sinh thái Agency đang hoạt động an toàn!' });
});

// Route Seed Data chuyên nghiệp
app.post('/api/seed-mock-data', async (req, res) => {
  try {
    const Service = require('./src/models/Service');
    const Portfolio = require('./src/models/Portfolio');
    const Post = require('./src/models/Post');
    const User = require('./src/models/User');

    await Service.deleteMany({});
    await Portfolio.deleteMany({});
    await Post.deleteMany({});

    const admin = await User.findOne({ role: 'admin' });
    const adminId = admin ? admin._id : null;

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

    const posts = [
      {
        title: 'Xu Hướng Thiết Kế Giao Diện UI/UX Thống Trị Năm 2026',
        slug: 'xu-huong-thiet-ke-giao-dien-ui-ux-thong-tri-nam-2026',
        content: '<p>Năm 2026 đánh dấu sự trưởng thành của ngôn ngữ thiết kế Glassmorphism, tiến hóa thành <strong>Liquid Glass</strong>.</p><div class="video-wrapper"><iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div><h2>Sự Tối Giản Nhận Thức</h2><p>Người dùng ngày càng ít kiên nhẫn hơn, do đó giao diện cần phải trong suốt và không có quá nhiều yếu tố cản trở.</p><img src="https://images.unsplash.com/photo-1558655146-d09347e92766?w=1080&auto=format&fit=crop" alt="Liquid Glass Design" />',
        excerpt: 'Khám phá sự tiến hóa của ngôn ngữ Liquid Glass và ứng dụng tối giản nhận thức qua Video phân tích.',
        author: adminId,
        coverImage: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=1080&auto=format&fit=crop',
        tags: ['Thiết kế', 'Video', 'UI/UX'],
        status: 'published'
      },
      {
        title: 'Bí Quyết Tối Ưu Tốc Độ Tải Trang (LCP) Cho Ứng Dụng Next.js',
        slug: 'bi-quyet-toi-uu-toc-do-tai-trang-lcp-cho-ung-dung-nextjs',
        content: '<p>LCP là một trong ba chỉ số Core Web Vitals cốt lõi của Google...</p><h2>Tải ngay Tài liệu Hướng dẫn</h2><p>Chúng tôi đã tổng hợp toàn bộ các kỹ thuật tối ưu hóa LCP vào một cuốn E-Book duy nhất.</p><a href="#" class="download-box"><div class="download-icon">⬇</div><div class="download-info"><span class="download-title">E-Book: Tối ưu LCP Next.js 15</span><span class="download-meta">PDF • 2.4 MB • 50 Trang</span></div></a><p>Trang web tải chậm hơn 2.5s sẽ mất đi 40% người dùng ngay từ lúc chưa thấy nội dung.</p>',
        excerpt: 'Hướng dẫn chi tiết cách đạt 100 điểm Lighthouse Performance kèm E-Book miễn phí.',
        author: adminId,
        coverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1080&auto=format&fit=crop',
        tags: ['Công nghệ', 'Tài liệu', 'Next.js'],
        status: 'published'
      },
      {
        title: 'Xây Dựng Nhận Diện Thương Hiệu Trong Kỷ Nguyên AI',
        slug: 'xay-dung-nhan-dien-thuong-hieu-trong-ky-nguyen-ai',
        content: '<p>Nhiều doanh nghiệp lầm tưởng rằng có thể dùng AI để tự tạo logo và bộ nhận diện thương hiệu...</p><h2>AI Chỉ Là Công Cụ, Con Người Mới Là Linh Hồn</h2><p>Logo do AI tạo ra thường vô hồn và thiếu tính đồng nhất trong một hệ sinh thái brand guidelines phức tạp.</p>',
        excerpt: 'Cách kết hợp trí tuệ nhân tạo (AI) vào quy trình thiết kế thương hiệu.',
        author: adminId,
        coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1080&auto=format&fit=crop',
        tags: ['Branding', 'AI', 'Strategy'],
        status: 'published'
      },
      {
        title: 'Tối Ưu Tỷ Lệ Chuyển Đổi (CRO) Cho Website Bán Hàng',
        slug: 'toi-uu-ty-le-chuyen-doi-cro-cho-website-ban-hang',
        content: '<p>Kéo hàng ngàn người truy cập vào website sẽ vô nghĩa nếu tỷ lệ chuyển đổi (CRO) của bạn dưới 1%...</p><h2>Tâm Lý Học Hành Vi</h2><p>Sử dụng các hiệu ứng mỏ neo và FOMO một cách khéo léo để điều hướng người dùng đến nút Checkout.</p>',
        excerpt: 'Các kỹ thuật Tâm lý học Hành vi ứng dụng trong thiết kế nhằm tăng doanh thu.',
        author: adminId,
        coverImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1080&auto=format&fit=crop',
        tags: ['Marketing', 'E-commerce', 'CRO'],
        status: 'published'
      },
      {
        title: 'Bí Mật Đằng Sau Các Chiến Dịch Viral Marketing Đỉnh Cao',
        slug: 'bi-mat-dang-sau-cac-chien-dich-viral-marketing-dinh-cao',
        content: '<p>Sự thành công của một chiến dịch không đến từ sự may mắn, mà là sự tính toán kỹ lưỡng về thời điểm và cảm xúc...</p><h2>Cảm xúc là chìa khóa</h2><p>Đánh mạnh vào nỗi đau (pain point) hoặc sự tò mò sẽ giúp content lan truyền với tốc độ chóng mặt.</p>',
        excerpt: 'Phân tích các case study thành công từ các brand lớn trên toàn cầu.',
        author: adminId,
        coverImage: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=1080&auto=format&fit=crop',
        tags: ['Marketing', 'Viral', 'Case Study'],
        status: 'published'
      },
      {
        title: 'Làm Sao Để Bắt Đầu Với Khởi Nghiệp Công Nghệ?',
        slug: 'lam-sao-de-bat-dau-voi-khoi-nghiep-cong-nghe',
        content: '<p>Hành trình xây dựng một startup tech đầy rẫy những cạm bẫy...</p><h2>Validate Ý Tưởng</h2><p>Đừng vội viết code, hãy đi bán ý tưởng của bạn trước.</p>',
        excerpt: 'Những bài học đắt giá dành cho Founder trong giai đoạn Seed Funding.',
        author: adminId,
        coverImage: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1080&auto=format&fit=crop',
        tags: ['Kinh doanh', 'Startup', 'Founder'],
        status: 'published'
      },
      {
        title: 'Typography Trong Thiết Kế Web: Đừng Xem Thường Con Chữ',
        slug: 'typography-trong-thiet-ke-web-dung-xem-thuong-con-chu',
        content: '<p>Phông chữ không chỉ để đọc, nó còn truyền tải cảm xúc của thương hiệu...</p><h2>Hierarchy (Phân Cấp)</h2><p>Sử dụng độ đậm nhạt và kích thước chữ khác nhau để điều hướng mắt người xem.</p>',
        excerpt: 'Cách lựa chọn và kết hợp font chữ chuẩn Typography hiện đại.',
        author: adminId,
        coverImage: 'https://images.unsplash.com/photo-1526040652367-600053625333?w=1080&auto=format&fit=crop',
        tags: ['Thiết kế', 'Typography', 'Web Design'],
        status: 'published'
      },
      {
        title: 'Micro-interactions: Điểm Chạm Nhỏ, Cảm Xúc Lớn',
        slug: 'micro-interactions-diem-cham-nho-cam-xuc-lon',
        content: '<p>Những chuyển động nhỏ xíu như nút like nhảy nhẹ, thanh progress bar trôi mượt mà...</p><h2>Delight The User</h2><p>Đó là cách Apple đã làm để giữ chân người dùng trong suốt thập kỷ qua.</p>',
        excerpt: 'Tầm quan trọng của animation nhỏ bé trong trải nghiệm tổng thể.',
        author: adminId,
        coverImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1080&auto=format&fit=crop',
        tags: ['UI/UX', 'Animation', 'UX'],
        status: 'published'
      },
      {
        title: 'Data-driven Marketing vs Intuition-driven Marketing',
        slug: 'data-driven-vs-intuition-driven-marketing',
        content: '<p>Cảm giác của Marketer có còn đáng tin cậy trong thời đại số hóa?</p><h2>Dữ liệu Không Biết Nói Dối</h2><p>A/B Testing sẽ cho bạn câu trả lời chính xác về màu nút CTA nào giúp tăng tỷ lệ chuyển đổi gấp đôi.</p>',
        excerpt: 'Khi dữ liệu lên ngôi, trực giác có còn đất diễn?',
        author: adminId,
        coverImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1080&auto=format&fit=crop',
        tags: ['Marketing', 'Data', 'Analytics'],
        status: 'published'
      },
      {
        title: 'Quản Lý Dòng Tiền Cho Agency: Bài Học Sống Còn',
        slug: 'quan-ly-dong-tien-cho-agency-bai-hoc-song-con',
        content: '<p>Rất nhiều Agency chết trên đống doanh thu ảo chỉ vì không thu được tiền từ khách hàng...</p><h2>Quy Trình Billing Cứng Rắn</h2><p>Làm sao để vừa chiều khách, vừa đảm bảo tiền luôn về tài khoản công ty đúng hạn?</p>',
        excerpt: 'Cách xây dựng quy trình thu hồi công nợ cho công ty Dịch vụ.',
        author: adminId,
        coverImage: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1080&auto=format&fit=crop',
        tags: ['Kinh doanh', 'Finance', 'Agency'],
        status: 'published'
      }
    ];
    await Post.insertMany(posts);

    res.json({ message: 'Seeded professional mock data successfully!' });
  } catch (error) {
    console.error('Lỗi khi seed mock data:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// SOCKET.IO (REAL-TIME NOTIFICATIONS)
// ==========================================
const http = require('http');
const { Server } = require('socket.io');
const Message = require('./src/models/Message');

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Lưu trữ IO instance vào app để các Controller có thể gọi `req.app.get('io')`
app.set('io', io);

io.on('connection', (socket) => {
  if (process.env.NODE_ENV !== 'production') console.log('⚡ Client Connected via Socket:', socket.id);
  
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    if (process.env.NODE_ENV !== 'production') console.log(`User joined room: ${roomId}`);
  });

  // Map lưu trữ User Online (userId -> Set(socket.id))
  // Dùng global.onlineUsers để có thể truy cập từ controller nếu cần
  if (!global.onlineUsers) global.onlineUsers = new Map();
  
  socket.on('join_user', (userId) => {
    socket.join(userId);
    socket.userId = userId; // Gắn userId vào socket instance
    
    let userSockets = global.onlineUsers.get(userId) || new Set();
    userSockets.add(socket.id);
    global.onlineUsers.set(userId, userSockets);
    
    // Broadcast trạng thái online cho mọi người
    io.emit('online_users', Array.from(global.onlineUsers.keys()));
    
    if (process.env.NODE_ENV !== 'production') console.log(`User joined personal channel: ${userId}, Total online: ${global.onlineUsers.size}`);
  });

  // ====== Bổ sung cho Chat Đa Kênh (Channels) ======
  socket.on('join_channel', (channelId) => {
    socket.join(`channel_${channelId}`);
    if (process.env.NODE_ENV !== 'production') console.log(`User joined channel: channel_${channelId}`);
  });

  socket.on('leave_channel', (channelId) => {
    socket.leave(`channel_${channelId}`);
    if (process.env.NODE_ENV !== 'production') console.log(`User left channel: channel_${channelId}`);
  });

  socket.on('typing', ({ channelId, userName }) => {
    socket.to(`channel_${channelId}`).emit('user_typing', { channelId, userName });
  });

  socket.on('stop_typing', ({ channelId, userName }) => {
    socket.to(`channel_${channelId}`).emit('user_stop_typing', { channelId, userName });
  });

  socket.on('message_read', async ({ messageId, channelId, userId }) => {
    try {
      // Broadcast cho những người khác trong channel biết tin nhắn đã được đọc
      io.to(`channel_${channelId}`).emit('message_read_update', { messageId, channelId, userId });
      // Cập nhật Database
      await Message.findByIdAndUpdate(messageId, {
        $addToSet: { readBy: { user: userId, readAt: new Date() } }
      });
    } catch (err) {
      console.error(err);
    }
  });
  // ==================================================

  socket.on('send_message', async (data) => {
    // data: { senderId, receiverId, senderName, senderRole, text }
    try {
      const newMsg = await Message.create({
        senderId: data.senderId,
        receiverId: data.receiverId,
        senderName: data.senderName,
        senderRole: data.senderRole,
        text: data.text
      });
      
      // Emit to receiver's personal channel
      if (data.receiverId) {
        io.to(data.receiverId).emit('receive_message', newMsg);
        
        // Push notification (Step 40)
        const Notification = require('./src/models/Notification');
        const notif = await Notification.create({
          recipient: data.receiverId,
          sender: data.senderId,
          type: 'message',
          title: `Tin nhắn mới từ ${data.senderName}`,
          message: data.text || 'Đã gửi một tin đính kèm',
          link: '/admin/chat'
        });
        io.to(data.receiverId).emit('new_notification', notif);
      }
      
      // Emit back to sender's personal channel to update their UI across devices
      io.to(data.senderId).emit('receive_message', newMsg);
      
    } catch (error) {
      console.error("Lỗi lưu tin nhắn:", error);
    }
  });

  socket.on('send_support_message', async (data) => {
    try {
      const Channel = require('./src/models/Channel');
      const User = require('./src/models/User');
      const Message = require('./src/models/Message');
      
      const supportRoomId = `support_${data.senderId}`;
      let supportChannel = await Channel.findOne({ type: 'support', name: `Hỗ trợ CSKH - ${data.senderName}` });
      
      if (!supportChannel) {
        const admins = await User.find({ role: 'admin' }).select('_id');
        const adminIds = admins.map(a => a._id);
        supportChannel = await Channel.create({
          name: `Hỗ trợ CSKH - ${data.senderName}`,
          type: 'support',
          members: [data.senderId, ...adminIds]
        });
      }

      const newMsg = await Message.create({
        channelId: supportChannel._id,
        senderId: data.senderId,
        senderName: data.senderName,
        senderRole: data.senderRole,
        text: data.text
      });

      supportChannel.lastMessage = newMsg._id;
      await supportChannel.save();

      io.to(supportRoomId).emit('receive_support_message', newMsg);
      io.to(`channel_${supportChannel._id}`).emit('receive_message', newMsg);

      const admins = await User.find({ role: 'admin' }).select('_id');
      const Notification = require('./src/models/Notification');
      for (const admin of admins) {
        io.to(admin._id.toString()).emit('receive_message', newMsg);
        
        const notif = await Notification.create({
          recipient: admin._id,
          sender: data.senderId,
          type: 'message',
          title: `CSKH: ${data.senderName}`,
          message: data.text,
          link: '/admin/chat'
        });
        io.to(admin._id.toString()).emit('new_notification', notif);
      }
    } catch (error) {
      console.error("Lỗi gửi tin nhắn support:", error);
    }
  });

  // ==================================================
  // WEBRTC VIDEO CALL SIGNALING
  // ==================================================
  
  // Map to track active calls
  if (!global.activeCalls) global.activeCalls = new Map();

  socket.on('call_user', (data) => {
    // data: { userToCall, signalData, from, name, type }
    global.activeCalls.set(socket.id, {
      callerId: data.from,
      receiverId: data.userToCall,
      startTime: new Date(),
      type: data.type || 'video',
      accepted: false
    });

    io.to(data.userToCall).emit('call_incoming', { 
      signal: data.signalData, 
      from: data.from, 
      name: data.name,
      type: data.type || 'video'
    });
  });

  socket.on('answer_call', (data) => {
    // data: { to, signal }
    for (let [key, val] of global.activeCalls.entries()) {
      if (val.receiverId === socket.userId || val.callerId === data.to) {
        val.accepted = true;
        val.startTime = new Date(); // Reset time to call start
        break;
      }
    }
    io.to(data.to).emit('call_accepted', data.signal);
  });

  socket.on('end_call', async (data) => {
    // data: { to }
    let callKey = null;
    let callInfo = null;
    for (let [key, val] of global.activeCalls.entries()) {
      if (val.callerId === socket.userId || val.receiverId === socket.userId) {
        callInfo = val;
        callKey = key;
        break;
      }
    }
    if (callInfo) {
      const endTime = new Date();
      const duration = Math.round((endTime - callInfo.startTime) / 1000);
      try {
        const CallLog = require('./src/models/CallLog');
        const User = require('./src/models/User');
        const caller = await User.findById(callInfo.callerId).select('name role');
        const receiver = await User.findById(callInfo.receiverId).select('name role');
        
        await CallLog.create({
          callerId: callInfo.callerId,
          participants: [
            { user: callInfo.callerId, name: caller?.name || 'Người dùng', role: caller?.role },
            { user: callInfo.receiverId, name: receiver?.name || 'Người dùng', role: receiver?.role }
          ],
          startTime: callInfo.startTime,
          endTime: endTime,
          duration: callInfo.accepted ? duration : 0,
          type: callInfo.type,
          status: callInfo.accepted ? 'completed' : 'missed'
        });
      } catch (err) {
        console.error("Lỗi tạo CallLog từ socket:", err);
      }
      global.activeCalls.delete(callKey);
    }
    io.to(data.to).emit('call_ended');
  });

  socket.on('call_reconnect_offer', (data) => {
    io.to(data.to).emit('call_reconnect_offer', { signal: data.signal, from: socket.id });
  });

  socket.on('call_reconnect_answer', (data) => {
    io.to(data.to).emit('call_reconnect_answer', { signal: data.signal });
  });

  // Group call rooms map: roomId -> Map(socketId -> { userId, name })
  if (!global.groupCallRooms) global.groupCallRooms = new Map();

  socket.on('join_call_room', ({ roomId, userId, name }) => {
    socket.join(roomId);
    if (!global.groupCallRooms.has(roomId)) {
      global.groupCallRooms.set(roomId, new Map());
    }
    const room = global.groupCallRooms.get(roomId);
    
    // Notify others in room
    socket.to(roomId).emit('user_joined_call', {
      socketId: socket.id,
      userId,
      name
    });
    
    // Send list of current participants to joiner
    const participants = [];
    for (let [sId, info] of room.entries()) {
      participants.push({ socketId: sId, userId: info.userId, name: info.name });
    }
    
    // Add current user to room map
    room.set(socket.id, { userId, name });
    
    socket.emit('all_call_room_participants', participants);
  });

  socket.on('send_call_signal', ({ toSocketId, signal, fromUserId, fromName }) => {
    io.to(toSocketId).emit('receive_call_signal', {
      signal,
      fromSocketId: socket.id,
      fromUserId,
      fromName
    });
  });

  socket.on('returned_call_signal', ({ toSocketId, signal }) => {
    io.to(toSocketId).emit('returned_call_signal', {
      signal,
      fromSocketId: socket.id
    });
  });

  socket.on('leave_call_room', ({ roomId }) => {
    socket.leave(roomId);
    const room = global.groupCallRooms.get(roomId);
    if (room) {
      room.delete(socket.id);
      if (room.size === 0) {
        global.groupCallRooms.delete(roomId);
      } else {
        socket.to(roomId).emit('user_left_call', { socketId: socket.id });
      }
    }
  });

  socket.on('ice_candidate', (data) => {
    // data: { to, candidate }
    io.to(data.to).emit('ice_candidate', data.candidate);
  });

  // Recording Permission Consent events
  socket.on('request_recording_permission', ({ to, requesterName }) => {
    io.to(to).emit('request_recording_permission', { from: socket.userId || socket.id, requesterName });
  });

  socket.on('recording_permission_response', ({ to, accepted }) => {
    io.to(to).emit('recording_permission_response', { accepted });
  });

  socket.on('disconnect', () => {
    if (process.env.NODE_ENV !== 'production') console.log('❌ Client Disconnected:', socket.id);
    // Cleanup group call rooms
    if (global.groupCallRooms) {
      for (let [roomId, room] of global.groupCallRooms.entries()) {
        if (room.has(socket.id)) {
          room.delete(socket.id);
          socket.to(roomId).emit('user_left_call', { socketId: socket.id });
          if (room.size === 0) {
            global.groupCallRooms.delete(roomId);
          }
        }
      }
    }
    if (socket.userId) {
      let userSockets = global.onlineUsers.get(socket.userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          global.onlineUsers.delete(socket.userId);
          // Broadcast người này đã offline
          io.emit('online_users', Array.from(global.onlineUsers.keys()));
        } else {
          global.onlineUsers.set(socket.userId, userSockets);
        }
      }
    }
  });
});

// Khởi động server
const serverInstance = server.listen(PORT, () => {
  if (process.env.NODE_ENV !== 'production') console.log(`🔒 Server bảo mật đang chạy tại http://localhost:${PORT}`);
});

// Graceful Shutdown - Giải phóng Port khi server bị đóng/restart
const gracefulShutdown = () => {
  console.log('🔄 Đang tắt server một cách an toàn...');
  serverInstance.close(() => {
    console.log('✅ Server đã đóng các kết nối đang mở.');
    mongoose.connection.close(false).then(() => {
      console.log('✅ Đã ngắt kết nối cơ sở dữ liệu MongoDB.');
      process.exit(0);
    });
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
process.on('uncaughtException', (err) => {
  console.error('❌ Có lỗi nghiêm trọng không được bắt (Uncaught Exception):', err);
  gracefulShutdown();
});
process.once('SIGUSR2', () => {
  serverInstance.close(() => {
    process.kill(process.pid, 'SIGUSR2');
  });
});
