'use client';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();

  // จำลองข้อมูลผู้ใช้
  const user = {
    name: 'สุรพงษ์ วีรวัฒน์พงศ์',
    initial: 'ส',
    phone: '081-234-5678',
    role: 'ผู้ให้บริการยืนยันตัวตนแล้ว',
    kyc_status: 'approved', // จำลองสถานะ KYC
    points: 1250,
  };

  const handleLogout = async () => {
    alert('ออกจากระบบเรียบร้อยแล้ว');
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      {/* 🧩 ตัวแอป Container */}
      <div className="w-full sm:max-w-2xl md:max-w-3xl bg-[#F4F6F8] min-h-screen pb-28 shadow-xl relative flex flex-col">
        
        {/* 🟠 Header Profile (โทนส้มทอง Shopee) */}
        <div className="bg-gradient-to-b from-[#EE4D2D] to-[#FF7337] rounded-b-[2.5rem] p-6 pt-16 shadow-md relative z-10 text-center">
          
          <div className="absolute top-6 right-6">
            <button className="text-white/90 text-xl hover:text-white transition-colors">⚙️</button>
          </div>

          {/* รูปโปรไฟล์ */}
          <div className="w-24 h-24 bg-white rounded-full mx-auto border-4 border-white/20 shadow-lg flex items-center justify-center text-4xl font-black text-[#EE4D2D] relative">
            {user.initial}
            {user.kyc_status === 'approved' && (
              <div className="absolute bottom-0 right-0 bg-green-500 border-2 border-white rounded-full p-1 shadow-sm">
                <span className="text-[10px] text-white font-black block">✓</span>
              </div>
            )}
          </div>

          <h1 className="text-2xl font-black text-white mt-4 tracking-tight">{user.name}</h1>
          <p className="text-white/80 text-xs mt-1 font-medium">{user.phone}</p>
          
          <div className="mt-3 inline-block bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/30">
            <span className="text-white text-[10px] font-bold tracking-wide">🏷️ {user.role}</span>
          </div>
        </div>

        {/* 📋 ส่วนเนื้อหาหลัก */}
        <div className="p-5 space-y-4 -mt-4 relative z-20">
          
          {/* 💰 กล่องคะแนน / กระเป๋าเงิน */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center text-2xl">
                🪙
              </div>
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">คะแนนสะสม จงเจริญ</p>
                <h2 className="text-xl font-black text-[#EE4D2D] leading-none">{user.points.toLocaleString()} <span className="text-xs text-gray-500">แต้ม</span></h2>
              </div>
            </div>
            <button className="bg-gray-50 text-[#EE4D2D] text-[10px] font-black px-4 py-2 rounded-xl border border-gray-200 hover:bg-orange-50 transition-colors">
              แลกสิทธิพิเศษ
            </button>
          </div>

          {/* 🛡️ หมวด: ความน่าเชื่อถือและเอกสาร */}
          <div className="bg-white rounded-[1.5rem] shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-800 text-xs uppercase tracking-widest flex items-center gap-2">
                <span className="text-[#EE4D2D]">🛡️</span> ยืนยันตัวตนและเอกสาร
              </h3>
            </div>
            
            <MenuRow 
              icon="🔍" 
              title="ยืนยันตัวตน (KYC)" 
              subtitle="สแกนใบหน้าและบัตรประชาชน"
              status={user.kyc_status === 'approved' ? '✅ ผ่านแล้ว' : '⏳ รอยืนยัน'}
              onClick={() => router.push('/profile/kyc')} 
            />
            <MenuRow 
              icon="🪪" 
              title="ใบอนุญาต & ใบขับขี่" 
              subtitle="จัดการเอกสารสำหรับรับงาน"
              onClick={() => router.push('/profile/licenses')} 
            />
          </div>

          {/* 🏆 หมวด: ผลงานและใบรับรอง */}
          <div className="bg-white rounded-[1.5rem] shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-800 text-xs uppercase tracking-widest flex items-center gap-2">
                <span className="text-[#EE4D2D]">🏆</span> ผลงานและใบรับรอง
              </h3>
            </div>
            
            <MenuRow 
              icon="📄" 
              title="ใบรับรองฝีมือ (Certificate)" 
              subtitle="ออกใบรับรองโดยจงเจริญ (PDF)"
              onClick={() => router.push('/profile/certificate')} 
            />
            <MenuRow 
              icon="📋" 
              title="เรซูเม่และประวัติงาน (Portfolio)" 
              subtitle="ดาวน์โหลดประวัติการทำงาน (PDF)"
              onClick={() => router.push('/profile/portfolio')} 
            />
          </div>

          {/* 🚪 ปุ่มออกจากระบบ */}
          <button 
            onClick={handleLogout}
            className="w-full bg-white text-red-500 font-black py-4 rounded-2xl shadow-sm border border-red-50 hover:bg-red-50 active:scale-95 transition-all text-sm mt-4"
          >
            ออกจากระบบ
          </button>
        </div>

        {/* 🧭 Bottom Nav (อัปเดตให้ตรงกับระบบปัจจุบัน) */}
        <div className="fixed bottom-0 w-full sm:max-w-2xl md:max-w-3xl bg-white/95 backdrop-blur-md border-t border-gray-100 px-8 py-4 flex justify-between items-center shadow-[0_-4px_25px_rgba(0,0,0,0.06)] rounded-t-[2.5rem] z-50">
           <button onClick={() => router.push('/')} className="flex flex-col items-center gap-1 opacity-40">
             <span className="text-xl">🏠</span><span className="text-[10px] font-bold text-gray-500">หน้าแรก</span>
           </button>
           <button onClick={() => router.push('/services')} className="flex flex-col items-center gap-1 opacity-40">
             <span className="text-xl">🛠️</span><span className="text-[10px] font-bold text-gray-500">บริการ</span>
           </button>
           <button onClick={() => router.push('/win-online')} className="flex flex-col items-center gap-1 opacity-40">
             <span className="text-xl">📋</span><span className="text-[10px] font-bold text-gray-500">ด่วนนน</span>
           </button>
           <button onClick={() => router.push('/history')} className="flex flex-col items-center gap-1 opacity-40">
             <span className="text-xl">📜</span><span className="text-[10px] font-bold text-gray-500">ประวัติ</span>
           </button>
           <div className="flex flex-col items-center gap-1 scale-110">
             <span className="text-xl">👤</span>
             <span className="text-[10px] font-bold text-[#EE4D2D]">ฉัน</span>
             <div className="w-1.5 h-1.5 bg-[#EE4D2D] rounded-full shadow-sm"></div>
           </div>
        </div>

      </div>
    </div>
  );
}

// คอมโพเนนต์ย่อยสำหรับแถวเมนู
function MenuRow({ icon, title, subtitle, onClick, status }: any) {
  return (
    <div 
      onClick={onClick}
      className="flex items-center justify-between p-4 border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors"
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-xl shadow-inner border border-gray-100">
          {icon}
        </div>
        <div>
          <h4 className="text-sm font-bold text-gray-800">{title}</h4>
          {subtitle && <p className="text-[10px] text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {status && <span className="text-[9px] font-bold bg-gray-100 px-2 py-1 rounded-md">{status}</span>}
        <span className="text-gray-300">›</span>
      </div>
    </div>
  );
}
