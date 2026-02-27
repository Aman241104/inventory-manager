import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import GlobalShortcuts from "@/components/layout/GlobalShortcuts";
import TopLoader from "@/components/ui/TopLoader";
import { cn } from "@/lib/utils";
import { Apple } from "lucide-react";
import { Suspense } from "react";

const inter = Inter({
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "FruitManager | Inventory System",
  description: "Professional Inventory Management for Fruit Trading",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={cn(inter.className, "bg-slate-50 text-slate-900")}>
        <Suspense fallback={null}>
          <TopLoader />
        </Suspense>
        <GlobalShortcuts />
        <div className="flex min-h-screen">
          <Sidebar />

          {/* Mobile Top Bar */}
          <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 z-30 flex items-center px-4 border-b border-slate-800">
            <div className="flex items-center gap-4 w-full">
              {/* Spacer for hamburger menu toggle which is fixed in the Sidebar component */}
              <div className="w-10" />

              <div className="flex items-center gap-2">
                <Apple className="text-emerald-500" />
                <span className="text-white font-black uppercase tracking-widest text-sm">FruitManager</span>
              </div>
            </div>
          </div>

          <main className="flex-1 lg:ml-64 p-4 lg:p-8 pt-20 lg:pt-8">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
