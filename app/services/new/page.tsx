'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function CreateGigPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [packages, setPackages] = useState({
    basic: { name: 'เริ่มต้น', desc: '', price: '', delivery: '3' },
    standard: { name: 'มาตรฐาน', desc: '', price: '', delivery: '5' },
    premium: { name: 'มืออาชีพ', desc: '', price: '', delivery: '7' }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase.from('provider_services').insert({
      provider_id: user?.id,
      title,
      description,
      packages, // เก็บเป็น JSONB
      price_start: Number(packages.basic.price),
      status: 'active'
    }).select().single();

    if (!error) router.push(`/services/${data.id}`);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-black mb-8">สร้างแพ็กเกจบริการใหม่ 🚀</h1>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* ข้อมูลพื้นฐาน */}
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-4">1. ข้อมูลทั่วไป</h2>
            <input 
              type="text" placeholder="รับทำ..." value={title} onChange={e => setTitle(e.target.value)}
              className="w-full p-4 bg-gray-50 rounded-2xl mb-4 outline-none focus:ring-2 focus:ring-[#EE4D2D]"
            />
            <textarea 
              placeholder="อธิบายรายละเอียดงานของคุณ..." value={description} onChange={e => setDescription(e.target.value)}
              className="w-full p-4 bg-gray-50 rounded-2xl h-40 outline-none"
            />
          </div>

          {/* ตารางแพ็กเกจแบบ Fastwork */}
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 overflow-x-auto">
            <h2 className="text-xl font-bold mb-6">2. ตั้งค่าแพ็กเกจราคา</h2>
            <div className="grid grid-cols-3 gap-4 min-w-[600px]">
              {['basic', 'standard', 'premium'].map((tier) => (
                <div key={tier} className="p-5 bg-gray-50 rounded-3xl border border-gray-200">
                  <p className="font-black text-[#EE4D2D] mb-3 uppercase text-center">{tier}</p>
                  <input 
                    type="number" placeholder="ราคา (บาท)" 
                    className="w-full p-3 rounded-xl mb-3 text-center font-bold"
                    value={(packages as any)[tier].price}
                    onChange={e => setPackages({...packages, [tier]: {...(packages as any)[tier], price: e.target.value}})}
                  />
                  <textarea 
                    placeholder="รายละเอียดแพ็กเกจนี้..." 
                    className="w-full p-3 rounded-xl text-xs h-24"
                    value={(packages as any)[tier].desc}
                    onChange={e => setPackages({...packages, [tier]: {...(packages as any)[tier], desc: e.target.value}})}
                  />
                </div>
              ))}
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full py-5 bg-[#EE4D2D] text-white rounded-3xl font-black text-xl shadow-xl">
            {loading ? 'กำลังบันทึก...' : 'เปิดร้านรับงานเลย! ✨'}
          </button>
        </form>
      </div>
    </div>
  );
}
