/**
 * Hook per rilevare se il viewport è in modalità mobile.
 * Usa il breakpoint Tailwind `sm` (640px): sotto = mobile, sopra = desktop.
 */

import { useState, useEffect } from 'react';

const TAILWIND_SM_BREAKPOINT_PX = 640;
const MEDIA_QUERY = `(max-width: ${TAILWIND_SM_BREAKPOINT_PX - 1}px)`;

function getInitialIsMobile(): boolean {
  if (typeof window === 'undefined') return true;
  return window.matchMedia(MEDIA_QUERY).matches;
}

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(getInitialIsMobile);

  useEffect(() => {
    const mq = window.matchMedia(MEDIA_QUERY);

    const handler = (e: MediaQueryListEvent): void => {
      setIsMobile(e.matches);
    };

    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return isMobile;
}
