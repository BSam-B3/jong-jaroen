'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function AdminGaragePage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  
  const [pendingVehicles, setPendingVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingVehicles();
  }, [supabase, router]);

  const fetchPendingVehicles = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return router.push('/auth/login');

    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', session.user.id).single();
    if (!profile?.is_admin) {
      alert('เฉพาะผู้ดูแลระบบเท่านั้นค่ะ');
      return router.push('/');
    }

    const { data, error } = await supabase
      .from('rider_vehicles')
      .select('*, rider:profiles!rider_id(full_name, phone)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (!error && data) setPendingVehicles(data);
    setLoading(false);
  };

  const handleApprove = async (vId: string, reg: string, riderId: string) => {
    if (!confirm(`ยืนยันการอนุมัติรถทะเบียน ${reg} ใช่ไหมคะ?`)) return;
    setActionLoading(vId);
    
    try {
      const { error } = await supabase
        .from('rider_vehicles')
        .update({ status: 'approved', updated_at: new Date().toISOString() })
        .eq('id', vId);
        
      if (error) throw error;
      
      await supabase.from('notifications').insert({
        user_id: riderId,
        type: 'system',
        title: 'รถผ่านการอนุมัติแล้ว! 🛵',
        body: `รถทะเบียน ${reg} ในอู่ของคุณพร้อมใช้งานสำหรับรับงานแล้วค่ะ`,
      });

      alert(`อนุมัติรถทะเบียน ${reg} เรียบร้อยแล้วค่ะ! 🎉`);
      setPendingVehicles(prev => prev.filter(v => v.id !== vId));
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (vId: string, reg: string, riderId: string) => {
    const reason = prompt(`กรุณาระบุเหตุผลที่ไม่อนุมัติรถทะเบียน ${reg} (เช่น รูปป้ายทะเบียนไม่ชัด):`);
    if (reason === null) return; 
    
    setActionLoading(vId);
    try {
      const { error } = await supabase
        .from('rider_vehicles')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', vId);
        
      if (error) throw error;
      
      await supabase.from('notifications').insert({
        user_id: riderId,
        type: 'system',
        title: 'เอกสารรถไม่ผ่านการอนุมัติ ❌',
        body: `รถทะเบียน ${reg} ต้องแก้ไขเนื่องจาก: ${reason || 'เอกสารไม่สมบูรณ์'} กรุณาแก้ไขในหน้าอู่รถนะคะ`,
      });

      alert(`ตีกลับรถทะเบียน ${reg} เรียบร้อยค่ะ`);
      setPendingVehicles(prev => prev.filter(v => v.id !== vId));
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] font-sans pb-20">
      
      {/* 🌟 Header */}
      <div className="bg-gray-900 p-8 pt-12 rounded-b-[3rem] shadow-lg text-white relative">
        <Link href="/admin" className="absolute top-6 left-6 text-gray-400 hover:text-white text-2xl transition active:scale-95">←</Link>
        <h1 className="text-3xl font-black tracking-tight mt-4 flex items-center gap-2">
          <span>⚙️</span> ศูนย์ตรวจอู่รถ
        </h1>
        <p className="text-sm font-medium mt-2 text-gray-400">
          ตรวจสอบและอนุมัติรถในอู่ของช่าง (Garage Approval)
        </p>
      </div>

      {/* 📋 รายการรอตรวจสอบ */}
      <main className="p-6 -mt-6 relative z-10 max-w-5xl mx-auto">
        <div className="flex justify-between items-end mb-4 px-2">
          <h2 className="text-lg font-black text-gray-800">
            รอตรวจสอบ <span className="text-[#EE4D2D] ml-1">{pendingVehicles.length}</span> คัน
          </h2>
          <button onClick={fetchPendingVehicles} className="text-xs font-bold text-gray-500 hover:text-gray-900">
            🔄 รีเฟรช
          </button>
        </div>

        {loading ? (
          <div className="bg-white rounded-[2rem] p-10 text-center shadow-sm border border-gray-100">
            <p className="text-gray-400 font-bold animate-pulse">กำลังโหลดข้อมูลอู่รถ...</p>
          </div>
        ) : pendingVehicles.length === 0 ? (
          <div className="bg-white rounded-[2rem] p-12 text-center shadow-sm border border-gray-100">
            <div className="text-6xl mb-4 grayscale opacity-30">✨</div>
            <p className="font-black text-gray-800 text-lg">ไม่มีรถค้างตรวจค่ะ</p>
            <p className="text-sm text-gray-400 font-medium mt-1">อู่ว่างเปล่า แอดมินพักผ่อนได้เลย ☕</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pendingVehicles.map(v => (
              <div key={v.id} className="bg-white p-6 rounded-[2.5rem] border border-gray-200 shadow-sm flex flex-col">
                
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl bg-gray-50 p-2 rounded-xl">
                      {v.vehicle_type === 'motorcycle' ? '🛵' : v.vehicle_type === 'car' ? '🚗' : '🛻'}
                    </span>
                    <div>
                      <h3 className="font-black text-gray-900 text-base">{v.brand} {v.model}</h3>
                      <p className="text-sm font-bold text-[#EE4D2D]">{v.registration}</p>
                    </div>
                  </div>
                  <span className="bg-amber-50 text-amber-600 text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider">
                    รอตรวจ
                  </span>
                </div>

                {/* ข้อมูลเจ้าของรถ */}
                <div className="bg-gray-50 p-3 rounded-xl mb-4 border border-gray-100">
                  <p className="text-[11px] text-gray-500 font-bold mb-1 uppercase tracking-wider">👤 ข้อมูลเจ้าของรถ</p>
                  <p className="text-sm font-black text-gray-800">{v.rider?.full_name || 'ไม่ทราบชื่อ'}</p>
                  <p className="text-xs text-gray-600">📞 {v.rider?.phone || 'ไม่ระบุเบอร์'}</p>
                </div>

                {/* รูปถ่าย */}
                <div className="grid grid-cols-2 gap-2 mb-6">
                  <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden relative border border-gray-50 group">
                    {v.front_photo_url ? (
                      <a href={v.front_photo_url} target="_blank" rel="noreferrer">
                        <img src={v.front_photo_url} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" alt="ด้านหน้า" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-white text-[10px] font-bold bg-black/60 px-2 py-1 rounded-md">🔍 ดูรูปเต็ม</span>
                        </div>
                      </a>
                    ) : <div className="flex items-center justify-center h-full text-[10px] text-gray-400 font-bold">ไม่มีรูปด้านหน้า</div>}
                  </div>
                  <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden relative border border-gray-50 group">
                    {v.back_photo_url ? (
                      <a href={v.back_photo_url} target="_blank" rel="noreferrer">
                        <img src={v.back_photo_url} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" alt="ด้านหลัง" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-white text-[10px] font-bold bg-black/60 px-2 py-1 rounded-md">🔍 ดูรูปเต็ม</span>
                        </div>
                      </a>
                    ) : <div className="flex items-center justify-center h-full text-[10px] text-gray-400 font-bold">ไม่มีรูปด้านหลัง</div>}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-auto">
                  <button 
                    onClick={() => handleReject(v.id, v.registration, v.rider_id)}
                    disabled={actionLoading === v.id}
                    className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 py-3.5 rounded-2xl font-black text-xs transition-colors disabled:opacity-50 border border-red-100"
                  >
                    ❌ ปฏิเสธ
                  </button>
                  <button 
                    onClick={() => handleApprove(v.id, v.registration, v.rider_id)}
                    disabled={actionLoading === v.id}
                    className="flex-1 bg-[#EE4D2D] hover:bg-[#d64528] text-white py-3.5 rounded-2xl font-black text-xs shadow-md transition-colors disabled:opacity-50"
                  >
                    {actionLoading === v.id ? 'กำลังบันทึก...' : '✅ อนุมัติผ่าน'}
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
