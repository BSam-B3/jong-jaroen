"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { shopService, Shop } from '../../../services/shopService';

export default function ShopDetailPage() {
  const { id } = useParams();
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    if (id) {
      shopService.getShopById(id as string).then(setShop);
      shopService.getProductsByShop(id as string).then(setProducts);
    }
  }, [id]);

  if (!shop) return <div className="p-10 text-white">กำลังโหลดข้อมูลร้านค้า...</div>;

  return (
    <div className="bg-black min-h-screen text-white pb-20">
      {/* Header ร้านค้า */}
      <div className="p-6 bg-[#111] border-b border-[#333]">
        <h1 className="text-3xl font-bold text-[#deff9a]">{shop.name}</h1>
        <p className="text-gray-400 mt-2">{shop.description}</p>
      </div>

      {/* รายการสินค้า */}
      <div className="p-4 grid grid-cols-1 gap-4">
        <h2 className="text-xl font-bold mt-4 mb-2">เมนู/บริการ</h2>
        {products.map((product) => (
          <div key={product.id} className="bg-[#1a1a1a] p-4 rounded-2xl flex justify-between items-center border border-[#333]">
            <div>
              <h3 className="font-bold text-lg">{product.name}</h3>
              <p className="text-sm text-gray-400">{product.description}</p>
              <div className="mt-2">
                <span className="text-[#deff9a] font-bold text-xl">฿{product.display_price}</span>
                <span className="text-xs text-gray-500 ml-2">(รวมค่าบริการแอปแล้ว)</span>
              </div>
            </div>
            <button className="bg-[#deff9a] text-black px-4 py-2 rounded-xl font-bold">
              เพิ่มลงตะกร้า
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
