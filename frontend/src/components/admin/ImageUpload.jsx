"use client";

import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, X, Loader2, Image as ImageIcon } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function ImageUpload({ 
  value, 
  onChange, 
  folder = 'other', 
  label = 'Tải ảnh lên', 
  maxSizeMB = 5 
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState(value || '');
  const fileInputRef = useRef(null);

  useEffect(() => {
    setPreview(value || '');
  }, [value]);

  const validateFile = (file) => {
    if (!file) return false;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Chỉ hỗ trợ định dạng JPG, PNG, GIF, WEBP');
      return false;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`Dung lượng file không được vượt quá ${maxSizeMB}MB`);
      return false;
    }
    return true;
  };

  const handleUpload = async (file) => {
    if (!validateFile(file)) return;

    setIsUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('folder', folder); // Important: Append text fields BEFORE files for multer to read req.body inside diskStorage
    formData.append('file', file);

    try {
      const res = await api.post('/assets/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(percentCompleted);
        }
      });

      if (res.data.success) {
        setPreview(res.data.data.url);
        onChange(res.data.data.url);
        toast.success('Tải ảnh thành công');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi tải ảnh lên');
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUpload(e.target.files[0]);
    }
  };

  const handleRemove = () => {
    setPreview('');
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
      
      <AnimatePresence mode="wait">
        {preview ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full h-48 rounded-3xl overflow-hidden glass-panel border border-white/60 group"
          >
            <img 
              src={preview.startsWith('http') ? preview : `${process.env.NEXT_PUBLIC_API_BASE_URL || ''}${preview}`} 
              alt="Preview" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button 
                type="button" 
                onClick={handleRemove}
                className="bg-red-500/80 hover:bg-red-500 text-white p-3 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`w-full h-48 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${
              isDragging 
                ? 'border-rose-500 bg-rose-500/10' 
                : 'border-white/40 glass-panel hover:border-rose-400/50 hover:bg-white/5'
            }`}
          >
            {isUploading ? (
              <div className="flex flex-col items-center">
                <Loader2 size={32} className="text-rose-500 animate-spin mb-3" />
                <span className="text-sm font-medium text-idaz-black mb-2">Đang tải lên... {progress}%</span>
                <div className="w-40 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-rose-500 transition-all duration-300" 
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center text-gray-500 hover:text-idaz-black transition-colors">
                <UploadCloud size={40} className="mb-3 opacity-50" />
                <span className="text-sm font-medium">Kéo thả ảnh hoặc click để chọn</span>
                <span className="text-xs mt-1 opacity-70">JPG, PNG, WEBP (Max {maxSizeMB}MB)</span>
              </div>
            )}
            
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/jpeg,image/png,image/gif,image/webp" 
              onChange={handleFileSelect}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
