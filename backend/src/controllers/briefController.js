const Brief = require('../models/Brief');
const aiService = require('../services/aiService');

// Tạo bản khảo sát mới
exports.createBrief = async (req, res) => {
  try {
    const { companyName, industry, targetAudience, brandPersonality, competitors, additionalNotes, budget, timeline, serviceIds, attachments } = req.body;
    
    const existingBrief = await Brief.findOne({ userId: req.user.id });
    if (existingBrief) {
      return res.status(400).json({ success: false, message: 'Bạn đã gửi Creative Brief rồi.' });
    }

    const newBrief = await Brief.create({
      userId: req.user.id,
      companyName,
      industry,
      targetAudience,
      brandPersonality,
      competitors,
      additionalNotes,
      budget,
      timeline,
      serviceIds: serviceIds || [],
      attachments: attachments || []
    });

    res.status(201).json({ success: true, data: newBrief });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi gửi bản khảo sát.' });
  }
};

// Cập nhật bản khảo sát hiện tại
exports.updateBrief = async (req, res) => {
  try {
    const { companyName, industry, targetAudience, brandPersonality, competitors, additionalNotes, budget, timeline, serviceIds, attachments } = req.body;
    
    let brief = await Brief.findOne({ userId: req.user.id });
    if (!brief) {
      return res.status(404).json({ success: false, message: 'Chưa có bản khảo sát.' });
    }

    brief.companyName = companyName;
    brief.industry = industry;
    brief.targetAudience = targetAudience;
    brief.brandPersonality = brandPersonality;
    brief.competitors = competitors;
    brief.additionalNotes = additionalNotes;
    if (budget !== undefined) brief.budget = budget;
    if (timeline !== undefined) brief.timeline = timeline;
    if (serviceIds !== undefined) brief.serviceIds = serviceIds;
    if (attachments !== undefined) brief.attachments = attachments;
    
    await brief.save();

    res.status(200).json({ success: true, data: brief });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi cập nhật bản khảo sát.' });
  }
};

// Admin: Cập nhật bản khảo sát
exports.updateBriefAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { companyName, industry, targetAudience, brandPersonality, competitors, additionalNotes, budget, timeline, status } = req.body;
    
    let brief = await Brief.findById(id);
    if (!brief) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bản khảo sát.' });
    }

    if (companyName !== undefined) brief.companyName = companyName;
    if (industry !== undefined) brief.industry = industry;
    if (targetAudience !== undefined) brief.targetAudience = targetAudience;
    if (brandPersonality !== undefined) brief.brandPersonality = brandPersonality;
    if (competitors !== undefined) brief.competitors = competitors;
    if (additionalNotes !== undefined) brief.additionalNotes = additionalNotes;
    if (budget !== undefined) brief.budget = budget;
    if (timeline !== undefined) brief.timeline = timeline;
    if (status !== undefined) brief.status = status;
    
    await brief.save();
    
    // Populate để trả về data giống getAllBriefs
    const updatedBrief = await Brief.findById(id).populate('userId', 'name email');

    res.status(200).json({ success: true, data: updatedBrief });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi cập nhật bản khảo sát.' });
  }
};

// Lấy bản khảo sát của user hiện tại
exports.getMyBrief = async (req, res) => {
  try {
    const brief = await Brief.findOne({ userId: req.user.id });
    if (!brief) {
      return res.status(404).json({ success: false, message: 'Chưa có bản khảo sát.' });
    }
    res.status(200).json({ success: true, data: brief });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi lấy dữ liệu.' });
  }
};

// Admin: Lấy tất cả bản khảo sát
exports.getAllBriefs = async (req, res) => {
  try {
    const briefs = await Brief.find().populate('userId', 'name email').sort('-createdAt');
    res.status(200).json({ success: true, data: briefs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi lấy dữ liệu.' });
  }
};

// Admin: Lấy tóm tắt AI cho một brief
exports.getBriefAISummary = async (req, res) => {
  try {
    const { id } = req.params;
    const brief = await Brief.findById(id);
    
    if (!brief) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy Brief.' });
    }

    // Gọi AI service để phân tích
    const aiAnalysis = await aiService.summarizeBrief(brief);

    res.status(200).json({ success: true, data: aiAnalysis });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi gọi AI.' });
  }
};
