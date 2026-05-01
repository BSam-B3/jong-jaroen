'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function BasicInfoEditPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [kycStatus, setKycStatus] = useState('none');

  // ฟอร์มข้อมูล
  const [formData, setFormData] = useState({
    display_name: '',
    full_name: '', // ชื่อไทย
    full_name_en: '', // ชื่ออังกฤษ (เพิ่มใหม่)
    phone: ''
  });

  useEffect(() => {
    async function loadProfile() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (data) {
        setFormData({
          display_name: data.display_name || '',
          full_name: data.full_name || '',
          full_name_en: data.full_name_en || '',
          phone: data.phone || ''
        });
        setKycStatus(data.kyc_status || 'none');
      }
      setLoading(false);
    }
    loadProfile();
  }, [router, supabase]);

  // ล็อกชื่อจริงถ้า KYC ผ่านแล้ว หรือกำลังรอตรวจ
  const isLegalNameLocked = kycStatus === 'approved' || kycStatus === 'pending';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      // 💡 อัปเดตข้อมูลลง Database
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: formData.display_name,
          full_name: formData.full_name,
          full_name_en: formData.full_name_en,
          phone: formData.phone
        })
        .eq('id', session.user.id);

      if (!error) {
        alert('บันทึกข้อมูลเรียบร้อยแล้วค่ะ!');
        router.push('/profile/edit');
      } else {
        alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        console.error(error);
      }
    }
    setSaving(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-[#EE4D2D] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex justify-center font-sans pb-10">
      <div className="w-full sm:max-w-2xl md:max-w-3xl bg-[#F4F6F8] min-h-screen relative flex flex-col shadow-xl overflow-x-hidden">
        
        {/* 🟠 Header ส้มจงเจริญ */}
        <div className="bg-gradient-to-b from-[#EE4D2D] to-[#FF7337] rounded-[2.5rem] p-6 pt-8 pb-8 shadow-md relative z-20 m-3 mt-4 flex items-center gap-4">
          <Link href="/profile/edit" className="w-11 h-11 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm shadow-inner border border-white/30 text-white text-xl active:scale-95 transition-transform shrink-0">
            ←
          </Link>
          <div className="flex flex-col text-white flex-1">
            <h1 className="text-xl font-black tracking-tight line-clamp-1">แก้ไขข้อมูลพื้นฐาน</h1>
            <p className="text-[11px] font-bold text-white/80 mt-0.5 tracking-wide">
              จัดการชื่อและช่องทางการติดต่อ
            </p>
          </div>
        </div>

        <main className="flex-1 relative z-10 space-y-6 mt-2 px-4 pb-24">
          
          {/* 🌟 Section 1: ชื่อแสดงผล (Display Name) */}
          <section className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-black text-gray-800 flex items-center gap-2">
                <span className="text-xl">🏷️</span> ชื่อแสดงผล (นามแฝง/ชื่อร้าน)
              </h2>
              <span className="text-[9px] bg-green-50 text-green-600 px-2 py-1 rounded-full font-bold border border-green-100">เปลี่ยนได้อิสระ</span>
            </div>
            
            <div className="space-y-1">
              <input 
                type="text" 
                name="display_name"
                value={formData.display_name}
                onChange={handleChange}
                placeholder="เช่น ช่างแอร์ในตำนาน, ลุงสมหมาย ขนย้าย"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 focus:outline-none focus:border-[#EE4D2D] focus:ring-1 focus:ring-[#EE4D2D] transition-colors"
              />
              <p className="text-[10px] text-gray-400 font-medium px-2">
                *ชื่อนี้จะแสดงให้ลูกค้าเห็น สามารถแก้ไขได้ 1 ครั้ง ในทุกๆ 30 วัน
              </p>
            </div>
          </section>

          {/* 🌟 Section 2: ข้อมูลตามบัตรประชาชน (Legal Name TH/EN) */}
          <section className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-black text-gray-800 flex items-center gap-2">
                <span className="text-xl">🪪</span> ชื่อ-นามสกุลจริง
              </h2>
              {isLegalNameLocked && (
                <span className="text-[9px] bg-gray-100 text-gray-500 px-2 py-1 rounded-full font-bold border border-gray-200 flex items-center gap-1">
                  🔒 ล็อกข้อมูลแล้ว
                </span>
              )}
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 px-1">ชื่อ-นามสกุล (ภาษาไทย)</label>
                <input 
                  type="text" 
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  disabled={isLegalNameLocked}
                  placeholder="เช่น นาย สมชาย ใจดี"
                  className={`w-full border rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                    isLegalNameLocked 
                      ? "bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed" 
                      : "bg-gray-50 border-gray-200 text-gray-800 focus:outline-none focus:border-[#EE4D2D]"
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 px-1">ชื่อ-นามสกุล (ภาษาอังกฤษ)</label>
                <input 
                  type="text" 
                  name="full_name_en"
                  value={formData.full_name_en}
                  onChange={handleChange}
                  disabled={isLegalNameLocked}
                  placeholder="เช่น Somchai Jaidee"
                  className={`w-full border rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                    isLegalNameLocked 
                      ? "bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed" 
                      : "bg-gray-50 border-gray-200 text-gray-800 focus:outline-none focus:border-[#EE4D2D]"
                  }`}
                />
              </div>

              {/* ปุ่มขอแก้ไขข้อมูลหากถูกล็อก */}
              {isLegalNameLocked && (
                <div className="bg-orange-50/50 border border-orange-100 rounded-xl p-3 flex items-center justify-between mt-2">
                  <p className="text-[10px] text-orange-800 font-medium leading-tight pr-4">
                    ข้อมูลของคุณได้รับการยืนยันแล้ว หากมีการเปลี่ยนชื่อตามกฎหมาย กรุณาส่งคำร้อง
                  </p>
                  <button className="shrink-0 bg-white border border-orange-200 text-[#EE4D2D] text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-sm hover:bg-orange-50 active:scale-95 transition-all">
                    ขอเปลี่ยนชื่อ
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* 🌟 Section 3: ข้อมูลติดต่อ */}
          <section className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-gray-100">
            <h2 className="text-sm font-black text-gray-800 flex items-center gap-2 mb-4">
              <span className="text-xl">📱</span> เบอร์โทรศัพท์
            </h2>
            
            <input 
              type="tel" 
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="08X-XXX-XXXX"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 focus:outline-none focus:border-[#EE4D2D] focus:ring-1 focus:ring-[#EE4D2D] transition-colors"
            />
          </section>

        </main>

        {/* 🌟 แถบปุ่มบันทึก ด้านล่างสุด */}
        <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
          <div className="w-full sm:max-w-2xl md:max-w-3xl bg-white border-t border-gray-100 p-4 pb-8 pointer-events-auto shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
            <button 
              onClick={handleSave}
              disabled={saving}
              className={`w-full py-3.5 rounded-xl text-white font-black text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 ${
                saving ? "bg-gray-400 cursor-not-allowed" : "bg-gradient-to-r from-[#EE4D2D] to-[#FF7337] hover:shadow-lg"
              }`}
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  กำลังบันทึก...
                </>
              ) : (
                <>💾 บันทึกการเปลี่ยนแปลง</>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
