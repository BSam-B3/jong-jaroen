'use client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// ── Soft Shopee Palette ─────────────────────────────────────────
const themePalette = {
  primaryOrange: '#F05D40', 
  bgGray: '#F4F6F8',        
};

export default function ProfilePage() {
  const router = useRouter();

  const handleLogout = () => {
    alert('จำลองการออกจากระบบ (รอคุณ C เชื่อมต่อ Supabase Auth ค่ะ)');
    // router.push('/login');
  };

  return (
    <div className="min-h-screen pb-28 max-w-md mx-auto relative selection:bg-orange-200" style={{ backgroundColor: themePalette.bgGray }}>
      
      {/* ── Profile Header (Gradient) ── */}
      <div className="bg-gradient-to-b from-[#F05D40] to-[#FF8769] px-5 pt-12 pb-8 rounded-b-[32px] shadow-sm relative z-10 text-white">
        <div className="flex justify-between items-start mb-2">
          <h1 className="text-xl font-bold drop-shadow-sm">โปรไฟล์ของฉัน</h1>
          <button className="p-2 bg-white/20 rounded-full backdrop-blur-sm border border-white/30 hover:bg-white/30 transition">
            ⚙️
          </button>
        </div>

        <div className="flex items-center gap-4 mt-6">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-4xl shadow-inner border-4 border-white/30">
            👦🏻
          </div>
          <div>
            <h2 className="text-2xl font-black drop-shadow-sm">คุณบีสาม</h2>
            <p className="text-white/90 text-sm font-medium mt-1 flex items-center gap-1">
              📍 ปากน้ำประแส, ระยอง
            </p>
            <div className="mt-2 inline-flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold border border-white/30 backdrop-blur-sm">
              ✅ ยืนยันตัวตนแล้ว
            </div>
          </div>
        </div>
      </div>

      <main className="px-4 mt-6 space-y-4">
        
        {/* ── Wallet / Balance ── */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center text-2xl text-[#F05D40]">
              👛
            </div>
            <div>
              <p className="text-[11px] text-gray-500 font-bold">ยอดเงินในระบบ</p>
              <p className="text-xl font-black text-gray-800">1,250 <span className="text-sm">บาท</span></p>
            </div>
          </div>
          <button className="bg-[#F05D40] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md shadow-orange-200 active:scale-95 transition-transform">
            ถอนเงิน
          </button>
        </div>

        {/* ── Menu Group 1: บัญชีของฉัน ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-50 bg-gray-50/50">
            <h3 className="text-[13px] font-bold text-gray-600">บัญชีของฉัน</h3>
          </div>
          
          <button className="w-full px-5 py-4 flex items-center justify-between border-b border-gray-50 hover:bg-gray-50 transition-colors active:bg-gray-100">
            <div className="flex items-center gap-3">
              <span className="text-xl">📝</span>
              <span className="text-[15px] font-bold text-gray-700">แก้ไขข้อมูลส่วนตัว</span>
            </div>
            <span className="text-gray-400">❯</span>
          </button>
          
          <button className="w-full px-5 py-4 flex items-center justify-between border-b border-gray-50 hover:bg-gray-50 transition-colors active:bg-gray-100">
            <div className="flex items-center gap-3">
              <span className="text-xl">💳</span>
              <span className="text-[15px] font-bold text-gray-700">บัญชีธนาคารรับเงิน</span>
            </div>
            <span className="text-gray-400">❯</span>
          </button>

          <button 
            onClick={() => router.push('/services/manage')}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors active:bg-gray-100"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">🏪</span>
              <span className="text-[15px] font-bold text-gray-700">จัดการประกาศรับงานของฉัน</span>
            </div>
            <span className="text-gray-400">❯</span>
          </button>
        </div>

        {/* ── Menu Group 2: ช่วยเหลือ & ตั้งค่า ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-50 bg-gray-50/50">
            <h3 className="text-[13px] font-bold text-gray-600">ช่วยเหลือ & ตั้งค่า</h3>
          </div>
          
          <button className="w-full px-5 py-4 flex items-center justify-between border-b border-gray-50 hover:bg-gray-50 transition-colors active:bg-gray-100">
            <div className="flex items-center gap-3">
              <span className="text-xl">🎧</span>
              <span className="text-[15px] font-bold text-gray-700">ติดต่อศูนย์ช่วยเหลือ</span>
            </div>
            <span className="text-gray-400">❯</span>
          </button>

          <button className="w-full px-5 py-4 flex items-center justify-between border-b border-gray-50 hover:bg-gray-50 transition-colors active:bg-gray-100">
            <div className="flex items-center gap-3">
              <span className="text-xl">📜</span>
              <span className="text-[15px] font-bold text-gray-700">เงื่อนไขและข้อตกลง</span>
            </div>
            <span className="text-gray-400">❯</span>
          </button>

          <button 
            onClick={handleLogout}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-red-50 transition-colors active:bg-red-100 group"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">🚪</span>
              <span className="text-[15px] font-bold text-red-500 group-hover:text-red-600">ออกจากระบบ</span>
            </div>
          </button>
        </div>

      </main>

      {/* ── Bottom Navigation Bar (เน้นปุ่ม Profile) ── */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around py-2 z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] pb-safe">
        <Link href="/" className="flex flex-col items-center gap-1 text-gray-400 hover:text-[#F05D40] transition-colors">
          <span className="text-[22px]">🏠</span>
          <span className="text-[10px] font-medium">หน้าแรก</span>
        </Link>
        <Link href="/services" className="flex flex-col items-center gap-1 text-gray-400 hover:text-[#F05D40] transition-colors">
          <span className="text-[22px]">🛠️</span>
          <span className="text-[10px] font-medium">บริการ</span>
        </Link>
        <Link href="/jobs" className="flex flex-col items-center gap-1 text-gray-400 hover:text-[#F05D40] transition-colors">
          <span className="text-[22px]">📋</span>
          <span className="text-[10px] font-medium">งานด่วน</span>
        </Link>
        <Link href="/history" className="flex flex-col items-center gap-1 text-gray-400 hover:text-[#F05D40] transition-colors">
          <span className="text-[22px]">🧾</span>
          <span className="text-[10px] font-medium">ประวัติ</span>
        </Link>
        <Link href="/profile" className="flex flex-col items-center gap-1 text-[#F05D40]">
          <span className="text-[22px]">👤</span>
          <span className="text-[10px] font-bold">ฉัน</span>
        </Link>
      </nav>
    </div>
  );
}
