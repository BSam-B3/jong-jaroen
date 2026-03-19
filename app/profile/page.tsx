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
    kyc_status: 'approved', 
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center pb-24">
      {/* 🧩 ตัวแอป Container */}
      <div className="w-full sm:max-w-2xl md:max-w-3xl bg-[#F4F6F8] min-h-screen relative flex flex-col shadow-xl overflow-x-hidden rounded-t-[2.5rem]">
        
        {/* 🟠 Header (โทนส้มทอง Shopee) */}
        <div className="bg-gradient-to-b from-[#EE4D2D] to-[#FF7337] rounded-b-[2.5rem] p-6 pt-12 shadow-md relative z-10">
          {/* เอาปุ่มย้อนกลับออก เพราะหน้านี้กลายเป็นหน้าหลักของแท็บแล้ว */}
          <div className="flex items-center gap-4 mt-2 mb-2">
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
        <div className="p-5 space-y-5 relative z-20">
          
          <div className="bg-orange-50 border border-[#EE4D2D]/20 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
             <span className="text-xl">💡</span>
             <p className="text-[10px] text-gray-700 leading-relaxed font-medium">
               หน้าต่างนี้สำหรับจัดการข้อมูลส่วนตัว ตั้งค่าช่องทางรับเงิน และเรียกดูประวัติผลงานของคุณค่ะ
             </p>
          </div>

          {/* 👤 หมวด: แก้ไขข้อมูลส่วนตัว */}
          <div className="bg-white rounded-[1.5rem] shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
              <span className="text-[#EE4D2D] text-sm">👤</span>
              <h3 className="font-bold text-gray-800 text-xs">แก้ไขข้อมูลส่วนตัว</h3>
            </div>
            
            <div className="p-4 text-center">
               <button className="w-full text-xs font-bold text-[#EE4D2D] bg-orange-50 px-6 py-3 rounded-full border border-orange-100 active:scale-95 transition-transform shadow-sm">
                 แก้ไข ชื่อ-นามสกุล / เบอร์โทร
               </button>
            </div>
          </div>

          {/* 🛡️ หมวด: ยืนยันตัวตน แฟ้มเอกสาร และประวัติ */}
          <div className="bg-white rounded-[1.5rem] shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
              <span className="text-[#EE4D2D] text-sm">🛡️</span>
              <h3 className="font-bold text-gray-800 text-xs">ยืนยันตัวตนและประวัติการใช้งาน</h3>
            </div>
            
            <MenuRow 
              icon="🔍" 
              title="ยืนยันตัวตน (KYC)" 
              subtitle="ยืนยันเบอร์โทรศัพท์และประวัติ"
              status={user.kyc_status === 'approved' ? '✅ ผ่านแล้ว' : '⏳ รอยืนยัน'}
              onClick={() => router.push('/profile/kyc')} 
            />
            <MenuRow 
              icon="🪪" 
              title="แฟ้มเอกสารส่วนตัว" 
              subtitle="วุฒิการศึกษา, ใบขับขี่, ใบอนุญาต"
              onClick={() => router.push('/profile/licenses')} 
            />
            <MenuRow 
              icon="🏦" 
              title="บัญชีรับเงิน (Bank Account)" 
              subtitle="ตั้งค่าช่องทางรับเงินสำหรับผู้รับงาน"
              onClick={() => router.push('/profile/bank')} 
            />
            {/* ✅ เพิ่มเมนูประวัติต่อจาก Bank ตามที่บีสามรีเควส */}
            <MenuRow 
              icon="📜" 
              title="ประวัติรายการ (History)" 
              subtitle="บันทึกกิจกรรมและประวัติการจ้างงาน"
              onClick={() => router.push('/history')} 
            />
          </div>

          {/* 🏆 หมวด: ผลงานและใบรับรอง */}
          <div className="bg-white rounded-[1.5rem] shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
              <span className="text-[#EE4D2D] text-sm">🏆</span>
              <h3 className="font-bold text-gray-800 text-xs">ผลงานและใบรับรอง</h3>
            </div>
            
            <MenuRow 
              icon="🖼️" 
              title="คลังใบประกาศ (Certificates)" 
              subtitle="อัปโหลดใบประกาศ / ใบผ่านงาน"
              onClick={() => router.push('/profile/certificate')} 
            />
            <MenuRow 
              icon="📋" 
              title="เรซูเม่และประวัติงาน (Portfolio)" 
              subtitle="ดาวน์โหลดประวัติการทำงาน (PDF)"
              onClick={() => router.push('/profile/portfolio')} 
            />
          </div>

          <div className="pb-8">
            <button className="w-full bg-gray-100 text-gray-700 py-4 rounded-xl font-bold text-sm shadow-inner hover:bg-gray-200 active:scale-[0.98] transition-all">
              ออกจากระบบ
            </button>
          </div>

        </div>

        {/* ✅ Bottom Navigation (จัดใหม่เหลือ 4 ไอคอน สำหรับหน้า Profile) */}
        <div className="fixed bottom-0 w-full sm:max-w-2xl md:max-w-3xl bg-white/95 backdrop-blur-md border-t border-gray-100 px-4 py-4 flex justify-around items-center shadow-[0_-4px_25px_rgba(0,0,0,0.06)] rounded-t-[2.5rem] z-50">
          <NavItem icon="🏠" label="หน้าแรก" active={false} onClick={() => router.push('/')} />
          <NavItem icon="🛠️" label="บริการ" active={false} onClick={() => router.push('/services')} />
          <NavItem icon="📋" label="งานด่วน" active={false} onClick={() => router.push('/win-online')} />
          <NavItem icon="👤" label="ฉัน" active={true} onClick={() => {}} />
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
        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-xl shadow-inner border border-gray-100 shrink-0">
          {icon}
        </div>
        <div>
          <h4 className="text-sm font-bold text-gray-800 leading-tight">{title}</h4>
          {subtitle && <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
        {status && <span className="text-[9px] font-bold bg-gray-100 px-2 py-1 rounded-md text-gray-600 shadow-inner">{status}</span>}
        <span className="text-gray-300 text-xl leading-none">›</span>
      </div>
    </div>
  );
}

// คอมโพเนนต์เมนูด้านล่าง
function NavItem({ icon, label, active, onClick }: any) {
  return (
    <div onClick={onClick} className={`flex flex-col items-center gap-1.5 cursor-pointer transition-all ${active ? 'scale-110' : 'opacity-40 hover:opacity-100'} w-16`}>
      <span className="text-2xl">{icon}</span>
      <span className={`text-[10px] font-bold ${active ? 'text-[#EE4D2D]' : 'text-gray-500'}`}>{label}</span>
      {active && <div className="w-1.5 h-1.5 bg-[#EE4D2D] rounded-full shadow-sm mt-0.5"></div>}
    </div>
  );
}
