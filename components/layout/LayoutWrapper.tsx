"use client";
import React, { useState } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { Footer } from "./Footer";

export const LayoutWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen">
      <Header onMenuClick={() => setMobileOpen(!mobileOpen)} />
      <div className="flex flex-1 relative">
        <Sidebar mobileOpen={mobileOpen} />
        {/* Backdrop for mobile */}
        {mobileOpen && (
          <div 
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-20 bg-slate-900/40 backdrop-blur-sm md:hidden"
          />
        )}
        <main className="flex-1 min-w-0 bg-slate-50/50 flex flex-col">
          <div className="flex-1">
            {children}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};
