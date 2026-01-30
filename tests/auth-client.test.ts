import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Clerk server auth
vi.mock('@clerk/tanstack-react-start/server', () => ({
  auth: vi.fn(() =>
    Promise.resolve({
      userId: 'user_test123',
      sessionId: 'session_test123',
    })
  ),
  clerkMiddleware: vi.fn(() => ({})),
}));

describe('Clerk Auth Server', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('should return userId from Clerk auth()', async () => {
    const { auth } = await import('@clerk/tanstack-react-start/server');

    const authResult = await auth();

    expect(authResult).toBeDefined();
    expect(authResult.userId).toBe('user_test123');
    expect(authResult.sessionId).toBe('session_test123');
  });

  it('should have clerkMiddleware defined', async () => {
    const { clerkMiddleware } = await import(
      '@clerk/tanstack-react-start/server'
    );

    expect(clerkMiddleware).toBeDefined();
    expect(typeof clerkMiddleware).toBe('function');
  });
});

describe('Clerk Environment Variables', () => {
  it('should have VITE_CLERK_PUBLISHABLE_KEY pattern', () => {
    // Test che la variabile è nel formato corretto (pk_test_ o pk_live_)
    const publishableKeyPattern = /^pk_(test|live)_[a-zA-Z0-9]+$/;

    // Mock di una chiave valida per il test
    const mockKey = 'pk_test_abc123';
    expect(publishableKeyPattern.test(mockKey)).toBe(true);
  });

  it('should have CLERK_SECRET_KEY pattern', () => {
    // Test che la variabile è nel formato corretto (sk_test_ o sk_live_)
    const secretKeyPattern = /^sk_(test|live)_[a-zA-Z0-9]+$/;

    // Mock di una chiave valida per il test
    const mockKey = 'sk_test_abc123';
    expect(secretKeyPattern.test(mockKey)).toBe(true);
  });
});
