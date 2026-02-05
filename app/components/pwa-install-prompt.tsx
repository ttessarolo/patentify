'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Button } from '~/components/ui/button';
import { cn } from '~/lib/utils';

// Chiave localStorage per tracciare se il prompt è stato già mostrato/dismesso
const PWA_PROMPT_DISMISSED_KEY = 'pwa-install-prompt-dismissed';

// Estende BeforeInstallPromptEvent per TypeScript
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

/**
 * Rileva se il dispositivo è iOS (iPhone, iPad, iPod)
 */
function isIOS(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

/**
 * Rileva se il dispositivo è Android
 */
function isAndroid(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }
  return /Android/.test(navigator.userAgent);
}

/**
 * Rileva se l'app è in modalità standalone (già installata)
 */
function isStandalone(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
      true
  );
}

/**
 * Rileva se è un dispositivo mobile
 */
function isMobile(): boolean {
  return isIOS() || isAndroid();
}

/**
 * Componente che mostra un prompt per installare la PWA sulla schermata Home.
 * - Su Android: usa il prompt nativo tramite beforeinstallprompt
 * - Su iOS: mostra istruzioni manuali
 * - Non mostra nulla se l'app è già installata o se l'utente ha già dismesso il prompt
 */
export function PWAInstallPrompt(): React.JSX.Element | null {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isIOSDevice, setIsIOSDevice] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Gestisce l'evento beforeinstallprompt (Android)
  const handleBeforeInstallPrompt = useCallback(
    (e: BeforeInstallPromptEvent): void => {
      // Previene il prompt automatico del browser
      e.preventDefault();
      // Salva l'evento per usarlo dopo
      setDeferredPrompt(e);
      setShowPrompt(true);
    },
    []
  );

  useEffect(() => {
    // Non fare nulla lato server
    if (typeof window === 'undefined') return;

    // Se l'app è già in standalone mode, non mostrare nulla
    if (isStandalone()) return;

    // Se l'utente ha già dismesso il prompt, non mostrare
    const dismissed = localStorage.getItem(PWA_PROMPT_DISMISSED_KEY);
    if (dismissed === 'true') return;

    // Se non è mobile, non mostrare
    if (!isMobile()) return;

    // Rileva iOS
    const iosDevice = isIOS();
    setIsIOSDevice(iosDevice);

    if (iosDevice) {
      // iOS: mostra subito le istruzioni manuali
      setShowPrompt(true);
    } else {
      // Android: ascolta l'evento beforeinstallprompt
      window.addEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt as EventListener
      );
    }

    return (): void => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt as EventListener
      );
    };
  }, [handleBeforeInstallPrompt]);

  // Animazione di entrata
  useEffect(() => {
    if (showPrompt) {
      // Piccolo delay per l'animazione
      const timer = setTimeout(() => setIsVisible(true), 100);
      return (): void => clearTimeout(timer);
    }
  }, [showPrompt]);

  // Installa l'app (Android)
  const handleInstall = async (): Promise<void> => {
    if (!deferredPrompt) return;

    // Mostra il prompt nativo
    await deferredPrompt.prompt();

    // Attendi la scelta dell'utente
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      // L'utente ha accettato, nascondi il banner
      handleDismiss();
    }

    // Reset del prompt (può essere usato solo una volta)
    setDeferredPrompt(null);
  };

  // Chiudi il prompt e salva la preferenza
  const handleDismiss = (): void => {
    setIsVisible(false);
    // Attendi la fine dell'animazione prima di nascondere completamente
    setTimeout(() => {
      setShowPrompt(false);
      localStorage.setItem(PWA_PROMPT_DISMISSED_KEY, 'true');
    }, 300);
  };

  if (!showPrompt) return null;

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 p-4 transition-transform duration-300 ease-out',
        isVisible ? 'translate-y-0' : 'translate-y-full'
      )}
    >
      <div className="mx-auto max-w-lg rounded-xl border border-border bg-card p-4 shadow-lg">
        <div className="flex items-start gap-3">
          {/* Icona app */}
          <div className="shrink-0">
            <img
              src="/apple-touch-icon.png"
              alt="Patentify"
              className="h-12 w-12 rounded-xl"
            />
          </div>

          {/* Contenuto */}
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-foreground">
              Installa Patentify
            </h3>

            {isIOSDevice ? (
              // Istruzioni iOS
              <p className="mt-1 text-sm text-muted-foreground">
                Tocca{' '}
                <span className="inline-flex items-center">
                  <svg
                    className="mx-0.5 inline h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M16 5l-1.42 1.42-1.59-1.59V16h-1.98V4.83L9.42 6.42 8 5l4-4 4 4zm4 5v11c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V10c0-1.1.9-2 2-2h3v2H6v11h12V10h-3V8h3c1.1 0 2 .9 2 2z" />
                  </svg>
                </span>{' '}
                poi <strong>&quot;Aggiungi a Home&quot;</strong> per installare
                l&apos;app.
              </p>
            ) : (
              // Descrizione Android
              <p className="mt-1 text-sm text-muted-foreground">
                Aggiungi l&apos;app alla schermata Home per un accesso rapido.
              </p>
            )}
          </div>

          {/* Pulsante chiudi */}
          <button
            onClick={handleDismiss}
            className="shrink-0 rounded-full p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Chiudi"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Pulsante installa (solo Android) */}
        {!isIOSDevice && deferredPrompt && (
          <div className="mt-3 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={handleDismiss}>
              Non ora
            </Button>
            <Button size="sm" onClick={handleInstall}>
              Installa
            </Button>
          </div>
        )}

        {/* Pulsante chiudi (iOS) */}
        {isIOSDevice && (
          <div className="mt-3 flex justify-end">
            <Button variant="ghost" size="sm" onClick={handleDismiss}>
              Ho capito
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
