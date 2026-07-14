const Service = require('../models/Service');

// Lấy danh sách dịch vụ (Public)
exports.getServices = async (req, res) => {
  try {
    const services = await Service.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
    res.status(200).json({ success: true, data: services });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Lấy danh sách dịch vụ (Admin - Bao gồm cả bị ẩn)
exports.getAllServicesAdmin = async (req, res) => {
  try {
    const services = await Service.find().sort({ order: 1, createdAt: -1 });
    res.status(200).json({ success: true, data: services });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Tạo dịch vụ mới (Admin)
exports.createService = async (req, res) => {
  try {
    const newService = await Service.create(req.body);
    res.status(201).json({ success: true, data: newService });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Đường dẫn (slug) đã tồn tại' });
    }
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Cập nhật dịch vụ (Admin)
exports.updateService = async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!service) return res.status(404).json({ success: false, message: 'Không tìm thấy dịch vụ' });
    res.status(200).json({ success: true, data: service });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Xóa dịch vụ (Admin)
exports.deleteService = async (req, res) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) return res.status(404).json({ success: false, message: 'Không tìm thấy dịch vụ' });
    res.status(200).json({ success: true, message: 'Đã xóa dịch vụ' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};
