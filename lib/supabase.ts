import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 🛡️ อัปเกรดมาใช้ Browser Client เพื่อความปลอดภัยและรองรับ Next.js SSR
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

// ==========================================
// Types for Jong Jaroen (จงเจริญ)
// ==========================================

export type Profile = {
  id: string;
  full_name: string;
  role: 'freelancer' | 'customer' | 'admin' | 'super_admin'; // เจมแอบเติม role แอดมินให้ค่ะ
  location: string;
  created_at: string;
};

export type Service = {
  id: string;
  provider_id: string;
  title: string;
  price_thb: number;
  category: string;
  created_at: string;
};

export type Job = {
  id: string;
  customer_id: string;
  service_id: string;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled' | 'disputed'; // เจมปรับให้ตรงกับฐานข้อมูลจริงของเรา
  lottery_number: string | null;
  total_price_thb: number;
  created_at: string;
};
