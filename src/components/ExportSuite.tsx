import React, { useState } from 'react';
import { ExportBundle } from '../quantum/adapters';
import { QuantumSystemState, BenchmarkResult, DecoherenceParams, GateOperation } from '../quantum/types';
import { generateLatexReport } from '../quantum/latexExport';
import { FileText, Code2, Monitor, Download, Copy, Check, Terminal, ExternalLink } from 'lucide-react';

interface ExportSuiteProps {
  adapters: ExportBundle;
  systemState: QuantumSystemState;
  benchmark: BenchmarkResult;
  params: DecoherenceParams;
  gates: GateOperation[];
}

export const ExportSuite: React.FC<ExportSuiteProps> = ({
  adapters,
  systemState,
  benchmark,
  params,
  gates
}) => {
  const [activeTab, setActiveTab] = useState<'LaTeX' | 'SDK_Adapters' | 'Multiplatform'>('LaTeX');
  const [selectedSdk, setSelectedSdk] = useState<keyof ExportBundle>('qiskitPython');
  const [selectedPlatform, setSelectedPlatform] = useState<'Linux' | 'Windows' | 'macOS'>('Linux');
  const [copied, setCopied] = useState(false);

  const latexCode = generateLatexReport(systemState, benchmark, params, gates);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col bg-slate-900/90 rounded-xl border border-slate-800 overflow-hidden shadow-xl text-xs font-mono">
      {/* Tab Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('LaTeX')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors ${
              activeTab === 'LaTeX' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>LaTeX Research Report</span>
          </button>
          <button
            onClick={() => setActiveTab('SDK_Adapters')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors ${
              activeTab === 'SDK_Adapters' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Quantum SDK Adapters</span>
          </button>
          <button
            onClick={() => setActiveTab('Multiplatform')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors ${
              activeTab === 'Multiplatform' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Multi-Platform CLI (Linux/Win/Mac)</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'LaTeX' && (
            <>
              <button
                onClick={() => handleCopy(latexCode)}
                className="flex items-center gap-1 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'COPIED' : 'COPY .TEX'}</span>
              </button>
              <button
                onClick={() => handleDownload(latexCode, '4d_quantum_entanglement_report.tex')}
                className="flex items-center gap-1 px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>DOWNLOAD .TEX</span>
              </button>
            </>
          )}

          {activeTab === 'SDK_Adapters' && (
            <>
              <button
                onClick={() => handleCopy(adapters[selectedSdk])}
                className="flex items-center gap-1 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'COPIED' : 'COPY CODE'}</span>
              </button>
              <button
                onClick={() =>
                  handleDownload(
                    adapters[selectedSdk],
                    selectedSdk === 'openQASM3'
                      ? 'circuit.qasm'
                      : selectedSdk === 'qsharp'
                      ? 'circuit.qs'
                      : 'circuit.py'
                  )
                }
                className="flex items-center gap-1 px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>DOWNLOAD</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tab 1: LaTeX Export */}
      {activeTab === 'LaTeX' && (
        <div className="flex flex-col bg-slate-950 p-4 space-y-3">
          <div className="flex items-center justify-between text-slate-400 text-[11px] pb-2 border-b border-slate-800">
            <span>FORMAT: Physical Review A / IEEE Quantum Engineering (RevTeX 4-2)</span>
            <span className="text-emerald-400">Includes TikZ Circuit Diagram & PGFplots Curve</span>
          </div>

          <div className="relative">
            <pre className="h-96 overflow-y-auto p-4 bg-slate-900 rounded-lg border border-slate-800 text-slate-300 text-xs leading-relaxed select-text font-mono">
              {latexCode}
            </pre>
          </div>
        </div>
      )}

      {/* Tab 2: Quantum SDK Adapters */}
      {activeTab === 'SDK_Adapters' && (
        <div className="flex flex-col bg-slate-950 p-4 space-y-3">
          {/* Sub-selector for SDK */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'qiskitPython', label: 'Qiskit (IBM Quantum)' },
              { id: 'cirqPython', label: 'Cirq (Google Quantum AI)' },
              { id: 'pennylanePython', label: 'PennyLane (Xanadu)' },
              { id: 'openQASM3', label: 'OpenQASM 3.0' },
              { id: 'qsharp', label: 'Q# (Azure Quantum)' },
              { id: 'stimCircuit', label: 'Stim (Clifford)' }
            ].map(sdk => (
              <button
                key={sdk.id}
                onClick={() => setSelectedSdk(sdk.id as keyof ExportBundle)}
                className={`px-3 py-1.5 rounded border transition-colors ${
                  selectedSdk === sdk.id
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {sdk.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <pre className="h-96 overflow-y-auto p-4 bg-slate-900 rounded-lg border border-slate-800 text-slate-300 text-xs leading-relaxed select-text font-mono">
              {adapters[selectedSdk]}
            </pre>
          </div>
        </div>
      )}

      {/* Tab 3: Multi-Platform Support */}
      {activeTab === 'Multiplatform' && (
        <div className="flex flex-col bg-slate-950 p-4 space-y-4">
          <div className="flex items-center gap-2">
            {(['Linux', 'Windows', 'macOS'] as const).map(plat => (
              <button
                key={plat}
                onClick={() => setSelectedPlatform(plat)}
                className={`px-4 py-2 rounded font-bold border transition-colors ${
                  selectedPlatform === plat
                    ? 'bg-cyan-600 text-white border-cyan-500'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {plat}
              </button>
            ))}
          </div>

          <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-slate-300">
              <span className="font-bold text-sm">
                {selectedPlatform === 'Linux' && 'Linux Cluster & Server Deployment (Ubuntu / Debian / RHEL)'}
                {selectedPlatform === 'Windows' && 'Windows 11 / Server DirectML & WSL2 Execution'}
                {selectedPlatform === 'macOS' && 'macOS Apple Silicon (Metal Performance Shaders / M-Series)'}
              </span>
              <button
                onClick={() =>
                  handleCopy(
                    selectedPlatform === 'Linux'
                      ? adapters.cliBashLinux
                      : selectedPlatform === 'Windows'
                      ? adapters.cliPowershellWindows
                      : adapters.cliDarwinMac
                  )
                }
                className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'COPIED' : 'COPY SCRIPT'}</span>
              </button>
            </div>

            <pre className="p-3 bg-slate-950 rounded border border-slate-800 text-cyan-300 overflow-x-auto text-xs leading-relaxed">
              {selectedPlatform === 'Linux' && adapters.cliBashLinux}
              {selectedPlatform === 'Windows' && adapters.cliPowershellWindows}
              {selectedPlatform === 'macOS' && adapters.cliDarwinMac}
            </pre>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-[11px] text-slate-400">
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800/80">
                <span className="text-slate-200 font-bold block mb-1">1. Acceleration Support</span>
                <span>NVIDIA CUDA 12.x, AMD ROCm 6.x, and Apple Metal Shaders.</span>
              </div>
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800/80">
                <span className="text-slate-200 font-bold block mb-1">2. Infinity Anchor</span>
                <span>Topological gauge parity anchored to 1020103010401050106010701080.</span>
              </div>
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800/80">
                <span className="text-slate-200 font-bold block mb-1">3. Script Compatibility</span>
                <span>Directly interoperable with Slurm, Docker, and Singularity HPC clusters.</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
