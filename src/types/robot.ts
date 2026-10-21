export interface JointLimit {
  index: number;
  name: string;
  minDeg: number;
  maxDeg: number;
  maxSpeedDegPerSec: number;
  description: string;
}

export interface DHParameter {
  joint: number;
  aMm: number;        // link length along x_i
  alphaDeg: number;   // link twist about x_i
  dMm: number;        // link offset along z_{i-1}
  thetaDeg: number;   // joint angle about z_{i-1}
}

export interface RobotLinkDimensions {
  baseHeightMm: number;
  upperArmMm: number;
  forearmMm: number;
  wristMm: number;
  toolMm: number;
}

export interface RobotSpecification {
  id: string;
  name: string;
  category: '6-DOF Articulated' | '4-DOF SCARA' | '6-DOF Cobot';
  dof: number;
  payloadKg: number;
  reachMm: number;
  repeatabilityMm: number;
  linkDimensions: RobotLinkDimensions;
  jointLimits: JointLimit[];
  homeJointsDeg: number[];
  dhParameters: DHParameter[];
  color: string;
  accentColor: string;
}

export interface CartesianCoord {
  x: number; // mm
  y: number; // mm
  z: number; // mm
}

export interface CartesianPose extends CartesianCoord {
  rollDeg: number;
  pitchDeg: number;
  yawDeg: number;
}

export type GripperState = 'open' | 'closed';
