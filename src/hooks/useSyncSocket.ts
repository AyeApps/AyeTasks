import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { authStorage } from '../services/authStorage';
import { useAuthStore } from '../store/useAuthStore';
import { useTaskStore } from '../store/useTaskStore';
import { useTimerStore } from '../store/useTimerStore';
import { useUIStore } from '../store/useUIStore';

export function getWsBaseUrl(): string {
  let url = process.env.EXPO_PUBLIC_WS_URL || 'wss://api-aytsks.ayeapps.com/api/v1/ws/sync';
  if (Platform.OS === 'android' && url.includes('localhost')) {
    url = url.replace('localhost', '10.0.2.2').replace('127.0.0.1', '10.0.2.2');
  }
  return url;
}

export function useSyncSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const pingIntervalRef = useRef<any>(null);

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const userId = useAuthStore((state) => state.user?.id);

  const setBackendStatus = useUIStore((state) => state.setBackendStatus);
  const setSyncStatus = useUIStore((state) => state.setSyncStatus);

  useEffect(() => {
    let isMounted = true;

    // Helper to cleanly close active socket and clear keep-alive intervals
    function cleanupSocket() {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (wsRef.current) {
        try {
          wsRef.current.onclose = null;
          wsRef.current.onerror = null;
          wsRef.current.onmessage = null;
          wsRef.current.close();
        } catch {}
        wsRef.current = null;
      }
    }

    if (!isAuthenticated || !userId) {
      cleanupSocket();
      setBackendStatus('offline');
      return;
    }

    async function connect() {
      if (!isMounted) return;

      cleanupSocket();

      const token = await authStorage.getAccessToken();
      if (!token) {
        if (isMounted) {
          setBackendStatus('offline');
        }
        return;
      }

      const wsBase = getWsBaseUrl();
      const wsUrl = `${wsBase}?token=${encodeURIComponent(token)}`;
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isMounted) return;
          setBackendStatus('online');

          // Trigger drain of any pending mutations upon connection
          useTaskStore.getState().syncPendingMutations();

          // Heartbeat ping every 30s to keep socket alive and detect drops with zero HTTP polling
          if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send('ping');
            }
          }, 30000);
        };

        ws.onmessage = (event) => {
          if (event.data === 'pong') return;
          try {
            const msg = JSON.parse(event.data);
            const { event: eventType, data } = msg;

            switch (eventType) {
              case 'TASK_CREATED':
                useTaskStore.getState().loadTasksAndConnections();
                break;
              case 'TASK_UPDATED':
                useTaskStore.getState().handleRealtimeTaskUpdated(data);
                break;
              case 'TASK_DELETED':
                useTaskStore.getState().handleRealtimeTaskDeleted(data.id);
                break;
              case 'CONNECTION_CREATED':
                useTaskStore.getState().handleRealtimeConnectionCreated(data);
                break;
              case 'CONNECTION_DELETED':
                useTaskStore.getState().handleRealtimeConnectionDeleted(data.id);
                break;
              case 'TIMER_STARTED':
                useTimerStore.getState().syncFromRemote({
                  taskId: data.task_id,
                  startTime: data.start_time,
                  mode: data.mode,
                });
                break;
              case 'TIMER_STOPPED':
                useTimerStore.getState().resetTimer(data?.task_id);
                break;
            }
          } catch (e) {
            console.warn('WS Message parse error:', e);
          }
        };

        ws.onclose = () => {
          if (pingIntervalRef.current) {
            clearInterval(pingIntervalRef.current);
            pingIntervalRef.current = null;
          }
          if (isMounted) {
            setBackendStatus('offline');
            const pending = useTaskStore.getState().getPendingCount();
            if (pending > 0) {
              setSyncStatus('pending', pending);
            } else {
              setSyncStatus('offline');
            }
            if (!reconnectTimeoutRef.current) {
              reconnectTimeoutRef.current = setTimeout(() => {
                reconnectTimeoutRef.current = null;
                connect();
              }, 5000);
            }
          }
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch (err) {
        if (isMounted) {
          setBackendStatus('offline');
          if (!reconnectTimeoutRef.current) {
            reconnectTimeoutRef.current = setTimeout(() => {
              reconnectTimeoutRef.current = null;
              connect();
            }, 5000);
          }
        }
      }
    }

    connect();

    // Browser Online / Offline listeners to instantly sync without polling
    let handleOnline: () => void;
    let handleOffline: () => void;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      handleOnline = () => {
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
        connect();
      };
      handleOffline = () => {
        setBackendStatus('offline');
        setSyncStatus('offline');
      };
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }

    return () => {
      isMounted = false;
      cleanupSocket();
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        if (handleOnline) window.removeEventListener('online', handleOnline);
        if (handleOffline) window.removeEventListener('offline', handleOffline);
      }
    };
  }, [isAuthenticated, userId, setBackendStatus, setSyncStatus]);
}
