import { create } from 'zustand';
import { api } from '../services/api';
import { registerSessionPurgeHandler } from './useAuthStore';
import { useTaskStore } from './useTaskStore';
import { useUIStore } from './useUIStore';
import { TimerMode } from '../types';
import { parseUtcIsoTimestamp } from '../utils/dateUtils';

let masterInterval: any = null;

export type TimerUIMode = 'focus_bar' | 'background';

export interface ActiveTaskTimer {
  taskId: string;
  taskTitle: string;
  startTime: number; // Timestamp in ms when this session started
  baseAccumulatedSeconds: number; // Seconds logged prior to this session
  sessionElapsedSeconds: number; // Seconds in current session
  totalElapsedSeconds: number; // baseAccumulatedSeconds + sessionElapsedSeconds
  uiMode: TimerUIMode;
}

interface TimerStore {
  activeTimers: Record<string, ActiveTaskTimer>; // Multiple tasks can run concurrently in background!
  focusedTaskId: string | null; // Task currently displayed in the bottom Deep Focus Bar
  tickTimestamp: number; // Incremented every second to trigger react updates

  startTaskTimer: (taskId: string, taskTitle: string, uiMode?: TimerUIMode) => Promise<void>;
  stopTaskTimer: (taskId: string, notes?: string) => Promise<void>;
  completeTaskAndStop: (taskId: string) => Promise<void>;
  switchTaskUIMode: (taskId: string, uiMode: TimerUIMode) => void;
  getTaskTimer: (taskId: string) => ActiveTaskTimer | null;
  syncFromRemote: (data: { taskId: string; startTime: string; mode?: TimerMode }) => void;
  resetTimer: (taskId?: string) => void;
  resetAllTimers: () => void;
}

const ensureMasterInterval = (get: any, set: any) => {
  if (!masterInterval) {
    masterInterval = setInterval(() => {
      const { activeTimers: currentTimers } = get();
      const keys = Object.keys(currentTimers);
      if (keys.length === 0) {
        clearInterval(masterInterval);
        masterInterval = null;
        return;
      }

      const nowMs = Date.now();
      const updatedTimers: Record<string, ActiveTaskTimer> = {};

      for (const id of keys) {
        const t = currentTimers[id];
        const sessionSec = Math.max(0, Math.floor((nowMs - t.startTime) / 1000));
        updatedTimers[id] = {
          ...t,
          sessionElapsedSeconds: sessionSec,
          totalElapsedSeconds: Math.max(0, t.baseAccumulatedSeconds + sessionSec),
        };
      }

      set({
        activeTimers: updatedTimers,
        tickTimestamp: nowMs,
      });
    }, 1000);
  }
};

