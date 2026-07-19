import React from 'react';

export default function SERPPreview({ title, description, slug }) {
  // Google SERP styling standards (approximate)
  const maxTitleLength = 60;
  const maxDescLength = 160;

  const displayTitle = title || "Tiêu đề bài viết của bạn";
  const displaySlug = slug || "duong-dan-bai-viet";
  const displayDesc = description || "Đoạn mô tả ngắn gọn (Meta Description) sẽ hiển thị ở đây. Độ dài lý tưởng là dưới 160 ký tự để không bị Google cắt ngắn...";

  const isTitleTooLong = title.length > maxTitleLength;
  const isDescTooLong = description.length > maxDescLength;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <h4 className="text-sm font-bold text-gray-500 mb-4 flex items-center justify-between">
        <span>Xem trước trên Google (SERP Preview)</span>
        <span className="text-xs font-normal bg-blue-50 text-blue-600 px-2 py-1 rounded-md">Desktop view</span>
      </h4>
      
      <div className="max-w-[600px] font-sans">
        {/* Breadcrumb / URL */}
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
            <span className="text-xs font-bold text-gray-500">G</span>
          </div>
          <div>
            <p className="text-sm text-[#202124] leading-tight">Agency Website</p>
            <p className="text-[12px] text-[#4d5156] leading-tight truncate">
              https://agency.com/blog/<span className="text-[#5f6368]">{displaySlug}</span>
            </p>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-xl text-[#1a0dab] font-normal hover:underline cursor-pointer truncate mb-1">
          {displayTitle}
        </h3>

        {/* Description */}
        <p className="text-sm text-[#4d5156] leading-[1.58] line-clamp-2">
          {displayDesc}
        </p>
      </div>

      {/* Progress Bars */}
      <div className="mt-6 pt-4 border-t border-gray-100 space-y-4">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="font-bold text-gray-600">Độ dài Tiêu đề (Title)</span>
            <span className={isTitleTooLong ? "text-rose-500 font-bold" : "text-emerald-500 font-bold"}>
              {title.length} / {maxTitleLength}
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div 
              className={`h-1.5 rounded-full transition-all ${isTitleTooLong ? 'bg-rose-500' : 'bg-emerald-500'}`} 
              style={{ width: `${Math.min((title.length / maxTitleLength) * 100, 100)}%` }}
            ></div>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="font-bold text-gray-600">Độ dài Mô tả (Description)</span>
            <span className={isDescTooLong ? "text-rose-500 font-bold" : "text-emerald-500 font-bold"}>
              {description.length} / {maxDescLength}
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div 
              className={`h-1.5 rounded-full transition-all ${isDescTooLong ? 'bg-rose-500' : 'bg-emerald-500'}`} 
              style={{ width: `${Math.min((description.length / maxDescLength) * 100, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
