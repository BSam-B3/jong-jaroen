export default function Loading() {
  return (
    <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-[#EE4D2D] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-bold text-slate-500 animate-pulse">กำลังโหลดความสุข... 🧡</p>
      </div>
    </div>
  );
}
