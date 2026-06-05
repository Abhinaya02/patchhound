import React, { useState, useEffect } from "react";
import { 
  Play, 
  Settings2, 
  HelpCircle, 
  ShieldCheck, 
  Sliders, 
  Bug, 
  Award,
  RefreshCw,
  Clock,
  Sparkles,
  Info,
  FileCode,
  Upload
} from "lucide-react";

import Header from "./components/Header";
import AgentGraph from "./components/AgentGraph";
import ConsoleTerminal from "./components/ConsoleTerminal";
import CodePane from "./components/CodePane";
import { SwarmState, LogMessage, LLMProvider, SwarmConfig } from "./types";

// Default Python code for the workspace editor
const DEFAULT_CODE = `def compute_average(data_points: list) -> float:
    # BUG: If telemetry has no recorded inputs, this fails with ZeroDivisionError
    total_sum = sum(data_points)
    points_count = len(data_points)
    return total_sum / points_count
`;

export default function App() {
  const gutterRef = React.useRef<HTMLDivElement>(null);
  const handleTextareaScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (gutterRef.current) {
      gutterRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  // Configuration Settings
  const [config, setConfig] = useState<SwarmConfig>({
    file_path: "telemetry_helper.py",
    module_name: "telemetry_helper",
    provider: "Gemini",
    model: "gemini-2.5-flash",
    max_iterations: 4,
    network_isolation: true,
  });

  // Source script and execution states
  const [sourceCode, setSourceCode] = useState<string>(DEFAULT_CODE);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [currentNode, setCurrentNode] = useState<string>("idle");
  const [testPassed, setTestPassed] = useState<boolean>(false);
  const [iterationCount, setIterationCount] = useState<number>(0);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"original" | "patched" | "diff" | "test" | "sandbox" | "qa_logic" | "reasoning">("original");
  const [isDragging, setIsDragging] = useState<boolean>(false);
  
  // QA Logic states
  const [qaLogicPassed, setQaLogicPassed] = useState<boolean | null>(null);
  const [qaLogicScore, setQaLogicScore] = useState<number | null>(null);
  const [qaLogicFindings, setQaLogicFindings] = useState<string[]>([]);

  // Explainer states (technical rationale & bug details)
  const [bugExplanation, setBugExplanation] = useState<string>("");
  const [patchReasoning, setPatchReasoning] = useState<string>("");

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.name.endsWith(".py")) {
      addUILog("error", "swarm", `File Import Rejected: '${file.name}' is not a valid Python (.py) module.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target && typeof event.target.result === "string") {
        const text = event.target.result;
        setSourceCode(text);
        
        const fileName = file.name;
        const moduleName = fileName.replace(/\.py$/, "");
        
        setConfig((prev) => ({
          ...prev,
          file_path: fileName,
          module_name: moduleName,
        }));

        // Reset output states to avoid stale contexts from previous files
        setVulnerabilities([]);
        setReproductionTest("");
        setProposedPatch("");
        setSandboxLogs("");
        setTestPassed(false);
        setIterationCount(0);
        setCurrentNode("idle");
        setActiveTab("original");
        setQaLogicPassed(null);
        setQaLogicScore(null);
        setQaLogicFindings([]);
        setBugExplanation("");
        setPatchReasoning("");

        addUILog("start", "swarm", `[Upload] Loaded local File '${fileName}' (${text.split("\n").length} lines) to Enclave successfully.`);

        // Smooth scroll to the trigger button area so the user doesn't jump to the ConsoleTerminal at the bottom
        setTimeout(() => {
          document.getElementById("btn_launch_swarm")?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 120);
      }
    };
    reader.readAsText(file);
  };

  // Sub-component data trackers
  const [vulnerabilities, setVulnerabilities] = useState<any[]>([]);
  const [reproductionTest, setReproductionTest] = useState<string>("");
  const [proposedPatch, setProposedPatch] = useState<string>("");
  const [sandboxLogs, setSandboxLogs] = useState<string>("");
  const [logs, setLogs] = useState<LogMessage[]>([]);

  // Time stamp tracker
  const [timeElapsed, setTimeElapsed] = useState<number>(0);

  // Monitor timer during executions
  useEffect(() => {
    let interval: any = null;
    if (isExecuting) {
      interval = setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      setTimeElapsed(0);
    }
    return () => clearInterval(interval);
  }, [isExecuting]);



  // Helper to add clean timestamped log events
  const addUILog = (type: any, node: string, mensaje: string) => {
    const newLog: LogMessage = {
      id: `log_${Date.now()}_${Math.random()}`,
      time: new Date().toLocaleTimeString(),
      type,
      node,
      message: mensaje
    };
    setLogs((prev) => [...prev, newLog]);
  };

  // Launch Multi-Agent swarm streaming
  const launchSwarm = async () => {
    if (isExecuting) return;

    // Validate config imports/values first
    if (!sourceCode.trim()) {
      addUILog("error", "swarm", "Target source code content is blank. Please enter Python instructions before executing.");
      return;
    }

    // Initialize execution parameters
    setIsExecuting(true);
    setTestPassed(false);
    setIterationCount(0);
    setVulnerabilities([]);
    setReproductionTest("");
    setProposedPatch("");
    setSandboxLogs("");
    setLogs([]);
    setCurrentNode("start");
    setActiveTab("original");
    setQaLogicPassed(null);
    setQaLogicScore(null);
    setQaLogicFindings([]);
    setBugExplanation("");
    setPatchReasoning("");

    addUILog("start", "swarm", `Project Patchhound Swarm triggered using provider [${config.provider}] and model [${config.model}]`);

    // Smooth scroll down to the terminal logs view when swarm is triggered
    setTimeout(() => {
      document.getElementById("terminal_output_section")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);

    try {
      const response = await fetch("/api/run-swarm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_code: sourceCode,
          file_path: config.file_path,
          module_name: config.module_name,
          provider: config.provider,
          model: config.model,
          max_iterations: config.max_iterations,
          network_isolation: config.network_isolation
        })
      });

      if (!response.body) {
        throw new Error("HTTP connection failed. Stream response body not readable.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let streamBuffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        streamBuffer += decoder.decode(value, { stream: true });
        const lines = streamBuffer.split("\n\n");
        streamBuffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim() || !line.startsWith("data: ")) continue;
          
          try {
            const rawJSON = line.substring(6).trim();
            const parsed = JSON.parse(rawJSON);

            if (parsed.type === "log" || parsed.type === "transition" || parsed.type === "success" || parsed.type === "warn" || parsed.type === "error" || parsed.type === "timeout" || parsed.type === "end") {
              
              // Map nodes in real-time to trigger UI updates
              if (parsed.node) {
                setCurrentNode(parsed.node);
                if (parsed.node === "scout") {
                  setActiveTab("original");
                } else if (parsed.node === "exploit_architect") {
                  setActiveTab("test");
                } else if (parsed.node === "fix_engineer") {
                  setActiveTab("diff");
                } else if (parsed.node === "qa_logic_check") {
                  setActiveTab("qa_logic");
                } else if (parsed.node === "qa_validator") {
                  setActiveTab("sandbox");
                } else if (parsed.node === "explainer") {
                  setActiveTab("reasoning");
                }
              }

              // Load incremental state mutations
              if (parsed.state) {
                const s = parsed.state;
                if (s.vulnerabilities) setVulnerabilities(s.vulnerabilities);
                if (s.reproduction_test) setReproductionTest(s.reproduction_test);
                if (s.proposed_patch) setProposedPatch(s.proposed_patch);
                if (s.sandbox_logs) setSandboxLogs(s.sandbox_logs);
                if (s.iteration_count !== undefined) setIterationCount(s.iteration_count);
                if (s.test_passed !== undefined) setTestPassed(s.test_passed);
                if (s.last_updated) setLastUpdated(s.last_updated);
                
                // QA state mutations
                if (s.qa_logic_passed !== undefined) setQaLogicPassed(s.qa_logic_passed);
                if (s.qa_logic_score !== undefined) setQaLogicScore(s.qa_logic_score);
                if (s.qa_logic_findings) setQaLogicFindings(s.qa_logic_findings);
                
                // Explainer state mutations
                if (s.bug_explanation !== undefined) setBugExplanation(s.bug_explanation);
                if (s.patch_reasoning !== undefined) setPatchReasoning(s.patch_reasoning);
              }

              // Append formatted stream message to log collection
              const newLog: LogMessage = {
                id: `log_${Date.now()}_${Math.random()}`,
                time: parsed.time || new Date().toLocaleTimeString(),
                type: parsed.type,
                node: parsed.node,
                message: parsed.message
              };
              setLogs((prev) => [...prev, newLog]);
            }
          } catch (err) {
            console.warn("Muted parsing error in streamed chunk:", err);
          }
        }
      }
    } catch (err: any) {
      addUILog("error", "swarm", `Critical runtime exception: ${err.message || err}`);
    } finally {
      setIsExecuting(false);
      setCurrentNode("idle");
    }
  };

  return (
    <div className="min-h-screen bg-[#050608] text-slate-300 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950" id="main_app_wrapper">
      {/* Region 1: TOP UTILITY NAVBAR */}
      <Header activeModel={config.provider === "Gemini" ? (config.model === "gemini-2.5-flash" ? "Gemini-2.5-Flash" : "Gemini-2.5-Pro") : "Llama-3.3"} />

      {/* Primary Workspace Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col gap-6">
        
        {/* Region 2: TWO COLUMN MAIN SPLIT WORKVIEW */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch flex-1">
          
          {/* LEFT COLUMN: Workspace Input & Configurations */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Drag-and-drop / Import source files dashed zone */}
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`bg-[#0d0f14] border border-dashed rounded-xl p-4 flex flex-col items-center justify-center relative transition-all duration-200 ${
                isDragging ? "border-cyan-500 bg-cyan-950/10 shadow-[0_0_15px_rgba(6,182,212,0.15)]" : "border-white/5 hover:border-white/15"
              }`}
            >
              <div className="flex flex-col items-center gap-1.5 text-center text-slate-400 select-none">
                <Upload className="w-5 h-5 text-cyan-400" />
                <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">
                  Drag & Drop python (.py) file or
                </span>
                <label 
                  htmlFor="file-upload-input" 
                  className="px-2.5 py-1 text-[10px] bg-black/40 hover:bg-black/60 border border-white/10 hover:border-cyan-500/30 text-cyan-400 rounded-lg cursor-pointer transition-colors uppercase tracking-wider font-bold"
                >
                  Browse file
                </label>
                <input
                  type="file"
                  id="file-upload-input"
                  accept=".py"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={isExecuting}
                />
              </div>
            </div>

            {/* Code Editor Window with Gutter and Line Numbers */}
            <div className="bg-[#0d0f14] border border-white/5 rounded-xl p-4 flex flex-col flex-1 shadow-2xl relative min-h-[340px]">
              <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
                <div>
                  <h2 className="text-[11px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-cyan-400" />
                    Target Code Input
                  </h2>
                  <p className="text-[9.5px] text-slate-500 font-sans mt-0.5">
                    Editable raw input source code with line gutter scroll tracking
                  </p>
                </div>
                <div className="text-[9.5px] font-mono text-slate-500 uppercase select-none tracking-wider font-bold">
                  Target: <span className="text-cyan-400">{config.file_path}</span>
                </div>
              </div>

              <div className="flex-1 flex font-mono text-xs bg-black/35 border border-white/5 rounded-xl overflow-hidden relative">
                {/* Scroll-Synced Line Numbers Gutter */}
                <div 
                  ref={gutterRef}
                  className="w-11 select-none text-right pr-2.5 py-3.5 text-slate-600 bg-black/20 border-r border-white/5 font-bold font-mono text-[10px] leading-[18px] overflow-hidden scrollbar-none"
                >
                  {Array.from({ length: sourceCode.split("\n").length || 1 }).map((_, i) => (
                    <div key={i} className="h-[18px]">{i + 1}</div>
                  ))}
                </div>
                
                {/* Textarea Code Block */}
                <textarea
                  value={sourceCode}
                  onChange={(e) => setSourceCode(e.target.value)}
                  onScroll={handleTextareaScroll}
                  disabled={isExecuting}
                  className="flex-1 bg-transparent p-3.5 text-slate-200 outline-none resize-none font-mono text-[11px] leading-[18px] h-full overflow-y-auto select-text disabled:opacity-60"
                  placeholder="# Paste your python target instructions or modules here..."
                />
              </div>
            </div>

            {/* Parameters & Controls Panel */}
            <div className="bg-[#0d0f14] border border-white/5 rounded-xl p-4 shadow-xl space-y-4">
              <h2 className="text-[11px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-cyan-400" />
                Parameters & Trigger
              </h2>

              <div className="space-y-4 text-xs font-mono">
                {/* Provider Selector */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-500 text-[9px] uppercase font-bold tracking-wider block mb-1">
                      PROVIDER
                    </label>
                    <select
                      value={config.provider}
                      onChange={(e) => {
                        const nextProvider = e.target.value as LLMProvider;
                        setConfig((prev) => ({
                          ...prev,
                          provider: nextProvider,
                          model: nextProvider === "Gemini" ? "gemini-2.5-flash" : "llama-3.3-70b-versatile"
                        }));
                      }}
                      className="w-full bg-black/50 border border-white/5 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-cyan-500 truncate cursor-pointer"
                    >
                      <option value="Gemini">Gemini API</option>
                      <option value="Groq">Groq API</option>
                    </select>
                  </div>

                  {/* Model Selector */}
                  <div>
                    <label className="text-slate-500 text-[9px] uppercase font-bold tracking-wider block mb-1">
                      TARGET MODEL
                    </label>
                    <select
                      value={config.model}
                      onChange={(e) => setConfig((prev) => ({ ...prev, model: e.target.value }))}
                      className="w-full bg-black/50 border border-white/5 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-cyan-500 truncate cursor-pointer"
                    >
                      {config.provider === "Gemini" ? (
                        <>
                          <option value="gemini-2.5-flash">gemini-2.5-flash</option>
                          <option value="gemini-2.5-pro">gemini-2.5-pro</option>
                        </>
                      ) : (
                        <option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile</option>
                      )}
                    </select>
                  </div>
                </div>

                {/* Slider limit & Isolation policy */}
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-slate-500 text-[9px] uppercase font-bold tracking-wider">
                        REFACTOR CYCLES limit
                      </label>
                      <span className="text-cyan-400 text-[10px] font-bold">{config.max_iterations} attempts</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="8"
                      value={config.max_iterations}
                      onChange={(e) => setConfig((prev) => ({ ...prev, max_iterations: parseInt(e.target.value) }))}
                      className="w-full accent-cyan-500 cursor-pointer h-1 rounded-lg bg-black/40"
                    />
                  </div>

                  <div className="bg-black/30 p-2.5 rounded-lg border border-white/5 flex items-center justify-between">
                    <div className="text-left py-0.5">
                      <span className="text-[9px] tracking-wider uppercase font-bold text-slate-400 block">
                        WSB Isolation Policy
                      </span>
                      <span className="text-[8.5px] text-slate-500 leading-relaxed block">
                        NetworkDisabled isolation active
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.network_isolation}
                      onChange={(e) => setConfig((prev) => ({ ...prev, network_isolation: e.target.checked }))}
                      className="w-3.5 h-3.5 accent-cyan-500 rounded cursor-pointer"
                    />
                  </div>
                </div>

                {/* Launcher Swarm Trigger */}
                <div className="pt-2">
                  <button
                    type="button"
                    id="btn_launch_swarm"
                    onClick={launchSwarm}
                    disabled={isExecuting}
                    className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold uppercase tracking-wider py-2.5 px-4 rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.15)] hover:shadow-[0_0_25px_rgba(6,182,212,0.3)] transition duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed text-xs"
                  >
                    {isExecuting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                        Running execution...
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current text-slate-950" />
                        Trigger Autonomous Swarm
                      </>
                    )}
                  </button>

                  {isExecuting && (
                    <div className="text-center text-[10px] text-slate-500 flex items-center justify-center gap-1.5 select-none mt-2">
                      <Clock className="w-3.5 h-3.5 animate-spin text-cyan-455" />
                      Time Elapsed: <span className="text-cyan-400 font-bold">{timeElapsed} s</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: The Solution Engine (Split Vertically) */}
          <div className="lg:col-span-7 flex flex-col gap-6 justify-between items-stretch">
            
            {/* Top Half: Visual Code Diff Engine representing the patched modifications */}
            <div className="flex-1 flex flex-col min-h-[380px] h-[380px]">
              <CodePane 
                originalCode={sourceCode}
                patchedCode={proposedPatch}
                testCode={reproductionTest}
                sandboxLogs={sandboxLogs}
                filePath={config.file_path}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                qaLogicPassed={qaLogicPassed}
                qaLogicScore={qaLogicScore}
                qaLogicFindings={qaLogicFindings}
                bugExplanation={bugExplanation}
                patchReasoning={patchReasoning}
              />
            </div>

            {/* Bottom Half: Appendix-style live shell log viewport */}
            <div className="flex-1 flex flex-col min-h-[380px] h-[380px]" id="terminal_output_section">
              <ConsoleTerminal 
                logs={logs}
                onClear={() => setLogs([])}
                isExecuting={isExecuting}
              />
            </div>

          </div>

        </div>

        {/* Vulnerabilities report flags (Rendered optionally above footer) */}
        {vulnerabilities.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="vulnerability_report_summary animate-fade-in">
            <div className="bg-[#0d0f14] p-4 rounded-xl border border-rose-500/20 shadow-lg flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-mono font-bold tracking-widest text-[#94a3b8]/40 uppercase">Audit Phase Results</span>
                <h4 className="text-xs font-bold text-white mt-1 uppercase flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]"></span>
                  Auditor Findings
                </h4>
              </div>
              <div className="mt-2 text-left">
                <p className="text-2xl font-black text-rose-450 font-mono">{vulnerabilities.length}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Known vulnerability vectors flagged</p>
              </div>
            </div>

            <div className="bg-[#0d0f14] p-4 rounded-xl border border-amber-500/25 shadow-lg flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-mono font-bold tracking-widest text-[#94a3b8]/40 uppercase">Severe Flags</span>
                <h4 className="text-xs font-bold text-white mt-1 uppercase flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b]"></span>
                  Max Severity Index
                </h4>
              </div>
              <div className="mt-2 text-left">
                <p className="text-2.5xl font-black text-amber-400 font-mono">
                  {vulnerabilities[0]?.severity || "CRITICAL"}
                </p>
                <p className="text-[10px] text-slate-550 mt-0.5">Critical exception thresholds</p>
              </div>
            </div>

            <div className="bg-[#0d0f14] p-4 rounded-xl border border-cyan-500/25 shadow-lg flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-mono font-bold tracking-widest text-[#94a3b8]/40 uppercase">Validation Success Metrics</span>
                <h4 className="text-xs font-bold text-white mt-1 uppercase flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-cyan-500 shadow-[0_0_8px_#06b6d4] animate-pulse"></span>
                  Sandbox Status Code
                </h4>
              </div>
              <div className="mt-2 text-left">
                <p className="text-xl font-black text-cyan-400 font-mono">
                  {testPassed ? "CODE 0 (PASSED)" : "PENDING FIX"}
                </p>
                <p className="text-[10px] text-slate-550 mt-0.5">Dynamic validation assertion results</p>
              </div>
            </div>
          </div>
        )}

        {/* Region 3: BOTTOM SWARM STATUS TICKER BAR */}
        <AgentGraph 
          currentNode={currentNode}
          isExecuting={isExecuting}
          iterationCount={iterationCount}
          maxIterations={config.max_iterations}
          testPassed={testPassed}
        />

      </main>

      {/* Footer Info credit lines */}
      <footer className="border-t border-white/5 bg-black/40 px-6 py-5 mt-auto flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-550 font-mono tracking-widest">
        <span>PROJECT PATCHHOUND SWARM • MICROSOFT BUILD AI 2026</span>
        <div className="flex items-center gap-4 mt-2 sm:mt-0 select-none">
          <div className="flex gap-4 uppercase select-none opacity-80">
            <span>Mem: 4.2GB / 8GB</span>
            <span>Nodes: 04 Online</span>
            <span>Status: Nominal</span>
          </div>
          <span>•</span>
          <div className="flex gap-1 items-center">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-450 shadow-[0_0_6px_#06b6d4]"></div>
            <span className="text-cyan-400">SECURE ENCLAVE ACTIVE</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
