import type { Metadata, Viewport } from 'next'
import './globals.css'
import BottomNav from '@/app/components/BottomNav'
// 1. เพิ่ม Import ตะกร้าสินค้า
import { CartProvider } from '../contexts/CartContext'

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
        {/* 2. คลุมเนื้อหาทั้งหมดของแอปด้วย CartProvider */}
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
