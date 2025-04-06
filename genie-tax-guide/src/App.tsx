import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Calculator from "./pages/Calculator";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/AuthPage";
import LandingPage from "./pages/LandingPage";
import { ThemeProvider } from "next-themes";

// Create a new query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// AuthenticatedAppLayout might not be needed anymore if no shared layout for auth pages remains
// We can remove it if Onboarding/Settings etc are also removed or made public
// For now, let's keep it minimal but potentially unused
const AuthenticatedAppLayout = () => {
  const { authState } = useAuth();
  if (authState.isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-pulse text-primary">Loading App...</div></div>;
  }
  if (!authState.user) {
    return <Navigate to="/login" state={{ from: window.location.pathname }} replace />;
  }
  // Remove onboarding check if onboarding page is removed/public
  // Remove profile check if profile page is removed/public
  return <Outlet />; // Just renders the child route
};

// Separate component for unauthenticated routes (Login/Signup)
const UnauthenticatedLayout = () => {
  const { authState } = useAuth();

  if (authState.isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="animate-pulse text-primary">Loading Auth...</div>
        </div>
      );
  }

  // If user IS logged in, redirect them away from login/signup to the Landing Page
  if (authState.user) {
    return <Navigate to="/" replace />; // Redirect to Landing Page
  }

  return <Outlet />;
}

// Define routes
const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/calculator" element={<Calculator />} />
      <Route path="/about" element={<div>About Us Page (Placeholder)</div>} />

      {/* Unauthenticated Routes (Login/Signup) */}
      <Route element={<UnauthenticatedLayout />}>
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/signup" element={<AuthPage mode="signup" />} />
      </Route>

      {/* Removed all /app routes */}

      {/* Catch-all route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  console.log("App rendering - Revised Routes");
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <TooltipProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
            <Toaster />
            <Sonner position="bottom-right" />
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
