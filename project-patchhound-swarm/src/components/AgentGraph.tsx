import React from "react";
import { Search, PenTool, Hammer, CheckSquare, ArrowRight, ShieldCheck, RefreshCw, ShieldAlert } from "lucide-react";

interface AgentGraphProps {
  currentNode: string;
  isExecuting: boolean;
  iterationCount: number;
  maxIterations: number;
  testPassed: boolean;
}

export default function AgentGraph({ 
  currentNode, 
  isExecuting, 
  iterationCount, 
  maxIterations, 
  testPassed 
}: AgentGraphProps) {
  
  // Helper to determine the state of each node
  const getNodeState = (nodeId: string) => {
    if (!isExecuting) {
      if (testPassed && currentNode !== "start") {
        return "completed";
      }
      return "idle";
    }

    // Active Node Check
    if (currentNode === nodeId) {
      return "active";
    }

    // Completed Nodes Sequence Check
    const seq = ["scout", "exploit_architect", "fix_engineer", "qa_logic_check", "qa_validator"];
    const currentIndex = seq.indexOf(currentNode);
    const nodeIndex = seq.indexOf(nodeId);

    if (currentIndex > nodeIndex) {
      return "completed";
    }

    return "idle";
  };

  const statusPills = [
    {
      id: "scout",
      label: "Scout Node",
      role: "Security Audit Engine",
      icon: Search
    },
    {
      id: "exploit_architect",
      label: "Exploit Architect",
      role: "Test Case Builder",
      icon: PenTool
    },
    {
      id: "fix_engineer",
      label: "Fix Engineer",
      role: "Patch Designer",
      icon: Hammer
    },
    {
      id: "qa_logic_check",
      label: "QA Logic Checker",
      role: "Security & Practice Audit",
      icon: ShieldAlert
    },
    {
      id: "qa_validator",
      label: "QA Validator Sandbox",
      role: "Isolated Verification",
      icon: CheckSquare
    }
  ];

  return (
    <div className="bg-[#0d0f14] border border-white/5 rounded-xl p-4 shadow-xl select-none" id="bottom_swarm_status_ticker">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left Side: Status title / Iteration counter */}
        <div className="shrink-0 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#06b6d4]"></span>
            <span className="text-[10px] font-mono tracking-wider uppercase text-slate-400">
              Swarm Execution Line
            </span>
          </div>
          <span className="text-[10px] font-mono bg-black/40 px-2 py-0.5 rounded border border-white/5 text-slate-500">
            Cycle Refactor Limit: <span className="text-cyan-450 font-bold">{iterationCount}/{maxIterations}</span>
          </span>
        </div>

        {/* Middle/Center: The 5 Minimalist status pills */}
        <div className="flex-1 flex flex-wrap items-center justify-center gap-2 md:gap-3">
          {statusPills.map((pill, idx) => {
            const state = getNodeState(pill.id);
            const Icon = pill.icon;
            
            let pillClass = "border-white/5 bg-black/25 text-slate-600";
            let iconColor = "text-slate-600";

            if (state === "active") {
              // Pulse slowly with an amber border
              pillClass = "border-amber-500/70 bg-amber-500/5 text-amber-400 font-bold animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.05)]";
              iconColor = "text-amber-500";
            } else if (state === "completed") {
              // Lock down with a thin green border and a checkmark
              pillClass = "border-emerald-500/60 bg-emerald-500/10 text-emerald-400 font-bold";
              iconColor = "text-emerald-500";
            }

            return (
              <React.Fragment key={pill.id}>
                <div 
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg border text-[11px] font-mono transition-all duration-300 ${pillClass}`}
                  title={`${pill.label}: ${pill.role}`}
                >
                  <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
                  <span>{pill.label}</span>
                  {state === "completed" && (
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 animate-bounce" />
                  )}
                </div>
                
                {idx < 4 && (
                  <ArrowRight className={`w-3.5 h-3.5 hidden sm:block ${
                    state === "completed" ? "text-emerald-500/60" : "text-slate-800"
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Right Side: Execution mode status ticker */}
        <div className="hidden lg:flex items-center gap-2 text-[10px] font-mono text-slate-500">
          <RefreshCw className={`w-3 h-3 ${isExecuting ? "animate-spin text-cyan-400" : ""}`} />
          <span className="uppercase text-[9.5px]">
            {isExecuting ? "PROCESSING CYBER SWARM" : "STATE GRAPH NOMINAL"}
          </span>
        </div>
      </div>
    </div>
  );
}
