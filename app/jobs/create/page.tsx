'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

const CATEGORIES = ["งานประจำ", "งานขนส่ง", "งานบริการ", "งานทั่วไป"];

export default function CreateJobPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Form States
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [budget, setBudget] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/auth/login?next=/jobs/create');
      else setUser(data.user);
    });
  }, [router, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !location) {
      setError('กรุณากรอกข้อมูลสำคัญให้ครบถ้วนนะคะ');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error: insertError } = await supabase.from('jobs').insert({
        employer_id: user.id,
        title,
        category,
        description,
        location,
        budget: budget ? Number(budget) : null,
        is_urgent: isUrgent,
        status: 'open', // เริ่มต้นด้วยสถานะเปิดรับคน
      }).select().single();

      if (insertError) throw insertError;

      alert('ประกาศงานสำเร็จแล้ว! 🚀 รอช่างฝีมือดีมาเสนอราคานะคะ');
      router.push(`/jobs/${data.id}`); // พาไปดูหน้ารายละเอียดงานที่เพิ่งสร้าง
    } catch (err: any) {
      setError('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex justify-center font-sans pb-24">
      <div className="w-full sm:max-w-2xl bg-white min-h-screen shadow-xl relative flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#EE4D2D] to-[#FF7337] px-6 pt-10 pb-6 shadow-md relative z-20 rounded-b-[2rem]">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm text-white text-xl active:scale-95 transition-transform">←</button>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">โพสต์งานใหม่ 📝</h1>
              <p className="text-[11px] font-bold text-white/80 mt-0.5">หาคนช่วยงานง่ายๆ แค่ปลายนิ้ว</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <main className="px-6 mt-8 flex-1">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {error && <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-black border border-red-100">{error}</div>}

            {/* หัวข้องาน */}
            <div>
              <label className="block text-[11px] font-black text-gray-400 uppercase mb-2 ml-1">หัวข้องานที่ต้องการให้ช่วย</label>
              <input 
                type="text" 
                placeholder="เช่น ซ่อมท่อประปา, รับส่งเอกสารด่วน" 
                value={title} onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 font-bold text-gray-900 outline-none focus:ring-2 focus:ring-[#EE4D2D] focus:bg-white transition-all"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* หมวดหมู่ */}
              <div>
                <label className="block text-[11px] font-black text-gray-400 uppercase mb-2 ml-1">หมวดหมู่</label>
                <select 
                  value={category} onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 font-bold text-gray-900 outline-none focus:ring-2 focus:ring-[#EE4D2D]"
                >
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              {/* งบประมาณ */}
              <div>
                <label className="block text-[11px] font-black text-gray-400 uppercase mb-2 ml-1">งบประมาณ (บาท)</label>
                <input 
                  type="number" 
                  placeholder="เว้นว่างถ้าให้ช่างเสนอ" 
                  value={budget} onChange={(e) => setBudget(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 font-bold text-gray-900 outline-none focus:ring-2 focus:ring-[#EE4D2D] focus:bg-white"
                />
              </div>
            </div>

            {/* รายละเอียด */}
            <div>
              <label className="block text-[11px] font-black text-gray-400 uppercase mb-2 ml-1">รายละเอียดงาน</label>
              <textarea 
                rows={4}
                placeholder="อธิบายสิ่งที่คุณต้องการให้ช่างทำอย่างละเอียด..." 
                value={description} onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 font-medium text-gray-900 outline-none focus:ring-2 focus:ring-[#EE4D2D] focus:bg-white transition-all resize-none"
                required
              />
            </div>

            {/* สถานที่ */}
            <div>
              <label className="block text-[11px] font-black text-gray-400 uppercase mb-2 ml-1">พิกัด / สถานที่ปฏิบัติงาน</label>
              <div className="relative">
                <span className="absolute left-4 top-4 text-red-500">📍</span>
                <input 
                  type="text" 
                  placeholder="เช่น ระยอง, หรือแนบลิงก์ Google Maps" 
                  value={location} onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-10 pr-5 py-4 font-bold text-gray-900 outline-none focus:ring-2 focus:ring-[#EE4D2D] focus:bg-white transition-all"
                  required
                />
              </div>
            </div>

            {/* สวิตช์ งานด่วน */}
            <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="font-black text-orange-900 flex items-center gap-2">🔥 ต้องการช่างด่วนมาก!</p>
                <p className="text-[10px] font-bold text-orange-700 mt-0.5">ประกาศของคุณจะโดดเด่นและเตือนช่างในพื้นที่</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={isUrgent} onChange={() => setIsUrgent(!isUrgent)} />
                <div className="w-11 h-6 bg-orange-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#EE4D2D]"></div>
              </label>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={loading}
              className="w-full mt-4 bg-[#EE4D2D] text-white py-4 rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-all disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'ประกาศงานเลย! 🚀'}
            </button>
            <p className="text-center text-[10px] font-bold text-gray-400 mt-4">แพลตฟอร์มจะยังไม่เรียกเก็บเงินจนกว่าคุณจะตกลงจ้างช่าง</p>

          </form>
        </main>
      </div>
    </div>
  );
}
