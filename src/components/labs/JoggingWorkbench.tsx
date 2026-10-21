import React, { useState } from 'react';
import { useSimulation } from '../../context/SimulationContext';
import { CartesianCoord } from '../../types/robot';
import { Sliders, Move, RotateCcw, AlertTriangle, CheckCircle, Navigation } from 'lucide-react';

export const JoggingWorkbench: React.FC = () => {
  const {
    robot,
    jointAngles,
    setJointAngle,
    gripperState,
    setGripperState,
    tcpPose,
    moveToCartesianTarget,
    resetToHome,
    isNearSingularity,
    singularityWarning,
    settings,
    updateSettings,
  } = useSimulation();

  // Cartesian jogging inputs
  const [targetX, setTargetX] = useState<number>(Math.round(tcpPose.x));
  const [targetY, setTargetY] = useState<number>(Math.round(tcpPose.y));
  const [targetZ, setTargetZ] = useState<number>(Math.round(tcpPose.z));
  const [targetPitch, setTargetPitch] = useState<number>(90);
  const [ikStatus, setIkStatus] = useState<{ success: boolean; message: string } | null>(null);

  const handleCartesianMove = (e: React.FormEvent) => {
    e.preventDefault();
    const target: CartesianCoord = { x: targetX, y: targetY, z: targetZ };
    const res = moveToCartesianTarget(target, targetPitch);
    setIkStatus(res);
  };

  const syncCurrentToTarget = () => {
    setTargetX(Math.round(tcpPose.x));
    setTargetY(Math.round(tcpPose.y));
    setTargetZ(Math.round(tcpPose.z));
    setIkStatus(null);
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 border-l border-slate-800 text-slate-200 select-none overflow-y-auto p-4 space-y-5 scrollbar-thin">
      {/* Panel Header */}
      <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
        <div>
          <h2 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-teal-400" />
            <span>Robot Jog & Kinematics Controller</span>
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Manual axis jogging, forward kinematics readout & analytical IK solver
          </p>
        </div>
        <button
          onClick={resetToHome}
          className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-teal-400 border border-slate-700 text-xs font-mono transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>ZERO / HOME</span>
        </button>
      </div>

      {/* ================= JOINT AXIS JOGGING CONTROLS ================= */}
      <div className="space-y-3 bg-slate-950/60 p-3.5 rounded-lg border border-slate-800/80">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <span>JOINT ANGLE CONTROLS (DEGREES)</span>
          <span className="text-[10px] font-mono text-slate-500">{robot.dof} DEGREES OF FREEDOM</span>
        </div>

        <div className="space-y-3 pt-1">
          {robot.jointLimits.map((limit, idx) => {
            const currentAngle = jointAngles[idx] !== undefined ? jointAngles[idx] : 0;
            const progress = ((currentAngle - limit.minDeg) / (limit.maxDeg - limit.minDeg)) * 100;

            return (
              <div key={limit.name} className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-300 font-medium">{limit.name}</span>
                  <div className="space-x-1.5">
                    <span className="text-slate-500 text-[10px]">[{limit.minDeg}° / {limit.maxDeg}°]</span>
                    <strong className="text-teal-300 px-1.5 py-0.2 rounded bg-slate-800">
                      {currentAngle.toFixed(1)}°
                    </strong>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setJointAngle(idx, currentAngle - 5)}
                    className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center justify-center font-bold"
                  >
                    -
                  </button>
                  <input
                    type="range"
                    min={limit.minDeg}
                    max={limit.maxDeg}
                    step={1}
                    value={currentAngle}
                    onChange={(e) => setJointAngle(idx, parseFloat(e.target.value))}
                    className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
                  />
                  <button
                    onClick={() => setJointAngle(idx, currentAngle + 5)}
                    className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center justify-center font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= CARTESIAN INVERSE KINEMATICS JOGGING ================= */}
      <form
        onSubmit={handleCartesianMove}
        className="space-y-3 bg-slate-950/60 p-3.5 rounded-lg border border-slate-800/80"
      >
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <div className="flex items-center space-x-1.5">
            <Move className="w-3.5 h-3.5 text-sky-400" />
            <span>CARTESIAN POSITIONING (IK SOLVER)</span>
          </div>
          <button
            type="button"
            onClick={syncCurrentToTarget}
            className="text-[10px] text-sky-400 hover:underline font-mono"
          >
            Sync from TCP
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs font-mono">
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">X (mm)</label>
            <input
              type="number"
              value={targetX}
              onChange={(e) => setTargetX(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-100 font-bold focus:outline-none focus:border-teal-500"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Y (mm)</label>
            <input
              type="number"
              value={targetY}
              onChange={(e) => setTargetY(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-100 font-bold focus:outline-none focus:border-teal-500"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Z (mm)</label>
            <input
              type="number"
              value={targetZ}
              onChange={(e) => setTargetZ(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-100 font-bold focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>

        {/* Quick Jog Buttons */}
        <div className="flex items-center space-x-1.5 pt-1">
          <span className="text-[10px] font-mono text-slate-500">NUDGE Z:</span>
          {[-20, -5, +5, +20].map((delta) => (
            <button
              key={delta}
              type="button"
              onClick={() => {
                const nextZ = targetZ + delta;
                setTargetZ(nextZ);
                moveToCartesianTarget({ x: targetX, y: targetY, z: nextZ }, targetPitch);
              }}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[10px]"
            >
              {delta > 0 ? `+${delta}` : delta}
            </button>
          ))}
        </div>

        <button
          type="submit"
          className="w-full py-2 rounded bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs uppercase tracking-wider transition flex items-center justify-center space-x-2 shadow-sm"
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>SOLVE IK & MOVE TO TARGET</span>
        </button>

        {/* IK Execution Result Feedback */}
        {ikStatus && (
          <div
            className={`p-2 rounded text-[11px] font-mono flex items-start space-x-2 ${
              ikStatus.success
                ? 'bg-emerald-950/70 border border-emerald-800/80 text-emerald-300'
                : 'bg-red-950/70 border border-red-800/80 text-red-300'
            }`}
          >
            {ikStatus.success ? (
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            )}
            <span>{ikStatus.message}</span>
          </div>
        )}
      </form>

      {/* ================= END-EFFECTOR GRIPPER CONTROL ================= */}
      <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800/80 space-y-2">
        <div className="text-xs font-semibold text-slate-300">END EFFECTOR GRIPPER</div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setGripperState('open')}
            className={`py-2 rounded text-xs font-bold font-mono transition border ${
              gripperState === 'open'
                ? 'bg-teal-600 border-teal-500 text-white'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
            }`}
          >
            OPEN GRIPPER
          </button>
          <button
            onClick={() => setGripperState('closed')}
            className={`py-2 rounded text-xs font-bold font-mono transition border ${
              gripperState === 'closed'
                ? 'bg-teal-600 border-teal-500 text-white'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
            }`}
          >
            CLOSE GRIPPER
          </button>
        </div>
      </div>

      {/* ================= VIEWPORT OVERLAYS SETTINGS ================= */}
      <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800/80 space-y-2 text-xs">
        <div className="font-semibold text-slate-300">3D WORKCELL VISUALIZATION</div>
        <div className="space-y-1.5 text-slate-400">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.showFloorGrid}
              onChange={(e) => updateSettings({ showFloorGrid: e.target.checked })}
              className="rounded bg-slate-800 border-slate-700 text-teal-500"
            />
            <span>Show Millimeter Engineering Floor Grid</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.showCoordinateAxes}
              onChange={(e) => updateSettings({ showCoordinateAxes: e.target.checked })}
              className="rounded bg-slate-800 border-slate-700 text-teal-500"
            />
            <span>Show Coordinate Axes Triads (X, Y, Z)</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.showWorkspaceEnvelope}
              onChange={(e) => updateSettings({ showWorkspaceEnvelope: e.target.checked })}
              className="rounded bg-slate-800 border-slate-700 text-teal-500"
            />
            <span>Show Maximum Reachable Workspace Envelope</span>
          </label>
        </div>
      </div>
    </div>
  );
};
