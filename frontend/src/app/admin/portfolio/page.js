"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit2, Trash2, X, Star, Briefcase, Link as LinkIcon, Image as ImageIcon, FileText } from "lucide-react";
import api from "../../../services/api";
import toast from "react-hot-toast";
import ImageUpload from "../../../components/admin/ImageUpload";

export default function AdminPortfolioPage() {
  const [portfolios, setPortfolios] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  
  const [formData, setFormData] = useState({
    title: "", slug: "", description: "", category: "Thiết kế Web", clientName: "", projectUrl: "", coverImage: "", images: [], isFeatured: false, tags: ""
  });

  const categories = ["Thiết kế Web", "Mobile App", "Branding", "UI/UX Design", "Marketing"];

  const fetchPortfolios = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get("/portfolios");
      if (data.success) {
        setPortfolios(data.data);
      }
    } catch (error) {
      toast.error("Không thể tải danh sách dự án");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolios();
  }, []);

  const handleOpenModal = (item = null) => {
    if (item) {
      setCurrentItem(item);
      setFormData({
        title: item.title,
        slug: item.slug,
        description: item.description,
        category: item.category,
        clientName: item.clientName,
        projectUrl: item.projectUrl,
        coverImage: item.coverImage,
        images: item.images || [],
        isFeatured: item.isFeatured,
        tags: item.tags ? item.tags.join(", ") : ""
      });
    } else {
      setCurrentItem(null);
      setFormData({
        title: "", slug: "", description: "", category: "Thiết kế Web", clientName: "", projectUrl: "", coverImage: "", images: [], isFeatured: false, tags: ""
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      tags: formData.tags.split(",").map(t => t.trim()).filter(Boolean)
    };

    try {
      if (currentItem) {
        const { data } = await api.put(`/portfolios/${currentItem._id}`, payload);
        if (data.success) toast.success("Cập nhật dự án thành công!");
      } else {
        const { data } = await api.post("/portfolios", payload);
        if (data.success) toast.success("Đã thêm dự án mới!");
      }
      setIsModalOpen(false);
      fetchPortfolios();
    } catch (error) {
      toast.error(error.response?.data?.message || "Đã xảy ra lỗi khi lưu");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xoá dự án portfolio này không?")) return;
    try {
      const { data } = await api.delete(`/portfolios/${id}`);
      if (data.success) {
        toast.success("Đã xoá dự án");
        fetchPortfolios();
      }
    } catch (error) {
      toast.error("Lỗi khi xoá dự án");
    }
  };

  return (
    <div className="max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-idaz-black mb-1">Dự án Dịch vụ (Portfolio)</h1>
          <p className="text-gray-400 text-sm">Quản lý và trưng bày các dự án nổi bật đã thực hiện.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()} 
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-3xl text-sm font-bold transition-all shadow-[0_4px_15px_rgba(79,70,229,0.3)] flex items-center gap-2"
        >
          <Plus size={18} /> Thêm Dự Án Mới
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar pb-10">
        {isLoading ? (
          <div className="col-span-full py-20 text-center text-gray-500 font-medium">Đang tải dữ liệu...</div>
        ) : portfolios.length === 0 ? (
          <div className="col-span-full py-20 text-center text-gray-500 font-medium">Chưa có dự án nào được thêm vào Portfolio.</div>
        ) : portfolios.map(item => (
          <div key={item._id} className="glass-card border border-white/60 rounded-3xl overflow-hidden flex flex-col shadow-xl group hover:-translate-y-2 transition-all duration-300">
            <div className="h-48 relative overflow-hidden bg-gray-100 flex items-center justify-center">
              {item.coverImage ? (
                item.coverImage.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx)$/i) ? (
                  <div className="flex flex-col items-center text-indigo-500 bg-gray-50 w-full h-full justify-center">
                    <FileText size={48} className="mb-2" />
                    <span className="text-xs font-bold bg-white px-3 py-1 rounded-full shadow-sm text-gray-600 truncate max-w-[80%]">
                      {item.coverImage.split('/').pop()}
                    </span>
                  </div>
                ) : (
                  <img src={item.coverImage.startsWith('/') ? `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'}${item.coverImage}` : item.coverImage} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                )
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400"><ImageIcon size={40} /></div>
              )}
              {item.isFeatured && (
                <div className="absolute top-4 left-4 bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1">
                  <Star size={12} className="fill-white" /> Nổi bật
                </div>
              )}
              <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1.5 rounded-full">
                {item.category}
              </div>
            </div>
            
            <div className="p-6 flex-1 flex flex-col">
              <h3 className="font-bold text-lg text-idaz-black mb-2 line-clamp-1">{item.title}</h3>
              <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">{item.description}</p>
              
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                  <Briefcase size={14} /> {item.clientName || 'N/A'}
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleOpenModal(item)} className="p-2 bg-gray-50 hover:bg-indigo-50 hover:text-indigo-600 text-gray-500 rounded-xl transition-colors">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDelete(item._id)} className="p-2 bg-gray-50 hover:bg-rose-50 hover:text-rose-600 text-gray-500 rounded-xl transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-white/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="glass-card border border-white/60 rounded-3xl p-8 w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4 sticky top-0 bg-white/80 backdrop-blur-md z-10">
                <h3 className="text-xl font-bold text-idaz-black">
                  {currentItem ? 'Chỉnh sửa Dự án Portfolio' : 'Thêm Dự án mới'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-idaz-black transition-colors bg-gray-50 hover:bg-gray-100 p-2 rounded-full"><X size={18} /></button>
              </div>
              
              <form onSubmit={handleSave} className="space-y-6">
                <div>
                  <ImageUpload 
                    label="Ảnh Bìa (Cover Image)" 
                    folder="portfolios" 
                    value={formData.coverImage} 
                    onChange={(url) => setFormData({ ...formData, coverImage: url })} 
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">Tên dự án</label>
                      <input required type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}
                        className="w-full glass-panel border border-white/60 rounded-2xl px-4 py-3 text-idaz-black text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">Đường dẫn (Slug)</label>
                      <input type="text" value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value })} placeholder="VD: du-an-apple"
                        className="w-full glass-panel border border-white/60 rounded-2xl px-4 py-3 text-gray-500 font-mono text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">Mô tả ngắn gọn</label>
                      <textarea required rows="4" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                        className="w-full glass-panel border border-white/60 rounded-2xl px-4 py-3 text-idaz-black text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner resize-none" />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">Danh mục dịch vụ</label>
                      <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}
                        className="w-full glass-panel border border-white/60 rounded-2xl px-4 py-3 text-idaz-black text-sm font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner">
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">Tên khách hàng (Client)</label>
                      <input type="text" value={formData.clientName} onChange={e => setFormData({ ...formData, clientName: e.target.value })}
                        className="w-full glass-panel border border-white/60 rounded-2xl px-4 py-3 text-idaz-black text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">URL Dự án (Live link)</label>
                      <div className="relative">
                        <LinkIcon size={16} className="absolute left-4 top-3.5 text-gray-400" />
                        <input type="text" value={formData.projectUrl} onChange={e => setFormData({ ...formData, projectUrl: e.target.value })} placeholder="https://"
                          className="w-full glass-panel border border-white/60 rounded-2xl py-3 pl-10 pr-4 text-idaz-black text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">Tags (cách nhau bởi dấu phẩy)</label>
                      <input type="text" value={formData.tags} onChange={e => setFormData({ ...formData, tags: e.target.value })}
                        className="w-full glass-panel border border-white/60 rounded-2xl px-4 py-3 text-idaz-black text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner" />
                    </div>
                  </div>
                </div>

                {/* ALBUM SECTION */}
                <div className="space-y-4 pt-6 border-t border-gray-100">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-bold text-gray-700 ml-1">Album Ảnh Dự án</label>
                    <button 
                      type="button" 
                      onClick={() => setFormData({ ...formData, images: [...formData.images, ""] })}
                      className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg flex items-center gap-1 font-bold hover:bg-indigo-100 transition-colors"
                    >
                      <Plus size={14} /> Thêm ảnh
                    </button>
                  </div>
                  
                  {formData.images.length === 0 && (
                    <div className="text-center p-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                      <ImageIcon className="mx-auto text-gray-300 mb-2" size={32} />
                      <p className="text-sm text-gray-400">Chưa có ảnh nào trong Album.</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {formData.images.map((img, index) => (
                      <div key={index} className="relative group">
                        <ImageUpload 
                          label={`Ảnh ${index + 1}`} 
                          folder="portfolios" 
                          value={img} 
                          onChange={(url) => {
                            const newImages = [...formData.images];
                            newImages[index] = url;
                            setFormData({ ...formData, images: newImages });
                          }} 
                        />
                        <button 
                          type="button"
                          onClick={() => {
                            const newImages = [...formData.images];
                            newImages.splice(index, 1);
                            setFormData({ ...formData, images: newImages });
                          }}
                          className="absolute -top-3 -right-3 bg-white text-rose-500 rounded-full p-2 shadow-md border border-rose-100 hover:bg-rose-50 transition-colors z-10 opacity-0 group-hover:opacity-100"
                          title="Xóa ảnh này"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-panel border border-white/60 rounded-2xl p-4 flex items-center justify-between mt-6">
                  <div>
                    <h4 className="font-bold text-idaz-black">Dự án Nổi bật (Featured)</h4>
                    <p className="text-xs text-gray-500">Hiển thị lớn hơn hoặc ưu tiên xuất hiện trên trang chủ</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setFormData({ ...formData, isFeatured: !formData.isFeatured })}
                    className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${formData.isFeatured ? 'bg-amber-500' : 'bg-gray-200'}`}
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${formData.isFeatured ? 'translate-x-8' : 'translate-x-1'}`} />
                  </button>
                </div>
                
                <div className="pt-4 flex justify-end gap-3 sticky bottom-0 bg-white/80 backdrop-blur-md pb-4 pt-4 border-t border-gray-100 z-10">
                  <button type="button" onClick={() => setIsModalOpen(false)}
                    className="px-8 bg-white hover:bg-gray-50 text-gray-600 rounded-3xl py-3 font-bold transition-all border border-gray-200">
                    Huỷ
                  </button>
                  <button type="submit" className="px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-3xl py-3 font-bold transition-all shadow-[0_4px_15px_rgba(79,70,229,0.3)]">
                    Lưu Portfolio
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
