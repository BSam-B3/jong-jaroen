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

  const [formData, setFormData] = useState({
    display_name: '',
    first_name_th: '',
    last_name_th: '',
    first_name_en: '',
    last_name_en: '',
    id_card_number: '', // เพิ่มเลขบัตร
    birth_date: '',     // เพิ่มวันเกิด
    phone: '',
    address: ''
  });

  useEffect(() => {
    async function loadProfile() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push('/auth/login');

      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      if (data) {
        setFormData({
          display_name: data.display_name || '',
          first_name_th: data.first_name_th || '',
          last_name_th: data.last_name_th || '',
          first_name_en: data.first_name_en || '',
          last_name_en: data.last_name_en || '',
          id_card_number: data.id_card_number || '',
          birth_date: data.birth_date || '',
          phone: data.phone || '',
          address: data.address || ''
        });
        setKycStatus(data.kyc_status || 'none');
      }
      setLoading(false);
    }
    loadProfile();
  }, [router, supabase]);

  // 🔒 ล็อกข้อมูลตามบัตรประชาชน หาก KYC ผ่านแล้ว หรือกำลังรอตรวจ
  const isLegalDataLocked = kycStatus === 'approved' || kycStatus === 'pending';

  const handleSave = async () => {
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const full_name = `${formData.first_name_th} ${formData.last_name_th}`.trim();
      const full_name_en = `${formData.first_name_en} ${formData.last_name_en}`.trim();

      const { error } = await supabase.from('profiles').update({
        ...formData,
        full_name,
        full_name_en
      }).eq('id', session.user.id);

      if (!error) {
        alert('บันทึกข้อมูลเรียบร้อยแล้วค่ะ!');
        router.push('/profile/edit');
      } else {
        alert('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
      }
    }
    setSaving(false);
  };

  if (loading) return <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center font-black text-[#EE4D2D] animate-pulse">กำลังโหลด...</div>;

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex justify-center font-sans pb-40">
      <div className="w-full sm:max-w-2xl md:max-w-3xl bg-[#F4F6F8] min-h-screen relative flex flex-col shadow-xl">
        
        {/* Header ส้มจงเจริญ */}
        <div className="bg-gradient-to-b from-[#EE4D2D] to-[#FF7337] rounded-[2.5rem] p-6 pt-10 pb-8 shadow-md m-3">
            <Link href="/profile/edit" className="text-white/80 font-bold text-sm mb-4 inline-block">← ย้อนกลับ</Link>
            <h1 className="text-white text-2xl font-black">แก้ไขข้อมูลส่วนตัว</h1>
        </div>

        <main className="px-5 space-y-4">
          
          {/* 🌟 ส่วนรูปโปรไฟล์ & ชื่อแฝง (เปลี่ยนอิสระ) */}
          <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col items-center gap-4">
             <div className="relative group">
                <div className="w-24 h-24 rounded-full bg-gray-100 border-4 border-white shadow-md overflow-hidden flex items-center justify-center text-4xl">👤</div>
                <Link href="/profile/edit/avatar" className="absolute bottom-0 right-0 bg-[#EE4D2D] text-white p-2 rounded-full shadow-lg text-xs">📷</Link>
             </div>
             <div className="w-full">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">ชื่อแฝง / ชื่อร้าน</label>
                  <span className="text-[9px] bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-bold">เปลี่ยนได้</span>
                </div>
                <input 
                  value={formData.display_name} 
                  onChange={e => setFormData({...formData, display_name: e.target.value})} 
                  className="w-full bg-gray-50 border-0 rounded-xl px-4 py-3 mt-1 text-sm font-bold focus:ring-1 focus:ring-[#EE4D2D] outline-none" 
                  placeholder="ชื่อที่จะโชว์ให้ลูกค้าเห็น" 
                />
             </div>
          </section>

          {/* 🌟 ส่วนข้อมูลตามบัตรประชาชน (ล็อกเมื่อ KYC ผ่าน/รอตรวจ) */}
          <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
            <div className="flex items-center justify-between border-l-4 border-[#EE4D2D] pl-2">
              <h2 className="font-black text-gray-800 text-sm">ข้อมูลตามบัตรประชาชน</h2>
              {isLegalDataLocked && (
                <span className="text-[9px] bg-gray-100 text-gray-500 px-2 py-1 rounded-full font-bold flex items-center gap-1">🔒 ล็อกข้อมูลแล้ว</span>
              )}
            </div>
            
            {/* เลขบัตรประชาชน & วันเกิด */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-[10px] font-bold text-gray-400">เลขประจำตัวประชาชน</label>
                    <input 
                      type="text"
                      maxLength={13}
                      disabled={isLegalDataLocked}
                      value={formData.id_card_number} 
                      onChange={e => setFormData({...formData, id_card_number: e.target.value})} 
                      className={`w-full border-0 rounded-xl px-4 py-3 text-sm mt-1 outline-none ${isLegalDataLocked ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-50 focus:ring-1 focus:ring-[#EE4D2D]'}`} 
                      placeholder="1XXXXXXXXXXXX"
                    />
                </div>
                <div>
                    <label className="text-[10px] font-bold text-gray-400">วัน/เดือน/ปีเกิด</label>
                    <input 
                      type="date"
                      disabled={isLegalDataLocked}
                      value={formData.birth_date} 
                      onChange={e => setFormData({...formData, birth_date: e.target.value})} 
                      className={`w-full border-0 rounded-xl px-4 py-3 text-sm mt-1 outline-none ${isLegalDataLocked ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-50 focus:ring-1 focus:ring-[#EE4D2D]'}`} 
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-[10px] font-bold text-gray-400">ชื่อ (ไทย)</label>
                    <input disabled={isLegalDataLocked} value={formData.first_name_th} onChange={e => setFormData({...formData, first_name_th: e.target.value})} className={`w-full border-0 rounded-xl px-4 py-3 text-sm mt-1 outline-none ${isLegalDataLocked ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-50 focus:ring-1 focus:ring-[#EE4D2D]'}`} />
                </div>
                <div>
                    <label className="text-[10px] font-bold text-gray-400">นามสกุล (ไทย)</label>
                    <input disabled={isLegalDataLocked} value={formData.last_name_th} onChange={e => setFormData({...formData, last_name_th: e.target.value})} className={`w-full border-0 rounded-xl px-4 py-3 text-sm mt-1 outline-none ${isLegalDataLocked ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-50 focus:ring-1 focus:ring-[#EE4D2D]'}`} />
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-[10px] font-bold text-gray-400">First Name (EN)</label>
                    <input disabled={isLegalDataLocked} value={formData.first_name_en} onChange={e => setFormData({...formData, first_name_en: e.target.value})} className={`w-full border-0 rounded-xl px-4 py-3 text-sm mt-1 outline-none ${isLegalDataLocked ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-50 focus:ring-1 focus:ring-[#EE4D2D]'}`} />
                </div>
                <div>
                    <label className="text-[10px] font-bold text-gray-400">Last Name (EN)</label>
                    <input disabled={isLegalDataLocked} value={formData.last_name_en} onChange={e => setFormData({...formData, last_name_en: e.target.value})} className={`w-full border-0 rounded-xl px-4 py-3 text-sm mt-1 outline-none ${isLegalDataLocked ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-50 focus:ring-1 focus:ring-[#EE4D2D]'}`} />
                </div>
            </div>

            {/* แสดงข้อความแจ้งเตือนถ้าถูกล็อก */}
            {isLegalDataLocked && (
              <div className="bg-orange-50/50 border border-orange-100 rounded-xl p-3 flex items-center justify-between mt-2">
                <p className="text-[10px] text-orange-800 font-medium leading-tight pr-4">
                  ข้อมูลบัตรประชาชนถูกยืนยันแล้ว หากมีเปลี่ยนแปลง กรุณาส่งคำร้อง
                </p>
                <button className="shrink-0 bg-white border border-orange-200 text-[#EE4D2D] text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-sm hover:bg-orange-50 active:scale-95 transition-all">
                  ขอแก้ไข
                </button>
              </div>
            )}
          </section>

          {/* 🌟 ส่วนช่องทางติดต่อ (เปลี่ยนอิสระ) */}
          <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
            <div>
                <label className="text-[10px] font-bold text-gray-400">เบอร์โทรศัพท์</label>
                <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-gray-50 border-0 rounded-xl px-4 py-3 mt-1 text-sm outline-none focus:ring-1 focus:ring-[#EE4D2D]" />
            </div>
            <div>
                <label className="text-[10px] font-bold text-gray-400">ที่อยู่ / พื้นที่รับงาน</label>
                <textarea value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full bg-gray-50 border-0 rounded-xl px-4 py-3 mt-1 text-sm min-h-[100px] outline-none focus:ring-1 focus:ring-[#EE4D2D]" placeholder="บ้านเลขที่, ถนน, ตำบล, อำเภอ..." />
            </div>
          </section>

          {/* ปุ่มบันทึก */}
          <div className="pt-4">
            <button 
                onClick={handleSave} 
                disabled={saving}
                className="w-full py-4 bg-gradient-to-r from-[#EE4D2D] to-[#FF7337] text-white rounded-2xl font-black shadow-lg shadow-orange-200 active:scale-95 transition-all flex justify-center items-center gap-2"
            >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : "💾 บันทึกการเปลี่ยนแปลง"}
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
