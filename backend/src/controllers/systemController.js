const { backupDatabase } = require('../../scripts/backup');
const AuditLog = require('../models/AuditLog');

exports.getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .populate('user', 'name role email')
      .sort({ createdAt: -1 })
      .limit(100);
    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi tải lịch sử nhật ký hệ thống.', error: error.message });
  }
};

exports.triggerBackup = async (req, res) => {
  try {
    // Note: backupDatabase handles its own connect/disconnect. 
    // In an API context, we're already connected, but backupDatabase might reconnect or use its own connection logic.
    // To be safe in an API context, it's better to just spawn a child process or adjust the script to reuse the connection.
    // For now, let's spawn a child process to run the backup script so it doesn't interfere with the main app connection.
    
    const { exec } = require('child_process');
    const path = require('path');
    
    const scriptPath = path.join(__dirname, '..', '..', 'scripts', 'backup.js');
    
    exec(`node "${scriptPath}"`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Backup error: ${error.message}`);
        return res.status(500).json({ success: false, message: 'Lỗi khi tạo bản sao lưu.', error: error.message });
      }
      if (stderr) {
        console.warn(`Backup stderr: ${stderr}`);
      }
      console.log(`Backup stdout: ${stdout}`);
      
      res.status(200).json({
        success: true,
        message: 'Đã tạo bản sao lưu dữ liệu thành công.',
        log: stdout
      });
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server khi tạo backup', error: error.message });
  }
};
