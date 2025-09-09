import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserProfile } from '../UserProfile';
import { OptimizedAuthProvider } from '@/contexts/OptimizedAuthContext';
import { mockSupabaseUser, mockAdminUser } from '@/__mocks__/supabase';

const renderWithAuth = (user = mockSupabaseUser) => {
  return render(
    <OptimizedAuthProvider>
      <UserProfile />
    </OptimizedAuthProvider>
  );
};

jest.mock('@/contexts/OptimizedAuthContext', () => ({
  OptimizedAuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useOptimizedAuth: () => ({
    user: mockSupabaseUser,
    loading: false,
    signOut: jest.fn(),
  }),
}));

describe('UserProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render user information', async () => {
    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByText(mockSupabaseUser.email)).toBeInTheDocument();
      expect(screen.getByText(mockSupabaseUser.user_metadata.name)).toBeInTheDocument();
    });
  });

  it('should show admin badge for admin users', () => {
    jest.doMock('@/contexts/OptimizedAuthContext', () => ({
      OptimizedAuthProvider: ({ children }: { children: React.ReactNode }) => children,
      useOptimizedAuth: () => ({
        user: mockAdminUser,
        loading: false,
        signOut: jest.fn(),
      }),
    }));

    renderWithAuth(mockAdminUser);

    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('should handle sign out', async () => {
    const mockSignOut = jest.fn();
    
    jest.doMock('@/contexts/OptimizedAuthContext', () => ({
      OptimizedAuthProvider: ({ children }: { children: React.ReactNode }) => children,
      useOptimizedAuth: () => ({
        user: mockSupabaseUser,
        loading: false,
        signOut: mockSignOut,
      }),
    }));

    renderWithAuth();

    const signOutButton = screen.getByRole('button', { name: /sign out/i });
    await userEvent.click(signOutButton);

    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  it('should show loading state', () => {
    jest.doMock('@/contexts/OptimizedAuthContext', () => ({
      OptimizedAuthProvider: ({ children }: { children: React.ReactNode }) => children,
      useOptimizedAuth: () => ({
        user: null,
        loading: true,
        signOut: jest.fn(),
      }),
    }));

    renderWithAuth();

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should handle no user state', () => {
    jest.doMock('@/contexts/OptimizedAuthContext', () => ({
      OptimizedAuthProvider: ({ children }: { children: React.ReactNode }) => children,
      useOptimizedAuth: () => ({
        user: null,
        loading: false,
        signOut: jest.fn(),
      }),
    }));

    renderWithAuth();

    expect(screen.getByText(/not signed in/i)).toBeInTheDocument();
  });
});