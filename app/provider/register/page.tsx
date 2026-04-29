'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function RiderRegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  // Form States
  const [vehicleType, setVehicleType] = useState('motorcycle');
  const [registration, setRegistration] = useState('');
  const [isAgreed, setIsAgreed] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }
      setUser(session.user);
      
      // เช็คว่าเคยสมัครไปหรือยัง
      const { data: profile } = await supabase
        .from('profiles')
        .select('rider_status')
        .eq('id', session.user.id)
        .single();
        
      if (profile?.rider_status === 'approved') {
        router.push('/job-board'); // ถ้าผ่านแล้วส่งไปบอร์ดงานเลย
      }
    };
    checkUser();
  }, [router, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAgreed) return alert('กรุณายอมรับเงื่อนไขการให้บริการค่ะ');
    
    setLoading(true);
    
    const { error } = await supabase
      .from('profiles')
      .update({
        is_rider: true,
        rider_status: 'pending', // รอแอดมินอนุมัติ
        vehicle_type: vehicleType,
        vehicle_registration: registration,
      })
      .eq('id', user.id);

    if (error) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } else {
      alert('ส่งข้อมูลสมัครเรียบร้อยแล้ว! 🎉 กรุณารอแอดมินตรวจสอบข้อมูลค่ะ');
      router.push('/profile');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex justify-center font-sans pb-10">
      <div className="w-full max-w-xl bg-white min-h-screen shadow-xl flex flex-col">
        
        {/* Header */}
        <div className="p-6 pt-12 bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-b-[3rem]">
          <Link href="/profile" className="text-white/60 text-sm font-bold">← กลับ</Link>
          <h1 className="text-3xl font-black mt-4 tracking-tight">สมัครเป็นไรเดอร์ 🛵</h1>
          <p className="text-gray-400 text-xs font-medium mt-2">ร่วมเป็นส่วนหนึ่งของครอบครัว "จงเจริญ" และเริ่มสร้างรายได้วันนี้</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8 flex-1">
          
          {/* 1. เลือกประเภทรถ */}
          <section>
            <label className="text-sm font-black text-gray-800 block mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-orange-100 text-[#EE4D2D] rounded-full flex items-center justify-center text-xs">1</span>
              ประเภทรถที่คุณใช้งาน
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'motorcycle', label: 'มอเตอร์ไซค์', icon: '🛵' },
                { id: 'saleng', label: 'ซาเล้ง / พ่วงข้าง', icon: '🛺' },
                { id: 'car', label: 'รถเก๋ง / 4 ล้อ', icon: '🚗' },
                { id: 'pickup', label: 'รถกระบะ / ส่งของ', icon: '🛻' },
              ].map((v) => (
                <div 
                  key={v.id}
                  onClick={() => setVehicleType(v.id)}
                  className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                    vehicleType === v.id ? 'border-[#EE4D2D] bg-orange-50 shadow-md' : 'border-gray-100'
                  }`}
                >
                  <span className="text-2xl">{v.icon}</span>
                  <span className="text-[11px] font-black">{v.label}</span>
                </div>
              ))}
            </div>
          </section>

          {/* 2. ข้อมูลรถ */}
          <section>
            <label className="text-sm font-black text-gray-800 block mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-orange-100 text-[#EE4D2D] rounded-full flex items-center justify-center text-xs">2</span>
              ข้อมูลป้ายทะเบียน
            </label>
            <input 
              required
              type="text" 
              placeholder="เช่น 1กข 1234 ระยอง"
              value={registration}
              onChange={(e) => setRegistration(e.target.value)}
              className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold focus:ring-2 focus:ring-[#EE4D2D] outline-none"
            />
            <p className="text-[10px] text-gray-400 font-bold mt-2 ml-1">* ข้อมูลนี้จะแสดงให้ลูกค้าเห็นเพื่อความปลอดภัย</p>
          </section>

          {/* 3. ใบขับขี่ (Placeholder) */}
          <section>
            <label className="text-sm font-black text-gray-800 block mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-orange-100 text-[#EE4D2D] rounded-full flex items-center justify-center text-xs">3</span>
              รูปถ่ายใบขับขี่
            </label>
            <div className="border-2 border-dashed border-gray-200 rounded-3xl p-8 text-center bg-gray-50/50">
              <div className="text-3xl mb-2">🪪</div>
              <p className="text-[11px] text-gray-500 font-bold">กดเพื่ออัปโหลดรูปใบขับขี่</p>
              <p className="text-[9px] text-gray-400 font-medium mt-1">(ต้องเห็นข้อมูลชัดเจนและยังไม่หมดอายุ)</p>
              <input type="file" className="hidden" disabled /> {/* เดี๋ยวเรามาต่อท่อ Storage กันค่ะ */}
            </div>
          </section>

          {/* Terms */}
          <div className="flex items-start gap-3 pt-4">
            <input 
              type="checkbox" 
              checked={isAgreed}
              onChange={(e) => setIsAgreed(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-gray-300 text-[#EE4D2D] focus:ring-[#EE4D2D]" 
            />
            <p className="text-[10px] text-gray-500 font-medium leading-relaxed">
              ข้าพเจ้ายืนยันว่าข้อมูลข้างต้นเป็นความจริงทุกประการ และยินยอมให้ระบบจัดเก็บข้อมูลเพื่อใช้ในการตรวจสอบความปลอดภัยตามนโยบายของแอป "จงเจริญ"
            </p>
          </div>

          <button 
            disabled={loading}
            className="w-full bg-[#EE4D2D] text-white py-5 rounded-[2rem] font-black text-sm shadow-lg active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? 'กำลังส่งข้อมูล...' : 'ส่งใบสมัครไรเดอร์ 🚀'}
          </button>

        </form>
      </div>
    </div>
  );
}
