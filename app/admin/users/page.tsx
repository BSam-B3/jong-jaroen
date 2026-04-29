'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/admin';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, phone, role, kyc_status, created_at')
      .order('created_at', { ascending: false });
      
    if (data) setUsers(data);
    setLoading(false);
  }

  // ระบบค้นหาอัจฉริยะ (ค้นหาจากชื่อ หรือ เบอร์โทร)
  const filteredUsers = users.filter(u => 
    (u.full_name?.toLowerCase().includes(searchTerm.toLowerCase())) || 
    (u.phone?.includes(searchTerm))
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-4xl font-black text-gray-900 tracking-tighter">จัดการสมาชิก</h2>
          <p className="text-gray-400 mt-2 font-bold text-sm uppercase tracking-widest">User Database Center</p>
        </div>
        <div className="relative w-full md:w-96 group">
          <input 
            type="text" 
            placeholder="ค้นหาชื่อ หรือ เบอร์โทรลูกค้า..." 
            className="w-full pl-14 pr-6 py-4 bg-white border-2 border-gray-100 rounded-[2rem] text-sm font-bold focus:ring-4 focus:ring-[#EE4D2D]/10 focus:border-[#EE4D2D] outline-none shadow-sm transition-all group-hover:border-gray-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="absolute left-6 top-4.5 text-xl opacity-40 group-focus-within:opacity-100 transition-opacity">🔍</span>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="p-7 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] whitespace-nowrap">ข้อมูลลูกค้า</th>
                <th className="p-7 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] whitespace-nowrap">เบอร์โทรศัพท์</th>
                <th className="p-7 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] whitespace-nowrap">บทบาท</th>
                <th className="p-7 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] whitespace-nowrap">ความปลอดภัย (KYC)</th>
                <th className="p-7 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right whitespace-nowrap">แอคชั่น</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-32 text-center">
                    <div className="w-10 h-10 border-4 border-orange-100 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="font-black text-gray-300 italic tracking-widest">กำลังดึงฐานข้อมูลสมาชิก...</p>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-20 text-center font-bold text-gray-400">ไม่พบรายชื่อที่ตรงกับการค้นหาค่ะ</td>
                </tr>
              ) : filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-orange-50/20 transition-all duration-300 group">
                  <td className="p-7">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center font-black text-gray-400 group-hover:bg-[#EE4D2D] group-hover:text-white transition-all">
                        {user.full_name?.charAt(0) || '?'}
                      </div>
                      <p className="font-black text-sm text-gray-800 whitespace-nowrap">{user.full_name || 'ไม่ระบุชื่อ'}</p>
                    </div>
                  </td>
                  <td className="p-7 font-mono text-sm text-gray-500 font-bold whitespace-nowrap">{user.phone || '-'}</td>
                  <td className="p-7">
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm whitespace-nowrap ${
                      user.role === 'super_admin' ? 'bg-purple-50 text-purple-600 border-purple-100' : 
                      user.role === 'admin' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                      'bg-gray-50 text-gray-400 border-gray-100'
                    }`}>
                      {user.role || 'user'}
                    </span>
                  </td>
                  <td className="p-7 whitespace-nowrap">
                    {user.kyc_status === 'approved' ? (
                      <div className="flex items-center gap-2 text-green-600 font-black text-[10px] uppercase tracking-tighter">
                        <span className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]"></span>
                        Verified
                      </div>
                    ) : user.kyc_status === 'pending' ? (
                      <div className="flex items-center gap-2 text-orange-500 font-black text-[10px] uppercase tracking-tighter animate-pulse">
                         <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                         Waiting Review
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-300 font-black text-[10px] uppercase tracking-tighter">
                         <span className="w-2 h-2 bg-gray-200 rounded-full"></span>
                         Unverified
                      </div>
                    )}
                  </td>
                  <td className="p-7 text-right whitespace-nowrap">
                    <button className="bg-gray-50 text-gray-400 hover:bg-[#EE4D2D] hover:text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm">
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
