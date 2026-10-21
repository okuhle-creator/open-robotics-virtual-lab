import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { RobotSpecification, GripperState } from '../types/robot';
import { GripperModel } from './GripperModel';

interface RobotManipulatorProps {
  robot: RobotSpecification;
  jointAnglesDeg: number[];
  gripperState: GripperState;
  showAxes?: boolean;
}

const DEG2RAD = Math.PI / 180;

export const RobotManipulator: React.FC<RobotManipulatorProps> = ({
  robot,
  jointAnglesDeg,
  gripperState,
  showAxes = false,
}) => {
  // References to joint groups for smooth interpolation
  const j1Ref = useRef<THREE.Group>(null);
  const j2Ref = useRef<THREE.Group>(null);
  const j3Ref = useRef<THREE.Group>(null);
  const j4Ref = useRef<THREE.Group>(null);
  const j5Ref = useRef<THREE.Group>(null);
  const j6Ref = useRef<THREE.Group>(null);

  // Link dimensions in meters (Three.js units)
  const baseH = robot.linkDimensions.baseHeightMm / 1000;
  const upperL = robot.linkDimensions.upperArmMm / 1000;
  const foreL = robot.linkDimensions.forearmMm / 1000;
  const wristL = robot.linkDimensions.wristMm / 1000;

  useFrame((_, delta) => {
    const lerpSpeed = Math.min(delta * 12, 1);

    if (j1Ref.current) {
      const targetJ1 = (jointAnglesDeg[0] || 0) * DEG2RAD;
      j1Ref.current.rotation.y = THREE.MathUtils.lerp(j1Ref.current.rotation.y, targetJ1, lerpSpeed);
    }
    if (j2Ref.current) {
      const targetJ2 = (jointAnglesDeg[1] || 0) * DEG2RAD;
      j2Ref.current.rotation.z = THREE.MathUtils.lerp(j2Ref.current.rotation.z, -targetJ2, lerpSpeed);
    }
    if (j3Ref.current) {
      const targetJ3 = (jointAnglesDeg[2] || 0) * DEG2RAD;
      j3Ref.current.rotation.z = THREE.MathUtils.lerp(j3Ref.current.rotation.z, -targetJ3, lerpSpeed);
    }
    if (j4Ref.current) {
      const targetJ4 = (jointAnglesDeg[3] || 0) * DEG2RAD;
      j4Ref.current.rotation.y = THREE.MathUtils.lerp(j4Ref.current.rotation.y, targetJ4, lerpSpeed);
    }
    if (j5Ref.current) {
      const targetJ5 = (jointAnglesDeg[4] || 0) * DEG2RAD;
      j5Ref.current.rotation.z = THREE.MathUtils.lerp(j5Ref.current.rotation.z, -targetJ5, lerpSpeed);
    }
    if (j6Ref.current) {
      const targetJ6 = (jointAnglesDeg[5] || 0) * DEG2RAD;
      j6Ref.current.rotation.y = THREE.MathUtils.lerp(j6Ref.current.rotation.y, targetJ6, lerpSpeed);
    }
  });

  const bodyColor = robot.color;
  const jointMetalColor = '#334155';
  const accentColor = robot.accentColor;

  return (
    <group position={[0, 0, 0]}>
      {/* ================= BASE ASSEMBLY (FIXED) ================= */}
      <group position={[0, 0, 0]}>
        {/* Foundation mounting flange */}
        <mesh position={[0, 0.015, 0]}>
          <cylinderGeometry args={[0.09, 0.1, 0.03, 32]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
        </mesh>

        {/* Mounting bolts */}
        {[-0.07, 0.07].map((bx) =>
          [-0.07, 0.07].map((bz) => (
            <mesh key={`${bx}-${bz}`} position={[bx, 0.032, bz]}>
              <cylinderGeometry args={[0.007, 0.007, 0.008, 12]} />
              <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.2} />
            </mesh>
          ))
        )}

        {/* Base pedestal housing */}
        <mesh position={[0, baseH * 0.5, 0]}>
          <cylinderGeometry args={[0.075, 0.085, baseH - 0.03, 32]} />
          <meshStandardMaterial color={bodyColor} metalness={0.4} roughness={0.4} />
        </mesh>

        {/* Industrial accent ring */}
        <mesh position={[0, baseH * 0.45, 0]}>
          <torusGeometry args={[0.078, 0.005, 16, 32]} />
          <meshBasicMaterial color={accentColor} />
        </mesh>
      </group>

      {/* ================= JOINT 1: WAIST SWIVEL (ROTATES AROUND Y) ================= */}
      <group ref={j1Ref} position={[0, baseH, 0]}>
        {/* Turntable head & shoulder motor casing */}
        <mesh position={[0, 0.02, 0]}>
          <cylinderGeometry args={[0.072, 0.072, 0.04, 32]} />
          <meshStandardMaterial color={jointMetalColor} metalness={0.7} roughness={0.3} />
        </mesh>

        {/* Dual shoulder bracket towers */}
        <mesh position={[0, 0.05, 0]}>
          <boxGeometry args={[0.08, 0.07, 0.11]} />
          <meshStandardMaterial color={bodyColor} metalness={0.4} roughness={0.4} />
        </mesh>

        {/* Shoulder motor cover disk */}
        <mesh position={[0, 0.05, 0.06]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 0.015, 24]} />
          <meshStandardMaterial color={jointMetalColor} metalness={0.8} roughness={0.3} />
        </mesh>

        {/* ================= JOINT 2: SHOULDER PITCH (ROTATES AROUND Z) ================= */}
        <group ref={j2Ref} position={[0, 0.05, 0]}>
          {/* Upper Arm Main Casting */}
          <group position={[0, upperL * 0.5, 0]}>
            <mesh>
              <boxGeometry args={[0.06, upperL, 0.07]} />
              <meshStandardMaterial color={bodyColor} metalness={0.4} roughness={0.4} />
            </mesh>

            {/* Aesthetic side groove & logo plate */}
            <mesh position={[0.031, 0, 0]}>
              <boxGeometry args={[0.002, upperL * 0.7, 0.04]} />
              <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} />
            </mesh>
          </group>

          {/* ================= JOINT 3: ELBOW PITCH (ROTATES AROUND Z) ================= */}
          <group ref={j3Ref} position={[0, upperL, 0]}>
            {/* Elbow joint motor hub */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.042, 0.042, 0.09, 28]} />
              <meshStandardMaterial color={jointMetalColor} metalness={0.7} roughness={0.3} />
            </mesh>

            {/* ================= JOINT 4: FOREARM ROLL (ROTATES AROUND Y) ================= */}
            <group ref={j4Ref} position={[0, 0, 0]}>
              {/* Forearm lower housing */}
              <group position={[0, foreL * 0.45, 0]}>
                <mesh>
                  <cylinderGeometry args={[0.035, 0.042, foreL * 0.9, 24]} />
                  <meshStandardMaterial color={bodyColor} metalness={0.4} roughness={0.4} />
                </mesh>
              </group>

              {/* ================= JOINT 5: WRIST PITCH (ROTATES AROUND Z) ================= */}
              <group ref={j5Ref} position={[0, foreL, 0]}>
                {/* Wrist pivot housing */}
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.028, 0.028, 0.065, 20]} />
                  <meshStandardMaterial color={jointMetalColor} metalness={0.8} roughness={0.3} />
                </mesh>

                {/* ================= JOINT 6: TOOL FLANGE ROLL (ROTATES AROUND Y) ================= */}
                <group ref={j6Ref} position={[0, wristL, 0]}>
                  {/* Flange ring */}
                  <mesh position={[0, 0.01, 0]}>
                    <cylinderGeometry args={[0.03, 0.03, 0.015, 24]} />
                    <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.2} />
                  </mesh>

                  {/* Gripper end effector */}
                  <GripperModel gripperState={gripperState} accentColor={accentColor} />

                  {/* Coordinate Triad for TCP (optional) */}
                  {showAxes && (
                    <group position={[0, 0.09, 0]}>
                      <axesHelper args={[0.08]} />
                    </group>
                  )}
                </group>
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
};
