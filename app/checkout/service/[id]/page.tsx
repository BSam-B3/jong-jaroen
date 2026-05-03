'use client';
import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function CheckoutServicePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  const [service, setService] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // States สำหรับการกรอกข้อมูล
  const [selectedPkgKey, setSelectedPkgKey] = useState<string>(searchParams.get('package') || 'basic');
  const [requirements, setRequirements] = useState('');
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipPreview, setSlipPreview] = useState<string | null>(null);

  useEffect(() => {
    const initData = async () => {
      // ดึง User
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login?next=/services');
        return;
      }
      setUser(session.user);

      // ดึงข้อมูล Service
      const { data, error } = await supabase
        .from('provider_services')
        .select('*, profiles(full_name)')
        .eq('id', params.id as string)
        .single();
      
      if (!error && data) setService(data);
      setLoading(false);
    };
    initData();
  }, [params.id, router, supabase]);

  const handleSlipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSlipFile(file);
      setSlipPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slipFile) return alert('กรุณาแนบสลิปโอนเงินก่อนยืนยันค่ะ');
    if (!service) return;

    setSubmitting(true);
    try {
      // 1. อัปโหลดสลิป
      const fileExt = slipFile.name.split('.').pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('payment-slips')
        .upload(fileName, slipFile);

      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('payment-slips').getPublicUrl(uploadData.path);

      // 2. บันทึกคำสั่งซื้อลงตาราง service_orders
      const activePackage = service.packages[selectedPkgKey];
      const { error: insertError } = await supabase.from('service_orders').insert({
        buyer_id: user.id,
        provider_id: service.provider_id,
        service_id: service.id,
        package_key: selectedPkgKey,
        package_name: activePackage.name,
        price: Number(activePackage.price),
        requirements: requirements,
        slip_url: publicUrl,
        status: 'pending_acceptance'
      });

      if (insertError) throw insertError;

      alert('สั่งซื้อสำเร็จ! รอช่างยืนยันรับงานนะคะ 🚀');
      router.push('/orders'); // เปลี่ยนไปหน้าจัดการออเดอร์ของลูกค้า (ถ้ามี)

    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-20 text-center font-bold text-gray-500">กำลังเตรียมบิลสั่งซื้อ...</div>;
  if (!service) return <div className="p-20 text-center font-bold">ไม่พบข้อมูลบริการนี้ค่ะ</div>;

  const activePackage = service.packages?.[selectedPkgKey] || service.packages?.['basic'];
  const price = Number(activePackage?.price || service.price_start);

  return (
    <div className="min-h-screen bg-[#F4F6F8] pb-24 font-sans flex justify-center selection:bg-orange-200">
      <div className="w-full sm:max-w-2xl bg-white min-h-screen shadow-xl relative flex flex-col">
        
        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-40 flex items-center gap-3">
          <button onClick={() => router.back()} className="text-2xl text-gray-400 hover:text-[#EE4D2D]">←</button>
          <h1 className="text-[17px] font-black text-gray-900">ยืนยันการจ้างงาน</h1>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          
          {/* ข้อมูลบริการ */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex gap-4 items-center">
            <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden shrink-0">
              {service.cover_image_url && <img src={service.cover_image_url} alt="Cover" className="w-full h-full object-cover" />}
            </div>
            <div>
              <h2 className="text-sm font-black text-gray-800 line-clamp-1">{service.title}</h2>
              <p className="text-xs font-bold text-gray-500 mt-1">โดย: {service.profiles?.full_name}</p>
            </div>
          </div>

          {/* เลือกแพ็กเกจ */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">เลือกแพ็กเกจ</h3>
            <div className="space-y-2">
              {Object.entries(service.packages || {}).map(([key, pkg]: any) => (
                <label key={key} className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedPkgKey === key ? 'border-[#EE4D2D] bg-orange-50' : 'border-gray-50 hover:bg-gray-50'}`}>
                  <div className="flex items-center gap-3">
                    <input type="radio" name="package" checked={selectedPkgKey === key} onChange={() => setSelectedPkgKey(key)} className="w-4 h-4 text-[#EE4D2D] focus:ring-[#EE4D2D]" />
                    <div>
                      <p className="text-sm font-black text-gray-900">{pkg.name}</p>
                      <p className="text-[10px] font-bold text-gray-500">ส่งงานใน {pkg.delivery} วัน</p>
                    </div>
                  </div>
                  <span className="font-black text-[#EE4D2D] text-sm">{Number(pkg.price).toLocaleString()} บาท</span>
                </label>
              ))}
            </div>
          </div>

          {/* บรีฟงาน */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">รายละเอียดที่ต้องการ (บรีฟงาน)</h3>
            <textarea 
              rows={3} required
              placeholder="ระบุสิ่งที่ต้องการให้ช่างทำ หรือรายละเอียดสำคัญ..."
              value={requirements} onChange={e => setRequirements(e.target.value)}
              className="w-full p-4 bg-gray-50 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#EE4D2D]"
            />
          </div>

          {/* อัปโหลดสลิป */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">หลักฐานการโอนเงิน (ระบบกองกลาง)</h3>
            
            <div className="bg-blue-50 p-4 rounded-xl mb-4 border border-blue-100">
              <p className="text-xs font-black text-blue-900 mb-1">🏦 บัญชีกองกลาง "จงเจริญ"</p>
              <p className="text-sm font-black text-blue-700 font-mono tracking-widest">123-4-56789-0</p>
              <p className="text-[10px] text-blue-600 mt-1 font-bold">ยอดเงินจะถูกเก็บไว้ปลอดภัย และโอนให้ช่างเมื่อส่งงานสำเร็จ</p>
            </div>

            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 cursor-pointer hover:bg-orange-50 transition-colors">
              {slipPreview ? (
                <img src={slipPreview} alt="Slip Preview" className="max-h-40 rounded-lg shadow-sm" />
              ) : (
                <>
                  <span className="text-3xl mb-2">📸</span>
                  <span className="text-xs font-bold text-gray-500">แตะเพื่ออัปโหลดสลิปโอนเงิน</span>
                </>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handleSlipChange} />
            </label>
          </div>

          {/* ปุ่มยืนยัน (Floating) */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-gray-100 sm:max-w-2xl sm:mx-auto z-50">
            <div className="flex items-center justify-between mb-3 px-2">
              <span className="text-xs font-bold text-gray-500">ยอดรวมทั้งสิ้น</span>
              <span className="text-2xl font-black text-[#EE4D2D]">{price.toLocaleString()} บาท</span>
            </div>
            <button 
              type="submit" disabled={submitting}
              className="w-full py-4 bg-[#EE4D2D] text-white rounded-xl font-black text-sm active:scale-95 transition-all shadow-lg shadow-orange-200 disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {submitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'ยืนยันการจ้างงาน 🚀'}
            </button>
          </div>
          
          <div className="h-20"></div> {/* Spacer สำหรับปุ่มด้านล่าง */}
        </form>
      </div>
    </div>
  );
}
