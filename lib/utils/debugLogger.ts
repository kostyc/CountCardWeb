/**
 * Browser Debug Logger
 * 
 * Provides enhanced debug logging specifically for browser environments.
 * Logs to browser console and optionally displays a visual debug panel.
 * Works in Chrome, Safari, Edge, and can be viewed through browser dev tools.
 */

'use client';

import { log, logError, logInfo, logWarning, logDebug, type LogLevel } from './logger';

/**
 * Debug configuration
 */
interface DebugConfig {
  enabled: boolean;
  showPanel: boolean;
  logLevel: LogLevel;
  maxLogEntries: number;
  showTimestamp: boolean;
  showContext: boolean;
}

/**
 * Default debug configuration
 */
const defaultConfig: DebugConfig = {
  enabled: typeof window !== 'undefined' && (
    process.env.NEXT_PUBLIC_DEBUG === 'true' ||
    process.env.NODE_ENV === 'development' ||
    (typeof window !== 'undefined' && (window as any).__DEBUG__ === true)
  ),
  showPanel: typeof window !== 'undefined' && (
    process.env.NEXT_PUBLIC_DEBUG_PANEL === 'true' ||
    (typeof window !== 'undefined' && (window as any).__DEBUG_PANEL__ === true)
  ),
  logLevel: 'debug',
  maxLogEntries: 100,
  showTimestamp: true,
  showContext: true,
};

/**
 * Debug log entry
 */
interface DebugLogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: string;
  data?: unknown;
  stack?: string;
}

/**
 * Debug logger class
 */
class BrowserDebugLogger {
  private config: DebugConfig;
  private logs: DebugLogEntry[] = [];
  private panelElement: HTMLElement | null = null;
  private isPanelVisible = false;

  constructor(config: Partial<DebugConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    
    if (this.config.enabled && typeof window !== 'undefined') {
      this.initialize();
    }
  }

