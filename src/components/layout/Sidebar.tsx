"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Apple, 
  Users, 
  UserSquare2, 
  ShoppingCart, 
  BadgeDollarSign,
  Menu,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Products", href: "/products", icon: Apple },
  { label: "Vendors", href: "/vendors", icon: Users },
  { label: "Customers", href: "/customers", icon: UserSquare2 },
  { label: "Buy Section", href: "/buy", icon: ShoppingCart },
  { label: "Sell Section", href: "/sell", icon: BadgeDollarSign },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      {/* Mobile Toggle */}
      <button 
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-slate-900 text-white rounded-md"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 transition-transform duration-300 ease-in-out transform lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
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
          <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
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
                      ? "bg-indigo-600 text-white" 
                      : "hover:bg-slate-800 hover:text-white"
                  )}
                >
                  <Icon size={20} className={cn(
                    isActive ? "text-white" : "text-slate-400 group-hover:text-emerald-400"
                  )} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-slate-800">
            <div className="flex items-center gap-3 px-4 py-2">
              <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold">
                A
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium text-white truncate">Admin User</p>
                <p className="text-xs text-slate-500 truncate">admin@fruit.com</p>
              </div>
            </div>
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
