'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export type KycListItem = {
  id: string;
  full_name: string | null;
  national_id_masked: string | null;
  kyc_status: string;
  submitted_at: string | null;
};

export type KycListResponse = {
  total: number;
  limit: number;
  offset: number;
  items: KycListItem[];
};

type Props = {
  data: KycListResponse;
  pageNum: number;
  pageSize: number;
};

export default function KycListClient({ data, pageNum, pageSize }: Props) {
  const router = useRouter();
  const totalPages = Math.max(1, Math.ceil(data.total / pageSize));

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            ตรวจสอบเอกสาร (KYC)
          </h1>
          <p className="text-gray-500 mt-2 font-medium text-sm">
            รายการสมาชิกรอการอนุมัติยืนยันตัวตน
          </p>
        </div>
        <div className="bg-orange-50 border border-orange-100 text-orange-600 px-5 py-2.5 rounded-2xl font-black text-sm shadow-sm flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
          รอตรวจสอบ {data.total.toLocaleString('th-TH')} รายการ
        </div>
      </div>

      {/* Empty state */}
      {data.items.length === 0 ? (
        <div className="bg-white rounded-[2rem] p-20 text-center shadow-sm border border-gray-100">
          <div className="text-6xl mb-6">🎉</div>
          <h3 className="text-xl font-black text-gray-800 mb-2">
            ไม่มีรายการค้างตรวจสอบ
          </h3>
          <p className="text-gray-400 text-sm font-medium">
            จัดการเคลียร์งานเอกสารหมดเกลี้ยงแล้วค่ะ!
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    ชื่อ-นามสกุล
                  </th>
                  <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    เลขบัตร (mask)
                  </th>
                  <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    ส่งเมื่อ
                  </th>
                  <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">
                    จัดการ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.items.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-orange-50/30 transition-colors group"
                  >
                    <td className="p-5 font-bold text-sm text-gray-800">
                      {u.full_name ?? '—'}
                    </td>
                    <td className="p-5 font-mono text-sm tracking-widest text-gray-500">
                      {u.national_id_masked ?? '—'}
                    </td>
                    <td className="p-5 text-xs text-gray-500 font-bold">
                      {u.submitted_at
                        ? new Date(u.submitted_at).toLocaleString('th-TH', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })
                        : '—'}
                    </td>
                    <td className="p-5 text-right">
                      <button
                        onClick={() => router.push(`/admin/kyc/${u.id}`)}
                        className="bg-gray-100 text-gray-600 hover:bg-[#EE4D2D] hover:text-white px-5 py-2.5 rounded-xl text-xs font-black transition-all"
                      >
                        เปิดตรวจเอกสาร
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <Pagination
            pageNum={pageNum}
            totalPages={totalPages}
            basePath="/admin/kyc"
          />
        </>
      )}
    </div>
  );
}

function Pagination({
  pageNum,
  totalPages,
  basePath,
}: {
  pageNum: number;
  totalPages: number;
  basePath: string;
}) {
  if (totalPages <= 1) return null;
  const prev = Math.max(1, pageNum - 1);
  const next = Math.min(totalPages, pageNum + 1);

  return (
    <nav className="flex justify-between items-center text-xs font-black">
      <Link
        href={`${basePath}?page=${prev}`}
        aria-disabled={pageNum === 1}
        className={`px-4 py-2 rounded-xl border ${
          pageNum === 1
            ? 'pointer-events-none opacity-40 bg-gray-50'
            : 'bg-white hover:bg-gray-50'
        }`}
      >
        ← ก่อนหน้า
      </Link>
      <span className="text-gray-500">
        หน้า {pageNum} / {totalPages}
      </span>
      <Link
        href={`${basePath}?page=${next}`}
        aria-disabled={pageNum === totalPages}
        className={`px-4 py-2 rounded-xl border ${
          pageNum === totalPages
            ? 'pointer-events-none opacity-40 bg-gray-50'
            : 'bg-white hover:bg-gray-50'
        }`}
      >
        ถัดไป →
      </Link>
    </nav>
  );
}
