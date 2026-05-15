"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
// เปลี่ยนมาใช้ทางลัด @/app/ ทั้ง 2 ตัวเลยค่ะ
import { shopService, Shop, Product } from '@/app/services/shopService';
import { useCart } from '@/app/contexts/CartContext';

export default function ShopDetailPage() {
  const { id } = useParams();
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const { addToCart, totalItems, totalPrice } = useCart();

  useEffect(() => {
    if (id) {
      shopService.getShopById(id as string).then(setShop);
      shopService.getProductsByShop(id as string).then(setProducts);
    }
  }, [id]);

  if (!shop) return <div className="p-10 text-white bg-black min-h-screen">กำลังโหลดข้อมูลร้านค้า...</div>;

  return (
    <div className="bg-black min-h-screen text-white pb-32 relative">
      <div className="p-6 bg-[#111] border-b border-[#333]">
        <h1 className="text-3xl font-bold text-[#deff9a]">{shop.name}</h1>
        <p className="text-gray-400 mt-2">{shop.description}</p>
      </div>

      <div className="p-4 grid grid-cols-1 gap-4">
        <h2 className="text-xl font-bold mt-4 mb-2">เมนู/บริการ</h2>
        {products.map((product) => (
          <div key={product.id} className="bg-[#1a1a1a] p-4 rounded-2xl flex justify-between items-center border border-[#333]">
            <div>
              <h3 className="font-bold text-lg">{product.name}</h3>
              <p className="text-sm text-gray-400">{product.description}</p>
              <div className="mt-2">
                <span className="text-[#deff9a] font-bold text-xl">{product.display_price} บาท</span>
              </div>
            </div>
            <button 
              onClick={() => addToCart(product)}
              className="bg-[#deff9a] text-black px-4 py-2 rounded-xl font-bold active:scale-95 transition-transform"
            >
              เพิ่ม
            </button>
          </div>
        ))}
      </div>

      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black to-transparent">
          <div className="bg-[#deff9a] text-black p-4 rounded-2xl flex justify-between items-center shadow-lg shadow-[#deff9a]/20">
            <div>
              <p className="font-bold">ตะกร้าของคุณ ({totalItems} รายการ)</p>
              <p className="text-sm">รวม {totalPrice} บาท</p>
            </div>
            <button className="bg-black text-[#deff9a] px-6 py-2 rounded-xl font-bold">
              ชำระเงิน
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
