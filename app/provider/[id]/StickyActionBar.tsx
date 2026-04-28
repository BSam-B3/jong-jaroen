"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  providerId: string;
  providerName: string;
}

export default function StickyActionBar({ providerId, providerName }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<"chat" | "hire" | null>(null);

  const handleChat = () => {
    setLoading("chat");
    router.push(`/chat/${providerId}`);
  };

  const handleHire = () => {
    setLoading("hire");
    router.push(`/hire/${providerId}`);
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-30">
      <div className="max-w-md mx-auto bg-white border-t border-slate-200 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] p-4 flex gap-3">
        <button
          onClick={handleChat}
          disabled={loading !== null}
          className="flex items-center justify-center gap-2 px-5 py-4 rounded-2xl border-2 border-[#EE4D2D] text-[#EE4D2D] font-black hover:bg-orange-50 active:scale-95 transition-all disabled:opacity-50"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          แชท
        </button>

        <button
          onClick={handleHire}
          disabled={loading !== null}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-4 rounded-2xl bg-gradient-to-r from-[#EE4D2D] to-[#FF7043] text-white font-black shadow-lg shadow-orange-500/30 hover:shadow-xl active:scale-95 transition-all disabled:opacity-50"
        >
          {loading === "hire" ? (
            <span className="animate-spin w-6 h-6 border-4 border-white border-t-transparent rounded-full" />
          ) : (
            <>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
              จ้าง {providerName.split(" ")[0]}
            </>
          )}
        </button>
      </div>
      {/* Safe area สำหรับ iPhone */}
      <div className="bg-white h-[env(safe-area-inset-bottom)] max-w-md mx-auto" />
    </div>
  );
}
