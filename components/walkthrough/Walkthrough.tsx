'use client';

/**
 * Walkthrough Component
 * Interactive step-by-step guide for user onboarding
 * Adapted from AIChatModel with CountCard design system
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';

export interface WalkthroughStep {
  id: string;
  target: string; // CSS selector or data attribute for the element to highlight
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: () => void; // Optional action to perform when step is shown
  waitForElement?: boolean; // Wait for element to appear before showing step
}

interface WalkthroughProps {
  steps: WalkthroughStep[];
  isActive: boolean;
  onComplete: () => void;
  onSkip: () => void;
  showSkip?: boolean;
  showProgress?: boolean;
}

export const Walkthrough: React.FC<WalkthroughProps> = ({
  steps,
  isActive,
  onComplete,
  onSkip,
  showSkip = true,
  showProgress = true,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [overlayPosition, setOverlayPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const overlayRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    if (currentStep >= steps.length) return;

    const step = steps[currentStep];
    let element: HTMLElement | null = null;
    
    // Try to find element by data attribute first, then by selector
    if (step.target.startsWith('[data-')) {
      element = document.querySelector(step.target) as HTMLElement;
    } else if (step.target === 'body') {
      element = document.body;
    } else {
      // Try multiple selector strategies
      element = document.querySelector(step.target) as HTMLElement;
    }

    if (!element) {
      // Element not found, try waiting or skip
      if (step.waitForElement) {
        // Retry after a short delay
        setTimeout(updatePosition, 500);
        return;
      }
      // Skip this step if element not found
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
        return;
      } else {
        onComplete();
        return;
      }
    }

    setTargetElement(element);

    // Get element position
    const rect = element.getBoundingClientRect();
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;

    setOverlayPosition({
      top: rect.top + scrollY,
      left: rect.left + scrollX,
      width: rect.width,
      height: rect.height,
    });

    // Calculate tooltip position based on step position preference
    const position = step.position || 'bottom';
    let tooltipTop = 0;
    let tooltipLeft = 0;

    switch (position) {
      case 'top':
        tooltipTop = rect.top + scrollY - 20;
        tooltipLeft = rect.left + scrollX + rect.width / 2;
        break;
      case 'bottom':
        tooltipTop = rect.bottom + scrollY + 20;
        tooltipLeft = rect.left + scrollX + rect.width / 2;
        break;
      case 'left':
        tooltipTop = rect.top + scrollY + rect.height / 2;
        tooltipLeft = rect.left + scrollX - 20;
        break;
      case 'right':
        tooltipTop = rect.top + scrollY + rect.height / 2;
        tooltipLeft = rect.right + scrollX + 20;
        break;
      case 'center':
        tooltipTop = rect.top + scrollY + rect.height / 2;
        tooltipLeft = rect.left + scrollX + rect.width / 2;
        break;
    }

    setTooltipPosition({ top: tooltipTop, left: tooltipLeft });

    // Scroll element into view if needed
    element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });

    // Execute step action if provided
    if (step.action) {
      step.action();
    }
  }, [currentStep, steps, onComplete]);

  useEffect(() => {
    if (!isActive || steps.length === 0) return;

    updatePosition();

    // Update position on scroll/resize
    const handleResize = () => updatePosition();
    const handleScroll = () => updatePosition();

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isActive, currentStep, updatePosition, steps.length]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!isActive || steps.length === 0 || currentStep >= steps.length) {
    return null;
  }

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <>
      {/* Overlay backdrop */}
      <div
        className="fixed inset-0 z-[9998] bg-black/60"
        style={{ pointerEvents: 'auto' }}
        onClick={(e) => {
          // Only allow clicking outside to proceed if it's not the highlighted element
          if (targetElement && !targetElement.contains(e.target as Node)) {
            // Don't auto-advance, require button click
          }
        }}
        aria-hidden="true"
      />

      {/* Highlighted element overlay */}
      {targetElement && (
        <div
          ref={overlayRef}
          className="fixed z-[9999] pointer-events-none"
          style={{
            top: `${overlayPosition.top}px`,
            left: `${overlayPosition.left}px`,
            width: `${overlayPosition.width}px`,
            height: `${overlayPosition.height}px`,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6), 0 0 0 4px #DC143C, 0 0 20px rgba(220, 20, 60, 0.5)',
            borderRadius: '8px',
            transition: 'all 0.3s ease',
          }}
          aria-hidden="true"
        />
      )}

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed z-[10000] rounded-xl shadow-2xl p-6 max-w-sm pointer-events-auto bg-background-card-light dark:bg-background-card-dark border-2 border-marine-red"
        style={{
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`,
          transform: step.position === 'center' 
            ? 'translate(-50%, -50%)' 
            : step.position === 'right' 
            ? 'translateY(-50%)' 
            : step.position === 'left'
            ? 'translate(-100%, -50%)'
            : step.position === 'top'
            ? 'translate(-50%, -100%)'
            : 'translate(-50%, 0)',
          transition: 'all 0.3s ease',
        }}
        role="dialog"
        aria-labelledby="walkthrough-title"
        aria-describedby="walkthrough-content"
      >
        {/* Progress bar */}
        {showProgress && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs mb-2 text-text-secondary-light dark:text-text-secondary-dark">
              <span>Step {currentStep + 1} of {steps.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-2 rounded-full overflow-hidden bg-background-secondary-light dark:bg-background-secondary-dark">
              <div
                className="h-full transition-all duration-300 bg-marine-red"
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Title */}
        <h3 
          id="walkthrough-title"
          className="text-lg font-semibold mb-2 text-text-heading-light dark:text-text-heading-dark"
        >
          {step.title}
        </h3>

        {/* Content */}
        <p 
          id="walkthrough-content"
          className="text-sm mb-4 text-text-primary-light dark:text-text-primary-dark"
        >
          {step.content}
        </p>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex gap-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrevious}
                type="button"
                className="px-4 py-2 text-sm font-medium rounded-md transition-colors bg-background-secondary-light dark:bg-background-secondary-dark hover:bg-background-tertiary-light dark:hover:bg-background-tertiary-dark text-text-primary-light dark:text-text-primary-dark border border-border-primary-light dark:border-border-primary-dark focus:outline-none focus:ring-2 focus:ring-marine-red focus:ring-offset-2"
              >
                Previous
              </button>
            )}
          </div>

          <div className="flex gap-2">
            {showSkip && (
              <button
                onClick={onSkip}
                type="button"
                className="px-4 py-2 text-sm font-medium rounded-md transition-colors text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-marine-red focus:ring-offset-2"
              >
                Skip
              </button>
            )}
            <button
              onClick={handleNext}
              type="button"
              className="px-4 py-2 text-sm font-medium rounded-md transition-colors bg-marine-red hover:bg-marine-red-dark text-white focus:outline-none focus:ring-2 focus:ring-marine-red focus:ring-offset-2"
            >
              {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
