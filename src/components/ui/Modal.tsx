"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-white rounded-t-3xl sm:rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden transform transition-all animate-in fade-in slide-in-from-bottom-10 sm:zoom-in duration-300 flex flex-col mt-auto sm:mt-0">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 flex-shrink-0">
          <h2 className="text-xl font-black text-slate-800 tracking-tight">{title}</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center bg-slate-100 text-slate-500 hover:text-slate-800 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto overflow-x-hidden custom-scrollbar flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
