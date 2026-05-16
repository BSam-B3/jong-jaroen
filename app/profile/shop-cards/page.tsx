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

  // State สำหรับฟอร์มลงทะเบียนร้าน
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

  // จัดการติ๊ก Checkbox
  const handleCategoryChange = (cat: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter(c => c !== cat)
        : [...prev.categories, cat]
    }));
  };

  // บันทึกการเปิดร้านใหม่
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
      is_open: true, // เปิดร้านทันที
      is_verified: false
    });

    if (!error) {
      alert('ลงทะเบียน Shop-Card สำเร็จค่ะ!');
      fetchShopData(); // รีเฟรชข้อมูล
    } else {
      alert('เกิดข้อผิดพลาด ลองอีกครั้งนะคะ');
    }
    setLoading(false);
  };

  // สลับสถานะเปิด/ปิดร้าน (Shop Status)
  const toggleShopStatus = async () => {
    const newStatus = !shop.is_open;
    const { error } = await supabase.from('shops').update({ is_open: newStatus }).eq('id', shop.id);
    if (!error) setShop({ ...shop, is_open: newStatus });
  };

  // สลับสถานะสินค้าหมดชั่วคราว (Out of Stock)
  const toggleProductStatus = async (productId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    const { error } = await supabase.from('products').update({ is_available: newStatus }).eq('id', productId);
    if (!error) {
      setProducts(products.map(p => p.id === productId ? { ...p, is_available: newStatus } : p));
    }
  };

  if (loading) return <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center"><div className="w-12 h-12 border-4 border-[#EE4D2D] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[#F4F6F8] pb-32 flex justify-center font-sans">
      <div className="w-full max-w-2xl bg-[#F8FAFC] min-h-screen relative flex flex-col shadow-2xl">
        
        <header className="bg-[#EE4D2D] p-6 pt-12 pb-8 rounded-b-[2rem] shadow-md flex items-center gap-4 text-white">
          <button onClick={() => router.back()} className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold">←</button>
          <div>
            <h1 className="text-2xl font-black">{shop ? 'จัดการ Shop-Card' : 'เปิดร้านค้าใหม่'}</h1>
            <p className="text-xs font-bold opacity-80">พื้นที่สำหรับเจ้าของร้าน</p>
          </div>
        </header>

        <main className="p-5 -mt-4 relative z-10">
          
          {!shop ? (
            /* ================= ฟอร์มลงทะเบียนร้านค้า (ยังไม่มีร้าน) ================= */
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-black text-gray-800 mb-4">สร้างโปรไฟล์ร้านค้าของคุณ</h2>
              <form onSubmit={handleRegisterShop} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">ชื่อร้านค้า</label>
                  <input required className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:border-[#EE4D2D] border border-transparent" placeholder="เช่น ร้านป้าแจ๋ว ของชำ" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">รายละเอียด / คำแนะนำร้าน</label>
                  <textarea className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:border-[#EE4D2D] border border-transparent" placeholder="บอกจุดเด่นของร้านคุณ..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">ประเภทร้านค้า (เลือกได้หลายข้อ)</label>
                  <div className="grid grid-cols-2 gap-2">
                    {CATEGORY_OPTIONS.map(cat => (
                      <label key={cat} className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${formData.categories.includes(cat) ? 'border-[#EE4D2D] bg-orange-50 text-[#EE4D2D]' : 'border-gray-100 bg-white text-gray-600'}`}>
                        <input type="checkbox" className="hidden" checked={formData.categories.includes(cat)} onChange={() => handleCategoryChange(cat)} />
                        <div className={`w-4 h-4 rounded-sm border flex items-center justify-center ${formData.categories.includes(cat) ? 'bg-[#EE4D2D] border-[#EE4D2D]' : 'border-gray-300'}`}>
                          {formData.categories.includes(cat) && <span className="text-white text-[10px]">✓</span>}
                        </div>
                        <span className="text-sm font-bold">{cat}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">ลิงก์รูปร้าน (URL)</label>
                  <input className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:border-[#EE4D2D] border border-transparent" placeholder="https://..." value={formData.logo_url} onChange={e => setFormData({...formData, logo_url: e.target.value})} />
                </div>
                <button className="w-full py-4 bg-[#EE4D2D] text-white rounded-2xl font-black text-lg mt-4 active:scale-95 transition-transform shadow-lg shadow-[#EE4D2D]/20">ลงทะเบียนเปิดร้านเลย!</button>
              </form>
            </div>
          ) : (
            /* ================= แดชบอร์ดจัดการร้าน (มีร้านแล้ว) ================= */
            <div className="space-y-6">
              
              {/* ระบบเปิด/ปิดร้าน */}
              <div className={`p-6 rounded-3xl border-2 transition-all ${shop.is_open ? 'bg-white border-[#EE4D2D]' : 'bg-gray-100 border-gray-300'} flex items-center justify-between shadow-sm`}>
                <div>
                  <h2 className="text-lg font-black text-gray-800">สถานะร้านค้า</h2>
                  <p className={`text-sm font-bold ${shop.is_open ? 'text-[#EE4D2D]' : 'text-gray-500'}`}>
                    {shop.is_open ? '🟢 ร้านเปิด รับออเดอร์อยู่' : '⚫ ร้านปิดพักผ่อน'}
                  </p>
                </div>
                <button 
                  onClick={toggleShopStatus}
                  className={`relative w-16 h-8 rounded-full transition-colors duration-300 ${shop.is_open ? 'bg-[#EE4D2D]' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-transform duration-300 ${shop.is_open ? 'left-9' : 'left-1'}`}></div>
                </button>
              </div>

              {/* หมวดหมู่ร้านค้าของฉัน */}
              <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase mb-3">หมวดหมู่ที่ขาย</p>
                <div className="flex flex-wrap gap-2">
                  {shop.categories?.map((cat: string) => (
                    <span key={cat} className="bg-orange-50 text-[#EE4D2D] px-3 py-1 rounded-full text-xs font-black border border-orange-100">{cat}</span>
                  ))}
                  {(!shop.categories || shop.categories.length === 0) && <span className="text-sm text-gray-400 font-bold">ยังไม่ได้เลือกหมวดหมู่</span>}
                </div>
              </div>

              {/* ระบบจัดการสินค้า */}
              <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-black text-gray-800">เมนู / สินค้าในร้าน</h2>
                  <button onClick={() => router.push('/marketplace/manage-shop/products/add')} className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded-lg font-bold">+ เพิ่ม</button>
                </div>
                
                <div className="space-y-3">
                  {products.map(product => (
                    <div key={product.id} className={`flex items-center gap-3 p-3 rounded-2xl border ${product.is_available ? 'bg-white border-gray-100' : 'bg-gray-50 border-gray-200 grayscale opacity-60'}`}>
                      <img src={product.image_url} className="w-12 h-12 rounded-xl object-cover" alt="" />
                      <div className="flex-1">
                        <p className="font-black text-sm text-gray-800 line-clamp-1">{product.name}</p>
                        <p className="text-[#EE4D2D] font-black text-xs">{product.base_price} บาท</p>
                      </div>
                      <button 
                        onClick={() => toggleProductStatus(product.id, product.is_available)}
                        className={`text-[10px] font-black px-3 py-1.5 rounded-lg ${product.is_available ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}
                      >
                        {product.is_available ? 'มีของ' : 'หมดชั่วคราว'}
                      </button>
                    </div>
                  ))}
                  {products.length === 0 && <p className="text-center text-sm text-gray-400 py-4 font-bold">ยังไม่มีสินค้า กดปุ่มเพิ่มได้เลยค่ะ</p>}
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
