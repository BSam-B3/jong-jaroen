"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/app/contexts/CartContext';
// ✅ เจมเพิ่ม Import ตรงนี้ให้แล้วค่ะ รอบที่แล้วลืมจุดนี้เอง ขอโทษนะจ๊ะบีสาม
import BottomNav from '@/app/components/BottomNav';

export default function PublicShopCardPage() {
  const { id } = useParams();
  const router = useRouter();
  const { addToCart, cart } = useCart();
  
  const [shop, setShop] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShopAndProducts = async () => {
      const { data: shopData } = await supabase.from('shops').select('*').eq('id', id).single();
      const { data: productData } = await supabase.from('products').select('*').eq('shop_id', id);
      setShop(shopData);
      setProducts(productData || []);
      setLoading(false);
    };
    fetchShopAndProducts();
  }, [id]);

  const handleAddToCart = (product: any) => {
    // ✅ ส่งข้อมูลให้ครบตาม Type 'Product' ที่ระบบตะกร้าต้องการ
    addToCart({
      id: product.id,
      shop_id: shop.id,
      name: product.name,
      base_price: product.base_price,
      category_id: product.category_id || '',
      description: product.description || '',
      image_url: product.image_url || '',
      is_available: product.is_available ?? true
    });
    alert(`เพิ่ม ${product.name} ลงตะกร้าแล้วค่ะ!`);
  };

  if (loading) return <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center font-black">กำลังโหลดหน้าร้านค้า...</div>;
  if (!shop) return <div className="p-10 text-center font-black">ไม่พบร้านค้านี้ในระบบค่ะ</div>;

  return (
    <div className="min-h-screen bg-[#F4F6F8] pb-32 flex justify-center font-sans">
      <div className="w-full max-w-2xl bg-[#F8FAFC] min-h-screen relative flex flex-col shadow-2xl">
        
        {/* ส่วนหัวร้านค้า */}
        <div className="relative h-56 bg-gray-900 rounded-b-[3rem] overflow-hidden">
          <img src={shop.logo_url || ''} className="w-full h-full object-cover opacity-60" alt="" />
          <button onClick={() => router.back()} className="absolute top-6 left-6 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white font-bold z-20">←</button>
          <div className="absolute bottom-6 left-6 text-white z-10">
            <h1 className="text-3xl font-black">{shop.name}</h1>
            <div className="flex gap-1 mt-1">
              {shop.categories?.map((cat: string) => (
                <span key={cat} className="text-[10px] bg-[#EE4D2D] px-2 py-0.5 rounded-md font-black">{cat}</span>
              ))}
            </div>
          </div>
        </div>

        <main className="p-5 flex-1">
          {/* สถานะร้านปิด */}
          {!shop.is_open && (
            <div className="bg-gray-100 p-4 rounded-2xl mb-6 text-center border-2 border-dashed border-gray-300 font-black text-gray-500">
               😴 ตอนนี้ร้านปิดอยู่ค่ะ ไว้กลับมาสั่งใหม่นะคะ
            </div>
          )}

          {/* รายการสินค้า */}
          <div className="space-y-4">
            {products.map(product => (
              <div key={product.id} className={`bg-white p-4 rounded-[2rem] border border-gray-100 flex gap-4 ${(!shop.is_open || !product.is_available) ? 'opacity-50 grayscale' : ''}`}>
                <img src={product.image_url || ''} className="w-20 h-20 rounded-2xl object-cover bg-gray-100" alt="" />
                <div className="flex-1 flex flex-col justify-between">
                  <p className="font-black text-gray-800">{product.name}</p>
                  <div className="flex justify-between items-end">
                    <span className="font-black text-[#EE4D2D]">{product.base_price}.-</span>
                    <button 
                      onClick={() => handleAddToCart(product)}
                      disabled={!shop.is_open || !product.is_available}
                      className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all ${(!shop.is_open || !product.is_available) ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-[#EE4D2D] text-white shadow-lg active:scale-95'}`}
                    >
                      {product.is_available ? '+ ใส่ตะกร้า' : 'สินค้าหมด'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
        
        {/* แถบสรุปตะกร้า (ลอย) */}
        {cart.length > 0 && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-lg px-6 z-40">
            <button onClick={() => router.push('/marketplace/checkout')} className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black shadow-xl flex justify-between px-6 items-center">
              <span>ดูรายการในตะกร้า</span>
              <span className="bg-white/20 px-3 py-1 rounded-lg text-sm">{cart.reduce((acc, item) => acc + (item.base_price * item.quantity), 0)}.-</span>
            </button>
          </div>
        )}

        {/* ✅ ตัวปัญหาบรรทัดนี้ เจมเพิ่ม Import ด้านบนให้แล้วค่ะ */}
        <BottomNav />
      </div>
    </div>
  );
}
