'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface Vehicle {
  id: number;
  type: string;
  brand: string;
  model: string;
  color: string;
  registration: string;
}

export default function RiderRegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  // --- States ---
  const [isAgreed, setIsAgreed] = useState(false);

  // 🌟 State ใหม่สำหรับจัดการใบขับขี่ (เลือกได้หลายแบบ)
  const [licenses, setLicenses] = useState({
    motorcycle: false,
    car: false,
    transport: false,
  });

  const [vehicles, setVehicles] = useState<Vehicle[]>([
    { id: Date.now(), type: 'motorcycle', brand: '', model: '', color: '', registration: '' }
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
    if (vehicles.length >= 4) {
      alert('จำกัดการเพิ่มยานพาหนะสูงสุด 4 คันต่อบัญชีครับ');
      return;
    }
    setVehicles([...vehicles, { id: Date.now(), type: 'car', brand: '', model: '', color: '', registration: '' }]);
  };

  const removeVehicle = (id: number) => {
    if (vehicles.length > 1) {
      setVehicles(vehicles.filter(v => v.id !== id));
    }
  };

  const updateVehicle = (index: number, field: keyof Vehicle, value: string) => {
    const updatedVehicles = [...vehicles];
    updatedVehicles[index] = { ...updatedVehicles[index], [field]: value };
    setVehicles(updatedVehicles);
  };

  // ฟังก์ชันสำหรับสลับสถานะปุ่มใบขับขี่
  const toggleLicense = (type: keyof typeof licenses) => {
    setLicenses(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAgreed) return alert('กรุณายอมรับเงื่อนไขการให้บริการค่ะ');
    if (!licenses.motorcycle && !licenses.car && !licenses.transport) {
      return alert('กรุณาเลือกและอัปโหลดใบอนุญาตขับขี่อย่างน้อย 1 ประเภทค่ะ');
    }
    setLoading(true);

    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ is_rider: true, rider_status: 'pending' })
        .eq('id', user.id);
      if (profileError) throw profileError;

      const vehiclesToInsert = vehicles.map(v => ({
        rider_id: user.id,
        vehicle_type: v.type,
        brand: v.brand,
        model: v.model,
        color: v.color,
        registration: v.registration,
        status: 'pending'
      }));

      const { error: vehicleError } = await supabase
        .from('rider_vehicles')
        .insert(vehiclesToInsert);
      if (vehicleError) throw vehicleError;

      alert('ส่งใบสมัครและข้อมูลรถ ' + vehicles.length + ' คันเรียบร้อยแล้ว! 🎉');
      router.push('/profile');

    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex justify-center font-sans pb-20">
      <div className="w-full max-w-6xl min-h-screen flex flex-col px-4 sm:px-6">
        
        {/* Header ส้มจงเจริญ */}
        <div className="mt-8 p-8 sm:p-12 bg-gradient-to-r from-[#EE4D2D] to-[#FF7337] text-white rounded-[3rem] shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-10 text-9xl">🛵</div>
          <Link href="/profile" className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl mb-8 hover:bg-white/30 transition-all active:scale-90 shadow-inner">←</Link>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tighter italic uppercase">Rider <span className="text-white not-italic">Registration</span></h1>
          <p className="text-orange-100 text-sm font-bold mt-3 tracking-wide">ร่วมเป็นพาร์ทเนอร์คนขับกับจงเจริญ และจัดการอู่รถของคุณได้สูงสุด 4 คัน</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            
            {/* ========================================== */}
            {/* คอลัมน์ซ้าย: ข้อมูลตัวรถ (Garage) */}
            {/* ========================================== */}
            <div className="space-y-8">
              
              <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                <div>
                  <h2 className="text-lg font-black text-gray-800">อู่รถของฉัน (Garage)</h2>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{vehicles.length} / 4 ยานพาหนะ</p>
                </div>
                {vehicles.length < 4 && (
                  <button type="button" onClick={addVehicle} className="bg-[#EE4D2D] text-white px-5 py-2.5 rounded-full text-xs font-black shadow-md active:scale-95 transition-all">
                    + เพิ่มรถคันใหม่
                  </button>
                )}
              </div>

              {vehicles.map((v, index) => (
                <div key={v.id} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 space-y-6 relative group transition-all hover:shadow-md">
                  <div className="flex justify-between items-center mb-2">
                    <span className="bg-gray-900 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase italic">ยานพาหนะที่ {index + 1}</span>
                    {vehicles.length > 1 && (
                      <button type="button" onClick={() => removeVehicle(v.id)} className="text-red-500 text-[10px] font-black hover:underline">✕ ลบออก</button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {['motorcycle', 'saleng', 'car', 'suv', 'van', 'pickup'].map((type) => (
                      <button key={type} type="button" onClick={() => updateVehicle(index, 'type', type)} className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center ${v.type === type ? 'border-[#EE4D2D] bg-orange-50 shadow-inner scale-105' : 'border-gray-50 opacity-60 hover:opacity-100'}`}>
                        <div className="text-xl mb-1">{getIcon(type)}</div>
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <InputField label="ยี่ห้อ (Brand)" placeholder="Honda, Toyota" value={v.brand} onChange={(e) => updateVehicle(index, 'brand', e.target.value)} />
                    <InputField label="รุ่น (Model)" placeholder="Wave, Yaris" value={v.model} onChange={(e) => updateVehicle(index, 'model', e.target.value)} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <InputField label="สีรถ (Color)" placeholder="แดง-ดำ, ขาว" value={v.color} onChange={(e) => updateVehicle(index, 'color', e.target.value)} />
                    <InputField label="ป้ายทะเบียน" placeholder="1กข 1234 ระยอง" value={v.registration} onChange={(e) => updateVehicle(index, 'registration', e.target.value)} highlight />
                  </div>

                  <div className="pt-4 border-t border-gray-50">
                    <p className="text-[10px] font-black text-gray-400 uppercase mb-4 tracking-widest text-center">อัปโหลดรูปรถคันที่ {index + 1}</p>
                    
                    {/* ย้ายป้ายภาษีมาไว้หมวดรถให้ตรงจุด */}
                    <div className="mb-3">
                      <UploadBox icon="📄" title="ป้ายภาษี / พ.ร.บ." desc="ต้องยังไม่หมดอายุและเห็นชัดเจน" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <UploadBox icon="🚘" title="หน้าตรง" />
                      <UploadBox icon="🚙" title="หลัง (ทะเบียน)" />
                      <UploadBox icon="🚗" title="ด้านซ้าย" />
                      <UploadBox icon="🚗" title="ด้านขวา" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ========================================== */}
            {/* 🌟 คอลัมน์ขวา: เอกสารคนขับ (ปรับปรุงใหม่ตามสั่ง) */}
            {/* ========================================== */}
            <div className="space-y-8 lg:sticky lg:top-8">
              
              <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 space-y-8">
                
                {/* 1. หมวดรูปถ่ายบุคคล (แยกโปรไฟล์ กับ KYC) */}
                <div>
                  <h2 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2 border-b border-gray-50 pb-4">
                    <span>👤</span> รูปถ่ายคนขับ
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    <UploadBox 
                      icon="📸" 
                      title="รูปโปรไฟล์ไรเดอร์" 
                      desc="หน้าตรง สุภาพ (แสดงให้ลูกค้าเห็นในแอป)" 
                      highlight 
                    />
                    <UploadBox 
                      icon="🤳" 
                      title="เซลฟี่คู่ใบขับขี่" 
                      desc="ถือบัตรไว้ใต้คาง (แอดมินตรวจสอบเท่านั้น)" 
                    />
                  </div>
                </div>

                {/* 2. หมวดใบขับขี่ (Dynamic Selection) */}
                <div>
                  <h2 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2 border-b border-gray-50 pb-4">
                    <span>🪪</span> เลือกและอัปโหลดใบขับขี่
                  </h2>
                  <p className="text-[10px] font-bold text-gray-400 mb-4">กดเลือกประเภทใบขับขี่ที่คุณมี (เลือกได้มากกว่า 1 ข้อ)</p>
                  
                  {/* ปุ่มกดเลือกประเภท */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                    <LicenseButton 
                      label="จักรยานยนต์" 
                      active={licenses.motorcycle} 
                      onClick={() => toggleLicense('motorcycle')} 
                    />
                    <LicenseButton 
                      label="รถยนต์ส่วนบุคคล" 
                      active={licenses.car} 
                      onClick={() => toggleLicense('car')} 
                    />
                    <LicenseButton 
                      label="ท.1 / ท.2 / ท.3" 
                      active={licenses.transport} 
                      onClick={() => toggleLicense('transport')} 
                    />
                  </div>

                  {/* 🌟 ช่องอัปโหลดที่จะโผล่มาตามการเลือก (Dynamic) */}
                  <div className="space-y-3">
                    {licenses.motorcycle && (
                      <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <UploadBox icon="🛵" title="รูปใบขับขี่จักรยานยนต์" desc="ถ่ายด้านหน้าให้เห็นข้อมูลและวันหมดอายุชัดเจน" horizontal />
                      </div>
                    )}
                    {licenses.car && (
                      <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <UploadBox icon="🚗" title="รูปใบขับขี่รถยนต์ส่วนบุคคล" desc="ถ่ายด้านหน้าให้เห็นข้อมูลและวันหมดอายุชัดเจน" horizontal />
                      </div>
                    )}
                    {licenses.transport && (
                      <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <UploadBox icon="🛻" title="รูปใบอนุญาต ท.1 / ท.2 / ท.3" desc="ถ่ายด้านหน้าให้เห็นข้อมูลและวันหมดอายุชัดเจน" horizontal />
                      </div>
                    )}
                    
                    {!licenses.motorcycle && !licenses.car && !licenses.transport && (
                      <div className="text-center py-6 border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50">
                        <p className="text-[10px] font-bold text-gray-400">กรุณาเลือกประเภทใบขับขี่ด้านบนก่อนค่ะ</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* ปุ่มกดยืนยัน */}
              <div className="bg-white p-8 rounded-[2.5rem] shadow-lg border border-orange-100 border-l-8 border-l-[#EE4D2D]">
                <div className="flex items-start gap-4 mb-6">
                  <input type="checkbox" checked={isAgreed} onChange={(e) => setIsAgreed(e.target.checked)} className="mt-1 w-6 h-6 accent-[#EE4D2D] shrink-0" />
                  <p className="text-[11px] text-gray-500 font-bold leading-relaxed">
                    ข้าพเจ้าขอยืนยันว่าข้อมูลยานพาหนะทั้ง {vehicles.length} คัน และเอกสารทั้งหมดเป็นความจริง และยินยอมให้ระบบตรวจสอบเพื่อความปลอดภัย
                  </p>
                </div>
                <button disabled={loading} className="w-full bg-[#EE4D2D] text-white py-5 rounded-[1.5rem] font-black shadow-xl active:scale-95 transition-all disabled:opacity-50 text-base uppercase tracking-tighter italic">
                  {loading ? 'Processing...' : 'Submit Application 🚀'}
                </button>
              </div>

            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Component ย่อย: ช่องกรอกข้อมูล ---
function InputField({ label, placeholder, value, onChange, highlight = false }: any) {
  return (
    <div>
      <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block tracking-widest">{label}</label>
      <input required placeholder={placeholder} value={value} onChange={onChange} className={`w-full p-4 rounded-xl bg-gray-50 border border-gray-100 text-sm font-bold outline-none focus:ring-2 focus:ring-[#EE4D2D] transition-all ${highlight ? 'text-[#EE4D2D] border-orange-100' : 'text-gray-800'}`} />
    </div>
  );
}

// --- Component ย่อย: ปุ่มเลือกใบขับขี่ ---
function LicenseButton({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`p-3 rounded-2xl border-2 transition-all flex items-center justify-center gap-2 ${active ? 'border-[#EE4D2D] bg-orange-50 shadow-sm' : 'border-gray-50 hover:bg-gray-50'}`}>
      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${active ? 'border-[#EE4D2D] bg-[#EE4D2D]' : 'border-gray-300'}`}>
         {active && <span className="text-[8px] text-white">✓</span>}
      </div>
      <div className={`text-[10px] font-black ${active ? 'text-[#EE4D2D]' : 'text-gray-600'}`}>{label}</div>
    </button>
  );
}

// --- Component ย่อย: ช่องอัปโหลดรูป (รองรับแบบแนวนอน) ---
function UploadBox({ icon, title, desc, highlight = false, horizontal = false }: any) {
  if (horizontal) {
    return (
      <div className={`border-2 border-dashed rounded-[1.5rem] p-4 text-left transition-all cursor-pointer group flex items-center gap-4 ${highlight ? 'border-[#0082FA] bg-blue-50/30' : 'border-gray-200 bg-gray-50/50 hover:bg-orange-50 hover:border-orange-200'}`}>
        <span className="text-3xl bg-white w-12 h-12 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform shrink-0">{icon}</span>
        <div>
          <p className={`text-xs font-black ${highlight ? 'text-[#0082FA]' : 'text-gray-800'}`}>{title}</p>
          {desc && <p className="text-[9px] font-bold text-gray-500 mt-0.5">{desc}</p>}
        </div>
        <input type="file" className="hidden" />
      </div>
    );
  }

  return (
    <div className={`border-2 border-dashed rounded-[1.5rem] p-5 text-center transition-all cursor-pointer group flex flex-col items-center justify-center gap-1 min-h-[140px] ${highlight ? 'border-[#0082FA] bg-blue-50/30 shadow-inner' : 'border-gray-100 bg-gray-50/50 hover:bg-orange-50 hover:border-orange-200 shadow-inner'}`}>
      <span className="text-4xl mb-2 group-hover:scale-110 transition-transform">{icon}</span>
      <p className={`text-[11px] font-black ${highlight ? 'text-[#0082FA]' : 'text-gray-700'}`}>{title}</p>
      {desc && <p className="text-[8px] font-bold text-gray-400">{desc}</p>}
      <input type="file" className="hidden" />
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
