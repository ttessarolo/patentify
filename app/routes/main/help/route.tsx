import type { JSX } from 'react';
import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/main/help')({
  component: HelpLayout,
});

function HelpLayout(): JSX.Element {
  return <Outlet />;
}
