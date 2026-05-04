export default function Loading() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-24">
      
      {/* 🟠 Skeleton Header: โครงร่างส่วนบน */}
      <div className="bg-slate-200 pb-10 md:pb-16 rounded-b-[2.5rem] md:rounded-b-[4rem] animate-pulse">
        <div className="max-w-5xl mx-auto px-5 pt-8 md:pt-12 h-48 md:h-56 flex items-center justify-center">
          {/* ข้อความเดิมของบีสาม */}
          <p className="text-xl font-bold text-slate-400 animate-pulse">กำลังโหลดบริการชุมชน... 🛠️</p>
        </div>
      </div>

      {/* 📋 Skeleton Main Content: โครงร่างการ์ดงาน */}
      <main className="max-w-5xl mx-auto px-5 pt-6">
        {/* โครงร่างข้อความ "พบ X บริการ" */}
        <div className="w-48 h-4 bg-slate-200 rounded-full mb-6 animate-pulse"></div>

        {/* 🌟 Skeleton Grid: รองรับจอคอม (4 คอลัมน์) เหมือนหน้าจริง */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-5">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="bg-white rounded-[1.5rem] overflow-hidden border border-slate-100 shadow-sm h-[260px] md:h-[300px] animate-pulse flex flex-col">
              
              {/* โครงร่างรูปภาพปก */}
              <div className="w-full aspect-[4/3] bg-slate-200"></div>
              
              {/* โครงร่างรายละเอียดการ์ด */}
              <div className="p-4 flex flex-col flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-slate-200 shrink-0"></div>
                  <div className="h-3 bg-slate-200 rounded-full w-24"></div>
                </div>
                
                <div className="h-4 bg-slate-200 rounded-full w-full mb-2"></div>
                <div className="h-4 bg-slate-200 rounded-full w-2/3 mb-4"></div>
                
                <div className="mt-auto pt-3 border-t border-slate-50 flex flex-col gap-1.5">
                  <div className="h-2 bg-slate-200 rounded-full w-12"></div>
                  <div className="h-4 bg-slate-200 rounded-full w-24"></div>
                </div>
              </div>

            </div>
          ))}
        </div>
      </main>

    </div>
  );
}
