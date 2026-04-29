"use client";
import { useEffect, useState } from "react";
import { enablePush, disablePush } from "@/lib/push";

export default function PushToggle() {
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    navigator.serviceWorker?.ready.then(r =>
      r.pushManager.getSubscription().then(s => setOn(!!s))
    );
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
      alert(e.message || "เกิดข้อผิดพลาดในการตั้งค่าค่ะ");
    } finally { 
      setBusy(false); 
    }
  };

  return (
    <div className="flex items-center justify-between bg-white p-5 rounded-[1.5rem] shadow-sm border border-gray-100">
      <div>
        <h4 className="font-black text-gray-900 text-sm">การแจ้งเตือน (Push)</h4>
        <p className="text-[10px] text-gray-400 font-bold mt-1">รับข้อความแชทใหม่ทันทีแม้ปิดแอป</p>
      </div>
      <button 
        onClick={toggle} 
        disabled={busy}
        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${on ? 'bg-[#EE4D2D]' : 'bg-gray-200'} ${busy ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${on ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  );
}
