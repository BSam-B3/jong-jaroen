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

  // --- 1. License State ---
  const [hasMotoLicense, setHasMotoLicense] = useState(false);
  const [hasCarLicense, setHasCarLicense] = useState(false);

  // --- 2. Vehicles State (Support Multiple) ---
  const [vehicles, setVehicles] = useState([
    { id: Date.now(), type: 'motorcycle', registration: '', photos: { front: null, back: null, left: null, right: null } }
  ]);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push('/auth/login');
      setUser(session.user);
    };
    checkUser();
  }, [router, supabase]);

  const addVehicle = () => {
    setVehicles([...vehicles, { id: Date.now(), type: 'car', registration: '', photos: { front: null, back: null, left: null, right: null } }]);
  };

  const removeVehicle = (id: number) => {
    if (vehicles.length > 1) setVehicles(vehicles.filter(v => v.id !== id));
  };

  const updateVehicle = (id: number, field: string, value: any) => {
    setVehicles(vehicles.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasMotoLicense && !hasCarLicense) return alert('กรุณาอัปโหลดใบขับขี่อย่างน้อย 1 ประเภทค่ะ');
    setLoading(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        is_rider: true,
        rider_status: 'pending',
        vehicle_type: vehicles[0].type, // เก็บตัวหลักไว้ก่อน (รอทำระบบแยกคันทีหลัง)
        vehicle_registration: vehicles[0].registration,
      })
      .eq('id', user.id);

    if (error) {
      alert('Error: ' + error.message);
    } else {
      alert('ส่งใบสมัครเรียบร้อย! 🎉 ขั้นตอนถัดไปคือการยืนยันบัญชีธนาคารในหน้าโปรไฟล์นะคะ');
      router.push('/profile');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex justify-center font-sans pb-20">
      <div className="w-full max-w-xl bg-[#F4F6F8] min-h-screen shadow-xl flex flex-col border-x border-gray-100">
        
        {/* Header สไตล์จงเจริญ (Orange Theme) */}
        <div className="p-6 pt-12 bg-gradient-to-b from-[#EE4D2D] to-[#FF7337] text-white rounded-b-[2.5rem] shadow-sm relative z-20">
          <Link href="/profile" className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl mb-4 active:scale-95 transition-transform">←</Link>
          <h1 className="text-3xl font-black tracking-tight">สมัครเป็นคนขับ 🛵</h1>
          <p className="text-white/90 text-xs font-bold mt-2">ลงทะเบียนคนขับและจัดการรถของคุณ</p>
        </div>

        <form onSubmit={handleSubmit} className="px-5 mt-6 space-y-8 flex-1 pb-10">
          
          {/* SECTION 1: หมวดเอกสารใบขับขี่ */}
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-50 space-y-6">
            <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
              <span className="w-10 h-10 bg-orange-50 text-[#EE4D2D] rounded-full flex items-center justify-center text-xl shadow-inner">📋</span>
              <div>
                <h2 className="text-sm font-black text-gray-800">หมวดเอกสารสำคัญ</h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase">Drivers Licenses</p>
              </div>
            </div>

            <div className="space-y-4">
              <LicenseUpload 
                label="ใบอนุญาตขับรถจักรยานยนต์" 
                active={hasMotoLicense} 
                onToggle={() => setHasMotoLicense(!hasMotoLicense)} 
              />
              <LicenseUpload 
                label="ใบอนุญาตขับรถยนต์" 
                active={hasCarLicense} 
                onToggle={() => setHasCarLicense(!hasCarLicense)} 
              />
            </div>
          </div>

          {/* SECTION 2: หมวดจัดการรถ (My Garage) */}
          <div className="space-y-6">
            <div className="flex justify-between items-end px-2">
              <div>
                <h2 className="text-sm font-black text-gray-800">ยานพาหนะของคุณ</h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase">My Garage</p>
              </div>
              <button type="button" onClick={addVehicle} className="bg-[#0082FA] text-white text-[10px] font-black px-4 py-2 rounded-full shadow-sm active:scale-95 transition-transform">+ เพิ่มรถ</button>
            </div>

            {vehicles.map((v, index) => (
              <div key={v.id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-50 space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-[#EE4D2D] text-white text-[10px] font-black px-4 py-1.5 rounded-bl-2xl shadow-sm">
                  คันที่ {index + 1}
                </div>
                
                {/* เลือกประเภทรถ */}
                <div className="grid grid-cols-3 gap-2 pt-4">
                  {['motorcycle', 'saleng', 'car', 'suv', 'van', 'pickup'].map((type) => (
                    <button 
                      key={type} type="button"
                      onClick={() => updateVehicle(v.id, 'type', type)}
                      className={`p-3 rounded-xl border-2 text-center transition-all ${v.type === type ? 'border-[#EE4D2D] bg-orange-50 shadow-sm scale-100' : 'border-gray-50 scale-95 hover:bg-gray-50'}`}
                    >
                      <div className="text-xl mb-1">{getIcon(type)}</div>
                      <div className={`text-[8px] font-black uppercase ${v.type === type ? 'text-[#EE4D2D]' : 'text-gray-500'}`}>{type}</div>
                    </button>
                  ))}
                </div>

                <input 
                  required
                  placeholder="เลขทะเบียน (เช่น 1กข 1234 ระยอง)"
                  value={v.registration}
                  onChange={(e) => updateVehicle(v.id, 'registration', e.target.value)}
                  className="w-full p-4 rounded-xl bg-gray-50 border border-gray-100 text-sm font-bold outline-none focus:ring-2 focus:ring-[#EE4D2D]"
                />

                {/* รูปรถ 4 ด้าน */}
                <div className="grid grid-cols-2 gap-3">
                  {['หน้า', 'หลัง', 'ซ้าย', 'ขวา'].map(side => (
                    <div key={side} className="border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center bg-gray-50/50 flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform cursor-pointer hover:bg-gray-50">
                      <span className="text-lg opacity-80">📸</span>
                      <p className="text-[9px] font-black text-gray-500">รูปด้าน{side}</p>
                    </div>
                  ))}
                </div>

                {vehicles.length > 1 && (
                  <button type="button" onClick={() => removeVehicle(v.id)} className="w-full text-[11px] text-red-500 font-bold pt-2 flex items-center justify-center gap-1 hover:underline">
                    <span>✕</span> ลบรถคันนี้ออกจากรายการ
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* บัญชีรับเงิน Info */}
          <div className="bg-blue-50/50 rounded-[1.5rem] p-5 border border-blue-100/50">
            <p className="text-[11px] text-[#0082FA] font-black flex items-center gap-2">
              <span className="bg-white rounded-full w-5 h-5 flex items-center justify-center shadow-sm">ℹ️</span> ข้อมูลบัญชีรับเงิน
            </p>
            <p className="text-[10px] text-gray-500 font-bold mt-2 leading-relaxed">
              หลังจากส่งข้อมูลสมัครแล้ว คุณต้องยืนยันตัวตน (KYC) และผูกบัญชีธนาคารในหน้าโปรไฟล์ โดยชื่อผู้สมัครและหน้าสมุดบัญชีต้องตรงกัน 100% เพื่อความปลอดภัยในการรับเงินค่ะ
            </p>
          </div>

          <button disabled={loading} className="w-full bg-gradient-to-r from-[#EE4D2D] to-[#FF7337] text-white py-5 rounded-[2rem] font-black shadow-lg active:scale-95 transition-transform disabled:opacity-50 text-sm">
            {loading ? 'กำลังประมวลผล...' : 'ยืนยันข้อมูลและสมัครไรเดอร์ 🚀'}
          </button>
        </form>
      </div>
    </div>
  );
}

function LicenseUpload({ label, active, onToggle }: { label: string, active: boolean, onToggle: () => void }) {
  return (
    <div onClick={onToggle} className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${active ? 'border-[#EE4D2D] bg-orange-50 shadow-sm' : 'border-gray-100 bg-white hover:bg-gray-50'}`}>
      <div className="flex items-center gap-3">
        <span className="text-xl opacity-80">🪪</span>
        <span className={`text-xs font-black ${active ? 'text-[#EE4D2D]' : 'text-gray-700'}`}>{label}</span>
      </div>
      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${active ? 'bg-[#EE4D2D] border-[#EE4D2D]' : 'border-gray-300'}`}>
        {active && <span className="text-[10px] text-white">✓</span>}
      </div>
    </div>
  );
}

function getIcon(type: string) {
  switch (type) {
    case 'motorcycle': return '🛵';
    case 'saleng': return '🛺';
    case 'car': return '🚗';
    case 'suv': return '🚙';
    case 'van': return '🚐';
    case 'pickup': return '🛻';
    default: return '🚲';
  }
}
