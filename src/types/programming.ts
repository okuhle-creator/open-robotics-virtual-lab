export type CommandType =
  | 'MOVE_TO'
  | 'MOVE_JOINT'
  | 'GRIPPER'
  | 'WAIT'
  | 'PICK'
  | 'PLACE'
  | 'SET_SPEED'
  | 'HOME';

export interface ProgramCommand {
  id: string;
  type: CommandType;
  params: Record<string, any>;
  lineNumber?: number;
  rawText?: string;
}

export interface ExecutionLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
  commandIndex?: number;
}

export interface ProgramExecutionState {
  status: 'idle' | 'running' | 'paused' | 'completed' | 'error';
  currentStepIndex: number;
  totalSteps: number;
  executionSpeedMs: number;
  logs: ExecutionLog[];
  errorMessage?: string;
}
