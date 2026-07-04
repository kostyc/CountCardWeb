'use client';

/**
 * useWalkthrough Hook
 * Manages walkthrough state, persistence, and completion tracking
 * Adapted from AIChatModel with CountCard-specific features
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { logInfo, logError } from '@/lib/utils/logger';

export type WalkthroughType = 'onboarding' | 'recruits' | 'countCards' | 'incidentAlerts' | 'profile' | null;

interface UseWalkthroughReturn {
  isActive: boolean;
  currentWalkthrough: WalkthroughType;
  startWalkthrough: (type: WalkthroughType) => void;
  stopWalkthrough: () => void;
  completeWalkthrough: () => void;
  hasCompletedWalkthrough: (type: WalkthroughType) => boolean;
  resetWalkthrough: (type: WalkthroughType) => void;
}

const STORAGE_KEY = 'countcard-completed-walkthroughs';

export const useWalkthrough = (): UseWalkthroughReturn => {
  const { user } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [currentWalkthrough, setCurrentWalkthrough] = useState<WalkthroughType>(null);

  /**
   * Get completed walkthroughs from localStorage
   */
  const getCompletedWalkthroughs = useCallback((): string[] => {
    if (typeof window === 'undefined') return [];

    try {
      const completed = localStorage.getItem(STORAGE_KEY);
      if (completed) {
        return JSON.parse(completed) as string[];
      }
    } catch (error) {
      logError(error as Error, 'useWalkthrough.getCompletedWalkthroughs');
    }

    return [];
  }, []);

  /**
   * Save completed walkthroughs to localStorage
   */
  const saveCompletedWalkthroughs = useCallback((completed: string[]) => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(completed));
    } catch (error) {
      logError(error as Error, 'useWalkthrough.saveCompletedWalkthroughs');
    }
  }, []);

  /**
   * Check if user has completed a specific walkthrough
   */
  const hasCompletedWalkthrough = useCallback((type: WalkthroughType): boolean => {
    if (!type) return false;
    const completed = getCompletedWalkthroughs();
    return completed.includes(type);
  }, [getCompletedWalkthroughs]);

  /**
   * Start a walkthrough
   */
  const startWalkthrough = useCallback((type: WalkthroughType) => {
    if (!type) return;
    
    setCurrentWalkthrough(type);
    setIsActive(true);
    logInfo(`Started walkthrough: ${type}`, 'useWalkthrough.startWalkthrough');
  }, []);

  /**
   * Stop the current walkthrough without marking as complete
   */
  const stopWalkthrough = useCallback(() => {
    setIsActive(false);
    setCurrentWalkthrough(null);
    logInfo('Stopped walkthrough', 'useWalkthrough.stopWalkthrough');
  }, []);

  /**
   * Complete the current walkthrough and persist completion
   */
  const completeWalkthrough = useCallback(() => {
    if (!currentWalkthrough) return;

    const completed = getCompletedWalkthroughs();
    
    if (!completed.includes(currentWalkthrough)) {
      completed.push(currentWalkthrough);
      saveCompletedWalkthroughs(completed);
      logInfo(`Completed walkthrough: ${currentWalkthrough}`, 'useWalkthrough.completeWalkthrough');
    }

    // TODO: Persist to user profile in Firestore (when user profile service supports it)
    // This would allow completion to sync across devices
    if (user) {
      // await updateUserProfile(user.uid, { completedWalkthroughs: completed });
    }

    setIsActive(false);
    setCurrentWalkthrough(null);
  }, [currentWalkthrough, getCompletedWalkthroughs, saveCompletedWalkthroughs, user]);

  /**
   * Reset a walkthrough (mark as not completed)
   */
  const resetWalkthrough = useCallback((type: WalkthroughType) => {
    if (!type) return;

    const completed = getCompletedWalkthroughs();
    const filtered = completed.filter((t) => t !== type);
    saveCompletedWalkthroughs(filtered);
    logInfo(`Reset walkthrough: ${type}`, 'useWalkthrough.resetWalkthrough');
  }, [getCompletedWalkthroughs, saveCompletedWalkthroughs]);

  /**
   * Auto-start onboarding walkthrough for first-time users
   */
  useEffect(() => {
    if (typeof window === 'undefined' || !user) return;

    // Check if onboarding walkthrough should auto-start
    const shouldAutoStart = !hasCompletedWalkthrough('onboarding');
    
    if (shouldAutoStart) {
      // Small delay to ensure UI is ready
      const timer = setTimeout(() => {
        startWalkthrough('onboarding');
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [user, hasCompletedWalkthrough, startWalkthrough]);

  return {
    isActive,
    currentWalkthrough,
    startWalkthrough,
    stopWalkthrough,
    completeWalkthrough,
    hasCompletedWalkthrough,
    resetWalkthrough,
  };
};
