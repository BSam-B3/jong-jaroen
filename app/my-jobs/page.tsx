'use client';

import { useState } from 'react';
import Link from 'next/link';

type Mode = 'hired' | 'received';
type Status = 'pending' | 'progress' | 'done';

interface Job {
  id: string;
  title: string;
  counterparty: string;
  price: number;
  status: Status;
  category: string;
  date: string;
}

const STATUS_META: Record<Status, { label: string; icon: string; bg: string; text: string; ring: string }> = {
  pending:  { label: 'รอการยืนยัน',     icon: '🟡', bg: 'bg-amber-50',  text: 'text-amber-700',  ring: 'ring-amber-200' },
  progress: { label: 'กำลังดำเนินการ', icon: '🟢', bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200' },
  done:     { label: 'เสร็จสิ้น',       icon: '✅', bg: 'bg-gray-100',  text: 'text-gray-600',   ring: 'ring-gray-200' },
};

// 📌 ข้อมูลจำลอง (Mock Data)
const HIRED_JOBS: Job[] = [
  { id: 'h1', title: 'ซ่อมแอร์ห้องนอน 12,000 BTU', counterparty: 'ช่างสมชาย (ช่างแอร์มืออาชีพ)', price: 850,  status: 'pending',  category: '🛠️ ซ่อมแอร์', date: 'วันนี้ 14:30' },
  { id: 'h2', title: 'แม่บ้านทำความสะอาดบ้านครึ่งวัน', counterparty: 'พี่นิด แม่บ้านมืออาชีพ',    price: 600,  status: 'progress', category: '🧹 แม่บ้าน',  date: 'พรุ่งนี้ 09:00' },
  { id: 'h3', title: 'ส่งของไปตลาดประแสร์',           counterparty: 'วินพี่เอก',                    price: 80,   status: 'done',     category: '🛵 ส่งของ',   date: 'เมื่อวาน' },
];

const RECEIVED_JOBS: Job[] = [
  { id: 'r1', title: 'รับงานติดตั้งกล้องวงจรปิด 4 จุด', counterparty: 'คุณวิภา (ผู้ว่าจ้าง)',    price: 2500, status: 'progress', category: '📷 ติดตั้ง',  date: 'วันนี้ 16:00' },
  { id: 'r2', title: 'งานพาร์ทไทม์ช่วยขนของย้ายบ้าน',    counterparty: 'คุณธนา (ผู้ว่าจ้าง)',     price: 450,  status: 'pending',  category: '📦 ขนของ',    date: 'เสาร์นี้ 08:00' },
];

export default function MyJobsPage() {
  const [mode, setMode] = useState<Mode>('hired');

  const isHired = mode === 'hired';
  
  // 🎨 ธีมสีแยกตามแท็บที่เลือก
  const accent = isHired
    ? { bg: 'bg-[#EE4D2D]', text: 'text-[#EE4D2D]', soft: 'bg-orange-50', border: 'border-orange-100', grad: 'from-[#EE4D2D] to-[#FF7337]' }
    : { bg: 'bg-[#0082FA]', text: 'text-[#0082FA]', soft: 'bg-blue-50',   border: 'border-blue-100',   grad: 'from-[#0082FA] to-[#00A3FF]' };

  const jobs = isHired ? HIRED_JOBS : RECEIVED_JOBS;

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex justify-center font-sans pb-24">
      <div className="w-full sm:max-w-2xl md:max-w-3xl min-h-screen relative flex flex-col shadow-xl bg-[#F4F6F8]">

        {/* 🟠 Header */}
        <header className="px-6 pt-10 pb-4 bg-white border-b border-gray-100 shadow-sm rounded-b-[2.5rem] relative z-20">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-gray-900 text-2xl font-black tracking-tight">งานของฉัน</h1>
            <Link
              href="/notifications"
              className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-lg active:scale-95 transition-transform border border-gray-100 shadow-inner"
              aria-label="การแจ้งเตือน"
            >
              🔔
            </Link>
          </div>
          <p className="text-xs text-gray-400 font-bold">ติดตามสถานะงานทั้งหมดของคุณที่นี่</p>
        </header>

        {/* 🔀 Tab Toggle (อัปเกรดแอนิเมชันให้ลื่นไหล) */}
        <div className="px-5 pt-5 relative z-10">
          <div className="relative bg-white rounded-2xl p-1.5 flex shadow-sm border border-gray-100">
            <span
              className={`absolute top-1.5 bottom-1.5 w-[calc(50%-0.375rem)] rounded-xl bg-gradient-to-r ${accent.grad} shadow-md transition-transform duration-300 ease-out`}
              style={{ transform: isHired ? 'translateX(0)' : 'translateX(100%)' }}
              aria-hidden
            />
            <button
              onClick={() => setMode('hired')}
              className={`relative z-10 flex-1 py-2.5 rounded-xl text-sm font-black transition-colors duration-300 ${
                isHired ? 'text-white' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              💼 งานที่ฉันจ้าง
            </button>
            <button
              onClick={() => setMode('received')}
              className={`relative z-10 flex-1 py-2.5 rounded-xl text-sm font-black transition-colors duration-300 ${
                !isHired ? 'text-white' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              🛠️ งานที่ฉันรับ
            </button>
          </div>
          <p className="text-[11px] text-gray-400 font-bold mt-2.5 text-center px-4">
            {isHired ? 'รายการงานที่คุณกำลังจ้างช่างหรือเรียกใช้บริการ' : 'รายการงานที่คุณรับมอบหมายและกำลังดำเนินการ'}
          </p>
        </div>

        {/* 📋 Job Cards */}
        <main className="px-5 mt-4 flex-1 space-y-4">
          {jobs.length === 0 ? (
            <div className="bg-white rounded-[2rem] p-10 text-center border border-gray-100 shadow-sm mt-4">
              <div className="text-5xl mb-3 opacity-50">📭</div>
              <p className="font-black text-gray-700 text-sm">ยังไม่มีงานในหมวดนี้</p>
              <p className="text-[10px] text-gray-400 font-bold mt-1">เริ่มค้นหางานหรือจ้างช่างได้เลย</p>
            </div>
          ) : (
            jobs.map((job) => {
              const s = STATUS_META[job.status];
              return (
                <article
                  key={job.id}
                  className={`bg-white rounded-[1.5rem] p-5 shadow-sm border ${accent.border} active:scale-[0.98] transition-transform group hover:shadow-md`}
                >
                  {/* Top row: category + status */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] font-black px-3 py-1.5 rounded-full ${accent.soft} ${accent.text}`}>
                      {job.category}
                    </span>
                    <span className={`text-[10px] font-black px-3 py-1.5 rounded-full ${s.bg} ${s.text} ring-1 ${s.ring} shadow-sm`}>
                      <span className="mr-1.5">{s.icon}</span>{s.label}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-black text-gray-900 text-sm leading-relaxed mb-3 line-clamp-2">
                    {job.title}
                  </h3>

                  {/* Meta */}
                  <div className="flex items-center gap-3 mb-4 bg-gray-50/50 p-2.5 rounded-xl border border-gray-50">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-sm shadow-sm border border-gray-100 shrink-0">
                      {isHired ? '🧑‍🔧' : '👤'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-black text-gray-700 truncate">{job.counterparty}</p>
                      <p className="text-[10px] text-gray-400 font-bold mt-0.5 flex items-center gap-1">
                        <span className="text-[10px]">🕒</span> {job.date}
                      </p>
                    </div>
                  </div>

                  {/* Footer: price + CTA */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wide mb-0.5">ค่าจ้าง</p>
                      <div className="flex items-baseline gap-1">
                        <p className={`font-black text-lg ${accent.text}`}>
                          {job.price.toLocaleString('th-TH')}
                        </p>
                        <span className={`text-[10px] font-black ${accent.text}`}>บาท</span>
                      </div>
                    </div>
                    <button
                      className={`${accent.bg} text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-sm active:scale-95 transition-transform flex items-center gap-1.5`}
                    >
                      {job.status === 'pending'  && (isHired ? 'ยืนยันงาน' : 'ตอบรับงาน')}
                      {job.status === 'progress' && 'ดูรายละเอียด'}
                      {job.status === 'done'     && (isHired ? 'ให้คะแนน' : 'ดูสรุป')}
                      <span className="text-white/80">→</span>
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </main>
      </div>
    </div>
  );
}
