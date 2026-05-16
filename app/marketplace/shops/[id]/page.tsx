"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/app/contexts/CartContext';

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
    // โค้ดเดิมของระบบตะกร้าคุณ
    addToCart({
      id: product.id,
      shop_id: shop.id,
      shop_name: shop.name,
      name: product.name,
      base_price: product.base_price,
      display_price: product.base_price,
      quantity: 1
    });
    alert(`เพิ่ม ${product.name} ลงตะกร้าแล้วค่ะ!`);
  };

  if (loading) return <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center"><div className="w-12 h-12 border-4 border-[#EE4D2D] border-t-transparent rounded-full animate-spin" /></div>;
  if (!shop) return <div className="p-10 text-center">ไม่พบร้านค้านี้</div>;

  return (
    <div className="min-h-screen bg-[#F4F6F8] pb-32 flex justify-center font-sans">
      <div className="w-full max-w-2xl bg-[#F8FAFC] min-h-screen relative flex flex-col shadow-2xl">
        
        {/* รูปปกและโปรไฟล์ร้านค้า (The Shop-Card Header) */}
        <div className="relative h-64 bg-gray-900 rounded-b-[3rem] overflow-hidden">
          <img src={shop.logo_url} className="w-full h-full object-cover opacity-50" alt="" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
          
          <button onClick={() => router.back()} className="absolute top-6 left-6 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white font-bold">←</button>

          <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
            <div>
              {/* ป้ายประเภทร้านค้า */}
              <div className="flex gap-2 mb-2">
                {shop.categories?.map((cat: string) => (
                  <span key={cat} className="bg-[#EE4D2D] text-white text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">{cat}</span>
                ))}
              </div>
              <h1 className="text-3xl font-black text-white">{shop.name}</h1>
              <p className="text-sm text-gray-300 font-bold mt-1">{shop.description}</p>
            </div>
          </div>
        </div>

        <main className="p-5">
          {/* แจ้งเตือนสถานะร้าน */}
          {!shop.is_open && (
            <div className="bg-gray-200 text-gray-600 p-4 rounded-2xl mb-6 font-black flex items-center justify-center gap-2 border border-gray-300">
              <span className="text-xl">😴</span> ขณะนี้ร้านปิดพักผ่อน ไม่สามารถสั่งซื้อได้ค่ะ
            </div>
          )}

          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-black text-gray-800">เมนูแนะนำ</h2>
            <div className="bg-orange-100 text-[#EE4D2D] px-3 py-1 rounded-full text-xs font-black">
              🛒 ในตะกร้า: {cart.reduce((acc, item) => acc + item.quantity, 0)} ชิ้น
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {products.map(product => (
              <div key={product.id} className={`bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex gap-4 ${(!shop.is_open || !product.is_available) ? 'opacity-50 grayscale' : ''}`}>
                <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 bg-gray-100">
                  <img src={product.image_url} className="w-full h-full object-cover" alt="" />
                </div>
                <div className="flex-1 flex flex-col justify-between py-1">
                  <div>
                    <h3 className="font-black text-gray-800 text-base line-clamp-1">{product.name}</h3>
                    <p className="text-xs text-gray-400 font-bold mt-1 line-clamp-2">{product.description}</p>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-[#EE4D2D] font-black text-lg">{product.base_price} บาท</span>
                    
                    <button 
                      onClick={() => handleAddToCart(product)}
                      disabled={!shop.is_open || !product.is_available}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                        (!shop.is_open || !product.is_available) 
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                        : 'bg-[#EE4D2D] text-white active:scale-95 shadow-md shadow-[#EE4D2D]/30'
                      }`}
                    >
                      {!product.is_available ? 'สินค้าหมด' : '+ หยิบใส่ตะกร้า'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {products.length === 0 && <p className="text-center text-gray-400 font-bold py-10">ร้านนี้ยังไม่มีสินค้าค่ะ</p>}
          </div>

          {/* ปุ่มไปหน้าตะกร้า */}
          {cart.length > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl px-5 z-50">
              <button 
                onClick={() => router.push('/marketplace/checkout')}
                className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black text-lg shadow-2xl flex justify-between px-6 items-center"
              >
                <span>ดูตะกร้าของคุณ</span>
                <span className="bg-white text-gray-900 px-3 py-1 rounded-lg text-sm">{cart.reduce((acc, item) => acc + (item.base_price * item.quantity), 0)} บาท ›</span>
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
