import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock delle dipendenze di Neon Auth
vi.mock('@neondatabase/neon-js/auth', () => ({
  createAuthClient: vi.fn((url: string) => ({
    useSession: vi.fn(),
    signOut: vi.fn(),
  })),
}));

vi.mock('@neondatabase/neon-js/auth/react', () => ({
  BetterAuthReactAdapter: vi.fn(() => ({})),
}));

describe('Auth Client', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('should throw error if VITE_NEON_AUTH_URL is not defined', async () => {
    // Mock environment senza VITE_NEON_AUTH_URL
    vi.stubEnv('VITE_NEON_AUTH_URL', '');

    await expect(async () => {
      await import('../app/lib/auth');
    }).rejects.toThrow('VITE_NEON_AUTH_URL is not defined');
  });

  it('should initialize auth client with valid URL', async () => {
    const mockAuthUrl =
      'https://ep-test.neonauth.region.aws.neon.tech/neondb/auth';
    vi.stubEnv('VITE_NEON_AUTH_URL', mockAuthUrl);

    const { authClient } = await import('../app/lib/auth');

    expect(authClient).toBeDefined();
    expect(authClient).toHaveProperty('useSession');
    expect(authClient).toHaveProperty('signOut');
  });
});
