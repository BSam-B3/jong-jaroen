import { supabase } from '../lib/supabase'; // สมมติว่าไฟล์ supabase อยู่ในโฟลเดอร์ lib
import { Shop } from '../types/shop';

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
