import React from 'react';
import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/main/help')({
  component: HelpLayout,
});

function HelpLayout(): React.JSX.Element {
  return <Outlet />;
}
