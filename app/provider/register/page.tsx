'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import ImageUpload from '@/app/components/ImageUpload'; 

interface Vehicle {
  id: number;
  type: string;
  brand: string;
  model: string;
  color: string;
  registration: string;
  photos: {
    tax: File | null;
    front: File | null;
    back: File | null;
    left: File | null;
    right: File | null;
  };
}

const VEHICLE_TYPES = [
  { id: 'motorcycle', label: 'มอเตอร์ไซค์', icon: '🛵' },
  { id: 'saleng', label: 'ซาเล้ง', icon: '🛺' },
  { id: 'car', label: 'รถเก๋ง', icon: '🚗' },
  { id: 'suv', label: '7 ที่นั่ง', icon: '🚙' },
  { id: 'van', label: 'รถตู้', icon: '🚐' },
  { id: 'pickup', label: 'กระบะ', icon: '🛻' }
];

export default function RiderRegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAgreed, setIsAgreed] = useState(false);

  // --- Driver Docs & Licenses ---
  const [licenses, setLicenses] = useState({ motorcycle: false, car: false, transport: false });
  const [driverDocs, setDriverDocs] = useState({
    profile_photo: null as File | null,
    selfie_license: null as File | null,
    license_moto: null as File | null,
    license_car: null as File | null,
    license_transport: null as File | null,
  });

  const [vehicles, setVehicles] = useState<Vehicle[]>([
    { 
      id: Date.now(), type: 'motorcycle', brand: '', model: '', color: '', registration: '',
      photos: { tax: null, front: null, back: null, left: null, right: null }
    }
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
    if (vehicles.length >= 4) return alert('สูงสุด 4 คันค่ะ');
    setVehicles([...vehicles, { id: Date.now(), type: 'car', brand: '', model: '', color: '', registration: '', photos: { tax: null, front: null, back: null, left: null, right: null } }]);
  };

  const updateVehicle = (index: number, field: keyof Vehicle, value: any) => {
    const updated = [...vehicles];
    updated[index] = { ...updated[index], [field]: value };
    setVehicles(updated);
  };

  const updateVehiclePhoto = (index: number, side: keyof Vehicle['photos'], file: File | null) => {
    const updated = [...vehicles];
    updated[index].photos[side] = file;
    setVehicles(updated);
  };

  // 🌟 ฟังก์ชันอัปโหลดไฟล์จริง
  const uploadFile = async (file: File | null, bucket: string, pathPrefix: string) => {
    if (!file || !user) return null;
    const fileName = `${user.id}/${pathPrefix}_${Date.now()}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from(bucket).upload(fileName, file);
    if (error) throw error;
    const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAgreed) return alert('กรุณายอมรับเงื่อนไขค่ะ');
    setLoading(true);

    try {
      // 1. อัปโหลดรูปคนขับ (KYC)
      const profileUrl = await uploadFile(driverDocs.profile_photo, 'kyc-documents', 'avatar');
      const selfieUrl = await uploadFile(driverDocs.selfie_license, 'kyc-documents', 'selfie');
      const motoLicUrl = licenses.motorcycle ? await uploadFile(driverDocs.license_moto, 'kyc-documents', 'lic_moto') : null;
      const carLicUrl = licenses.car ? await uploadFile(driverDocs.license_car, 'kyc-documents', 'lic_car') : null;

      // 2. อัปเดตตาราง profiles
      await supabase.from('profiles').update({
        is_rider: true,
        rider_status: 'pending',
        avatar_url: profileUrl,
        liveness_photo_url: selfieUrl,
        moto_license_url: motoLicUrl,
        car_license_url: carLicUrl
      }).eq('id', user.id);

      // 3. วนลูปอัปโหลดรูปรถทุกคัน
      for (const v of vehicles) {
        const taxUrl = await uploadFile(v.photos.tax, 'vehicle-photos', `tax_${v.id}`);
        const fUrl = await uploadFile(v.photos.front, 'vehicle-photos', `front_${v.id}`);
        const bUrl = await uploadFile(v.photos.back, 'vehicle-photos', `back_${v.id}`);
        const lUrl = await uploadFile(v.photos.left, 'vehicle-photos', `left_${v.id}`);
        const rUrl = await uploadFile(v.photos.right, 'vehicle-photos', `right_${v.id}`);

        await supabase.from('rider_vehicles').insert({
          rider_id: user.id,
          vehicle_type: v.type,
          brand: v.brand,
          model: v.model,
          color: v.color,
          registration: v.registration,
          tax_act_url: taxUrl,
          front_photo_url: fUrl,
          back_photo_url: bUrl,
          left_photo_url: lUrl,
          right_photo_url: rUrl
        });
      }

      alert('ลงทะเบียนเรียบร้อย! 🚀 รอแอดมินตรวจสอบอู่รถของคุณนะคะ');
      router.push('/profile');
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
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
          <Link href="/profile" className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl mb-8 shadow-inner hover:bg-white/30 transition-all">←</Link>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tighter italic uppercase">Rider <span className="text-white not-italic">Registration</span></h1>
          <p className="text-orange-100 text-sm font-bold mt-3 tracking-wide">จัดการอู่รถได้สูงสุด 4 คัน และอัปโหลดเอกสารสำคัญเพื่อรับงาน</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* คอลัมน์ซ้าย: อู่รถ (Garage) */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                <h2 className="text-lg font-black text-gray-800">อู่รถของฉัน (Garage)</h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">ทะเบียนรถ {vehicles.length} / 4 คัน</p>
              </div>

              {vehicles.map((v, index) => (
                <div key={v.id} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="bg-gray-900 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase italic">คันที่ {index + 1}</span>
                    {vehicles.length > 1 && <button type="button" onClick={() => setVehicles(vehicles.filter(item => item.id !== v.id))} className="text-red-500 text-[10px] font-black">✕ ลบ</button>}
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {VEHICLE_TYPES.map((vType) => (
                      <button key={vType.id} type="button" onClick={() => updateVehicle(index, 'type', vType.id)} className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${v.type === vType.id ? 'border-[#EE4D2D] bg-orange-50' : 'border-gray-50 opacity-60'}`}>
                        <div className="text-2xl">{vType.icon}</div>
                        <div className={`text-[9px] font-black ${v.type === vType.id ? 'text-[#EE4D2D]' : 'text-gray-500'}`}>{vType.label}</div>
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <InputField label="ยี่ห้อ (Brand)" placeholder="Honda" value={v.brand} onChange={(e: any) => updateVehicle(index, 'brand', e.target.value)} />
                    <InputField label="รุ่น (Model)" placeholder="Wave 110i" value={v.model} onChange={(e: any) => updateVehicle(index, 'model', e.target.value)} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <InputField label="สีรถ" placeholder="แดง-ดำ" value={v.color} onChange={(e: any) => updateVehicle(index, 'color', e.target.value)} />
                    <InputField label="ป้ายทะเบียน" placeholder="1กข 1234 ระยอง" value={v.registration} onChange={(e: any) => updateVehicle(index, 'registration', e.target.value)} highlight />
                  </div>

                  <div className="pt-4 border-t border-gray-50 space-y-4">
                    <ImageUpload label="📄 ป้ายภาษี / พ.ร.บ." value={v.photos.tax} onChange={(f) => updateVehiclePhoto(index, 'tax', f)} />
                    <div className="grid grid-cols-2 gap-3">
                      <ImageUpload label="📸 หน้า" value={v.photos.front} onChange={(f) => updateVehiclePhoto(index, 'front', f)} />
                      <ImageUpload label="📸 หลัง (ทะเบียน)" value={v.photos.back} onChange={(f) => updateVehiclePhoto(index, 'back', f)} />
                      <ImageUpload label="📸 ซ้าย" value={v.photos.left} onChange={(f) => updateVehiclePhoto(index, 'left', f)} />
                      <ImageUpload label="📸 ขวา" value={v.photos.right} onChange={(f) => updateVehiclePhoto(index, 'right', f)} />
                    </div>
                  </div>
                </div>
              ))}

              {vehicles.length < 4 && (
                <button type="button" onClick={addVehicle} className="w-full border-2 border-dashed border-[#EE4D2D] bg-orange-50/50 text-[#EE4D2D] py-6 rounded-[2.5rem] font-black active:scale-95 transition-all">+ เพิ่มรถลงทะเบียน</button>
              )}
            </div>

            {/* คอลัมน์ขวา: เอกสารคนขับ */}
            <div className="space-y-8 lg:sticky lg:top-8">
              <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 space-y-8">
                <div>
                  <h2 className="text-lg font-black text-gray-800 mb-4 border-b border-gray-50 pb-4">👤 ข้อมูลคนขับ</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <ImageUpload label="📸 รูปโปรไฟล์" hint="แสดงให้ลูกค้าเห็น" value={driverDocs.profile_photo} onChange={(f) => setDriverDocs({...driverDocs, profile_photo: f})} className="border-blue-300 bg-blue-50/50" />
                    <ImageUpload label="🤳 เซลฟี่คู่ใบขับขี่" hint="ถือบัตรใต้คาง" value={driverDocs.selfie_license} onChange={(f) => setDriverDocs({...driverDocs, selfie_license: f})} />
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-black text-gray-800 mb-4 border-b border-gray-50 pb-4">🪪 ประเภทใบขับขี่</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
                    <LicenseButton label="จักรยานยนต์" active={licenses.motorcycle} onClick={() => setLicenses({...licenses, motorcycle: !licenses.motorcycle})} />
                    <LicenseButton label="รถยนต์" active={licenses.car} onClick={() => setLicenses({...licenses, car: !licenses.car})} />
                    <LicenseButton label="ท.1-ท.3" active={licenses.transport} onClick={() => setLicenses({...licenses, transport: !licenses.transport})} />
                  </div>
                  <div className="space-y-3">
                    {licenses.motorcycle && <ImageUpload label="🛵 ใบขับขี่จักรยานยนต์" value={driverDocs.license_moto} onChange={(f) => setDriverDocs({...driverDocs, license_moto: f})} />}
                    {licenses.car && <ImageUpload label="🚗 ใบขับขี่รถยนต์" value={driverDocs.license_car} onChange={(f) => setDriverDocs({...driverDocs, license_car: f})} />}
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] shadow-lg border border-l-8 border-l-[#EE4D2D]">
                <div className="flex items-start gap-4 mb-6">
                  <input type="checkbox" checked={isAgreed} onChange={(e: any) => setIsAgreed(e.target.checked)} className="mt-1 w-6 h-6 accent-[#EE4D2D]" />
                  <p className="text-[11px] text-gray-500 font-bold leading-relaxed">ยืนยันข้อมูลเป็นความจริง และยินยอมให้ระบบตรวจสอบเพื่อความปลอดภัย</p>
                </div>
                <button disabled={loading} className="w-full bg-[#EE4D2D] text-white py-5 rounded-[1.5rem] font-black shadow-xl active:scale-95 transition-all disabled:opacity-50 uppercase italic">
                  {loading ? 'Processing Uploads...' : 'Submit Application 🚀'}
                </button>
              </div>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
}

function InputField({ label, placeholder, value, onChange, highlight = false }: any) {
  return (
    <div>
      <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block tracking-widest">{label}</label>
      <input required placeholder={placeholder} value={value} onChange={onChange} className={`w-full p-4 rounded-xl bg-gray-50 border border-gray-100 text-sm font-bold outline-none focus:ring-2 focus:ring-[#EE4D2D] transition-all ${highlight ? 'text-[#EE4D2D] border-orange-100' : 'text-gray-800'}`} />
    </div>
  );
}

function LicenseButton({ label, active, onClick }: any) {
  return (
    <button type="button" onClick={onClick} className={`p-3 rounded-2xl border-2 transition-all flex items-center justify-center gap-2 ${active ? 'border-[#EE4D2D] bg-orange-50' : 'border-gray-50'}`}>
      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${active ? 'bg-[#EE4D2D] border-[#EE4D2D]' : 'border-gray-300'}`}>{active && <span className="text-[8px] text-white">✓</span>}</div>
      <div className={`text-[10px] font-black ${active ? 'text-[#EE4D2D]' : 'text-gray-600'}`}>{label}</div>
    </button>
  );
}
