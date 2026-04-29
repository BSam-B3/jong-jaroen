import type { Metadata, Viewport } from 'next'
import './globals.css'
import BottomNav from '@/app/components/BottomNav'

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th">
      <body className="bg-gray-50 min-h-screen">
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
