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
  base_price: number; // ราคาหน้าร้าน
  display_price: number; // ราคาที่บวก Markup แล้ว (3-5%)
  image_url: string | null;
  is_available: boolean;
}
