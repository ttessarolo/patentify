import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Mock Neon Auth UI components
const mockAuthView = vi.fn(({ pathname }: { pathname: string }) => (
  <div data-testid="auth-view">Auth View: {pathname}</div>
));

const mockAccountView = vi.fn(({ pathname }: { pathname: string }) => (
  <div data-testid="account-view">Account View: {pathname}</div>
));

vi.mock('@neondatabase/neon-js/auth/react/ui', () => ({
  AuthView: mockAuthView,
  AccountView: mockAccountView,
  SignedIn: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="signed-in">{children}</div>
  ),
  RedirectToSignIn: () => (
    <div data-testid="redirect-to-sign-in">Redirecting...</div>
  ),
  UserButton: () => <button data-testid="user-button">User Button</button>,
}));

// Mock TanStack Router
vi.mock('@tanstack/react-router', () => ({
  createFileRoute: vi.fn((path: string) => {
    return (config: { component: React.ComponentType }) => {
      const Component = config.component;
      return {
        component: Component,
        path,
        useParams: vi.fn(() => ({ pathname: 'sign-in' })),
      };
    };
  }),
}));

describe('Auth Components', () => {
  it('should render AuthView component with pathname', async () => {
    const { Route } = await import('../app/routes/auth.$pathname');
    const AuthComponent = Route.component;

    render(<AuthComponent />);

    expect(screen.getByTestId('auth-view')).toBeInTheDocument();
    expect(mockAuthView).toHaveBeenCalled();
    const callArgs = mockAuthView.mock.calls[0];
    expect(callArgs[0]).toHaveProperty('pathname');
  });

  it('should render AccountView component with pathname', async () => {
    const { Route } = await import('../app/routes/account.$pathname');
    const AccountComponent = Route.component;

    render(<AccountComponent />);

    expect(screen.getByTestId('account-view')).toBeInTheDocument();
    expect(mockAccountView).toHaveBeenCalled();
    const callArgs = mockAccountView.mock.calls[0];
    expect(callArgs[0]).toHaveProperty('pathname');
  });

  it('should have AuthView and AccountView components defined', () => {
    const {
      AuthView,
      AccountView,
    } = require('@neondatabase/neon-js/auth/react/ui');
    expect(AuthView).toBeDefined();
    expect(AccountView).toBeDefined();
  });
});
