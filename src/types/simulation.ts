export type LabMode =
  | 'jogging'
  | 'pick_place'
  | 'conveyor'
  | 'programming'
  | 'curriculum';

export interface EventLogItem {
  id: string;
  timestamp: string;
  category: 'motion' | 'sensor' | 'task' | 'system';
  message: string;
  level: 'info' | 'warn' | 'error' | 'success';
}

export interface SimulationSettings {
  speedMultiplier: number;
  showFloorGrid: boolean;
  showCoordinateAxes: boolean;
  showWorkspaceEnvelope: boolean;
  audioFeedback: boolean;
  autoLoopTasks: boolean;
}
