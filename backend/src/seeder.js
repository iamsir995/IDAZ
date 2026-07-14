const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { fakerVI } = require('@faker-js/faker');

// Models
const User = require('./models/User');
const Task = require('./models/Task');
const Project = require('./models/Project');
const Invoice = require('./models/Invoice');
const Message = require('./models/Message');

// Load env vars
dotenv.config();

// Vietnamese Seed Data Generators
const HO_VN = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý'];
const DEM_VN = ['Văn', 'Thị', 'Đức', 'Hữu', 'Minh', 'Ngọc', 'Hải', 'Thanh', 'Bảo', 'Gia', 'Hồng', 'Thảo', 'Thành', 'Thu', 'Tuyết'];
const TEN_VN = ['Anh', 'Bình', 'Cường', 'Dũng', 'Dương', 'Hà', 'Hải', 'Hiếu', 'Hòa', 'Huy', 'Hùng', 'Hương', 'Khoa', 'Kiên', 'Lâm', 'Lan', 'Linh', 'Long', 'Mai', 'Nam', 'Nghĩa', 'Ngọc', 'Nhi', 'Phong', 'Phương', 'Quân', 'Quang', 'Quyên', 'Sơn', 'Tài', 'Thành', 'Thảo', 'Thủy', 'Tiến', 'Trang', 'Trung', 'Tuấn', 'Tùng', 'Vinh', 'Yến'];

const genVietnameseName = () => {
  const ho = HO_VN[Math.floor(Math.random() * HO_VN.length)];
  const dem = DEM_VN[Math.floor(Math.random() * DEM_VN.length)];
  const ten = TEN_VN[Math.floor(Math.random() * TEN_VN.length)];
  return `${ho} ${dem} ${ten}`;
};

