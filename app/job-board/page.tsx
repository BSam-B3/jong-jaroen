'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function JobBoardPage() {
  const router = useRouter();
  const [filter, setFilter] = useState('all'); // all, urgent, service

  // 🚧 Mock Data สำหรับรายการงานที่เปิดหาคนอยู่
  const MOCK_JOBS = [
    {
      id: 'j1',
      type: 'urgent',
      category: 'ฝากซื้อของ',
      icon: '🥡',
      customerName: 'คุณสมศรี',
      distance: '0.5 กม.',
      details: 'ซื้อข้าวมันไก่ร้านเจ๊หมวย 3 กล่อง (ไม่หนัง)',
      locations: { from: 'ตลาดประแส', to: 'ซอยเทศบาล 4' },
      price: 'ตามตกลง',
      timePosted: '2 นาทีที่แล้ว',
      isUrgent: true,
    },
    {
      id: 'j2',
      type: 'urgent',
      category: 'รับ-ส่งคน',
      icon: '🛵',
      customerName: 'น้องบี',
      distance: '1.2 กม.',
      details: 'ไปส่งที่คิวรถตู้ด่วนจ้า จะตกรถแล้ว!',
      locations: { from: 'หน้า รร. ชุมชนประแส', to: 'คิวรถตู้' },
      price: '40',
      timePosted: '5 นาทีที่แล้ว',
      isUrgent: true,
    },
    {
      id: 'j3',
      type: 'service',
      category: 'ล้างแอร์',
      icon: '❄️',
      customerName: 'พี่ตั้ม',
      distance: '3.0 กม.',
      details: 'แอร์น้ำหยด แอร์ไม่เย็นเลยครับ อยากให้มาล้างด่วน (แอร์ผนัง 1 ตัว)',
      locations: { from: '', to: 'หมู่บ้านสิริทาวน์ ซอย 2' },
      price: 'เสนอราคา',
      timePosted: '15 นาทีที่แล้ว',
      isUrgent: false,
    },
    {
      id: 'j4',
      type: 'service',
      category: 'ช่างไฟ',
      icon: '⚡',
      customerName: 'ร้านป้าใจ',
      distance: '0.8 กม.',
      details: 'ปลั๊กไฟช็อต เบรกเกอร์ตัดบ่อย รบกวนช่างเข้ามาดูให้หน่อยจ้า',
      locations: { from: '', to: 'ร้านขายของชำ ป้าใจ (ใกล้สะพานรักษ์แสม)' },
      price: 'เสนอราคา',
      timePosted: '1 ชั่วโมงที่แล้ว',
      isUrgent: false,
    },
  ];

  const filteredJobs = MOCK_JOBS.filter(job => filter === 'all' || job.type === filter);

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center pb-24">
      <div className="w-full sm:max-w-2xl md:max-w-3xl bg-[#F4F6F8] min-h-screen relative flex flex-col shadow-xl overflow-x-hidden">
        
        {/* ส่วนเนื้อหาที่ Scroll ได้ */}
        <div className="flex-1 overflow-y-auto pb-6 scrollbar-hide">
          
          {/* 🔵 Header (การ์ดลอย โทนสีฟ้า สำหรับโหมดคนทำงาน) */}
          <div className="bg-gradient-to-b from-[#0082FA] to-[#00A3FF] rounded-[2.5rem] pt-8 pb-6 px-6 shadow-md relative z-10 m-3 mt-4 overflow-hidden">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="flex items-center gap-3">
                <button onClick={() => router.back()} className="text-white font-bold text-lg active:scale-90 transition-transform">←</button>
                <h1 className="text-xl font-black text-white tracking-tight">กระดานหางาน</h1>
              </div>
              <div className="bg-white/20 px-3 py-1 rounded-full border border-white/30 backdrop-blur-sm">
                <span className="text-white text-[10px] font-bold flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div> พร้อมรับงาน
                </span>
              </div>
            </div>
            
            <p className="text-white/90 text-xs font-medium pl-8 relative z-10">ค้นหางานด่วนและงานบริการในรัศมีใกล้คุณ</p>

            {/* 🔘 Filter Tabs */}
            <div className="mt-5 flex gap-2 pl-2 relative z-10">
              <button 
                onClick={() => setFilter('all')}
                className={`px-5 py-2 rounded-full text-[11px] font-bold transition-all shadow-sm ${filter === 'all' ? 'bg-white text-[#0082FA]' : 'bg-white/20 text-white border border-white/30 hover:bg-white/30'}`}
              >
                ทั้งหมด
              </button>
              <button 
                onClick={() => setFilter('urgent')}
                className={`px-5 py-2 rounded-full text-[11px] font-bold transition-all shadow-sm flex items-center gap-1 ${filter === 'urgent' ? 'bg-white text-[#FF416C]' : 'bg-white/20 text-white border border-white/30 hover:bg-white/30'}`}
              >
                🚨 งานด่วน (วิน/ซื้อของ)
              </button>
              <button 
                onClick={() => setFilter('service')}
                className={`px-5 py-2 rounded-full text-[11px] font-bold transition-all shadow-sm flex items-center gap-1 ${filter === 'service' ? 'bg-white text-[#0082FA]' : 'bg-white/20 text-white border border-white/30 hover:bg-white/30'}`}
              >
                🛠️ งานช่าง
              </button>
            </div>
          </div>

          {/* 📋 รายการงาน */}
          <main className="px-5 mt-2 relative z-20 space-y-4">
            
            <div className="flex justify-between items-end mb-2 px-1">
              <h2 className="text-xs font-black text-gray-800 flex items-center gap-2">
                <span className="text-[#0082FA] text-base">📍</span> งานที่เปิดรับอยู่ตอนนี้
              </h2>
              <span className="text-[10px] text-gray-500 font-bold">{filteredJobs.length} รายการ</span>
            </div>

            <div className="space-y-4">
              {filteredJobs.map((job) => (
                <div key={job.id} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md hover:border-[#0082FA]/30 transition-all cursor-pointer active:scale-[0.98]">
                  
                  {/* 🔴 ป้ายกำกับความด่วน */}
                  {job.isUrgent && (
                    <div className="absolute top-0 right-0 bg-gradient-to-r from-[#FF4B2B] to-[#FF416C] text-white text-[9px] font-black px-4 py-1.5 rounded-bl-2xl shadow-sm z-10 flex items-center gap-1">
                      <span className="animate-pulse">🔥</span> ด่วนมาก
                    </div>
                  )}
                  {!job.isUrgent && (
                    <div className="absolute top-0 right-0 bg-blue-50 text-blue-600 text-[9px] font-black px-4 py-1.5 rounded-bl-2xl border-b border-l border-blue-100 z-10">
                      งานบริการ
                    </div>
                  )}

                  {/* ข้อมูลลูกค้าและประเภทงาน */}
                  <div className="flex items-start gap-3 mb-4 pr-16">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-inner border ${job.type === 'urgent' ? 'bg-red-50 border-red-100' : 'bg-blue-50 border-blue-100'}`}>
                      {job.icon}
                    </div>
                    <div>
                      <h3 className="font-black text-gray-800 text-sm">{job.category}</h3>
                      <p className="text-[10px] text-gray-500 font-medium flex items-center gap-1 mt-0.5">
                        👤 {job.customerName} <span className="text-gray-300">•</span> <span className="text-[#0082FA] font-bold">{job.distance}</span>
                      </p>
                    </div>
                  </div>

                  {/* รายละเอียดเส้นทาง (เฉพาะงานด่วน/วิน) */}
                  {job.type === 'urgent' && (
                    <div className="bg-gray-50 rounded-xl p-3 mb-3 border border-gray-100 relative">
                      <div className="absolute left-4 top-4 bottom-4 w-0.5 border-l-2 border-dashed border-gray-300"></div>
                      <div className="flex items-center gap-2.5 mb-2 relative z-10">
                        <div className="w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white shadow-sm shrink-0"></div>
                        <span className="text-[10px] font-bold text-gray-700 truncate">{job.locations.from}</span>
                      </div>
                      <div className="flex items-center gap-2.5 relative z-10">
                        <div className="w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white shadow-sm shrink-0"></div>
                        <span className="text-[10px] font-bold text-gray-700 truncate">{job.locations.to}</span>
                      </div>
                    </div>
                  )}

                  {/* รายละเอียดที่อยู่ (สำหรับงานช่าง) */}
                  {job.type === 'service' && (
                    <div className="bg-gray-50 rounded-xl p-3 mb-3 border border-gray-100 flex items-start gap-2">
                      <span className="text-red-500 text-xs shrink-0 mt-0.5">📍</span>
                      <span className="text-[10px] font-bold text-gray-700 leading-relaxed">{job.locations.to}</span>
                    </div>
                  )}

                  {/* โน้ตเพิ่มเติม */}
                  <p className="text-[11px] text-gray-600 font-medium leading-relaxed mb-4 bg-yellow-50/50 p-2.5 rounded-lg border border-yellow-100/50">
                    <span className="font-bold text-gray-800">รายละเอียด:</span> {job.details}
                  </p>

                  {/* Footer: ราคาและปุ่มรับงาน */}
                  <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                    <div>
                      <span className="text-[9px] text-gray-400 block mb-0.5">{job.timePosted}</span>
                      <span className={`text-sm font-black ${job.price === 'เสนอราคา' ? 'text-orange-500' : 'text-[#0082FA]'}`}>
                        {job.price !== 'เสนอราคา' && job.price !== 'ตามตกลง' ? '฿' : ''}{job.price}
                      </span>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        alert(`คุณยืนยันที่จะรับงาน: ${job.category} ใช่หรือไม่? (รอเชื่อม API)`);
                      }}
                      className="bg-[#0082FA] text-white px-6 py-2.5 rounded-full text-xs font-black shadow-md hover:bg-[#0070D6] active:scale-95 transition-all"
                    >
                      รับงานนี้ 🚀
                    </button>
                  </div>
                </div>
              ))}

              {filteredJobs.length === 0 && (
                <div className="text-center py-10 bg-white rounded-3xl border border-gray-100 shadow-sm">
                  <div className="text-4xl mb-2 opacity-50">📭</div>
                  <p className="font-bold text-gray-500 text-sm">ยังไม่มีงานในหมวดหมู่นี้</p>
                </div>
              )}
            </div>

          </main>
        </div>

        {/* ✅ Bottom Navigation (อัปเดตเป็น 6 ไอคอนมาตรฐาน) */}
        <div className="fixed bottom-0 w-full sm:max-w-2xl md:max-w-3xl bg-white/95 backdrop-blur-md border-t border-gray-100 px-1 py-4 flex justify-between items-center shadow-[0_-4px_25px_rgba(0,0,0,0.06)] rounded-t-[2.5rem] z-50">
          <NavItem icon="🏠" label="หน้าแรก" active={false} onClick={() => router.push('/')} />
          <NavItem icon="🛠️" label="บริการ" active={false} onClick={() => router.push('/services')} />
          <NavItem icon="📋" label="งานด่วน" active={false} onClick={() => router.push('/win-online')} />
          <NavItem icon="📰" label="ข่าวสาร" active={false} onClick={() => router.push('/news')} />
          <NavItem icon="🎟️" label="ปองเจริญ" active={false} onClick={() => router.push('/coupons')} />
          <NavItem icon="👤" label="ฉัน" active={false} onClick={() => router.push('/profile')} />
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}

// คอมโพเนนต์เมนูด้านล่าง ปรับปรุงใหม่ใช้ flex-1 (ใช้สีส้มเป็นตัว Active เหมือนหน้าอื่นๆ)
function NavItem({ icon, label, active, onClick }: any) {
  return (
    <div onClick={onClick} className={`flex flex-col items-center gap-1.5 cursor-pointer transition-all ${active ? 'scale-110' : 'opacity-40 hover:opacity-100'} flex-1`}>
      <span className="text-[22px]">{icon}</span>
      <span className={`text-[9px] font-bold ${active ? 'text-[#EE4D2D]' : 'text-gray-500'} whitespace-nowrap`}>{label}</span>
      {active && <div className="w-1.5 h-1.5 bg-[#EE4D2D] rounded-full shadow-sm mt-0.5"></div>}
    </div>
  );
}
