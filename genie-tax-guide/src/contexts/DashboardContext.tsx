import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useAuth } from './AuthContext'; // Import useAuth to get token

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
  useEffect(() => {
    const fetchDashboardSummary = async () => {
      if (!authState.token) { // Ensure token exists
         console.log("DashboardProvider: No token, skipping summary fetch.");
         setIsLoadingSummary(false);
         // Reset data if user logs out?
         setDashboardData({
              estimatedAnnualGross: null, estimatedTaxOldRegime: null, estimatedTaxNewRegime: null,
              estimatedTaxSavings: null, recommendedRegime: null, financialYear: null,
              latestParsedSalaryData: null
          });
         return;
      }
      
      console.log("DashboardProvider: Auth token found, fetching summary...");
      setIsLoadingSummary(true);
      setSummaryError(null);

      try {
        const response = await fetch('/api/dashboard-summary', {
          headers: {
            'Authorization': `Bearer ${authState.token}`,
          },
        });
        
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to fetch dashboard summary');
        }

        if (result.summary) {
            console.log("DashboardProvider: Summary fetched successfully", result.summary);
            updateDashboardData(result.summary); // Update state with fetched data
        } else {
            console.log("DashboardProvider: No summary data returned from backend.");
             // Keep initial null state if no summary found
             setDashboardData({
                estimatedAnnualGross: null, estimatedTaxOldRegime: null, estimatedTaxNewRegime: null,
                estimatedTaxSavings: null, recommendedRegime: null, financialYear: null,
                latestParsedSalaryData: null
            });
        }

      } catch (error: any) {
        console.error("DashboardProvider: Error fetching summary:", error);
        setSummaryError(error.message || 'Could not load dashboard data.');
        // Reset data on error
         setDashboardData({
              estimatedAnnualGross: null, estimatedTaxOldRegime: null, estimatedTaxNewRegime: null,
              estimatedTaxSavings: null, recommendedRegime: null, financialYear: null,
              latestParsedSalaryData: null
          });
      } finally {
        setIsLoadingSummary(false);
      }
    };

    // Only fetch when auth is no longer loading AND token is present/absent
    if (!authState.isLoading) {
        fetchDashboardSummary();
    }

  }, [authState.token, authState.isLoading]); // Depend on token and auth loading state

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