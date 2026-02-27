"use client";

import React, { useState, useEffect } from "react";
import { Keyboard, HelpCircle, X, Sparkles } from "lucide-react";
import { Modal } from "@/components/ui/Modal";

const shortcuts = [
  { group: "Navigation", keys: [
    { label: "Dashboard / Summary", key: "Ctrl + Shift + S" },
    { label: "Detailed Reports", key: "Ctrl + Shift + D" },
    { label: "Global Search", key: "Ctrl + K" },
    { label: "Shortcut Help", key: "?" },
  ]},
  { group: "Trading", keys: [
    { label: "New Purchase (Buy)", key: "Ctrl + Shift + +" },
    { label: "New Sale (Sell)", key: "Ctrl + Shift + -" },
    { label: "Bulk Entry Mode", key: "Ctrl + Shift + B" },
    { label: "Split View Mode", key: "Ctrl + Shift + T" },
  ]},
  { group: "Forms", keys: [
    { label: "Save & Add Another", key: "Enter (on Rate)" },
    { label: "Next Field", key: "Enter / Tab" },
    { label: "Close Modal / Cancel", key: "Esc" },
  ]}
];

export default function ShortcutHelp() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "?" && !isOpen) {
        // Only trigger if not typing in an input
        const target = e.target as HTMLElement;
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
          e.preventDefault();
          setIsOpen(true);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white transition-colors"
        title="Shortcut Help (?)"
      >
        <HelpCircle size={18} />
      </button>

      <Modal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)}
        title="Keyboard Shortcuts"
      >
        <div className="space-y-8 py-4">
          <div className="flex items-center gap-2 px-4 py-3 bg-indigo-50 rounded-xl border border-indigo-100 text-indigo-700 mb-6">
            <Sparkles size={18} className="shrink-0" />
            <p className="text-xs font-bold leading-tight">Master these shortcuts to log transactions up to 3x faster without using your mouse.</p>
          </div>

          <div className="grid grid-cols-1 gap-8">
            {shortcuts.map((group) => (
              <div key={group.group} className="space-y-3">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">{group.group}</h4>
                <div className="space-y-1">
                  {group.keys.map((s) => (
                    <div key={s.label} className="flex items-center justify-between py-2 px-3 hover:bg-slate-50 rounded-lg group transition-colors">
                      <span className="text-sm font-medium text-slate-600">{s.label}</span>
                      <kbd className="inline-flex h-6 select-none items-center gap-1 rounded-md border border-slate-200 bg-white px-2 font-mono text-[10px] font-black text-slate-500 shadow-sm group-hover:border-indigo-200">
                        {s.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-center">
            <button 
              onClick={() => setIsOpen(false)}
              className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
            >
              Got it, thanks!
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