const genVietnamesePhone = () => {
  const prefixes = ['090', '093', '089', '091', '094', '088', '098', '097', '096', '086', '032', '033'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = Math.floor(1000000 + Math.random() * 9000000).toString().substring(0, 7);
  return `${prefix}${suffix}`;
};

const COMPANY_PREFIXES = ['Công ty Cổ phần', 'Công ty TNHH', 'Tập đoàn', 'Tổng công ty'];
const COMPANY_NAMES = ['Công nghệ VNG', 'Giải pháp FPT', 'Thương mại Dịch vụ Tân Phát', 'Đầu tư Á Châu', 'Xây dựng Hòa Bình', 'Thời trang Blue', 'Bất động sản Đất Xanh', 'Giáo dục VinSchool', 'Bán lẻ Thế Giới Số', 'Dược phẩm Tâm Bình'];

const genVietnameseCompany = () => {
  const prefix = COMPANY_PREFIXES[Math.floor(Math.random() * COMPANY_PREFIXES.length)];
  const name = COMPANY_NAMES[Math.floor(Math.random() * COMPANY_NAMES.length)];
  return `${prefix} ${name}`;
};

const PROJECT_TYPES = ['Website Thương Mại Điện Tử', 'Ứng dụng Mobile App', 'Hệ thống Quản lý CRM', 'Thiết kế Bộ Nhận Diện Thương Hiệu', 'Landing Page Sự kiện', 'Nâng cấp Hệ thống ERP', 'Bảo trì Server Đám mây', 'Chiến dịch Digital Marketing'];

const DEV_TASKS = ['Thiết kế Database Schema', 'Viết API Đăng nhập', 'Tích hợp Thanh toán VNPay', 'Xử lý lỗi giỏ hàng', 'Tối ưu tốc độ tải trang (LCP)', 'Deploy lên AWS EC2', 'Cấu hình SSL Domain', 'Viết Unit Test cho Module Cart'];
const DESIGN_TASKS = ['Vẽ Wireframe Trang chủ', 'Thiết kế Logo Concept 1', 'Thiết kế Banner quảng cáo', 'Cắt HTML/CSS Landing Page', 'Chọn Typography và Bảng màu', 'Làm Animation cho Nút Mua hàng'];

const CHECKLIST_ITEMS = ['Kiểm tra Responsive', 'Đảm bảo chuẩn SEO', 'Test trên Safari/Chrome', 'Báo cáo sếp duyệt', 'Bàn giao source code'];

const COMMENTS_VN = [
  'Đã hoàn thành xong phần này nhé mọi người.',
  'Sếp review giúp em đoạn code này.',
  'Khách hàng yêu cầu đổi màu xanh sang đỏ.',
  'Cần thêm thời gian để fix bug này, khoảng 2 tiếng nữa.',
  'Thiết kế đẹp quá, cứ thế triển khai nhé.',
  'Check lại responsive trên điện thoại bị vỡ layout kìa.',
  'Đã update theo feedback của khách.'
];

const INVOICE_NOTES = ['Thanh toán đợt 1 (50%)', 'Tất toán hợp đồng', 'Phí duy trì server 1 năm', 'Gia hạn tên miền', 'Chi phí thiết kế phát sinh'];

const importData = async () => {
  try {
    const isSeedFlag = process.argv.includes('--seed');
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected...');
    
    // 1. CLEAR DATA
    console.log('🗑️ Clearing old data...');
    await User.deleteMany();
    await Task.deleteMany();
    await Project.deleteMany();
    await Invoice.deleteMany();
    await Message.deleteMany();

    console.log('🌱 Generating new data with Vietnamese context...');

    // 2. CREATE USERS
    const users = [];
    
    // 2.1 Admin
    const admin = await User.create({
      name: 'Giám đốc Tuấn',
      email: 'admin@agency.com',
      password: '123456',
      role: 'admin',
      phone: genVietnamesePhone(),
      avatar: fakerVI.image.avatar()
    });
    users.push(admin);

    // 2.2 Managers & Staffs
    const roles = ['manager', 'dev', 'content', 'intern', 'affiliate'];
    const staffMembers = [];
    
    for (const role of roles) {
      for (let i = 0; i < 2; i++) {
        const staffName = genVietnameseName();
        const staff = await User.create({
          name: staffName,
          email: `${role}${i}@agency.com`, // Email dễ nhớ để test
          password: '123456',
          role: role,
          phone: genVietnamesePhone(),
          avatar: fakerVI.image.avatar()
        });
        users.push(staff);
        staffMembers.push(staff);
      }
    }

    // 2.3 Clients
    const clients = [];
    const clientStatuses = ['vip', 'active', 'lead'];
    for (let i = 0; i < 6; i++) {
      const clientName = genVietnameseName();
      const client = await User.create({
        name: clientName,
        email: `client${i}@agency.com`, // Email dễ nhớ để test
        password: '123456',
        role: 'client',
        phone: genVietnamesePhone(),
        company: genVietnameseCompany(),
        customerStatus: clientStatuses[i % 3],
        revenue: fakerVI.number.int({ min: 20000000, max: 200000000 }), // Doanh thu 20tr - 200tr
        avatar: fakerVI.image.avatar()
      });
      users.push(client);
      clients.push(client);
    }

    console.log(`✅ Created ${users.length} users.`);

    // 3. CREATE PROJECTS
    const projectStatuses = ['pending', 'designing', 'coding', 'done'];
    const projects = [];
    for (let i = 0; i < 8; i++) {
      const randomClient = clients[Math.floor(Math.random() * clients.length)];
      const projectType = PROJECT_TYPES[Math.floor(Math.random() * PROJECT_TYPES.length)];
      
      const project = await Project.create({
        title: `${projectType} cho ${randomClient.company.split(' ').slice(2).join(' ')}`,
        category: projectType.includes('Website') ? 'Web Development' : (projectType.includes('App') ? 'Mobile App' : 'Design'),
        description: `Dự án này yêu cầu thực hiện ${projectType.toLowerCase()} với các tiêu chuẩn cao nhất về UI/UX và Performance. Khách hàng mong muốn hoàn thành trong quý này.`,
        client: randomClient._id,
        status: projectStatuses[Math.floor(Math.random() * projectStatuses.length)],
        progress: fakerVI.number.int({ min: 10, max: 100 }),
        deadline: fakerVI.date.soon({ days: 60 }),
        budget: fakerVI.number.int({ min: 30000000, max: 150000000 })
      });
      projects.push(project);
    }

    console.log(`✅ Created ${projects.length} projects.`);

    // 4. CREATE TASKS
    const taskStatuses = ['todo', 'in_progress', 'done'];
    const tasks = [];
    
    for (let i = 0; i < 40; i++) {
      const randomStaff = staffMembers[Math.floor(Math.random() * staffMembers.length)];
      const randomProject = projects[Math.floor(Math.random() * projects.length)];
      const taskStatus = taskStatuses[Math.floor(Math.random() * taskStatuses.length)];
      
      const isDesign = randomStaff.role === 'content' || randomStaff.role === 'manager';
      const taskTitle = isDesign ? DESIGN_TASKS[Math.floor(Math.random() * DESIGN_TASKS.length)] : DEV_TASKS[Math.floor(Math.random() * DEV_TASKS.length)];

      const checklists = [];
      const numChecklists = fakerVI.number.int({ min: 1, max: 4 });
      for(let j=0; j<numChecklists; j++) {
        checklists.push({
          title: CHECKLIST_ITEMS[Math.floor(Math.random() * CHECKLIST_ITEMS.length)],
          isCompleted: fakerVI.datatype.boolean()
        });
      }

      const comments = [];
      const numComments = fakerVI.number.int({ min: 0, max: 3 });
      for(let k=0; k<numComments; k++) {
        comments.push({
          user: (Math.random() > 0.5 ? admin._id : randomStaff._id),
          text: COMMENTS_VN[Math.floor(Math.random() * COMMENTS_VN.length)],
          createdAt: fakerVI.date.recent()
        });
      }

      const timeTracking = [];
      if (taskStatus === 'in_progress' || taskStatus === 'done' || taskStatus === 'review') {
        timeTracking.push({
          user: randomStaff._id,
          startTime: fakerVI.date.recent(),
          endTime: new Date(),
          duration: fakerVI.number.int({ min: 1800, max: 14400 }) // 30 mins to 4 hours
        });
      }

      const task = await Task.create({
        title: taskTitle,
        role: randomStaff.role,
        status: taskStatus,
        project: randomProject._id,
        assignee: randomStaff._id,
        checklists,
        comments,
        timeTracking,
        dueDate: fakerVI.date.soon({ days: 15 }),
        priority: ['low', 'normal', 'high', 'urgent'][Math.floor(Math.random() * 4)]
      });
      tasks.push(task);
    }
    console.log(`✅ Created ${tasks.length} tasks.`);

    // 5. CREATE INVOICES
    const invoiceStatuses = ['pending', 'paid', 'cancelled'];
    for (let i = 0; i < 15; i++) {
      const randomClient = clients[Math.floor(Math.random() * clients.length)];
      const randomProject = projects.find(p => p.client?.toString() === randomClient._id.toString());
      
      await Invoice.create({
        invoiceNumber: `INV-${fakerVI.string.numeric(4)}`,
        title: INVOICE_NOTES[Math.floor(Math.random() * INVOICE_NOTES.length)],
        userId: randomClient._id,
        projectId: randomProject ? randomProject._id : null,
        amount: fakerVI.number.int({ min: 5000000, max: 50000000 }),
        status: invoiceStatuses[Math.floor(Math.random() * invoiceStatuses.length)],
        dueDate: fakerVI.date.soon({ days: 30 }),
        assets: []
      });
    }
    console.log(`✅ Created 15 invoices.`);

    // 6. CREATE MESSAGES (Global chat room)
    const messages = [];
    for(let i=0; i<20; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      await Message.create({
        senderId: randomUser._id,
        room: 'agency_global_room', // Must match the frontend default channel
        content: COMMENTS_VN[Math.floor(Math.random() * COMMENTS_VN.length)]
      });
    }
    console.log(`✅ Created 20 messages.`);

    console.log('🎉 Toàn bộ dữ liệu mẫu (Tiếng Việt) đã được khởi tạo thành công!');
    process.exit();
  } catch (error) {
    console.error('❌ Error importing data: ', error);
    process.exit(1);
  }
};

importData();
