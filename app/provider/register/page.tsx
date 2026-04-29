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
  
  const [vehicleType, setVehicleType] = useState('motorcycle');
  const [registration, setRegistration] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccName, setBankAccName] = useState('');
  const [bankNumber, setBankNumber] = useState('');
  const [isAgreed, setIsAgreed] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push('/auth/login');
      setUser(session.user);
    };
    checkUser();
  }, [router, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAgreed) return alert('กรุณายอมรับเงื่อนไขค่ะ');
    setLoading(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        is_rider: true,
        rider_status: 'pending',
        vehicle_type: vehicleType,
        vehicle_registration: registration,
      })
      .eq('id', user.id);

    if (error) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } else {
      alert('ส่งใบสมัครเรียบร้อย! 🎉 รอแอดมินตรวจสอบนะคะ');
      router.push('/profile');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex justify-center font-sans pb-10">
      <div className="w-full max-w-xl bg-[#F4F6F8] min-h-screen shadow-xl flex flex-col border-x border-gray-100">
        
        {/* Header สไตล์จงเจริญ */}
        <div className="p-6 pt-12 bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-b-[3rem]">
          <Link href="/profile" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-xl">←</Link>
          <h1 className="text-3xl font-black mt-5 tracking-tight">ลงทะเบียนคนขับ <span className="text-[#EE4D2D]">🛵</span></h1>
          <p className="text-gray-400 text-[10px] font-bold mt-2 uppercase tracking-widest">Driver Registration</p>
        </div>

        <form onSubmit={handleSubmit} className="px-5 mt-5 space-y-6 flex-1 pb-10">
          
          {/* 1. เลือกประเภทรถ (เพิ่ม 7 ที่นั่ง & รถตู้) */}
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-50 space-y-5">
            <h2 className="text-sm font-black text-gray-800 flex items-center gap-2">
              <span className="w-6 h-6 bg-orange-100 text-[#EE4D2D] rounded-full flex items-center justify-center text-[10px]">1</span>
              ประเภทรถที่คุณมี
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'motorcycle', label: 'มอเตอร์ไซค์', icon: '🛵' },
                { id: 'saleng', label: 'ซาเล้ง', icon: '🛺' },
                { id: 'car', label: 'รถเก๋ง', icon: '🚗' },
                { id: 'suv', label: '7 ที่นั่ง', icon: '🚙' },
                { id: 'van', label: 'รถตู้', icon: '🚐' },
                { id: 'pickup', label: 'กระบะ', icon: '🛻' },
              ].map((v) => (
                <div key={v.id} onClick={() => setVehicleType(v.id)} className={`cursor-pointer p-3 rounded-2xl border-2 text-center transition-all ${vehicleType === v.id ? 'border-[#EE4D2D] bg-orange-50' : 'border-gray-50'}`}>
                  <div className="text-2xl mb-1">{v.icon}</div>
                  <div className="text-[9px] font-black">{v.label}</div>
                </div>
              ))}
            </div>
            <input required value={registration} onChange={(e) => setRegistration(e.target.value)} placeholder="เลขทะเบียน (เช่น 1กข 1234 ระยอง)" className="w-full p-4 rounded-xl bg-gray-50 border border-gray-100 text-sm font-bold outline-none focus:ring-2 focus:ring-[#EE4D2D]" />
          </div>

          {/* 2. รูปรถ 4 ด้าน & ใบขับขี่ */}
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-50 space-y-5">
            <h2 className="text-sm font-black text-gray-800 flex items-center gap-2">
              <span className="w-6 h-6 bg-orange-100 text-[#EE4D2D] rounded-full flex items-center justify-center text-[10px]">2</span>
              เอกสารและรูปรถ
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="border-2 border-dashed rounded-2xl p-4 text-center bg-gray-50">
                <div className="text-xl mb-1">🪪</div>
                <p className="text-[9px] font-black">ใบขับขี่</p>
              </div>
              <div className="border-2 border-dashed rounded-2xl p-4 text-center bg-gray-50">
                <div className="text-xl mb-1">📸</div>
                <p className="text-[9px] font-black">รูปรถหน้าตรง</p>
              </div>
              <div className="border-2 border-dashed rounded-2xl p-4 text-center bg-gray-50">
                <div className="text-xl mb-1">📸</div>
                <p className="text-[9px] font-black">รถด้านซ้าย</p>
              </div>
              <div className="border-2 border-dashed rounded-2xl p-4 text-center bg-gray-50">
                <div className="text-xl mb-1">📸</div>
                <p className="text-[9px] font-black">รถด้านขวา</p>
              </div>
              <div className="col-span-2 border-2 border-dashed rounded-2xl p-4 text-center bg-gray-50">
                <div className="text-xl mb-1">📸</div>
                <p className="text-[9px] font-black">รูปรถหลังตรง (เห็นทะเบียนชัดเจน)</p>
              </div>
            </div>
          </div>

          {/* 3. ข้อมูลรับเงิน */}
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-50 space-y-4">
            <h2 className="text-sm font-black text-gray-800 flex items-center gap-2">
              <span className="w-6 h-6 bg-orange-100 text-[#EE4D2D] rounded-full flex items-center justify-center text-[10px]">3</span>
              บัญชีรับเงิน
            </h2>
            <input required value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="ชื่อธนาคาร" className="w-full p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold" />
            <input required value={bankAccName} onChange={(e) => setBankAccName(e.target.value)} placeholder="ชื่อบัญชี (ต้องตรงกับชื่อสมัคร)" className="w-full p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold" />
            <input required value={bankNumber} onChange={(e) => setBankNumber(e.target.value)} placeholder="เลขที่บัญชี" className="w-full p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold" />
          </div>

          <div className="flex items-start gap-3 px-2">
            <input type="checkbox" checked={isAgreed} onChange={(e) => setIsAgreed(e.target.checked)} className="mt-1" />
            <p className="text-[10px] text-gray-400 font-bold">ฉันยืนยันว่าข้อมูลทั้งหมดเป็นความจริง และจะรับผิดชอบต่องานที่ได้รับมอบหมาย</p>
          </div>

          <button disabled={loading} className="w-full bg-[#EE4D2D] text-white py-5 rounded-[2rem] font-black shadow-lg active:scale-95 transition-all disabled:opacity-50">
            {loading ? 'กำลังส่งข้อมูล...' : 'ส่งใบสมัครไรเดอร์ 🚀'}
          </button>
        </form>
      </div>
    </div>
  );
}
