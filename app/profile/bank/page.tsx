'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function BankAccountPage() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // States สำหรับข้อมูลบัญชี
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [kycStatus, setKycStatus] = useState<string>('none');
  const [fullName, setFullName] = useState('');

  useEffect(() => {
    loadUserData();
  }, []);

  async function loadUserData() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; } 
      setCurrentUser(user);
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('kyc_status, bank_name, bank_account_number, bank_account_name, full_name')
        .eq('id', user.id).single();
      
      if (profile) {
        setKycStatus(profile.kyc_status || 'none');
        setFullName(profile.full_name || '');
        if (profile.bank_name) setBankName(profile.bank_name);
        if (profile.bank_account_number) setBankAccount(profile.bank_account_number);
        // ถ้าไม่เคยตั้งชื่อบัญชี ให้ดึงชื่อจริงจาก Profile มาเป็นค่าเริ่มต้น
        if (profile.bank_account_name) {
          setBankAccountName(profile.bank_account_name);
        } else if (profile.full_name) {
          setBankAccountName(profile.full_name);
        }
      }
    } catch (_e) {}
    setLoading(false);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    // Validate
    if (bankAccount.length < 10) {
      setError('กรุณากรอกเลขบัญชีให้ถูกต้อง (อย่างน้อย 10 หลัก)');
      return;
    }
    if (bankAccountName !== fullName && fullName !== '') {
       // แจ้งเตือนแต่ไม่บล็อก เผื่อสะกดผิดนิดหน่อย แต่ Admin จะเห็นตอนตรวจ
       console.warn('ชื่อบัญชีไม่ตรงกับชื่อ KYC');
    }

    setIsSubmitting(true);
    setError('');
    setSuccessMsg('');

    try {
      // อัปเดตข้อมูลบัญชีลง profiles
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({
          bank_name: bankName,
          bank_account_number: bankAccount,
          bank_account_name: bankAccountName,
        })
        .eq('id', currentUser.id);

      if (updateErr) throw updateErr;

      setSuccessMsg('บันทึกข้อมูลบัญชีรับเงินเรียบร้อยแล้วค่ะ');
      setTimeout(() => setSuccessMsg(''), 3000);
      
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
    setIsSubmitting(false);
  };

  // เช็คว่าบัญชีถูกล็อกหรือไม่ (ตามกฎ RLS ที่ C ออกแบบไว้)
  const isLocked = kycStatus === 'approved' || kycStatus === 'pending';

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-[#EE4D2D] text-center"><div className="text-4xl animate-bounce mb-2">🏦</div><p className="font-bold">กำลังโหลดข้อมูลบัญชี...</p></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center pb-24">
      <div className="w-full sm:max-w-2xl md:max-w-3xl bg-[#F4F6F8] min-h-screen relative flex flex-col shadow-xl">
        
        {/* 🟠 Header */}
        <header className="bg-gradient-to-br from-[#EE4D2D] to-[#FF7337] rounded-b-[2.5rem] p-6 pt-12 shadow-sm relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <button onClick={() => router.back()} className="text-white font-bold text-lg active:scale-90 transition-transform">←</button>
            <div className="flex-1">
              <h1 className="text-xl font-black text-white tracking-tight">บัญชีรับเงิน</h1>
              <p className="text-[10px] text-white/90 font-medium mt-0.5">สำหรับผู้รับงาน (Freelance) เท่านั้น</p>
            </div>
            {isLocked && (
              <span className="bg-white/20 text-white text-[10px] px-3 py-1.5 rounded-full font-bold backdrop-blur-sm border border-white/30 flex items-center gap-1">
                🔒 ล็อกแล้ว
              </span>
            )}
          </div>
        </header>

        <main className="p-5 flex-1 relative z-20 -mt-2 space-y-4">
          
          {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-xs font-bold shadow-sm flex items-start gap-2 animate-fade-in"><span>⚠️</span> {error}</div>}
          {successMsg && <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-3 text-xs font-bold shadow-sm flex items-start gap-2 animate-fade-in"><span>✅</span> {successMsg}</div>}

          {/* 💡 Info Banner */}
          <div className={`rounded-2xl p-4 shadow-sm flex items-start gap-3 border ${isLocked ? 'bg-green-50 border-green-100' : 'bg-orange-50 border-orange-100'}`}>
            <span className="text-xl">{isLocked ? '✅' : '💡'}</span>
            <div className="text-xs font-medium leading-relaxed">
              {isLocked ? (
                <p className="text-green-800">บัญชีของคุณได้รับการอนุมัติแล้ว ระบบได้ทำการล็อกข้อมูลบัญชีเพื่อความปลอดภัย หากต้องการเปลี่ยนแปลงกรุณาติดต่อแอดมิน</p>
              ) : (
                <p className="text-gray-700">เพื่อป้องกันมิจฉาชีพ <strong className="text-[#EE4D2D]">ชื่อบัญชีธนาคารจะต้องตรงกับชื่อ-นามสกุลจริง</strong> ที่คุณลงทะเบียนไว้เท่านั้น (ชื่อปัจจุบัน: {fullName || 'ยังไม่ได้ระบุ'})</p>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="bg-white p-6 rounded-[1.5rem] border border-gray-200 shadow-sm space-y-5 relative overflow-hidden">
              
              {/* ถ้าล็อกแล้ว ให้มี Overlay บางๆ */}
              {isLocked && <div className="absolute inset-0 bg-gray-50/50 z-10 pointer-events-none"></div>}

              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1.5 ml-1">ธนาคาร <span className="text-red-500">*</span></label>
                <select 
                  value={bankName} 
                  onChange={e => setBankName(e.target.value)} 
                  disabled={isLocked}
                  className={`w-full border rounded-xl p-3.5 text-sm font-bold outline-none transition-all appearance-none ${isLocked ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed' : 'bg-gray-50 border-gray-200 text-gray-800 focus:border-[#EE4D2D] focus:bg-white focus:ring-1 focus:ring-[#EE4D2D]/50'}`}
                  required
                >
                  <option value="">-- เลือกธนาคาร --</option>
                  <option value="กสิกรไทย (KBANK)">กสิกรไทย (KBANK)</option>
                  <option value="ไทยพาณิชย์ (SCB)">ไทยพาณิชย์ (SCB)</option>
                  <option value="กรุงเทพ (BBL)">กรุงเทพ (BBL)</option>
                  <option value="กรุงไทย (KTB)">กรุงไทย (KTB)</option>
                  <option value="กรุงศรีอยุธยา (BAY)">กรุงศรีอยุธยา (BAY)</option>
                  <option value="ออมสิน (GSB)">ออมสิน (GSB)</option>
                  <option value="พร้อมเพย์ (PromptPay)">พร้อมเพย์ (PromptPay)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1.5 ml-1">ชื่อบัญชี (ภาษาไทย หรือ อังกฤษ) <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={bankAccountName} 
                  onChange={e => setBankAccountName(e.target.value)} 
                  disabled={isLocked}
                  placeholder="เช่น นาย สมชาย รักประแส"
                  className={`w-full border rounded-xl p-3.5 text-sm font-bold outline-none transition-all ${isLocked ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed' : 'bg-gray-50 border-gray-200 text-gray-800 focus:border-[#EE4D2D] focus:bg-white focus:ring-1 focus:ring-[#EE4D2D]/50'}`}
                  required 
                />
                {!isLocked && (
                  <p className="text-[9px] text-[#EE4D2D] mt-1.5 ml-1 font-medium">* ควรตรงกับชื่อจริง: {fullName}</p>
                )}
              </div>
              
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1.5 ml-1">เลขบัญชี / เบอร์พร้อมเพย์ <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={bankAccount} 
                  onChange={e => setBankAccount(e.target.value.replace(/\D/g,'').slice(0, 15))} 
                  disabled={isLocked}
                  placeholder="ตัวเลขเท่านั้น ไม่ต้องใส่ขีด (-)"
                  className={`w-full border rounded-xl p-3.5 text-base font-bold outline-none transition-all tracking-widest font-mono ${isLocked ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed' : 'bg-gray-50 border-gray-200 text-gray-800 focus:border-[#EE4D2D] focus:bg-white focus:ring-1 focus:ring-[#EE4D2D]/50'}`}
                  required 
                />
              </div>
            </div>

            {/* ปุ่ม Submit ซ่อนถ้าถูกล็อกไปแล้ว */}
            {!isLocked && (
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-[#EE4D2D] text-white py-4 rounded-full font-black text-base shadow-lg hover:bg-[#D74022] active:scale-[0.98] transition-all disabled:opacity-50 mt-4"
              >
                {isSubmitting ? '⏳ กำลังบันทึก...' : '💾 บันทึกบัญชีรับเงิน'}
              </button>
            )}

            {isLocked && (
              <button 
                type="button"
                onClick={() => alert('ฟีเจอร์ติดต่อ Admin กำลังพัฒนาค่ะ')}
                className="w-full bg-white text-gray-600 border border-gray-200 py-4 rounded-full font-bold text-sm shadow-sm hover:bg-gray-50 active:scale-[0.98] transition-all mt-4 flex items-center justify-center gap-2"
              >
                💬 ติดต่อ Admin เพื่อขอเปลี่ยนบัญชี
              </button>
            )}
          </form>

        </main>

        {/* 🧭 Bottom Nav */}
        <div className="fixed bottom-0 w-full sm:max-w-2xl md:max-w-3xl bg-white/95 backdrop-blur-md border-t border-gray-100 px-8 py-4 flex justify-between items-center shadow-[0_-4px_25px_rgba(0,0,0,0.06)] rounded-t-[2.5rem] z-50">
           <button onClick={() => router.push('/')} className="flex flex-col items-center gap-1 opacity-40"><span className="text-xl">🏠</span><span className="text-[10px] font-bold text-gray-500">หน้าแรก</span></button>
           <button onClick={() => router.push('/services')} className="flex flex-col items-center gap-1 opacity-40"><span className="text-xl">🛠️</span><span className="text-[10px] font-bold text-gray-500">บริการ</span></button>
           <button onClick={() => router.push('/win-online')} className="flex flex-col items-center gap-1 opacity-40"><span className="text-xl">📋</span><span className="text-[10px] font-bold text-gray-500">ด่วนนน</span></button>
           <button onClick={() => router.push('/history')} className="flex flex-col items-center gap-1 opacity-40"><span className="text-xl">📜</span><span className="text-[10px] font-bold text-gray-500">ประวัติ</span></button>
           <div className="flex flex-col items-center gap-1 scale-110"><span className="text-xl">👤</span><span className="text-[10px] font-bold text-[#EE4D2D]">ฉัน</span><div className="w-1.5 h-1.5 bg-[#EE4D2D] rounded-full shadow-sm"></div></div>
        </div>

      </div>
    </div>
  );
}
