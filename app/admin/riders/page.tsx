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
  
  // Proposed Payment States
  const [bankName, setBankName] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');

  const [isAgreed, setIsAgreed] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }
      setUser(session.user);
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('rider_status')
        .eq('id', session.user.id)
        .single();
        
      if (profile?.rider_status === 'approved') {
        router.push('/win-online/rider'); // ผ่านแล้วส่งไปหน้าเรดาร์รับงานเลย
      }
    };
    checkUser();
  }, [router, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAgreed) return alert('กรุณายอมรับเงื่อนไขการให้บริการค่ะ');
    
    setLoading(true);
    
    // ตรงนี้เราจะมาต่อท่ออัปโหลดไฟล์ Storage กันในสเต็ปถัดไปค่ะ
    // ตอนนี้เราจะ insert ข้อมูลตัวหนังสือเข้าตาราง profiles ก่อน
    
    const { error } = await supabase
      .from('profiles')
      .update({
        is_rider: true,
        rider_status: 'pending', // รอแอดมินอนุมัติ
        vehicle_type: vehicleType,
        vehicle_registration: registration,
        // (เรายังไม่มีคอลัมน์เก็บข้อมูลธนาคารในตาราง profiles เดี๋ยวเจมจะพาทำ SQL เพิ่มทีหลังค่ะ)
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
    <div className="min-h-screen bg-[#F4F6F8] flex justify-center font-sans pb-10 relative">
      <div className="w-full max-w-xl bg-[#F4F6F8] min-h-screen shadow-xl flex flex-col overflow-hidden border-x border-gray-100">
        
        {/* Dark Header */}
        <div className="p-6 pt-12 bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-b-[3rem] relative z-20">
          <Link href="/profile" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-xl active:scale-95 transition-transform border border-white/20 shadow-inner">
            ← กลับ
          </Link>
          <h1 className="text-3xl font-black mt-5 tracking-tight flex items-center gap-2">สมัครเป็นไรเดอร์ <span className="text-[#EE4D2D]">🛵</span></h1>
          <p className="text-gray-400 text-xs font-bold mt-2">ร่วมเป็นส่วนหนึ่งของครอบครัว "จงเจริญ" และเริ่มสร้างรายได้วันนี้</p>
        </div>

        <form onSubmit={handleSubmit} className="px-5 mt-5 space-y-6 flex-1 pb-safe">
          
          {/* Section 1: ข้อมูลรถ (White Card) */}
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-50 space-y-5 relative">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 bg-orange-100 text-[#EE4D2D] rounded-full flex items-center justify-center text-sm font-black shadow-inner">1</span>
              <div>
                <h2 className="text-sm font-black text-gray-800">ข้อมูลรถที่คุณใช้งาน</h2>
                <p className="text-[10px] text-gray-400 font-bold mt-0.5">เลือกประเภทรถและป้ายทะเบียน</p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'motorcycle', label: 'มอเตอร์ไซค์', icon: '🛵' },
                { id: 'saleng', label: 'ซาเล้ง / พ่วง', icon: '🛺' },
                { id: 'car', label: 'รถเก๋ง / 4 ล้อ', icon: '🚗' },
                { id: 'suv_7seaters', label: '7 ที่นั่ง / ครอบครัว', icon: '🚙' }, // ✅ รถครอบครัว 7 ที่นั่ง
                { id: 'van', label: 'รถตู้ / มินิบัส', icon: '🚐' }, // ✅ รถตู้
                { id: 'pickup', label: 'รถกระบะ / ขนของ', icon: '🛻' },
              ].map((v) => (
                <div 
                  key={v.id}
                  onClick={() => setVehicleType(v.id)}
                  className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                    vehicleType === v.id ? 'border-[#EE4D2D] bg-orange-50 shadow-md scale-100' : 'border-gray-100 scale-95'
                  }`}
                >
                  <span className="text-2xl">{v.icon}</span>
                  <span className="text-[9px] font-black">{v.label}</span>
                </div>
              ))}
            </div>

            <input 
              required
              type="text" 
              placeholder="เช่น 1กข 1234 ระยอง..."
              value={registration}
              onChange={(e) => setRegistration(e.target.value)}
              className="w-full p-4 rounded-[1.2rem] bg-gray-50 border border-gray-100 text-sm font-bold focus:ring-2 focus:ring-[#EE4D2D] outline-none shadow-sm placeholder:text-gray-400"
            />
            <p className="text-[10px] text-gray-400 font-bold mt-2 ml-1">* ข้อมูลป้ายทะเบียนนี้จะแสดงให้ลูกค้าเห็นเพื่อความปลอดภัย</p>
          </div>

          {/* Section 2: ใบขับขี่ (White Card) */}
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-50 space-y-5 relative">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 bg-orange-100 text-[#EE4D2D] rounded-full flex items-center justify-center text-sm font-black shadow-inner">2</span>
              <div>
                <h2 className="text-sm font-black text-gray-800">อัปโหลดใบขับขี่</h2>
                <p className="text-[10px] text-gray-400 font-bold mt-0.5">แนบรูปใบขับขี่ที่ยังไม่หมดอายุค่ะ</p>
              </div>
            </div>
            <div className="border-2 border-dashed border-gray-200 rounded-3xl p-8 text-center bg-gray-50 active:scale-95 transition-transform cursor-pointer flex flex-col items-center justify-center gap-2">
              <div className="text-3xl">🪪</div>
              <p className="text-[11px] text-gray-500 font-bold">กดเพื่ออัปโหลดรูปใบขับขี่</p>
              <p className="text-[9px] text-gray-400 font-medium">(ต้องเห็นข้อมูลชัดเจนครบถ้วน)</p>
              <input type="file" className="hidden" /> {/* เดี๋ยวเรามาต่อท่อ Storage กันค่ะ */}
            </div>
          </div>

          {/* Section 3: รูปรถ 4 ด้าน (White Card) */}
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-50 space-y-5 relative">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 bg-orange-100 text-[#EE4D2D] rounded-full flex items-center justify-center text-sm font-black shadow-inner">3</span>
              <div>
                <h2 className="text-sm font-black text-gray-800">อัปโหลดรูปรถ (รอบคัน)</h2>
                <p className="text-[10px] text-gray-400 font-bold mt-0.5">ถ่ายรูปทั้ง 4 ด้าน <span className="text-[#EE4D2D]">โดยต้องเห็นทะเบียนชัดเจน</span></p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 pt-2">
              {[
                { name: '1. รูปหน้า', label: 'หน้า' },
                { name: '2. รูปซ้าย', label: 'ซ้าย' },
                { name: '3. รูปขวา', label: 'ขวา' },
                { name: '4. รูปหลัง', label: 'หลัง' },
              ].map((v) => (
                <div key={v.name} className="border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center bg-gray-50/50 flex flex-col items-center justify-center gap-2 shadow-inner active:scale-95 transition-all">
                  <div className="text-xl">📍</div>
                  <p className="text-[10px] text-gray-500 font-black truncate max-w-full">{v.name}</p>
                  <p className="text-[9px] text-gray-400 font-bold mt-0.5">(เห็นทะเบียน)</p>
                  <input type="file" className="hidden" disabled />
                </div>
              ))}
            </div>
          </div>

          {/* Proposed: Section 4: ยืนยันตัวตนคนขับ (White Card) */}
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-50 space-y-5 relative">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 bg-orange-100 text-[#EE4D2D] rounded-full flex items-center justify-center text-sm font-black shadow-inner">4</span>
              <div>
                <h2 className="text-sm font-black text-gray-800">ยืนยันตัวตนคนขับ</h2>
                <p className="text-[10px] text-gray-400 font-bold mt-0.5">เพื่อป้องกันการโกงสวมสิทธิ์ค่ะ</p>
              </div>
            </div>
            <div className="border-2 border-dashed border-gray-200 rounded-3xl p-8 text-center bg-gray-50 active:scale-95 transition-transform flex flex-col items-center justify-center gap-2 shadow-inner">
              <div className="text-3xl">👤🪪</div>
              <p className="text-[11px] text-gray-500 font-black">รูปถ่ายเซลฟี่คู่กับใบขับขี่</p>
              <p className="text-[9px] text-gray-400 font-medium">(ถือใบขับขี่ให้เห็นข้อมูลหน้าชัดเจน)</p>
              <input type="file" className="hidden" disabled />
            </div>
          </div>

          {/* Proposed: Section 5: ข้อมูลรับเงิน (White Card) */}
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-50 space-y-5 relative">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 bg-orange-100 text-[#EE4D2D] rounded-full flex items-center justify-center text-sm font-black shadow-inner">5</span>
              <div>
                <h2 className="text-sm font-black text-gray-800">ข้อมูลรับเงิน (Payment)</h2>
                <p className="text-[10px] text-gray-400 font-bold mt-0.5">ช่องทางรับเงินที่คุณต้องการ</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <input type="text" placeholder="ชื่อธนาคาร..." className="w-full p-4 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold" />
              <input type="text" placeholder="ชื่อบัญชี (ต้องตรงกับใบสมัคร)..." className="w-full p-4 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold" />
              <input type="number" placeholder="เลขบัญชี..." className="w-full p-4 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold" />
            </div>
          </div>

          {/* Terms (No Card) */}
          <div className="flex items-start gap-3 pt-6 px-1">
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

          {/* Submit Button (No Card) */}
          <button 
            disabled={loading}
            className="w-full bg-[#EE4D2D] text-white py-5 rounded-[2rem] font-black text-base shadow-lg active:scale-95 transition-all disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
          >
            {loading ? 'กำลังส่งข้อมูล...' : 'ส่งใบสมัครไรเดอร์ 🚀'}
          </button>

        </main>
      </div>
    </div>
  );
}
