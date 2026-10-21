import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { ConveyorItem, ConveyorState } from '../types/conveyor';

interface ConveyorBelt3DProps {
  items: ConveyorItem[];
  conveyorState: ConveyorState;
}

export const ConveyorBelt3D: React.FC<ConveyorBelt3DProps> = ({
  items,
  conveyorState,
}) => {
  const beltTextureOffsetRef = useRef(0);
  const pusherArmRef = useRef<THREE.Group>(null);

  // Animate belt rollers & texture when running
  useFrame((_, delta) => {
    if (conveyorState.isRunning) {
      beltTextureOffsetRef.current = (beltTextureOffsetRef.current + delta * (conveyorState.speedMmPerSec / 1000)) % 1;
    }

    if (pusherArmRef.current) {
      // Pusher extension between 0 and 0.08m (80mm stroke)
      const targetExtension = (conveyorState.pusherExtensionPercent / 100) * 0.08;
      pusherArmRef.current.position.z = THREE.MathUtils.lerp(
        pusherArmRef.current.position.z,
        targetExtension,
        delta * 16
      );
    }
  });

  // Belt geometry parameters: length 1.0m (1000mm), width 0.14m (140mm)
  // Positioned parallel to X-axis on front side of workbench
  const beltLength = 1.0;
  const beltWidth = 0.14;
  const beltHeight = 0.04;
  const beltCenter = [0, 0.02, 0.35] as const;

  return (
    <group position={beltCenter}>
      {/* Conveyor Bed Structure (Extruded Aluminum Frame) */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[beltLength, beltHeight, beltWidth]} />
        <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Rubber Moving Belt Top Surface */}
      <mesh position={[0, beltHeight * 0.5 + 0.001, 0]}>
        <boxGeometry args={[beltLength - 0.02, 0.002, beltWidth - 0.02]} />
        <meshStandardMaterial color="#0f172a" roughness={0.9} metalness={0.1} />
      </mesh>

      {/* Conveyor Guide Rails (Left & Right safety guides) */}
      <mesh position={[0, beltHeight * 0.5 + 0.012, -(beltWidth * 0.5 - 0.005)]}>
        <boxGeometry args={[beltLength, 0.024, 0.006]} />
        <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0, beltHeight * 0.5 + 0.012, beltWidth * 0.5 - 0.005]}>
        <boxGeometry args={[beltLength, 0.024, 0.006]} />
        <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Drive Motor and Gearbox at Belt Start */}
      <group position={[-beltLength * 0.5 - 0.03, 0, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.035, 0.035, 0.06, 20]} />
          <meshStandardMaterial color="#0284c7" metalness={0.6} roughness={0.4} />
        </mesh>
      </group>

      {/* ================= OPTICAL SENSOR CELL (AT 400mm / X = -0.1) ================= */}
      <group position={[-0.1, beltHeight * 0.5, 0]}>
        {/* Transmitter Pillar (Far side) */}
        <mesh position={[0, 0.03, -beltWidth * 0.5 - 0.015]}>
          <boxGeometry args={[0.015, 0.06, 0.015]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>

        {/* Receiver Pillar (Near side) */}
        <mesh position={[0, 0.03, beltWidth * 0.5 + 0.015]}>
          <boxGeometry args={[0.015, 0.06, 0.015]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>

        {/* Photoelectric Beam (Red laser line across the belt) */}
        <mesh position={[0, 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.0015, 0.0015, beltWidth + 0.02, 8]} />
          <meshBasicMaterial
            color={conveyorState.opticalSensorTriggered ? '#ef4444' : '#22c55e'}
            opacity={0.8}
            transparent
          />
        </mesh>

        {/* Status Indicator LED atop receiver */}
        <mesh position={[0, 0.065, beltWidth * 0.5 + 0.015]}>
          <sphereGeometry args={[0.005, 12, 12]} />
          <meshBasicMaterial color={conveyorState.opticalSensorTriggered ? '#ef4444' : '#22c55e'} />
        </mesh>
      </group>

      {/* ================= PNEUMATIC PUSHER / DIVERTER (AT 600mm / X = 0.1) ================= */}
      <group position={[0.1, beltHeight * 0.5 + 0.015, -beltWidth * 0.5 - 0.03]}>
        {/* Fixed Actuator Cylinder Housing */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.016, 0.016, 0.06, 16]} />
          <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.3} />
        </mesh>

        {/* Moving Ram / Diverter Blade */}
        <group ref={pusherArmRef} position={[0, 0, 0]}>
          <mesh position={[0, 0, 0.03]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.006, 0.006, 0.07, 12]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.1} />
          </mesh>
          {/* Pusher paddle */}
          <mesh position={[0, 0, 0.07]}>
            <boxGeometry args={[0.06, 0.022, 0.006]} />
            <meshStandardMaterial color="#f59e0b" roughness={0.4} />
          </mesh>
        </group>
      </group>

      {/* ================= COLLECTION BINS ================= */}
      {/* Bin A (Diverter Target) */}
      <group position={[0.1, -0.02, beltWidth * 0.5 + 0.08]}>
        <mesh>
          <boxGeometry args={[0.15, 0.08, 0.12]} />
          <meshStandardMaterial color="#0284c7" metalness={0.2} roughness={0.6} />
        </mesh>
        {/* Inner cavity cutout effect */}
        <mesh position={[0, 0.02, 0]}>
          <boxGeometry args={[0.13, 0.07, 0.1]} />
          <meshStandardMaterial color="#082f49" roughness={0.8} />
        </mesh>
      </group>

      {/* Bin B (Mid-point Collection) */}
      <group position={[0.3, -0.02, beltWidth * 0.5 + 0.08]}>
        <mesh>
          <boxGeometry args={[0.15, 0.08, 0.12]} />
          <meshStandardMaterial color="#10b981" metalness={0.2} roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.02, 0]}>
          <boxGeometry args={[0.13, 0.07, 0.1]} />
          <meshStandardMaterial color="#064e3b" roughness={0.8} />
        </mesh>
      </group>

      {/* Bin C (End-of-line Chute) */}
      <group position={[beltLength * 0.5 + 0.08, -0.04, 0]}>
        <mesh>
          <boxGeometry args={[0.12, 0.1, 0.16]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.2} roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.02, 0]}>
          <boxGeometry args={[0.1, 0.09, 0.14]} />
          <meshStandardMaterial color="#78350f" roughness={0.8} />
        </mesh>
      </group>

      {/* ================= MOVING CONVEYOR ITEMS ================= */}
      {items.map((item) => {
        // Map item.positionMm (0 to 1000) to Three.js X coordinate (-0.5 to +0.5)
        const posX = (item.positionMm / 1000) - 0.5;
        const posZ = (item.lateralOffsetMm / 1000);
        const posY = beltHeight * 0.5 + 0.015;

        // Colors mapping
        const colorMap: Record<string, string> = {
          red: '#ef4444',
          green: '#10b981',
          blue: '#3b82f6',
          yellow: '#f59e0b',
        };
        const itemColor = colorMap[item.color] || '#94a3b8';

        return (
          <group key={item.id} position={[posX, posY, posZ]}>
            {item.shape === 'box' ? (
              <mesh castShadow>
                <boxGeometry args={[0.026, 0.024, 0.026]} />
                <meshStandardMaterial color={itemColor} roughness={0.4} />
              </mesh>
            ) : (
              <mesh castShadow>
                <cylinderGeometry args={[0.014, 0.014, 0.026, 20]} />
                <meshStandardMaterial color={itemColor} roughness={0.4} />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
};
