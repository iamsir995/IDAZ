import api from "./api";

export const invoiceService = {
  /**
   * Lấy tất cả hóa đơn (Admin)
   */
  getAllInvoices: async () => {
    const { data } = await api.get('/invoices');
    return data;
  },

  /**
   * Lấy hóa đơn của User hiện tại (Client)
   */
  getMyInvoices: async () => {
    const { data } = await api.get('/invoices/me');
    return data;
  },

  /**
   * Tạo mới hóa đơn
   */
  createInvoice: async (invoiceData) => {
    const payload = { ...invoiceData, amount: Number(invoiceData.amount) };
    const { data } = await api.post('/invoices', payload);
    return data;
  },

  /**
   * Cập nhật hóa đơn
   */
  updateInvoice: async (id, invoiceData) => {
    const payload = { ...invoiceData, amount: Number(invoiceData.amount) };
    const { data } = await api.put(`/invoices/${id}`, payload);
    return data;
  },

  /**
   * Xóa hóa đơn
   */
  deleteInvoice: async (id) => {
    const { data } = await api.delete(`/invoices/${id}`);
    return data;
  },

  /**
   * Hủy hóa đơn
   */
  cancelInvoice: async (id) => {
    const { data } = await api.put(`/invoices/${id}/cancel`);
    return data;
  },

  /**
   * Đánh dấu đã thanh toán
   */
  markAsPaid: async (id) => {
    const { data } = await api.put(`/invoices/${id}/pay`);
    return data;
  }
};
