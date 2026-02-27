"use client";

import React, { useState } from "react";
import { Eraser } from "lucide-react";
import { writeOffLot } from "@/app/actions/transaction";

export default function WriteOffButton({ lotId }: { lotId: string }) {
  const [loading, setLoading] = useState(false);

  const handleWriteOff = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Clear remaining stock as spoilage? This will record a ₹0 sale to balance this lot.")) {
      setLoading(true);
      const res = await writeOffLot(lotId);
      if (!res.success) alert(res.error);
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleWriteOff}
      disabled={loading}
      className="p-1.5 text-slate-300 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
      title="Clear Remaining Stock (Spoilage)"
    >
      <Eraser size={14} className={loading ? "animate-spin" : ""} />
    </button>
  );
}
