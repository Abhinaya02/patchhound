import React, { useState, useRef, useEffect } from "react";
import { Terminal as TerminalIcon, Search, Shield, ChevronDown, Download, Trash2, SlidersHorizontal } from "lucide-react";
import { LogMessage } from "../types";

interface ConsoleTerminalProps {
  logs: LogMessage[];
  onClear: () => void;
  isExecuting: boolean;
}

export default function ConsoleTerminal({ logs, onClear, isExecuting }: ConsoleTerminalProps) {
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto scroll within the terminal container on update
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // Node filter tags mapping
  const nodeFilters = [
    { value: "all", label: "ALL AGENTS" },
    { value: "scout", label: "SCOUT" },
    { value: "exploit_architect", label: "EXPLOIT" },
    { value: "fix_engineer", label: "FIX ENG" },
    { value: "qa_validator", label: "QA SANDBOX" },
  ];

  const filteredLogs = logs.filter((log) => {
    const matchesNode = filter === "all" || log.node === filter;
    const matchesKeyword = log.message.toLowerCase().includes(search.toLowerCase()) || 
                           log.node.toLowerCase().includes(search.toLowerCase());
    return matchesNode && matchesKeyword;
  });

  const downloadLogs = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `patchhound_swarm_run_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="bg-[#0d0f14] border border-white/5 rounded-2xl flex flex-col h-[480px] overflow-hidden shadow-2xl relative" id="console_terminal">
      {/* Terminal Title Bar */}
      <div className="bg-black/40 px-4 py-3 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500/80 shadow-[0_0_8px_#06b6d4]"></span>
          </div>
          <span className="text-xs font-mono font-bold text-white ml-2 flex items-center gap-1.5 uppercase tracking-wider">
            <TerminalIcon className="w-3.5 h-3.5 text-cyan-400" />
            LIVE SWARM_CONSOLE @ ENCLAVE
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isExecuting && (
            <span className="text-[9px] font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/30 tracking-widest animate-pulse">
              STREAMING ACTIVE
            </span>
          )}
          <button 
            onClick={downloadLogs} 
            disabled={logs.length === 0}
            className="text-[10px] font-mono text-slate-300 hover:text-white bg-black/40 border border-white/10 hover:border-white/20 px-2 rounded-lg flex items-center gap-1.5 transition-all py-1.5 cursor-pointer disabled:opacity-40"
          >
            <Download className="w-3 h-3 text-cyan-400" /> Dump JSON
          </button>
          <button 
            onClick={onClear} 
            className="text-[10px] font-mono text-slate-400 hover:text-rose-400 bg-black/20 border border-white/5 hover:border-rose-950/40 px-2 rounded-lg flex items-center gap-1.5 transition-all py-1.5 cursor-pointer"
          >
            <Trash2 className="w-3 h-3" /> Clear
          </button>
        </div>
      </div>

      {/* Control Panels: Search and Active Node Filtering */}
      <div className="bg-black/20 p-3 border-b border-white/5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 font-mono">
        {/* Search input */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Type 'grep' pattern or keyword search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#050608]/90 text-slate-200 border border-white/5 focus:border-cyan-500 focus:outline-none rounded-lg px-3 py-1.5 text-xs font-mono pl-8"
          />
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 transform -translate-y-1/2" />
        </div>

        {/* Node Filters */}
        <div className="flex flex-wrap gap-1 items-center bg-black/60 p-1.5 rounded-lg border border-white/5">
          <SlidersHorizontal className="w-3 h-3 text-cyan-500 mx-1.5" />
          {nodeFilters.map((flt) => {
            const isSelected = filter === flt.value;
            return (
              <button
                key={flt.value}
                onClick={() => setFilter(flt.value)}
                className={`text-[9.5px] px-2 py-1 rounded transition-all cursor-pointer font-bold ${
                  isSelected 
                    ? "bg-cyan-950/40 border border-cyan-800/30 text-cyan-400" 
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {flt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Terminal Output Logs Container */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 p-4 overflow-y-auto font-mono text-xs text-slate-300 space-y-2.5 bg-black/40 scrollbar-thin"
      >
        {filteredLogs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-2">
            <TerminalIcon className="w-8 h-8 opacity-40 text-cyan-500/50" />
            <p className="text-[10px] tracking-widest uppercase text-slate-500 select-none">System idle. Select 'Launch Patchhound Swarm' to compile agents.</p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            // Pick terminal trace color based on event type
            let messageTheme = "text-slate-300";
            let typeAbbr = "INFO";

            if (log.type === "start") {
              messageTheme = "text-cyan-400 font-bold bg-cyan-950/10 px-1 rounded";
              typeAbbr = "INIT";
            } else if (log.type === "transition") {
              messageTheme = "text-blue-400 font-semibold";
              typeAbbr = "TRAN";
            } else if (log.type === "success") {
              messageTheme = "text-cyan-300 font-bold bg-cyan-950/20 py-0.5 px-1 rounded border border-cyan-800/20";
              typeAbbr = "PASS";
            } else if (log.type === "warn") {
              messageTheme = "text-amber-400 font-mono";
              typeAbbr = "WARN";
            } else if (log.type === "error" || log.type === "timeout") {
              messageTheme = "text-rose-400 font-mono font-bold bg-rose-950/10 px-1 rounded";
              typeAbbr = "FAIL";
            }

            return (
              <div key={log.id} className="border-b border-white/[0.02] pb-1.5 last:border-0 hover:bg-white/[0.01] px-1 rounded transition-colors group">
                <div className="flex items-start gap-2.5">
                  <span className="text-[10px] text-slate-550 font-semibold select-none opacity-50">
                    [{log.time}]
                  </span>
                  <span className={`text-[9.5px] px-1.5 py-0.2 rounded text-[10px] font-bold tracking-widest ${
                    log.node === "scout" ? "bg-cyan-950/50 border border-cyan-800/30 text-cyan-400" :
                    log.node === "exploit_architect" ? "bg-blue-950/50 border border-blue-800/30 text-blue-400" :
                    log.node === "fix_engineer" ? "bg-purple-950/50 border border-purple-800/30 text-purple-400" :
                    log.node === "qa_validator" ? "bg-red-950/50 border border-red-800/30 text-rose-400" :
                    "bg-black/40 border border-white/5 text-slate-400"
                  }`}>
                    {log.node.toUpperCase().replace("_", " ")}
                  </span>
                  <span className="text-[10px] text-slate-550 font-bold bg-black/40 px-1 rounded">
                    {typeAbbr}
                  </span>
                  <p className={`flex-1 break-all whitespace-pre-wrap leading-relaxed ${messageTheme}`}>
                    {log.message}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Terminal Footer Info Bar */}
      <div className="bg-[#050608] px-4 py-2 border-t border-white/5 text-[10px] text-slate-550 font-mono flex items-center justify-between">
        <span className="flex items-center gap-1 select-none">
          <Shield className="w-3.5 h-3.5 text-cyan-400" /> Secure Sandbox Enclave Active
        </span>
        <span className="tracking-widest uppercase text-cyan-500/50">WSB Policy Enabled</span>
      </div>
    </div>
  );
}
