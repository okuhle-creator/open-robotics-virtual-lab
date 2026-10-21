import React, { useState, useRef } from 'react';
import { useSimulation } from '../../context/SimulationContext';
import { ProgramCommand } from '../../types/programming';
import { CartesianCoord } from '../../types/robot';
import { Play, Pause, Square, SkipForward, Code, Plus, Trash2, ArrowUp, ArrowDown, HelpCircle, Terminal } from 'lucide-react';

interface ProgrammingLabProps {}

const SAMPLE_PROGRAMS: Record<string, ProgramCommand[]> = {
  pick_and_place: [
    { id: 'c1', type: 'HOME', params: {}, rawText: 'robot.home()' },
    { id: 'c2', type: 'MOVE_TO', params: { x: 220, y: -160, z: 120 }, rawText: 'robot.move_to(220, -160, 120)' },
    { id: 'c3', type: 'MOVE_TO', params: { x: 220, y: -160, z: 25 }, rawText: 'robot.move_to(220, -160, 25)' },
    { id: 'c4', type: 'GRIPPER', params: { state: 'closed' }, rawText: 'robot.gripper("closed")' },
    { id: 'c5', type: 'WAIT', params: { durationMs: 400 }, rawText: 'robot.wait(400)' },
    { id: 'c6', type: 'MOVE_TO', params: { x: 220, y: -160, z: 120 }, rawText: 'robot.move_to(220, -160, 120)' },
    { id: 'c7', type: 'MOVE_TO', params: { x: -200, y: -160, z: 120 }, rawText: 'robot.move_to(-200, -160, 120)' },
    { id: 'c8', type: 'MOVE_TO', params: { x: -200, y: -160, z: 25 }, rawText: 'robot.move_to(-200, -160, 25)' },
    { id: 'c9', type: 'GRIPPER', params: { state: 'open' }, rawText: 'robot.gripper("open")' },
    { id: 'c10', type: 'WAIT', params: { durationMs: 400 }, rawText: 'robot.wait(400)' },
    { id: 'c11', type: 'MOVE_TO', params: { x: -200, y: -160, z: 120 }, rawText: 'robot.move_to(-200, -160, 120)' },
    { id: 'c12', type: 'HOME', params: {}, rawText: 'robot.home()' },
  ],
  toolpath_inspection: [
    { id: 't1', type: 'HOME', params: {}, rawText: 'robot.home()' },
    { id: 't2', type: 'MOVE_TO', params: { x: 150, y: 150, z: 100 }, rawText: 'robot.move_to(150, 150, 100)' },
    { id: 't3', type: 'MOVE_TO', params: { x: 250, y: 150, z: 100 }, rawText: 'robot.move_to(250, 150, 100)' },
    { id: 't4', type: 'MOVE_TO', params: { x: 200, y: 220, z: 120 }, rawText: 'robot.move_to(200, 220, 120)' },
    { id: 't5', type: 'MOVE_TO', params: { x: 150, y: 150, z: 100 }, rawText: 'robot.move_to(150, 150, 100)' },
    { id: 't6', type: 'HOME', params: {}, rawText: 'robot.home()' },
  ],
};

