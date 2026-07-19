"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Edit2, Trash2, X, Image as ImageIcon, CheckCircle, Globe, FileText, Layout, Search as SearchIcon } from "lucide-react";
import api from "../../../services/api";
import toast from "react-hot-toast";
import ImageUpload from "../../../components/admin/ImageUpload";
import SERPPreview from "../../../components/admin/SERPPreview";

import dynamic from 'next/dynamic';
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false, loading: () => <div className="h-64 flex items-center justify-center bg-gray-50 rounded-2xl border border-gray-200">Đang tải trình soạn thảo...</div> });
import 'react-quill-new/dist/quill.snow.css';

const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    [{ 'font': [] }],
    [{ 'size': ['small', false, 'large', 'huge'] }],
    ['bold', 'italic', 'underline', 'strike', 'blockquote', 'code-block'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'script': 'sub'}, { 'script': 'super' }],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'list': 'check' }],
    [{ 'indent': '-1'}, { 'indent': '+1' }],
    [{ 'direction': 'rtl' }],
    [{ 'align': [] }],
    ['link', 'image', 'video'],
    ['clean']
  ],
};

export default function AdminBlogPage() {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPost, setCurrentPost] = useState(null);
  
  const [activeTab, setActiveTab] = useState('content'); // 'content' or 'seo'

  const [formData, setFormData] = useState({
    title: "", slug: "", content: "", excerpt: "", coverImage: "", status: "draft", tags: "",
    metaTitle: "", metaDescription: ""
  });

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get("/posts");
      if (data.success) {
        setPosts(data.data);
      }
    } catch (error) {
      toast.error("Không thể tải danh sách bài viết");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleOpenModal = (post = null) => {
    if (post) {
      setCurrentPost(post);
      setFormData({
        title: post.title || "",
        slug: post.slug || "",
        content: post.content || "",
        excerpt: post.excerpt || "",
        coverImage: post.coverImage || "",
        status: post.status || "draft",
        tags: post.tags ? post.tags.join(", ") : "",
        metaTitle: post.metaTitle || post.title || "",
        metaDescription: post.metaDescription || post.excerpt || ""
      });
    } else {
      setCurrentPost(null);
      setFormData({
        title: "", slug: "", content: "", excerpt: "", coverImage: "", status: "draft", tags: "",
        metaTitle: "", metaDescription: ""
      });
    }
    setActiveTab('content');
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      tags: formData.tags.split(",").map(t => t.trim()).filter(Boolean)
    };

    try {
      if (currentPost) {
        const { data } = await api.put(`/posts/${currentPost._id}`, payload);
        if (data.success) toast.success("Cập nhật bài viết thành công!");
      } else {
        const { data } = await api.post("/posts", payload);
        if (data.success) toast.success("Đã tạo bài viết mới!");
      }
      setIsModalOpen(false);
      fetchPosts();
    } catch (error) {
      toast.error(error.response?.data?.message || "Đã xảy ra lỗi khi lưu");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xoá bài viết này không?")) return;
    try {
      const { data } = await api.delete(`/posts/${id}`);
      if (data.success) {
        toast.success("Đã xoá bài viết");
        fetchPosts();
      }
    } catch (error) {
      toast.error("Lỗi khi xoá bài viết");
    }
  };

  return (
    <div className="max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-idaz-black mb-1">Quản lý Bài viết (Blog)</h1>
          <p className="text-gray-400 text-sm">Viết bài, chia sẻ kiến thức chuyên môn và tin tức.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()} 
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-3xl text-sm font-bold transition-all shadow-[0_4px_15px_rgba(79,70,229,0.3)] flex items-center gap-2"
        >
          <Plus size={18} /> Viết Bài Mới
        </button>
      </div>

      <div className="glass-card border border-white/60 rounded-3xl overflow-hidden flex-1 flex flex-col shadow-xl">
        <div className="overflow-auto flex-1 custom-scrollbar min-w-0">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="sticky top-0 z-10 bg-white/40 backdrop-blur-md">
              <tr className="border-b border-white/60">
                <th className="p-4 pl-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Bài viết</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Tác giả</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Lượt xem</th>
                <th className="p-4 pr-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/40">
              {isLoading ? (
                <tr><td colSpan="5" className="p-10 text-center text-gray-500 font-medium">Đang tải dữ liệu...</td></tr>
              ) : posts.length === 0 ? (
                <tr><td colSpan="5" className="p-10 text-center text-gray-500 font-medium">Chưa có bài viết nào.</td></tr>
              ) : posts.map(post => (
                <tr key={post._id} className="hover:bg-white/30 transition-colors group">
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gray-200 overflow-hidden shrink-0">
                        {post.coverImage ? (
                          <img src={post.coverImage} alt="Cover" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400"><ImageIcon size={20} /></div>
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-idaz-black line-clamp-1">{post.title}</div>
                        <div className="text-xs text-gray-500 font-mono mt-1">/{post.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-indigo-100 overflow-hidden shrink-0">
                        {post.author?.avatar ? <img src={post.author.avatar} alt="Author" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-indigo-500 text-white flex items-center justify-center text-[10px] font-bold">{post.author?.name?.charAt(0)}</div>}
                      </div>
                      <span className="text-sm font-medium text-gray-700">{post.author?.name || 'Unknown'}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    {post.status === 'published' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                        <Globe size={12} /> Xuất bản
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500 border border-gray-200">
                        <FileText size={12} /> Bản nháp
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className="text-sm font-medium text-gray-600 bg-white/50 px-3 py-1 rounded-full">{post.views}</span>
                  </td>
                  <td className="p-4 pr-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleOpenModal(post)} className="p-2 bg-white hover:bg-indigo-50 hover:text-indigo-600 text-gray-500 rounded-xl transition-all shadow-sm border border-gray-100" title="Sửa">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(post._id)} className="p-2 bg-white hover:bg-rose-50 hover:text-rose-600 text-gray-500 rounded-xl transition-all shadow-sm border border-gray-100" title="Xóa">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-white/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="glass-card border border-white/60 rounded-3xl p-8 w-full max-w-5xl shadow-2xl max-h-[95vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-4 shrink-0">
                <h3 className="text-xl font-bold text-idaz-black">
                  {currentPost ? 'Chỉnh sửa Bài viết' : 'Viết Bài Mới'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-idaz-black transition-colors bg-gray-50 hover:bg-gray-100 p-2 rounded-full"><X size={18} /></button>
              </div>

              {/* Tabs */}
              <div className="flex gap-4 mb-6 border-b border-gray-100 pb-2 shrink-0">
                <button 
                  onClick={() => setActiveTab('content')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-colors ${activeTab === 'content' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  <Layout size={16} /> Nội dung Bài viết
                </button>
                <button 
                  onClick={() => setActiveTab('seo')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-colors ${activeTab === 'seo' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  <SearchIcon size={16} /> Tối ưu SEO
                </button>
              </div>
              
              <form onSubmit={handleSave} className="overflow-y-auto custom-scrollbar flex-1 pr-2 space-y-6">
                
                {/* TAB: CONTENT */}
                <div className={activeTab === 'content' ? 'block' : 'hidden'}>
                  <div className="mb-6">
                    <ImageUpload 
                      label="Ảnh Bìa (Cover Image)" 
                      folder="posts" 
                      value={formData.coverImage} 
                      onChange={(url) => setFormData({ ...formData, coverImage: url })} 
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">Tiêu đề bài viết <span className="text-rose-500">*</span></label>
                        <input required type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}
                          className="w-full glass-panel border border-gray-200 rounded-2xl px-4 py-3 text-idaz-black text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">Đường dẫn (Slug) <span className="text-rose-500">*</span></label>
                        <input required type="text" value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value })} placeholder="VD: bai-viet-so-1"
                          className="w-full glass-panel border border-gray-200 rounded-2xl px-4 py-3 text-gray-500 font-mono text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner" />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">Tags (cách nhau bởi dấu phẩy)</label>
                        <input type="text" value={formData.tags} onChange={e => setFormData({ ...formData, tags: e.target.value })} placeholder="Design, UI/UX, Marketing"
                          className="w-full glass-panel border border-gray-200 rounded-2xl px-4 py-3 text-idaz-black text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">Trạng thái</label>
                        <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}
                          className="w-full glass-panel border border-gray-200 rounded-2xl px-4 py-3 text-idaz-black text-sm font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner">
                          <option value="draft">Bản nháp</option>
                          <option value="published">Xuất bản Công khai</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">Đoạn trích (Excerpt) <span className="text-rose-500">*</span></label>
                    <textarea required rows="2" value={formData.excerpt} onChange={e => setFormData({ ...formData, excerpt: e.target.value })}
                      className="w-full glass-panel border border-gray-200 rounded-2xl px-4 py-3 text-idaz-black text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner" />
                  </div>

                  <div className="mb-8">
                    <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Nội dung bài viết <span className="text-rose-500">*</span></label>
                    <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-inner">
                      <ReactQuill 
                        theme="snow"
                        value={formData.content}
                        onChange={(content) => setFormData({ ...formData, content })}
                        modules={quillModules}
                        className="quill-editor"
                      />
                    </div>
                    {/* Add basic style to fix Quill layout inside our app */}
                    <style jsx global>{`
                      .quill-editor .ql-container {
                        min-height: 400px;
                        font-family: inherit;
                        font-size: 16px;
                        border-bottom: none !important;
                        border-left: none !important;
                        border-right: none !important;
                        border-top: 1px solid #e5e7eb !important;
                      }
                      .quill-editor .ql-toolbar {
                        border: none !important;
                        background: #f9fafb;
                        border-radius: 1rem 1rem 0 0;
                        padding: 12px 16px;
                      }
                    `}</style>
                  </div>
                </div>

                {/* TAB: SEO */}
                <div className={activeTab === 'seo' ? 'block' : 'hidden'}>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between items-end mb-1 ml-1">
                          <label className="block text-sm font-bold text-gray-700">Meta Title</label>
                          <span className={`text-xs ${formData.metaTitle.length > 60 ? 'text-rose-500' : 'text-gray-400'}`}>
                            {formData.metaTitle.length}/60
                          </span>
                        </div>
                        <input type="text" value={formData.metaTitle} onChange={e => setFormData({ ...formData, metaTitle: e.target.value })} placeholder="Tiêu đề chuẩn SEO (tùy chọn)"
                          className="w-full glass-panel border border-gray-200 rounded-2xl px-4 py-3 text-idaz-black text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner" />
                        <p className="text-xs text-gray-400 mt-2 ml-1">Nếu để trống sẽ sử dụng Tiêu đề bài viết.</p>
                      </div>

                      <div>
                        <div className="flex justify-between items-end mb-1 ml-1">
                          <label className="block text-sm font-bold text-gray-700">Meta Description</label>
                          <span className={`text-xs ${formData.metaDescription.length > 160 ? 'text-rose-500' : 'text-gray-400'}`}>
                            {formData.metaDescription.length}/160
                          </span>
                        </div>
                        <textarea rows="4" value={formData.metaDescription} onChange={e => setFormData({ ...formData, metaDescription: e.target.value })} placeholder="Mô tả meta chuẩn SEO..."
                          className="w-full glass-panel border border-gray-200 rounded-2xl px-4 py-3 text-idaz-black text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner" />
                        <p className="text-xs text-gray-400 mt-2 ml-1">Nếu để trống sẽ sử dụng Đoạn trích (Excerpt).</p>
                      </div>
                    </div>

                    <div>
                      <SERPPreview 
                        title={formData.metaTitle || formData.title} 
                        description={formData.metaDescription || formData.excerpt} 
                        slug={formData.slug} 
                      />
                    </div>

                  </div>
                </div>
                
                <div className="pt-4 flex justify-end gap-3 sticky bottom-0 bg-white/90 backdrop-blur-md pb-4 border-t border-gray-100 z-10 shrink-0">
                  <button type="button" onClick={() => setIsModalOpen(false)}
                    className="px-8 bg-white hover:bg-gray-50 text-gray-600 rounded-3xl py-3 font-bold transition-all border border-gray-200">
                    Huỷ
                  </button>
                  <button type="submit" className="px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-3xl py-3 font-bold transition-all shadow-[0_4px_15px_rgba(79,70,229,0.3)]">
                    Lưu Bài Viết
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
