"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Activity, Waves } from "lucide-react";
import { checkBackendHealth, HealthCheckResult } from "@/lib/api";

const NAV_LINKS = [
  { href: "/", label: "Overview" },
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
    <header className="sticky top-0 z-50 w-full border-b border-basin-border/60 bg-basin-darkest/85 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 text-white group focus:outline-none focus-visible:ring-2 focus-visible:ring-basin-cyan"
          >
            <div className="w-8 h-8 rounded border border-basin-cyan/40 bg-basin-surface/80 flex items-center justify-center text-basin-cyan group-hover:border-basin-cyan transition-colors">
              <Waves className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold tracking-wider text-base sm:text-lg text-white font-mono">
                BASINSHIFT
              </span>
              <span className="text-[10px] tracking-widest text-slate-400 uppercase -mt-1 font-mono hidden sm:inline">
                Hydrological Intelligence
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden xl:flex items-center space-x-1" aria-label="Main navigation">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 text-xs font-medium tracking-wide transition-colors rounded-sm ${
                    isActive
                      ? "text-white bg-basin-surface border border-basin-borderLight/80"
                      : "text-slate-300 hover:text-white hover:bg-basin-surface/50"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions & Health Status */}
          <div className="hidden sm:flex items-center space-x-3">
            {/* Backend Indicator */}
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-basin-deep border border-basin-border text-[11px] font-mono"
              title={health?.connected ? "Member 1 API Connected" : "Inference API Offline (Pilot Mode Active)"}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  health?.connected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                }`}
              />
              <span className="text-slate-400">API:</span>
              <span className={health?.connected ? "text-emerald-300" : "text-amber-300"}>
                {health?.connected ? "Online" : "Standalone"}
              </span>
            </div>

            {/* Prominent CTA */}
            <Link
              href="/test"
              className="px-3.5 py-1.5 text-xs font-mono font-medium text-white bg-basin-teal/80 hover:bg-basin-teal border border-basin-cyan/30 rounded shadow-sm hover:border-basin-cyan/60 transition-all flex items-center gap-1.5"
            >
              <Activity className="w-3.5 h-3.5 text-basin-cyanAccent" />
              <span>Test the Model</span>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex xl:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded text-slate-300 hover:text-white hover:bg-basin-surface focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-b border-basin-border bg-basin-darkest/98 px-4 pt-2 pb-6 space-y-1">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 text-sm font-medium rounded transition-colors ${
                  isActive
                    ? "text-white bg-basin-surface border border-basin-border"
                    : "text-slate-300 hover:text-white hover:bg-basin-surface/40"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <div className="pt-3 border-t border-basin-border mt-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
              <span
                className={`w-2 h-2 rounded-full ${
                  health?.connected ? "bg-emerald-400" : "bg-amber-400"
                }`}
              />
              <span>Inference Engine: {health?.connected ? "Connected" : "Pilot Mode"}</span>
            </div>
            <Link
              href="/test"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-1.5 text-xs font-mono font-medium text-white bg-basin-teal rounded border border-basin-cyan/40"
            >
              Run Test
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
