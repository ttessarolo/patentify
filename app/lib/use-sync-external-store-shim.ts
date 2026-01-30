/**
 * Re-export useSyncExternalStore from React for React 19.
 * Used as Vite alias for 'use-sync-external-store/shim' so ESM named import
 * works without loading the CJS shim (React 19 has useSyncExternalStore built-in).
 */
export { useSyncExternalStore } from 'react';
