import React, { useState, useMemo } from "react";
import { 
  Copy, 
  Check, 
  FileCode, 
  Play, 
  Terminal, 
  HelpCircle, 
  GitCompare, 
  Split, 
  List,
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  Sparkles,
  Clock
} from "lucide-react";
import { diffLines } from "diff";

const renderMarkdownCustom = (text: string) => {
  if (!text) return null;
  const lines = text.split("\n");
  return (
    <div className="space-y-2.5">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (trimmed.startsWith("###")) {
          return (
            <h4 key={idx} className="text-xs font-bold text-slate-200 uppercase mt-4 mb-2 flex items-center gap-1.5 font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400"></span>
              {trimmed.replace(/^###\s*/, "")}
            </h4>
          );
        }
        if (trimmed.startsWith("##")) {
          return (
            <h3 key={idx} className="text-sm font-bold text-white tracking-tight mt-6 mb-3 border-b border-white/5 pb-1 select-none font-mono">
              {trimmed.replace(/^##\s*/, "")}
            </h3>
          );
        }
        if (trimmed.startsWith("#")) {
          return (
            <h2 key={idx} className="text-base font-bold text-[#fafafa] tracking-tight mt-6 mb-3 select-none">
              {trimmed.replace(/^#\s*/, "")}
            </h2>
          );
        }
        if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
          const content = trimmed.replace(/^[-*]\s*/, "");
          const isBoldStart = content.startsWith("**");
          let displayContent: React.ReactNode = content;
          if (isBoldStart) {
            const match = content.match(/^\*\*(.*?)\*\*(.*)/);
            if (match) {
              displayContent = (
                <span>
                  <strong className="text-cyan-400 font-semibold">{match[1]}</strong>
                  <span className="text-slate-350">{match[2]}</span>
                </span>
              );
            }
          }
          return (
            <div key={idx} className="flex gap-2 text-slate-350 text-[11px] leading-relaxed pl-1 py-0.5">
              <span className="text-cyan-400 font-bold select-none shrink-0">•</span>
              <div className="flex-1">{displayContent}</div>
            </div>
          );
        }
        if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
          return (
            <p key={idx} className="text-cyan-400 text-xs font-bold font-mono mt-3 select-none uppercase">
              {trimmed.replace(/\*\*/g, "")}
            </p>
          );
        }
        
        let processedLine: React.ReactNode = line;
        const codeRegex = /`(.*?)`/g;
        if (codeRegex.test(line)) {
          const parts = line.split(/(`.*?`)/);
          processedLine = parts.map((part, pIdx) => {
            if (part.startsWith("`") && part.endsWith("`")) {
              return (
                <code key={pIdx} className="bg-black/40 text-cyan-300 px-1 py-0.5 rounded font-mono text-[10px] border border-white/5 mx-0.5">
                  {part.slice(1, -1)}
                </code>
              );
            }
            return part;
          });
        }
        
        return line.trim() === "" ? (
          <div key={idx} className="h-2"></div>
        ) : (
          <p key={idx} className="text-slate-350 text-[11px] leading-relaxed font-sans">{processedLine}</p>
        );
      })}
    </div>
  );
};

interface CodePaneProps {
  originalCode: string;
  patchedCode: string;
  testCode: string;
  sandboxLogs: string;
  filePath: string;
  activeTab: "original" | "patched" | "diff" | "test" | "sandbox" | "qa_logic" | "reasoning";
  setActiveTab: (tab: "original" | "patched" | "diff" | "test" | "sandbox" | "qa_logic" | "reasoning") => void;
  qaLogicPassed?: boolean | null;
  qaLogicScore?: number | null;
  qaLogicFindings?: string[];
  bugExplanation?: string | null;
  patchReasoning?: string | null;
}

export default function CodePane({ 
  originalCode, 
  patchedCode, 
  testCode, 
  sandboxLogs, 
  filePath,
  activeTab,
  setActiveTab,
  qaLogicPassed,
  qaLogicScore,
  qaLogicFindings,
  bugExplanation,
  patchReasoning
}: CodePaneProps) {
  const [copied, setCopied] = useState(false);
  const [diffViewMode, setDiffViewMode] = useState<"split" | "unified">("split");

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentCode = 
    activeTab === "original" ? originalCode :
    activeTab === "patched" ? patchedCode :
    activeTab === "diff" ? patchedCode :
    activeTab === "test" ? testCode :
    activeTab === "qa_logic" ? (qaLogicFindings ? qaLogicFindings.join("\n") : "") :
    activeTab === "reasoning" ? `${bugExplanation || ""}\n\n${patchReasoning || ""}` :
    sandboxLogs;

  const currentFileName = 
    activeTab === "original" ? filePath :
    activeTab === "patched" ? `${filePath.replace(".py", "")}_patched.py` :
    activeTab === "diff" ? `${filePath.replace(".py", "")}_diff.patch` :
    activeTab === "test" ? "test_verification.py" :
    activeTab === "qa_logic" ? "qa_logic_check.log" :
    activeTab === "reasoning" ? "refactor_rationale.md" :
    "unittest_execution.log";

  // Compile Unified Diff Line List
  const unifiedItems = useMemo(() => {
    if (!originalCode || !patchedCode) return [];
    
    const linesDiff = diffLines(originalCode, patchedCode);
    let lineOldNum = 1;
    let lineNewNum = 1;
    const items: {
      type: "added" | "removed" | "normal";
      content: string;
      oldNum: string | number;
      newNum: string | number;
    }[] = [];

    linesDiff.forEach((chunk) => {
      const lines = chunk.value.split("\n");
      if (lines.length > 1 && lines[lines.length - 1] === "" && chunk.value.endsWith("\n")) {
        lines.pop();
      }

      lines.forEach((line) => {
        if (chunk.added) {
          items.push({
            type: "added",
            content: line,
            oldNum: "",
            newNum: lineNewNum++,
          });
        } else if (chunk.removed) {
          items.push({
            type: "removed",
            content: line,
            oldNum: lineOldNum++,
            newNum: "",
          });
        } else {
          items.push({
            type: "normal",
            content: line,
            oldNum: lineOldNum++,
            newNum: lineNewNum++,
          });
        }
      });
    });

    return items;
  }, [originalCode, patchedCode]);

  // Compile Split Diff Rows
  const splitRows = useMemo(() => {
    if (!originalCode || !patchedCode) return [];
    
    const linesDiff = diffLines(originalCode, patchedCode);
    const rows: {
      left: { num: string | number; content: string; type: "normal" | "removed" | "empty" };
      right: { num: string | number; content: string; type: "normal" | "added" | "empty" };
    }[] = [];

    let leftLine = 1;
    let rightLine = 1;

    for (let i = 0; i < linesDiff.length; i++) {
      const chunk = linesDiff[i];
      const nextChunk = linesDiff[i + 1];

      const currentLines = chunk.value.split("\n");
      if (currentLines.length > 1 && currentLines[currentLines.length - 1] === "" && chunk.value.endsWith("\n")) {
        currentLines.pop();
      }

      if (chunk.removed && nextChunk && nextChunk.added) {
        const nextLines = nextChunk.value.split("\n");
        if (nextLines.length > 1 && nextLines[nextLines.length - 1] === "" && nextChunk.value.endsWith("\n")) {
          nextLines.pop();
        }

        const maxLen = Math.max(currentLines.length, nextLines.length);
        for (let j = 0; j < maxLen; j++) {
          const leftExist = j < currentLines.length;
          const rightExist = j < nextLines.length;

          rows.push({
            left: leftExist ? {
              num: leftLine++,
              content: currentLines[j],
              type: "removed"
            } : {
              num: "",
              content: "",
              type: "empty"
            },
            right: rightExist ? {
              num: rightLine++,
              content: nextLines[j],
              type: "added"
            } : {
              num: "",
              content: "",
              type: "empty"
            }
          });
        }

        i++; // skip next added chunk
      } else if (chunk.removed) {
        currentLines.forEach((line) => {
          rows.push({
            left: {
              num: leftLine++,
              content: line,
              type: "removed"
            },
            right: {
              num: "",
              content: "",
              type: "empty"
            }
          });
        });
      } else if (chunk.added) {
        currentLines.forEach((line) => {
          rows.push({
            left: {
              num: "",
              content: "",
              type: "empty"
            },
            right: {
              num: rightLine++,
              content: line,
              type: "added"
            }
          });
        });
      } else {
        currentLines.forEach((line) => {
          rows.push({
            left: {
              num: leftLine++,
              content: line,
              type: "normal"
            },
            right: {
              num: rightLine++,
              content: line,
              type: "normal"
            }
          });
        });
      }
    }

    return rows;
  }, [originalCode, patchedCode]);

  return (
    <div className="bg-[#0d0f14] border border-white/5 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[480px]" id="code_pane_viewer">
      
      {/* File Selector Tabs toolbar */}
      <div className="bg-black/30 px-4 pt-3 border-b border-white/5 flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Tabs Group */}
        <div className="flex gap-1 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab("original")}
            className={`text-xs font-mono px-3 py-2.5 rounded-t-xl border-t-2 font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "original" 
                ? "bg-[#0d0f14] border-rose-500 text-rose-400" 
                : "border-transparent text-slate-550 hover:text-slate-350 hover:bg-[#0d0f14]/40"
            }`}
          >
            <FileCode className="w-3.5 h-3.5 text-rose-500" />
            buggy_original.py
          </button>

          <button
            onClick={() => setActiveTab("diff")}
            className={`text-xs font-mono px-3 py-2.5 rounded-t-xl border-t-2 font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "diff" 
                ? "bg-[#0d0f14] border-emerald-500 text-emerald-400" 
                : "border-transparent text-slate-550 hover:text-slate-350 hover:bg-[#0d0f14]/40"
            }`}
          >
            <GitCompare className="w-3.5 h-3.5 text-emerald-500" />
            visual_diff
          </button>
          
          <button
            onClick={() => setActiveTab("patched")}
            className={`text-xs font-mono px-3 py-2.5 rounded-t-xl border-t-2 font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "patched" 
                ? "bg-[#0d0f14] border-cyan-500 text-cyan-400" 
                : "border-transparent text-slate-550 hover:text-slate-350 hover:bg-[#0d0f14]/40"
            }`}
          >
            <FileCode className="w-3.5 h-3.5 text-cyan-400" />
            proposed_patch.py
          </button>

          <button
            onClick={() => setActiveTab("test")}
            className={`text-xs font-mono px-3 py-2.5 rounded-t-xl border-t-2 font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "test" 
                ? "bg-[#0d0f14] border-blue-500 text-blue-400" 
                : "border-transparent text-slate-550 hover:text-slate-350 hover:bg-[#0d0f14]/40"
            }`}
          >
            <Play className="w-3.5 h-3.5 text-blue-450" />
            test_exploit.py
          </button>

          <button
            onClick={() => setActiveTab("sandbox")}
            className={`text-xs font-mono px-3 py-2.5 rounded-t-xl border-t-2 font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "sandbox" 
                ? "bg-[#0d0f14] border-purple-500 text-purple-400" 
                : "border-transparent text-slate-550 hover:text-slate-350 hover:bg-[#0d0f14]/40"
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-purple-450" />
            sandbox_status.log
          </button>

          <button
            onClick={() => setActiveTab("qa_logic")}
            className={`text-xs font-mono px-3 py-2.5 rounded-t-xl border-t-2 font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "qa_logic" 
                ? "bg-[#0d0f14] border-cyan-500 text-cyan-400" 
                : "border-transparent text-slate-550 hover:text-slate-350 hover:bg-[#0d0f14]/40"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-cyan-500" />
            qa_logic_check.log
          </button>

          <button
            onClick={() => setActiveTab("reasoning")}
            className={`text-xs font-mono px-3 py-2.5 rounded-t-xl border-t-2 font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "reasoning" 
                ? "bg-[#0d0f14] border-amber-500 text-amber-400" 
                : "border-transparent text-slate-550 hover:text-slate-350 hover:bg-[#0d0f14]/40"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            reasoning_rationale.md
          </button>
        </div>

        {/* Copy, download action items */}
        <div className="flex items-center gap-2 pb-2 shrink-0">
          <span className="text-[10px] text-slate-500 font-mono hidden sm:inline select-none">
            {currentFileName}
          </span>
          <button
            onClick={() => copyToClipboard(currentCode)}
            disabled={!currentCode}
            className="p-1 px-2.5 text-[10.5px] bg-[#050608] hover:bg-[#0a0c10] border border-white/5 text-slate-300 rounded-lg hover:text-white flex items-center gap-1.5 transition duration-150 cursor-pointer disabled:opacity-40"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-cyan-400 animate-bounce" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-cyan-400" />
                Copy {activeTab === "diff" ? "Patch" : ""}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Viewer Workspace */}
      <div className="flex-1 bg-[#0d0f14] p-4 text-slate-300 overflow-y-auto leading-relaxed relative flex flex-col min-h-0">
        
        {activeTab === "diff" ? (
          (!originalCode || !patchedCode) ? (
            <div className="h-full flex-1 flex flex-col items-center justify-center text-slate-550 gap-2 font-sans text-center select-none">
              <GitCompare className="w-8 h-8 opacity-45 text-emerald-500 animate-pulse" />
              <p className="text-[11px] font-mono uppercase tracking-widest text-[#94a3b8]/60">Run cyber swarm first to capture live diff signatures...</p>
            </div>
          ) : (
            <div className="flex flex-col h-full min-h-0">
              
              {/* Diff view control bar */}
              <div className="flex items-center justify-between p-2 mb-3 bg-black/40 border border-white/5 rounded-xl select-none shrink-0">
                <div className="flex items-center gap-2">
                  <GitCompare className="w-4 h-4 text-emerald-400 ml-1" />
                  <span className="text-[10.5px] font-mono tracking-wider font-bold uppercase text-slate-300">Diff Highlight Matrix</span>
                </div>
                <div className="flex gap-1 bg-[#050608]/80 p-0.5 border border-white/5 rounded-lg text-[10px] font-mono">
                  <button
                    onClick={() => setDiffViewMode("split")}
                    className={`px-3 py-1 font-bold rounded-md flex items-center gap-1.5 transition duration-150 cursor-pointer ${
                      diffViewMode === "split" 
                        ? "bg-emerald-500 text-slate-950 font-bold" 
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Split className="w-3 h-3" />
                    Split View
                  </button>
                  <button
                    onClick={() => setDiffViewMode("unified")}
                    className={`px-3 py-1 font-bold rounded-md flex items-center gap-1.5 transition duration-150 cursor-pointer ${
                      diffViewMode === "unified" 
                        ? "bg-emerald-500 text-slate-950 font-bold" 
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <List className="w-3 h-3" />
                    Unified View
                  </button>
                </div>
              </div>

              {/* Diff View Area */}
              <div className="flex-1 overflow-x-auto min-h-0 bg-black/20 rounded-xl border border-white/5 p-1 flex flex-col">
                
                {diffViewMode === "unified" ? (
                  /* Unified 1-column Diff view */
                  <div className="font-mono text-xs overflow-y-auto">
                    <table className="w-full border-collapse">
                      <tbody>
                        {unifiedItems.map((item, idx) => {
                          let bgStyle = "hover:bg-white/5";
                          let numStyle = "text-slate-600";
                          let prefixStyle = "text-slate-650 bg-black/15";
                          let textStyle = "text-slate-300";
                          let prefix = " ";

                          if (item.type === "added") {
                            bgStyle = "bg-emerald-950/20 text-emerald-300 border-l-2 border-emerald-500/50 hover:bg-emerald-950/30";
                            numStyle = "text-emerald-500/70 bg-emerald-950/15";
                            prefixStyle = "text-emerald-400 bg-emerald-950/25 font-bold";
                            textStyle = "text-emerald-250 font-medium";
                            prefix = "+";
                          } else if (item.type === "removed") {
                            bgStyle = "bg-rose-955/20 text-rose-300 border-l-2 border-rose-500/50 hover:bg-rose-955/35";
                            numStyle = "text-rose-500/70 bg-rose-955/15";
                            prefixStyle = "text-rose-400 bg-rose-955/25 font-bold";
                            textStyle = "text-rose-200";
                            prefix = "-";
                          }

                          return (
                            <tr key={idx} className={`group ${bgStyle} transition-colors border-b border-white/[0.02]`}>
                              <td className={`w-12 select-none text-right pr-2.5 text-[10px] border-r border-white/5 py-0.5 font-bold font-mono ${numStyle}`}>
                                {item.oldNum}
                              </td>
                              <td className={`w-12 select-none text-right pr-2.5 text-[10px] border-r border-white/5 py-0.5 font-bold font-mono ${numStyle}`}>
                                {item.newNum}
                              </td>
                              <td className={`w-6 select-none text-center text-[10.5px] font-bold font-mono border-r border-white/5 py-0.5 ${prefixStyle}`}>
                                {prefix}
                              </td>
                              <td className={`pl-3 whitespace-pre font-mono text-[11px] leading-relaxed select-text text-left break-all py-0.5 ${textStyle}`}>
                                {item.content}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  /* Split 2-column Diff view */
                  <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/10 h-full min-h-0 overflow-y-auto">
                    {/* Left Column (Original/Buggy) */}
                    <div className="flex flex-col min-h-[160px] md:min-h-0 h-full">
                      <div className="bg-rose-950/15 text-rose-400 p-2 border-b border-white/5 font-sans font-bold flex items-center gap-1.5 text-[9.5px] uppercase tracking-wider select-none shrink-0">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                        Buggy Original Code
                      </div>
                      <div className="flex-1 overflow-x-auto overflow-y-auto bg-black/5 p-1 scrollbar-thin">
                        <table className="w-full border-collapse">
                          <tbody>
                            {splitRows.map((row, idx) => {
                              const item = row.left;
                              let bgStyle = "hover:bg-white/5";
                              let textStyle = "text-slate-350";
                              let prefix = " ";
                              let prefixStyle = "text-slate-600 bg-black/10";
                              let numStyle = "text-slate-600 bg-black/15";

                              if (item.type === "removed") {
                                bgStyle = "bg-rose-955/20 hover:bg-rose-955/35 border-l-2 border-rose-500/40";
                                textStyle = "text-rose-200";
                                prefix = "-";
                                prefixStyle = "text-rose-400 bg-rose-955/25 font-bold";
                                numStyle = "text-rose-500/70 bg-rose-955/15 font-bold";
                              } else if (item.type === "empty") {
                                bgStyle = "bg-black/35 select-none cursor-default opacity-20 pointer-events-none";
                                textStyle = "text-slate-800";
                                prefixStyle = "bg-black/25";
                                numStyle = "bg-black/25";
                              }

                              return (
                                <tr key={idx} className={`${bgStyle} border-b border-white/[0.02] font-mono transition-all`}>
                                  <td className={`w-12 select-none text-right pr-2.5 text-[10px] border-r border-white/5 py-0.5 ${numStyle}`}>
                                    {item.num}
                                  </td>
                                  <td className={`w-6 select-none text-center text-[10.5px] font-mono border-r border-white/5 py-0.5 ${prefixStyle}`}>
                                    {prefix}
                                  </td>
                                  <td className={`pl-2.5 whitespace-pre text-[11px] leading-relaxed select-text font-mono py-0.5 text-left break-all ${textStyle}`}>
                                    {item.type === "empty" ? "" : item.content}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Right Column (Patched/Defensive) */}
                    <div className="flex flex-col min-h-[160px] md:min-h-0 h-full">
                      <div className="bg-emerald-950/15 text-emerald-400 p-2 border-b border-white/5 font-sans font-bold flex items-center gap-1.5 text-[9.5px] uppercase tracking-wider select-none shrink-0">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        Proposed Patched Code
                      </div>
                      <div className="flex-1 overflow-x-auto overflow-y-auto bg-black/5 p-1 scrollbar-thin">
                        <table className="w-full border-collapse">
                          <tbody>
                            {splitRows.map((row, idx) => {
                              const item = row.right;
                              let bgStyle = "hover:bg-white/5";
                              let textStyle = "text-slate-300";
                              let prefix = " ";
                              let prefixStyle = "text-slate-650 bg-black/10";
                              let numStyle = "text-slate-600 bg-black/15";

                              if (item.type === "added") {
                                bgStyle = "bg-emerald-955/20 hover:bg-emerald-955/35 border-l-2 border-emerald-500/40";
                                textStyle = "text-emerald-250 font-medium";
                                prefix = "+";
                                prefixStyle = "text-emerald-400 bg-emerald-955/25 font-bold";
                                numStyle = "text-emerald-500/70 bg-emerald-955/15 font-bold";
                              } else if (item.type === "empty") {
                                bgStyle = "bg-black/35 select-none cursor-default opacity-20 pointer-events-none";
                                textStyle = "text-slate-800";
                                prefixStyle = "bg-black/25";
                                numStyle = "bg-black/25";
                              }

                              return (
                                <tr key={idx} className={`${bgStyle} border-b border-white/[0.02] font-mono transition-all`}>
                                  <td className={`w-12 select-none text-right pr-2.5 text-[10px] border-r border-white/5 py-0.5 ${numStyle}`}>
                                    {item.num}
                                  </td>
                                  <td className={`w-6 select-none text-center text-[10.5px] font-mono border-r border-white/5 py-0.5 ${prefixStyle}`}>
                                    {prefix}
                                  </td>
                                  <td className={`pl-2.5 whitespace-pre text-[11px] leading-relaxed select-text font-mono py-0.5 text-left break-all ${textStyle}`}>
                                    {item.type === "empty" ? "" : item.content}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          )
        ) : activeTab === "reasoning" ? (
          <div className="flex-1 flex flex-col gap-4 text-slate-350 bg-[#0d0f14]/50 rounded-xl overflow-y-auto pr-1">
            <div className="p-4 flex flex-col gap-4 min-h-0">
              <div className="flex items-center gap-2 select-none border-b border-white/5 pb-2.5">
                <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                <h3 className="text-xs font-mono uppercase tracking-widest text-[#e2e8f0]/90 font-bold">
                  Fix Refactoring Explanation & Rationale
                </h3>
              </div>

              {bugExplanation || patchReasoning ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left panel: Bug explanation description */}
                  <div className="bg-[#0e1117]/80 border border-rose-500/10 rounded-xl p-4 flex flex-col gap-3">
                    <div className="flex items-center gap-2 select-none border-b border-white/5 pb-2">
                      <span className="h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]"></span>
                      <h4 className="text-[11px] font-mono font-bold tracking-wider text-rose-400 uppercase">
                        Detected Logic Defect
                      </h4>
                    </div>
                    <div className="overflow-y-auto max-h-[290px] pr-1 scrollbar-none text-left">
                      {renderMarkdownCustom(bugExplanation || "")}
                    </div>
                  </div>

                  {/* Right panel: Technical rationale changes */}
                  <div className="bg-[#0e1117]/80 border border-emerald-500/10 rounded-xl p-4 flex flex-col gap-3">
                    <div className="flex items-center gap-2 select-none border-b border-white/5 pb-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></span>
                      <h4 className="text-[11px] font-mono font-bold tracking-wider text-emerald-400 uppercase">
                        Technical Rationale (Refactor)
                      </h4>
                    </div>
                    <div className="overflow-y-auto max-h-[290px] pr-1 scrollbar-none text-left">
                      {renderMarkdownCustom(patchReasoning || "")}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500 font-mono gap-2 h-[260px]">
                  <Clock className="w-5 h-5 text-cyan-400 animate-spin" />
                  <p className="text-[11px] uppercase tracking-wider text-[#94a3b8]/60 mt-2">
                    Awaiting compiler completion block to synthesize refactor rationale...
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : activeTab === "qa_logic" ? (
          <div className="flex-1 flex flex-col gap-4 text-slate-350 bg-[#0d0f14]/50 rounded-xl overflow-y-auto pr-1">
            <div className="p-4 bg-black/45 rounded-xl border border-white/5 flex flex-col gap-3">
              <div className="flex justify-between items-center bg-black/55 p-3 rounded-lg border border-white/5">
                <div>
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase font-mono tracking-wider">
                    <ShieldAlert className="w-4 h-4 text-cyan-400" />
                    Security Checklist Evaluation
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-0.5 font-mono">Automated deep rules validation and pattern screening findings</p>
                </div>
                {qaLogicScore !== undefined && qaLogicScore !== null ? (
                  <div className="text-right">
                    <span className="text-[9px] font-mono uppercase text-slate-500 font-bold block">Engine Score</span>
                    <span className={`text-2xl font-black font-mono tracking-tighter ${qaLogicPassed ? "text-cyan-400" : "text-rose-400"}`}>
                      {qaLogicScore} <span className="text-[11px] font-normal text-slate-600">/ 100</span>
                    </span>
                  </div>
                ) : (
                  <div className="text-[10.5px] font-mono text-slate-500">AWAITING ENGINE STABILITY CHECK</div>
                )}
              </div>

              {qaLogicScore !== undefined && qaLogicScore !== null && (
                <div className={`p-3 rounded-lg border text-[11px] font-mono flex items-center gap-2 ${
                  qaLogicPassed 
                    ? "bg-emerald-950/20 text-emerald-400 border-emerald-900/30" 
                    : "bg-rose-950/20 text-rose-400 border-rose-900/30"
                }`}>
                  <span className={`px-1.5 py-0.5 rounded font-bold uppercase text-[9px] ${
                    qaLogicPassed ? "bg-emerald-500 text-slate-950" : "bg-rose-500 text-white"
                  }`}>
                    {qaLogicPassed ? "PASSED" : "FAILED"}
                  </span>
                  <span>
                    {qaLogicPassed 
                      ? "The code successfully passed static safety rule evaluations and conforms to standard best practices."
                      : "Critical best practice or security concerns flagged in evaluation. Refactoring required."
                    }
                  </span>
                </div>
              )}

              <div className="space-y-3 mt-1">
                <h4 className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono">Auditor Checklist Reports</h4>
                {qaLogicFindings && qaLogicFindings.length > 0 ? (
                  <div className="space-y-2">
                    {qaLogicFindings.map((finding, idx) => {
                      const isPass = finding.startsWith("PASS:");
                      const isCritical = finding.startsWith("CRITICAL:");
                      const isHigh = finding.startsWith("HIGH:");
                      
                      let textCol = "text-slate-350";
                      let bgCol = "bg-white/[0.01] border-white/5";
                      if (isPass) {
                        textCol = "text-emerald-400 font-medium";
                        bgCol = "bg-emerald-500/[0.01] border-emerald-500/10";
                      } else if (isCritical) {
                        textCol = "text-rose-400 font-bold";
                        bgCol = "bg-rose-500/5 border-rose-500/20";
                      } else if (isHigh) {
                        textCol = "text-amber-400 font-bold";
                        bgCol = "bg-amber-500/5 border-amber-500/15";
                      }
                      
                      return (
                        <div key={idx} className={`p-3 rounded-xl border text-[11px] font-mono leading-relaxed ${bgCol} ${textCol}`}>
                          {finding}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-500 font-mono py-2 italic flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                    Awaiting QA Logic sub-agent deployment timeline...
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Standard tabs content */
          !currentCode ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-650 gap-2 font-sans text-center select-none">
              <HelpCircle className="w-8 h-8 opacity-40 text-cyan-500" />
              <p className="text-[11px] font-mono uppercase tracking-widest text-[#94a3b8]/60">Wait for agent execution to populate this view...</p>
            </div>
          ) : (
            <div className="relative flex flex-col h-full min-h-0">
              {activeTab === "patched" && (
                <div className="mb-3 p-2.5 bg-cyan-950/20 text-cyan-400 border border-cyan-800/30 rounded-xl text-[10px] flex items-center gap-1.5 select-none shrink-0">
                  <span className="bg-cyan-500 text-slate-950 px-1 py-0.2 rounded font-bold uppercase tracking-wide">SECURE</span>
                  Defensive wrappers injected successfully. All signatures preserved.
                </div>
              )}
              {activeTab === "original" && (
                <div className="mb-3 p-2.5 bg-rose-950/20 text-rose-400 border border-rose-900/30 rounded-xl text-[10px] flex items-center gap-1.5 select-none shrink-0">
                  <span className="bg-rose-500 text-white px-1 py-0.2 rounded font-bold uppercase tracking-wide">VULNERABLE</span>
                  Bug found in code logic. Division safety limits not checked.
                </div>
              )}
              <pre className="flex-1 whitespace-pre-wrap font-mono relative bg-black/20 p-4 rounded-xl border border-white/5 select-text overflow-y-auto text-slate-300 text-[11px] leading-relaxed">
                <code>{currentCode}</code>
              </pre>
            </div>
          )
        )}
      </div>

      {/* Code Status Indicators */}
      <div className="bg-[#050608] px-4 py-2 text-[10px] text-slate-550 border-t border-white/5 flex justify-between font-mono select-none shrink-0">
        <span className="text-slate-500">Lines: {currentCode ? currentCode.split("\n").length : 0} lines</span>
        <span className="text-slate-500">UTF-8 ENCODED PY</span>
      </div>
    </div>
  );
}
