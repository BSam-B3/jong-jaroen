"use client";
import { useEffect, useState } from "react";
// ✅ แก้ไข Path ให้ตรงตามโครงสร้างไฟล์ของบีสาม
import { enablePush, disablePush } from "../lib/push";

export default function PushToggle() {
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // ตรวจสอบสถานะการลงทะเบียนแจ้งเตือนเมื่อหน้าจอโหลด
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          setOn(!!sub);
        });
      });
    }
  }, []);

  const toggle = async () => {
    setBusy(true);
    try {
      if (on) {
        await disablePush();
        setOn(false);
        alert("ปิดการแจ้งเตือนแล้วค่ะ 🔕");
      } else {
        await enablePush();
        setOn(true);
        alert("เปิดการแจ้งเตือนสำเร็จ! 🔔");
      }
    } catch (e: any) {
      console.error(e);
      alert(e.message || "ไม่สามารถตั้งค่าการแจ้งเตือนได้ในขณะนี้");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="group relative overflow-hidden bg-white/80 backdrop-blur-md p-5 rounded-[2rem] border border-gray-100 shadow-xl transition-all hover:shadow-2xl hover:-translate-y-1">
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-colors ${on ? 'bg-orange-100 text-[#EE4D2D]' : 'bg-gray-100 text-gray-400'}`}>
            {on ? '🔔' : '🔕'}
          </div>
          <div>
            <h4 className="font-black text-gray-900 text-base">ระบบแจ้งเตือน</h4>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
              {on ? 'เปิดใช้งานแบบ Real-time' : 'ปิดการรับข้อมูลชั่วคราว'}
            </p>
          </div>
        </div>

        <button
          onClick={toggle}
          disabled={busy}
          className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all duration-500 shadow-inner ${
            on ? 'bg-gradient-to-r from-[#EE4D2D] to-[#FF7337]' : 'bg-gray-200'
          } ${busy ? 'opacity-50 cursor-wait' : 'cursor-pointer hover:scale-105 active:scale-95'}`}
        >
          <span
            className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-all duration-500 ease-[cubic-bezier(0.68,-0.55,0.27,1.55)] ${
              on ? 'translate-x-7' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
      {/* เอฟเฟกต์ตกแต่งพื้นหลัง */}
      <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-orange-50 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}
