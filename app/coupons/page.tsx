'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

// 🌟 Mock Data 🌟
const rewardData = {
  currentSpend: 2150,
  targetSpend: 3000,
  nextDrawDate: '16 มี.ค. 69',
  myTickets: [
    { number: '820866', serial: 'JC-88291' }, // ตรงรางวัลที่ 1 (ได้ 50,000)
    { number: '124068', serial: 'JC-40128' }, // ลงท้ายด้วย 068 ตรงเลขท้าย 3 ตัว (ได้ 2,000)
    { number: '554321', serial: 'JC-99382' }, // ไม่ถูกรางวัล
    { number: '098706', serial: 'JC-10293' }  // ลงท้ายด้วย 06 ตรงเลขท้าย 2 ตัว (ได้ 1,000)
  ],
};

// 🌟 ผลสลาก 🌟
const lottoResults = {
  date: '1 มีนาคม 2569',
  prize1: '820866',
  front3: ['479', '054'],
  back3: ['068', '837'],
  back2: '06',
};

export default function CouponsPage() {
  const router = useRouter();
  const progressPercent = Math.min((rewardData.currentSpend / rewardData.targetSpend) * 100, 100);
  const remainingToTarget = rewardData.targetSpend - rewardData.currentSpend;

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center pb-24">
      <div className="w-full sm:max-w-2xl md:max-w-3xl bg-[#F4F6F8] min-h-screen relative flex flex-col shadow-xl overflow-x-hidden">
        
        {/* ส่วนเนื้อหาที่ Scroll ได้ */}
        <div className="flex-1 overflow-y-auto pb-6 scrollbar-hide">
          
          {/* ✅ 🟠 Header ปรับเป็น "การ์ดลอย" สีส้ม-ทอง มุมมน 4 ด้าน */}
          <div className="bg-gradient-to-b from-[#EE4D2D] to-[#FF7337] rounded-[2.5rem] p-6 pt-8 shadow-md relative z-10 m-3 mt-4 overflow-hidden">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="flex items-center gap-3 mb-2 px-2 relative z-10">
              <button onClick={() => router.push('/')} className="text-white font-bold text-lg active:scale-90 transition-transform">←</button>
              <div className="space-y-0.5 text-left">
                <h1 className="text-white text-xl font-black drop-shadow-md tracking-tight flex items-center gap-2">
                  🎟️ คูปองจงเจริญ
                </h1>
                <p className="text-white/90 text-[11px] font-medium">
                  เทียบเลขลุ้นโชค อิงผลสลากกินแบ่งรัฐบาล
                </p>
              </div>
            </div>
          </div>

          <main className="px-5 relative z-20 space-y-5 mt-2">
            
            {/* ── 1. หลอดสะสมยอด ── */}
            <section className="bg-white rounded-[2rem] p-5 shadow-sm border border-gray-100">
              <div className="flex justify-between items-end mb-3">
                <div>
                  <h2 className="text-[10px] font-bold text-gray-500 mb-0.5">ยอดจ้างงานสะสม</h2>
                  <div className="text-xl font-black leading-none text-[#EE4D2D]">
                    {rewardData.currentSpend.toLocaleString()} บาท
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] text-gray-400 font-bold">เป้าหมาย</div>
                  <div className="text-xs font-black text-gray-800">{rewardData.targetSpend.toLocaleString()} บาท</div>
                </div>
              </div>

              <div className="relative h-2.5 w-full bg-orange-50 rounded-full overflow-hidden mb-3">
                <div 
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#FF7337] to-[#EE4D2D] rounded-full transition-all duration-1000" 
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
              
              <p className="text-[10px] text-center font-bold text-gray-500">
                จ้างเพิ่มอีก <span className="text-[#EE4D2D]">{remainingToTarget.toLocaleString()} บาท</span> รับคูปองมงคล 1 สิทธิ์! 🚀
              </p>
            </section>

            {/* ── 2. กระดานผลสลากกินแบ่งรัฐบาล ── */}
            <section className="rounded-[2rem] p-5 shadow-md relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #FFB787 0%, #F65D7B 100%)' }}>
              
              <div className="mb-4 relative z-10 text-white flex justify-between items-end">
                <div>
                  <h2 className="text-base font-black drop-shadow-sm leading-tight">ผลสลากกินแบ่งรัฐบาล</h2>
                  <p className="text-[10px] font-medium opacity-90 mt-0.5">งวดประจำวันที่ {lottoResults.date}</p>
                </div>
                <div className="text-[9px] bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm font-bold shadow-inner">🔴 สด</div>
              </div>

              <div className="grid grid-cols-3 gap-2 relative z-10">
                <div className="col-span-2 bg-white rounded-2xl p-3 shadow-sm flex flex-col items-center justify-center">
                  <div className="bg-gradient-to-r from-orange-400 to-pink-500 text-white text-[9px] font-bold px-3 py-0.5 rounded-full mb-1">รางวัลที่ 1</div>
                  <div className="text-2xl font-black text-gray-900 tracking-widest">{lottoResults.prize1}</div>
                </div>
                <div className="col-span-1 bg-white rounded-2xl p-3 shadow-sm flex flex-col items-center justify-center">
                  <div className="text-2xl font-black text-gray-900 tracking-tight">{lottoResults.back2}</div>
                  <div className="bg-gradient-to-r from-orange-400 to-pink-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full mt-1">ท้าย 2 ตัว</div>
                </div>
                <div className="col-span-1 bg-white rounded-xl py-2 shadow-sm flex flex-col items-center justify-center mt-1">
                  <div className="text-xs font-black text-gray-900 tracking-wider">{lottoResults.front3.join(' | ')}</div>
                  <div className="text-[8px] text-gray-400 font-bold mt-1">เลขหน้า 3 ตัว</div>
                </div>
                <div className="col-span-2 bg-white rounded-xl py-2 shadow-sm flex flex-col items-center justify-center mt-1">
                  <div className="text-xs font-black text-gray-900 tracking-wider">{lottoResults.back3.join(' | ')}</div>
                  <div className="text-[8px] text-gray-400 font-bold mt-1">เลขท้าย 3 ตัว</div>
                </div>
              </div>
            </section>

            {/* ── 3. กติกาและเงินรางวัล ── */}
            <section className="bg-white rounded-[2rem] p-5 shadow-sm border border-gray-100">
              <h3 className="text-xs font-black text-gray-800 mb-3 flex items-center gap-1.5 border-b border-gray-50 pb-2">
                <span className="text-base">💰</span> เงินรางวัลคูปองมงคล
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center bg-orange-50 px-4 py-2.5 rounded-xl border border-orange-100">
                  <span className="text-[11px] font-bold text-orange-800">🏆 รางวัลที่ 1 (ตรง 6 ตัว)</span>
                  <span className="text-sm font-black text-[#EE4D2D]">50,000 บาท</span>
                </div>
                <div className="flex justify-between items-center bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-100">
                  <span className="text-[11px] font-bold text-gray-700">🥈 เลขหน้า / เลขท้าย 3 ตัว</span>
                  <span className="text-xs font-black text-gray-800">2,000 บาท</span>
                </div>
                <div className="flex justify-between items-center bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-100">
                  <span className="text-[11px] font-bold text-gray-700">🥉 เลขท้าย 2 ตัว</span>
                  <span className="text-xs font-black text-gray-800">1,000 บาท</span>
                </div>
              </div>
            </section>

            {/* ── 4. คูปองมงคลของคุณ ── */}
            <section>
              <div className="flex justify-between items-center mb-3 px-1">
                <h3 className="text-sm font-black text-gray-800 flex items-center gap-1.5">
                  <span className="text-base">🎫</span> คูปองของคุณ
                </h3>
                <span className="text-[10px] bg-orange-100 text-[#EE4D2D] px-3 py-1 rounded-full font-bold">
                  {rewardData.myTickets.length} สิทธิ์
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {rewardData.myTickets.map((ticket, idx) => {
                  
                  // ตรรกะตรวจรางวัล
                  const isPrize1 = ticket.number === lottoResults.prize1;
                  const isFront3 = lottoResults.front3.some(num => ticket.number.startsWith(num));
                  const isBack3 = lottoResults.back3.some(num => ticket.number.endsWith(num));
                  const isBack2 = ticket.number.endsWith(lottoResults.back2);
                  const won = isPrize1 || isFront3 || isBack3 || isBack2;

                  let prizeText = '';
                  if (isPrize1) prizeText = 'รับ 50,000 บาท';
                  else if (isFront3 || isBack3) prizeText = 'รับ 2,000 บาท';
                  else if (isBack2) prizeText = 'รับ 1,000 บาท';

                  return (
                    <div key={idx} className={`relative flex flex-col justify-between p-3.5 rounded-2xl shadow-sm overflow-hidden transition-transform hover:-translate-y-1 cursor-pointer border
                      ${won ? 'bg-green-50 border-green-400' : 'bg-gradient-to-br from-red-800 to-red-950 border-yellow-500/80'}`}>
                      
                      {!won && <div className="absolute inset-1 border border-yellow-500/30 rounded-xl pointer-events-none"></div>}

                      <div className="w-full flex justify-between items-start z-10">
                        <div className={`text-[9px] font-bold ${won ? 'text-green-700' : 'text-yellow-400 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]'}`}>
                          คูปองมงคล
                        </div>
                        <div className="text-right">
                          <div className={`text-[7px] font-medium ${won ? 'text-green-600' : 'text-white/90 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]'}`}>
                            งวด {rewardData.nextDrawDate}
                          </div>
                          <div className={`text-[6px] font-medium tracking-wider ${won ? 'text-green-500' : 'text-white/60'}`}>
                            {ticket.serial}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-center justify-center my-2 z-10">
                        <div className={`text-[11px] font-black tracking-[0.2em] pl-[0.2em] mb-0.5
                          ${won ? 'text-green-700' : 'bg-gradient-to-b from-yellow-100 via-yellow-300 to-yellow-600 bg-clip-text text-transparent drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]'}`}
                        >
                          จงเจริญ
                        </div>
                        <div className={`text-2xl font-black tracking-[0.15em] pl-[0.15em] leading-none
                          ${won ? 'text-green-600 drop-shadow-sm' : 'bg-gradient-to-b from-yellow-100 via-yellow-300 to-yellow-600 bg-clip-text text-transparent drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]'}`}
                        >
                          {ticket.number}
                        </div>
                      </div>

                      <div className="w-full text-center h-[18px]">
                        {won && (
                          <span className="inline-block text-[8px] font-bold text-white bg-green-500 px-2.5 py-0.5 rounded-full shadow-sm animate-pulse z-10 relative">
                            🎉 {prizeText}
                          </span>
                        )}
                      </div>

                      {!won && (
                        <div className="absolute inset-0 flex items-center justify-center text-5xl opacity-[0.05] grayscale pointer-events-none z-0">🐉</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

          </main>
        </div>

        {/* ✅ Bottom Navigation อัปเดตให้มี 6 ไอคอน (Active: ปองเจริญ) */}
        <div className="fixed bottom-0 w-full sm:max-w-2xl md:max-w-3xl bg-white/95 backdrop-blur-md border-t border-gray-100 px-1 py-4 flex justify-between items-center shadow-[0_-4px_25px_rgba(0,0,0,0.06)] rounded-t-[2.5rem] z-50">
          <NavItem icon="🏠" label="หน้าแรก" active={false} onClick={() => router.push('/')} />
          <NavItem icon="🛠️" label="บริการ" active={false} onClick={() => router.push('/services')} />
          <NavItem icon="📋" label="งานด่วน" active={false} onClick={() => router.push('/win-online')} />
          <NavItem icon="📰" label="ข่าวสาร" active={false} onClick={() => router.push('/news')} />
          <NavItem icon="🎟️" label="ปองเจริญ" active={true} onClick={() => {}} />
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

// คอมโพเนนต์เมนูด้านล่าง ปรับปรุงใหม่ใช้ flex-1
function NavItem({ icon, label, active, onClick }: any) {
  return (
    <div onClick={onClick} className={`flex flex-col items-center gap-1.5 cursor-pointer transition-all ${active ? 'scale-110' : 'opacity-40 hover:opacity-100'} flex-1`}>
      <span className="text-[22px]">{icon}</span>
      <span className={`text-[9px] font-bold ${active ? 'text-[#EE4D2D]' : 'text-gray-500'} whitespace-nowrap`}>{label}</span>
      {active && <div className="w-1.5 h-1.5 bg-[#EE4D2D] rounded-full shadow-sm mt-0.5"></div>}
    </div>
  );
}
