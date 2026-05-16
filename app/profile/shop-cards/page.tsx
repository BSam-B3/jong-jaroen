"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import BottomNav from '@/app/components/BottomNav';

const CATEGORY_OPTIONS = ['อาหารตามสั่ง', 'เครื่องดื่ม', 'ของชำ', 'ของฝาก', 'ขนมหวาน', 'วัตถุดิบสด'];

export default function ManageShopCardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [shop, setShop] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    logo_url: '',
    categories: [] as string[]
  });

  useEffect(() => {
    fetchShopData();
  }, []);

  const fetchShopData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth/login');
      return;
    }

    const { data: shopData } = await supabase.from('shops').select('*').eq('owner_id', user.id).single();
    
    if (shopData) {
      setShop(shopData);
      const { data: productData } = await supabase.from('products').select('*').eq('shop_id', shopData.id);
      setProducts(productData || []);
    }
    setLoading(false);
  };

  const handleCategoryChange = (cat: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter(c => c !== cat)
        : [...prev.categories, cat]
    }));
  };

  const handleRegisterShop = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase.from('shops').insert({
      owner_id: user?.id,
      name: formData.name,
      description: formData.description,
      logo_url: formData.logo_url,
      categories: formData.categories,
      is_open: true,
      is_verified: false
    });

    if (!error) {
      alert('ลงทะเบียนร้านค้าสำเร็จแล้วค่ะ!');
      fetchShopData();
    }
    setLoading(false);
  };

  const toggleShopStatus = async () => {
    const newStatus = !shop.is_open;
    await supabase.from('shops').update({ is_open: newStatus }).eq('id', shop.id);
    setShop({ ...shop, is_open: newStatus });
  };

  const toggleProductStatus = async (productId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    await supabase.from('products').update({ is_available: newStatus }).eq('id', productId);
    setProducts(products.map(p => p.id === productId ? { ...p, is_available: newStatus } : p));
  };

  if (loading) return <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center font-black">กำลังโหลดข้อมูลร้านค้า...</div>;

  return (
    <div className="min-h-screen bg-[#F4F6F8] pb-32 flex justify-center font-sans">
      <div className="w-full max-w-2xl bg-[#F8FAFC] min-h-screen relative flex flex-col shadow-2xl">
        
        <header className="bg-[#EE4D2D] p-6 pt-12 pb-8 rounded-b-[2rem] shadow-md flex items-center gap-4 text-white">
          <button onClick={() => router.back()} className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold">←</button>
          <h1 className="text-2xl font-black">{shop ? 'จัดการร้านค้าของคุณ' : 'ลงทะเบียนร้านค้า'}</h1>
        </header>

        <main className="p-5 -mt-4 relative z-10">
          {!shop ? (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <form onSubmit={handleRegisterShop} className="space-y-4">
                <div>
                  <label className="text-xs font-black text-gray-400 uppercase mb-1 block">ชื่อร้านค้า</label>
                  <input required className="w-full p-3 bg-gray-50 rounded-xl outline-none border border-gray-100" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-black text-gray-400 uppercase mb-2 block">หมวดหมู่ร้านค้า</label>
                  <div className="grid grid-cols-2 gap-2">
                    {CATEGORY_OPTIONS.map(cat => (
                      <button type="button" key={cat} onClick={() => handleCategoryChange(cat)} className={`p-3 rounded-xl border text-sm font-bold ${formData.categories.includes(cat) ? 'bg-orange-50 border-[#EE4D2D] text-[#EE4D2D]' : 'bg-white border-gray-100'}`}>
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
                <button className="w-full py-4 bg-[#EE4D2D] text-white rounded-2xl font-black">เปิดร้านค้าเลย!</button>
              </form>
            </div>
          ) : (
            <div className="space-y-6">
              <div className={`p-6 rounded-3xl border-2 flex items-center justify-between ${shop.is_open ? 'bg-white border-[#EE4D2D]' : 'bg-gray-100 border-gray-300'}`}>
                <div>
                  <h2 className="text-lg font-black">{shop.is_open ? '🟢 ร้านกำลังเปิด' : '⚫ ร้านปิดอยู่'}</h2>
                  <p className="text-xs font-bold text-gray-400 italic">ลูกค้าจะเห็นสถานะนี้ในหน้าตลาด</p>
                </div>
                <button onClick={toggleShopStatus} className={`w-14 h-7 rounded-full relative transition-colors ${shop.is_open ? 'bg-[#EE4D2D]' : 'bg-gray-400'}`}>
                  <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${shop.is_open ? 'left-8' : 'left-1'}`}></div>
                </button>
              </div>

              <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
                <h2 className="font-black mb-4 flex justify-between">
                  เมนูในร้าน <span>{products.length}</span>
                </h2>
                <div className="space-y-3">
                  {products.map(p => (
                    <div key={p.id} className="flex items-center gap-3 p-2 border-b border-gray-50 last:border-0">
                      <img src={p.image_url} className="w-10 h-10 rounded-lg object-cover" />
                      <div className="flex-1 font-bold text-sm">{p.name}</div>
                      <button onClick={() => toggleProductStatus(p.id, p.is_available)} className={`text-[10px] px-3 py-1 rounded-full font-black ${p.is_available ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                        {p.is_available ? 'มีของ' : 'หมด'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
