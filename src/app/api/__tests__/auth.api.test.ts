import { POST } from '../auth/login/route';
import { NextRequest } from 'next/server';
import { mockSupabaseClient, mockSupabaseAuthResponse } from '@/__mocks__/supabase';

jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createRouteHandlerClient: jest.fn(() => mockSupabaseClient),
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  })),
}));

describe('/api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle successful login', async () => {
    const loginData = {
      email: 'test@example.com',
      password: 'password123',
    };

    mockSupabaseClient.auth.signInWithPassword.mockResolvedValueOnce(mockSupabaseAuthResponse);

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(loginData),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.success).toBe(true);
    expect(result.user).toEqual(mockSupabaseAuthResponse.data.user);
    expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith(loginData);
  });

  it('should handle invalid credentials', async () => {
    const loginData = {
      email: 'test@example.com',
      password: 'wrongpassword',
    };

    const authError = {
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials', status: 400 },
    };

    mockSupabaseClient.auth.signInWithPassword.mockResolvedValueOnce(authError);

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(loginData),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid login credentials');
  });

  it('should handle missing email', async () => {
    const loginData = {
      password: 'password123',
    };

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(loginData),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.success).toBe(false);
    expect(result.error).toContain('email');
  });

  it('should handle missing password', async () => {
    const loginData = {
      email: 'test@example.com',
    };

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(loginData),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.success).toBe(false);
    expect(result.error).toContain('password');
  });

  it('should handle malformed JSON', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: 'invalid json',
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid JSON');
  });

  it('should handle network errors', async () => {
    const loginData = {
      email: 'test@example.com',
      password: 'password123',
    };

    mockSupabaseClient.auth.signInWithPassword.mockRejectedValueOnce(
      new Error('Network connection failed')
    );

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(loginData),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const result = await response.json();

    expect(response.status).toBe(500);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Authentication service temporarily unavailable');
  });
});