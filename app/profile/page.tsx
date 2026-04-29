import Link from "next/link";

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-[#F4F6F8] flex justify-center font-sans pb-24">
      <div className="w-full sm:max-w-2xl md:max-w-3xl min-h-screen relative flex flex-col shadow-xl bg-[#F4F6F8]">
        
        {/* 🟠 Header & User Card */}
        <div className="bg-gradient-to-b from-[#EE4D2D] to-[#FF7337] pt-12 pb-24 px-6 rounded-b-[3rem] relative z-10">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-white text-2xl font-black tracking-tight">บัญชีของฉัน</h1>
            <Link href="/settings" className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm active:scale-95 transition-transform text-xl shadow-inner border border-white/30">
              ⚙️
            </Link>
          </div>
        </div>

        {/* 👤 Profile Info Card (Overlap Header) */}
        <div className="px-5 -mt-16 relative z-20">
          <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-slate-200 border-4 border-white shadow-md overflow-hidden shrink-0 relative">
              <img 
                src="https://uidkyvqjwigzidxpwort.supabase.co/storage/v1/object/public/kyc-documents/user-kyc/cbe6014e-f823-455b-b462-89b52a55bd13/face_image.jpg" 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg font-black text-gray-800">บีสาม จงเจริญ</h2>
                <span className="bg-green-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                  <span className="text-[10px]">✓</span> ยืนยันแล้ว
                </span>
              </div>
              <p className="text-xs text-gray-500 font-bold mb-2">081-XXX-XXXX</p>
              
              {/* สรุปยอดเงิน / คะแนน */}
              <div className="flex items-center gap-3 bg-orange-50/50 p-2 rounded-xl border border-orange-100/50">
                <div>
                  <p className="text-[9px] text-gray-400 font-bold">กระเป๋าเงิน</p>
                  <p className="text-sm font-black text-[#EE4D2D]">1,250 <span className="text-[10px]">บาท</span></p>
                </div>
                <div className="w-px h-6 bg-orange-200/50"></div>
                <div>
                  <p className="text-[9px] text-gray-400 font-bold">คะแนน</p>
                  <p className="text-sm font-black text-orange-500">450 <span className="text-[10px]">แต้ม</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 🎟️ แบนเนอร์ลุ้นโชค / ปองเจริญ (ย้ายมาตามบรีฟบีสาม!) */}
        <div className="px-5 mt-4">
          <Link href="/coupons" className="bg-gradient-to-r from-[#FFB75E] to-[#ED8F03] rounded-[1.5rem] p-5 flex items-center justify-between shadow-md active:scale-[0.98] transition-transform relative overflow-hidden group">
            <div className="absolute right-[-10px] bottom-[-20px] text-7xl opacity-20 transform group-hover:scale-110 transition-transform duration-500">🎟️</div>
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl backdrop-blur-md shadow-inner border border-white/30">
                🎁
              </div>
              <div>
                <h3 className="font-black text-white text-base leading-tight">ปองเจริญ & ลุ้นโชค</h3>
                <p className="text-[11px] text-white/90 font-bold mt-0.5">กดรับคูปองส่วนลด และลุ้นรางวัลทุกงวด</p>
              </div>
            </div>
            <div className="text-white relative z-10 bg-white/20 rounded-full p-2 backdrop-blur-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
            </div>
          </Link>
        </div>

        {/* 📋 เมนูต่างๆ */}
        <main className="px-5 mt-5 flex-1 space-y-4">
          <div className="bg-white rounded-[1.5rem] shadow-sm border border-gray-100 overflow-hidden">
            <MenuRow icon="📝" title="แก้ไขข้อมูลส่วนตัว" href="/profile/edit" />
            <MenuRow icon="🛡️" title="ยืนยันตัวตน (KYC)" href="/kyc" status="ผ่านแล้ว" statusColor="text-green-500" />
            <MenuRow icon="💳" title="บัญชีรับเงิน / ธนาคาร" href="/profile/bank" />
            <MenuRow icon="⭐" title="คะแนนรีวิวของฉัน" href="/profile/reviews" />
          </div>

          <div className="bg-white rounded-[1.5rem] shadow-sm border border-gray-100 overflow-hidden">
            <MenuRow icon="🎧" title="ศูนย์ช่วยเหลือ / ติดต่อแอดมิน" href="/support" />
            <MenuRow icon="📜" title="ข้อตกลงและเงื่อนไข" href="/terms" />
          </div>

          {/* 🔴 ปุ่มออกจากระบบ */}
          <button className="w-full bg-white rounded-[1.5rem] p-4 text-center shadow-sm border border-red-100 active:scale-[0.98] transition-transform mt-2 mb-6">
            <span className="text-sm font-black text-red-500">ออกจากระบบ</span>
          </button>
        </main>
      </div>
    </div>
  );
}

// คอมโพเนนต์สำหรับแถวเมนู
function MenuRow({ icon, title, href, status, statusColor }: { icon: string, title: string, href: string, status?: string, statusColor?: string }) {
  return (
    <Link href={href} className="flex items-center justify-between p-4 border-b border-gray-50 last:border-b-0 active:bg-gray-50 transition-colors group">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-xl group-active:scale-95 transition-transform">
          {icon}
        </div>
        <span className="text-[13px] font-black text-gray-800">{title}</span>
      </div>
      <div className="flex items-center gap-2">
        {status && <span className={`text-[10px] font-bold ${statusColor}`}>{status}</span>}
        <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}
