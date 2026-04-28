'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import Link from 'next/link';

// ... (ส่วน Types และ StatusBadge เหมือนเดิม) ...

export default function JobsListClient({ data, pageNum, pageSize, query, status }: any) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchInput, setSearchInput] = useState(query);
  const [statusInput, setStatusInput] = useState(status);

  function applyFilter(nextPage = 1) {
    const params = new URLSearchParams();
    if (searchInput) params.set('q', searchInput);
    if (statusInput) params.set('status', statusInput);
    if (nextPage > 1) params.set('page', String(nextPage));
    startTransition(() => { router.push(`/admin/jobs?${params.toString()}`); });
  }

  return (
    <div className="space-y-8 p-6">
      <h2 className="text-3xl font-black">จัดการงานทั้งหมด</h2>
      {/* ส่วนตารางงาน */}
      <div className="bg-white rounded-3xl shadow-sm overflow-hidden border">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-5 text-xs font-bold text-gray-400">ชื่องาน</th>
              <th className="p-5 text-xs font-bold text-gray-400">ผู้จ้าง / ผู้รับงาน</th>
              <th className="p-5 text-xs font-bold text-gray-400 text-right">ค่าจ้าง</th>
              <th className="p-5 text-xs font-bold text-gray-400 text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.items.map((job: any) => (
              <tr key={job.id} className="hover:bg-gray-50">
                <td className="p-5">
                  <p className="font-bold text-sm">{job.title || 'ไม่ระบุชื่อ'}</p>
                  <p className="text-[10px] text-gray-400">#{job.id.slice(0,8)}</p>
                </td>
                <td className="p-5">
                  <p className="text-xs font-bold text-gray-600">จ้าง: {job.employer_name || 'ไม่ระบุ'}</p>
                  <p className="text-xs text-gray-400">รับ: {job.worker_name || '-'}</p>
                </td>
                <td className="p-5 text-right font-bold text-sm">฿{(job.budget || 0).toLocaleString()}</td>
                <td className="p-5 text-right">
                  <button onClick={() => router.push(`/admin/jobs/${job.id}`)} className="text-[#EE4D2D] font-bold text-xs uppercase">รายละเอียด ›</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
