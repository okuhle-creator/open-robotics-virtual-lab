import { CartesianCoord, CartesianPose } from './robot';

export interface ForwardKinematicsResult {
  tcp: CartesianPose;
  linkPositions: CartesianCoord[]; // Positions of each joint pivot in base frame (mm)
  transformationMatrix: number[][]; // 4x4 homogenous matrix
}

export interface InverseKinematicsResult {
  reachable: boolean;
  jointAnglesDeg?: number[];
  error?: string;
  residualDistanceMm?: number;
  reason?: string;
}

export interface SingularityCheck {
  nearSingularity: boolean;
  type?: 'wrist_singularity' | 'shoulder_singularity' | 'reach_boundary';
  warning?: string;
}
