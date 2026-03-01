'use client';

import { useState } from 'react';

const mockServices = [
  { id: 1, icon: '⚡', title: 'Electrician', titleTH: 'ช่างไฟ', price: 350 },
  { id: 2, icon: '🏠', title: 'Cleaner', titleTH: 'แม่บ้าน', price: 250 },
  { id: 3, icon: '⛵', title: 'Boat Repair', titleTH: 'ซ่อมเรือ', price: 500 },
  { id: 4, icon: '🔧', title: 'General', titleTH: 'รับจ้างทั่วไป', price: 200 },
];

const mockFreelancers = [
  { id: 1, name: 'ช่างนพ ประแส', category: 'Electrician', rating: 4.8, price: 350, jobs: 47 },
  { id: 2, name: 'น้องจอย แม่บ้าน', category: 'Cleaner', rating: 4.9, price: 250, jobs: 83 },
  { id: 3, name: 'พี่ตู่ ซ่อมเรือ', category: 'Boat Repair', rating: 5.0, price: 500, jobs: 32 },
];

function generateLotteryNumber(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export default function HomePage() {
  const [lotteryNumber, setLotteryNumber] = useState<string | null>(null);
  const [selectedFreelancer, setSelectedFreelancer] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handleHire = (freelancerName: string) => {
    setSelectedFreelancer(freelancerName);
    setLotteryNumber(generateLotteryNumber());
    setShowModal(true);
  };

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-blue-900 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-50 shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-yellow-500 rounded-full flex items-center justify-center text-blue-900 font-black text-sm">JJ</div>
          <div>
            <div className="font-bold text-sm">จงเจริญ</div>
            <div className="text-yellow-400 text-xs">PandVHappiness</div>
          </div>
        </div>
        <button className="bg-yellow-500 text-blue-900 text-xs font-bold px-3 py-1.5 rounded-full">Login</button>
      </header>

      <section className="bg-gradient-to-br from-blue-900 to-blue-700 text-white px-4 py-8 text-center">
        <h1 className="text-2xl font-black mb-1">Hire Local, Get Lucky!</h1>
        <p className="text-blue-200 text-sm mb-4">จ้างช่างปากน้ำประแส ลุ้นหวย 6 หลักฟรี!</p>
        <div className="bg-white/10 border border-yellow-400/40 rounded-2xl p-4 mx-auto max-w-xs">
          <div className="text-yellow-400 text-xs font-semibold mb-1">🎰 เลขนำโชคงวดนี้</div>
          <div className="text-4xl font-black text-yellow-300 tracking-widest my-2">{lotteryNumber ?? '??????'}</div>
          <div className="text-blue-200 text-xs">จ้างงานทุกครั้ง = 1 สิทธิ์ลุ้น!</div>
        </div>
      </section>

      <section className="px-4 py-5">
        <h2 className="text-blue-900 font-bold text-base mb-3">หมวดหมู่บริการ</h2>
        <div className="grid grid-cols-4 gap-2">
          {mockServices.map((s) => (
            <div key={s.id} className="bg-white flex flex-col items-center p-3 rounded-xl shadow-sm border border-blue-50 text-center">
              <span className="text-2xl">{s.icon}</span>
              <span className="text-xs font-medium text-blue-900 mt-1">{s.titleTH}</span>
              <span className="text-xs text-gray-400">฿{s.price}+</span>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 pb-6">
        <h2 className="text-blue-900 font-bold text-base mb-3">ช่างแนะนำในประแส</h2>
        <div className="flex flex-col gap-3">
          {mockFreelancers.map((f) => (
            <div key={f.id} className="bg-white rounded-2xl shadow-sm border border-blue-50 p-4 flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-900 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">{f.name.charAt(0)}</div>
              <div className="flex-1">
                <div className="font-semibold text-blue-900 text-sm">{f.name}</div>
                <div className="text-gray-500 text-xs">{f.category}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-yellow-500 text-xs">⭐ {f.rating}</span>
                  <span className="text-gray-400 text-xs">{f.jobs} งาน</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="text-blue-900 font-bold text-sm">฿{f.price}</div>
                <button onClick={() => handleHire(f.name)} className="bg-blue-900 text-white text-xs font-bold px-3 py-1.5 rounded-full">จ้างเลย!</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around py-2 z-50">
        <button className="flex flex-col items-center text-blue-900 text-xs gap-0.5"><span>🏠</span>หน้าหลัก</button>
        <button className="flex flex-col items-center text-gray-400 text-xs gap-0.5"><span>🔍</span>ค้นหา</button>
        <button className="flex flex-col items-center text-gray-400 text-xs gap-0.5"><span>📋</span>งานของฉัน</button>
        <button className="flex flex-col items-center text-gray-400 text-xs gap-0.5"><span>👤</span>โปรไฟล์</button>
      </nav>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm text-center" onClick={(e) => e.stopPropagation()}>
            <div className="text-4xl mb-2">🎉</div>
            <h3 className="text-blue-900 font-black text-lg mb-1">จ้างงานสำเร็จ!</h3>
            <p className="text-gray-500 text-sm mb-4">{selectedFreelancer}</p>
            <div className="bg-blue-900 rounded-2xl p-4 mb-4">
              <div className="text-yellow-400 text-xs mb-1">🎰 เลขนำโชคของคุณ</div>
              <div className="text-3xl font-black text-yellow-300 tracking-widest">{lotteryNumber}</div>
              <div className="text-blue-200 text-xs mt-1">เก็บไว้ลุ้นรางวัลประจำเดือน!</div>
            </div>
            <button onClick={() => setShowModal(false)} className="w-full bg-yellow-500 text-blue-900 font-bold py-3 rounded-full text-sm">รับทราบ ✓</button>
          </div>
        </div>
      )}
    </main>
  );
}
