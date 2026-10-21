import React from 'react';
import { useSimulation } from '../../context/SimulationContext';
import { ROBOT_MODELS } from '../../robotics/robotModels';
import { Volume2, VolumeX, AlertOctagon, RotateCcw, Cpu } from 'lucide-react';

export const Header: React.FC = () => {
  const {
    robot,
    selectRobot,
    resetToHome,
    isEStopped,
    toggleEStop,
    settings,
    updateSettings,
  } = useSimulation();

  return (
    <header className="h-14 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between select-none">
      {/* Brand & Project Identity */}
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg bg-teal-600/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
          <Cpu className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-sm font-bold tracking-wider text-slate-100 uppercase">
              OPEN ROBOTICS LAB
            </h1>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800">
              v1.0 INDUSTRIAL
            </span>
          </div>
          <p className="text-[11px] text-slate-400">Industrial Robotics & Automation Workbench</p>
        </div>
      </div>

      {/* Center Controls: Model Selector & Quick Presets */}
      <div className="flex items-center space-x-3">
        {/* Robot Model Selector */}
        <div className="flex items-center space-x-2 bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700">
          <label htmlFor="robot-select" className="text-xs text-slate-400 font-mono">
            MODEL:
          </label>
          <select
            id="robot-select"
            value={robot.id}
            onChange={(e) => selectRobot(e.target.value)}
            className="bg-transparent text-xs text-slate-200 font-medium focus:outline-none cursor-pointer"
          >
            {Object.values(ROBOT_MODELS).map((m) => (
              <option key={m.id} value={m.id} className="bg-slate-900 text-slate-200">
                {m.name} ({m.dof} DOF)
              </option>
            ))}
          </select>
        </div>

        {/* Speed Multiplier */}
        <div className="flex items-center space-x-1 bg-slate-800/80 px-2 py-1 rounded-md border border-slate-700 text-xs text-slate-300">
          <span className="text-[11px] text-slate-400 font-mono mr-1">SPEED:</span>
          {[0.5, 1.0, 2.0].map((spd) => (
            <button
              key={spd}
              onClick={() => updateSettings({ speedMultiplier: spd })}
              className={`px-1.5 py-0.5 rounded text-[11px] font-mono transition ${
                settings.speedMultiplier === spd
                  ? 'bg-teal-600 text-white font-bold'
                  : 'hover:bg-slate-700 text-slate-400'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>

        {/* Audio Toggle */}
        <button
          onClick={() => updateSettings({ audioFeedback: !settings.audioFeedback })}
          className={`p-1.5 rounded-md border text-xs transition ${
            settings.audioFeedback
              ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
              : 'bg-slate-850 border-slate-800 text-slate-500'
          }`}
          title={settings.audioFeedback ? 'Disable Audio Feedback' : 'Enable Audio Feedback'}
        >
          {settings.audioFeedback ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Calibrate / Home Button */}
        <button
          onClick={resetToHome}
          className="flex items-center space-x-1.5 px-3 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition"
          title="Return all joints to calibrated zero/home angles"
        >
          <RotateCcw className="w-3.5 h-3.5 text-teal-400" />
          <span>HOME</span>
        </button>
      </div>

      {/* Right Controls: Emergency Stop Button */}
      <div className="flex items-center space-x-3">
        <button
          onClick={toggleEStop}
          className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-md font-bold text-xs uppercase tracking-wider transition shadow-sm ${
            isEStopped
              ? 'bg-red-600 text-white animate-pulse ring-2 ring-red-400'
              : 'bg-red-700/80 hover:bg-red-600 text-white border border-red-500'
          }`}
          title={isEStopped ? 'Clear Emergency Stop' : 'Trip Emergency Stop'}
        >
          <AlertOctagon className="w-4 h-4" />
          <span>{isEStopped ? 'E-STOPPED (CLICK TO RESET)' : 'E-STOP'}</span>
        </button>
      </div>
    </header>
  );
};
