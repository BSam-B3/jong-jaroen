'use client';
import { useRouter } from 'next/navigation';

export default function ProfileEditHubPage() {
  const router = useRouter();

  // จำลองข้อมูลผู้ใช้
  const user = {
    name: 'สุรพงษ์ วีรวัฒน์พงศ์',
    initial: 'ส',
    phone: '081-234-5678',
    role: 'ผู้ให้บริการยืนยันตัวตนแล้ว',
    kyc_status: 'approved', 
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      {/* 🧩 ตัวแอป Container */}
      <div className="w-full sm:max-w-2xl md:max-w-3xl bg-[#F4F6F8] min-h-screen pb-10 shadow-xl relative flex flex-col">
        
        {/* 🟠 Header (โทนส้มทอง Shopee) */}
        <div className="bg-gradient-to-b from-[#EE4D2D] to-[#FF7337] rounded-b-[2.5rem] p-6 pt-12 shadow-md relative z-10">
          <button 
            onClick={() => router.back()} 
            className="text-white text-sm font-bold flex items-center gap-1 mb-4"
          >
            ← ย้อนกลับ
          </button>

          <div className="flex items-center gap-4">
             {/* รูปโปรไฟล์ */}
            <div className="w-16 h-16 bg-white rounded-full border-2 border-white/20 shadow-md flex items-center justify-center text-2xl font-black text-[#EE4D2D] relative flex-shrink-0">
              {user.initial}
              <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm">
                <span className="text-[8px] text-gray-600 block leading-none">✏️</span>
              </div>
            </div>
            
            <div className="text-white">
              <h1 className="text-xl font-black tracking-tight leading-tight">{user.name}</h1>
              <p className="text-white/80 text-xs mt-0.5">{user.phone}</p>
            </div>
          </div>
        </div>

        {/* 📋 ส่วนเนื้อหาหลัก (Hub เมนูเอกสาร) */}
        <div className="p-5 space-y-5 -mt-2 relative z-20">
          
          <div className="bg-orange-50 border border-[#EE4D2D]/20 rounded-2xl p-4 flex items-start gap-3">
             <span className="text-xl">💡</span>
             <p className="text-[10px] text-gray-700 leading-relaxed font-medium">
               หน้าต่างนี้สำหรับจัดการข้อมูลส่วนตัว อัปโหลดเอกสารสำคัญ และเรียกดูใบรับรองผลงานของคุณค่ะ
             </p>
          </div>

          {/* 👤 หมวด: แก้ไขข้อมูลส่วนตัว */}
          <div className="bg-white rounded-[1.5rem] shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
              <span className="text-[#EE4D2D] text-sm">👤</span>
              <h3 className="font-bold text-gray-800 text-xs">ข้อมูลส่วนตัว</h3>
            </div>
            {/* TODO: อนาคตอาจจะทำหน้าฟอร์มกรอกข้อมูลแยก หรือให้กดแก้ตรงนี้ได้เลย (จำลองปุ่มไว้ก่อน) */}
            <div className="p-4 text-center">
               <button className="text-xs font-bold text-[#EE4D2D] bg-orange-50 px-6 py-2 rounded-full border border-orange-100 active:scale-95 transition-transform">
                 แก้ไข ชื่อ-นามสกุล / เบอร์โทร
               </button>
            </div>
          </div>

          {/* 🛡️ หมวด: ความน่าเชื่อถือและเอกสาร */}
          <div className="bg-white rounded-[1.5rem] shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
              <span className="text-[#EE4D2D] text-sm">🛡️</span>
              <h3 className="font-bold text-gray-800 text-xs">ยืนยันตัวตนและเอกสาร</h3>
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
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
              <span className="text-[#EE4D2D] text-sm">🏆</span>
              <h3 className="font-bold text-gray-800 text-xs">ผลงานและใบรับรอง</h3>
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
        {status && <span className="text-[9px] font-bold bg-gray-100 px-2 py-1 rounded-md text-gray-600">{status}</span>}
        <span className="text-gray-300">›</span>
      </div>
    </div>
  );
}
