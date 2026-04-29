export default function Loading() {
  return (
    <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center pb-24">
      <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
        <div className="w-12 h-12 border-4 border-[#0082FA] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-bold text-[#0082FA] animate-pulse">กำลังโหลดบอร์ดหางาน... 📋</p>
      </div>
    </div>
  );
}
