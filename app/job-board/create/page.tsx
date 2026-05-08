'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function CreateJobPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // 🌟 State สำหรับเก็บข้อมูลฟอร์ม
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    job_type: 'online',
    category: 'design',
    employment_type: 'freelance',
    budget: '',
    deadline: ''
  });

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/auth/login?next=/jobs/create');
        return;
      }
      setCurrentUser(session.user);
    };
    checkUser();
  }, [router, supabase]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setLoading(true);

    try {
      // 🌟 นำข้อมูลลง Database
      const { error } = await supabase.from('jobs').insert({
        employer_id: currentUser.id,
        title: formData.title,
        description: formData.description,
        job_type: formData.job_type,
        category: formData.category,
        employment_type: formData.employment_type,
        budget: Number(formData.budget),
        deadline: formData.deadline || null, // ถ้าไม่ได้เลือกวัน ให้เป็น null
        status: 'open' // สถานะเริ่มต้นคือเปิดรับคน
      });

      if (error) throw error;
      
      alert('🎉 ลงประกาศงานสำเร็จแล้วค่ะ!');
      router.push('/job-board'); // โพสต์เสร็จพากลับไปหน้าบอร์ด
    } catch (error: any) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex justify-center font-sans pb-24 md:pb-10">
      <div className="w-full lg:max-w-3xl bg-[#F8FAFC] min-h-screen relative flex flex-col md:shadow-2xl overflow-x-hidden md:border-x border-gray-200/50">
        
        {/* 🟠 Header */}
        <header className="bg-gradient-to-br from-[#0047FF] to-[#0082FA] px-6 pt-12 pb-16 rounded-b-[2.5rem] md:rounded-b-[4rem] text-white shadow-lg relative z-20">
          <div className="flex items-center gap-4 max-w-4xl mx-auto">
            <button onClick={() => router.back()} className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 active:scale-95 transition-all backdrop-blur-md shrink-0">
              ←
            </button>
            <div>
              <h1 className="text-2xl md:text-4xl font-black tracking-tight">ลงประกาศงาน 📝</h1>
              <p className="text-xs md:text-sm font-bold text-blue-100 opacity-90 mt-1 md:mt-2">สร้างบรีฟงานให้ชัดเจน เพื่อดึงดูดช่างที่ใช่</p>
            </div>
          </div>
        </header>

        {/* 🌟 Form Section */}
        <main className="flex-1 p-5 md:px-10 -mt-8 relative z-30 w-full max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-gray-100 flex flex-col gap-5">
            
            {/* 1. หัวข้องาน */}
            <div>
              <label className="block text-xs md:text-sm font-black text-gray-700 mb-2">หัวข้องาน <span className="text-red-500">*</span></label>
              <input 
                type="text" name="title" required
                value={formData.title} onChange={handleInputChange}
                placeholder="เช่น ต้องการคนออกแบบโลโก้ร้านกาแฟมินิมอล" 
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 focus:bg-white focus:ring-2 focus:ring-[#0047FF] outline-none transition-all"
              />
            </div>

            {/* 2. รายละเอียดงาน */}
            <div>
              <label className="block text-xs md:text-sm font-black text-gray-700 mb-2">รายละเอียดงาน (Brief) <span className="text-red-500">*</span></label>
              <textarea 
                name="description" required rows={4}
                value={formData.description} onChange={handleInputChange}
                placeholder="อธิบายสิ่งที่คุณต้องการ สโคปงาน หรือข้อจำกัดต่างๆ..." 
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 focus:bg-white focus:ring-2 focus:ring-[#0047FF] outline-none transition-all resize-none"
              />
            </div>

            {/* 3. Dropdowns แถวเดียวกันบน Desktop */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs md:text-sm font-black text-gray-700 mb-2">หมวดหมู่งาน</label>
                <select name="category" value={formData.category} onChange={handleInputChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 focus:bg-white focus:ring-2 focus:ring-[#0047FF] outline-none cursor-pointer">
                  <option value="design">งานออกแบบ / กราฟิก</option>
                  <option value="tech">เขียนโปรแกรม / เทคโนโลยี</option>
                  <option value="marketing">การตลาด / โฆษณา</option>
                  <option value="repair">ช่างซ่อม / ล้างแอร์</option>
                  <option value="lifestyle">ไลฟ์สไตล์ / ทั่วไป</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs md:text-sm font-black text-gray-700 mb-2">ลักษณะการจ้าง</label>
                <select name="employment_type" value={formData.employment_type} onChange={handleInputChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 focus:bg-white focus:ring-2 focus:ring-[#0047FF] outline-none cursor-pointer">
                  <option value="freelance">🚀 ฟรีแลนซ์ (รายชิ้น)</option>
                  <option value="contract">📄 สัญญาจ้าง (โปรเจกต์ยาว)</option>
                  <option value="parttime">⏱️ พาร์ทไทม์ (รายชั่วโมง/วัน)</option>
                  <option value="fulltime">💼 งานประจำ</option>
                </select>
              </div>
            </div>

            {/* 4. สถานที่ และ งบประมาณ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs md:text-sm font-black text-gray-700 mb-2">รูปแบบการทำงาน</label>
                <select name="job_type" value={formData.job_type} onChange={handleInputChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 focus:bg-white focus:ring-2 focus:ring-[#0047FF] outline-none cursor-pointer">
                  <option value="online">💻 ทำงานออนไลน์ (Work from Anywhere)</option>
                  <option value="onsite">📍 ออนไซต์ (ต้องลงพื้นที่จริง)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs md:text-sm font-black text-gray-700 mb-2">งบประมาณ (บาท) <span className="text-red-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-gray-400">฿</span>
                  <input 
                    type="number" name="budget" required min="1"
                    value={formData.budget} onChange={handleInputChange}
                    placeholder="เช่น 1500" 
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-3 text-sm font-black text-[#00C300] focus:bg-white focus:ring-2 focus:ring-[#0047FF] outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* 5. วันหมดอายุ / กำหนดส่ง */}
            <div>
              <label className="block text-xs md:text-sm font-black text-gray-700 mb-2">วันหมดอายุประกาศ (ถ้ามี)</label>
              <input 
                type="date" name="deadline" 
                value={formData.deadline} onChange={handleInputChange}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 focus:bg-white focus:ring-2 focus:ring-[#0047FF] outline-none cursor-pointer"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-gray-100 mt-2">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-[#0047FF] hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-200 active:scale-95 transition-all flex justify-center items-center gap-2"
              >
                {loading ? (
                  <span className="animate-spin text-xl">⏳</span>
                ) : (
                  <>✨ โพสต์ประกาศงาน</>
                )}
              </button>
              <p className="text-center text-[10px] font-bold text-gray-400 mt-3">
                การโพสต์งานฟรี ไม่มีค่าธรรมเนียม จนกว่าจะตกลงจ้างงาน
              </p>
            </div>

          </form>
        </main>
      </div>
    </div>
  );
}
