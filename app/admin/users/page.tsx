'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface UserProfile {
  id: string;
  full_name: string;
  phone_number: string;
  role: string;
  kyc_status: string;
  created_at: string;
}

export default function UsersAdminPage() {
  const supabase = createClient();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // 1. ดึงข้อมูลสมาชิกทั้งหมดจาก Table profiles
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setUsers(data);
      }
      setLoading(false);
    };

    fetchUsers();
  }, [supabase]);

  // 2. ตัวกรองการค้นหา
  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone_number?.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-[#F4F6F8] p-4 sm:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <Link href="/" className="text-[#EE4D2D] text-sm font-black flex items-center gap-1 mb-2">
              ← กลับหน้าหลัก
            </Link>
            <h1 className="text-2xl font-black text-gray-900">จัดการสมาชิก (Admin)</h1>
            <p className="text-xs text-gray-400 font-bold">ตรวจสอบและจัดการรายชื่อผู้ใช้งานทั้งหมดในระบบ</p>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <input 
              type="text"
              placeholder="ค้นหาชื่อ หรือเบอร์โทร..."
              className="w-full md:w-80 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#EE4D2D] outline-none shadow-sm font-bold"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* User Table Card */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-wider">ชื่อ-นามสกุล</th>
                  <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-wider">เบอร์โทรศัพท์</th>
                  <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-wider">สถานะ KYC</th>
                  <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-wider">บทบาท</th>
                  <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-wider text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center">
                      <div className="w-8 h-8 border-4 border-[#EE4D2D] border-t-transparent rounded-full animate-spin mx-auto"></div>
                      <p className="text-xs text-gray-400 font-bold mt-2">กำลังดึงข้อมูล...</p>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-gray-400 text-sm font-bold">
                      ไม่พบรายชื่อสมาชิก
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-black text-gray-800">{user.full_name || 'ไม่ระบุชื่อ'}</p>
                        <p className="text-[10px] text-gray-400 font-bold">ID: {user.id.substring(0, 8)}...</p>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-600">
                        {user.phone_number || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                          user.kyc_status === 'verified' 
                            ? 'bg-green-50 text-green-600 border border-green-100' 
                            : 'bg-amber-50 text-amber-600 border border-amber-100'
                        }`}>
                          {user.kyc_status === 'verified' ? '✓ ยืนยันแล้ว' : '⌛ รอตรวจสอบ'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                          user.role === 'admin' 
                            ? 'bg-purple-50 text-purple-600 border border-purple-100' 
                            : 'bg-gray-50 text-gray-600 border border-gray-100'
                        }`}>
                          {user.role === 'admin' ? 'แอดมิน' : 'สมาชิก'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-[#0082FA] text-xs font-black hover:underline active:scale-95 transition-transform">
                          ดูรายละเอียด →
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
