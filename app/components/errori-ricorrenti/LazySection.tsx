import type { JSX, ReactNode, RefObject } from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';

interface LazySectionProps {
  /** Children da renderizzare quando la sezione è visibile */
  children: ReactNode;
  /** Placeholder da mostrare prima che la sezione sia visibile */
  placeholder?: ReactNode;
  /** Margin per l'IntersectionObserver (default: '100px') */
  rootMargin?: string;
  /** Threshold per l'IntersectionObserver (default: 0) */
  threshold?: number;
  /** Callback quando la sezione diventa visibile */
  onVisible?: () => void;
  /** Classe CSS aggiuntiva per il container */
  className?: string;
}

/**
 * Placeholder skeleton per le sezioni lazy.
 */
export function SectionSkeleton(): JSX.Element {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-6 w-1/3 rounded bg-muted" />
      <div className="space-y-2">
        <div className="h-24 rounded-lg bg-muted" />
        <div className="h-24 rounded-lg bg-muted" />
      </div>
    </div>
  );
}

/**
 * Wrapper component per lazy loading delle sezioni.
 * Utilizza IntersectionObserver nativo per rilevare quando
 * la sezione sta per entrare nella viewport.
 */
export function LazySection({
  children,
  placeholder = <SectionSkeleton />,
  rootMargin = '100px',
  threshold = 0,
  onVisible,
  className = '',
}: LazySectionProps): JSX.Element {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]): void => {
      const [entry] = entries;
      if (entry.isIntersecting && !isVisible) {
        setIsVisible(true);
        onVisible?.();
      }
    },
    [isVisible, onVisible]
  );

  useEffect(() => {
    const ref = containerRef.current;
    if (!ref) return;

    const observer = new IntersectionObserver(handleIntersection, {
      rootMargin,
      threshold,
    });

    observer.observe(ref);

    return (): void => {
      observer.disconnect();
    };
  }, [handleIntersection, rootMargin, threshold]);

  return (
    <div ref={containerRef} className={className}>
      {isVisible ? children : placeholder}
    </div>
  );
}

/**
 * Hook per gestire lazy loading manuale con IntersectionObserver.
 */
export function useLazyLoad(
  options: {
    rootMargin?: string;
    threshold?: number;
  } = {}
): {
  ref: RefObject<HTMLDivElement | null>;
  isVisible: boolean;
} {
  const { rootMargin = '100px', threshold = 0 } = options;
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold }
    );

    observer.observe(element);

    return (): void => {
      observer.disconnect();
    };
  }, [rootMargin, threshold]);

  return { ref, isVisible };
}
