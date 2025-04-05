import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext'; // Import useAuth to get token

// Define API_BASE_URL using the same pattern
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Define the shape of the data we want to share
interface DashboardData {
  estimatedAnnualGross: number | null;
  estimatedTaxOldRegime: number | null;
  estimatedTaxNewRegime: number | null;
  estimatedTaxSavings: number | null; // Positive means New regime saves
  recommendedRegime: 'old' | 'new' | null;
  financialYear: string | null;
  latestParsedSalaryData: Record<string, any> | null; // Add state for full parsed data
  // Add other relevant fields from parsedData if needed
  // estimatedAnnualBasic: number | null;
  // lastUploadedDocType: string | null;
}

// Define the context type
interface DashboardContextType {
  dashboardData: DashboardData;
  updateDashboardData: (newData: Partial<DashboardData>) => void;
  isLoadingSummary: boolean; // Add loading state
  summaryError: string | null; // Add error state
}

// Create the context with a default value
const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

// Create a provider component
interface DashboardProviderProps {
  children: ReactNode;
}

export const DashboardProvider: React.FC<DashboardProviderProps> = ({ children }) => {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    estimatedAnnualGross: null, 
    estimatedTaxOldRegime: null,
    estimatedTaxNewRegime: null,
    estimatedTaxSavings: null,
    recommendedRegime: null,
    financialYear: null,
    latestParsedSalaryData: null,
  });
  const [isLoadingSummary, setIsLoadingSummary] = useState(true); // Loading state for summary fetch
  const [summaryError, setSummaryError] = useState<string | null>(null); // Error state
  
  const { authState } = useAuth(); // Get auth state for token and loading status

  // Fetch initial dashboard summary data when authenticated
  const fetchSummary = useCallback(async () => {
    if (!authState.token) {
      // Don't fetch if not authenticated
      setIsLoadingSummary(false);
      setSummaryError("User not authenticated.");
      return;
    }

    setIsLoadingSummary(true);
    setSummaryError(null);

    try {
      // Update fetch URL and add Authorization header
      const response = await fetch(`${API_BASE_URL}/dashboard-summary`, {
        headers: {
          'Authorization': `Bearer ${authState.token}`,
        },
      });
      
      // Check for non-JSON responses before trying to parse
      const contentType = response.headers.get("content-type");
      if (!response.ok) {
           // Try to get error message from JSON if possible, otherwise use status text
           let errorMsg = `HTTP error! status: ${response.status} ${response.statusText}`;
           if (contentType && contentType.indexOf("application/json") !== -1) {
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.error || errorMsg;
                } catch (jsonError) {
                    // Ignore JSON parse error if response wasn't JSON
                }
           }
           throw new Error(errorMsg);
      }
      
      // Ensure response is JSON before parsing
      if (!contentType || contentType.indexOf("application/json") === -1) {
          throw new Error(`Received non-JSON response from server. Content-Type: ${contentType}`);
      }

      const data = await response.json();
      console.log("Received dashboard summary:", data);
      setDashboardData(data.summary); // Backend wraps data in a 'summary' object

    } catch (error: any) {
      console.error("DashboardProvider: Error fetching summary:", error);
      setSummaryError(error.message || "Failed to fetch dashboard summary.");
      setDashboardData({
        estimatedAnnualGross: null, estimatedTaxOldRegime: null, estimatedTaxNewRegime: null,
        estimatedTaxSavings: null, recommendedRegime: null, financialYear: null,
        latestParsedSalaryData: null
      }); // Clear data on error
    } finally {
      setIsLoadingSummary(false);
    }
  }, [authState.token]); // Dependency on token

  // Fetch summary when the provider mounts or token changes
  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const updateDashboardData = (newData: Partial<DashboardData>) => {
    setDashboardData(prevData => ({ ...prevData, ...newData }));
    console.log("Dashboard data updated via updateDashboardData:", { ...dashboardData, ...newData });
  };

  return (
    <DashboardContext.Provider value={{ 
        dashboardData, 
        updateDashboardData, 
        isLoadingSummary, // Provide loading state
        summaryError // Provide error state
    }}>
      {children}
    </DashboardContext.Provider>
  );
};

// Create a custom hook to use the context
export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}; 