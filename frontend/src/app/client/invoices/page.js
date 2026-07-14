"use client";

import { useState, useEffect } from "react";
import api from "../../../services/api";
import { Receipt, CheckCircle, Clock, Printer, CreditCard, AlertCircle, TrendingUp, Ban, X, Building, Wallet } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

export default function ClientInvoices() {
 const [invoices, setInvoices] = useState([]);
 const [loading, setLoading] = useState(true);
 
 // Payment Modal State
 const [paymentModalOpen, setPaymentModalOpen] = useState(false);
 const [selectedInvoice, setSelectedInvoice] = useState(null);
 const [paymentMethods, setPaymentMethods] = useState([]);
 const [selectedMethod, setSelectedMethod] = useState(null);
 const [isProcessing, setIsProcessing] = useState(false);
 const [qrCodeData, setQrCodeData] = useState(null);

 useEffect(() => { 
 fetchMyInvoices(); 
 fetchPaymentMethods();
 }, []);

 const fetchMyInvoices = async () => {
 try {
 const res = await api.get('/invoices/my-invoices');
 if (res.data.success) setInvoices(res.data.data);
 } catch { toast.error("Lỗi khi tải hóa đơn"); }
 finally { setLoading(false); }
 };

 const fetchPaymentMethods = async () => {
 try {
 const res = await api.get('/payments/methods');
 if (res.data.success) {
 setPaymentMethods(res.data.data);
 }
 } catch (e) {
 console.log("Could not load payment methods", e);
 }
 }

 const openPaymentModal = (inv) => {
 setSelectedInvoice(inv);
 setSelectedMethod(paymentMethods.length > 0 ? paymentMethods[0].id : null);
 setQrCodeData(null);
 setPaymentModalOpen(true);
 };

 const handleCheckout = async () => {
 if (!selectedMethod) return toast.error("Vui lòng chọn phương thức thanh toán");
 
 setIsProcessing(true);
 try {
 const res = await api.post('/payments/checkout', {
 invoiceId: selectedInvoice._id,
 method: selectedMethod
 });
 
 if (res.data.success) {
 if (selectedMethod === 'bankTransfer') {
 setQrCodeData(res.data.data.qrUrl);
 } else if (selectedMethod === 'vnpay') {
 window.location.href = res.data.url;
 } else {
 toast.success("Hệ thống đang cập nhật phương thức này.");
 }
 }
 } catch (error) {
 toast.error(error?.response?.data?.message || "Lỗi khởi tạo thanh toán");
 } finally {
 setIsProcessing(false);
 }
 };

 const handlePrint = (invoice) => {
 const printWindow = window.open('', '_blank');
 printWindow.document.write(`
 <html><head><title>Hóa đơn ${invoice.invoiceNumber}</title>
 <style>
 body { font-family: Arial, sans-serif; padding: 40px; color: #333; line-height: 1.6; }
 .header { border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; }
 .title { font-size: 28px; color: #4f46e5; font-weight: bold; margin: 0; }
 .badge { display: inline-block; padding: 5px 15px; border-radius: 20px; font-weight: bold; font-size: 14px; }
 .badge.paid { background: #dcfce7; color: #166534; }
 .badge.pending { background: #fef9c3; color: #854d0e; }
 .total { font-size: 24px; font-weight: bold; border-top: 2px solid #eee; padding-top: 20px; margin-top: 30px; text-align: right; }
 </style></head><body>
 <div class="header"><div><h1 class="title">INVOICE</h1><p>Mã: <strong>${invoice.invoiceNumber}</strong></p></div>
 <div style="text-align: right"><span class="badge ${invoice.status}">${invoice.status === 'paid' ? 'ĐÃ THANH TOÁN' : 'CHƯA THANH TOÁN'}</span></div></div>
 <div><h3>Chi tiết Dịch vụ</h3>
 <p><strong>Nội dung:</strong> ${invoice.title}</p>
 <p><strong>Hạn thanh toán:</strong> ${new Date(invoice.dueDate).toLocaleDateString('vi-VN')}</p></div>
 <div class="total">Tổng cộng: ${invoice.amount.toLocaleString('vi-VN')} ₫</div>
 <div style="margin-top: 50px; font-size: 12px; color: #888; text-align: center;"><p>Cảm ơn quý khách đã sử dụng dịch vụ!</p></div>
 </body></html>`);
 printWindow.document.close();
 printWindow.focus();
 setTimeout(() => printWindow.print(), 500);
 };

 const totalPaid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0);
 const totalPending = invoices.filter(i => i.status === 'pending').reduce((s, i) => s + i.amount, 0);
 const pendingCount = invoices.filter(i => i.status === 'pending').length;

 if (loading) return (
 <div className="flex items-center justify-center h-64">
 <div className="text-gray-400 text-center">
 <Receipt size={40} className="mx-auto mb-3 opacity-30 animate-pulse" />
 <p>Đang tải hóa đơn...</p>
 </div>
 </div>
 );

 return (
 <div className="max-w-5xl mx-auto">
 {/* Header */}
 <div className="mb-8">
 <h1 className="text-3xl font-bold text-idaz-black">Hóa đơn của tôi</h1>
 <p className="text-gray-500 mt-1">Theo dõi công nợ và thanh toán trực tuyến.</p>
 </div>

 {/* Stats cards */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
 <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
 className="glass-panel rounded-3xl border border-white/60 shadow-sm p-5">
 <div className="flex items-center gap-3 mb-3">
 <div className="w-10 h-10 bg-emerald-50 rounded-3xl flex items-center justify-center">
 <CheckCircle size={20} className="text-emerald-600" />
 </div>
 <div className="text-sm font-medium text-gray-500">Đã thanh toán</div>
 </div>
 <div className="text-2xl font-extrabold text-idaz-black">{totalPaid.toLocaleString('vi-VN')} ₫</div>
 </motion.div>

 <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
 className={`glass-panel rounded-3xl border shadow-sm p-5 ${pendingCount > 0 ? 'border-amber-200 bg-amber-50/50' : 'border-white/60'}`}>
 <div className="flex items-center gap-3 mb-3">
 <div className="w-10 h-10 bg-amber-50 rounded-3xl flex items-center justify-center">
 <Clock size={20} className="text-amber-600" />
 </div>
 <div className="text-sm font-medium text-gray-500">Chờ thanh toán</div>
 </div>
 <div className="text-2xl font-extrabold text-idaz-black">{totalPending.toLocaleString('vi-VN')} ₫</div>
 {pendingCount > 0 && (
 <div className="mt-1 text-xs text-amber-600 font-medium flex items-center gap-1">
 <AlertCircle size={12} /> {pendingCount} hóa đơn cần xử lý
 </div>
 )}
 </motion.div>

 <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
 className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-3xl p-5 shadow-lg shadow-indigo-200">
 <div className="flex items-center gap-3 mb-3">
 <div className="w-10 h-10 bg-white/20 rounded-3xl flex items-center justify-center">
 <TrendingUp size={20} className="text-white" />
 </div>
 <div className="text-sm font-medium text-indigo-200">Tổng hóa đơn</div>
 </div>
 <div className="text-2xl font-extrabold text-white">{invoices.length} hóa đơn</div>
 </motion.div>
 </div>

 {/* Invoice table */}
 <div className="glass-panel rounded-3xl border border-white/60 shadow-sm overflow-hidden">
 <div className="px-6 py-4 border-b border-white/40 flex items-center justify-between">
 <h2 className="font-bold text-idaz-black">Danh sách Hóa đơn</h2>
 {pendingCount > 0 && (
 <span className="bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-full">
 {pendingCount} chưa thanh toán
 </span>
 )}
 </div>

 {invoices.length === 0 ? (
 <div className="py-16 text-center">
 <Receipt size={48} className="mx-auto mb-4 text-slate-200" />
 <p className="text-gray-400 font-medium">Bạn chưa có hóa đơn nào.</p>
 </div>
 ) : (
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-idaz-gray text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-white/60">
 <th className="p-4 pl-6">Mã HĐ</th>
 <th className="p-4">Nội dung & Dự án</th>
 <th className="p-4">Số tiền</th>
 <th className="p-4">Hạn TT</th>
 <th className="p-4">Trạng thái</th>
 <th className="p-4 pr-6 text-right">Hành động</th>
 </tr>
 </thead>
 <tbody>
 {invoices.map((inv, idx) => (
 <motion.tr
 key={inv._id}
 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
 className={`border-b border-white/40 text-sm transition-colors ${
 inv.status === 'pending' ? 'hover:bg-amber-50/30' : 'hover:bg-idaz-gray'
 }`}
 >
 <td className="p-4 pl-6 font-mono font-bold text-gray-700 text-xs">{inv.invoiceNumber}</td>
 <td className="p-4">
 <div className="font-semibold text-idaz-black">{inv.title}</div>
 {inv.projectId && (
 <div className="text-xs text-indigo-500 font-medium mt-0.5">📁 {inv.projectId.title || inv.projectId}</div>
 )}
 </td>
 <td className="p-4 font-extrabold text-idaz-orange-dark text-base">{inv.amount.toLocaleString('vi-VN')} ₫</td>
 <td className="p-4 text-gray-500">{new Date(inv.dueDate).toLocaleDateString('vi-VN')}</td>
 <td className="p-4">
 {inv.status === 'paid' && (
 <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
 <CheckCircle size={12} /> Đã thanh toán
 </span>
 )}
 {inv.status === 'pending' && (
 <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
 <Clock size={12} /> Chờ thanh toán
 </span>
 )}
 {inv.status === 'cancelled' && (
 <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-gray-100 text-gray-500 border border-white/60">
 <Ban size={12} /> Đã huỷ
 </span>
 )}
 </td>
 <td className="p-4 pr-6">
 <div className="flex items-center justify-end gap-2">
 {inv.status === 'pending' && (
 <button
 onClick={() => openPaymentModal(inv)}
 className="inline-flex items-center gap-1.5 px-4 py-2 bg-idaz-orange hover:bg-idaz-orange-dark text-white rounded-3xl font-bold transition-all text-xs shadow-sm shadow-indigo-200"
 >
 <CreditCard size={13} /> Thanh toán
 </button>
 )}
 <button
 onClick={() => handlePrint(inv)}
 className="inline-flex items-center gap-1.5 px-3 py-2 glass-panel border border-white/60 hover:bg-idaz-gray text-gray-600 rounded-3xl transition-all text-xs"
 title="In / PDF"
 >
 <Printer size={13} /> In
 </button>
 </div>
 </td>
 </motion.tr>
 ))}
 </tbody>
 </table>
 )}
 </div>

 {/* Modal Thanh toán */}
 <AnimatePresence>
 {paymentModalOpen && selectedInvoice && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-idaz-black/40 backdrop-blur-sm">
 <motion.div 
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 exit={{ opacity: 0, scale: 0.95 }}
 className="glass-panel rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col"
 >
 <div className="p-6 border-b border-white/40 flex items-center justify-between bg-idaz-gray/50">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-full bg-orange-100 text-idaz-orange flex items-center justify-center">
 <CreditCard size={20} />
 </div>
 <div>
 <h3 className="font-bold text-idaz-black">Thanh toán Hóa đơn</h3>
 <p className="text-sm text-gray-500">{selectedInvoice.invoiceNumber}</p>
 </div>
 </div>
 <button onClick={() => setPaymentModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-2 glass-panel rounded-full border border-white/60 shadow-sm">
 <X size={18} />
 </button>
 </div>

 <div className="p-6 flex-1 overflow-y-auto">
 <div className="mb-6 p-4 bg-idaz-orange-light border border-orange-100 rounded-3xl text-center">
 <p className="text-sm text-idaz-orange font-medium mb-1">Tổng tiền thanh toán</p>
 <p className="text-3xl font-extrabold text-indigo-900">{selectedInvoice.amount.toLocaleString('vi-VN')} ₫</p>
 </div>

 {!qrCodeData ? (
 <>
 <h4 className="font-semibold text-idaz-black mb-3 text-sm">Chọn phương thức thanh toán</h4>
 {paymentMethods.length === 0 ? (
 <div className="text-center py-8 text-gray-500 text-sm bg-idaz-gray rounded-3xl border border-white/40">
 Hệ thống đang bảo trì cổng thanh toán. <br/> Vui lòng quay lại sau.
 </div>
 ) : (
 <div className="space-y-3">
 {paymentMethods.map(method => (
 <label key={method.id} className={`flex items-center gap-4 p-4 rounded-3xl border-2 cursor-pointer transition-all ${selectedMethod === method.id ? 'border-idaz-orange bg-idaz-orange-light/30' : 'border-white/40 hover:border-orange-200'}`}>
 <input 
 type="radio" 
 name="paymentMethod" 
 value={method.id} 
 checked={selectedMethod === method.id}
 onChange={() => setSelectedMethod(method.id)}
 className="w-5 h-5 text-idaz-orange border-gray-300 focus:ring-indigo-600"
 />
 <div className={`w-10 h-10 rounded-3xl flex items-center justify-center ${method.id === 'vnpay' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
 {method.id === 'bankTransfer' ? <Building size={20} /> : <CreditCard size={20} />}
 </div>
 <div className="flex-1">
 <h4 className="font-bold text-idaz-black">{method.name}</h4>
 {method.id === 'bankTransfer' && method.details && (
 <p className="text-xs text-gray-500 mt-1">Chuyển khoản thủ công qua mã QR</p>
 )}
 {method.id === 'vnpay' && (
 <p className="text-xs text-gray-500 mt-1">Hỗ trợ Thẻ ATM, Visa, MasterCard</p>
 )}
 </div>
 </label>
 ))}
 </div>
 )}
 </>
 ) : (
 <div className="text-center py-4">
 <h4 className="font-bold text-idaz-black mb-2">Quét mã để thanh toán</h4>
 <p className="text-sm text-gray-500 mb-6">Mở ứng dụng ngân hàng và quét mã VietQR bên dưới</p>
 
 <div className="glass-panel p-4 rounded-3xl inline-block border border-white/60 shadow-sm mx-auto">
 <img src={qrCodeData} alt="VietQR" className="w-56 h-56 object-contain" />
 </div>
 
 <div className="mt-6 bg-idaz-gray rounded-3xl p-4 text-left border border-white/40 text-sm">
 <p className="flex justify-between mb-2"><span className="text-gray-500">Ngân hàng:</span> <strong className="text-idaz-black">{paymentMethods.find(m => m.id === 'bankTransfer')?.details?.bankCode}</strong></p>
 <p className="flex justify-between mb-2"><span className="text-gray-500">Số tài khoản:</span> <strong className="text-idaz-black">{paymentMethods.find(m => m.id === 'bankTransfer')?.details?.accountNumber}</strong></p>
 <p className="flex justify-between mb-2"><span className="text-gray-500">Chủ tài khoản:</span> <strong className="text-idaz-black uppercase">{paymentMethods.find(m => m.id === 'bankTransfer')?.details?.accountName}</strong></p>
 <p className="flex justify-between mb-2"><span className="text-gray-500">Nội dung CK:</span> <strong className="text-idaz-orange">{selectedInvoice.invoiceNumber}</strong></p>
 </div>

 <div className="mt-6 bg-amber-50 text-amber-700 text-xs p-3 rounded-3xl border border-amber-200">
 Hệ thống sẽ tự động xác nhận sau 1-3 phút kể từ khi bạn chuyển khoản thành công.
 </div>
 </div>
 )}
 </div>

 {!qrCodeData && paymentMethods.length > 0 && (
 <div className="p-6 border-t border-white/40 bg-idaz-gray/50">
 <button 
 onClick={handleCheckout}
 disabled={isProcessing}
 className="w-full py-3.5 bg-idaz-orange hover:bg-idaz-orange-dark disabled:bg-indigo-400 text-white font-bold rounded-3xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all"
 >
 {isProcessing ? (
 <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
 ) : (
 <>Tiến hành thanh toán</>
 )}
 </button>
 </div>
 )}
 
 {qrCodeData && (
 <div className="p-6 border-t border-white/40 bg-idaz-gray/50">
 <button 
 onClick={() => setPaymentModalOpen(false)}
 className="w-full py-3.5 glass-panel border-2 border-white/60 hover:bg-idaz-gray text-gray-700 font-bold rounded-3xl transition-all"
 >
 Đóng lại
 </button>
 </div>
 )}
 </motion.div>
 </div>
 )}
 </AnimatePresence>
 </div>
 );
}
