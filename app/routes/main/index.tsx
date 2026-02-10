import type { JSX } from 'react';
import { useState, useEffect } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';

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
  const [visibleCount, setVisibleCount] = useState<number>(0);

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
    <div className="mx-auto mt-4 grid h-[calc(100dvh-var(--header-height)-3.5rem)] grid-cols-1 grid-rows-8 gap-1.5 md:mt-0 md:max-h-[60dvh] md:max-w-3xl md:grid-cols-2 md:grid-rows-4 md:gap-2">
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
          <img
            src={item.img}
            alt={item.alt}
            className="max-h-full w-auto rounded-lg"
            draggable={false}
          />
        </Link>
      ))}
    </div>
  );
}
