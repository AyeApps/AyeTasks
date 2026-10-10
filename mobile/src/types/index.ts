export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'blocked';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type ConnectionType = 'dependency' | 'flow' | 'related';
export type TimerMode = 'stopwatch' | 'pomodoro';
export type TaskType = 'task' | 'event';

export interface Task {
  id: string;
  title: string;
  description?: string;
  notes?: string; // Markdown notes / scratchpad content
  date: string; // YYYY-MM-DD (workflow column date / event date)
  dueDate?: string; // YYYY-MM-DD (optional delivery deadline date)
  dueTime?: string; // HH:MM
  taskType?: TaskType; // 'task' | 'event'
  startTime?: string; // HH:MM (for events)
  endTime?: string; // HH:MM (for events)
  location?: string; // Venue / location of the event
  estimatedDurationMinutes: number; // e.g. 30, 60, 90, 4608
  actualDurationSeconds: number; // Accumulated from timer sessions
  status: TaskStatus;
  priority: TaskPriority;
  colorTag: string; // Hex color code
  positionIndex: number;
  parentTaskId?: string;
  createdAt: string;
  updatedAt: string;
  comments?: string[];
}

export interface TaskConnection {
  id: string;
  fromTaskId: string;
  toTaskId: string;
  type: ConnectionType;
  label?: string;
  createdAt: string;
}

export interface TimeEntry {
  id: string;
  taskId: string;
  startTime: string; // ISO String
  endTime?: string; // ISO String
  durationSeconds: number;
  mode: TimerMode;
  notes?: string;
  isActive: boolean;
}

export interface Reminder {
  id: string;
  taskId: string;
  triggerAt: string; // ISO String
  minutesBefore: number;
  status: 'pending' | 'sent' | 'dismissed';
}

export interface User {
  id: string;
  email: string;
  name: string;
  timezone: string;
  pomodoroSettings: {
    workMinutes: number;
    shortBreakMinutes: number;
    longBreakMinutes: number;
    sessionsBeforeLongBreak: number;
    autoStartBreaks: boolean;
    autoStartPomodoros: boolean;
  };
  canvasPreferences: {
    showCompletedTasks: boolean;
    showMinimap: boolean;
    snapToGrid: boolean;
    theme: 'dark' | 'light';
    defaultView: 'week' | 'focus';
  };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface ImportDryRunResponse {
  dry_run: true;
  summary: {
    tasks: number;
    events: number;
    connections: number;
    date_from: string;
    date_to: string;
  };
}

export interface ImportRealResponse {
  import_id: string;
  tasks: { id: string; [key: string]: any }[];
  connections: { id: string; [key: string]: any }[];
  refs: Record<string, string>;
}

export interface ImportErrorDetail {
  path: string;
  message: string;
}
