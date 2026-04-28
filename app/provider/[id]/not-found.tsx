import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-[2rem] shadow-sm p-10 text-center border border-slate-100">
        <div className="w-24 h-24 mx-auto bg-orange-50 rounded-full flex items-center justify-center mb-6">
          <svg className="w-12 h-12 text-[#EE4D2D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h1 className="text-2xl font-black text-slate-800 mb-2">ไม่พบโปรไฟล์นี้</h1>
        <p className="text-sm font-medium text-slate-500 mb-8 leading-relaxed">
          ผู้รับงานคนนี้อาจถูกลบออกจากระบบ หรือลิงก์ที่คุณเข้าใช้งานอาจไม่ถูกต้อง
        </p>
        <Link href="/" className="inline-block w-full bg-gray-900 hover:bg-black text-white font-black px-6 py-4 rounded-xl transition-all shadow-md">
          กลับสู่หน้าหลัก
        </Link>
      </div>
    </div>
  );
}
