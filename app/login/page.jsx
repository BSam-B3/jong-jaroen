'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function ServicesPage() {
  const [userName, setUserName] = useState('กำลังโหลด...');
  const [userInitial, setUserInitial] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // ถ้าไม่มี Session ให้เด้งกลับไปหน้า Login
      if (!session) {
        router.push('/login');
        return;
      }

      const user = session.user;
      
      // ดึงชื่อจาก Google (full_name) หรือถ้าล็อกอินด้วยอีเมลปกติ ให้ดึงชื่อจากหน้า @ มาโชว์
      const name = user.user_metadata?.full_name 
                   || user.user_metadata?.name 
                   || user.email?.split('@')[0] 
                   || 'ผู้ใช้งาน';
                   
      setUserName(name);
      
      // เอาตัวอักษรตัวแรกมาทำเป็นรูปโปรไฟล์แบบย่อ
      setUserInitial(name.charAt(0).toUpperCase());
    };

    fetchUser();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#F4F6F8] pb-20">
      {/* 🟠 ส่วน Header (สีส้ม) */}
      <div className="bg-[#F05D40] rounded-b-[2rem] p-6 pt-12 shadow-sm relative">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              จงเจริญ <span className="text-xl">🌟</span>
            </h1>
            <p className="text-white/90 text-sm mt-1">แอปพลิเคชันคู่ชุมชนปากน้ำประแส</p>
          </div>
          
          {/* ✅ จุดที่ 1: ดึงชื่อ User มาโชว์ (แทนตัว N เดิม) */}
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-3">
              <span className="text-white font-bold text-sm bg-white/20 px-3 py-1 rounded-full border border-white/30 truncate max-w-[120px]">
                {userName}
              </span>
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#F05D40] font-black text-lg shadow-md">
                {userInitial}
              </div>
            </div>
          </div>
        </div>

        {/* 🔍 Search Bar */}
        <div className="bg-white rounded-2xl p-3.5 flex items-center shadow-md">
          <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
          <input 
            type="text" 
            placeholder="หาช่างแอร์, แม่บ้าน, คนช่วยยกของ..." 
            className="w-full bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400"
          />
        </div>
      </div>

      <div className="p-4 space-y-4 -mt-2">
        {/* 🗂️ เมนูลัด */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center active:scale-95 transition-transform cursor-pointer">
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-2xl mb-2">🛠️</div>
            <h3 className="font-bold text-gray-800 text-sm">จ้างช่าง/แม่บ้าน</h3>
            <p className="text-[10px] text-gray-500 mt-1">ค้นหาบริการมืออาชีพ</p>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-orange-100 flex flex-col items-center justify-center text-center active:scale-95 transition-transform cursor-pointer relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-[#F05D40] text-white text-[8px] font-bold px-2 py-1 rounded-bl-lg">วินออนไลน์</div>
            <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center text-2xl mb-2">🛵</div>
            <h3 className="font-bold text-gray-800 text-sm">งานด่วน/ฝากซื้อ</h3>
            <p className="text-[10px] text-gray-500 mt-1">หาคนช่วยวิ่งธุระ</p>
          </div>
        </div>

        {/* 🛠️ หมวดหมู่บริการ */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 bg-[#F05D40] rounded-full"></div>
              <h2 className="font-bold text-gray-800">หมวดหมู่บริการ</h2>
            </div>
            <button className="text-[#F05D40] text-xs font-bold">ดูทั้งหมด</button>
          </div>
          <div className="grid grid-cols-4 gap-y-4 gap-x-2">
            {[
              { icon: '❄️', name: 'ล้างแอร์' },
              { icon: '🧹', name: 'แม่บ้าน' },
              { icon: '⚡', name: 'ช่างไฟ' },
              { icon: '💧', name: 'ประปา' },
              { icon: '🔧', name: 'ซ่อมรถ' },
              { icon: '🚚', name: 'ขนส่ง' },
              { icon: '📦', name: 'ย้ายบ้าน' },
              { icon: '✨', name: 'อื่นๆ' },
            ].map((item, index) => (
              <div key={index} className="flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform cursor-pointer">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-xl border border-gray-100 shadow-sm">{item.icon}</div>
                <span className="text-[10px] text-gray-600 font-medium">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ✅ จุดที่ 2: ปรับ Banner เป็น Job Board */}
        <div className="bg-gradient-to-r from-[#0082FA] to-[#00A3FF] rounded-2xl p-5 shadow-md flex justify-between items-center text-white relative overflow-hidden cursor-pointer active:scale-95 transition-transform">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
          <div className="z-10">
            <h2 className="font-bold text-lg flex items-center gap-2">
              💼 กระดานหางาน
            </h2>
            <p className="text-xs text-white/90 mt-1 font-light">ค้นหาตำแหน่งงานว่าง หรือลงประกาศในชุมชน</p>
          </div>
          <button className="z-10 bg-white text-[#0082FA] text-xs font-bold py-2.5 px-4 rounded-full shadow-sm flex items-center gap-1">
            เข้าดู <span className="text-sm">🚀</span>
          </button>
        </div>
        
      </div>
    </div>
  );
}
