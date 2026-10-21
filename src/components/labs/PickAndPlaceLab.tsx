import React from 'react';
import { useSimulation } from '../../context/SimulationContext';
import { Play, Pause, RotateCcw, Box, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

export const PickAndPlaceLab: React.FC = () => {
  const {
    workpieces,
    targetSlots,
    pickPlaceState,
    selectWorkpieceForTask,
    runPickPlaceCycle,
    pausePickPlace,
    resumePickPlace,
    resetPickPlace,
    manualPickObject,
    manualPlaceObject,
  } = useSimulation();

  const activeWorkpiece = workpieces.find((w) => w.id === pickPlaceState.activeWorkpieceId);
  const activeSlot = targetSlots.find((s) => s.id === pickPlaceState.targetSlotId);

  return (
    <div className="h-full flex flex-col bg-slate-900 border-l border-slate-800 text-slate-200 select-none overflow-y-auto p-4 space-y-4 scrollbar-thin">
      {/* Header */}
      <div className="border-b border-slate-800 pb-3">
        <h2 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center space-x-2">
          <Box className="w-4 h-4 text-teal-400" />
          <span>Industrial Pick & Place Workcell</span>
        </h2>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Automated palletizing, contact verification & multi-stage material transfer
        </p>
      </div>

      {/* Task Execution Progress Bar & State Display */}
      <div className="bg-slate-950/70 p-3.5 rounded-lg border border-slate-800/80 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-300">CYCLE STATUS:</span>
          <span
            className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded ${
              pickPlaceState.stage === 'COMPLETED'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                : pickPlaceState.isRunning
                ? 'bg-sky-950 text-sky-300 border border-sky-800 animate-pulse'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {pickPlaceState.stage.replace(/_/g, ' ')}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
          <div
            className="bg-teal-500 h-full transition-all duration-300 ease-out"
            style={{ width: `${pickPlaceState.progressPercent}%` }}
          />
        </div>

        {/* Stage Steps Indicator */}
        <div className="grid grid-cols-4 gap-1 text-[9px] font-mono text-center text-slate-500 pt-1">
          <div className={pickPlaceState.progressPercent >= 25 ? 'text-teal-400 font-bold' : ''}>
            1. APPROACH
          </div>
          <div className={pickPlaceState.progressPercent >= 45 ? 'text-teal-400 font-bold' : ''}>
            2. GRASP
          </div>
          <div className={pickPlaceState.progressPercent >= 70 ? 'text-teal-400 font-bold' : ''}>
            3. TRANSIT
          </div>
          <div className={pickPlaceState.progressPercent >= 95 ? 'text-teal-400 font-bold' : ''}>
            4. PLACE
          </div>
        </div>

        {/* Controls: Start / Pause / Reset */}
        <div className="grid grid-cols-3 gap-2 pt-2">
          {!pickPlaceState.isRunning ? (
            <button
              onClick={runPickPlaceCycle}
              className="py-2 rounded bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs uppercase flex items-center justify-center space-x-1.5 transition shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>START</span>
            </button>
          ) : (
            <button
              onClick={pausePickPlace}
              className="py-2 rounded bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs uppercase flex items-center justify-center space-x-1.5 transition shadow-sm"
            >
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>PAUSE</span>
            </button>
          )}

          <button
            onClick={resetPickPlace}
            className="py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-bold text-xs uppercase flex items-center justify-center space-x-1.5 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>RESET</span>
          </button>

          <div className="bg-slate-900 border border-slate-800 rounded flex flex-col items-center justify-center text-center p-1 font-mono">
            <span className="text-[9px] text-slate-500">CYCLES</span>
            <span className="text-xs font-bold text-teal-400">{pickPlaceState.cycleCount}</span>
          </div>
        </div>
      </div>

      {/* Source Workpieces Selection */}
      <div className="space-y-2 bg-slate-950/60 p-3.5 rounded-lg border border-slate-800/80">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <span>SOURCE STAGING INVENTORY</span>
          <span className="text-[10px] font-mono text-slate-500">CLICK TO SELECT</span>
        </div>

        <div className="space-y-1.5">
          {workpieces.map((wp) => {
            const isSelected = wp.id === pickPlaceState.activeWorkpieceId;

            return (
              <div
                key={wp.id}
                onClick={() => selectWorkpieceForTask(wp.id)}
                className={`p-2.5 rounded border cursor-pointer transition flex items-center justify-between text-xs ${
                  isSelected
                    ? 'bg-slate-800/90 border-teal-500 text-white'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: wp.color }} />
                  <div>
                    <div className="font-semibold text-slate-200">{wp.name}</div>
                    <div className="text-[10px] font-mono text-slate-500">
                      Loc: [{wp.position.x}, {wp.position.y}, {wp.position.z}] mm
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  {wp.delivered ? (
                    <span className="text-[10px] font-mono text-emerald-400 flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>DELIVERED</span>
                    </span>
                  ) : wp.grasped ? (
                    <span className="text-[10px] font-mono text-amber-400">HELD IN JAWS</span>
                  ) : (
                    <span className="text-[10px] font-mono text-slate-500">READY</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Target Destination Pallet Slots */}
      <div className="space-y-2 bg-slate-950/60 p-3.5 rounded-lg border border-slate-800/80">
        <div className="text-xs font-semibold text-slate-300">TARGET PALLET DESTINATIONS</div>
        <div className="space-y-1.5">
          {targetSlots.map((slot) => {
            const isAssigned = activeWorkpiece?.targetSlotId === slot.id;

            return (
              <div
                key={slot.id}
                className={`p-2.5 rounded border flex items-center justify-between text-xs ${
                  isAssigned
                    ? 'bg-slate-800/80 border-sky-500 text-white'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-sm border"
                    style={{ borderColor: slot.colorHint }}
                  />
                  <span className="font-medium text-slate-200">{slot.name}</span>
                </div>
                <div className="font-mono text-[10px] text-slate-500">
                  [{slot.position.x}, {slot.position.y}]
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Manual Step Controls (Deterministic testing of grasping logic) */}
      <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800/80 space-y-2">
        <div className="text-xs font-semibold text-slate-300">MANUAL MANIPULATION OVERRIDE</div>
        <p className="text-[11px] text-slate-500">
          Verify physical contact before grasping: gripper must be within 45mm of target workpiece.
        </p>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={() => activeWorkpiece && manualPickObject(activeWorkpiece.id)}
            disabled={!activeWorkpiece || activeWorkpiece.grasped}
            className="py-1.5 px-2 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-mono transition border border-slate-700"
          >
            GRASP SELECTED
          </button>
          <button
            onClick={() => activeSlot && manualPlaceObject(activeSlot.id)}
            disabled={!workpieces.some((w) => w.grasped)}
            className="py-1.5 px-2 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-mono transition border border-slate-700"
          >
            RELEASE ON TRAY
          </button>
        </div>
      </div>
    </div>
  );
};
