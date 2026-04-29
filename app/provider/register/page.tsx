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

  // --- States ---
  const [licenseType, setLicenseType] = useState('motorcycle');
  const [vehicle, setVehicle] = useState({
    type: 'motorcycle',
    brand: '',
    model: '',
    color: '',
    registration: ''
  });
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
    if (!isAgreed) return alert('กรุณายอมรับเงื่อนไขการให้บริการค่ะ');
    setLoading(true);

    try {
      // 1. อัปเดตสถานะในโปรไฟล์หลัก
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          is_rider: true,
          rider_status: 'pending'
        })
        .eq('id', user.id);
      if (profileError) throw profileError;

      // 2. บันทึกข้อมูลรถลงตารางใหม่ (rider_vehicles)
      const { error: vehicleError } = await supabase
        .from('rider_vehicles')
        .insert({
          rider_id: user.id,
          vehicle_type: vehicle.type,
          brand: vehicle.brand,
          model: vehicle.model,
          color: vehicle.color,
          registration: vehicle.registration,
          status: 'pending'
        });
      if (vehicleError) throw vehicleError;

      alert('ส่งใบสมัครและข้อมูลรถเรียบร้อย! 🎉 รอแอดมินตรวจสอบนะคะ');
      router.push('/profile');

    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex justify-center font-sans pb-20">
      {/* 🌟 ขยายความกว้างเป็น max-w-5xl สำหรับ 2 คอลัมน์ */}
      <div className="w-full max-w-5xl bg-[#F4F6F8] min-h-screen flex flex-col">
        
        {/* Header */}
        <div className="p-8 pt-12 bg-gradient-to-r from-[#EE4D2D] to-[#FF7337] text-white rounded-b-[3rem] shadow-md relative z-20 mx-4 sm:mx-0">
          <Link href="/profile" className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl mb-6 hover:bg-white/30 transition-colors">←</Link>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-lg">🛵</div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight">ลงทะเบียนคนขับ</h1>
              <p className="text-white/90 text-sm font-bold mt-2">Driver Onboarding & Vehicle Registration</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 mt-4 flex-1">
          {/* 🌟 Grid 2 คอลัมน์ (จอคอมแบ่งซ้าย-ขวา / จอมือถือเรียงบน-ล่าง) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* ============================== */}
            {/* คอลัมน์ซ้าย: กรอกข้อมูล (Text)  */}
            {/* ============================== */}
            <div className="space-y-6">
              
              {/* 1. ข้อมูลรถยนต์ */}
              <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-black text-gray-800 mb-4 border-b pb-3 flex items-center gap-2">
                  <span>🚗</span> ข้อมูลยานพาหนะ
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-[11px] font-black text-gray-500 uppercase mb-2 block">ประเภทรถ</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['motorcycle', 'saleng', 'car', 'suv', 'van', 'pickup'].map((type) => (
                        <button key={type} type="button" onClick={() => setVehicle({...vehicle, type})} className={`p-3 rounded-xl border-2 text-center transition-all ${vehicle.type === type ? 'border-[#EE4D2D] bg-orange-50' : 'border-gray-50'}`}>
                          <div className="text-xl">{getIcon(type)}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-black text-gray-500 uppercase mb-2 block">ยี่ห้อ (Brand)</label>
                      <input required placeholder="เช่น Honda, Toyota" value={vehicle.brand} onChange={(e) => setVehicle({...vehicle, brand: e.target.value})} className="w-full p-3.5 rounded-xl bg-gray-50 border border-gray-100 text-sm font-bold outline-none focus:ring-2 focus:ring-[#EE4D2D]" />
                    </div>
                    <div>
                      <label className="text-[11px] font-black text-gray-500 uppercase mb-2 block">รุ่น (Model)</label>
                      <input required placeholder="เช่น Wave 110i, Yaris" value={vehicle.model} onChange={(e) => setVehicle({...vehicle, model: e.target.value})} className="w-full p-3.5 rounded-xl bg-gray-50 border border-gray-100 text-sm font-bold outline-none focus:ring-2 focus:ring-[#EE4D2D]" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-black text-gray-500 uppercase mb-2 block">สีรถ (Color)</label>
                      <input required placeholder="เช่น แดง-ดำ, ขาว" value={vehicle.color} onChange={(e) => setVehicle({...vehicle, color: e.target.value})} className="w-full p-3.5 rounded-xl bg-gray-50 border border-gray-100 text-sm font-bold outline-none focus:ring-2 focus:ring-[#EE4D2D]" />
                    </div>
                    <div>
                      <label className="text-[11px] font-black text-gray-500 uppercase mb-2 block">ป้ายทะเบียน (Plate)</label>
                      <input required placeholder="เช่น 1กข 1234 ระยอง" value={vehicle.registration} onChange={(e) => setVehicle({...vehicle, registration: e.target.value})} className="w-full p-3.5 rounded-xl bg-gray-50 border border-gray-100 text-sm font-black outline-none focus:ring-2 focus:ring-[#EE4D2D] text-[#EE4D2D]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. ประเภทใบขับขี่ */}
              <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-black text-gray-800 mb-4 border-b pb-3 flex items-center gap-2">
                  <span>🪪</span> ประเภทใบอนุญาตขับขี่
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'motorcycle', label: 'รถจักรยานยนต์' },
                    { id: 'car', label: 'รถยนต์ส่วนบุคคล' },
                    { id: 'transport', label: 'ท.1 / ท.2 (รับจ้าง)' }
                  ].map((lic) => (
                    <button key={lic.id} type="button" onClick={() => setLicenseType(lic.id)} className={`p-4 rounded-xl border-2 text-left transition-all ${licenseType === lic.id ? 'border-[#EE4D2D] bg-orange-50' : 'border-gray-50'}`}>
                      <div className={`w-4 h-4 rounded-full border-2 mb-2 flex items-center justify-center ${licenseType === lic.id ? 'border-[#EE4D2D] bg-[#EE4D2D]' : 'border-gray-300'}`}>
                         {licenseType === lic.id && <span className="text-[8px] text-white">✓</span>}
                      </div>
                      <div className="text-[10px] font-black">{lic.label}</div>
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* ============================== */}
            {/* คอลัมน์ขวา: อัปโหลดเอกสาร (Photos) */}
            {/* ============================== */}
            <div className="space-y-6">
              
              {/* ยืนยันตัวตนคนขับ */}
              <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-black text-gray-800 mb-4 border-b pb-3">👤 เอกสารคนขับ (Driver Docs)</h2>
                <div className="grid grid-cols-2 gap-4">
                  <UploadBox icon="🪪" title="รูปถ่ายใบขับขี่" desc="ด้านหน้าชัดเจน" />
                  <UploadBox icon="🤳" title="เซลฟี่คู่ใบขับขี่" desc="ถือบัตรไว้ใต้คาง" />
                </div>
              </div>

              {/* รูปรถและป้ายภาษี */}
              <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-black text-gray-800 mb-4 border-b pb-3">📸 รูปรถยนต์ (Vehicle Photos)</h2>
                
                <div className="mb-4">
                  <UploadBox icon="📄" title="ป้ายภาษีรถยนต์ / พ.ร.บ." desc="ต้องยังไม่หมดอายุ" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <UploadBox icon="🚘" title="รูปรถด้านหน้า" desc="เห็นหน้ารถเต็มคัน" />
                  <UploadBox icon="🚙" title="รูปรถด้านหลัง" desc="เห็นป้ายทะเบียนชัดเจน" />
                  <UploadBox icon="🚗" title="รูปรถด้านซ้าย" desc="ด้านข้างเต็มคัน" />
                  <UploadBox icon="🚗" title="รูปรถด้านขวา" desc="ด้านข้างเต็มคัน" />
                </div>
              </div>

            </div>
          </div>

          {/* Footer Submit */}
          <div className="mt-8 bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <input type="checkbox" checked={isAgreed} onChange={(e) => setIsAgreed(e.target.checked)} className="mt-1 w-5 h-5 accent-[#EE4D2D]" />
              <p className="text-xs text-gray-500 font-bold leading-relaxed">
                ฉันขอยืนยันว่าเอกสารและข้อมูลทั้งหมดเป็นความจริง และยินยอมให้บริษัทตรวจสอบประวัติเพื่อความปลอดภัยในการให้บริการ
              </p>
            </div>
            <button disabled={loading} className="w-full sm:w-auto px-10 py-4 bg-[#EE4D2D] text-white rounded-2xl font-black shadow-lg active:scale-95 transition-transform disabled:opacity-50 whitespace-nowrap">
              {loading ? 'กำลังส่งข้อมูล...' : 'ส่งใบสมัคร 🚀'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

// Component เสริมสำหรับทำปุ่มอัปโหลดรูปให้ดูสวยงาม
function UploadBox({ icon, title, desc }: { icon: string, title: string, desc: string }) {
  return (
    <div className="border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center bg-gray-50 hover:bg-orange-50 hover:border-[#EE4D2D] transition-colors cursor-pointer group flex flex-col items-center justify-center gap-1 min-h-[120px]">
      <span className="text-3xl mb-1 group-hover:scale-110 transition-transform">{icon}</span>
      <p className="text-[11px] font-black text-gray-700">{title}</p>
      <p className="text-[9px] font-bold text-gray-400">{desc}</p>
      <input type="file" className="hidden" /> {/* ซ่อน Input จริงไว้ รอเชื่อม Storage */}
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
