'use client'; 

import { useState, useEffect } from 'react'; 
import { useRouter } from 'next/navigation'; 
import { supabase } from '@/lib/supabase'; 
import BottomNav from '@/app/components/BottomNav'; 

export default function ProfilePage() {
  const router = useRouter(); 
  const [userProfile, setUserProfile] = useState<any>(null); 
  const [isLoading, setIsLoading] = useState(true); 

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession(); 
        if (!session) {
          router.push('/auth/login'); 
          return; 
        } 

        const { data: profileData, error } = await supabase 
          .from('profiles') 
          .select('*') 
          .eq('id', session.user.id) 
          .single(); 

        if (error) throw error; 

        if (profileData) {
          setUserProfile({
            ...profileData, 
            initial: profileData.first_name ? profileData.first_name.charAt(0).toUpperCase() : '?', 
            formattedPhone: profileData.phone_number ? formatPhone(profileData.phone_number) : 'ยังไม่ระบุเบอร์โทร', 
            full_name: `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() || 'ผู้ใช้งาน', 
          }); 
        } 
      } catch (error) {
        console.error('Error fetching profile:', error); 
      } finally {
        setIsLoading(false); 
      } 
    }; 

    fetchUserProfile(); 
  }, [router]); 

  const formatPhone = (phone: string) => {
    let p = phone; 
    if (p.startsWith('66')) p = '0' + p.slice(2); 
    if (p.length === 10) return `${p.slice(0, 3)}-${p.slice(3, 6)}-${p.slice(6)}`; 
    return p; 
  }; 

  const handleSignOut = async () => {
    if (confirm('คุณต้องการออกจากระบบใช่หรือไม่?')) {
      await supabase.auth.signOut(); 
      router.push('/auth/login'); 
    } 
  }; 

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex justify-center pb-24 font-sans"> 
      <div className="w-full max-w-3xl bg-[#F4F6F8] min-h-screen relative flex flex-col shadow-2xl overflow-x-hidden border-x border-gray-100"> 
        
        {/* 🟠 Premium Header */} 
        <div className="m-4 bg-gradient-to-br from-[#EE4D2D] to-[#FF7337] rounded-[2.5rem] p-8 shadow-lg relative z-10 overflow-hidden"> 
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div> 
          <div className="flex items-center gap-6 relative z-20"> 
            <div className="w-20 h-20 bg-white rounded-3xl rotate-3 shadow-2xl flex items-center justify-center text-3xl font-black text-[#EE4D2D] relative border-4 border-white/30 transition-transform hover:rotate-0 cursor-pointer"> 
              {isLoading ? 
                <div className="w-full h-full bg-orange-50 animate-pulse rounded-2xl"></div> : 
                <span className="-rotate-3">{userProfile?.initial}</span>
              } 
              <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-2 shadow-lg border border-gray-100">
                <span className="text-[10px] block">✏️</span>
              </div> 
            </div> 
            <div className="text-white"> 
              {isLoading ? (
                <div className="space-y-3"> 
                  <div className="h-6 w-40 bg-white/30 rounded-lg animate-pulse"></div> 
                  <div className="h-4 w-24 bg-white/20 rounded-lg animate-pulse"></div> 
                </div> 
              ) : (
                <> 
                  <div className="flex items-center gap-2"> 
                    <h1 className="text-2xl font-black tracking-tight">{userProfile?.full_name}</h1> 
                    {userProfile?.national_id && <span className="bg-white/20 text-[8px] px-2 py-0.5 rounded-full backdrop-blur-md border border-white/30">Verified</span>} 
                  </div> 
                  <p className="text-white/80 text-xs font-bold mt-1 opacity-80">{userProfile?.formattedPhone}</p> 
                </> 
              )} 
            </div> 
          </div> 
        </div> 

        {/* 📋 เมนูเชื่อมต่อ */} 
        <div className="flex-1 overflow-y-auto px-6 space-y-6 pb-24"> 
          
          <div className="space-y-3"> 
            <h3 className="px-2 text-[11px] font-black text-gray-400 uppercase tracking-widest">ข้อมูลสมาชิก</h3> 
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-50 overflow-hidden"> 
              <MenuRow icon="👤" title="แก้ไขโปรไฟล์" subtitle="จัดการข้อมูลส่วนตัว" onClick={() => router.push('/profile/edit')} /> 
            </div> 
          </div> 

          <div className="space-y-3"> 
            <h3 className="px-2 text-[11px] font-black text-gray-400 uppercase tracking-widest">พาร์ทเนอร์จงเจริญ</h3> 
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-50 overflow-hidden"> 
              <MenuRow icon="🔍" title="ยืนยันตัวตน (KYC)" subtitle="ระบบความปลอดภัยและตัวตน" status={userProfile?.national_id ? '✅ เรียบร้อย' : '⏳ รอยืนยัน'} onClick={() => router.push('/profile/kyc')} /> 
              <MenuRow icon="🪪" title="แฟ้มเอกสาร & ใบอนุญาต" subtitle="ใบขับขี่และวุฒิการศึกษา" onClick={() => router.push('/profile/licenses')} /> 
              <MenuRow icon="🏦" title="บัญชีรับเงิน (Bank)" subtitle="ตั้งค่าช่องทางรับเงิน" onClick={() => router.push('/profile/bank')} /> 
            </div> 
          </div> 

          <div className="space-y-3"> 
            <h3 className="px-2 text-[11px] font-black text-gray-400 uppercase tracking-widest">ผลงาน</h3> 
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden"> 
              <MenuRow icon="🖼️" title="ใบประกาศ (Certificates)" subtitle="คลังผลงานของคุณ" onClick={() => router.push('/profile/certificate')} /> 
              <MenuRow icon="📋" title="เรซูเม่ (Portfolio)" subtitle="ประวัติการทำงาน PDF" onClick={() => router.push('/profile/portfolio')} /> 
            </div> 
          </div> 

          {/* ⚙️ ปุ่มลับสำหรับ Admin (จะโผล่เฉพาะคนที่เป็น super_admin หรือ admin) */}
          {(userProfile?.role === 'super_admin' || userProfile?.role === 'admin') && (
            <button 
              onClick={() => router.push('/admin')}
              className="w-full bg-gray-900 text-white py-5 rounded-[1.8rem] font-black text-sm shadow-xl flex items-center justify-center gap-2 hover:bg-black active:scale-95 transition-all"
            >
              <span className="text-lg">⚙️</span> จัดการระบบหลังบ้าน (Admin)
            </button>
          )}

          <button onClick={handleSignOut} className="w-full bg-white text-red-500 py-5 rounded-[1.8rem] font-black text-sm shadow-sm border border-red-50 active:scale-95 transition-all"> 
            🚪 ออกจากระบบ 
          </button> 
        </div> 

        <BottomNav /> 
      </div> 
    </div> 
  ); 
} 

function MenuRow({ icon, title, subtitle, onClick, status }: any) {
  return (
    <div onClick={onClick} className="flex items-center justify-between p-5 border-b border-gray-50 last:border-0 cursor-pointer hover:bg-orange-50/30 active:bg-orange-50 transition-all group"> 
      <div className="flex items-center gap-5"> 
        <div className="w-12 h-12 bg-gray-50 group-hover:bg-white rounded-2xl flex items-center justify-center text-xl shadow-inner border border-gray-100 shrink-0">{icon}</div> 
        <div> 
          <h4 className="text-sm font-black text-gray-800 leading-tight">{title}</h4> 
          <p className="text-[10px] text-gray-400 mt-1 leading-tight font-medium">{subtitle}</p> 
        </div> 
      </div> 
      <div className="flex items-center gap-3"> 
        {status && <span className="text-[8px] font-black bg-gray-100 px-3 py-1.5 rounded-xl text-gray-500">{status}</span>} 
        <span className="text-gray-300 text-2xl group-hover:text-[#EE4D2D] transition-colors leading-none">›</span> 
      </div> 
    </div> 
  ); 
}
