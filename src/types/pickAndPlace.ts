import { CartesianCoord } from './robot';

export type WorkpieceType = 'cube' | 'cylinder' | 'ic_chip';

export interface Workpiece {
  id: string;
  name: string;
  type: WorkpieceType;
  color: string;
  position: CartesianCoord; // in mm
  initialPosition: CartesianCoord;
  dimensions: { width: number; height: number; depth: number };
  grasped: boolean;
  delivered: boolean;
  targetSlotId?: string;
}

export interface TargetTraySlot {
  id: string;
  name: string;
  position: CartesianCoord;
  occupiedBy?: string;
  colorHint: string;
}

export type PickPlaceStage =
  | 'IDLE'
  | 'APPROACH_HOVER'
  | 'DESCEND_GRASP'
  | 'CLOSING_GRIPPER'
  | 'LIFT_PAYLOAD'
  | 'TRANSIT_TARGET'
  | 'DESCEND_PLACE'
  | 'OPENING_GRIPPER'
  | 'RETRACT_CLEAR'
  | 'RETURN_HOME'
  | 'COMPLETED'
  | 'FAILED_UNREACHABLE'
  | 'FAILED_COLLISION';

export interface PickPlaceState {
  stage: PickPlaceStage;
  activeWorkpieceId: string | null;
  targetSlotId: string | null;
  progressPercent: number;
  isRunning: boolean;
  isPaused: boolean;
  cycleCount: number;
  lastError: string | null;
}
