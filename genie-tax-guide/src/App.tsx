import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Dashboard from "./pages/Dashboard";
import Calculator from "./pages/Calculator";
import Documents from "./pages/Documents";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import { DashboardProvider } from "./contexts/DashboardContext";
import AdminSettings from "./pages/AdminSettings";

// Create a new query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Component to wrap authenticated routes with necessary providers
const AuthenticatedApp = ({ children }: { children: React.ReactNode }) => {
  const { authState, profile } = useAuth();

  if (authState.isLoading) {
    // Show loading state
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  if (!authState.user) {
    return <Navigate to="/auth" replace />;
  }

  // If user hasn't completed onboarding, redirect to onboarding
  // Check profile directly now as authState might not have updated immediately after signup->login
  if (profile && !profile.onboarding_completed) {
    return <Navigate to="/onboarding" replace />;
  }

  // Wrap authenticated content with DashboardProvider
  return <DashboardProvider>{children}</DashboardProvider>;
};

// Separate component for unauthenticated routes (optional, but clean)
const UnauthenticatedApp = ({ children }: { children: React.ReactNode }) => {
  const { authState } = useAuth();
  
  if (authState.isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-primary">Loading...</div>
        </div>
      );
  }

  if (authState.user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

// Define routes
const AppRoutes = () => {
  return (
    <Routes>
      {/* Authenticated routes wrapped in AuthenticatedApp */}
      <Route path="/" element={<AuthenticatedApp><Dashboard /></AuthenticatedApp>} />
      <Route path="/calculator" element={<AuthenticatedApp><Calculator /></AuthenticatedApp>} />
      <Route path="/documents" element={<AuthenticatedApp><Documents /></AuthenticatedApp>} />
      
      {/* Onboarding route - used by redirect logic */}
      <Route path="/onboarding" element={<Onboarding />} /> 

      {/* ADDED: Test route for onboarding - Bypasses completion check */}
      <Route path="/onboarding-test" element={<Onboarding />} />

      {/* Unauthenticated routes wrapped in UnauthenticatedApp*/}
      <Route path="/auth" element={<UnauthenticatedApp><Auth /></UnauthenticatedApp>} />

      {/* Admin route (TODO: Add proper admin protection) */}
      <Route path="/admin/settings" element={<AdminSettings />} />

      {/* Catch-all route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  console.log("App rendering");
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
          <Toaster />
          <Sonner />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
