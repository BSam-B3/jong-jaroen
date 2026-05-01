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

  const [formData, setFormData] = useState({
    display_name: '',
    first_name_th: '',
    last_name_th: '',
    first_name_en: '',
    last_name_en: '',
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
          phone: data.phone || '',
          address: data.address || ''
        });
      }
      setLoading(false);
    }
    loadProfile();
  }, [router, supabase]);

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
        alert('บันทึกสำเร็จ!');
        router.push('/profile/edit');
      }
    }
    setSaving(false);
  };

  if (loading) return <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center font-black text-[#EE4D2D] animate-pulse">กำลังโหลด...</div>;

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex justify-center font-sans pb-40"> {/* ✅ เพิ่ม pb-40 เพื่อกันปุ่มโดนทับ */}
      <div className="w-full sm:max-w-2xl md:max-w-3xl bg-[#F4F6F8] min-h-screen relative flex flex-col shadow-xl">
        
        {/* Header ส้มจงเจริญ */}
        <div className="bg-gradient-to-b from-[#EE4D2D] to-[#FF7337] rounded-[2.5rem] p-6 pt-10 pb-8 shadow-md m-3">
            <Link href="/profile/edit" className="text-white/80 font-bold text-sm mb-4 inline-block">← ย้อนกลับ</Link>
            <h1 className="text-white text-2xl font-black">แก้ไขข้อมูลส่วนตัว</h1>
        </div>

        <main className="px-5 space-y-4">
          {/* ส่วนรูปโปรไฟล์ & ชื่อแฝง */}
          <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col items-center gap-4">
             <div className="relative group">
                <div className="w-24 h-24 rounded-full bg-gray-100 border-4 border-white shadow-md overflow-hidden flex items-center justify-center text-4xl">👤</div>
                <Link href="/profile/edit/avatar" className="absolute bottom-0 right-0 bg-[#EE4D2D] text-white p-2 rounded-full shadow-lg text-xs">📷</Link>
             </div>
             <div className="w-full">
                <label className="text-[10px] font-bold text-gray-400 uppercase">ชื่อแฝง / ชื่อร้าน</label>
                <input value={formData.display_name} onChange={e => setFormData({...formData, display_name: e.target.value})} className="w-full bg-gray-50 border-0 rounded-xl px-4 py-3 mt-1 text-sm font-bold" placeholder="ชื่อที่จะโชว์ให้ลูกค้าเห็น" />
             </div>
          </section>

          {/* ส่วนชื่อจริง ไทย/Eng */}
          <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
            <h2 className="font-black text-gray-800 text-sm border-l-4 border-[#EE4D2D] pl-2">ข้อมูลตามบัตรประชาชน</h2>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-[10px] font-bold text-gray-400">ชื่อ (ไทย)</label>
                    <input value={formData.first_name_th} onChange={e => setFormData({...formData, first_name_th: e.target.value})} className="w-full bg-gray-50 border-0 rounded-xl px-4 py-3 text-sm" />
                </div>
                <div>
                    <label className="text-[10px] font-bold text-gray-400">นามสกุล (ไทย)</label>
                    <input value={formData.last_name_th} onChange={e => setFormData({...formData, last_name_th: e.target.value})} className="w-full bg-gray-50 border-0 rounded-xl px-4 py-3 text-sm" />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-[10px] font-bold text-gray-400">First Name (EN)</label>
                    <input value={formData.first_name_en} onChange={e => setFormData({...formData, first_name_en: e.target.value})} className="w-full bg-gray-50 border-0 rounded-xl px-4 py-3 text-sm" />
                </div>
                <div>
                    <label className="text-[10px] font-bold text-gray-400">Last Name (EN)</label>
                    <input value={formData.last_name_en} onChange={e => setFormData({...formData, last_name_en: e.target.value})} className="w-full bg-gray-50 border-0 rounded-xl px-4 py-3 text-sm" />
                </div>
            </div>
            <div className="bg-orange-50 p-3 rounded-xl">
                <p className="text-[10px] text-orange-700 font-bold">ชื่อเต็ม: {formData.first_name_th} {formData.last_name_th}</p>
                <p className="text-[10px] text-orange-700 font-bold uppercase">Full Name: {formData.first_name_en} {formData.last_name_en}</p>
            </div>
          </section>

          {/* ช่องทางติดต่อ */}
          <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
            <div>
                <label className="text-[10px] font-bold text-gray-400">เบอร์โทรศัพท์</label>
                <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-gray-50 border-0 rounded-xl px-4 py-3 text-sm" />
            </div>
            <div>
                <label className="text-[10px] font-bold text-gray-400">ที่อยู่ / พื้นที่รับงาน</label>
                <textarea value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full bg-gray-50 border-0 rounded-xl px-4 py-3 text-sm min-h-[100px]" placeholder="บ้านเลขที่, ถนน, ตำบล, อำเภอ..." />
            </div>
          </section>

          {/* ✅ ปุ่มบันทึก: ย้ายมาอยู่ใน Flow ปกติของหน้า ไม่ให้ Fixed ทับ Nav */}
          <div className="pt-4">
            <button 
                onClick={handleSave} 
                disabled={saving}
                className="w-full py-4 bg-gradient-to-r from-[#EE4D2D] to-[#FF7337] text-white rounded-2xl font-black shadow-lg shadow-orange-200 active:scale-95 transition-all"
            >
                {saving ? "กำลังบันทึก..." : "💾 บันทึกการเปลี่ยนแปลง"}
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
