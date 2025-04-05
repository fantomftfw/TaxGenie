import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

// Define more specific types based on backend responses
type User = {
  id: number; // Assuming backend uses integer IDs
  email: string;
  onboarding_completed: boolean;
};

// Profile can be the same as User for now, or expanded later
type ProfileData = User & { // Example: adding full_name if needed later
  full_name?: string | null;
  // Add other profile fields as needed
};

export type AuthState = {
  user: User | null;
  token: string | null; // Store JWT
  isLoading: boolean;
};


type AuthContextType = {
  authState: AuthState;
  profile: ProfileData | null; // Keep profile separate if it contains more/different data
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => void;
  updateProfile: (data: Partial<ProfileData>) => Promise<{ error: string | null }>; // Re-enable type
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define API base URL (could be env variable)
// Use relative paths now, letting Vite proxy handle it
const API_BASE_URL = '/api';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true, // Start loading until auth status is checked
  });
  const [profile, setProfile] = useState<ProfileData | null>(null); // Keep profile separate

  // Function to check auth status by verifying token and fetching profile
  const checkAuthStatus = useCallback(async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setAuthState({ user: null, token: null, isLoading: false });
      setProfile(null);
      return;
    }

    try {
      // Fetch profile using the token
      const response = await fetch(`${API_BASE_URL}/user/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // Token might be invalid or expired
        if (response.status === 401 || response.status === 403) {
            console.log("Token invalid/expired, signing out.");
            signOut(); // Use the signOut function to clear state and token
        } else {
             throw new Error(`Failed to fetch profile: ${response.statusText}`);
        }
        return;
      }

      const data = await response.json();
      if (data.user) {
        console.log("Auth check successful, user:", data.user);
        setAuthState({
          user: data.user,
          token: token,
          isLoading: false,
        });
        setProfile(data.user); // Set profile data
      } else {
         throw new Error("User data not found in profile response");
      }

    } catch (error) {
      console.error("Error checking auth status:", error);
      // Clear state on error
      signOut();
    }
  }, []); // No dependencies needed initially

  // Check auth status on initial mount
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  // --- API-based Authentication Functions ---

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      if (data.accessToken && data.user) {
        localStorage.setItem('authToken', data.accessToken);
        setAuthState({
          user: data.user,
          token: data.accessToken,
          isLoading: false,
        });
        setProfile(data.user);
        console.log("Sign in successful");
        return { error: null };
      } else {
        throw new Error('Invalid login response from server');
      }
    } catch (error: any) {
      console.error("Sign in error:", error);
      setAuthState({ user: null, token: null, isLoading: false });
      setProfile(null);
      return { error: error.message || 'An unknown error occurred during sign in.' };
    }
  };

  const signUp = async (email: string, password: string): Promise<{ error: string | null }> => {
     setAuthState(prev => ({ ...prev, isLoading: true }));
     try {
        const response = await fetch(`${API_BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Sign up failed');
        }

        // Optionally sign in the user automatically after successful signup
        // Or prompt them to log in
        console.log("Sign up successful:", data.message);
        setAuthState(prev => ({ ...prev, isLoading: false })); // Stop loading after signup
        // Don't set user/token state here, require login after signup
        return { error: null };

     } catch (error: any) {
        console.error("Sign up error:", error);
        setAuthState({ user: null, token: null, isLoading: false }); // Reset on error
        return { error: error.message || 'An unknown error occurred during sign up.' };
     }
  };

  const signOut = () => {
    console.log("Signing out...");
    localStorage.removeItem('authToken');
    setAuthState({
      user: null,
      token: null,
      isLoading: false,
    });
    setProfile(null);
  };

  // --- Update Profile Function ---
  const updateProfile = async (dataToUpdate: Partial<ProfileData>): Promise<{ error: string | null }> => {
    if (!authState.token) {
        return { error: "Not authenticated" };
    }
    // Only allow updating specific fields for now (e.g., onboarding_completed)
    // We might need a more specific type for the input data if updating other fields
    const updatePayload: { onboarding_completed?: boolean } = {};
    if (typeof dataToUpdate.onboarding_completed === 'boolean') {
        updatePayload.onboarding_completed = dataToUpdate.onboarding_completed;
    } else {
        // Optionally handle other profile fields if needed
        // console.warn("Only updating onboarding_completed is currently supported.");
        return { error: "Invalid data for profile update." }; // Or handle specific fields
    }

    setAuthState(prev => ({ ...prev, isLoading: true })); // Optional: Indicate loading

    try {
        const response = await fetch(`${API_BASE_URL}/user/profile`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authState.token}`,
            },
            body: JSON.stringify(updatePayload),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to update profile');
        }

        // Update local profile state on success
        setProfile(prevProfile => prevProfile ? { ...prevProfile, ...updatePayload } : null);
        // Also update user in authState if it holds same data
        setAuthState(prev => prev.user ? { ...prev, isLoading: false, user: {...prev.user, ...updatePayload} } : { ...prev, isLoading: false });

        console.log("Profile update successful");
        return { error: null };

    } catch (error: any) {
        console.error("Update profile error:", error);
        setAuthState(prev => ({ ...prev, isLoading: false })); // Stop loading on error
        return { error: error.message || 'An unknown error occurred during profile update.' };
    }
  };

  return (
    <AuthContext.Provider value={{
      authState,
      profile,
      signIn,
      signUp,
      signOut,
      updateProfile // Add back to context value
    }}>
      {children}
    </AuthContext.Provider>
  );
};