export const useTimerStore = create<TimerStore>((set, get) => ({
  activeTimers: {},
  focusedTaskId: null,
  tickTimestamp: Date.now(),

  startTaskTimer: async (taskId, taskTitle, uiMode = 'background') => {
    const { activeTimers } = get();
    const now = Date.now();

    // ─────────────────────────────────────────────────────────────
    // FOCUS ISOLATION RULE & AUTO-FILTER:
    // When a task enters FOCUS mode (uiMode === 'focus_bar'):
    // 1. Automatically switch filterMode to 'focused' to isolate the view.
    // 2. Pause all other running timers and toggle other in-progress tasks to 'todo'.
    // ─────────────────────────────────────────────────────────────
    if (uiMode === 'focus_bar') {
      const otherTaskIds = Object.keys(activeTimers).filter((id) => id !== taskId);

      for (const otherId of otherTaskIds) {
        const otherTimer = activeTimers[otherId];
        if (otherTimer) {
          const sessionElapsed = Math.max(0, Math.floor((now - otherTimer.startTime) / 1000));
          const finalTotal = Math.max(0, otherTimer.baseAccumulatedSeconds + sessionElapsed);
          // Persist and toggle out of in_progress to todo
          useTaskStore.getState().updateTask(otherId, {
            status: 'todo',
            actualDurationSeconds: finalTotal,
          });
          try {
            if (!otherId.startsWith('task-')) {
              api.stopTimer(otherId, 'Auto-paused due to Focus on another task');
            }
          } catch (e) {}
        }
      }

      // Revert any other non-timed tasks currently in 'in_progress' back to 'todo'
      const allTasks = useTaskStore.getState().tasks;
      for (const t of allTasks) {
        if (t.id !== taskId && t.status === 'in_progress') {
          useTaskStore.getState().updateTask(t.id, { status: 'todo' });
        }
      }
    }

    // 1. If timer is ALREADY RUNNING on THIS task:
    // Seamlessly change uiMode without resetting timer
    if (activeTimers[taskId]) {
      const existing = activeTimers[taskId];
      const nextTimers = uiMode === 'focus_bar'
        ? { [taskId]: { ...existing, uiMode } }
        : { ...activeTimers, [taskId]: { ...existing, uiMode } };

      set({
        activeTimers: nextTimers,
        focusedTaskId: uiMode === 'focus_bar' ? taskId : get().focusedTaskId === taskId ? null : get().focusedTaskId,
      });
      return;
    }

    // 2. Fetch existing accumulated time from task store for multi-day persistence
    const currentTask = useTaskStore.getState().tasks.find((t) => t.id === taskId);
    const baseLogged = Math.max(0, currentTask?.actualDurationSeconds || 0);

    const newTimer: ActiveTaskTimer = {
      taskId,
      taskTitle: taskTitle || currentTask?.title || 'Active Task',
      startTime: now,
      baseAccumulatedSeconds: baseLogged,
      sessionElapsedSeconds: 0,
      totalElapsedSeconds: baseLogged,
      uiMode,
    };

    // If starting in focus mode, only keep this task in active timers
    const nextActiveTimers = uiMode === 'focus_bar'
      ? { [taskId]: newTimer }
      : { ...activeTimers, [taskId]: newTimer };

    set({
      activeTimers: nextActiveTimers,
      focusedTaskId: uiMode === 'focus_bar' ? taskId : get().focusedTaskId,
      tickTimestamp: now,
    });

    // 3. Ensure master 1-second interval is actively ticking
    ensureMasterInterval(get, set);

    // 4. Mark focused / active task as in_progress
    useTaskStore.getState().updateTask(taskId, { status: 'in_progress' });
    useUIStore.getState().showToast(
      uiMode === 'focus_bar'
        ? `Modo Deep Focus activo para "${newTimer.taskTitle}"`
        : `Temporizador en segundo plano iniciado para "${newTimer.taskTitle}"`,
      'success',
      uiMode === 'focus_bar' ? '// DEEP FOCUS ACTIVO' : '// TEMPORIZADOR ACTIVO'
    );

    // 5. Sync to backend API
    try {
      if (!taskId.startsWith('task-')) {
        await api.startTimer(taskId);
      }
    } catch (err) {
      console.warn('Could not sync timer start to backend:', err);
    }
  },

  stopTaskTimer: async (taskId, notes) => {
    const { activeTimers, focusedTaskId } = get();
    const timer = activeTimers[taskId];

    if (!timer) return;

    const sessionElapsed = Math.max(0, Math.floor((Date.now() - timer.startTime) / 1000));
    const finalTotal = Math.max(0, timer.baseAccumulatedSeconds + sessionElapsed);

    const nextTimers = { ...activeTimers };
    delete nextTimers[taskId];

    if (Object.keys(nextTimers).length === 0 && masterInterval) {
      clearInterval(masterInterval);
      masterInterval = null;
    }

    // If stopping the focused task, return the filterMode to 'all' if it was 'focused'
    if (focusedTaskId === taskId) {
      if (useUIStore.getState().filterMode === 'focused') {
        useUIStore.getState().setFilterMode('all');
      }
    }

    set({
      activeTimers: nextTimers,
      focusedTaskId: focusedTaskId === taskId ? null : focusedTaskId,
    });

    // Persist final cumulative time to task and toggle back to todo if it was in progress
    useTaskStore.getState().updateTask(taskId, {
      actualDurationSeconds: finalTotal,
    });

    try {
      if (!taskId.startsWith('task-')) {
        await api.stopTimer(taskId, notes);
      }
    } catch (err) {
      console.warn('Could not sync timer stop to backend:', err);
    }

    useUIStore.getState().showToast(
      `Sesión registrada: ${Math.floor(finalTotal / 60)}m ${finalTotal % 60}s acumulados`,
      'info',
      '// REGISTRO DE TIEMPO'
    );
  },

  completeTaskAndStop: async (taskId) => {
    const { activeTimers, focusedTaskId } = get();
    const timer = activeTimers[taskId];
    const currentTask = useTaskStore.getState().tasks.find((t) => t.id === taskId);

    const sessionElapsed = timer ? Math.max(0, Math.floor((Date.now() - timer.startTime) / 1000)) : 0;
    const finalTotal = Math.max(0, (timer?.baseAccumulatedSeconds ?? currentTask?.actualDurationSeconds ?? 0) + sessionElapsed);

    const nextTimers = { ...activeTimers };
    delete nextTimers[taskId];

    if (Object.keys(nextTimers).length === 0 && masterInterval) {
      clearInterval(masterInterval);
      masterInterval = null;
    }

    // Revert filter from 'focused' back to 'all' on completion
    if (focusedTaskId === taskId) {
      if (useUIStore.getState().filterMode === 'focused') {
        useUIStore.getState().setFilterMode('all');
      }
    }

    set({
      activeTimers: nextTimers,
      focusedTaskId: focusedTaskId === taskId ? null : focusedTaskId,
    });

    // Mark task as completed AND store final total time taken
    await useTaskStore.getState().updateTask(taskId, {
      status: 'completed',
      actualDurationSeconds: finalTotal,
    });

    try {
      if (!taskId.startsWith('task-')) {
        await api.stopTimer(taskId, 'Task marked completed');
      }
    } catch (err) {
      console.warn('Could not sync timer complete to backend:', err);
    }
  },

  switchTaskUIMode: (taskId, uiMode) => {
    get().startTaskTimer(taskId, '', uiMode);
  },

  getTaskTimer: (taskId) => {
    return get().activeTimers[taskId] || null;
  },

  syncFromRemote: ({ taskId, startTime }) => {
    const { activeTimers, focusedTaskId } = get();

    // If this timer is already running locally and in sync, keep local high-precision start
    if (activeTimers[taskId]) {
      return;
    }

    const startMs = parseUtcIsoTimestamp(startTime);
    const currentTask = useTaskStore.getState().tasks.find((t) => t.id === taskId);
    const baseLogged = Math.max(0, currentTask?.actualDurationSeconds || 0);
    const initialSession = Math.max(0, Math.floor((Date.now() - startMs) / 1000));

    const newTimer: ActiveTaskTimer = {
      taskId,
      taskTitle: currentTask?.title || 'Active Task',
      startTime: startMs,
      baseAccumulatedSeconds: baseLogged,
      sessionElapsedSeconds: initialSession,
      totalElapsedSeconds: baseLogged + initialSession,
      uiMode: focusedTaskId === taskId ? 'focus_bar' : 'background',
    };

    set({
      activeTimers: {
        ...activeTimers,
        [taskId]: newTimer,
      },
      tickTimestamp: Date.now(),
    });

    ensureMasterInterval(get, set);
  },

  resetTimer: (taskId) => {
    if (taskId) {
      get().stopTaskTimer(taskId);
    } else {
      get().resetAllTimers();
    }
  },

  resetAllTimers: () => {
    if (masterInterval) {
      clearInterval(masterInterval);
      masterInterval = null;
    }
    set({
      activeTimers: {},
      focusedTaskId: null,
      tickTimestamp: Date.now(),
    });
  },
}));

registerSessionPurgeHandler(() => {
  useTimerStore.getState().resetAllTimers();
});

