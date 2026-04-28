import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4F6F8] p-6 font-sans text-center">
      <div className="bg-white p-10 rounded-3xl shadow-xl max-w-lg w-full border border-gray-100">
        <div className="text-6xl mb-6">🏠</div>
        <h1 className="text-3xl font-black text-gray-800 mb-2">เข้าสู่ระบบสำเร็จ!</h1>
        <p className="text-gray-500 font-bold mb-8">นี่คือหน้า Dashboard ชั่วคราว เลือกระบบที่คุณต้องการไปต่อได้เลยค่ะ</p>
        
        <div className="flex flex-col gap-4">
          <Link 
            href="/admin" 
            className="w-full bg-[#22C55E] hover:bg-green-600 text-white py-4 rounded-2xl font-black text-lg transition-all shadow-md active:scale-95"
          >
            🛡️ ไปหน้าจัดการระบบ (Admin)
          </Link>
          
          <Link 
            href="/" 
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-4 rounded-2xl font-black text-lg transition-all active:scale-95"
          >
            ← กลับหน้าโฮมเพจหลัก
          </Link>
        </div>
      </div>
    </div>
  );
}
