export type ConveyorItemColor = 'red' | 'green' | 'blue' | 'yellow';
export type ConveyorItemShape = 'box' | 'cylinder';

export interface ConveyorItem {
  id: string;
  name: string;
  color: ConveyorItemColor;
  shape: ConveyorItemShape;
  positionMm: number; // Position along conveyor axis (0 mm is entrance, 1000 mm is end)
  lateralOffsetMm: number; // Offset from centerline (-50 to +50 mm)
  status: 'on_belt' | 'diverted' | 'passed_end' | 'sorted';
  assignedBin?: 'Bin A' | 'Bin B' | 'Bin C' | 'Reject';
}

export interface SortRule {
  id: string;
  color: ConveyorItemColor | 'all';
  shape: ConveyorItemShape | 'all';
  targetBin: 'Bin A' | 'Bin B' | 'Bin C';
  active: boolean;
}

export interface ConveyorMetrics {
  totalSpawned: number;
  totalProcessed: number;
  correctlySorted: number;
  incorrectlySorted: number;
  remainingOnBelt: number;
}

export interface ConveyorState {
  isRunning: boolean;
  speedMmPerSec: number;
  opticalSensorTriggered: boolean;
  sensorDetectedItem: ConveyorItem | null;
  pusherState: 'retracted' | 'extending' | 'extended' | 'retracting';
  pusherExtensionPercent: number;
}
