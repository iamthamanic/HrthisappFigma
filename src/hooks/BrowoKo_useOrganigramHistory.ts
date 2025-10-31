import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner@2.0.3';
import type { OrgNodeData } from '../components/OrgNode';
import type { Connection } from '../components/canvas/BrowoKo_CanvasOrgChart';

/**
 * ORGANIGRAM HISTORY HOOK (Undo/Redo)
 * ====================================
 * Manages undo/redo history with keyboard shortcuts
 * 
 * Features:
 * - History state management (max 50 items)
 * - Undo (Cmd/Ctrl + Z)
 * - Redo (Cmd/Ctrl + Shift + Z or Cmd/Ctrl + Y)
 * - Keyboard shortcuts in capture phase (works even in dialogs)
 * 
 * Extracted from: OrganigramCanvasScreenV2.tsx (Lines 56-59, 203-267)
 */

interface HistoryState {
  nodes: OrgNodeData[];
  connections: Connection[];
}

export interface UseOrganigramHistoryReturn {
  // History State
  history: HistoryState[];
  historyIndex: number;
  
  // Methods
  addToHistory: (nodes: OrgNodeData[], connections: Connection[]) => void;
  undo: () => void;
  redo: () => void;
  
  // Computed Properties
  canUndo: boolean;
  canRedo: boolean;
}

export function useOrganigramHistory(): UseOrganigramHistoryReturn {
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Add to history when nodes/connections change
  const addToHistory = useCallback((newNodes: OrgNodeData[], newConnections: Connection[]) => {
    setHistory(prev => {
      // Remove all history after current index
      const newHistory = prev.slice(0, historyIndex + 1);
      // Add new state
      newHistory.push({ nodes: newNodes, connections: newConnections });
      // Keep max 50 history items
      if (newHistory.length > 50) {
        newHistory.shift();
        return newHistory;
      }
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  }, [historyIndex]);

  // Undo (Cmd+Z / Ctrl+Z)
  const undo = useCallback((): HistoryState | null => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const state = history[newIndex];
      setHistoryIndex(newIndex);
      toast.info('Rückgängig gemacht');
      return state;
    }
    return null;
  }, [history, historyIndex]);

  // Redo (Cmd+Shift+Z / Ctrl+Shift+Z)
  const redo = useCallback((): HistoryState | null => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const state = history[newIndex];
      setHistoryIndex(newIndex);
      toast.info('Wiederholt');
      return state;
    }
    return null;
  }, [history, historyIndex]);

  // Keyboard shortcuts - Undo/Redo with Cmd+Z/Ctrl+Z
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ✅ FIX: Allow Undo/Redo even when dialogs are open or inputs are focused
      // Only prevent default if it's actually our shortcut
      const isUndoShortcut = (e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey;
      const isRedoShortcut = ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) || 
                              ((e.ctrlKey || e.metaKey) && e.key === 'y');

      if (isUndoShortcut) {
        e.preventDefault();
        e.stopPropagation(); // Stop event from bubbling
        undo();
      } else if (isRedoShortcut) {
        e.preventDefault();
        e.stopPropagation(); // Stop event from bubbling
        redo();
      }
    };

    // ✅ Use capture phase to intercept before dialogs
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [undo, redo]);

  return {
    // State
    history,
    historyIndex,
    
    // Methods
    addToHistory,
    undo,
    redo,
    
    // Computed
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
  };
}
