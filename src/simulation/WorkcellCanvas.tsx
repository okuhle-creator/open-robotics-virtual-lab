import React, { useRef, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { RobotSpecification, GripperState, CartesianPose } from '../types/robot';
import { Workpiece, TargetTraySlot } from '../types/pickAndPlace';
import { ConveyorItem, ConveyorState } from '../types/conveyor';
import { RobotManipulator } from './RobotManipulator';
import { WorkcellEnvironment } from './WorkcellEnvironment';
import { PickPlaceObjects } from './PickPlaceObjects';
import { ConveyorBelt3D } from './ConveyorBelt3D';

interface WorkcellCanvasProps {
  robot: RobotSpecification;
  jointAnglesDeg: number[];
  gripperState: GripperState;
  tcpPose: CartesianPose;
  activeLab: 'jogging' | 'pick_place' | 'conveyor' | 'programming' | 'curriculum';
  showGrid?: boolean;
  showAxes?: boolean;
  showEnvelope?: boolean;
  workpieces: Workpiece[];
  targetSlots: TargetTraySlot[];
  activeWorkpieceId: string | null;
  conveyorItems: ConveyorItem[];
  conveyorState: ConveyorState;
}

export const WorkcellCanvas: React.FC<WorkcellCanvasProps> = ({
  robot,
  jointAnglesDeg,
  gripperState,
  tcpPose,
  activeLab,
  showGrid = true,
  showAxes = true,
  showEnvelope = false,
  workpieces,
  targetSlots,
  activeWorkpieceId,
  conveyorItems,
  conveyorState,
}) => {
  const controlsRef = useRef<OrbitControlsImpl>(null);

  const resetCamera = (preset: 'iso' | 'top' | 'front') => {
    if (!controlsRef.current) return;
    if (preset === 'iso') {
      controlsRef.current.object.position.set(0.9, 0.7, 0.9);
      controlsRef.current.target.set(0, 0.2, 0);
    } else if (preset === 'top') {
      controlsRef.current.object.position.set(0, 1.4, 0.001);
      controlsRef.current.target.set(0, 0.1, 0);
    } else if (preset === 'front') {
      controlsRef.current.object.position.set(0, 0.35, 1.2);
      controlsRef.current.target.set(0, 0.2, 0);
    }
    controlsRef.current.update();
  };

  return (
    <div className="relative w-full h-full bg-[#0a0f1d] overflow-hidden select-none">
      {/* 3D Viewport Controls & Camera Quick Buttons */}
      <div className="absolute top-3 right-3 z-10 flex items-center space-x-1.5 bg-slate-900/80 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-slate-700/60 text-xs text-slate-300">
        <span className="text-[11px] font-mono text-slate-400 mr-1">VIEW:</span>
        <button
          onClick={() => resetCamera('iso')}
          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-sky-400 transition"
          title="Isometric View"
        >
          ISO
        </button>
        <button
          onClick={() => resetCamera('top')}
          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
          title="Top Plan View"
        >
          TOP
        </button>
        <button
          onClick={() => resetCamera('front')}
          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
          title="Front Elevation View"
        >
          FRONT
        </button>
      </div>

      {/* Primary React Three Fiber Canvas */}
      <Canvas shadows dpr={[1, 2]} gl={{ antialias: true, powerPreference: 'high-performance' }}>
        <PerspectiveCamera makeDefault fov={45} position={[0.9, 0.7, 0.9]} near={0.05} far={30} />
        <OrbitControls
          ref={controlsRef}
          makeDefault
          enableDamping
          dampingFactor={0.08}
          minDistance={0.3}
          maxDistance={3.0}
          maxPolarAngle={Math.PI / 2 + 0.05} // prevent going underneath ground
          target={[0, 0.2, 0]}
        />

        {/* Industrial Lighting Rig */}
        <ambientLight intensity={0.8} />
        <directionalLight
          position={[3, 5, 2]}
          intensity={1.4}
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-bias={-0.0001}
        />
        <directionalLight position={[-2, 3, -2]} intensity={0.5} />
        <pointLight position={[0, 1.2, 0]} intensity={0.4} color="#38bdf8" />

        <Suspense fallback={null}>
          {/* Workcell Ground, Table & Reference Grid */}
          <WorkcellEnvironment
            showGrid={showGrid}
            showAxes={showAxes}
            showEnvelope={showEnvelope}
            reachMm={robot.reachMm}
          />

          {/* 3D Hierarchical Robot Manipulator */}
          <RobotManipulator
            robot={robot}
            jointAnglesDeg={jointAnglesDeg}
            gripperState={gripperState}
            showAxes={showAxes}
          />

          {/* Pick and Place Objects (rendered in Pick & Place, Jogging, or Programming mode) */}
          {(activeLab === 'pick_place' || activeLab === 'jogging' || activeLab === 'programming') && (
            <PickPlaceObjects
              workpieces={workpieces}
              targetSlots={targetSlots}
              activeId={activeWorkpieceId}
              tcpPose={tcpPose}
              gripperClosed={gripperState === 'closed'}
            />
          )}

          {/* Conveyor Belt System (rendered in Conveyor Sorting or Programming mode) */}
          {(activeLab === 'conveyor' || activeLab === 'programming') && (
            <ConveyorBelt3D items={conveyorItems} conveyorState={conveyorState} />
          )}
        </Suspense>
      </Canvas>
    </div>
  );
};
