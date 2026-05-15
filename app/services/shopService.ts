import { createClient } from '@supabase/supabase-js';

// 1. นิยามข้อมูล (Interfaces)
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

export interface Product {
  id: string;
  shop_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  base_price: number;
  display_price?: number; // ราคาที่บวก 5% แล้ว
  image_url: string | null;
  is_available: boolean;
}

// 2. ตั้งค่า Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// 3. ฟังก์ชันดึงข้อมูล (Services)
export const shopService = {
  // ดึงร้านค้าทั้งหมด (หน้าตลาด)
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
  },

  // ดึงข้อมูลร้านค้าเดียว (หน้ารายละเอียด)
  getShopById: async (id: string): Promise<Shop | null> => {
    const { data, error } = await supabase
      .from('shops')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return data;
  },

  // ดึงสินค้าในร้าน พร้อมคำนวณ Markup 5%
  getProductsByShop: async (shopId: string): Promise<Product[]> => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('shop_id', shopId)
      .eq('is_available', true);

    if (error) return [];
    
    // คำนวณราคาสุทธิ (ราคาหน้าร้าน + 5% ค่าบริการแอป)
    return data.map(product => ({
      ...product,
      display_price: Math.ceil(product.base_price * 1.05) 
    }));
  }
};