  /**
   * Initialize debug logger
   */
  private initialize(): void {
    // Add keyboard shortcut to toggle debug panel (Ctrl+Shift+D or Cmd+Shift+D)
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
          e.preventDefault();
          this.togglePanel();
        }
      });

      // Create debug panel if enabled
      if (this.config.showPanel) {
        this.createDebugPanel();
      }

      // Log initialization
      this.log('info', 'Debug logger initialized', 'DebugLogger', {
        enabled: this.config.enabled,
        showPanel: this.config.showPanel,
        logLevel: this.config.logLevel,
      });
    }
  }

  /**
   * Log a message
   */
  log(
    level: LogLevel,
    message: string,
    context?: string,
    data?: unknown
  ): void {
    if (!this.config.enabled) {
      return;
    }

    // Use existing logger for console output
    switch (level) {
      case 'debug':
        logDebug(message, context, data);
        break;
      case 'info':
        logInfo(message, context, data);
        break;
      case 'warn':
        logWarning(message, context, data);
        break;
      case 'error':
        logError(new Error(message), context);
        break;
    }

    // Create log entry
    const entry: DebugLogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      level,
      message,
      context,
      data,
      stack: level === 'error' ? new Error().stack : undefined,
    };

    // Add to logs array
    this.logs.push(entry);

    // Limit log entries
    if (this.logs.length > this.config.maxLogEntries) {
      this.logs.shift();
    }

    // Update panel if visible
    if (this.isPanelVisible && this.panelElement) {
      this.updatePanel();
    }
  }

  /**
   * Create debug panel
   */
  private createDebugPanel(): void {
    if (typeof window === 'undefined' || this.panelElement) {
      return;
    }

    const panel = document.createElement('div');
    panel.id = 'debug-panel';
    panel.style.cssText = `
      position: fixed;
      bottom: 0;
      right: 0;
      width: 400px;
      max-height: 500px;
      background: #1a1a1a;
      color: #e0e0e0;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 12px;
      z-index: 99999;
      border-top: 2px solid #333;
      border-left: 2px solid #333;
      display: none;
      flex-direction: column;
      box-shadow: -2px -2px 10px rgba(0, 0, 0, 0.5);
    `;

    // Panel header
    const header = document.createElement('div');
    header.style.cssText = `
      background: #2a2a2a;
      padding: 8px 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #333;
      cursor: move;
    `;
    header.innerHTML = `
      <span style="font-weight: bold; color: #4CAF50;">🔍 Debug Panel</span>
      <div>
        <button id="debug-clear" style="
          background: #f44336;
          color: white;
          border: none;
          padding: 4px 8px;
          margin-right: 8px;
          border-radius: 3px;
          cursor: pointer;
          font-size: 11px;
        ">Clear</button>
        <button id="debug-close" style="
          background: #666;
          color: white;
          border: none;
          padding: 4px 8px;
          border-radius: 3px;
          cursor: pointer;
          font-size: 11px;
        ">×</button>
      </div>
    `;

    // Logs container
    const logsContainer = document.createElement('div');
    logsContainer.id = 'debug-logs';
    logsContainer.style.cssText = `
      flex: 1;
      overflow-y: auto;
      padding: 8px;
      max-height: 450px;
    `;

    // Filter controls
    const filters = document.createElement('div');
    filters.style.cssText = `
      padding: 8px;
      background: #2a2a2a;
      border-top: 1px solid #333;
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    `;
    filters.innerHTML = `
      <label style="display: flex; align-items: center; gap: 4px; cursor: pointer;">
        <input type="checkbox" id="debug-filter-debug" checked> <span style="color: #888;">Debug</span>
      </label>
      <label style="display: flex; align-items: center; gap: 4px; cursor: pointer;">
        <input type="checkbox" id="debug-filter-info" checked> <span style="color: #2196F3;">Info</span>
      </label>
      <label style="display: flex; align-items: center; gap: 4px; cursor: pointer;">
        <input type="checkbox" id="debug-filter-warn" checked> <span style="color: #FF9800;">Warn</span>
      </label>
      <label style="display: flex; align-items: center; gap: 4px; cursor: pointer;">
        <input type="checkbox" id="debug-filter-error" checked> <span style="color: #f44336;">Error</span>
      </label>
    `;

    panel.appendChild(header);
    panel.appendChild(logsContainer);
    panel.appendChild(filters);
    document.body.appendChild(panel);

    this.panelElement = panel;

    // Event listeners
    header.querySelector('#debug-close')?.addEventListener('click', () => {
      this.togglePanel();
    });

    header.querySelector('#debug-clear')?.addEventListener('click', () => {
      this.clearLogs();
    });

    // Filter checkboxes
    ['debug', 'info', 'warn', 'error'].forEach(level => {
      const checkbox = document.getElementById(`debug-filter-${level}`);
      checkbox?.addEventListener('change', () => {
        this.updatePanel();
      });
    });

    // Make panel draggable
    this.makeDraggable(header, panel);
  }

  /**
   * Make panel draggable
   */
  private makeDraggable(header: HTMLElement, panel: HTMLElement): void {
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;

    header.addEventListener('mousedown', (e) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = panel.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;
      header.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      panel.style.left = `${startLeft + deltaX}px`;
      panel.style.top = `${startTop + deltaY}px`;
      panel.style.right = 'auto';
      panel.style.bottom = 'auto';
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
      header.style.cursor = 'move';
    });
  }

  /**
   * Update debug panel
   */
  private updatePanel(): void {
    if (!this.panelElement) return;

    const logsContainer = this.panelElement.querySelector('#debug-logs');
    if (!logsContainer) return;

    // Get filter states
    const filters = {
      debug: (document.getElementById('debug-filter-debug') as HTMLInputElement)?.checked ?? true,
      info: (document.getElementById('debug-filter-info') as HTMLInputElement)?.checked ?? true,
      warn: (document.getElementById('debug-filter-warn') as HTMLInputElement)?.checked ?? true,
      error: (document.getElementById('debug-filter-error') as HTMLInputElement)?.checked ?? true,
    };

    // Filter and render logs
    const filteredLogs = this.logs.filter(log => filters[log.level]);
    logsContainer.innerHTML = filteredLogs.map(log => this.renderLogEntry(log)).join('');

    // Auto-scroll to bottom
    logsContainer.scrollTop = logsContainer.scrollHeight;
  }

  /**
   * Render log entry
   */
  private renderLogEntry(entry: DebugLogEntry): string {
    const colors = {
      debug: '#888',
      info: '#2196F3',
      warn: '#FF9800',
      error: '#f44336',
    };

    const icons = {
      debug: '🔍',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
    };

    const time = this.config.showTimestamp
      ? entry.timestamp.toLocaleTimeString()
      : '';
    
    const context = this.config.showContext && entry.context
      ? `[${entry.context}]`
      : '';

    const data = entry.data
      ? `<div style="margin-top: 4px; padding-left: 16px; color: #aaa; font-size: 11px;">${JSON.stringify(entry.data, null, 2)}</div>`
      : '';

    const stack = entry.stack
      ? `<div style="margin-top: 4px; padding-left: 16px; color: #666; font-size: 10px; white-space: pre-wrap;">${entry.stack}</div>`
      : '';

    return `
      <div style="
        padding: 6px 8px;
        border-bottom: 1px solid #333;
        border-left: 3px solid ${colors[entry.level]};
      ">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span>${icons[entry.level]}</span>
          <span style="color: ${colors[entry.level]}; font-weight: bold; text-transform: uppercase; font-size: 10px;">${entry.level}</span>
          ${time ? `<span style="color: #666; font-size: 10px;">${time}</span>` : ''}
          ${context ? `<span style="color: #888; font-size: 10px;">${context}</span>` : ''}
        </div>
        <div style="margin-top: 4px; color: #e0e0e0;">${entry.message}</div>
        ${data}
        ${stack}
      </div>
    `;
  }

  /**
   * Toggle debug panel visibility
   */
  togglePanel(): void {
    if (!this.panelElement) {
      if (this.config.showPanel) {
        this.createDebugPanel();
      } else {
        return;
      }
    }

    if (!this.panelElement) return;

    this.isPanelVisible = !this.isPanelVisible;
    this.panelElement.style.display = this.isPanelVisible ? 'flex' : 'none';

    if (this.isPanelVisible) {
      this.updatePanel();
    }
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
    if (this.panelElement) {
      const logsContainer = this.panelElement.querySelector('#debug-logs');
      if (logsContainer) {
        logsContainer.innerHTML = '';
      }
    }
  }

  /**
   * Get all logs
   */
  getLogs(): DebugLogEntry[] {
    return [...this.logs];
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Create singleton instance
let debugLoggerInstance: BrowserDebugLogger | null = null;

/**
 * Get or create debug logger instance
 */
export function getDebugLogger(): BrowserDebugLogger {
  if (!debugLoggerInstance) {
    debugLoggerInstance = new BrowserDebugLogger();
  }
  return debugLoggerInstance;
}

/**
 * Debug logging functions
 */
export const debugLog = {
  debug: (message: string, context?: string, data?: unknown) => {
    getDebugLogger().log('debug', message, context, data);
  },
  info: (message: string, context?: string, data?: unknown) => {
    getDebugLogger().log('info', message, context, data);
  },
  warn: (message: string, context?: string, data?: unknown) => {
    getDebugLogger().log('warn', message, context, data);
  },
  error: (message: string, context?: string, data?: unknown) => {
    getDebugLogger().log('error', message, context, data);
  },
  togglePanel: () => {
    getDebugLogger().togglePanel();
  },
  clear: () => {
    getDebugLogger().clearLogs();
  },
  export: () => {
    return getDebugLogger().exportLogs();
  },
};

// Expose to window for console access
if (typeof window !== 'undefined') {
  (window as any).debugLog = debugLog;
  (window as any).__DEBUG_LOGGER__ = getDebugLogger();
}
