'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function CreateJobPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // คำนวณวันดีฟอลต์ (3 วันนับจากวันนี้)
  const getDefaultDeadline = () => {
    const date = new Date();
    date.setDate(date.getDate() + 3);
    return date.toISOString().split('T')[0];
  };

  // วันที่ปัจจุบัน (สำหรับล็อคห้ามเลือกย้อนหลัง)
  const getTodayDate = () => new Date().toISOString().split('T')[0];

  // 🌟 State สำหรับเก็บข้อมูลฟอร์ม
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    job_type: 'onsite', // ✅ ดีฟอลต์เป็น onsite ตามสั่ง
    category: 'design',
    employment_type: 'freelance',
    budget: '',
    deadline: getDefaultDeadline(), // ✅ ดีฟอลต์เป็น 3 วันถัดไป
    is_anonymous: false 
  });

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/auth/login?next=/job-board/create');
        return;
      }
      setCurrentUser(session.user);
    };
    checkUser();
  }, [router, supabase]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    // 🔒 Validation: ห้ามเกิน 3 วัน
    const selectedDate = new Date(formData.deadline);
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 3);
    maxDate.setHours(23, 59, 59, 999);

    if (selectedDate > maxDate) {
      alert('❌ ขออภัยค่ะ ประกาศหางานสามารถตั้งวันหมดอายุได้สูงสุดไม่เกิน 3 วันนะคะ');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from('jobs').insert({
        employer_id: currentUser.id,
        title: formData.title,
        description: formData.description,
        job_type: formData.job_type,
        category: formData.category,
        employment_type: formData.employment_type,
        budget: Number(formData.budget),
        deadline: formData.deadline || null,
        is_anonymous: formData.is_anonymous,
        status: 'open'
      });

      if (error) throw error;

      alert('🎉 ลงประกาศงานสำเร็จแล้วค่ะ!');
      router.push('/job-board'); 
    } catch (error: any) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex justify-center font-sans pb-24 md:pb-10">
      <div className="w-full lg:max-w-4xl xl:max-w-5xl bg-[#F8FAFC] min-h-screen relative flex flex-col md:shadow-2xl overflow-x-hidden md:border-x border-gray-200/50">

        {/* 🟠 Header */}
        <header className="bg-gradient-to-br from-[#0047FF] to-[#0082FA] px-6 pt-12 pb-20 rounded-b-[2.5rem] md:rounded-b-[4rem] text-white shadow-lg relative z-20">
          <div className="flex items-center gap-4 max-w-3xl mx-auto">
            <button onClick={() => router.back()} className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 active:scale-95 transition-all backdrop-blur-md shrink-0">
              ←
            </button>
            <div>
              <h1 className="text-2xl md:text-4xl font-black tracking-tight">ลงประกาศงาน 📝</h1>
              <p className="text-xs md:text-sm font-bold text-blue-100 opacity-90 mt-1 md:mt-2">สร้างบรีฟงานให้ชัดเจน เพื่อดึงดูดฟรีแลนซ์และช่างที่ใช่</p>
            </div>
          </div>
        </header>

        {/* 🌟 Form Section */}
        <main className="flex-1 p-5 md:px-10 -mt-10 relative z-30 w-full max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="bg-white rounded-[2rem] p-6 md:p-10 shadow-xl border border-gray-100 flex flex-col gap-8">
            
            {/* โซนที่ 1: ข้อมูลหลัก */}
            <section className="space-y-5">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <span className="text-xl">📌</span>
                <h2 className="text-lg font-black text-gray-800">ข้อมูลหลักของงาน</h2>
              </div>

              <div>
                <label className="block text-xs md:text-sm font-black text-gray-700 mb-2">หัวข้องาน <span className="text-red-500">*</span></label>
                <input 
                  type="text" name="title" required
                  value={formData.title} onChange={handleInputChange}
                  placeholder="เช่น ต้องการคนออกแบบโลโก้ร้านกาแฟมินิมอล" 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 focus:bg-white focus:ring-2 focus:ring-[#0047FF] outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs md:text-sm font-black text-gray-700 mb-2">รายละเอียดงาน (Brief) <span className="text-red-500">*</span></label>
                <textarea 
                  name="description" required rows={5}
                  value={formData.description} onChange={handleInputChange}
                  placeholder="อธิบายสิ่งที่คุณต้องการ สโคปงาน กลุ่มเป้าหมาย หรือข้อจำกัดต่างๆ..." 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 focus:bg-white focus:ring-2 focus:ring-[#0047FF] outline-none transition-all resize-none"
                />
              </div>
            </section>

            {/* โซนที่ 2: รายละเอียดการจ้าง */}
            <section className="space-y-5">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <span className="text-xl">⚙️</span>
                <h2 className="text-lg font-black text-gray-800">รูปแบบและหมวดหมู่</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs md:text-sm font-black text-gray-700 mb-2">หมวดหมู่งาน</label>
                  <select name="category" value={formData.category} onChange={handleInputChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 focus:bg-white focus:ring-2 focus:ring-[#0047FF] outline-none cursor-pointer appearance-none">
                    <option value="design">งานออกแบบ / กราฟิก</option>
                    <option value="tech">เขียนโปรแกรม / เทคโนโลยี</option>
                    <option value="marketing">การตลาด / โฆษณา</option>
                    <option value="repair">ช่างซ่อม / ล้างแอร์</option>
                    <option value="lifestyle">ไลฟ์สไตล์ / ทั่วไป</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs md:text-sm font-black text-gray-700 mb-2">ลักษณะการจ้าง</label>
                  <select name="employment_type" value={formData.employment_type} onChange={handleInputChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 focus:bg-white focus:ring-2 focus:ring-[#0047FF] outline-none cursor-pointer appearance-none">
                    <option value="freelance">🚀 ฟรีแลนซ์ (รายชิ้น)</option>
                    <option value="contract">📄 สัญญาจ้าง (โปรเจกต์ยาว)</option>
                    <option value="parttime">⏱️ พาร์ทไทม์ (รายชั่วโมง/วัน)</option>
                    <option value="fulltime">💼 งานประจำ</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs md:text-sm font-black text-gray-700 mb-2">สถานที่ทำงาน</label>
                <div className="flex gap-4">
                  <label className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 cursor-pointer transition-all ${formData.job_type === 'online' ? 'border-[#0047FF] bg-blue-50 text-[#0047FF]' : 'border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>
                    <input type="radio" name="job_type" value="online" checked={formData.job_type === 'online'} onChange={handleInputChange} className="hidden" />
                    <span className="text-lg">💻</span> <span className="font-black text-sm">ONLINE</span>
                  </label>
                  <label className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 cursor-pointer transition-all ${formData.job_type === 'onsite' ? 'border-[#EE4D2D] bg-orange-50 text-[#EE4D2D]' : 'border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>
                    <input type="radio" name="job_type" value="onsite" checked={formData.job_type === 'onsite'} onChange={handleInputChange} className="hidden" />
                    <span className="text-lg">📍</span> <span className="font-black text-sm">ONSITE</span>
                  </label>
                </div>
              </div>
            </section>

            {/* โซนที่ 3: งบประมาณ และการตั้งค่า */}
            <section className="space-y-5">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <span className="text-xl">💰</span>
                <h2 className="text-lg font-black text-gray-800">งบประมาณและการตั้งค่า</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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

                <div>
                  <label className="block text-xs md:text-sm font-black text-gray-700 mb-2">วันหมดอายุประกาศ (สูงสุด 3 วัน)</label>
                  <input 
                    type="date" name="deadline" required
                    value={formData.deadline} onChange={handleInputChange}
                    min={getTodayDate()}
                    max={getDefaultDeadline()}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 focus:bg-white focus:ring-2 focus:ring-[#0047FF] outline-none cursor-pointer"
                  />
                  <p className="text-[10px] text-blue-500 mt-1 font-bold">เพื่อความรวดเร็ว ระบบกำหนดให้โพสต์มีอายุไม่เกิน 3 วันค่ะ</p>
                </div>
              </div>

              {/* 🌟 Toggle ผู้ว่าจ้างไม่ระบุตัวตน */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex items-start md:items-center justify-between gap-4 mt-2">
                <div>
                  <h3 className="text-sm font-black text-gray-800">โพสต์แบบไม่ระบุตัวตน (Anonymous)</h3>
                  <p className="text-xs font-bold text-gray-500 mt-0.5">ซ่อนชื่อและรูปโปรไฟล์ของคุณจากประกาศงานนี้</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input 
                    type="checkbox" 
                    name="is_anonymous" 
                    checked={formData.is_anonymous} 
                    onChange={handleInputChange} 
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0047FF]"></div>
                </label>
              </div>
            </section>

            {/* Submit Button */}
            <div className="pt-6 border-t border-gray-100">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-[#0047FF] hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-200 active:scale-95 transition-all flex justify-center items-center gap-2 text-base"
              >
                {loading ? (
                  <span className="animate-spin text-xl">⏳</span>
                ) : (
                  <>✨ โพสต์ประกาศงาน</>
                )}
              </button>
              <p className="text-center text-[11px] font-bold text-gray-400 mt-4">
                การโพสต์งานฟรี ไม่มีค่าธรรมเนียม จนกว่าจะตกลงจ้างงาน
              </p>
            </div>

          </form>
        </main>
      </div>
    </div>
  );
}
