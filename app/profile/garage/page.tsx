'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function MyGaragePage() {
  const supabase = createClient();
  const router = useRouter();
  
  const [user, setUser] = useState<any>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // 🌟 State สำหรับเปิดโหมดแก้ไข
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  // ดึงข้อมูล User และรถในอู่ทั้งหมด
  useEffect(() => {
    fetchData();
  }, [supabase, router]);

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

  // 📝 เปิดโหมดแก้ไขและดึงข้อมูลเดิมมาใส่ฟอร์ม
  const handleEditClick = (vehicle: any) => {
    setEditingId(vehicle.id);
    setEditForm({
      vehicle_type: vehicle.vehicle_type,
      brand: vehicle.brand,
      model: vehicle.model,
      registration: vehicle.registration
    });
  };

  // 💾 บันทึกการแก้ไข (สถานะจะเด้งกลับไป pending)
  const handleSaveEdit = async () => {
    if (!editForm.brand || !editForm.model || !editForm.registration) {
      return alert('กรุณากรอกข้อมูลให้ครบถ้วนค่ะ');
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('rider_vehicles')
        .update({
          ...editForm,
          status: 'pending', // 🌟 บังคับกลับไปรออนุมัติทุกครั้งที่แก้
          updated_at: new Date().toISOString()
        })
        .eq('id', editingId);

      if (error) throw error;
      
      alert('บันทึกการแก้ไขแล้ว! รอแอดมินบีสามตรวจสอบอีกครั้งนะคะ ✅');
      setEditingId(null);
      fetchData(); // โหลดข้อมูลใหม่โดยไม่ต้องรีเฟรชหน้า
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // 🗑️ ฟังก์ชันลบรถ
  const handleDeleteVehicle = async (vId: string, reg: string) => {
    if (!confirm(`ยืนยันการลบรถทะเบียน ${reg} ออกจากอู่ใช่ไหมคะ? (ลบแล้วกู้คืนไม่ได้นะคะ)`)) return;
    
    setSubmitting(true);
    try {
      const { error } = await supabase.from('rider_vehicles').delete().eq('id', vId);
      if (error) throw error;
      
      alert('ลบรถออกจากระบบเรียบร้อยค่ะ 🗑️');
      fetchData();
    } catch (err: any) {
      alert('ลบไม่สำเร็จ: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold bg-[#F4F6F8]">กำลังเปิดอู่รถ... 🛠️</div>;

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex justify-center font-sans pb-20">
      <div className="w-full max-w-4xl px-4 py-8">
        
        <header className="flex justify-between items-end mb-8 px-2">
          <div>
            <Link href="/profile/edit" className="text-[#EE4D2D] font-black text-xs mb-2 inline-block active:scale-95 transition-transform">← กลับไปหน้าตั้งค่า</Link>
            <h1 className="text-3xl font-black text-gray-900 italic">MY <span className="text-[#EE4D2D] not-italic">GARAGE</span></h1>
            <p className="text-xs text-gray-400 font-bold mt-1 uppercase tracking-widest">จัดการยานพาหนะของคุณ</p>
          </div>
          {vehicles.length < 4 && (
            <Link href="/provider/register" className="bg-gray-900 text-white px-6 py-3 rounded-2xl text-xs font-black shadow-md active:scale-95 transition-transform">
              + เพิ่มรถใหม่
            </Link>
          )}
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {vehicles.map((v, index) => (
            <div key={v.id} className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100 flex flex-col relative overflow-hidden">
              
              {/* Header ของการ์ดรถ */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <span className="bg-gray-100 text-gray-600 text-[10px] font-black px-3 py-1 rounded-full uppercase italic">คันที่ {index + 1}</span>
                  <StatusBadge status={v.status} />
                </div>
                {v.status === 'rejected' && (
                  <span className="text-[10px] text-red-500 font-bold bg-red-50 px-2 py-1 rounded-md">
                    ต้องแก้ไขเอกสาร
                  </span>
                )}
              </div>

              {/* 🟢 โหมดปกติ (View Mode) */}
              {editingId !== v.id ? (
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

                  <div className="flex gap-2 mt-4 pt-2">
                    <button 
                      onClick={() => handleEditClick(v)}
                      className="flex-1 py-3 bg-gray-50 text-gray-600 rounded-xl text-[11px] font-black border border-gray-100 hover:bg-orange-50 hover:text-[#EE4D2D] transition-colors"
                    >
                      📝 แก้ไข
                    </button>
                    <button 
                      onClick={() => handleDeleteVehicle(v.id, v.registration)}
                      disabled={submitting}
                      className="px-4 py-3 bg-red-50 text-red-500 rounded-xl text-[11px] font-black border border-red-100 hover:bg-red-100 transition-colors"
                    >
                      🗑️ ลบ
                    </button>
                  </div>
                </div>
              ) : (
                
                /* 🟠 โหมดแก้ไข (Edit Mode) */
                <div className="space-y-3 flex-1 bg-orange-50/50 p-4 rounded-2xl border border-orange-100">
                  <p className="text-xs font-black text-[#EE4D2D] mb-2">แก้ไขข้อมูลรถ</p>
                  
                  <select 
                    value={editForm.vehicle_type} 
                    onChange={e => setEditForm({...editForm, vehicle_type: e.target.value})}
                    className="w-full p-3 text-xs font-bold rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-[#EE4D2D]"
                  >
                    <option value="motorcycle">🏍️ รถจักรยานยนต์</option>
                    <option value="car">🚗 รถยนต์</option>
                    <option value="pickup">🛻 รถกระบะ</option>
                  </select>

                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="text" placeholder="ยี่ห้อ (เช่น Honda)" value={editForm.brand}
                      onChange={e => setEditForm({...editForm, brand: e.target.value})}
                      className="p-3 text-xs font-bold rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-[#EE4D2D]"
                    />
                    <input 
                      type="text" placeholder="รุ่น (เช่น Wave 110i)" value={editForm.model}
                      onChange={e => setEditForm({...editForm, model: e.target.value})}
                      className="p-3 text-xs font-bold rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-[#EE4D2D]"
                    />
                  </div>

                  <input 
                    type="text" placeholder="ทะเบียน (เช่น 1กข 1234 ระยอง)" value={editForm.registration}
                    onChange={e => setEditForm({...editForm, registration: e.target.value})}
                    className="w-full p-3 text-xs font-bold rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-[#EE4D2D]"
                  />

                  <div className="flex gap-2 mt-4">
                    <button 
                      onClick={() => setEditingId(null)}
                      className="flex-1 py-3 bg-white text-gray-500 rounded-xl text-[11px] font-black border border-gray-200"
                    >
                      ยกเลิก
                    </button>
                    <button 
                      onClick={handleSaveEdit}
                      disabled={submitting}
                      className="flex-1 py-3 bg-[#EE4D2D] text-white rounded-xl text-[11px] font-black shadow-sm disabled:opacity-50"
                    >
                      {submitting ? 'กำลังบันทึก...' : '💾 บันทึก'}
                    </button>
                  </div>
                </div>
              )}

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
    <span className={`text-[9px] font-black px-2.5 py-1 rounded-full border ${styles[status] || 'bg-gray-50 text-gray-400 border-gray-200'}`}>
      {labels[status] || 'ไม่ทราบสถานะ'}
    </span>
  );
}
