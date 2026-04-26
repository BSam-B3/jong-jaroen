{/* ⚙️ ปุ่มลับเข้าหลังบ้าน (แสดงเฉพาะ Admin) */}
{(profileData?.role === 'super_admin' || profileData?.role === 'admin') && (
  <button 
    onClick={() => router.push('/admin')}
    className="w-full mt-4 bg-gray-900 text-white py-4 rounded-2xl font-black text-sm shadow-xl flex items-center justify-center gap-2 hover:bg-black transition-all"
  >
    <span>⚙️</span> จัดการระบบหลังบ้าน (Admin)
  </button>
)}
