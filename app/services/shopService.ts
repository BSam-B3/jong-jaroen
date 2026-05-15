import { supabase } from '@/lib/supabase'; // สมมติว่ามีตัวแปร supabase client อยู่แล้ว
import { Shop } from '@/types/shop';

export const shopService = {
  // ดึงรายชื่อร้านค้าทั้งหมด
  getAllShops: async (): Promise<Shop[]> => {
    const { data, error } = await supabase
      .from('shops')
      .select('*')
      .eq('is_active', true)
      .order('is_verified', { ascending: false }); // ให้ร้านที่ Verified (จ่าย 100 บาท) ขึ้นก่อน

    if (error) throw error;
    return data || [];
  },

  // ดึงข้อมูลสินค้าในร้าน พร้อมคำนวณ Markup 5%
  getProductsByShop: async (shopId: string) => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('shop_id', shopId)
      .eq('is_available', true);

    if (error) throw error;

    // ลอจิก Markup 5% ที่เราคุยกันไว้ (บวกเพิ่มจากราคาหน้าร้าน)
    return data.map(product => ({
      ...product,
      display_price: Math.ceil(product.base_price * 1.05) // ปัดเศษขึ้นให้ดูสวยงาม
    }));
  }
};
