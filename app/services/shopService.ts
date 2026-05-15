import { createClient } from '@supabase/supabase-js';

// 1. ใส่ Type ไว้ตรงนี้เลย จะได้หาเจอชัวร์ๆ
export interface Shop {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  location_lat: number | null;
  location_lng: number | null;
  address: string | null;
  logo_url: string | null;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
}

// 2. ตั้งค่า Supabase ตรงนี้เลย (ดึงจาก Environment Variables ของ Vercel)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// 3. ฟังก์ชันดึงข้อมูล
export const shopService = {
  getAllShops: async (): Promise<Shop[]> => {
    const { data, error } = await supabase
      .from('shops')
      .select('*')
      .eq('is_active', true)
      .order('is_verified', { ascending: false });

    if (error) {
      console.error('Error fetching shops:', error);
      return [];
    }
    return data || [];
  }
};
