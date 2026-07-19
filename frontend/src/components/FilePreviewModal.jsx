import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, FileText, FileImage, FileAudio, FileVideo, FileArchive, FileCode, AlertTriangle } from 'lucide-react';

// Hàm lấy icon dựa trên type / mimeType
export const getTypeIcon = (type, mimeType = '', size = 48) => {
  if (type === 'image' || mimeType.includes('image')) return <FileImage size={size} className="text-emerald-400" />;
  if (type === 'video' || mimeType.includes('video')) return <FileVideo size={size} className="text-blue-400" />;
  if (type === 'audio' || mimeType.includes('audio')) return <FileAudio size={size} className="text-purple-400" />;
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return <FileArchive size={size} className="text-amber-400" />;
  if (mimeType.includes('json') || mimeType.includes('xml') || mimeType.includes('javascript') || mimeType.includes('css') || mimeType.includes('html')) return <FileCode size={size} className="text-cyan-400" />;
  return <FileText size={size} className="text-indigo-400" />;
};

export default function FilePreviewModal({ asset, onClose }) {
  if (!asset) return null;

  // Lấy URL và kiểm tra xem có phải là public không
  // (Microsoft Office Viewer chỉ hoạt động với public URL)
  const isLocalhost = asset.url.includes('localhost') || asset.url.includes('127.0.0.1');
  
  const isImage = asset.type === 'image' || (asset.mimeType && asset.mimeType.includes('image')) || asset.url.match(/\.(jpeg|jpg|gif|png|webp|svg|bmp)$/i);
  const isVideo = asset.type === 'video' || (asset.mimeType && asset.mimeType.includes('video')) || asset.url.match(/\.(mp4|webm|ogg|mov)$/i);
  const isAudio = asset.type === 'audio' || (asset.mimeType && asset.mimeType.includes('audio')) || asset.url.match(/\.(mp3|wav|ogg)$/i);
  const isPdf = asset.url.toLowerCase().endsWith('.pdf') || (asset.mimeType && asset.mimeType.includes('pdf'));
  
  const isOfficeDoc = asset.url.match(/\.(doc|docx|xls|xlsx|ppt|pptx)$/i);
  const officePreviewUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(asset.url)}`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 lg:p-10">
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 text-white hover:text-rose-400 bg-white/10 p-2.5 rounded-full backdrop-blur-md transition-colors z-10"
        >
          <X size={24} />
        </button>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          exit={{ opacity: 0, scale: 0.95 }} 
          className="w-full max-w-6xl max-h-full flex flex-col relative"
        >
          {/* Main Preview Area */}
          <div className="flex-1 overflow-hidden rounded-t-3xl border border-white/20 bg-slate-900/50 flex items-center justify-center min-h-[60vh] max-h-[85vh] shadow-2xl relative group">
            
            {isImage ? (
              <img src={asset.url} alt={asset.name} className="max-w-full max-h-[80vh] object-contain" />
            ) : isVideo ? (
              <video src={asset.url} controls className="max-w-full max-h-[80vh] w-full" autoPlay></video>
            ) : isAudio ? (
              <div className="w-full max-w-md p-8 bg-white/5 rounded-3xl border border-white/10 text-center">
                <FileAudio size={64} className="mx-auto text-purple-400 mb-6" />
                <audio src={asset.url} controls className="w-full"></audio>
              </div>
            ) : isPdf ? (
              <iframe src={asset.url} className="w-full h-[80vh] border-none bg-white"></iframe>
            ) : isOfficeDoc ? (
              isLocalhost ? (
                <div className="text-center text-gray-400 flex flex-col items-center p-8 max-w-md">
                  <AlertTriangle size={64} className="text-amber-500 mb-4" />
                  <h3 className="text-white font-bold text-lg mb-2">Không hỗ trợ xem trước ở môi trường Local</h3>
                  <p className="text-sm leading-relaxed mb-6">Trình xem tài liệu Office chỉ hoạt động khi file được lưu trữ trên một tên miền công khai. Bạn có thể tải file về để xem.</p>
                  <a href={asset.url} download target="_blank" rel="noreferrer" className="px-6 py-2.5 bg-indigo-600 text-white rounded-full font-bold inline-flex items-center gap-2 hover:bg-indigo-700 transition-colors">
                    <Download size={18} /> Tải xuống ngay
                  </a>
                </div>
              ) : (
                <iframe src={officePreviewUrl} className="w-full h-[80vh] border-none bg-white"></iframe>
              )
            ) : (
              <div className="text-center text-gray-400 flex flex-col items-center p-8">
                {getTypeIcon(asset.type || 'document', asset.mimeType || '', 80)}
                <p className="mt-6 font-bold text-white text-lg">Không có bản xem trước cho định dạng này.</p>
                <p className="mt-2 text-sm max-w-sm mx-auto opacity-70">File này không được hỗ trợ hiển thị trực tiếp trên trình duyệt. Vui lòng tải xuống để mở.</p>
                <a href={asset.url} download target="_blank" rel="noreferrer" className="mt-8 px-6 py-2.5 bg-indigo-600 text-white rounded-full font-bold inline-flex items-center gap-2 hover:bg-indigo-700 transition-colors">
                  <Download size={18} /> Tải xuống ngay
                </a>
              </div>
            )}
          </div>

          {/* Footer Info Area */}
          <div className="bg-slate-900 border-x border-b border-white/20 rounded-b-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex-1 min-w-0 w-full text-center sm:text-left">
              <h3 className="text-white font-bold text-lg truncate" title={asset.name}>{asset.name}</h3>
              <div className="flex items-center justify-center sm:justify-start gap-4 text-xs text-gray-400 mt-2 flex-wrap">
                {asset.size ? (
                  <span>Kích thước: {(asset.size / 1024 / 1024).toFixed(2)} MB</span>
                ) : asset.fileSize ? (
                  <span>Kích thước: {(asset.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                ) : null}
                {asset.uploadedBy?.name && (
                  <span>Người đăng: {asset.uploadedBy.name}</span>
                )}
                {asset.createdAt && (
                  <span>Ngày tải: {new Date(asset.createdAt).toLocaleDateString('vi-VN')}</span>
                )}
              </div>
            </div>
            
            <div className="flex gap-3 shrink-0">
              <a 
                href={asset.url} 
                target="_blank" 
                rel="noreferrer" 
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full text-sm font-bold transition-all border border-white/10"
              >
                Mở Link Mới
              </a>
              <a 
                href={asset.url} 
                download={asset.name || 'document'} 
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-indigo-900/20"
              >
                <Download size={16} /> Tải Xuống
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
