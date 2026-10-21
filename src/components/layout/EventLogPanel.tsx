import React, { useState } from 'react';
import { useSimulation } from '../../context/SimulationContext';
import { Terminal, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

export const EventLogPanel: React.FC = () => {
  const { eventLogs, clearLogs } = useSimulation();
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [filter, setFilter] = useState<'all' | 'motion' | 'sensor' | 'task' | 'system'>('all');

  const filteredLogs = eventLogs.filter((log) => filter === 'all' || log.category === filter);

  return (
    <div className="bg-slate-900 border-t border-slate-800 transition-all select-none">
      {/* Panel Header */}
      <div className="h-7 px-3 bg-slate-950/70 border-b border-slate-800/80 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2">
          <Terminal className="w-3.5 h-3.5 text-teal-400" />
          <span className="font-mono text-slate-300 font-bold text-[11px]">TELEMETRY & SYSTEM LOG</span>
          <span className="text-[10px] text-slate-500 font-mono">({filteredLogs.length} events)</span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Category filter buttons */}
          {(['all', 'motion', 'sensor', 'task', 'system'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-mono transition ${
                filter === cat
                  ? 'bg-teal-900/60 text-teal-300 border border-teal-700/60'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {cat}
            </button>
          ))}

          <span className="text-slate-700">|</span>

          <button
            onClick={clearLogs}
            className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition"
            title="Clear all logs"
          >
            <Trash2 className="w-3 h-3" />
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition"
          >
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Log Feed */}
      {isExpanded && (
        <div className="h-28 overflow-y-auto p-2 font-mono text-[11px] space-y-1 bg-slate-950/90 scrollbar-thin">
          {filteredLogs.length === 0 ? (
            <div className="text-slate-600 italic py-2 text-center">No telemetry events logged.</div>
          ) : (
            filteredLogs.map((log) => {
              const levelColors = {
                info: 'text-slate-300',
                warn: 'text-amber-400',
                error: 'text-red-400 font-semibold',
                success: 'text-emerald-400',
              };

              const badgeColors = {
                motion: 'text-sky-400 bg-sky-950/60 border-sky-800',
                sensor: 'text-amber-400 bg-amber-950/60 border-amber-800',
                task: 'text-purple-400 bg-purple-950/60 border-purple-800',
                system: 'text-slate-400 bg-slate-800 border-slate-700',
              };

              return (
                <div key={log.id} className="flex items-start space-x-2 leading-relaxed">
                  <span className="text-slate-600 shrink-0">[{log.timestamp}]</span>
                  <span
                    className={`px-1 rounded text-[9px] uppercase border shrink-0 ${
                      badgeColors[log.category]
                    }`}
                  >
                    {log.category}
                  </span>
                  <span className={`break-all ${levelColors[log.level]}`}>{log.message}</span>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
