"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Apple,
  Users,
  UserSquare2,
  Zap,
  FileText,
  Menu,
  X,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import GlobalSearch from "./GlobalSearch";
import ShortcutHelp from "./ShortcutHelp";

const navItems = [
  { label: "Today's Hub", href: "/", icon: Zap },
  { label: "Detailed Ledger", href: "/details", icon: FileText },
];

const manageItems = [
  { label: "Products", href: "/products", icon: Apple },
  { label: "Vendors", href: "/vendors", icon: Users },
  { label: "Customers", href: "/customers", icon: UserSquare2 },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      {/* Mobile Toggle */}
      <button
        className="lg:hidden fixed top-3 left-3 z-50 p-2 text-white hover:bg-slate-800 rounded-lg transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar - Desktop and Mobile Overlay */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 transition-transform duration-300 ease-in-out transform lg:translate-x-0",
        isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo Area */}
          <div className="flex items-center justify-center h-20 border-b border-slate-800">
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Apple className="text-emerald-500" />
              <span>FruitManager</span>
            </h1>
          </div>

          {/* Nav Items */}
          <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-8">
            <div className="px-1">
              <GlobalSearch />
            </div>

            <div className="space-y-2">
              <p className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Main Hub</p>
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors group",
                      isActive
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/50"
                        : "hover:bg-slate-800 hover:text-white"
                    )}
                  >
                    <Icon size={20} className={cn(
                      isActive ? "text-white" : "text-slate-400 group-hover:text-emerald-400"
                    )} />
                    <span className="font-bold text-sm">{item.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="space-y-2">
              <p className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Manage Data</p>
              {manageItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors group",
                      isActive
                        ? "bg-slate-700 text-white"
                        : "hover:bg-slate-800 hover:text-white"
                    )}
                  >
                    <Icon size={18} className={cn(
                      isActive ? "text-white" : "text-slate-500 group-hover:text-emerald-400"
                    )} />
                    <span className="font-medium text-sm">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold">
                A
              </div>
              <div className="flex-1 overflow-hidden min-w-[100px]">
                <p className="text-sm font-medium text-white truncate">Admin User</p>
                <p className="text-xs text-slate-500 truncate">admin@fruit.com</p>
              </div>
            </div>
            <ShortcutHelp />
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
