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
    if (process.env.NODE_ENV !== 'production') console.log('🔄 Đang kết nối đến Database chính (MongoDB Atlas)...');
    const options = isDevOrTest ? { serverSelectionTimeoutMS: 4000 } : {};
    await mongoose.connect(uri, options);
    if (process.env.NODE_ENV !== 'production') console.log(`✅ Kết nối MongoDB Atlas thành công!`);
  } catch (error) {
    console.warn('⚠️ Lỗi kết nối Atlas (chưa whitelist IP hoặc mạng lỗi):', error.message);
    
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
    const projectStatuses = ['briefing', 'planning', 'designing', 'development', 'reviewing', 'completed', 'cancelled'];
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
        title: 'Xu hướng thiết kế UI/UX nổi bật năm 2026',
        slug: 'xu-huong-thiet-ke-ui-ux-noi-bat-nam-2026',
        content: '<p>Thiết kế giao diện đang ngày càng hướng tới sự tối giản và sử dụng không gian âm...</p>',
        excerpt: 'Khám phá các xu hướng thiết kế sẽ định hình năm 2026.',
        author: admin._id,
        coverImage: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&auto=format&fit=crop',
        tags: ['Design', 'UI/UX'],
        status: 'published'
      },
      {
        title: 'Tối ưu hóa SEO: Bí quyết tăng trưởng tự nhiên',
        slug: 'toi-uu-hoa-seo-bi-quyet-tang-truong-tu-nhien',
        content: '<p>Làm thế nào để website của bạn luôn nằm ở trang nhất Google...</p>',
        excerpt: 'Cách tối ưu SEO hiệu quả cho doanh nghiệp B2B.',
        author: admin._id,
        coverImage: 'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=800&auto=format&fit=crop',
        tags: ['Marketing', 'SEO'],
        status: 'published'
      },
      {
        title: 'Tại sao ReactJS là lựa chọn hàng đầu cho Web App?',
        slug: 'tai-sao-reactjs-la-lua-chon-hang-dau-cho-web-app',
        content: '<p>ReactJS mang lại hiệu năng và trải nghiệm người dùng tuyệt vời...</p>',
        excerpt: 'Phân tích điểm mạnh của ReactJS trong lập trình Frontend.',
        author: admin._id,
        coverImage: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop',
        tags: ['Coding', 'React'],
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
  max: process.env.NODE_ENV === 'production' ? 100 : 5000, 
  message: { success: false, message: 'Bạn đã gửi quá nhiều yêu cầu, vui lòng thử lại sau 15 phút.' }
});
app.use('/api', limiter);

// 4. Body Parser: Đọc JSON từ request body và giới hạn kích thước (Chống quá tải RAM)
app.use(express.json({ limit: '10kb' })); 

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

// 5. Data Sanitization: Bảo vệ khỏi NoSQL Injection (Lọc bỏ các ký tự $, .)
// app.use(mongoSanitize()); // COMMENT OUT due to IncomingMessage bug


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

// Route cơ bản để kiểm tra server
app.get('/api', (req, res) => {
  res.json({ message: 'API Hệ sinh thái Agency đang hoạt động an toàn!' });
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
server.listen(PORT, () => {
  if (process.env.NODE_ENV !== 'production') console.log(`🔒 Server bảo mật đang chạy tại http://localhost:${PORT}`);
});
