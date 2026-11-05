"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { href: "/problem", label: "The Challenge" },
  { href: "/model", label: "Our Model" },
  { href: "/catchments", label: "Catchment Explorer" },
  { href: "/evaluation", label: "Evaluation" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-black/90 backdrop-blur-md border-b border-white/10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo matching Google Research style */}
          <Link href="/" className="flex items-center gap-2.5 text-white focus:outline-none">
            <span className="font-medium text-lg tracking-tight text-white font-sans">
              BASINSHIFT
            </span>
            <span className="text-white/30 font-light text-lg">|</span>
            <span className="text-sm font-normal text-white/70 hidden sm:inline">
              Discharge Forecasting
            </span>
          </Link>

          {/* Desktop Nav Links - Clean & Well Aligned (No clutter) */}
          <nav className="hidden lg:flex items-center space-x-8" aria-label="Main navigation">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-[14px] transition-colors py-1 ${
                    isActive
                      ? "text-white font-medium border-b-2 border-white"
                      : "text-white/70 hover:text-white font-normal"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Action: Clean Glass Pill Button */}
          <div className="hidden sm:flex items-center space-x-4">
            <Link href="/test" className="glass-pill text-xs py-2 px-5 shadow-sm">
              Test the Model
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded text-white/70 hover:text-white focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-white/10 bg-black/95 px-4 pt-2 pb-6 space-y-2">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 text-sm rounded ${
                  isActive ? "text-white font-medium bg-white/10" : "text-white/70 hover:text-white hover:bg-white/5"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <div className="pt-3 border-t border-white/10 mt-3">
            <Link
              href="/test"
              onClick={() => setMobileMenuOpen(false)}
              className="glass-pill w-full justify-center text-xs py-2.5"
            >
              Test the Model
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
