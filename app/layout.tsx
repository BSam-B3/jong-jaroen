import type { Metadata, Viewport } from 'next'
import './globals.css'
import BottomNav from '@/app/components/BottomNav'
import NotificationHandler from '@/app/components/NotificationHandler' // 🌟 1. เพิ่ม Import ระบบแจ้งเตือน
import { sbServer } from '@/lib/supabase/server' // 🌟 2. เพิ่ม Import สำหรับดึงข้อมูล Session

export const metadata: Metadata = {
  title: 'จงเจริญ | Jong Jaroen',
  description: 'Local Freelance Marketplace for Prasae Community by PandVHappiness',
}

// 🌟 เพิ่ม Viewport ตามที่ C แนะนำ เพื่อให้แอปเราดูเหมือนแอปจริงบนมือถือ
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#EE4D2D',
}

// 🌟 3. เปลี่ยนเป็น async function เพื่อให้ระบบเซิร์ฟเวอร์ดึงข้อมูลล็อกอินได้
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 🌟 4. ตรวจสอบว่าผู้ใช้ล็อกอินอยู่หรือไม่ เพื่อดึง userId ไปให้ระบบแจ้งเตือน
  const supabase = sbServer();
  const { data: { session } } = await supabase.auth.getSession();

  return (
    <html lang="th">
      <body className="bg-gray-50 min-h-screen">
        
        {/* 🌟 5. ฝังระบบแจ้งเตือนไว้หลังบ้าน (จะไม่แสดงเป็น UI รบกวนหน้าจอ) */}
        <NotificationHandler userId={session?.user?.id} />

        {/* pb-28 เพื่อเว้นที่ว่างด้านล่างไม่ให้ BottomNav บังเนื้อหา */}
        <main className="pb-28">
          {children}
        </main>
        
        {/* 🚩 หัวใจสำคัญ: เมื่อเราใส่ BottomNav ไว้ที่นี่แล้ว 
             หน้าอื่นๆ ห้ามใส่ซ้ำนะคะ ไม่งั้นมันจะซ้อนกัน 2 ชั้นค่ะ */}
        <BottomNav />
      </body>
    </html>
  )
}
