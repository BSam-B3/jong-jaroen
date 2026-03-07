'use client';
import { useState } from 'react';
import Link from 'next/link';

// ── Soft Shopee Palette ─────────────────────────────────────────
const themePalette = {
  primaryOrange: '#F05D40', 
  lightOrange: '#FF8769',   
  bgGray: '#F9FAFB',        
};

// 🌟 Mock Data: ข้อมูลผู้ใช้งาน 🌟
const userData = {
  name: 'บีสาม',
  role: 'ลูกค้าทั่วไป',
  phone: '089-XXX-XXXX',
  address: 'ต.ปากน้ำประแส อ.แกลง จ.ระยอง',
  kycStatus: 'unverified', // สถานะ KYC: 'verified' | 'unverified' | 'pending'
  joinedDate: 'ม.ค. 2569'
};

export default function ProfilePage() {
  const [kycStatus, setKycStatus] = useState(userData.kycStatus);

  // จำลองฟังก์ชันกดปุ่มอัปโหลดบัตรประชาชน
  const handleKycUpload = () => {
    alert('ระบบกำลังเปิดกล้องเพื่อถ่ายรูปบัตรประชาชน...');
    setKycStatus('pending');
  };

  return (
    <div className="min-h-screen pb-28 relative" style={{ backgroundColor: themePalette.bgGray }}>
      
      {/* ── Header: ข้อมูลผู้ใช้ ── */}
      <header className="pt-12 pb-20 px-4 relative overflow-hidden rounded-b-[40px]"
        style={{ background: `linear-gradient(135deg, ${themePalette.primaryOrange} 0%, ${themePalette.lightOrange} 100%)` }}>
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/20 rounded-full blur-3xl"></div>
        <div className="absolute left-0 top-10 w-20 h-20 bg-yellow-300/20 rounded-full blur-2xl"></div>
        
        <div className="max-w-xl mx-auto relative z-10 flex items-center gap-4">
          {/* Avatar */}
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-2xl shadow-md border-2 border-white/50 relative">
            🧑🏻‍💻
            {/* Badge */}
            <div className="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-white"></div>
          </div>
          
          {/* ข้อมูล */}
          <div className="text-white">
            <h1 className="text-xl font-black drop-shadow-sm">{userData.name}</h1>
            <p className="text-[11px] font-medium opacity-90">{userData.phone}</p>
            <div className="inline-block mt-1 bg-white/20 px-2 py-0.5 rounded-full text-[9px] font-bold backdrop-blur-sm">
              {userData.role} • สมาชิกตั้งแต่ {userData.joinedDate}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 -mt-10 relative z-20 space-y-4">
        
        {/* ── 🌟 1. ส่วนยืนยันตัวตน (KYC) 🌟 ── */}
        <section className={`rounded-2xl p-4 shadow-sm border ${kycStatus === 'verified' ? 'bg-green-50 border-green-100' : 'bg-white border-orange-100'}`}>
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 ${kycStatus === 'verified' ? 'bg-green-100' : 'bg-orange-50'}`}>
              {kycStatus === 'verified' ? '🛡️' : '⚠️'}
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-black text-gray-800">
                {kycStatus === 'verified' ? 'ยืนยันตัวตนสำเร็จ' : 'การยืนยันตัวตน (KYC)'}
              </h2>
              <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">
                {kycStatus === 'verified' 
                  ? 'บัญชีของคุณมีความน่าเชื่อถือสูง สามารถใช้งานได้ทุกฟีเจอร์' 
                  : kycStatus === 'pending'
                    ? 'เอกสารของคุณกำลังอยู่ในขั้นตอนการตรวจสอบโดยแอดมิน'
                    : 'อัปโหลดรูปถ่ายบัตรประชาชนเพื่อเพิ่มความน่าเชื่อถือ และรับสิทธิพิเศษในการจ้างงาน'}
              </p>
              
              {kycStatus === 'unverified' && (
                <button 
                  onClick={handleKycUpload}
                  className="mt-3 w-full py-2 bg-gradient-to-r from-[#F05D40] to-[#FF8769] text-white text-[11px] font-bold rounded-xl hover:opacity-90 transition-opacity shadow-sm"
                >
                  📸 ถ่ายรูปบัตรประชาชน
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ── 2. เมนูจัดการบัญชี ── */}
        <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50 text-xs font-bold text-gray-400">
            การตั้งค่าและการเดินทาง
          </div>
          
          <div className="divide-y divide-gray-50">
            {/* เมนูที่อยู่ */}
            <button className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 text-sm">📍</div>
                <div className="text-left">
                  <div className="text-xs font-bold text-gray-800">ที่อยู่ของฉัน</div>
                  <div className="text-[10px] text-gray-500 mt-0.5 line-clamp-1">{userData.address}</div>
                </div>
              </div>
              <span className="text-gray-300 text-lg">›</span>
            </button>

            {/* เมนูประวัติ */}
            <button className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-500 text-sm">📝</div>
                <div className="text-left">
                  <div className="text-xs font-bold text-gray-800">ประวัติการจ้างงาน</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">ดูงานที่ผ่านมาและรีวิว</div>
                </div>
              </div>
              <span className="text-gray-300 text-lg">›</span>
            </button>

            {/* เมนูบัญชีรับเงิน (สำหรับช่าง) */}
            <button className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-500 text-sm">🏦</div>
                <div className="text-left">
                  <div className="text-xs font-bold text-gray-800">บัญชีธนาคาร / รับเงิน</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">จัดการช่องทางการรับ-จ่ายเงิน</div>
                </div>
              </div>
              <span className="text-gray-300 text-lg">›</span>
            </button>
          </div>
        </section>

        {/* ── 3. เมนูช่วยเหลือ ── */}
        <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="divide-y divide-gray-50">
            <button className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 text-sm">💬</div>
                <span className="text-xs font-bold text-gray-800">ติดต่อแอดมิน (ช่วยเหลือ)</span>
              </div>
              <span className="text-gray-300 text-lg">›</span>
            </button>
            <button className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 text-sm">📄</div>
                <span className="text-xs font-bold text-gray-800">เงื่อนไขและข้อตกลง</span>
              </div>
              <span className="text-gray-300 text-lg">›</span>
            </button>
          </div>
        </section>

        {/* ── 4. ปุ่มออกจากระบบ ── */}
        <button className="w-full py-3.5 mt-4 bg-red-50 text-red-500 text-xs font-bold rounded-2xl hover:bg-red-100 transition-colors border border-red-100">
          ออกจากระบบ
        </button>
        
        <div className="text-center pb-4 pt-2">
          <span className="text-[9px] text-gray-300">Jong Jaroen App v1.0.0</span>
        </div>

      </main>

      {/* 🛠️ Bottom Nav (หน้า โปรไฟล์ Active) 🛠️ */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around py-2 z-[100] shadow-[0_-5px_20px_rgba(0,0,0,0.05)] pb-safe">
        <Link href="/" className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-orange-400 transition-colors">
          <span className="text-xl">🏠</span>
          <span className="text-[10px]">หน้าแรก</span>
        </Link>
        <Link href="/news" className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-orange-400 transition-colors">
          <span className="text-xl">📰</span>
          <span className="text-[10px]">ข่าวสาร</span>
        </Link>
        <Link href="/coupons" className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-orange-400 transition-colors">
          <span className="text-xl">🎟️</span>
          <span className="text-[10px]">รางวัล</span>
        </Link>
        <Link href="/dashboard" className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-orange-400 transition-colors">
          <span className="text-xl">📋</span>
          <span className="text-[10px]">งาน</span>
        </Link>
        <Link href="/profile" className="flex flex-col items-center gap-0.5 font-bold" style={{ color: themePalette.primaryOrange }}>
          <span className="text-xl">👤</span>
          <span className="text-[10px]">ฉัน</span>
        </Link>
      </nav>
    </div>
  );
}
