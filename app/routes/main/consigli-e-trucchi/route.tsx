import type { JSX } from 'react';
import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/main/consigli-e-trucchi')({
  component: ConsigliETrucchiLayout,
});

function ConsigliETrucchiLayout(): JSX.Element {
  return <Outlet />;
}
