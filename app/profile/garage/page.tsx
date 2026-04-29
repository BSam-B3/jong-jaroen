'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ImageUpload from '@/app/components/ImageUpload';

export default function MyGaragePage() {
  const supabase = createClient();
  const router = useRouter();
  
  const [user, setUser] = useState<any>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // ดึงข้อมูล User และรถในอู่ทั้งหมด
  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push('/auth/login');
      setUser(session.user);

      const { data } = await supabase
        .from('rider_vehicles')
        .select('*')
        .eq('rider_id', session.user.id)
        .order('created_at', { ascending: true });

      if (data) setVehicles(data);
      setLoading(false);
    };
    fetchData();
  }, [supabase, router]);

  // ฟังก์ชันอัปเดตสถานะเป็น Pending เมื่อมีการแก้ไข
  const handleUpdateVehicle = async (vId: string, updatedData: any) => {
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('rider_vehicles')
        .update({
          ...updatedData,
          status: 'pending' // 🌟 บังคับกลับไปรออนุมัติทุกครั้งที่แก้
        })
        .eq('id', vId);

      if (error) throw error;
      alert('บันทึกการแก้ไขแล้ว! รอแอดมินตรวจสอบอีกครั้งนะคะ ✅');
      window.location.reload();
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-10 text-center font-bold">กำลังเปิดอู่รถ... 🛠️</div>;

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex justify-center font-sans pb-20">
      <div className="w-full max-w-4xl px-4 py-8">
        
        <header className="flex justify-between items-end mb-8 px-2">
          <div>
            <Link href="/profile" className="text-[#EE4D2D] font-black text-xs mb-2 inline-block">← กลับไปหน้าโปรไฟล์</Link>
            <h1 className="text-3xl font-black text-gray-900 italic">MY <span className="text-[#EE4D2D] not-italic">GARAGE</span></h1>
            <p className="text-xs text-gray-400 font-bold mt-1 uppercase tracking-widest">จัดการยานพาหนะของคุณ</p>
          </div>
          {vehicles.length < 4 && (
            <Link href="/provider/register" className="bg-gray-900 text-white px-6 py-3 rounded-2xl text-xs font-black shadow-lg hover:scale-105 transition-transform">
              + เพิ่มรถใหม่
            </Link>
          )}
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {vehicles.map((v, index) => (
            <div key={v.id} className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <span className="bg-gray-100 text-gray-600 text-[10px] font-black px-3 py-1 rounded-full uppercase italic">คันที่ {index + 1}</span>
                  <StatusBadge status={v.status} />
                </div>
              </div>

              {/* แสดงข้อมูลรถปัจจุบัน */}
              <div className="space-y-4 flex-1">
                <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <span className="text-4xl">
                    {v.vehicle_type === 'motorcycle' ? '🛵' : v.vehicle_type === 'car' ? '🚗' : '🛻'}
                  </span>
                  <div>
                    <p className="text-sm font-black text-gray-800">{v.brand} {v.model}</p>
                    <p className="text-[11px] text-[#EE4D2D] font-black uppercase tracking-wider">{v.registration}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden relative border border-gray-50">
                    {v.front_photo_url ? (
                      <img src={v.front_photo_url} className="w-full h-full object-cover" alt="ด้านหน้า" />
                    ) : <div className="flex items-center justify-center h-full text-[10px] text-gray-400 font-bold italic">ไม่มีรูปภาพ</div>}
                  </div>
                  <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden relative border border-gray-50">
                    {v.back_photo_url ? (
                      <img src={v.back_photo_url} className="w-full h-full object-cover" alt="ด้านหลัง" />
                    ) : <div className="flex items-center justify-center h-full text-[10px] text-gray-400 font-bold italic">ไม่มีรูปภาพ</div>}
                  </div>
                </div>
              </div>

              {/* ปุ่มแก้ไขข้อมูล */}
              <button 
                onClick={() => alert('ฟีเจอร์แก้ไขข้อมูลกำลังพัฒนาค่ะ บีสามลองกดเพิ่มรถใหม่ไปก่อนนะคะ!')}
                className="w-full mt-6 py-4 bg-gray-50 text-gray-400 rounded-2xl text-[11px] font-black border border-gray-100 hover:bg-orange-50 hover:text-[#EE4D2D] transition-colors"
              >
                📝 แก้ไขข้อมูลรถคันนี้
              </button>
            </div>
          ))}
        </div>

        {vehicles.length === 0 && (
          <div className="bg-white rounded-[3rem] p-16 text-center shadow-sm border border-gray-100">
            <div className="text-7xl mb-6">🏜️</div>
            <p className="font-black text-gray-800">ยังไม่มีรถในอู่ของคุณค่ะ</p>
            <p className="text-xs text-gray-400 font-bold mt-2">เริ่มสร้างรายได้โดยการลงทะเบียนรถคันแรกของคุณ</p>
          </div>
        )}

      </div>
    </div>
  );
}

// Component ย่อยแสดงสถานะ
function StatusBadge({ status }: { status: string }) {
  const styles: any = {
    pending: 'bg-amber-50 text-amber-600 border-amber-100',
    approved: 'bg-green-50 text-green-600 border-green-100',
    rejected: 'bg-red-50 text-red-600 border-red-100',
  };
  const labels: any = { pending: '⌛ รอตรวจสอบ', approved: '✅ ใช้งานได้', rejected: '❌ ไม่ผ่าน' };

  return (
    <span className={`text-[9px] font-black px-2.5 py-1 rounded-full border ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
