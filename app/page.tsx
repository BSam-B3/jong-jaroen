@@ -1,22 +1,20 @@
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const [userName, setUserName] = useState('กำลังโหลด...');
  const [userInitial, setUserInitial] = useState('');
  const [activeTab, setActiveTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState(''); // เพิ่ม State สำหรับช่องค้นหา
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        // ถ้ายกเลิก Comment บรรทัดล่าง ระบบจะบังคับ Login ก่อนเข้าหน้าแรก
        // router.push('/login');
        setUserName('ผู้เยี่ยมชม');
        setUserInitial('ผ');
        return;
@@ -35,7 +33,6 @@
    fetchUser();
  }, [router]);

  // ฟังก์ชันจัดการตอนกด Enter ค้นหา
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
@@ -44,17 +41,15 @@
  };

  return (
    /* 📱 พื้นหลังด้านนอกสุด (Desk/Background) */
    <div className="min-h-screen bg-[#E5E7EB] flex justify-center items-start md:items-center md:py-8">

      {/* 📱 ตัวแอป (Main App Container) - ปรับขนาดอัตโนมัติตาม Device */}
      <div className="w-full sm:max-w-xl md:max-w-md bg-[#F4F6F8] min-h-screen md:min-h-[850px] md:h-[850px] md:rounded-[3rem] shadow-2xl overflow-hidden relative flex flex-col border-[8px] border-transparent md:border-black">
    // ✅ ปรับพื้นหลังและคอนเทนเนอร์ให้ตรงกับหน้าอื่นๆ ของแอป (ไม่มีขอบดำ)
    <div className="min-h-screen bg-gray-100 flex justify-center pb-24">
      <div className="w-full sm:max-w-2xl md:max-w-3xl bg-[#F4F6F8] min-h-screen relative flex flex-col shadow-xl overflow-x-hidden">

        {/* ส่วนเนื้อหาที่ Scroll ได้ */}
        <div className="flex-1 overflow-y-auto pb-24 scrollbar-hide">
        <div className="flex-1 overflow-y-auto pb-6 scrollbar-hide">

          {/* 🟠 Header (สีส้ม) */}
          <div className="bg-[#F05D40] rounded-b-[2.5rem] p-6 pt-12 shadow-sm relative">
          <div className="bg-[#F05D40] rounded-b-[2.5rem] p-6 pt-12 shadow-sm relative z-10">
            <div className="flex justify-between items-start mb-6 px-2">
              <div>
                <h1 className="text-2xl font-black text-white flex items-center gap-2">
@@ -63,7 +58,6 @@
                <p className="text-white/90 text-xs mt-1 font-medium">แอปพลิเคชันคู่ชุมชนปากน้ำประแส</p>
              </div>

              {/* แสดงชื่อและอักษรย่อ User */}
              <button 
                onClick={() => router.push('/profile/edit')}
                className="flex items-center gap-2 bg-white/10 p-1.5 pr-4 rounded-full border border-white/20 backdrop-blur-md active:scale-95 transition-transform"
@@ -93,7 +87,7 @@
          </div>

          {/* 🧩 Content Area */}
          <div className="p-5 space-y-6 mt-4">
          <div className="p-5 space-y-6 mt-4 relative z-20">

            {/* 🗂️ เมนูลัด (Grid 2 คอลัมน์) */}
            <div className="grid grid-cols-2 gap-5">
@@ -161,47 +155,47 @@

        </div>

        {/* 🧭 แถบเมนูด้านล่าง (Bottom Navigation) - ยึดไว้ล่างสุดของ Container */}
        <div className="absolute bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-gray-100 px-8 py-4 flex justify-between items-center shadow-[0_-4px_25px_rgba(0,0,0,0.06)] rounded-t-[2.5rem] z-50">
        {/* 🧭 แถบเมนูด้านล่าง (Bottom Navigation) */}
        <div className="fixed bottom-0 w-full sm:max-w-2xl md:max-w-3xl bg-white/95 backdrop-blur-md border-t border-gray-100 px-8 py-4 flex justify-between items-center shadow-[0_-4px_25px_rgba(0,0,0,0.06)] rounded-t-[2.5rem] z-50">
          <NavItem icon="🏠" label="หน้าแรก" active={activeTab === 'home'} onClick={() => {setActiveTab('home'); router.push('/')}} />
          <NavItem icon="🛠️" label="บริการ" active={activeTab === 'services'} onClick={() => {setActiveTab('services'); router.push('/services')}} />
          <NavItem icon="📋" label="งานด่วน" active={activeTab === 'urgent'} onClick={() => {setActiveTab('urgent'); router.push('/win-online')}} />
          <NavItem icon="📜" label="ประวัติ" active={activeTab === 'history'} onClick={() => {setActiveTab('history'); router.push('/history')}} />
          <NavItem icon="👤" label="ฉัน" active={activeTab === 'profile'} onClick={() => {setActiveTab('profile'); router.push('/profile/edit')}} />
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}

// --- คอมโพเนนต์ย่อย ---

// --- คอมโพเนนต์ปุ่มเมนูลัด ---
function MenuButton({ icon, title, desc, color, badge, onClick }: any) {
  const colorClass = color === 'blue' ? 'bg-blue-50 border-blue-50 text-blue-500' : 'bg-orange-50 border-orange-50 text-[#F05D40]';
  return (
    <div onClick={onClick} className={`bg-white p-6 rounded-[2rem] shadow-sm border ${colorClass} flex flex-col items-center justify-center text-center active:scale-95 transition-all cursor-pointer relative overflow-hidden h-full hover:shadow-md`}>
      {badge && <div className="absolute top-0 right-0 bg-[#F05D40] text-white text-[9px] font-black px-4 py-1 rounded-bl-2xl shadow-sm z-10">{badge}</div>}
      <div className={`w-16 h-16 ${colorClass} rounded-3xl flex items-center justify-center text-4xl mb-4 shadow-inner border border-black/5`}>{icon}</div>
      <h3 className="font-black text-gray-800 text-sm">{title}</h3>
      <p className="text-[10px] text-gray-500 mt-1 font-medium">{desc}</p>
    </div>
  );
}

// --- คอมโพเนนต์เมนูด้านล่าง ---
function NavItem({ icon, label, active, onClick }: any) {
  return (
    <div onClick={onClick} className={`flex flex-col items-center gap-1.5 cursor-pointer transition-all ${active ? 'scale-110' : 'opacity-40 hover:opacity-100'}`}>
      <span className="text-2xl">{icon}</span>
      <span className={`text-[10px] font-bold ${active ? 'text-[#F05D40]' : 'text-gray-500'}`}>{label}</span>
      {active && <div className="w-1.5 h-1.5 bg-[#F05D40] rounded-full shadow-sm"></div>}
    </div>
  );
}
