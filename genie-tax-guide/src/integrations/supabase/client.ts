
// This is a placeholder file for compatibility with existing imports
// We've removed actual Supabase functionality and switched to local auth

// Create a mock client that does nothing
const mockClient = {
  auth: {
    getSession: async () => null,
    getUser: async () => null,
    signOut: async () => {}
  },
  from: () => ({
    select: () => ({
      eq: () => ({
        single: async () => null,
        data: null,
        error: null
      })
    }),
    update: () => ({
      eq: () => ({
        single: async () => null
      })
    }),
    insert: () => ({
      single: async () => null
    })
  }),
  storage: {
    from: () => ({
      upload: async () => ({ data: null, error: null }),
      getPublicUrl: () => ({ data: { publicUrl: '' } })
    })
  }
};

export const supabase = mockClient;
