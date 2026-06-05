import React from "react";

interface HeaderProps {
  activeModel?: string;
}

export default function Header({ activeModel = "Gemini-2.5-Flash" }: HeaderProps) {
  return (
    <header className="border-b border-white/5 bg-[#050608]/90 backdrop-blur-md sticky top-0 z-50 px-6 py-4" id="app_header">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left Side: Plain text branding */}
        <div className="flex items-center gap-2 select-none">
          <span className="text-sm font-mono tracking-wider text-slate-100 font-semibold focus:outline-none">
            PatchHound // Autonomous Code Repair
          </span>
        </div>

        {/* Right Side: Understated connection badge */}
        <div className="flex items-center">
          <div className="flex items-center gap-2 bg-[#0d0f14] border border-white/5 px-3 py-1.5 rounded-lg text-xs font-mono select-none">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-450 shadow-[0_0_8px_#06b6d4] animate-pulse"></span>
            <span className="text-slate-400 font-medium text-[11px]">
              Gateway: <span className="text-cyan-400 font-bold">{activeModel} Active</span>
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

