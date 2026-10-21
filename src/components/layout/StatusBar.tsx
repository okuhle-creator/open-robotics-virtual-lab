import React from 'react';
import { useSimulation } from '../../context/SimulationContext';
import { Crosshair, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const StatusBar: React.FC = () => {
  const { tcpPose, gripperState, isNearSingularity, singularityWarning, robot } = useSimulation();

  return (
    <div className="h-8 bg-slate-900 border-t border-slate-800 px-4 flex items-center justify-between text-[11px] font-mono text-slate-400 select-none">
      {/* Left: TCP Coordinate Readout */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1.5 text-slate-300">
          <Crosshair className="w-3.5 h-3.5 text-teal-400" />
          <span className="text-slate-500 font-bold">TCP:</span>
        </div>
        <div className="flex items-center space-x-3">
          <span>
            X: <strong className="text-sky-300">{tcpPose.x.toFixed(1)}</strong> mm
          </span>
          <span>
            Y: <strong className="text-sky-300">{tcpPose.y.toFixed(1)}</strong> mm
          </span>
          <span>
            Z: <strong className="text-sky-300">{tcpPose.z.toFixed(1)}</strong> mm
          </span>
          <span className="text-slate-600">|</span>
          <span>
            PITCH: <strong className="text-slate-200">{tcpPose.pitchDeg.toFixed(1)}°</strong>
          </span>
          <span>
            YAW: <strong className="text-slate-200">{tcpPose.yawDeg.toFixed(1)}°</strong>
          </span>
        </div>
      </div>

      {/* Center: Singularity & Kinematic Status */}
      <div className="flex items-center space-x-2">
        {isNearSingularity ? (
          <div
            className="flex items-center space-x-1 px-2 py-0.5 rounded bg-amber-950/80 border border-amber-800/80 text-amber-300 text-[10px]"
            title={singularityWarning || 'Kinematic singularity warning'}
          >
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            <span>SINGULARITY PROXIMITY</span>
          </div>
        ) : (
          <div className="flex items-center space-x-1 text-slate-500 text-[10px]">
            <CheckCircle2 className="w-3 h-3 text-teal-500" />
            <span>KINEMATICS NOMINAL</span>
          </div>
        )}
      </div>

      {/* Right: End-Effector & Robot Spec */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1.5">
          <span className="text-slate-500">GRIPPER:</span>
          <span
            className={`px-1.5 py-0.2 rounded font-bold uppercase ${
              gripperState === 'closed'
                ? 'bg-teal-950 text-teal-300 border border-teal-800'
                : 'bg-slate-800 text-slate-300'
            }`}
          >
            {gripperState}
          </span>
        </div>
        <div className="text-slate-500">
          MAX REACH: <span className="text-slate-300">{robot.reachMm}mm</span> | PAYLOAD:{' '}
          <span className="text-slate-300">{robot.payloadKg}kg</span>
        </div>
      </div>
    </div>
  );
};
