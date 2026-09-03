import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';
import { authStorage } from '../services/authStorage';
import { useAuthStore, registerSessionPurgeHandler, registerAuthSuccessHandler } from './useAuthStore';
import { useUIStore } from './useUIStore';
import { Task, TaskConnection, TaskStatus } from '../types';
import { getWeekDays } from '../utils/dateUtils';

const getStorageKeys = (userId?: string | null) => {
  const prefix = userId ? `@ayetasks_user_${userId}` : '@ayetasks_guest';
  return {
    tasksKey: `${prefix}_tasks`,
    connsKey: `${prefix}_connections`,
  };
};

interface TaskStore {
  tasks: Task[];
  connections: TaskConnection[];
  isLoading: boolean;
  error: string | null;

  loadTasksAndConnections: (dateFrom?: string, dateTo?: string) => Promise<void>;
  createTask: (taskData: Partial<Task>) => Promise<Task>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskStatus: (id: string) => Promise<void>;

  createConnection: (fromTaskId: string, toTaskId: string, type?: 'flow' | 'dependency') => Promise<void>;
  deleteConnection: (id: string) => Promise<void>;
  syncPendingMutations: () => Promise<void>;
  getPendingCount: () => number;
  clearLocalCache: (userId?: string | null) => Promise<void>;

  // Realtime WS handlers
  handleRealtimeTaskCreated: (task: Task) => void;
  handleRealtimeTaskUpdated: (task: Partial<Task> & { id: string }) => void;
  handleRealtimeTaskDeleted: (taskId: string) => void;
  handleRealtimeConnectionCreated: (conn: TaskConnection) => void;
  handleRealtimeConnectionDeleted: (connId: string) => void;
}

