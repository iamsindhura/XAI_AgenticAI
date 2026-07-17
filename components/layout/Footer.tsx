import React from "react";
import Link from "next/link";

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-100 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="text-center sm:text-left">
            <p className="text-sm text-slate-500">
              &copy; {new Date().getFullYear()} Antigravity AI Counseling. All rights reserved.
            </p>
          </div>
          <div className="flex gap-6 text-sm text-slate-500 justify-center">
            <Link href="/about" className="hover:text-primary-600">About</Link>
            <Link href="https://github.com" className="hover:text-primary-600">GitHub</Link>
            <Link href="#" className="hover:text-primary-600">Privacy Policy</Link>
            <Link href="#" className="hover:text-primary-600">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
