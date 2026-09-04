import { useState, useEffect, useRef, useCallback } from 'react';

interface UseTimerReturn {
  elapsed: number;
  remaining: number;
  isRunning: boolean;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

export function useTimer(durationSeconds: number, onComplete: () => void): UseTimerReturn {
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const stop = useCallback(() => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    if (isRunning) return;
    setIsRunning(true);
    intervalRef.current = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        if (next >= durationSeconds) {
          stop();
          onCompleteRef.current();
          return durationSeconds;
        }
        return next;
      });
    }, 1000);
  }, [isRunning, durationSeconds, stop]);

  const reset = useCallback(() => {
    stop();
    setElapsed(0);
  }, [stop]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return {
    elapsed,
    remaining: Math.max(0, durationSeconds - elapsed),
    isRunning,
    start,
    stop,
    reset,
  };
}
