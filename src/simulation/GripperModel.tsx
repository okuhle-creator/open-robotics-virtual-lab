import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { GripperState } from '../types/robot';

interface GripperModelProps {
  gripperState: GripperState;
  accentColor?: string;
}

export const GripperModel: React.FC<GripperModelProps> = ({
  gripperState,
  accentColor = '#00f2fe',
}) => {
  const leftFingerRef = useRef<THREE.Group>(null);
  const rightFingerRef = useRef<THREE.Group>(null);

  // Target separation: Open = 0.024m (24mm each side), Closed = 0.007m (7mm each side)
  const targetSeparation = gripperState === 'open' ? 0.024 : 0.007;

  useFrame((_, delta) => {
    const lerpSpeed = Math.min(delta * 14, 1);
    if (leftFingerRef.current) {
      leftFingerRef.current.position.x = THREE.MathUtils.lerp(
        leftFingerRef.current.position.x,
        -targetSeparation,
        lerpSpeed
      );
    }
    if (rightFingerRef.current) {
      rightFingerRef.current.position.x = THREE.MathUtils.lerp(
        rightFingerRef.current.position.x,
        targetSeparation,
        lerpSpeed
      );
    }
  });

  return (
    <group position={[0, 0.04, 0]}>
      {/* Tool flange mounting plate */}
      <mesh position={[0, -0.015, 0]}>
        <cylinderGeometry args={[0.032, 0.035, 0.01, 24]} />
        <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Gripper actuator body */}
      <mesh position={[0, 0.008, 0]}>
        <boxGeometry args={[0.055, 0.035, 0.042]} />
        <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.4} />
      </mesh>

      {/* Status LED on gripper */}
      <mesh position={[0, 0.008, 0.022]}>
        <cylinderGeometry args={[0.004, 0.004, 0.002, 12]} rotation={[Math.PI / 2, 0, 0]} />
        <meshBasicMaterial color={gripperState === 'closed' ? '#10b981' : accentColor} />
      </mesh>

      {/* Guide rail bar */}
      <mesh position={[0, 0.026, 0]}>
        <boxGeometry args={[0.065, 0.006, 0.016]} />
        <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Left Finger Assembly */}
      <group ref={leftFingerRef} position={[-0.024, 0.035, 0]}>
        <mesh position={[0, 0.018, 0]}>
          <boxGeometry args={[0.007, 0.036, 0.016]} />
          <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} />
        </mesh>
        {/* Rubber gripping pad */}
        <mesh position={[0.004, 0.022, 0]}>
          <boxGeometry args={[0.002, 0.024, 0.014]} />
          <meshStandardMaterial color="#0284c7" roughness={0.9} />
        </mesh>
      </group>

      {/* Right Finger Assembly */}
      <group ref={rightFingerRef} position={[0.024, 0.035, 0]}>
        <mesh position={[0, 0.018, 0]}>
          <boxGeometry args={[0.007, 0.036, 0.016]} />
          <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} />
        </mesh>
        {/* Rubber gripping pad */}
        <mesh position={[-0.004, 0.022, 0]}>
          <boxGeometry args={[0.002, 0.024, 0.014]} />
          <meshStandardMaterial color="#0284c7" roughness={0.9} />
        </mesh>
      </group>

      {/* Tool Center Point (TCP) Target marker indicator */}
      <group position={[0, 0.055, 0]}>
        <mesh>
          <sphereGeometry args={[0.003, 12, 12]} />
          <meshBasicMaterial color="#ef4444" wireframe />
        </mesh>
      </group>
    </group>
  );
};
