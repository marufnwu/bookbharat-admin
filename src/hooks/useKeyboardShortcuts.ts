import { useEffect, useCallback, useRef } from 'react';

interface KeyboardShortcutConfig {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  handler: () => void;
  description: string;
  enabled?: boolean;
}

export function useKeyboardShortcuts(configs: KeyboardShortcutConfig[]) {
  const configsRef = useRef(configs);
  configsRef.current = configs;

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Skip when typing in inputs
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.isContentEditable
    ) {
      return;
    }

    for (const config of configsRef.current) {
      if (config.enabled === false) continue;

      const keyMatch = e.key.toLowerCase() === config.key.toLowerCase();
      const ctrlMatch = config.ctrlKey ? e.ctrlKey || e.metaKey : !e.ctrlKey && !e.metaKey;
      const shiftMatch = config.shiftKey ? e.shiftKey : true;

      if (keyMatch && ctrlMatch && shiftMatch) {
        e.preventDefault();
        config.handler();
        return;
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// Previous value tracker hook
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}
