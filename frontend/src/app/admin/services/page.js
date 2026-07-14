"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Search, X, Check, Eye, EyeOff } from "lucide-react";
import api from "../../../services/api";
import toast from "react-hot-toast";
import ImageUpload from "../../../components/admin/ImageUpload";

export default function AdminServicesPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    description: "",
    shortDescription: "",
    price: "",
    icon: "",
    features: [""],
    isActive: true,
    order: 0
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const { data } = await api.get('/services');
      if (data.success) {
        setServices(data.data);
      }
    } catch (error) {
      toast.error("Lỗi khi tải danh sách dịch vụ");
    } finally {
      setLoading(false);
    }
  };

  const openModal = (service = null) => {
    if (service) {
      setEditingService(service);
      setFormData({
        title: service.title,
        slug: service.slug,
        description: service.description,
        shortDescription: service.shortDescription || "",
        price: service.price || "",
        icon: service.icon || "",
        features: service.features && service.features.length ? service.features : [""],
        isActive: service.isActive,
        order: service.order
      });
    } else {
      setEditingService(null);
      setFormData({
        title: "",
        slug: "",
        description: "",
        shortDescription: "",
        price: "",
        icon: "",
        features: [""],
        isActive: true,
        order: 0
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingService(null);
  };

  const handleFeatureChange = (index, value) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData({ ...formData, features: newFeatures });
  };

  const addFeature = () => setFormData({ ...formData, features: [...formData.features, ""] });
  
  const removeFeature = (index) => {
    const newFeatures = formData.features.filter((_, i) => i !== index);
    setFormData({ ...formData, features: newFeatures.length ? newFeatures : [""] });
  };

  const generateSlug = (text) => {
    return text.toString().toLowerCase()
      .replace(/á|à|ả|ạ|ã|ă|ắ|ằ|ẳ|ẵ|ặ|â|ấ|ầ|ẩ|ẫ|ậ/gi, 'a')
      .replace(/é|è|ẻ|ẽ|ẹ|ê|ế|ề|ể|ễ|ệ/gi, 'e')
      .replace(/i|í|ì|ỉ|ĩ|ị/gi, 'i')
      .replace(/ó|ò|ỏ|õ|ọ|ô|ố|ồ|ổ|ỗ|ộ|ơ|ớ|ờ|ở|ỡ|ợ/gi, 'o')
      .replace(/ú|ù|ủ|ũ|ụ|ư|ứ|ừ|ử|ữ|ự/gi, 'u')
      .replace(/ý|ỳ|ỷ|ỹ|ỵ/gi, 'y')
      .replace(/đ/gi, 'd')
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Clean up empty features
      const cleanData = { ...formData, features: formData.features.filter(f => f.trim() !== '') };
      
      if (editingService) {
        await api.put(`/services/${editingService._id}`, cleanData);
        toast.success("Cập nhật dịch vụ thành công");
      } else {
        await api.post('/services', cleanData);
        toast.success("Thêm dịch vụ mới thành công");
      }
      closeModal();
      fetchServices();
    } catch (error) {
      toast.error(error.response?.data?.message || "Có lỗi xảy ra");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa dịch vụ này?")) {
      try {
        await api.delete(`/services/${id}`);
        toast.success("Đã xóa dịch vụ");
        fetchServices();
      } catch (error) {
        toast.error("Lỗi khi xóa dịch vụ");
      }
    }
  };

  const toggleStatus = async (service) => {
    try {
      await api.put(`/services/${service._id}`, { isActive: !service.isActive });
      toast.success("Đã cập nhật trạng thái");
      fetchServices();
    } catch (error) {
      toast.error("Lỗi cập nhật trạng thái");
    }
  };

  if (loading) return <div className="p-8 text-center">Đang tải...</div>;

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-idaz-black">Quản lý Dịch vụ</h1>
          <p className="text-gray-500 mt-1">Quản lý các gói dịch vụ của hệ thống Agency</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-idaz-orange hover:bg-idaz-orange-dark text-white px-6 py-3 rounded-full font-bold flex items-center gap-2 transition-all shadow-lg shadow-idaz-orange/30"
        >
          <Plus size={20} /> Thêm Dịch vụ mới
        </button>
      </div>

      <div className="glass-card rounded-3xl border border-white/60 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-left text-sm font-semibold text-gray-500">
                <th className="px-6 py-4">Tên Dịch vụ</th>
                <th className="px-6 py-4">Mô tả ngắn</th>
                <th className="px-6 py-4 text-center">Giá hiển thị</th>
                <th className="px-6 py-4 text-center">Trạng thái</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white/50">
              {services.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-gray-500">
                    Chưa có dịch vụ nào. Hãy thêm mới!
                  </td>
                </tr>
              ) : (
                services.map((service) => (
                  <tr key={service._id} className="hover:bg-white/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-idaz-black">{service.title}</div>
                      <div className="text-xs text-gray-400">/{service.slug}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 line-clamp-2 max-w-xs">{service.shortDescription || service.description}</div>
                    </td>
                    <td className="px-6 py-4 text-center font-medium text-idaz-orange">
                      {service.price}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => toggleStatus(service)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                          service.isActive ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {service.isActive ? <><Eye size={14}/> Hiển thị</> : <><EyeOff size={14}/> Đã ẩn</>}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button onClick={() => openModal(service)} className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => handleDelete(service._id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 md:p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-idaz-black">
                {editingService ? "Sửa Dịch vụ" : "Thêm Dịch vụ mới"}
              </h2>
              <button onClick={closeModal} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <ImageUpload 
                  label="Biểu tượng (Icon) / Ảnh minh họa" 
                  folder="services" 
                  value={formData.icon} 
                  onChange={(url) => setFormData({ ...formData, icon: url })} 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Tên Dịch vụ *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => {
                      const title = e.target.value;
                      setFormData(prev => ({ ...prev, title, slug: editingService ? prev.slug : generateSlug(title) }));
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-idaz-orange focus:border-idaz-orange outline-none transition-all"
                    placeholder="VD: Thiết kế Website"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Đường dẫn (Slug) *</label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-idaz-orange focus:border-idaz-orange outline-none transition-all"
                    placeholder="thiet-ke-website"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Giá hiển thị</label>
                  <input
                    type="text"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-idaz-orange focus:border-idaz-orange outline-none transition-all"
                    placeholder="VD: Từ 5.000.000đ"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Mô tả ngắn</label>
                <textarea
                  rows="2"
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-idaz-orange focus:border-idaz-orange outline-none transition-all resize-none"
                  placeholder="Mô tả tóm tắt hiển thị ngoài trang chủ"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Mô tả chi tiết *</label>
                <textarea
                  required
                  rows="4"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-idaz-orange focus:border-idaz-orange outline-none transition-all"
                  placeholder="Mô tả đầy đủ về gói dịch vụ..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3 flex justify-between items-center">
                  Tính năng / Tiện ích bao gồm
                  <button type="button" onClick={addFeature} className="text-idaz-orange hover:text-idaz-orange-dark flex items-center gap-1 text-sm font-bold">
                    <Plus size={16} /> Thêm tính năng
                  </button>
                </label>
                <div className="space-y-3">
                  {formData.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={feature}
                          onChange={(e) => handleFeatureChange(index, e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-idaz-orange focus:border-idaz-orange outline-none transition-all"
                          placeholder="VD: Giao diện chuẩn UI/UX Responsive"
                        />
                      </div>
                      <button type="button" onClick={() => removeFeature(index)} className="p-2.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                  <span className="text-sm font-bold text-gray-700">Công khai dịch vụ này</span>
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={closeModal} className="px-6 py-3 rounded-full font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
                    Hủy bỏ
                  </button>
                  <button type="submit" className="px-8 py-3 rounded-full font-bold text-white bg-idaz-black hover:bg-gray-800 shadow-lg transition-all flex items-center gap-2">
                    <Check size={20} /> Lưu Dịch vụ
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
