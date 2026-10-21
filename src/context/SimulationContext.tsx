import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { RobotSpecification, GripperState, CartesianPose, CartesianCoord } from '../types/robot';
import { ROBOT_MODELS, DEFAULT_ROBOT_ID } from '../robotics/robotModels';
import { computeForwardKinematics, computeInverseKinematics, checkSingularities } from '../robotics/kinematics';
import { soundFx } from '../robotics/soundFx';
import { Workpiece, TargetTraySlot, PickPlaceState } from '../types/pickAndPlace';
import { ConveyorItem, ConveyorState, ConveyorMetrics, SortRule } from '../types/conveyor';
import { LabMode, EventLogItem, SimulationSettings } from '../types/simulation';

interface SimulationContextType {
  // Robot & Kinematics
  robot: RobotSpecification;
  selectRobot: (id: string) => void;
  jointAngles: number[];
  setJointAngle: (index: number, deg: number) => void;
  setAllJointAngles: (angles: number[]) => void;
  gripperState: GripperState;
  setGripperState: (state: GripperState) => void;
  tcpPose: CartesianPose;
  ikTarget: CartesianCoord;
  setIkTarget: (target: CartesianCoord) => void;
  moveToCartesianTarget: (target: CartesianCoord, pitchDeg?: number) => { success: boolean; message: string };
  resetToHome: () => void;
  isNearSingularity: boolean;
  singularityWarning: string | null;

  // Active Lab Mode
  activeLab: LabMode;
  setActiveLab: (mode: LabMode) => void;

  // Pick and Place
  workpieces: Workpiece[];
  targetSlots: TargetTraySlot[];
  pickPlaceState: PickPlaceState;
  selectWorkpieceForTask: (id: string) => void;
  runPickPlaceCycle: () => void;
  pausePickPlace: () => void;
  resumePickPlace: () => void;
  resetPickPlace: () => void;
  manualPickObject: (id: string) => boolean;
  manualPlaceObject: (slotId: string) => boolean;

  // Conveyor Sorting
  conveyorItems: ConveyorItem[];
  conveyorState: ConveyorState;
  conveyorMetrics: ConveyorMetrics;
  sortRules: SortRule[];
  setSortRules: React.Dispatch<React.SetStateAction<SortRule[]>>;
  toggleConveyor: () => void;
  setConveyorSpeed: (speedMmPerSec: number) => void;
  spawnConveyorItem: (color?: 'red' | 'green' | 'blue' | 'yellow', shape?: 'box' | 'cylinder') => void;
  resetConveyor: () => void;

  // Global Settings & E-Stop
  settings: SimulationSettings;
  updateSettings: (partial: Partial<SimulationSettings>) => void;
  isEStopped: boolean;
  toggleEStop: () => void;

  // Event Log
  eventLogs: EventLogItem[];
  addLog: (category: EventLogItem['category'], message: string, level?: EventLogItem['level']) => void;
  clearLogs: () => void;
}

const SimulationContext = createContext<SimulationContextType | null>(null);

const INITIAL_WORKPIECES: Workpiece[] = [
  {
    id: 'wp-cube-red',
    name: 'Red Staging Cube',
    type: 'cube',
    color: '#ef4444',
    position: { x: 220, y: -160, z: 12 },
    initialPosition: { x: 220, y: -160, z: 12 },
    dimensions: { width: 24, height: 24, depth: 24 },
    grasped: false,
    delivered: false,
    targetSlotId: 'slot-1',
  },
  {
    id: 'wp-cyl-green',
    name: 'Green Billet',
    type: 'cylinder',
    color: '#10b981',
    position: { x: 240, y: -210, z: 14 },
    initialPosition: { x: 240, y: -210, z: 14 },
    dimensions: { width: 28, height: 28, depth: 28 },
    grasped: false,
    delivered: false,
    targetSlotId: 'slot-2',
  },
  {
    id: 'wp-chip-black',
    name: 'IC Controller Package',
    type: 'ic_chip',
    color: '#1e293b',
    position: { x: 190, y: -210, z: 4 },
    initialPosition: { x: 190, y: -210, z: 4 },
    dimensions: { width: 26, height: 8, depth: 26 },
    grasped: false,
    delivered: false,
    targetSlotId: 'slot-3',
  },
];