export const ProgrammingLab: React.FC<ProgrammingLabProps> = () => {
  const {
    moveToCartesianTarget,
    setAllJointAngles,
    setGripperState,
    resetToHome,
    addLog,
  } = useSimulation();

  const [activeTab, setActiveTab] = useState<'blocks' | 'code' | 'api'>('blocks');
  const [commands, setCommands] = useState<ProgramCommand[]>(SAMPLE_PROGRAMS.pick_and_place);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const [executionState, setExecutionState] = useState<'idle' | 'running' | 'paused' | 'error' | 'completed'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const execTimeoutRef = useRef<number | null>(null);

  // Stop running execution
  const stopProgram = () => {
    if (execTimeoutRef.current) {
      clearTimeout(execTimeoutRef.current);
    }
    setExecutionState('idle');
    setCurrentStepIndex(-1);
    setErrorMessage(null);
    addLog('task', 'Program execution halted by user.', 'info');
  };

  // Step Execution Core
  const executeStep = (stepIdx: number) => {
    if (stepIdx >= commands.length) {
      setExecutionState('completed');
      setCurrentStepIndex(-1);
      addLog('task', 'Robot sequence execution finished successfully.', 'success');
      return;
    }

    setCurrentStepIndex(stepIdx);
    const cmd = commands[stepIdx];
    let stepDuration = 800;

    try {
      if (cmd.type === 'HOME') {
        resetToHome();
        addLog('motion', `Step ${stepIdx + 1}: Executed robot.home()`, 'info');
      } else if (cmd.type === 'MOVE_TO') {
        const target: CartesianCoord = { x: cmd.params.x, y: cmd.params.y, z: cmd.params.z };
        const result = moveToCartesianTarget(target);
        if (!result.success) {
          setExecutionState('error');
          setErrorMessage(`Step ${stepIdx + 1} (${cmd.rawText}): ${result.message}`);
          addLog('task', `Execution error at step ${stepIdx + 1}: ${result.message}`, 'error');
          return;
        }
      } else if (cmd.type === 'GRIPPER') {
        setGripperState(cmd.params.state);
        stepDuration = 450;
      } else if (cmd.type === 'WAIT') {
        stepDuration = cmd.params.durationMs || 500;
        addLog('task', `Step ${stepIdx + 1}: Dwell wait for ${stepDuration}ms`, 'info');
      } else if (cmd.type === 'MOVE_JOINT') {
        setAllJointAngles([
          cmd.params.j1 || 0,
          cmd.params.j2 || 0,
          cmd.params.j3 || 0,
          cmd.params.j4 || 0,
          cmd.params.j5 || 0,
          cmd.params.j6 || 0,
        ]);
      }
    } catch (err: any) {
      setExecutionState('error');
      setErrorMessage(err.message || 'Unknown runtime error during command execution');
      return;
    }

    // Schedule next step
    execTimeoutRef.current = window.setTimeout(() => {
      executeStep(stepIdx + 1);
    }, stepDuration);
  };

  const startProgram = () => {
    if (commands.length === 0) return;
    setExecutionState('running');
    setErrorMessage(null);
    addLog('task', `Starting execution of ${commands.length} robot commands...`, 'info');
    executeStep(0);
  };

  // Add block to program
  const addCommand = (type: ProgramCommand['type']) => {
    const id = `cmd-${Date.now()}`;
    let newCmd: ProgramCommand;

    if (type === 'MOVE_TO') {
      newCmd = { id, type, params: { x: 200, y: 0, z: 100 }, rawText: 'robot.move_to(200, 0, 100)' };
    } else if (type === 'GRIPPER') {
      newCmd = { id, type, params: { state: 'open' }, rawText: 'robot.gripper("open")' };
    } else if (type === 'WAIT') {
      newCmd = { id, type, params: { durationMs: 500 }, rawText: 'robot.wait(500)' };
    } else {
      newCmd = { id, type: 'HOME', params: {}, rawText: 'robot.home()' };
    }

    setCommands((prev) => [...prev, newCmd]);
  };

  const deleteCommand = (index: number) => {
    setCommands((prev) => prev.filter((_, i) => i !== index));
  };

  const moveCommand = (index: number, direction: 'up' | 'down') => {
    setCommands((prev) => {
      const copy = [...prev];
      const targetIdx = direction === 'up' ? index - 1 : index + 1;
      if (targetIdx < 0 || targetIdx >= copy.length) return copy;
      const temp = copy[index];
      copy[index] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 border-l border-slate-800 text-slate-200 select-none overflow-y-auto p-4 space-y-4 scrollbar-thin">
      {/* Header */}
      <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
        <div>
          <h2 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center space-x-2">
            <Code className="w-4 h-4 text-teal-400" />
            <span>Robot Programming Studio</span>
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Sequential command execution, Python syntax interpreter & step tracer
          </p>
        </div>

        {/* Preset Selector */}
        <div className="flex items-center space-x-1.5 text-xs font-mono">
          <span className="text-[10px] text-slate-400">ROUTINE:</span>
          <select
            onChange={(e) => {
              if (SAMPLE_PROGRAMS[e.target.value]) {
                setCommands(SAMPLE_PROGRAMS[e.target.value]);
                stopProgram();
              }
            }}
            className="bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-slate-200 text-xs focus:outline-none"
          >
            <option value="pick_and_place">Palletizing Pick & Place</option>
            <option value="toolpath_inspection">Toolpath Surface Inspection</option>
          </select>
        </div>
      </div>

      {/* Editor Sub-Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-1 text-xs font-medium">
        <button
          onClick={() => setActiveTab('blocks')}
          className={`px-3 py-1.5 rounded transition ${
            activeTab === 'blocks'
              ? 'bg-teal-600/30 text-teal-300 border border-teal-500/50'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Visual Command Sequence
        </button>
        <button
          onClick={() => setActiveTab('code')}
          className={`px-3 py-1.5 rounded transition ${
            activeTab === 'code'
              ? 'bg-teal-600/30 text-teal-300 border border-teal-500/50'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Python Code Translation
        </button>
        <button
          onClick={() => setActiveTab('api')}
          className={`px-3 py-1.5 rounded transition ${
            activeTab === 'api'
              ? 'bg-teal-600/30 text-teal-300 border border-teal-500/50'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          API Reference
        </button>
      </div>

      {/* Execution Controls Toolbar */}
      <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {executionState !== 'running' ? (
            <button
              onClick={startProgram}
              disabled={commands.length === 0}
              className="px-3.5 py-1.5 rounded bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white font-bold text-xs uppercase flex items-center space-x-1.5 transition"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>RUN PROGRAM</span>
            </button>
          ) : (
            <button
              onClick={stopProgram}
              className="px-3.5 py-1.5 rounded bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase flex items-center space-x-1.5 transition"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>STOP</span>
            </button>
          )}

          <button
            onClick={() => {
              const next = currentStepIndex + 1 < commands.length ? currentStepIndex + 1 : 0;
              executeStep(next);
            }}
            disabled={executionState === 'running'}
            className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 border border-slate-700 text-xs font-mono flex items-center space-x-1"
          >
            <SkipForward className="w-3.5 h-3.5" />
            <span>STEP</span>
          </button>
        </div>

        {/* State Status Badge */}
        <div className="text-xs font-mono">
          <span className="text-slate-500 mr-2">STATUS:</span>
          <span
            className={`px-2 py-0.5 rounded font-bold uppercase ${
              executionState === 'running'
                ? 'bg-sky-950 text-sky-400 border border-sky-800 animate-pulse'
                : executionState === 'completed'
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                : executionState === 'error'
                ? 'bg-red-950 text-red-400 border border-red-800'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {executionState}
          </span>
        </div>
      </div>

      {/* Execution Error Banner (if error occurred during execution) */}
      {errorMessage && (
        <div className="p-3 rounded bg-red-950/80 border border-red-800 text-red-300 text-xs font-mono space-y-1">
          <div className="font-bold flex items-center space-x-1.5">
            <Square className="w-3.5 h-3.5 text-red-400" />
            <span>PROGRAM EXECUTION HALTED (KINEMATIC / COMMAND ERROR)</span>
          </div>
          <div>{errorMessage}</div>
        </div>
      )}

      {/* ================= TAB 1: VISUAL BLOCK SEQUENCE ================= */}
      {activeTab === 'blocks' && (
        <div className="space-y-3">
          {/* Add Block Toolbar */}
          <div className="flex items-center space-x-1.5 text-xs font-mono">
            <span className="text-slate-500 text-[10px]">ADD BLOCK:</span>
            <button
              onClick={() => addCommand('MOVE_TO')}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 text-[11px]"
            >
              + MOVE_TO
            </button>
            <button
              onClick={() => addCommand('GRIPPER')}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 text-[11px]"
            >
              + GRIPPER
            </button>
            <button
              onClick={() => addCommand('WAIT')}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-[11px]"
            >
              + WAIT
            </button>
            <button
              onClick={() => addCommand('HOME')}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px]"
            >
              + HOME
            </button>
          </div>

          {/* Block Items List */}
          <div className="space-y-1.5">
            {commands.map((cmd, idx) => {
              const isExecuting = currentStepIndex === idx;

              return (
                <div
                  key={cmd.id}
                  className={`p-2.5 rounded-lg border font-mono text-xs flex items-center justify-between transition ${
                    isExecuting
                      ? 'bg-sky-950/80 border-sky-400 shadow-md ring-1 ring-sky-400 text-white'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-[10px] text-slate-500 w-5">#{idx + 1}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        cmd.type === 'MOVE_TO'
                          ? 'bg-sky-950 text-sky-400 border border-sky-800'
                          : cmd.type === 'GRIPPER'
                          ? 'bg-teal-950 text-teal-400 border border-teal-800'
                          : cmd.type === 'WAIT'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {cmd.type}
                    </span>
                    <span className="text-slate-200">{cmd.rawText}</span>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => moveCommand(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1 text-slate-500 hover:text-slate-300 disabled:opacity-20"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => moveCommand(idx, 'down')}
                      disabled={idx === commands.length - 1}
                      className="p-1 text-slate-500 hover:text-slate-300 disabled:opacity-20"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteCommand(idx)}
                      className="p-1 text-red-500 hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= TAB 2: PYTHON CODE TRANSLATION ================= */}
      {activeTab === 'code' && (
        <div className="space-y-2">
          <div className="text-[11px] text-slate-400">
            Real-time Python code representation executed by the browser-side simulation interpreter:
          </div>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs text-sky-300 leading-relaxed overflow-x-auto">
            <pre>
{`# Open Robotics Virtual Lab - Automated Python Script
import open_robotics as robot

def run_workcell_routine():
` +
  commands
    .map(
      (cmd, idx) =>
        `    ${cmd.rawText}${
          currentStepIndex === idx ? '  # <--- [ACTIVE STEP]' : ''
        }`
    )
    .join('\n') +
  `\n\nif __name__ == "__main__":\n    run_workcell_routine()\n`}
            </pre>
          </div>
        </div>
      )}

      {/* ================= TAB 3: SUPPORTED API REFERENCE ================= */}
      {activeTab === 'api' && (
        <div className="space-y-3 text-xs bg-slate-950/60 p-3.5 rounded-lg border border-slate-800/80">
          <div className="font-bold text-slate-200">SUPPORTED ROBOTICS API INSTRUCTIONS</div>
          <p className="text-slate-400 text-[11px]">
            The browser interpreter safely executes the following deterministic commands against the kinematics engine:
          </p>

          <div className="space-y-2 font-mono text-[11px]">
            <div className="p-2 rounded bg-slate-900 border border-slate-800">
              <span className="text-teal-300 font-bold">robot.move_to(x, y, z)</span>
              <p className="text-slate-400 font-sans text-[11px] mt-0.5">
                Moves Tool Center Point to Cartesian target in millimeters using analytical Inverse Kinematics. Checks reachability boundaries.
              </p>
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800">
              <span className="text-teal-300 font-bold">robot.gripper("open" | "closed")</span>
              <p className="text-slate-400 font-sans text-[11px] mt-0.5">
                Commands pneumatic parallel jaws to open (48mm) or close (14mm) and updates object attachment.
              </p>
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800">
              <span className="text-teal-300 font-bold">robot.wait(milliseconds)</span>
              <p className="text-slate-400 font-sans text-[11px] mt-0.5">
                Pauses execution for specified dwell duration (useful for settling vibrations and grasp actuation).
              </p>
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800">
              <span className="text-teal-300 font-bold">robot.home()</span>
              <p className="text-slate-400 font-sans text-[11px] mt-0.5">
                Returns all axes to calibrated home joint angles [0, 25, -45, 0, 20, 0]°.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
