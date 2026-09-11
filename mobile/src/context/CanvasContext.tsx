import React, { createContext, useContext, useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { Platform } from 'react-native';
import { Rect } from '../utils/geometryUtils';
import { useTaskStore } from '../store/useTaskStore';

interface CanvasContextType {
  canvasRef: React.RefObject<any>;
  registerCard: (taskId: string, node: any) => void;
  unregisterCard: (taskId: string) => void;
  recomputeLayouts: () => void;
  cardLayouts: Record<string, Rect>;
}

const CanvasContext = createContext<CanvasContextType | null>(null);

export const useCanvasContext = () => {
  const ctx = useContext(CanvasContext);
  return ctx;
};

export const CanvasProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const canvasRef = useRef<any>(null);
  const registeredNodes = useRef<Record<string, any>>({});
  const cardLayoutsRef = useRef<Record<string, Rect>>({});
  const [cardLayouts, setCardLayouts] = useState<Record<string, Rect>>({});

  const tasks = useTaskStore((state) => state.tasks);
  const connections = useTaskStore((state) => state.connections);
  const rafId = useRef<number | null>(null);

  const recomputeLayouts = useCallback(() => {
    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
    }

    rafId.current = requestAnimationFrame(() => {
      if (!canvasRef.current) return;

      if (Platform.OS === 'web') {
        const canvasEl = canvasRef.current;
        if (!canvasEl.getBoundingClientRect) return;
        const cBox = canvasEl.getBoundingClientRect();

        const newLayouts: Record<string, Rect> = {};
        let changed = false;

        const currentKeys = Object.keys(registeredNodes.current);

        for (const taskId of currentKeys) {
          const node = registeredNodes.current[taskId];
          if (node && node.getBoundingClientRect) {
            const tBox = node.getBoundingClientRect();
            // Round to whole integers to prevent decimal float jitter during zoom
            const rect: Rect = {
              x: Math.round(tBox.left - cBox.left),
              y: Math.round(tBox.top - cBox.top),
              width: Math.round(tBox.width),
              height: Math.round(tBox.height),
            };
            newLayouts[taskId] = rect;

            const old = cardLayoutsRef.current[taskId];
            if (
              !old ||
              Math.abs(old.x - rect.x) >= 2 ||
              Math.abs(old.y - rect.y) >= 2 ||
              Math.abs(old.width - rect.width) >= 2 ||
              Math.abs(old.height - rect.height) >= 2
            ) {
              changed = true;
            }
          }
        }

        if (changed || Object.keys(newLayouts).length !== Object.keys(cardLayoutsRef.current).length) {
          cardLayoutsRef.current = newLayouts;
          setCardLayouts(newLayouts);
        }
      }
    });
  }, []);

  const registerCard = useCallback((taskId: string, node: any) => {
    if (node) {
      registeredNodes.current[taskId] = node;
      recomputeLayouts();
    }
  }, [recomputeLayouts]);

  const unregisterCard = useCallback((taskId: string) => {
    delete registeredNodes.current[taskId];
    if (cardLayoutsRef.current[taskId]) {
      const next = { ...cardLayoutsRef.current };
      delete next[taskId];
      cardLayoutsRef.current = next;
      setCardLayouts(next);
    }
  }, []);

  // Recompute when tasks or connections change
  useEffect(() => {
    const timer = setTimeout(() => {
      recomputeLayouts();
    }, 40);
    return () => clearTimeout(timer);
  }, [tasks, connections, recomputeLayouts]);

  // Window resize and scroll handler for web
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleResize = () => {
        recomputeLayouts();
      };
      window.addEventListener('resize', handleResize, { passive: true });
      window.addEventListener('scroll', handleResize, { passive: true, capture: true });
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleResize, true);
        if (rafId.current) cancelAnimationFrame(rafId.current);
      };
    }
  }, [recomputeLayouts]);

  const contextValue = useMemo(
    () => ({
      canvasRef,
      registerCard,
      unregisterCard,
      recomputeLayouts,
      cardLayouts,
    }),
    [registerCard, unregisterCard, recomputeLayouts, cardLayouts]
  );

  return (
    <CanvasContext.Provider value={contextValue}>
      {children}
    </CanvasContext.Provider>
  );
};
