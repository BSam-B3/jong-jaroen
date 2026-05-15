import type { Metadata, Viewport } from 'next'
import './globals.css'
import BottomNav from '@/app/components/BottomNav'
// ใช้ทางลัด @/app/ แก้ปัญหาหาไฟล์ไม่เจอ
import { CartProvider } from '@/app/contexts/CartContext'

export const metadata: Metadata = {
  title: 'จงเจริญ | Jong Jaroen',
  description: 'Local Freelance Marketplace for Prasae Community by PandVHappiness',
}

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
        <CartProvider>
          <main className="pb-28">
            {children}
          </main>
          <BottomNav />
        </CartProvider>
      </body>
    </html>
  )
}
