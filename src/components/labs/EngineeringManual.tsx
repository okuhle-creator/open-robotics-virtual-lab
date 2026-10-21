import React, { useState } from 'react';
import { useSimulation } from '../../context/SimulationContext';
import { BookOpen, Layers, Compass, ShieldAlert, Cpu } from 'lucide-react';

export const EngineeringManual: React.FC = () => {
  const { robot } = useSimulation();
  const [activeTopic, setActiveTopic] = useState<'dh_parameters' | 'kinematics_theory' | 'singularities' | 'workcell_safety'>('dh_parameters');

  return (
    <div className="h-full flex flex-col bg-slate-900 border-l border-slate-800 text-slate-200 select-none overflow-y-auto p-4 space-y-4 scrollbar-thin">
      {/* Header */}
      <div className="border-b border-slate-800 pb-3">
        <h2 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center space-x-2">
          <BookOpen className="w-4 h-4 text-teal-400" />
          <span>Robotics Engineering Manual & Curriculum</span>
        </h2>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Mathematical foundations, kinematic derivations, DH parameters & industrial safety standards
        </p>
      </div>

      {/* Topic Tabs */}
      <div className="grid grid-cols-2 gap-1.5 text-xs font-medium">
        <button
          onClick={() => setActiveTopic('dh_parameters')}
          className={`p-2 rounded text-left transition border ${
            activeTopic === 'dh_parameters'
              ? 'bg-teal-950/70 border-teal-600 text-teal-300 font-bold'
              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/40'
          }`}
        >
          1. DH Parameters Table
        </button>
        <button
          onClick={() => setActiveTopic('kinematics_theory')}
          className={`p-2 rounded text-left transition border ${
            activeTopic === 'kinematics_theory'
              ? 'bg-teal-950/70 border-teal-600 text-teal-300 font-bold'
              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/40'
          }`}
        >
          2. Forward & Inverse Kinematics
        </button>
        <button
          onClick={() => setActiveTopic('singularities')}
          className={`p-2 rounded text-left transition border ${
            activeTopic === 'singularities'
              ? 'bg-teal-950/70 border-teal-600 text-teal-300 font-bold'
              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/40'
          }`}
        >
          3. Singularities & Dead-Zones
        </button>
        <button
          onClick={() => setActiveTopic('workcell_safety')}
          className={`p-2 rounded text-left transition border ${
            activeTopic === 'workcell_safety'
              ? 'bg-teal-950/70 border-teal-600 text-teal-300 font-bold'
              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/40'
          }`}
        >
          4. Safety Standards & E-Stop
        </button>
      </div>

      {/* ================= TOPIC 1: DH PARAMETERS ================= */}
      {activeTopic === 'dh_parameters' && (
        <div className="space-y-3 bg-slate-950/60 p-3.5 rounded-lg border border-slate-800/80 text-xs font-mono">
          <div className="font-bold text-slate-200 flex items-center space-x-1.5 font-sans">
            <Layers className="w-4 h-4 text-teal-400" />
            <span>DENAVIT-HARTENBERG (DH) PARAMETERS: {robot.name}</span>
          </div>
          <p className="font-sans text-[11px] text-slate-400 leading-relaxed">
            Standard 4-parameter representation describing link lengths, link twists, link offsets, and joint variable rotation angles according to classical robotics kinematics conventions:
          </p>

          <div className="overflow-x-auto border border-slate-800 rounded">
            <table className="w-full text-[11px] text-left">
              <thead className="bg-slate-850 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
                <tr>
                  <th className="p-2">Joint i</th>
                  <th className="p-2">a_i (mm)</th>
                  <th className="p-2">alpha_i (deg)</th>
                  <th className="p-2">d_i (mm)</th>
                  <th className="p-2">theta_i</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {robot.dhParameters.map((dh) => (
                  <tr key={dh.joint}>
                    <td className="p-2 font-bold text-teal-300">Joint {dh.joint}</td>
                    <td className="p-2">{dh.aMm}</td>
                    <td className="p-2">{dh.alphaDeg}°</td>
                    <td className="p-2">{dh.dMm}</td>
                    <td className="p-2">θ_{dh.joint}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-400 font-sans space-y-1">
            <strong>Link Dimensions:</strong> Base Height = {robot.linkDimensions.baseHeightMm}mm, Upper Arm = {robot.linkDimensions.upperArmMm}mm, Forearm = {robot.linkDimensions.forearmMm}mm, Wrist Assembly = {robot.linkDimensions.wristMm + robot.linkDimensions.toolMm}mm.
          </div>
        </div>
      )}

      {/* ================= TOPIC 2: KINEMATICS THEORY ================= */}
      {activeTopic === 'kinematics_theory' && (
        <div className="space-y-3 bg-slate-950/60 p-3.5 rounded-lg border border-slate-800/80 text-xs">
          <div className="font-bold text-slate-200 flex items-center space-x-1.5">
            <Compass className="w-4 h-4 text-sky-400" />
            <span>FORWARD & INVERSE KINEMATICS FORMULATION</span>
          </div>

          <div className="space-y-2 text-[11px] text-slate-300 leading-relaxed font-sans">
            <h4 className="font-bold text-teal-300">1. Forward Kinematics (FK)</h4>
            <p className="text-slate-400">
              Computes the spatial position and orientation matrix of the Tool Center Point (TCP) in the base reference frame from given joint values [J1..J6]:
            </p>
            <div className="p-2.5 bg-slate-900 rounded font-mono text-[10px] text-slate-300 border border-slate-800">
              T_0^6 = A_1(θ_1) · A_2(θ_2) · A_3(θ_3) · A_4(θ_4) · A_5(θ_5) · A_6(θ_6)
            </div>

            <h4 className="font-bold text-teal-300 pt-2">2. Analytical Inverse Kinematics (IK)</h4>
            <p className="text-slate-400">
              Solves the non-linear algebraic equations for target coordinate (X, Y, Z) using <strong>Spherical Wrist Decoupling</strong>:
            </p>
            <ol className="list-decimal list-inside text-slate-400 space-y-1 text-[11px]">
              <li>Calculate waist angle: θ_1 = atan2(Y, X)</li>
              <li>Decouple wrist center: P_wrist = P_target - d_tool · z_tool</li>
              <li>Apply Law of Cosines to solve shoulder θ_2 and elbow θ_3 angles</li>
              <li>Calculate wrist orientation pitch θ_5 = α - (θ_2 + θ_3)</li>
            </ol>
          </div>
        </div>
      )}

      {/* ================= TOPIC 3: SINGULARITIES ================= */}
      {activeTopic === 'singularities' && (
        <div className="space-y-3 bg-slate-950/60 p-3.5 rounded-lg border border-slate-800/80 text-xs">
          <div className="font-bold text-slate-200 flex items-center space-x-1.5">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>KINEMATIC SINGULARITIES & REACH BOUNDARIES</span>
          </div>

          <div className="space-y-2 text-[11px] text-slate-300 leading-relaxed font-sans">
            <p className="text-slate-400">
              A kinematic singularity occurs when the manipulator Jacobian matrix loses full rank (det(J) = 0), causing the robot to lose instantaneous degrees of freedom.
            </p>

            <div className="p-2.5 rounded bg-slate-900 border border-slate-800 space-y-1">
              <span className="font-bold text-amber-400 font-mono">1. Wrist Singularity (J5 ≈ 0°)</span>
              <p className="text-slate-400 text-[11px]">
                When joint 5 aligns the forearm roll (J4) and tool flange roll (J6) axes collinearly. The simulator detects this and surfaces a proximity alert in the status bar.
              </p>
            </div>

            <div className="p-2.5 rounded bg-slate-900 border border-slate-800 space-y-1">
              <span className="font-bold text-amber-400 font-mono">2. Boundary / Extension Singularity</span>
              <p className="text-slate-400 text-[11px]">
                When the arm is fully extended to reach limit (reach = {robot.reachMm}mm) and elbow angle J3 is near 0°. Motion in the radial direction becomes physically impossible.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ================= TOPIC 4: SAFETY STANDARDS ================= */}
      {activeTopic === 'workcell_safety' && (
        <div className="space-y-3 bg-slate-950/60 p-3.5 rounded-lg border border-slate-800/80 text-xs">
          <div className="font-bold text-slate-200 flex items-center space-x-1.5">
            <Cpu className="w-4 h-4 text-red-400" />
            <span>INDUSTRIAL ROBOTICS SAFETY (ISO 10218 / RIA R15.06)</span>
          </div>

          <div className="space-y-2 text-[11px] text-slate-400 leading-relaxed font-sans">
            <p>
              In industrial automation workcells, robotic manipulators operate behind interlocked safety fences with monitored light curtains and emergency stop pushbuttons.
            </p>
            <div className="p-2.5 rounded bg-slate-900 border border-slate-800 space-y-1">
              <span className="font-bold text-red-300">Hardwired Emergency Stop (Category 0 / 1 Stop)</span>
              <p className="text-[11px]">
                The red E-STOP button in the top navigation bar immediately interrupts the simulation cycle, freezes actuators in place, and logs an alert.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
