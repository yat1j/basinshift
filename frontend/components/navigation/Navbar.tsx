"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { checkBackendHealth, HealthCheckResult } from "@/lib/api";

const NAV_LINKS = [
  { href: "/problem", label: "The Challenge" },
  { href: "/model", label: "Our Model" },
  { href: "/test", label: "Test the Model" },
  { href: "/results", label: "Forecast Results" },
  { href: "/catchments", label: "Catchment Explorer" },
  { href: "/evaluation", label: "Evaluation" },
  { href: "/about", label: "About" },
  { href: "/resources", label: "Resources" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [health, setHealth] = useState<HealthCheckResult | null>(null);

  useEffect(() => {
    let isMounted = true;
    checkBackendHealth().then((res) => {
      if (isMounted) setHealth(res);
    });
    return () => {
      isMounted = false;
    };
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-[#dadce0] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo matching Google Research style */}
          <Link
            href="/"
            className="flex items-center gap-2.5 text-[#202124] focus:outline-none"
          >
            <span className="font-medium text-lg tracking-tight text-[#202124]">
              BASINSHIFT
            </span>
            <span className="text-gray-300 font-light text-xl">|</span>
            <span className="text-sm font-normal text-[#5f6368] hidden sm:inline">
              Discharge Forecasting
            </span>
          </Link>

          {/* Desktop Nav Links - Restrained Google Research Style */}
          <nav className="hidden xl:flex items-center space-x-7" aria-label="Main navigation">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-[14px] transition-colors py-1 ${
                    isActive
                      ? "text-[#1a73e8] font-medium border-b-2 border-[#1a73e8]"
                      : "text-[#3c4043] hover:text-[#202124] font-normal"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Action: Clean Black Pill (Screenshot 5 style) */}
          <div className="hidden sm:flex items-center space-x-4">
            <Link
              href="/test"
              className="google-pill text-xs py-2 px-4 shadow-sm"
            >
              Test the Model
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex xl:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded text-[#5f6368] hover:text-[#202124] focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-b border-[#dadce0] bg-white px-4 pt-2 pb-6 space-y-2">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 text-sm rounded ${
                  isActive
                    ? "text-[#1a73e8] font-medium bg-[#f8f9fa]"
                    : "text-[#3c4043] hover:text-[#202124] hover:bg-[#f8f9fa]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <div className="pt-3 border-t border-[#dadce0] mt-3">
            <Link
              href="/test"
              onClick={() => setMobileMenuOpen(false)}
              className="google-pill w-full justify-center text-xs py-2.5"
            >
              Test the Model
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