const INITIAL_TARGET_SLOTS: TargetTraySlot[] = [
  { id: 'slot-1', name: 'Pallet Position A1', position: { x: -200, y: -160, z: 12 }, colorHint: '#ef4444' },
  { id: 'slot-2', name: 'Pallet Position A2', position: { x: -240, y: -200, z: 14 }, colorHint: '#10b981' },
  { id: 'slot-3', name: 'Pallet Position A3', position: { x: -180, y: -210, z: 4 }, colorHint: '#38bdf8' },
];

const INITIAL_SORT_RULES: SortRule[] = [
  { id: 'rule-red', color: 'red', shape: 'all', targetBin: 'Bin A', active: true },
  { id: 'rule-green', color: 'green', shape: 'all', targetBin: 'Bin B', active: true },
  { id: 'rule-blue', color: 'blue', shape: 'all', targetBin: 'Bin C', active: true },
];

export const SimulationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Robot & Joint Configuration
  const [robotId, setRobotId] = useState<string>(DEFAULT_ROBOT_ID);
  const robot = ROBOT_MODELS[robotId] || ROBOT_MODELS[DEFAULT_ROBOT_ID];
  const [jointAngles, setJointAngles] = useState<number[]>([...robot.homeJointsDeg]);
  const [gripperState, setGripperStateInternal] = useState<GripperState>('open');

  // 2. Navigation
  const [activeLab, setActiveLab] = useState<LabMode>('jogging');

  // 3. Settings & Safety
  const [isEStopped, setIsEStopped] = useState<boolean>(false);
  const [settings, setSettings] = useState<SimulationSettings>({
    speedMultiplier: 1.0,
    showFloorGrid: true,
    showCoordinateAxes: true,
    showWorkspaceEnvelope: false,
    audioFeedback: true,
    autoLoopTasks: false,
  });

  // 4. Logs
  const [eventLogs, setEventLogs] = useState<EventLogItem[]>([
    {
      id: 'init-1',
      timestamp: new Date().toLocaleTimeString(),
      category: 'system',
      message: 'Open Robotics Lab kernel initialized. Model ORV-600 Articulated active.',
      level: 'info',
    },
  ]);

  const addLog = useCallback(
    (category: EventLogItem['category'], message: string, level: EventLogItem['level'] = 'info') => {
      setEventLogs((prev) => [
        {
          id: Math.random().toString(36).substring(2, 9),
          timestamp: new Date().toLocaleTimeString(),
          category,
          message,
          level,
        },
        ...prev.slice(0, 75), // retain last 75 events
      ]);
    },
    []
  );

  const clearLogs = useCallback(() => {
    setEventLogs([]);
  }, []);

  // Update audio feedback setting
  useEffect(() => {
    soundFx.setEnabled(settings.audioFeedback);
  }, [settings.audioFeedback]);

  // Compute live forward kinematics
  const fkResult = computeForwardKinematics(robot, jointAngles);
  const tcpPose = fkResult.tcp;

  // Singularity detection
  const singularityCheck = checkSingularities(robot, jointAngles);

  // Cartesian IK target state
  const [ikTarget, setIkTarget] = useState<CartesianCoord>({
    x: tcpPose.x,
    y: tcpPose.y,
    z: tcpPose.z,
  });

  // Keep ikTarget synchronized when robot changes or resets
  useEffect(() => {
    setIkTarget({ x: tcpPose.x, y: tcpPose.y, z: tcpPose.z });
  }, [robotId]);

  const selectRobot = (id: string) => {
    if (ROBOT_MODELS[id]) {
      setRobotId(id);
      const newRobot = ROBOT_MODELS[id];
      setJointAngles([...newRobot.homeJointsDeg]);
      setGripperStateInternal('open');
      addLog('system', `Switched robot model to ${newRobot.name}. Home pose loaded.`, 'info');
    }
  };

  const setJointAngle = (index: number, deg: number) => {
    if (isEStopped) {
      addLog('system', 'Motion rejected: Emergency Stop is active.', 'error');
      return;
    }
    const limit = robot.jointLimits[index];
    const clamped = Math.max(limit.minDeg, Math.min(limit.maxDeg, deg));

    setJointAngles((prev) => {
      const next = [...prev];
      next[index] = Number(clamped.toFixed(1));
      return next;
    });

    soundFx.playServoWhine(0.12, 220 + index * 40);
  };

  const setAllJointAngles = (angles: number[]) => {
    if (isEStopped) return;
    setJointAngles(angles.map((a) => Number(a.toFixed(1))));
    soundFx.playServoWhine(0.2, 300);
  };

  const setGripperState = (state: GripperState) => {
    if (isEStopped) return;
    setGripperStateInternal(state);
    soundFx.playPneumaticClick(state === 'open');
    addLog('motion', `End effector gripper commanded: ${state.toUpperCase()}`, 'info');
  };

  const resetToHome = () => {
    setJointAngles([...robot.homeJointsDeg]);
    setGripperStateInternal('open');
    addLog('motion', `Robot returned to calibrated home position.`, 'info');
    soundFx.playServoWhine(0.25, 260);
  };

  const moveToCartesianTarget = (target: CartesianCoord, pitchDeg: number = 90) => {
    if (isEStopped) {
      return { success: false, message: 'Motion aborted: Emergency Stop active.' };
    }
    const ik = computeInverseKinematics(robot, target, pitchDeg);
    if (!ik.reachable || !ik.jointAnglesDeg) {
      const err = ik.reason || 'Requested coordinate is beyond kinematic reach envelope.';
      addLog('motion', `Cartesian move failed: ${err}`, 'warn');
      return { success: false, message: err };
    }

    setJointAngles(ik.jointAnglesDeg);
    setIkTarget(target);
    soundFx.playServoWhine(0.3, 350);
    addLog(
      'motion',
      `Moved to TCP [X:${target.x.toFixed(0)}, Y:${target.y.toFixed(0)}, Z:${target.z.toFixed(0)}]`,
      'success'
    );
    return { success: true, message: 'Target reached successfully.' };
  };

  const toggleEStop = () => {
    setIsEStopped((prev) => {
      const next = !prev;
      if (next) {
        addLog('system', 'EMERGENCY STOP (E-STOP) ACTIVATED! All actuators frozen.', 'error');
        setPickPlaceState((s) => ({ ...s, isRunning: false, isPaused: true, lastError: 'E-STOP Tripped' }));
      } else {
        addLog('system', 'Emergency Stop cleared. System operational.', 'info');
      }
      return next;
    });
  };

  const updateSettings = (partial: Partial<SimulationSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  };

  // =========================================================================
  // 5. PICK AND PLACE LOGIC
  // =========================================================================
  const [workpieces, setWorkpieces] = useState<Workpiece[]>(INITIAL_WORKPIECES);
  const [targetSlots, setTargetSlots] = useState<TargetTraySlot[]>(INITIAL_TARGET_SLOTS);
  const [pickPlaceState, setPickPlaceState] = useState<PickPlaceState>({
    stage: 'IDLE',
    activeWorkpieceId: 'wp-cube-red',
    targetSlotId: 'slot-1',
    progressPercent: 0,
    isRunning: false,
    isPaused: false,
    cycleCount: 0,
    lastError: null,
  });

  const pickPlaceTimerRef = useRef<number | null>(null);

  const selectWorkpieceForTask = (id: string) => {
    const wp = workpieces.find((w) => w.id === id);
    if (wp) {
      setPickPlaceState((prev) => ({
        ...prev,
        activeWorkpieceId: id,
        targetSlotId: wp.targetSlotId || 'slot-1',
      }));
      addLog('task', `Selected workpiece: ${wp.name} for manipulation.`, 'info');
    }
  };

  const manualPickObject = (id: string): boolean => {
    const wp = workpieces.find((w) => w.id === id);
    if (!wp) return false;

    // Contact verification: TCP must be within 45mm of object position
    const dx = tcpPose.x - wp.position.x;
    const dy = tcpPose.y - wp.position.y;
    const dz = tcpPose.z - (wp.position.z + 20);
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (dist > 45) {
      addLog(
        'task',
        `Grip failed: TCP distance (${dist.toFixed(1)}mm) exceeds grasp tolerance (45mm). Move gripper closer first.`,
        'warn'
      );
      return false;
    }

    setGripperStateInternal('closed');
    soundFx.playPneumaticClick(false);
    setWorkpieces((prev) =>
      prev.map((item) => (item.id === id ? { ...item, grasped: true } : item))
    );
    addLog('task', `Workpiece ${wp.name} grasped securely.`, 'success');
    return true;
  };

  const manualPlaceObject = (slotId: string): boolean => {
    const slot = targetSlots.find((s) => s.id === slotId);
    if (!slot) return false;

    const heldItem = workpieces.find((w) => w.grasped);
    if (!heldItem) {
      addLog('task', 'Place failed: Gripper is not holding any workpiece.', 'warn');
      return false;
    }

    // Contact verification for placement: must be above slot within 50mm
    const dx = tcpPose.x - slot.position.x;
    const dy = tcpPose.y - slot.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 50) {
      addLog(
        'task',
        `Release failed: TCP is not positioned over target ${slot.name} (distance ${dist.toFixed(1)}mm > 50mm).`,
        'warn'
      );
      return false;
    }

    setGripperStateInternal('open');
    soundFx.playPneumaticClick(true);
    setWorkpieces((prev) =>
      prev.map((item) =>
        item.id === heldItem.id
          ? {
              ...item,
              grasped: false,
              delivered: true,
              position: { x: slot.position.x, y: slot.position.y, z: slot.position.z },
            }
          : item
      )
    );
    setTargetSlots((prev) =>
      prev.map((s) => (s.id === slotId ? { ...s, occupiedBy: heldItem.id } : s))
    );
    addLog('task', `Workpiece ${heldItem.name} successfully transferred to ${slot.name}.`, 'success');
    return true;
  };

  // Autonomous Pick and Place Execution Cycle
  const runPickPlaceCycle = () => {
    if (isEStopped) {
      addLog('task', 'Cannot run task: Emergency Stop active.', 'error');
      return;
    }
    const activeId = pickPlaceState.activeWorkpieceId || 'wp-cube-red';
    const activeWp = workpieces.find((w) => w.id === activeId);
    if (!activeWp) {
      addLog('task', 'Task aborted: No workpiece selected.', 'warn');
      return;
    }

    const slot = targetSlots.find((s) => s.id === (activeWp.targetSlotId || 'slot-1')) || targetSlots[0];

    setPickPlaceState((prev) => ({
      ...prev,
      isRunning: true,
      isPaused: false,
      stage: 'APPROACH_HOVER',
      progressPercent: 5,
      lastError: null,
    }));
    addLog('task', `Initiating autonomous pick-and-place sequence for ${activeWp.name}...`, 'info');

    // Sequential state machine steps
    const stepDuration = 900 / settings.speedMultiplier;

    // Step 1: Approach Hover over workpiece
    const hoverSource: CartesianCoord = {
      x: activeWp.position.x,
      y: activeWp.position.y,
      z: 130, // 130mm clearance
    };
    moveToCartesianTarget(hoverSource, 90);

    // Step 2: Descend to grasp height
    pickPlaceTimerRef.current = window.setTimeout(() => {
      setPickPlaceState((s) => ({ ...s, stage: 'DESCEND_GRASP', progressPercent: 25 }));
      const graspPos: CartesianCoord = {
        x: activeWp.position.x,
        y: activeWp.position.y,
        z: 25, // Contact height
      };
      moveToCartesianTarget(graspPos, 90);

      // Step 3: Close Gripper
      pickPlaceTimerRef.current = window.setTimeout(() => {
        setPickPlaceState((s) => ({ ...s, stage: 'CLOSING_GRIPPER', progressPercent: 40 }));
        setGripperStateInternal('closed');
        soundFx.playPneumaticClick(false);
        setWorkpieces((prev) =>
          prev.map((w) => (w.id === activeId ? { ...w, grasped: true } : w))
        );

        // Step 4: Lift Payload
        pickPlaceTimerRef.current = window.setTimeout(() => {
          setPickPlaceState((s) => ({ ...s, stage: 'LIFT_PAYLOAD', progressPercent: 55 }));
          moveToCartesianTarget(hoverSource, 90);

          // Step 5: Transit Target Hover
          pickPlaceTimerRef.current = window.setTimeout(() => {
            setPickPlaceState((s) => ({ ...s, stage: 'TRANSIT_TARGET', progressPercent: 70 }));
            const hoverTarget: CartesianCoord = {
              x: slot.position.x,
              y: slot.position.y,
              z: 130,
            };
            moveToCartesianTarget(hoverTarget, 90);

            // Step 6: Descend Place
            pickPlaceTimerRef.current = window.setTimeout(() => {
              setPickPlaceState((s) => ({ ...s, stage: 'DESCEND_PLACE', progressPercent: 85 }));
              const placePos: CartesianCoord = {
                x: slot.position.x,
                y: slot.position.y,
                z: 25,
              };
              moveToCartesianTarget(placePos, 90);

              // Step 7: Open Gripper & Release
              pickPlaceTimerRef.current = window.setTimeout(() => {
                setPickPlaceState((s) => ({ ...s, stage: 'OPENING_GRIPPER', progressPercent: 95 }));
                setGripperStateInternal('open');
                soundFx.playPneumaticClick(true);
                setWorkpieces((prev) =>
                  prev.map((w) =>
                    w.id === activeId
                      ? {
                          ...w,
                          grasped: false,
                          delivered: true,
                          position: { x: slot.position.x, y: slot.position.y, z: slot.position.z },
                        }
                      : w
                  )
                );

                // Step 8: Return Home & Complete
                pickPlaceTimerRef.current = window.setTimeout(() => {
                  resetToHome();
                  setPickPlaceState((s) => ({
                    ...s,
                    stage: 'COMPLETED',
                    progressPercent: 100,
                    isRunning: false,
                    cycleCount: s.cycleCount + 1,
                  }));
                  addLog('task', `Pick-and-place cycle successfully completed! Workpiece delivered to ${slot.name}.`, 'success');
                }, stepDuration);
              }, stepDuration);
            }, stepDuration);
          }, stepDuration);
        }, stepDuration);
      }, stepDuration);
    }, stepDuration);
  };

  const pausePickPlace = () => {
    if (pickPlaceTimerRef.current) {
      clearTimeout(pickPlaceTimerRef.current);
    }
    setPickPlaceState((prev) => ({ ...prev, isRunning: false, isPaused: true }));
    addLog('task', 'Pick-and-place cycle paused.', 'info');
  };

  const resumePickPlace = () => {
    runPickPlaceCycle();
  };

  const resetPickPlace = () => {
    if (pickPlaceTimerRef.current) {
      clearTimeout(pickPlaceTimerRef.current);
    }
    setWorkpieces(INITIAL_WORKPIECES);
    setTargetSlots(INITIAL_TARGET_SLOTS);
    setPickPlaceState({
      stage: 'IDLE',
      activeWorkpieceId: 'wp-cube-red',
      targetSlotId: 'slot-1',
      progressPercent: 0,
      isRunning: false,
      isPaused: false,
      cycleCount: 0,
      lastError: null,
    });
    resetToHome();
    addLog('task', 'Pick and place workcell reset to initial state.', 'info');
  };

  // =========================================================================
  // 6. CONVEYOR AND SORTING SIMULATION
  // =========================================================================
  const [conveyorItems, setConveyorItems] = useState<ConveyorItem[]>([
    { id: 'item-1', name: 'Pack A', color: 'red', shape: 'box', positionMm: 80, lateralOffsetMm: 0, status: 'on_belt' },
    { id: 'item-2', name: 'Pack B', color: 'green', shape: 'cylinder', positionMm: 280, lateralOffsetMm: 0, status: 'on_belt' },
  ]);

  const [sortRules, setSortRules] = useState<SortRule[]>(INITIAL_SORT_RULES);

  const [conveyorState, setConveyorState] = useState<ConveyorState>({
    isRunning: true,
    speedMmPerSec: 120, // 120 mm/s
    opticalSensorTriggered: false,
    sensorDetectedItem: null,
    pusherState: 'retracted',
    pusherExtensionPercent: 0,
  });

  const [conveyorMetrics, setConveyorMetrics] = useState<ConveyorMetrics>({
    totalSpawned: 2,
    totalProcessed: 0,
    correctlySorted: 0,
    incorrectlySorted: 0,
    remainingOnBelt: 2,
  });

  const toggleConveyor = () => {
    if (isEStopped) return;
    setConveyorState((prev) => {
      const next = !prev.isRunning;
      addLog('task', next ? 'Conveyor drive motor started.' : 'Conveyor belt stopped.', 'info');
      return { ...prev, isRunning: next };
    });
  };

  const setConveyorSpeed = (speedMmPerSec: number) => {
    setConveyorState((prev) => ({ ...prev, speedMmPerSec }));
  };

  const spawnConveyorItem = (
    color?: 'red' | 'green' | 'blue' | 'yellow',
    shape?: 'box' | 'cylinder'
  ) => {
    const colors: Array<'red' | 'green' | 'blue' | 'yellow'> = ['red', 'green', 'blue', 'yellow'];
    const shapes: Array<'box' | 'cylinder'> = ['box', 'cylinder'];

    const chosenColor = color || colors[Math.floor(Math.random() * colors.length)];
    const chosenShape = shape || shapes[Math.floor(Math.random() * shapes.length)];

    const newItem: ConveyorItem = {
      id: `item-${Date.now().toString().slice(-4)}`,
      name: `Item ${chosenColor.toUpperCase()}`,
      color: chosenColor,
      shape: chosenShape,
      positionMm: 0, // entrance
      lateralOffsetMm: (Math.random() - 0.5) * 20, // slight random deviation within guide rails
      status: 'on_belt',
    };

    setConveyorItems((prev) => [...prev, newItem]);
    setConveyorMetrics((m) => ({
      ...m,
      totalSpawned: m.totalSpawned + 1,
      remainingOnBelt: m.remainingOnBelt + 1,
    }));
    addLog('task', `New ${chosenColor} ${chosenShape} introduced at conveyor infeed.`, 'info');
  };

  const resetConveyor = () => {
    setConveyorItems([]);
    setConveyorMetrics({
      totalSpawned: 0,
      totalProcessed: 0,
      correctlySorted: 0,
      incorrectlySorted: 0,
      remainingOnBelt: 0,
    });
    setConveyorState((s) => ({
      ...s,
      opticalSensorTriggered: false,
      sensorDetectedItem: null,
      pusherState: 'retracted',
      pusherExtensionPercent: 0,
    }));
    addLog('task', 'Conveyor sorting cell counters and belt cleared.', 'info');
  };

  // Conveyor Physical Simulation Loop
  useEffect(() => {
    if (!conveyorState.isRunning || isEStopped) return;

    const interval = 50; // 20 updates per second
    const deltaSec = (interval / 1000) * settings.speedMultiplier;

    const timer = setInterval(() => {
      setConveyorItems((prevItems) => {
        let sensorTriggered = false;
        let detectedItemRef: ConveyorItem | null = null;
        let pusherShouldExtend = false;

        const updated = prevItems
          .map((item) => {
            if (item.status !== 'on_belt') return item;

            const nextPos = item.positionMm + conveyorState.speedMmPerSec * deltaSec;

            // Optical Sensor beam is at 400mm (detection zone 380mm to 420mm)
            if (nextPos >= 380 && nextPos <= 420) {
              sensorTriggered = true;
              detectedItemRef = item;
            }

            // Diverter Actuator is at 600mm
            // Check if active rule specifies diversion for this item
            const matchingRule = sortRules.find(
              (r) =>
                r.active &&
                (r.color === 'all' || r.color === item.color) &&
                (r.shape === 'all' || r.shape === item.shape)
            );

            if (matchingRule && matchingRule.targetBin === 'Bin A') {
              if (nextPos >= 580 && nextPos <= 640) {
                pusherShouldExtend = true;
                // Divert into Bin A
                soundFx.playPneumaticClick(false);
                setConveyorMetrics((m) => ({
                  ...m,
                  totalProcessed: m.totalProcessed + 1,
                  correctlySorted: m.correctlySorted + 1,
                  remainingOnBelt: Math.max(0, m.remainingOnBelt - 1),
                }));
                addLog('sensor', `Pusher diverted ${item.color} ${item.shape} into Bin A per rule.`, 'success');
                return { ...item, positionMm: nextPos, status: 'diverted' as const, assignedBin: 'Bin A' as const };
              }
            }

            // Secondary Bin B at 800mm (Drop chute)
            if (matchingRule && matchingRule.targetBin === 'Bin B' && nextPos >= 800 && nextPos <= 840) {
              setConveyorMetrics((m) => ({
                ...m,
                totalProcessed: m.totalProcessed + 1,
                correctlySorted: m.correctlySorted + 1,
                remainingOnBelt: Math.max(0, m.remainingOnBelt - 1),
              }));
              addLog('sensor', `${item.color} ${item.shape} sorted into Bin B.`, 'success');
              return { ...item, positionMm: nextPos, status: 'sorted' as const, assignedBin: 'Bin B' as const };
            }

            // End of Conveyor (1000mm) -> Bin C or Overflow
            if (nextPos >= 1000) {
              const isBinC = matchingRule && matchingRule.targetBin === 'Bin C';
              setConveyorMetrics((m) => ({
                ...m,
                totalProcessed: m.totalProcessed + 1,
                correctlySorted: isBinC ? m.correctlySorted + 1 : m.correctlySorted,
                incorrectlySorted: !isBinC ? m.incorrectlySorted + 1 : m.incorrectlySorted,
                remainingOnBelt: Math.max(0, m.remainingOnBelt - 1),
              }));
              addLog(
                'sensor',
                `${item.color} item reached end of line -> ${isBinC ? 'Collected in Bin C' : 'Missed sorting rules / Reject chute'}.`,
                isBinC ? 'success' : 'warn'
              );
              return { ...item, positionMm: nextPos, status: 'passed_end' as const, assignedBin: isBinC ? 'Bin C' as const : 'Reject' as const };
            }

            return { ...item, positionMm: nextPos };
          })
          .filter((item) => item.positionMm <= 1050 && item.status === 'on_belt'); // retain only active items on belt

        // Sensor trigger sound
        if (sensorTriggered && !conveyorState.opticalSensorTriggered) {
          soundFx.playOpticalSensorChirp();
          if (detectedItemRef) {
            addLog('sensor', `Optical sensor beam tripped by ${(detectedItemRef as ConveyorItem).color} ${(detectedItemRef as ConveyorItem).shape}.`, 'info');
          }
        }

        // Update sensor and pusher actuator state
        setConveyorState((cs) => ({
          ...cs,
          opticalSensorTriggered: sensorTriggered,
          sensorDetectedItem: detectedItemRef,
          pusherExtensionPercent: pusherShouldExtend ? 100 : 0,
        }));

        return updated;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [conveyorState.isRunning, conveyorState.speedMmPerSec, sortRules, isEStopped, settings.speedMultiplier]);

  return (
    <SimulationContext.Provider
      value={{
        robot,
        selectRobot,
        jointAngles,
        setJointAngle,
        setAllJointAngles,
        gripperState,
        setGripperState,
        tcpPose,
        ikTarget,
        setIkTarget,
        moveToCartesianTarget,
        resetToHome,
        isNearSingularity: singularityCheck.nearSingularity,
        singularityWarning: singularityCheck.warning || null,

        activeLab,
        setActiveLab,

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

        conveyorItems,
        conveyorState,
        conveyorMetrics,
        sortRules,
        setSortRules,
        toggleConveyor,
        setConveyorSpeed,
        spawnConveyorItem,
        resetConveyor,

        settings,
        updateSettings,
        isEStopped,
        toggleEStop,

        eventLogs,
        addLog,
        clearLogs,
      }}
    >
      {children}
    </SimulationContext.Provider>
  );
};

export const useSimulation = () => {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error('useSimulation must be used within a SimulationProvider');
  }
  return context;
};
