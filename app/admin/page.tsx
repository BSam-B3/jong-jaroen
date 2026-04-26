'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    pendingKyc: 0,
    totalUsers: 0,
    activeJobs: 0,
    totalRevenue: 0
  });
  const [adminName, setAdminName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    setLoading(true);
    try {
      // 1. ดึงชื่อคนล็อกอิน
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
        if (profile) setAdminName(profile.full_name);
      }

      // 2. นับจำนวน KYC ที่รอตรวจ
      const { count: kycCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('kyc_status', 'pending');

      // 3. นับจำนวนผู้ใช้งานในระบบทั้งหมด
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      setStats({
        pendingKyc: kycCount || 0,
        totalUsers: userCount || 0,
        activeJobs: 0, // TODO: รอเชื่อมต่อตารางงานในเฟสหน้า
        totalRevenue: 0 // TODO: รอเชื่อมต่อตารางการเงินในเฟสหน้า
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
    setLoading(false);
  }

  if (loading) return <div className="p-10 font-bold text-gray-400">กำลังโหลดสรุปข้อมูลแพลตฟอร์ม...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      
      {/* --- ส่วนหัวทักทาย --- */}
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">ภาพรวมระบบ (Dashboard)</h1>
        <p className="text-gray-500 mt-2 font-medium">สวัสดีค่ะ {adminName || 'แอดมิน'}! นี่คือสรุปข้อมูลของแพลตฟอร์มจงเจริญในวันนี้ค่ะ</p>
      </div>

      {/* --- การ์ดแสดงสถิติ 4 ช่อง --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* ช่องที่ 1: KYC (ใช้งานได้จริงแล้ว) */}
        <div className="bg-white p-6 rounded-[2rem] border border-orange-100 shadow-sm flex flex-col justify-between hover:shadow-md transition">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center text-2xl">🪪</div>
            {stats.pendingKyc > 0 && (
              <span className="bg-red-50 text-red-600 text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest border border-red-100 animate-pulse">
                ด่วน
              </span>
            )}
          </div>
          <div className="mt-6">
            <p className="text-4xl font-black text-gray-900">{stats.pendingKyc}</p>
            <p className="text-xs font-black text-gray-400 mt-1 uppercase tracking-widest">KYC รอตรวจสอบ</p>
          </div>
          <Link href="/admin/kyc" className="mt-4 bg-orange-50 text-orange-600 text-center py-2 rounded-xl text-xs font-black hover:bg-orange-500 hover:text-white transition">
            ไปหน้าตรวจเอกสาร
          </Link>
        </div>

        {/* ช่องที่ 2: Users (ใช้งานได้จริงแล้ว) */}
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition">
           <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center text-2xl">👥</div>
          <div className="mt-6">
            <p className="text-4xl font-black text-gray-900">{stats.totalUsers}</p>
            <p className="text-xs font-black text-gray-400 mt-1 uppercase tracking-widest">สมาชิกทั้งหมด</p>
          </div>
           <button disabled className="mt-4 bg-gray-50 text-gray-400 text-center py-2 rounded-xl text-xs font-black cursor-not-allowed">
             จัดการสมาชิก (เร็วๆ นี้)
           </button>
        </div>

        {/* ช่องที่ 3: Jobs (รอทำเฟสหน้า) */}
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col justify-between opacity-60">
          <div className="w-12 h-12 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center text-2xl">💼</div>
          <div className="mt-6">
            <p className="text-4xl font-black text-gray-900">{stats.activeJobs}</p>
            <p className="text-xs font-black text-gray-400 mt-1 uppercase tracking-widest">งานที่กำลังดำเนินการ</p>
          </div>
          <button disabled className="mt-4 bg-gray-50 text-gray-400 text-center py-2 rounded-xl text-xs font-black cursor-not-allowed">
            ดูระบบงาน (เร็วๆ นี้)
          </button>
        </div>

        {/* ช่องที่ 4: Revenue (รอทำเฟสหน้า) */}
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col justify-between opacity-60">
          <div className="w-12 h-12 bg-purple-50 text-purple-500 rounded-2xl flex items-center justify-center text-2xl">💰</div>
          <div className="mt-6">
            <p className="text-4xl font-black text-gray-900">{stats.totalRevenue.toLocaleString()} <span className="text-lg">บาท</span></p>
            <p className="text-xs font-black text-gray-400 mt-1 uppercase tracking-widest">รายได้แพลตฟอร์ม</p>
          </div>
          <button disabled className="mt-4 bg-gray-50 text-gray-400 text-center py-2 rounded-xl text-xs font-black cursor-not-allowed">
            ดูระบบการเงิน (เร็วๆ นี้)
          </button>
        </div>

      </div>

      {/* --- ส่วนคำแนะนำเริ่มต้น --- */}
       <div className="bg-[#EE4D2D]/5 border border-[#EE4D2D]/20 rounded-3xl p-8 mt-8">
         <h2 className="text-lg font-black text-gray-900 mb-2">🚀 ยินดีต้อนรับสู่ระบบหลังบ้าน</h2>
         <p className="text-sm text-gray-600 mb-6 font-medium">
           ขณะนี้ระบบเปิดให้ใช้งานฟีเจอร์ "ตรวจสอบเอกสาร (KYC)" แล้ว คุณบีสามสามารถคลิกที่เมนูด้านซ้าย 
           หรือปุ่มส้มๆ ในการ์ดด้านบน เพื่อเริ่มตรวจสอบข้อมูลรูปบัตรประชาชนที่ลูกค้าส่งเข้ามาได้ทันทีค่ะ
         </p>
       </div>

    </div>
  );
}
