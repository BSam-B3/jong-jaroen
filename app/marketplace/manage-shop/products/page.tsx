"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import BottomNav from '@/app/components/BottomNav';

export default function ManageProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [shopId, setShopId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: shopData } = await supabase.from('shops').select('id').eq('owner_id', user.id).single();
      
      if (shopData) {
        setShopId(shopData.id);
        const { data } = await supabase.from('products').select('*').eq('shop_id', shopData.id);
        setProducts(data || []);
      }
      setLoading(false);
    };
    fetchProducts();
  }, []);

  const toggleAvailability = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase.from('products').update({ is_available: !currentStatus }).eq('id', id);
    if (!error) {
      setProducts(products.map(p => p.id === id ? { ...p, is_available: !currentStatus } : p));
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] pb-32">
      <header className="p-6 bg-white border-b flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-xl font-black">จัดการเมนูอาหาร</h1>
        <button className="bg-[#EE4D2D] text-white px-4 py-2 rounded-xl text-xs font-black">+ เพิ่มเมนู</button>
      </header>

      <main className="p-5 space-y-4">
        {products.map((product) => (
          <div key={product.id} className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl overflow-hidden shrink-0">
              <img src={product.image_url || ''} className="w-full h-full object-cover" alt="" />
            </div>
            <div className="flex-grow">
              <h3 className="font-bold text-gray-800">{product.name}</h3>
              <p className="text-[#EE4D2D] font-black text-sm">฿ {product.base_price}</p>
            </div>
            <button 
              onClick={() => toggleAvailability(product.id, product.is_available)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter ${
                product.is_available ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
              }`}
            >
              {product.is_available ? 'เปิดขายอยู่' : 'ปิดการขาย'}
            </button>
          </div>
        ))}
      </main>

      <BottomNav />
    </div>
  );
}
