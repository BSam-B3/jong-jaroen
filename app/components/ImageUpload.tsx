'use client';

import { useEffect, useId, useRef, useState } from 'react';

interface ImageUploadProps {
  value?: File | null;
  onChange?: (file: File | null) => void;
  label?: string;
  hint?: string;
  accept?: string;
  maxSizeMB?: number;
  initialPreviewUrl?: string | null;
  disabled?: boolean;
  className?: string;
}

export default function ImageUpload({
  value,
  onChange,
  label = 'เพิ่มรูปภาพ',
  hint = 'แตะเพื่อเลือกรูป (JPG / PNG)',
  accept = 'image/*',
  maxSizeMB = 5,
  initialPreviewUrl = null,
  disabled = false,
  className = '',
}: ImageUploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(initialPreviewUrl);
  const [error, setError] = useState<string | null>(null);

  // Build / revoke preview URL when File changes
  useEffect(() => {
    if (!value) {
      if (!initialPreviewUrl) setPreview(null);
      return;
    }
    const url = URL.createObjectURL(value);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [value, initialPreviewUrl]);

  const handleSelect = (file: File | null) => {
    setError(null);
    if (!file) {
      onChange?.(null);
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
      return;
    }
    const sizeMB = file.size / 1024 / 1024;
    if (sizeMB > maxSizeMB) {
      setError(`ไฟล์ใหญ่เกิน ${maxSizeMB} MB`);
      return;
    }
    onChange?.(file);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inputRef.current) inputRef.current.value = '';
    setPreview(initialPreviewUrl);
    onChange?.(null);
  };

  const showPreview = preview ?? initialPreviewUrl;

  return (
    <div className={`w-full ${className}`}>
      <label
        htmlFor={inputId}
        className={`relative block w-full aspect-[4/3] sm:aspect-video rounded-2xl border-2 border-dashed transition-colors overflow-hidden cursor-pointer ${
          disabled
            ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
            : showPreview
            ? 'border-gray-200 bg-gray-50'
            : 'border-gray-300 bg-white hover:border-[#EE4D2D] hover:bg-orange-50/30 active:scale-[0.99]'
        }`}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={accept}
          hidden
          disabled={disabled}
          onChange={(e) => handleSelect(e.target.files?.[0] ?? null)}
        />

        {showPreview ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={showPreview}
              alt="preview"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white text-sm font-black backdrop-blur active:scale-95"
              aria-label="ลบรูป"
            >
              ✕
            </button>
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2">
              <p className="text-[11px] text-white font-black">
                แตะเพื่อเปลี่ยนรูป
              </p>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-2xl mb-2">
              📷
            </div>
            <p className="font-black text-sm text-gray-800">{label}</p>
            <p className="text-[11px] text-gray-400 font-bold mt-1">{hint}</p>
          </div>
        )}
      </label>

      {error && (
        <p className="text-[11px] font-black text-red-600 mt-2">⚠️ {error}</p>
      )}
    </div>
  );
}
