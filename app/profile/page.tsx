'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import BottomNav from '@/app/components/BottomNav';

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [totalEarnings, setTotalEarnings] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push('/auth/login');

      // 1. ดึงข้อมูลโปรไฟล์
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (profileData) setProfile(profileData);

      // 2. ดึงรายได้สะสม (เฉพาะงานที่จบแล้ว)
      const { data: earningsData } = await supabase
        .from('jobs')
        .select('budget')
        .eq('worker_id', session.user.id)
        .eq('status', 'completed');

      if (earningsData) {
        const total = earningsData.reduce((sum, job) => sum + (job.budget || 0), 0);
        setTotalEarnings(total);
      }
      setLoading(false);
    };
    fetchData();
  }, [supabase, router]);

  const handleLogout = async () => {
    if (!confirm('ยืนยันการออกจากระบบใช่ไหมคะ?')) return;
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  if (loading) return <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center font-black text-gray-400">กำลังโหลดโปรไฟล์...</div>;

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex justify-center font-sans relative">
      <div className="w-full max-w-3xl bg-[#F4F6F8] min-h-screen relative flex flex-col shadow-2xl border-x border-gray-100 overflow-hidden">
        
        {/* Header ส่วนบน (โครงสร้างเดิมที่บีสามทำไว้) */}
        <div className="bg-gradient-to-b from-[#EE4D2D] to-[#FF7337] rounded-b-[3rem] p-8 pb-10 shadow-md">
          <div className="flex justify-between items-center mt-4 mb-8">
            <h1 className="text-white text-2xl font-black italic tracking-tighter">⚙️ PROFILE</h1>
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-sm">🔔</div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-white border-4 border-white shadow-xl overflow-hidden shrink-0">
              {profile?.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-3xl bg-gray-100">👤</div>}
            </div>
            <div className="text-white flex-1">
              <h2 className="text-xl font-black">{profile?.full_name || profile?.first_name || 'บีสาม จงเจริญ'} <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full ml-1">✓ ยืนยันแล้ว</span></h2>
              <p className="text-sm font-bold opacity-80">{profile?.phone || '081-XXX-XXXX'}</p>
            </div>
          </div>

          {/* กระเป๋าเงิน & คะแนน (ฐานเดิม) */}
          <div className="grid grid-cols-2 gap-3 mt-8">
            <div className="bg-white/10 backdrop-blur-md rounded-[1.5rem] p-4 border border-white/20">
              <p className="text-[10px] text-white/70 font-black uppercase tracking-widest">กระเป๋าเงิน</p>
              <p className="text-xl font-black text-white mt-1">1,250 <span className="text-xs font-bold">บาท</span></p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-[1.5rem] p-4 border border-white/20">
              <p className="text-[10px] text-white/70 font-black uppercase tracking-widest">คะแนนสะสม</p>
              <p className="text-xl font-black text-white mt-1">450 <span className="text-xs font-bold">แต้ม</span></p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pb-32">
          
          {/* 🌟 ส่วนที่เพิ่ม: สรุปรายได้ไรเดอร์ (โชว์เฉพาะไรเดอร์) */}
          {profile?.is_rider && (
            <div className="px-5 mt-6">
              <div className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-gray-100 flex justify-between items-center">
                <div>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">รายได้จากงานในระบบ</p>
                  <p className="text-2xl font-black text-[#EE4D2D] mt-1">{totalEarnings.toLocaleString('th-TH')} <span className="text-xs">บาท</span></p>
                </div>
                <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-2xl text-orange-500">💰</div>
              </div>
            </div>
          )}

          {/* 🎟️ แบนเนอร์ปองเจริญ (ฐานเดิม) */}
          <div className="px-5 mt-4">
            <Link href="/coupons" className="bg-gradient-to-r from-[#FFB75E] to-[#ED8F03] rounded-[1.5rem] p-5 flex items-center justify-between shadow-md relative overflow-hidden group">
              <div className="absolute right-[-10px] bottom-[-20px] text-7xl opacity-20 transform group-hover:scale-110 transition-all">🎟️</div>
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl backdrop-blur-md border border-white/30">🎁</div>
                <div>
                  <h3 className="font-black text-white text-base leading-tight">ปองเจริญ & ลุ้นโชค</h3>
                  <p className="text-[11px] text-white/90 font-bold mt-0.5">กดรับคูปองส่วนลด และลุ้นรางวัลทุกงวด</p>
                </div>
              </div>
              <div className="text-white relative z-10 bg-white/20 rounded-full p-2 backdrop-blur-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
              </div>
            </Link>
          </div>

          {/* 📋 เมนูต่างๆ (ฐานเดิม + แทรก Garage เข้าไป) */}
          <main className="px-5 mt-5 space-y-4">
            <div className="bg-white rounded-[1.5rem] shadow-sm border border-gray-100 overflow-hidden">
              <MenuRow icon="📝" title="แก้ไขข้อมูลส่วนตัว" href="/profile/edit" />
              
              {/* 🌟 เพิ่มเมนูอู่รถของฉัน */}
              {profile?.is_rider && (
                <MenuRow icon="🛵" title="อู่รถของฉัน (My Garage)" href="/profile/garage" status="จัดการรถ" statusColor="text-orange-500" />
              )}
              
              <MenuRow icon="🛡️" title="ยืนยันตัวตน (KYC)" href="/kyc" status="ผ่านแล้ว" statusColor="text-green-500" />
              <MenuRow icon="💳" title="บัญชีรับเงิน / ธนาคาร" href="/profile/bank" />
              <MenuRow icon="⭐" title="คะแนนรีวิวของฉัน" href="/profile/reviews" />
            </div>

            <div className="bg-white rounded-[1.5rem] shadow-sm border border-gray-100 overflow-hidden">
              <MenuRow icon="🎧" title="ศูนย์ช่วยเหลือ / ติดต่อแอดมิน" href="/support" />
              <MenuRow icon="📜" title="ข้อตกลงและเงื่อนไข" href="/terms" />
            </div>

            <button onClick={handleLogout} className="w-full bg-white rounded-[1.5rem] p-4 text-center shadow-sm border border-red-100 active:scale-[0.98] transition-all mt-2">
              <span className="text-sm font-black text-red-500">ออกจากระบบ</span>
            </button>
          </main>
        </div>

        <BottomNav />
      </div>
    </div>
  );
}

function MenuRow({ icon, title, href, status, statusColor }: any) {
  return (
    <Link href={href} className="flex items-center justify-between p-4 border-b border-gray-50 last:border-b-0 active:bg-gray-50 transition-colors group">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-xl group-active:scale-95 transition-transform">{icon}</div>
        <span className="text-[13px] font-black text-gray-800">{title}</span>
      </div>
      <div className="flex items-center gap-2">
        {status && <span className={`text-[10px] font-bold ${statusColor}`}>{status}</span>}
        <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
      </div>
    </Link>
  );
}
