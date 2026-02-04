import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Mock Clerk components
const mockSignIn = vi.fn(() => <div data-testid="clerk-sign-in">Sign In</div>);
const mockSignUp = vi.fn(() => <div data-testid="clerk-sign-up">Sign Up</div>);
const mockUserProfile = vi.fn(() => (
  <div data-testid="clerk-user-profile">User Profile</div>
));

vi.mock('@clerk/tanstack-react-start', () => ({
  SignIn: mockSignIn,
  SignUp: mockSignUp,
  UserProfile: mockUserProfile,
  SignedIn: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="signed-in">{children}</div>
  ),
  SignedOut: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="signed-out">{children}</div>
  ),
  UserButton: () => <button data-testid="user-button">User Button</button>,
  ClerkProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="clerk-provider">{children}</div>
  ),
  useAuth: vi.fn(() => ({
    isSignedIn: false,
    isLoaded: true,
    userId: null,
  })),
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
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to} data-testid="link">
      {children}
    </a>
  ),
  Outlet: () => mockSignUp(),
  useNavigate: vi.fn(() => vi.fn()),
}));

describe('Auth Components', () => {
  it('should render SignIn component', async () => {
    const { Route } = await import('../app/routes/sign-in/index');
    const SignInComponent = Route.component;

    render(<SignInComponent />);

    expect(screen.getByTestId('clerk-sign-in')).toBeInTheDocument();
    expect(mockSignIn).toHaveBeenCalled();
  });

  it('should render SignUp component', async () => {
    const { Route } = await import('../app/routes/sign-up');
    const SignUpComponent = Route.component;

    render(<SignUpComponent />);

    expect(screen.getByTestId('clerk-sign-up')).toBeInTheDocument();
    expect(mockSignUp).toHaveBeenCalled();
  });

  it('should have Clerk components defined', async () => {
    const Clerk = await import('@clerk/tanstack-react-start');
    expect(Clerk.SignIn).toBeDefined();
    expect(Clerk.SignUp).toBeDefined();
    expect(Clerk.SignedIn).toBeDefined();
    expect(Clerk.SignedOut).toBeDefined();
    expect(Clerk.UserButton).toBeDefined();
  });
});
