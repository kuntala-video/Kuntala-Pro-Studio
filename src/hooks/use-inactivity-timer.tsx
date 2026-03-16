'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseInactivityTimerProps {
  onIdle: () => void;
  idleTime: number; // in minutes
  warningTime: number; // in minutes before idle
}

export const useInactivityTimer = ({ onIdle, idleTime, warningTime }: UseInactivityTimerProps) => {
  const [isWarningVisible, setWarningVisible] = useState(false);
  
  const idleTimeoutMs = idleTime * 60 * 1000;
  const warningTimeoutMs = (idleTime - warningTime) * 60 * 1000;

  const idleTimer = useRef<NodeJS.Timeout>();
  const warningTimer = useRef<NodeJS.Timeout>();
  
  const clearTimers = () => {
    if (warningTimer.current) clearTimeout(warningTimer.current);
    if (idleTimer.current) clearTimeout(idleTimer.current);
  };

  const startTimers = useCallback(() => {
    // Ensure warning time is not negative
    if (warningTimeoutMs > 0) {
      warningTimer.current = setTimeout(() => {
        setWarningVisible(true);
      }, warningTimeoutMs);
    } else {
       // If no warning time, show dialog immediately at idle time
       warningTimer.current = setTimeout(() => {
        setWarningVisible(true);
      }, idleTimeoutMs);
    }

    idleTimer.current = setTimeout(() => {
      onIdle();
    }, idleTimeoutMs);
  }, [idleTimeoutMs, warningTimeoutMs, onIdle]);

  const resetTimers = useCallback(() => {
    setWarningVisible(false);
    clearTimers();
    startTimers();
  }, [startTimers]);

  const extendSession = () => {
    resetTimers();
  };

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];
    const handleActivity = () => resetTimers();

    events.forEach((event) => window.addEventListener(event, handleActivity));
    startTimers();

    return () => {
      clearTimers();
      events.forEach((event) => window.removeEventListener(event, handleActivity));
    };
  }, [resetTimers, startTimers]);

  return { isWarningVisible, extendSession };
};
