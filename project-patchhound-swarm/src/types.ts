// Shared TypeScript declarations for Project Patchhound Swarm

export interface Vulnerability {
  flaw_type: string;
  line_number: number;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface SwarmState {
  source_code: string;
  file_path: string;
  module_name: string;
  vulnerabilities: Vulnerability[];
  reproduction_test: string;
  proposed_patch: string;
  sandbox_logs: string;
  test_passed: boolean;
  iteration_count: number;
  max_iterations: number;
  execution_history: string[];
  current_node?: string;
  last_updated?: string;
  qa_logic_passed?: boolean;
  qa_logic_score?: number;
  qa_logic_findings?: string[];
  bug_explanation?: string;
  patch_reasoning?: string;
}

export interface LogMessage {
  id: string;
  time: string;
  type: 'start' | 'info' | 'transition' | 'log' | 'error' | 'warn' | 'success' | 'timeout' | 'end';
  node: string;
  message: string;
  state?: any;
}

export type LLMProvider = 'Gemini' | 'Groq' | 'LocalSimulation';

export interface SwarmConfig {
  file_path: string;
  module_name: string;
  provider: LLMProvider;
  model: string;
  max_iterations: number;
  network_isolation: boolean;
}
