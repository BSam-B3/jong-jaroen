'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface JobDetail {
  id: string;
  title: string;
  description: string;
  job_type: 'online' | 'onsite';
  category: string;
  status: 'open' | 'verifying_slip' | 'in_progress' | 'delivered' | 'completed' | 'cancelled';
  budget: number | null;
  created_at: string;
  employer_id: string;
  employer: {
    full_name: string;
    avatar_url: string;
  };
}

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<JobDetail | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // 🌟 States สำหรับ Modal ยื่นข้อเสนอ
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [isSubmittingProposal, setIsSubmittingProposal] = useState(false);
  const [proposalText, setProposalText] = useState('');
  const [proposalPrice, setProposalPrice] = useState('');
  const [proposalDuration, setProposalDuration] = useState('');

  useEffect(() => {
    const fetchJobDetail = async () => {
      if (!params?.id) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) setCurrentUser(session.user);

      // ดึงรายละเอียดงาน และ Join ข้อมูลผู้จ้างมาด้วย
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          employer:profiles!employer_id (full_name, avatar_url)
        `)
        .eq('id', params.id)
        .single();

      if (!error && data) {
        setJob(data as JobDetail);
      }
      setLoading(false);
    };

    fetchJobDetail();
  }, [params?.id, supabase]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', { 
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
  };

  const submitProposalData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      alert('กรุณาเข้าสู่ระบบก่อนยื่นข้อเสนอค่ะ');
      router.push(`/auth/login?next=/jobs/${job?.id}`);
      return;
    }

    setIsSubmittingProposal(true);
    
    const { error } = await supabase.rpc('submit_proposal_with_notification', {
      p_job_id: job?.id,
      p_cover_letter: proposalText,
      p_proposed_price: proposalPrice ? Number(proposalPrice) : null,
      p_duration_days: proposalDuration ? Number(proposalDuration) : null,
    });
    
    setIsSubmittingProposal(false);
    
    if (error) { 
      alert('เกิดข้อผิดพลาด: ' + error.message); 
      return; 
    }
    
    alert('ส่งโปรไฟล์สำเร็จ! 🚀 ระบบได้ทำการแจ้งเตือนผู้จ้างเรียบร้อยแล้วค่ะ');
    setIsProposalModalOpen(false);
    router.push('/my-jobs'); // ส่งกลับไปหน้างานของฉันเพื่อดูสถานะ
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center font-sans">
        <div className="w-12 h-12 border-4 border-[#0047FF] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center font-sans p-5">
        <div className="text-6xl mb-4 grayscale opacity-40">📭</div>
        <h1 className="text-xl font-black text-gray-800 mb-2">ไม่พบข้อมูลงานนี้</h1>
        <p className="text-sm font-bold text-gray-400 mb-6">งานนี้อาจถูกลบ หรือคุณไม่มีสิทธิ์เข้าถึงค่ะ</p>
        <button onClick={() => router.back()} className="bg-gray-800 text-white px-6 py-3 rounded-full font-black text-sm shadow-md">
          ← กลับไปหน้าก่อนหน้า
        </button>
      </div>
    );
  }

  const isMyJob = currentUser?.id === job.employer_id;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-28 md:pb-10 selection:bg-blue-100">
      
      {/* 🟢 Navigation Top Bar */}
      <nav className="sticky top-0 z-[50] bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 py-3 md:py-4 flex items-center gap-4 shadow-sm">
        <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200 transition-colors">
          ←
        </button>
        <div className="flex-1 truncate">
           <h1 className="font-black text-gray-800 truncate text-sm md:text-base">รายละเอียดงาน</h1>
           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Job Details</p>
        </div>
        <button className="w-10 h-10 flex items-center justify-center bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors shrink-0" title="แชร์งาน">
          🔗
        </button>
      </nav>

      <main className="max-w-3xl mx-auto md:pt-8 md:px-5 w-full">
        
        {isMyJob && (
          <div className="mx-4 md:mx-0 mt-4 md:mt-0 mb-6 bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-center gap-3">
            <span className="text-2xl">👑</span>
            <div>
              <p className="text-sm font-black text-blue-900">นี่คืองานที่คุณประกาศไว้</p>
              <p className="text-[10px] text-blue-700 font-bold mt-0.5">คุณสามารถดูผู้เสนอตัวได้ในเมนู "งานของฉัน"</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-gray-100 m-4 md:m-0">
          
          {/* Header Section */}
          <div className="flex items-center gap-2 mb-4">
            <span className={`text-[10px] font-black px-3 py-1.5 rounded-lg text-white shadow-sm tracking-widest ${job.job_type === 'onsite' ? 'bg-[#EE4D2D]' : 'bg-[#0047FF]'}`}>
              {job.job_type === 'onsite' ? '📍 ONSITE' : '💻 ONLINE'}
            </span>
            <span className="text-[10px] font-black text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200 uppercase">
              หมวดหมู่: {job.category}
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight mb-4">{job.title}</h1>
          
          <div className="flex items-center gap-3 pb-6 border-b border-gray-100 mb-6">
            <div className="w-12 h-12 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
              {job.employer?.avatar_url ? (
                <img src={job.employer.avatar_url} alt="Employer" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xl">👤</div>
              )}
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">ประกาศโดย</p>
              <p className="text-sm font-black text-gray-800">{job.employer?.full_name || 'ผู้จ้างนิรนาม'}</p>
              <p className="text-[10px] text-gray-400 font-medium mt-0.5">โพสต์เมื่อ {formatDate(job.created_at)}</p>
            </div>
          </div>

          {/* Budget Section */}
          <div className="bg-blue-50/50 rounded-2xl p-5 mb-8 border border-blue-50 flex justify-between items-center">
            <div>
              <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest mb-1">งบประมาณที่ตั้งไว้</p>
              <p className="text-3xl font-black text-[#0047FF]">
                {job.budget ? `฿${job.budget.toLocaleString()}` : 'รอช่างเสนอราคา'}
              </p>
            </div>
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl shadow-sm border border-gray-100">
              💰
            </div>
          </div>

          {/* Description Section */}
          <h3 className="text-sm font-black text-gray-800 mb-3 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-[#0047FF] rounded-full"></span>
            รายละเอียดและขอบเขตงาน
          </h3>
          <div className="text-sm text-gray-600 font-medium leading-relaxed whitespace-pre-wrap bg-gray-50 p-5 rounded-2xl border border-gray-100 min-h-[150px]">
            {job.description || 'ไม่มีคำอธิบายเพิ่มเติม'}
          </div>

        </div>
      </main>

      {/* 📱 Floating Bottom Bar for Action */}
      {!isMyJob && job.status === 'open' && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 p-4 md:p-6 z-[100] flex justify-center shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
          <div className="w-full max-w-3xl flex items-center gap-4">
            <div className="hidden md:block flex-1">
              <p className="text-sm font-black text-gray-800">สนใจงานนี้ใช่ไหมคะ?</p>
              <p className="text-[11px] font-bold text-gray-400 mt-0.5">ยื่นข้อเสนอของคุณให้ผู้จ้างพิจารณาได้เลย</p>
            </div>
            <button 
              onClick={() => {
                setProposalPrice(job.budget ? String(job.budget) : '');
                setIsProposalModalOpen(true);
              }}
              className="w-full md:w-auto flex-1 md:flex-none px-8 py-4 bg-[#0047FF] text-white rounded-2xl font-black text-sm md:text-base shadow-lg shadow-blue-200 active:scale-95 transition-all flex justify-center items-center gap-2 hover:bg-[#0038cc]"
            >
              📝 ยื่นโปรไฟล์เสนอตัว
            </button>
          </div>
        </div>
      )}

      {/* 🌟 Modal: ยื่นข้อเสนอ (ฟรีแลนซ์/ช่าง) */}
      {isProposalModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-end md:items-center justify-center bg-blue-900/40 backdrop-blur-sm animate-fade-in px-0 md:px-5">
          <div className="bg-white w-full max-w-xl rounded-t-[2rem] md:rounded-[2rem] p-6 md:p-8 max-h-[90vh] overflow-y-auto pb-10 shadow-2xl relative">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl md:text-2xl font-black text-gray-800">ยื่นโปรไฟล์เสนอตัว 📝</h2>
                <p className="text-xs text-gray-500 font-bold mt-1">อธิบายว่าทำไมคุณถึงเหมาะกับงานนี้</p>
              </div>
              <button onClick={() => setIsProposalModalOpen(false)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors shrink-0">✕</button>
            </div>

            <form onSubmit={submitProposalData} className="space-y-5">
              
              <div>
                <label className="block text-[11px] font-black text-gray-500 uppercase mb-2">แนะนำตัวและผลงานที่ผ่านมา</label>
                <textarea 
                  required 
                  rows={5} 
                  value={proposalText} 
                  onChange={(e) => setProposalText(e.target.value)} 
                  placeholder="ทักทายผู้จ้าง และบอกเล่าประสบการณ์ของคุณให้เขามั่นใจ..." 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-medium outline-none focus:border-[#0047FF] transition-colors resize-none"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-black text-gray-500 uppercase mb-2">ราคาที่เสนอ (บาท)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      min="0" 
                      required 
                      value={proposalPrice} 
                      onChange={(e) => setProposalPrice(e.target.value)} 
                      placeholder="0" 
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-black text-[#0047FF] outline-none focus:border-[#0047FF] transition-colors pr-10" 
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">฿</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-black text-gray-500 uppercase mb-2">ระยะเวลาทำ (วัน)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      min="1" 
                      required 
                      value={proposalDuration} 
                      onChange={(e) => setProposalDuration(e.target.value)} 
                      placeholder="เช่น 3" 
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-black outline-none focus:border-[#0047FF] transition-colors pr-10" 
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">วัน</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3 mt-2">
                <span className="text-lg">💡</span>
                <p className="text-[10px] text-blue-800 font-bold leading-relaxed">ข้อมูลของคุณจะถูกส่งให้ผู้จ้างพิจารณา หากผู้จ้างสนใจจะทำการเปิดห้องแชทเพื่อสนทนากับคุณโดยตรงค่ะ</p>
              </div>

              <button 
                type="submit" 
                disabled={isSubmittingProposal} 
                className="w-full bg-gradient-to-r from-[#0047FF] to-[#0082FA] text-white font-black py-4 rounded-xl text-sm md:text-base mt-2 shadow-lg shadow-blue-200 active:scale-95 transition-all disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {isSubmittingProposal ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : 'ส่งโปรไฟล์ให้พิจารณา 🚀'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