export const useTaskStore = create<TaskStore>((set, get) => {
  const getPendingCount = () => {
    return (
      get().tasks.filter((t) => t.id.startsWith('task-')).length +
      get().connections.filter((c) => c.id.startsWith('conn-')).length
    );
  };

  return {
    tasks: [],
    connections: [],
    isLoading: false,
    error: null,

    getPendingCount,

    clearLocalCache: async (userId?: string | null) => {
      const { tasksKey, connsKey } = getStorageKeys(userId);
      try {
        await Promise.all([
          AsyncStorage.removeItem(tasksKey),
          AsyncStorage.removeItem(connsKey),
          AsyncStorage.removeItem('@ayetasks_local_tasks'),
          AsyncStorage.removeItem('@ayetasks_local_connections'),
        ]);
      } catch {}
      set({ tasks: [], connections: [], isLoading: false, error: null });
    },

    syncPendingMutations: async () => {
      let token = await authStorage.getAccessToken();
      if (!token) {
        await useAuthStore.getState().initAuth();
        token = await authStorage.getAccessToken();
      }
      if (!token) {
        useUIStore.getState().setSyncStatus('offline');
        return;
      }

      const activeUserId = useAuthStore.getState().user?.id;
      const { tasksKey, connsKey } = getStorageKeys(activeUserId);

      useUIStore.getState().setSyncStatus('syncing', getPendingCount());

      try {
        const pendingTasks = get().tasks.filter((t) => t.id.startsWith('task-'));
        const pendingConns = get().connections.filter((c) => c.id.startsWith('conn-'));

        // 1. Sync pending local tasks to MongoDB
        for (const t of pendingTasks) {
          try {
            const created = await api.createTask({
              title: t.title,
              description: t.description,
              notes: t.notes,
              date: t.date,
              due_date: t.dueDate,
              due_time: t.dueTime,
              task_type: t.taskType,
              start_time: t.startTime,
              end_time: t.endTime,
              location: t.location,
              estimated_duration_minutes: t.estimatedDurationMinutes,
              priority: t.priority,
              color_tag: t.colorTag,
              position_index: t.positionIndex,
              parent_task_id: t.parentTaskId && !t.parentTaskId.startsWith('task-') ? t.parentTaskId : undefined,
            });

            set((curr) => {
              const syncTasks = curr.tasks.map((item) =>
                item.id === t.id
                  ? { ...item, id: created.id, createdAt: created.created_at, updatedAt: created.updated_at }
                  : item
              );
              const syncConns = curr.connections.map((c) =>
                c.toTaskId === t.id
                  ? { ...c, toTaskId: created.id }
                  : c.fromTaskId === t.id
                  ? { ...c, fromTaskId: created.id }
                  : c
              );
              AsyncStorage.setItem(tasksKey, JSON.stringify(syncTasks));
              AsyncStorage.setItem(connsKey, JSON.stringify(syncConns));
              return { tasks: syncTasks, connections: syncConns };
            });
          } catch (e) {
            console.warn('Failed to sync pending task:', e);
          }
        }

        // 2. Sync pending local connections
        const currentConns = get().connections.filter((c) => c.id.startsWith('conn-'));
        for (const c of currentConns) {
          if (!c.fromTaskId.startsWith('task-') && !c.toTaskId.startsWith('task-')) {
            try {
              const created = await api.createConnection({
                from_task_id: c.fromTaskId,
                to_task_id: c.toTaskId,
                type: c.type,
              });
              set((curr) => {
                const syncConns = curr.connections.map((item) =>
                  item.id === c.id ? { ...item, id: created.id } : item
                );
                AsyncStorage.setItem(connsKey, JSON.stringify(syncConns));
                return { connections: syncConns };
              });
            } catch (e) {
              console.warn('Failed to sync pending connection:', e);
            }
          }
        }

        // 3. Pull latest remote data from MongoDB for current reference week
        const refDate = useUIStore.getState().currentReferenceDate;
        const weekDays = getWeekDays(refDate);
        const monday = weekDays[0]?.dateString;
        const sunday = weekDays[6]?.dateString;

        if (monday && sunday) {
          await get().loadTasksAndConnections(monday, sunday);
        }

        const remaining = getPendingCount();
        if (remaining === 0) {
          useUIStore.getState().setSyncStatus('synced', 0);
        } else {
          useUIStore.getState().setSyncStatus('pending', remaining);
        }

        useUIStore.getState().showToast(
          'Base de datos y conexiones sincronizadas',
          'success',
          '// SINCRONIZACIÓN EXITOSA',
          3500
        );
      } catch (err) {
        console.warn('Error during syncPendingMutations:', err);
        useUIStore.getState().setSyncStatus('pending', getPendingCount());
        useUIStore.getState().showToast(
          'Fallo al conectar con el servidor',
          'error',
          '// ERROR DE SINCRONIZACIÓN',
          4000
        );
      }
    },

    loadTasksAndConnections: async (dateFrom, dateTo) => {
      set({ isLoading: true, error: null });

      const currentUserId = useAuthStore.getState().user?.id;
      const { tasksKey, connsKey } = getStorageKeys(currentUserId);

      // 1. Always load from offline cache for current user first
      try {
        const cachedTasks = await AsyncStorage.getItem(tasksKey);
        const cachedConns = await AsyncStorage.getItem(connsKey);
        if (cachedTasks) {
          set({
            tasks: JSON.parse(cachedTasks),
            connections: cachedConns ? JSON.parse(cachedConns) : [],
          });
        }
      } catch {}

      // 2. Ensure auth token is initialized
      let token = await authStorage.getAccessToken();
      if (!token) {
        await useAuthStore.getState().initAuth();
        token = await authStorage.getAccessToken();
      }

      // 3. If token exists, fetch fresh data from Mongo
      if (token) {
        try {
          useUIStore.getState().setSyncStatus('syncing');
          const [remoteTasks, remoteConns] = await Promise.all([
            api.getTasks(dateFrom, dateTo),
            api.getConnections(),
          ]);

          const mappedTasks: Task[] = remoteTasks.map((t: any) => ({
            id: t.id,
            title: t.title,
            description: t.description,
            notes: t.notes,
            date: t.date,
            dueDate: t.due_date,
            dueTime: t.due_time,
            taskType: t.task_type || 'task',
            startTime: t.start_time,
            endTime: t.end_time,
            location: t.location,
            estimatedDurationMinutes: t.estimated_duration_minutes || 30,
            actualDurationSeconds: t.actual_duration_seconds || 0,
            status: t.status,
            priority: t.priority,
            colorTag: t.color_tag || '#00c853',
            positionIndex: t.position_index || 0,
            parentTaskId: t.parent_task_id,
            createdAt: t.created_at,
            updatedAt: t.updated_at,
          }));

          const mappedConns: TaskConnection[] = remoteConns.map((c: any) => ({
            id: c.id,
            fromTaskId: c.from_task_id,
            toTaskId: c.to_task_id,
            type: c.type,
            label: c.label,
            createdAt: c.created_at,
          }));

          // Preserve any un-synced local drafts for THIS user
          const unSyncedTasks = get().tasks.filter((t) => t.id.startsWith('task-'));
          const unSyncedConns = get().connections.filter((c) => c.id.startsWith('conn-'));

          const mergedTasks = [...mappedTasks, ...unSyncedTasks];
          const mergedConns = [...mappedConns, ...unSyncedConns];

          set({ tasks: mergedTasks, connections: mergedConns, isLoading: false });

          const activeKeys = getStorageKeys(useAuthStore.getState().user?.id);
          await AsyncStorage.setItem(activeKeys.tasksKey, JSON.stringify(mergedTasks));
          await AsyncStorage.setItem(activeKeys.connsKey, JSON.stringify(mergedConns));

          if (unSyncedTasks.length > 0 || unSyncedConns.length > 0) {
            get().syncPendingMutations();
          } else {
            useUIStore.getState().setSyncStatus('synced', 0);
          }
          return;
        } catch (err: any) {
          console.log('Error loading tasks from Mongo API:', err);
          useUIStore.getState().setSyncStatus('offline');
        }
      }

      set({ isLoading: false });
    },

    createTask: async (taskData) => {
      const activeUserId = useAuthStore.getState().user?.id;
      const { tasksKey, connsKey } = getStorageKeys(activeUserId);

      const tempId = `task-${Date.now()}`;
      const newTask: Task = {
        id: tempId,
        title: taskData.title || 'Nueva Tarea',
        description: taskData.description,
        notes: taskData.notes,
        date: taskData.date || new Date().toISOString().split('T')[0],
        dueDate: taskData.dueDate,
        dueTime: taskData.dueTime,
        taskType: taskData.taskType || 'task',
        startTime: taskData.startTime,
        endTime: taskData.endTime,
        location: taskData.location,
        estimatedDurationMinutes: taskData.estimatedDurationMinutes || 30,
        actualDurationSeconds: 0,
        status: 'todo',
        priority: taskData.priority || 'medium',
        colorTag: taskData.colorTag || '#00c853',
        positionIndex: get().tasks.filter((t) => t.date === taskData.date).length,
        parentTaskId: taskData.parentTaskId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // 1. Immediately insert locally and save to user-scoped AsyncStorage
      const updatedTasks = [...get().tasks, newTask];
      set({ tasks: updatedTasks });
      await AsyncStorage.setItem(tasksKey, JSON.stringify(updatedTasks));

      useUIStore.getState().showToast(
        newTask.taskType === 'event'
          ? `Evento "${newTask.title}" programado correctamente`
          : `Tarea "${newTask.title}" creada en el tablero`,
        'success',
        newTask.taskType === 'event' ? '// EVENTO AGENDADO' : '// TAREA CREADA'
      );

      // If it has a parent task, create connection immediately
      if (taskData.parentTaskId) {
        const newConn: TaskConnection = {
          id: `conn-${Date.now()}`,
          fromTaskId: taskData.parentTaskId,
          toTaskId: tempId,
          type: 'flow',
          createdAt: new Date().toISOString(),
        };
        const updatedConns = [...get().connections, newConn];
        set({ connections: updatedConns });
        await AsyncStorage.setItem(connsKey, JSON.stringify(updatedConns));
      }

      useUIStore.getState().setSyncStatus('syncing');

      // 2. Ensure auth token is present
      let token = await authStorage.getAccessToken();
      if (!token) {
        await useAuthStore.getState().initAuth();
        token = await authStorage.getAccessToken();
      }

      // 3. Write directly to MongoDB via Backend API
      if (token) {
        try {
          const created = await api.createTask({
            title: newTask.title,
            description: newTask.description,
            notes: newTask.notes,
            date: newTask.date,
            due_date: newTask.dueDate,
            due_time: newTask.dueTime,
            task_type: newTask.taskType,
            start_time: newTask.startTime,
            end_time: newTask.endTime,
            location: newTask.location,
            estimated_duration_minutes: newTask.estimatedDurationMinutes,
            priority: newTask.priority,
            color_tag: newTask.colorTag,
            position_index: newTask.positionIndex,
            parent_task_id: newTask.parentTaskId,
          });

          const serverTask: Task = {
            ...newTask,
            id: created.id,
            createdAt: created.created_at,
            updatedAt: created.updated_at,
          };

          set((state) => {
            const syncTasks = state.tasks.map((t) => (t.id === tempId ? serverTask : t));
            const syncConns = state.connections.map((c) =>
              c.toTaskId === tempId ? { ...c, toTaskId: created.id } : c
            );
            const currentKeys = getStorageKeys(useAuthStore.getState().user?.id);
            AsyncStorage.setItem(currentKeys.tasksKey, JSON.stringify(syncTasks));
            AsyncStorage.setItem(currentKeys.connsKey, JSON.stringify(syncConns));
            return { tasks: syncTasks, connections: syncConns };
          });

          const pending = getPendingCount();
          useUIStore.getState().setSyncStatus(pending === 0 ? 'synced' : 'pending', pending);
          return serverTask;
        } catch (err) {
          console.warn('Could not persist task to MongoDB:', err);
          useUIStore.getState().setSyncStatus('pending', getPendingCount());
          useUIStore.getState().showToast(
            'Guardado en almacenamiento local (modo offline activo)',
            'warning',
            '// SINCRONIZACIÓN PENDIENTE'
          );
        }
      } else {
        useUIStore.getState().setSyncStatus('pending', getPendingCount());
      }

      return newTask;
    },

    updateTask: async (id, updates) => {
      const activeUserId = useAuthStore.getState().user?.id;
      const { tasksKey } = getStorageKeys(activeUserId);

      const updatedTasks = get().tasks.map((t) =>
        t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
      );
      set({ tasks: updatedTasks });
      await AsyncStorage.setItem(tasksKey, JSON.stringify(updatedTasks));

      useUIStore.getState().setSyncStatus('syncing');

      try {
        let token = await authStorage.getAccessToken();
        if (!token) {
          await useAuthStore.getState().initAuth();
          token = await authStorage.getAccessToken();
        }
        if (token && !id.startsWith('task-')) {
          await api.updateTask(id, {
            title: updates.title,
            description: updates.description,
            notes: updates.notes,
            date: updates.date,
            due_date: updates.dueDate,
            due_time: updates.dueTime,
            task_type: updates.taskType,
            start_time: updates.startTime,
            end_time: updates.endTime,
            location: updates.location,
            estimated_duration_minutes: updates.estimatedDurationMinutes,
            actual_duration_seconds: updates.actualDurationSeconds,
            status: updates.status,
            priority: updates.priority,
            color_tag: updates.colorTag,
            position_index: updates.positionIndex,
          });
          const pending = getPendingCount();
          useUIStore.getState().setSyncStatus(pending === 0 ? 'synced' : 'pending', pending);
        } else {
          useUIStore.getState().setSyncStatus('pending', getPendingCount());
        }
      } catch (err) {
        console.warn('Could not update task in MongoDB:', err);
        useUIStore.getState().setSyncStatus('pending', getPendingCount());
      }
    },

    deleteTask: async (id) => {
      const activeUserId = useAuthStore.getState().user?.id;
      const { tasksKey, connsKey } = getStorageKeys(activeUserId);

      const taskToRestore = get().tasks.find((t) => t.id === id);
      const connsToRestore = get().connections.filter(
        (c) => c.fromTaskId === id || c.toTaskId === id
      );

      // Optimistically remove from local state immediately
      const updatedTasks = get().tasks.filter((t) => t.id !== id);
      const updatedConns = get().connections.filter(
        (c) => c.fromTaskId !== id && c.toTaskId !== id
      );
      set({ tasks: updatedTasks, connections: updatedConns });
      await AsyncStorage.setItem(tasksKey, JSON.stringify(updatedTasks));
      await AsyncStorage.setItem(connsKey, JSON.stringify(updatedConns));

      let isCancelled = false;

      const deleteTimer = setTimeout(async () => {
        if (isCancelled) return;
        useUIStore.getState().setSyncStatus('syncing');
        try {
          let token = await authStorage.getAccessToken();
          if (token && !id.startsWith('task-')) {
            await api.deleteTask(id);
            const pending = getPendingCount();
            useUIStore.getState().setSyncStatus(pending === 0 ? 'synced' : 'pending', pending);
          } else {
            const pending = getPendingCount();
            useUIStore.getState().setSyncStatus(pending === 0 ? 'synced' : 'pending', pending);
          }
        } catch (err) {
          console.warn('Could not delete task in MongoDB:', err);
          useUIStore.getState().setSyncStatus('pending', getPendingCount());
        }
      }, 7500);

      const handleUndo = async () => {
        isCancelled = true;
        clearTimeout(deleteTimer);
        if (!taskToRestore) return;

        const restoredTasks = [...get().tasks, taskToRestore];
        const restoredConns = [...get().connections, ...connsToRestore];
        set({ tasks: restoredTasks, connections: restoredConns });

        const currentKeys = getStorageKeys(useAuthStore.getState().user?.id);
        await AsyncStorage.setItem(currentKeys.tasksKey, JSON.stringify(restoredTasks));
        await AsyncStorage.setItem(currentKeys.connsKey, JSON.stringify(restoredConns));

        useUIStore.getState().showToast(
          `Tarea "${taskToRestore.title}" restaurada al tablero`,
          'success',
          '// ACCIÓN REVERTIDA',
          3500
        );
      };

      useUIStore.getState().showToast(
        taskToRestore ? `Tarea "${taskToRestore.title}" eliminada` : 'Nodo eliminado del sistema',
        'delete',
        '// NODO ELIMINADO',
        7500,
        {
          label: 'REVERTIR',
          onPress: handleUndo,
        },
        {
          backgroundColor: '#050507',
          borderColor: '#27272a',
          titleColor: '#ef4444',
          iconBg: '#18181b',
          iconColor: '#ef4444',
          progressColor: '#ef4444',
        }
      );
    },

    toggleTaskStatus: async (id) => {
      const task = get().tasks.find((t) => t.id === id);
      if (!task) return;

      const nextStatus: TaskStatus = task.status === 'completed' ? 'todo' : 'completed';
      await get().updateTask(id, { status: nextStatus });
      useUIStore.getState().showToast(
        nextStatus === 'completed' ? 'Nodo marcado como completado' : 'Nodo reactivado en la secuencia',
        nextStatus === 'completed' ? 'success' : 'info',
        nextStatus === 'completed' ? '// NODO COMPLETADO' : '// NODO REACTIVADO'
      );
    },

    createConnection: async (fromTaskId, toTaskId, type = 'flow') => {
      // Avoid self connections or duplicates
      if (fromTaskId === toTaskId) return;
      const exists = get().connections.some(
        (c) => c.fromTaskId === fromTaskId && c.toTaskId === toTaskId
      );
      if (exists) return;

      const activeUserId = useAuthStore.getState().user?.id;
      const { connsKey } = getStorageKeys(activeUserId);

      const tempId = `conn-${Date.now()}`;
      const newConn: TaskConnection = {
        id: tempId,
        fromTaskId,
        toTaskId,
        type,
        createdAt: new Date().toISOString(),
      };

      const updatedConns = [...get().connections, newConn];
      set({ connections: updatedConns });
      await AsyncStorage.setItem(connsKey, JSON.stringify(updatedConns));

      useUIStore.getState().showToast('Conexión establecida entre los nodos', 'success', '// CIRCUITO ENLAZADO');

      useUIStore.getState().setSyncStatus('syncing');

      try {
        let token = await authStorage.getAccessToken();
        if (!token) {
          await useAuthStore.getState().initAuth();
          token = await authStorage.getAccessToken();
        }
        if (token && !fromTaskId.startsWith('task-') && !toTaskId.startsWith('task-')) {
          const created = await api.createConnection({
            from_task_id: fromTaskId,
            to_task_id: toTaskId,
            type,
          });
          set((state) => ({
            connections: state.connections.map((c) => (c.id === tempId ? { ...c, id: created.id } : c)),
          }));
          const pending = getPendingCount();
          useUIStore.getState().setSyncStatus(pending === 0 ? 'synced' : 'pending', pending);
        } else {
          useUIStore.getState().setSyncStatus('pending', getPendingCount());
        }
      } catch (err) {
        console.warn('Could not sync connection to MongoDB:', err);
        useUIStore.getState().setSyncStatus('pending', getPendingCount());
      }
    },

    deleteConnection: async (id) => {
      const activeUserId = useAuthStore.getState().user?.id;
      const { connsKey } = getStorageKeys(activeUserId);

      const updatedConns = get().connections.filter((c) => c.id !== id);
      set({ connections: updatedConns });
      await AsyncStorage.setItem(connsKey, JSON.stringify(updatedConns));

      useUIStore.getState().showToast('Conexión eliminada de la secuencia', 'info', '// CIRCUITO DESCONECTADO');

      useUIStore.getState().setSyncStatus('syncing');

      try {
        let token = await authStorage.getAccessToken();
        if (token && !id.startsWith('conn-')) {
          await api.deleteConnection(id);
        }
        const pending = getPendingCount();
        useUIStore.getState().setSyncStatus(pending === 0 ? 'synced' : 'pending', pending);
      } catch (err) {
        console.warn('Could not delete connection in MongoDB:', err);
        useUIStore.getState().setSyncStatus('pending', getPendingCount());
      }
    },

    handleRealtimeTaskCreated: (task) => {
      const activeUserId = useAuthStore.getState().user?.id;
      const { tasksKey } = getStorageKeys(activeUserId);

      const exists = get().tasks.some((t) => t.id === task.id);
      if (!exists) {
        const updated = [...get().tasks, task];
        set({ tasks: updated });
        AsyncStorage.setItem(tasksKey, JSON.stringify(updated));
      }
    },

    handleRealtimeTaskUpdated: (taskUpdates) => {
      const activeUserId = useAuthStore.getState().user?.id;
      const { tasksKey } = getStorageKeys(activeUserId);

      const updated = get().tasks.map((t) => (t.id === taskUpdates.id ? { ...t, ...taskUpdates } : t));
      set({ tasks: updated });
      AsyncStorage.setItem(tasksKey, JSON.stringify(updated));
    },

    handleRealtimeTaskDeleted: (taskId) => {
      const activeUserId = useAuthStore.getState().user?.id;
      const { tasksKey, connsKey } = getStorageKeys(activeUserId);

      const updatedTasks = get().tasks.filter((t) => t.id !== taskId);
      const updatedConns = get().connections.filter(
        (c) => c.fromTaskId !== taskId && c.toTaskId !== taskId
      );
      set({ tasks: updatedTasks, connections: updatedConns });
      AsyncStorage.setItem(tasksKey, JSON.stringify(updatedTasks));
      AsyncStorage.setItem(connsKey, JSON.stringify(updatedConns));
    },

    handleRealtimeConnectionCreated: (conn) => {
      const activeUserId = useAuthStore.getState().user?.id;
      const { connsKey } = getStorageKeys(activeUserId);

      const exists = get().connections.some((c) => c.id === conn.id);
      if (!exists) {
        const updated = [...get().connections, conn];
        set({ connections: updated });
        AsyncStorage.setItem(connsKey, JSON.stringify(updated));
      }
    },

    handleRealtimeConnectionDeleted: (connId) => {
      const activeUserId = useAuthStore.getState().user?.id;
      const { connsKey } = getStorageKeys(activeUserId);

      const updated = get().connections.filter((c) => c.id !== connId);
      set({ connections: updated });
      AsyncStorage.setItem(connsKey, JSON.stringify(updated));
    },
  };
});

registerSessionPurgeHandler(async (userId) => {
  await useTaskStore.getState().clearLocalCache(userId);
});

registerAuthSuccessHandler(async () => {
  await useTaskStore.getState().loadTasksAndConnections();
});

