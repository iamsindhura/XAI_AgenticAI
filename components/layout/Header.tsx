"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, GraduationCap } from "lucide-react";

interface HeaderProps {
  onMenuClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const links = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/start", label: "Start Counselling" },
    { href: "/dashboard", label: "Dashboard" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-100 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left side: Logo & Trigger for sidebar */}
        <div className="flex items-center gap-4">
          {mounted && onMenuClick && (
            <button
              onClick={onMenuClick}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-900 md:hidden"
              aria-label="Toggle Sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
          <Link href="/" className="flex items-center gap-2.5 font-semibold text-slate-900">
            <GraduationCap className="h-6 w-6 text-primary-600" />
            <span className="text-lg tracking-tight">Antigravity AI</span>
          </Link>
        </div>

        {/* Right side navigation: Desktop Links */}
        <nav className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-slate-600 hover:text-primary-600 transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/start"
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-primary-700 transition-colors"
          >
            Get Started
          </Link>
        </nav>

        {/* Mobile menu trigger */}
        <div className="flex items-center md:hidden">
          {mounted && (
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              aria-label="Toggle Navigation Menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile nav dropdown drawer */}
      {mounted && mobileOpen && (
        <div className="border-t border-slate-100 bg-white px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-950 transition-all"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/start"
              onClick={() => setMobileOpen(false)}
              className="mt-2 block rounded-lg bg-primary-600 px-4 py-2.5 text-center text-sm font-medium text-white shadow hover:bg-primary-700 transition-colors"
            >
              Get Started
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
};
