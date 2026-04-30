'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
// ✅ แก้ไข: เปลี่ยนมาใช้กุญแจตัวใหม่
import { createClient } from '@/lib/supabase/client';

interface License {
  id: string;
  name: string;
  issuer: string;
  issue_date: string;
  expiry_date: string | null;
  license_number: string;
  image_url: string | null;
}

export default function LicensesPage() {
  const router = useRouter();
  // ✅ แก้ไข: สร้างกุญแจเชื่อมต่อภายใน Component
  const supabase = useMemo(() => createClient(), []);
  
  const [loading, setLoading] = useState(true);
  const [licenses, setLicenses] = useState<License[]>([]);

  useEffect(() => {
    const fetchLicenses = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { data, error } = await supabase
        .from('user_licenses')
        .select('*')
        .eq('user_id', user.id)
        .order('issue_date', { ascending: false });

      if (data) setLicenses(data as License[]);
      setLoading(false);
    };

    fetchLicenses();
  }, [supabase, router]);

  if (loading) return <div className="p-10 text-center font-bold">กำลังโหลดข้อมูลใบอนุญาต...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-md mx-auto space-y-6">
        <button onClick={() => router.back()} className="text-gray-500 font-bold text-sm">← กลับ</button>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">ใบอนุญาต & บัตรประจำตัว</h1>
        <p className="text-xs text-gray-500">รวมข้อมูลบัตรและใบอนุญาตต่างๆ ของคุณค่ะ</p>

        {licenses.length === 0 ? (
          <div className="bg-white p-10 rounded-[2rem] text-center border-2 border-dashed border-gray-200">
            <p className="text-gray-400 text-sm font-bold">ยังไม่มีข้อมูลใบอนุญาตค่ะ</p>
          </div>
        ) : (
          <div className="space-y-4">
            {licenses.map((license) => (
              <div key={license.id} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-black text-gray-800 text-base">{license.name}</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">{license.issuer}</p>
                  </div>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                    {license.license_number}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-500">
                  <div>
                    <p className="font-bold text-gray-400">วันที่ออกบัตร</p>
                    <p>{new Date(license.issue_date).toLocaleDateString('th-TH')}</p>
                  </div>
                  <div>
                    <p className="font-bold text-gray-400">วันหมดอายุ</p>
                    <p>{license.expiry_date ? new Date(license.expiry_date).toLocaleDateString('th-TH') : 'ไม่มีวันหมดอายุ'}</p>
                  </div>
                </div>

                {license.image_url && (
                  <div className="mt-2 rounded-xl overflow-hidden border border-gray-100">
                    <img src={license.image_url} alt="license" className="w-full h-auto" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <button 
          onClick={() => alert('เตรียมไปหน้าเพิ่มใบอนุญาตใหม่')}
          className="w-full bg-[#EE4D2D] text-white py-4 rounded-2xl font-black text-sm shadow-lg active:scale-95 transition-all"
        >
          + เพิ่มใบอนุญาตใหม่
        </button>
      </div>
    </div>
  );
}
