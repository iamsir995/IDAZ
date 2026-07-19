const Booking = require('../models/Booking');

exports.createBooking = async (req, res) => {
  try {
    const { name, email, date, time, message } = req.body;
    const booking = await Booking.create({ name, email, date, time, message });
    res.status(201).json({ success: true, data: booking });
  } catch (error) {
    console.error('[createBooking] Lỗi:', error.message);
    res.status(500).json({ success: false, message: 'Lỗi khi tạo lịch đặt', error: error.message });
  }
};

exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().sort('-createdAt');
    res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi lấy danh sách lịch đặt', error: error.message });
  }
};
