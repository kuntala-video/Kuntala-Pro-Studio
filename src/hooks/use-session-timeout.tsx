'use client';

import { useState, useEffect, useRef } from 'react';

interface UseIdleTimerProps {
  onIdle: () => void;
  idleTime: number; // in minutes
}

export const useIdleTimer = ({ onIdle, idleTime }: UseIdleTimerProps) => {
  const [isIdle, setIsIdle] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const idleTimeout = idleTime * 60 * 1000;

  const resetTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsIdle(true);
      onIdle();
    }, idleTimeout);
  };

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];

    const handleActivity = () => {
      resetTimer();
    };

    events.forEach(event => window.addEventListener(event, handleActivity));
    resetTimer(); // Initialize timer

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      events.forEach(event => window.removeEventListener(event, handleActivity));
    };
  }, [onIdle, idleTimeout]);

  return isIdle;
};
