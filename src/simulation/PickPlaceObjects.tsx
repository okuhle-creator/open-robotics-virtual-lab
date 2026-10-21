import React from 'react';
import { Workpiece, TargetTraySlot } from '../types/pickAndPlace';
import { CartesianPose } from '../types/robot';

interface PickPlaceObjectsProps {
  workpieces: Workpiece[];
  targetSlots: TargetTraySlot[];
  activeId: string | null;
  tcpPose: CartesianPose;
  gripperClosed: boolean;
}

export const PickPlaceObjects: React.FC<PickPlaceObjectsProps> = ({
  workpieces,
  targetSlots,
  activeId,
  tcpPose,
  gripperClosed,
}) => {
  return (
    <group>
      {/* Target Destination Tray Slots */}
      {targetSlots.map((slot) => {
        const sx = slot.position.x / 1000;
        const sy = 0.005; // slightly above table
        const sz = slot.position.y / 1000; // coordinate translation to Three.js (Z is lateral/depth)

        return (
          <group key={slot.id} position={[sx, sy, sz]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.02, 0.025, 24]} />
              <meshBasicMaterial color={slot.colorHint} />
            </mesh>
          </group>
        );
      })}

      {/* Dynamic Workpieces */}
      {workpieces.map((item) => {
        // If grasped by gripper, item is located at TCP minus offset
        const isHeld = item.grasped && gripperClosed;

        const posX = isHeld ? tcpPose.x / 1000 : item.position.x / 1000;
        const posY = isHeld ? Math.max(0.015, (tcpPose.z - 35) / 1000) : item.position.z / 1000 + 0.012;
        const posZ = isHeld ? tcpPose.y / 1000 : item.position.y / 1000;

        const isSelected = item.id === activeId;

        return (
          <group key={item.id} position={[posX, posY, posZ]}>
            {/* Visual Object Mesh based on type */}
            {item.type === 'cube' && (
              <mesh castShadow>
                <boxGeometry args={[0.024, 0.024, 0.024]} />
                <meshStandardMaterial
                  color={item.color}
                  roughness={0.3}
                  metalness={0.2}
                  emissive={isSelected ? '#38bdf8' : '#000000'}
                  emissiveIntensity={isSelected ? 0.3 : 0}
                />
              </mesh>
            )}

            {item.type === 'cylinder' && (
              <mesh castShadow>
                <cylinderGeometry args={[0.014, 0.014, 0.028, 24]} />
                <meshStandardMaterial
                  color={item.color}
                  roughness={0.3}
                  metalness={0.2}
                  emissive={isSelected ? '#38bdf8' : '#000000'}
                  emissiveIntensity={isSelected ? 0.3 : 0}
                />
              </mesh>
            )}

            {item.type === 'ic_chip' && (
              <group>
                <mesh castShadow>
                  <boxGeometry args={[0.026, 0.008, 0.026]} />
                  <meshStandardMaterial color="#0f172a" roughness={0.5} metalness={0.6} />
                </mesh>
                {/* Microcontroller pins */}
                <mesh position={[0, -0.003, 0]}>
                  <boxGeometry args={[0.03, 0.002, 0.024]} />
                  <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.1} />
                </mesh>
              </group>
            )}

            {/* Selection bounding box indicator */}
            {isSelected && (
              <mesh>
                <boxGeometry args={[0.032, 0.032, 0.032]} />
                <meshBasicMaterial color="#38bdf8" wireframe />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
};
