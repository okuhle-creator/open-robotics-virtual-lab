import { RobotSpecification } from '../types/robot';

export const ROBOT_MODELS: Record<string, RobotSpecification> = {
  'orv-600': {
    id: 'orv-600',
    name: 'ORV-600 Articulated Arm',
    category: '6-DOF Articulated',
    dof: 6,
    payloadKg: 3.0,
    reachMm: 600,
    repeatabilityMm: 0.03,
    linkDimensions: {
      baseHeightMm: 180,
      upperArmMm: 240,
      forearmMm: 220,
      wristMm: 65,
      toolMm: 75,
    },
    color: '#0d9488', // Teal industrial
    accentColor: '#00f2fe',
    homeJointsDeg: [0, 25, -45, 0, 20, 0],
    jointLimits: [
      { index: 0, name: 'J1 - Base Rotation', minDeg: -165, maxDeg: 165, maxSpeedDegPerSec: 150, description: 'Waist yaw axis rotation' },
      { index: 1, name: 'J2 - Shoulder Pitch', minDeg: -60, maxDeg: 110, maxSpeedDegPerSec: 120, description: 'Shoulder elevation angle' },
      { index: 2, name: 'J3 - Elbow Pitch', minDeg: -130, maxDeg: 80, maxSpeedDegPerSec: 150, description: 'Forearm flex/extension' },
      { index: 3, name: 'J4 - Forearm Roll', minDeg: -170, maxDeg: 170, maxSpeedDegPerSec: 200, description: 'Forearm axial twist' },
      { index: 4, name: 'J5 - Wrist Pitch', minDeg: -105, maxDeg: 105, maxSpeedDegPerSec: 200, description: 'Tool pitch elevation' },
      { index: 5, name: 'J6 - Tool Flange Roll', minDeg: -180, maxDeg: 180, maxSpeedDegPerSec: 250, description: 'Tool orientation rotation' },
    ],
    dhParameters: [
      { joint: 1, aMm: 0, alphaDeg: 90, dMm: 180, thetaDeg: 0 },
      { joint: 2, aMm: 240, alphaDeg: 0, dMm: 0, thetaDeg: 0 },
      { joint: 3, aMm: 0, alphaDeg: 90, dMm: 0, thetaDeg: 0 },
      { joint: 4, aMm: 0, alphaDeg: -90, dMm: 220, thetaDeg: 0 },
      { joint: 5, aMm: 0, alphaDeg: 90, dMm: 0, thetaDeg: 0 },
      { joint: 6, aMm: 0, alphaDeg: 0, dMm: 140, thetaDeg: 0 },
    ],
  },
  'orv-scara-400': {
    id: 'orv-scara-400',
    name: 'ORV-SCARA 400',
    category: '4-DOF SCARA',
    dof: 4,
    payloadKg: 5.0,
    reachMm: 400,
    repeatabilityMm: 0.02,
    linkDimensions: {
      baseHeightMm: 200,
      upperArmMm: 200,
      forearmMm: 200,
      wristMm: 40,
      toolMm: 60,
    },
    color: '#0284c7', // Sky blue
    accentColor: '#38bdf8',
    homeJointsDeg: [0, 30, -60, 0],
    jointLimits: [
      { index: 0, name: 'J1 - Inner Arm Yaw', minDeg: -125, maxDeg: 125, maxSpeedDegPerSec: 180, description: 'Base swivel link 1' },
      { index: 1, name: 'J2 - Outer Arm Yaw', minDeg: -140, maxDeg: 140, maxSpeedDegPerSec: 200, description: 'Elbow swivel link 2' },
      { index: 2, name: 'J3 - Z Ballscrew Stroke', minDeg: 0, maxDeg: 150, maxSpeedDegPerSec: 100, description: 'Linear vertical quill (mm)' },
      { index: 3, name: 'J4 - Flange Rotation', minDeg: -180, maxDeg: 180, maxSpeedDegPerSec: 300, description: 'End-effector spin' },
    ],
    dhParameters: [
      { joint: 1, aMm: 200, alphaDeg: 0, dMm: 200, thetaDeg: 0 },
      { joint: 2, aMm: 200, alphaDeg: 180, dMm: 0, thetaDeg: 0 },
      { joint: 3, aMm: 0, alphaDeg: 0, dMm: 50, thetaDeg: 0 },
      { joint: 4, aMm: 0, alphaDeg: 0, dMm: 60, thetaDeg: 0 },
    ],
  },
};

export const DEFAULT_ROBOT_ID = 'orv-600';
