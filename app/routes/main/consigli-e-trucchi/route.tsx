import React from 'react';
import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/main/consigli-e-trucchi')({
  component: ConsigliETrucchiLayout,
});

function ConsigliETrucchiLayout(): React.JSX.Element {
  return <Outlet />;
}
