'use client';
import Link from "next/link";
import { useState, useEffect, useRef } from "react";

export default function HomePage() {
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isSearchDropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsSearchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isSearchDropdownOpen]);

  const handleSuggestionClick = (text: string) => {
    setSearchText(text);
    setIsSearchDropdownOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex justify-center font-sans">
      <div className="w-full sm:max-w-2xl md:max-w-3xl bg-[#F4F6F8] min-h-screen relative flex flex-col shadow-xl overflow-x-hidden">
        
        {/* 🟠 Header ส้มจงเจริญ */}
        <div className="bg-gradient-to-b from-[#EE4D2D] to-[#FF7337] rounded-b-[2.5rem] p-6 pt-10 shadow-md relative z-20">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm shadow-inner border border-white/30 overflow-hidden">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col">
                <span className="text-white/80 text-[10px] font-bold tracking-wider">แพลตฟอร์มตลาดแรงงานชุมชน</span>
                <h1 className="text-white text-2xl font-black tracking-tight">จงเจริญ</h1>
              </div>
            </div>
            <div className="flex gap-2.5">
              <Link href="/notifications" className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm shadow-inner">
                <span className="text-xl">🔔</span>
              </Link>
              <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 shrink-0 border-2 border-white/30 shadow-md">
                <img src="https://uidkyvqjwigzidxpwort.supabase.co/storage/v1/object/public/kyc-documents/user-kyc/cbe6014e-f823-455b-b462-89b52a55bd13/face_image.jpg" alt="Avatar" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>

          {/* 🔍 ช่องเสริช AI */}
          <div ref={wrapperRef} className="relative z-30 mb-4">
            <form action="/services" method="GET" className="bg-white rounded-2xl p-1.5 flex items-center shadow-lg shadow-black/5">
              <div className="pl-3 pr-2 text-gray-400 text-lg">🔍</div>
              <input
                type="text"
                name="q"
                value={searchText
