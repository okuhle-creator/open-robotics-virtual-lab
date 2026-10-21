import React from 'react';
import { useSimulation } from '../../context/SimulationContext';
import { Play, Pause, RotateCcw, Plus, Radio, Layers, Settings2, CheckCircle2, AlertOctagon } from 'lucide-react';

export const ConveyorSortingLab: React.FC = () => {
  const {
    conveyorItems,
    conveyorState,
    conveyorMetrics,
    sortRules,
    setSortRules,
    toggleConveyor,
    setConveyorSpeed,
    spawnConveyorItem,
    resetConveyor,
  } = useSimulation();

  const handleRuleTargetChange = (ruleId: string, newBin: 'Bin A' | 'Bin B' | 'Bin C') => {
    setSortRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, targetBin: newBin } : r))
    );
  };

  const handleRuleToggle = (ruleId: string) => {
    setSortRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, active: !r.active } : r))
    );
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 border-l border-slate-800 text-slate-200 select-none overflow-y-auto p-4 space-y-4 scrollbar-thin">
      {/* Header */}
      <div className="border-b border-slate-800 pb-3">
        <h2 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center space-x-2">
          <Layers className="w-4 h-4 text-teal-400" />
          <span>Industrial Conveyor & Sorting Cell</span>
        </h2>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Photoelectric optical inspection, pneumatic diverter & rule-based sorting
        </p>
      </div>

      {/* Real-time Telemetry Metrics Dashboard */}
      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
        <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80">
          <span className="text-[10px] text-slate-500 uppercase block">Total Infeed Spawned</span>
          <span className="text-lg font-bold text-slate-200">{conveyorMetrics.totalSpawned}</span>
        </div>
        <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80">
          <span className="text-[10px] text-slate-500 uppercase block">Active on Belt</span>
          <span className="text-lg font-bold text-sky-400">{conveyorMetrics.remainingOnBelt}</span>
        </div>
        <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80">
          <span className="text-[10px] text-emerald-400 uppercase block">Correctly Sorted</span>
          <span className="text-lg font-bold text-emerald-400">{conveyorMetrics.correctlySorted}</span>
        </div>
        <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80">
          <span className="text-[10px] text-amber-400 uppercase block">Missed / Reject Chute</span>
          <span className="text-lg font-bold text-amber-400">{conveyorMetrics.incorrectlySorted}</span>
        </div>
      </div>

      {/* Primary Conveyor Controls */}
      <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800/80 space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <span>DRIVE MOTOR & INFEED</span>
          <span className="font-mono text-[10px] text-slate-500">{conveyorState.speedMmPerSec} mm/s</span>
        </div>

        {/* Speed Slider */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-mono text-slate-400">
            <span>50 mm/s (Low)</span>
            <span>300 mm/s (High)</span>
          </div>
          <input
            type="range"
            min={50}
            max={300}
            step={10}
            value={conveyorState.speedMmPerSec}
            onChange={(e) => setConveyorSpeed(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
          />
        </div>

        {/* Motor Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={toggleConveyor}
            className={`py-2 rounded font-bold text-xs uppercase flex items-center justify-center space-x-1.5 transition ${
              conveyorState.isRunning
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-teal-600 hover:bg-teal-500 text-white'
            }`}
          >
            {conveyorState.isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{conveyorState.isRunning ? 'PAUSE MOTOR' : 'START MOTOR'}</span>
          </button>

          <button
            onClick={resetConveyor}
            className="py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-bold text-xs uppercase flex items-center justify-center space-x-1.5 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>CLEAR CELL</span>
          </button>
        </div>

        {/* Infeed Object Spawner Buttons */}
        <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
          <div className="text-[10px] font-mono text-slate-400 uppercase">Spawn Specific Workpiece:</div>
          <div className="grid grid-cols-4 gap-1.5 text-xs font-mono">
            <button
              onClick={() => spawnConveyorItem('red', 'box')}
              className="py-1 px-1.5 rounded bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-200 text-center"
            >
              + Red Box
            </button>
            <button
              onClick={() => spawnConveyorItem('green', 'cylinder')}
              className="py-1 px-1.5 rounded bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800 text-emerald-200 text-center"
            >
              + Green Cyl
            </button>
            <button
              onClick={() => spawnConveyorItem('blue', 'box')}
              className="py-1 px-1.5 rounded bg-blue-950/80 hover:bg-blue-900 border border-blue-800 text-blue-200 text-center"
            >
              + Blue Box
            </button>
            <button
              onClick={() => spawnConveyorItem()}
              className="py-1 px-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-teal-300 text-center"
            >
              + Random
            </button>
          </div>
        </div>
      </div>

      {/* Optical Sensor Status Panel */}
      <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800/80 space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <div className="flex items-center space-x-1.5">
            <Radio className="w-3.5 h-3.5 text-teal-400" />
            <span>PHOTOELECTRIC OPTICAL SENSOR (400 mm)</span>
          </div>
          <span
            className={`font-mono text-[10px] px-2 py-0.5 rounded font-bold ${
              conveyorState.opticalSensorTriggered
                ? 'bg-red-950 text-red-300 border border-red-800'
                : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
            }`}
          >
            {conveyorState.opticalSensorTriggered ? 'BEAM BROKEN' : 'BEAM CLEAR'}
          </span>
        </div>

        {conveyorState.sensorDetectedItem ? (
          <div className="p-2 rounded bg-slate-900 border border-slate-800 text-xs font-mono space-y-1">
            <div className="text-slate-300">
              Detected:{' '}
              <strong className="text-teal-300 uppercase">
                {conveyorState.sensorDetectedItem.color} {conveyorState.sensorDetectedItem.shape}
              </strong>
            </div>
            <div className="text-[10px] text-slate-500">
              Linear Offset: {conveyorState.sensorDetectedItem.lateralOffsetMm.toFixed(1)} mm
            </div>
          </div>
        ) : (
          <div className="text-slate-500 text-xs italic py-1">Awaiting workpiece arrival...</div>
        )}
      </div>

      {/* Configurable Sorting Rules Matrix */}
      <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800/80 space-y-2.5">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <div className="flex items-center space-x-1.5">
            <Settings2 className="w-3.5 h-3.5 text-sky-400" />
            <span>SORTING LOGIC RULES MATRIX</span>
          </div>
        </div>

        <div className="space-y-2 text-xs">
          {sortRules.map((rule) => (
            <div
              key={rule.id}
              className={`p-2.5 rounded border flex items-center justify-between font-mono ${
                rule.active
                  ? 'bg-slate-900 border-slate-800 text-slate-200'
                  : 'bg-slate-950 border-slate-850 text-slate-600 opacity-60'
              }`}
            >
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={rule.active}
                  onChange={() => handleRuleToggle(rule.id)}
                  className="rounded bg-slate-800 border-slate-700 text-teal-500"
                />
                <span className="capitalize font-semibold text-slate-200">
                  {rule.color} Items
                </span>
                <span className="text-slate-500 text-[11px]">→</span>
              </div>

              <select
                value={rule.targetBin}
                onChange={(e) =>
                  handleRuleTargetChange(rule.id, e.target.value as 'Bin A' | 'Bin B' | 'Bin C')
                }
                disabled={!rule.active}
                className="bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-xs text-teal-300 font-bold focus:outline-none"
              >
                <option value="Bin A">Bin A (Pusher)</option>
                <option value="Bin B">Bin B (Mid Drop)</option>
                <option value="Bin C">Bin C (End Chute)</option>
              </select>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
