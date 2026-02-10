import type { JSX } from 'react';
import { useState, useEffect, useMemo } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useAuth } from '@clerk/tanstack-react-start';
import { useOnlineUsers } from '~/hooks/useOnlineUsers';

const menuItems = [
  {
    to: '/main/esercitazione',
    img: '/bottoni/esercitazione_libera.png',
    alt: 'Esercitazione Libera',
  },
  {
    to: '/main/simulazione-quiz',
    img: '/bottoni/simulazione_quiz.png',
    alt: 'Simulazione Quiz',
  },
  {
    to: '/main/errori-ricorrenti',
    img: '/bottoni/errori_ricorrenti.png',
    alt: 'Errori Ricorrenti',
  },
  {
    to: '/main/statistiche',
    img: '/bottoni/statistiche_quiz.png',
    alt: 'Statistiche Quiz',
  },
  {
    to: '/main/classifiche',
    img: '/bottoni/classifiche.png',
    alt: 'Classifiche',
  },
  { to: '/main/sfide', img: '/bottoni/sfide.png', alt: 'Sfide' },
  {
    to: '/main/consigli-e-trucchi',
    img: '/bottoni/consigli_e_trucchi.png',
    alt: 'Consigli e Trucchi',
  },
  { to: '/main/help', img: '/bottoni/help.png', alt: 'Help' },
] as const;

export const Route = createFileRoute('/main/')({
  component: MainIndex,
});

function MainIndex(): JSX.Element {
  const { userId } = useAuth();
  const [visibleCount, setVisibleCount] = useState<number>(0);

  // Conteggio utenti online (escluso se stesso) per il badge Sfide
  const { onlineUserIds } = useOnlineUsers({ enabled: Boolean(userId) });
  const onlineCount = useMemo(
    (): number => onlineUserIds.filter((id) => id !== userId).length,
    [onlineUserIds, userId],
  );

  useEffect(() => {
    if (visibleCount >= menuItems.length) return;

    const timeout = setTimeout(() => {
      setVisibleCount((prev) => prev + 1);
    }, 60);

    return (): void => {
      clearTimeout(timeout);
    };
  }, [visibleCount]);

  return (
    <div className="mx-auto mt-4 grid h-[calc(100dvh-var(--header-height)-6rem)] grid-cols-1 grid-rows-8 gap-1.5 md:mt-0 md:h-auto md:max-h-[60dvh] md:max-w-3xl md:grid-cols-2 md:grid-rows-4 md:gap-2">
      {menuItems.map((item, index) => (
        <Link
          key={item.to}
          to={item.to}
          className={`flex min-h-0 items-center justify-center transition-all duration-300 hover:scale-[1.02] active:scale-95 ${
            index < visibleCount
              ? 'translate-y-0 opacity-100'
              : 'translate-y-4 opacity-0'
          }`}
        >
          <div className="relative inline-block max-h-full">
            <img
              src={item.img}
              alt={item.alt}
              className="max-h-full w-auto rounded-lg"
              draggable={false}
            />
            {/* Badge utenti online sul bottone Sfide */}
            {item.to === '/main/sfide' && onlineCount > 0 && (
              <span className="absolute -bottom-2 right-1 flex h-11 min-w-11 items-center justify-center rounded-full bg-red-600 px-2 text-lg font-bold leading-none text-white shadow-lg ring-2 ring-background">
                {onlineCount > 99 ? '99+' : onlineCount}
              </span>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
