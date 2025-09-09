// Mock Supabase client for testing

export const mockSupabaseUser = {
  id: 'test-user-id-123',
  email: 'test@example.com',
  user_metadata: {
    name: 'Test User',
    role: 'user'
  },
  app_metadata: {},
  aud: 'authenticated',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
};

export const mockAdminUser = {
  ...mockSupabaseUser,
  id: 'admin-user-id-123',
  email: 'admin@example.com',
  user_metadata: {
    name: 'Admin User',
    role: 'admin'
  }
};

export const mockSupabaseAuthResponse = {
  data: {
    user: mockSupabaseUser,
    session: {
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      expires_at: Date.now() + 3600000,
      user: mockSupabaseUser,
    }
  },
  error: null
};

export const mockSupabaseQuery = {
  data: [],
  error: null,
  count: 0,
  status: 200,
  statusText: 'OK'
};

const createMockQueryBuilder = () => {
  const queryBuilder = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    like: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    contains: jest.fn().mockReturnThis(),
    containedBy: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    and: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue(mockSupabaseQuery),
    maybeSingle: jest.fn().mockResolvedValue(mockSupabaseQuery),
    then: jest.fn().mockResolvedValue(mockSupabaseQuery),
    mockResolvedValueOnce: jest.fn(function(value) {
      this.then.mockResolvedValueOnce(value);
      this.single.mockResolvedValueOnce(value);
      this.maybeSingle.mockResolvedValueOnce(value);
      return this;
    }),
  };
  
  // Ensure all methods return the same instance for chaining
  Object.keys(queryBuilder).forEach(key => {
    if (typeof queryBuilder[key] === 'function' && key !== 'then' && key !== 'single' && key !== 'maybeSingle' && key !== 'mockResolvedValueOnce') {
      queryBuilder[key].mockReturnValue(queryBuilder);
    }
  });
  
  return queryBuilder;
};

export const mockSupabaseClient = {
  // Auth methods
  auth: {
    getUser: jest.fn().mockResolvedValue(mockSupabaseAuthResponse),
    getSession: jest.fn().mockResolvedValue(mockSupabaseAuthResponse),
    signInWithPassword: jest.fn().mockResolvedValue(mockSupabaseAuthResponse),
    signUp: jest.fn().mockResolvedValue(mockSupabaseAuthResponse),
    signOut: jest.fn().mockResolvedValue({ error: null }),
    onAuthStateChange: jest.fn().mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } }
    }),
  },

  // Database methods
  from: jest.fn(() => createMockQueryBuilder()),

  // RPC methods
  rpc: jest.fn().mockResolvedValue(mockSupabaseQuery),

  // Storage methods
  storage: {
    from: jest.fn().mockReturnValue({
      upload: jest.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null }),
      download: jest.fn().mockResolvedValue({ data: new Blob(), error: null }),
      remove: jest.fn().mockResolvedValue({ data: null, error: null }),
      list: jest.fn().mockResolvedValue({ data: [], error: null }),
      getPublicUrl: jest.fn().mockReturnValue({ 
        data: { publicUrl: 'https://example.com/file.jpg' } 
      }),
    }),
  },
};

// Mock the Supabase client creation functions
export const createClientComponentClient = jest.fn(() => mockSupabaseClient);
export const createRouteHandlerClient = jest.fn(() => mockSupabaseClient);
export const createServerComponentClient = jest.fn(() => mockSupabaseClient);

// Mock the default export
const mockSupabase = mockSupabaseClient;
export default mockSupabase;