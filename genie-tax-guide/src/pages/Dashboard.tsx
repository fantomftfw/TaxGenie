import { TaxSummaryCard } from "@/components/TaxSummaryCard";
import { RegimeComparison } from "@/components/RegimeComparison";
import { TaxSavingCard } from "@/components/TaxSavingCard";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ArrowRight, FileText, PlusCircle, Upload } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useDashboard } from "@/contexts/DashboardContext";
import { useState } from "react";
import { SalaryBreakdownModal } from "@/components/SalaryBreakdownModal";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useNavigate } from 'react-router-dom';

// Helper function to format currency
const formatCurrency = (value: number | null | undefined) => {
  if (value === null || value === undefined) return 'N/A';
  return `₹ ${value.toLocaleString('en-IN')}`;
};

export default function Dashboard() {
  const currentUser = { name: "Jay" };
  const { dashboardData, isLoadingSummary, summaryError } = useDashboard();
  const navigate = useNavigate();
  const [isBreakdownModalOpen, setIsBreakdownModalOpen] = useState(false);

  // Loading State UI
  if (isLoadingSummary) {
      return (
          <DashboardLayout>
              <div className="mb-8">
                <Skeleton className="h-8 w-1/2 mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <Skeleton className="h-32 rounded-lg" />
                  <Skeleton className="h-32 rounded-lg" />
                  <Skeleton className="h-32 rounded-lg" />
              </div>
               {/* Add more skeletons for other sections if desired */}
          </DashboardLayout>
      )
  }

  // Error State UI
  if (summaryError) {
      return (
           <DashboardLayout>
               <div className="mb-8">
                   <h1 className="text-2xl font-semibold mb-1">Welcome back, {currentUser.name}!</h1>
                   <p className="text-muted-foreground">Unable to load your tax overview.</p>
               </div>
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error Loading Dashboard Data</AlertTitle>
                  <AlertDescription>{summaryError}</AlertDescription>
                </Alert>
           </DashboardLayout>
      )
  }

  // Empty State UI
  if (!dashboardData) {
      return (
           <DashboardLayout>
               <div className="mb-8">
                   <h1 className="text-2xl font-semibold mb-1">Welcome back, {currentUser.name}!</h1>
                   <p className="text-muted-foreground">Let's get started with your tax overview.</p>
               </div>
               <Card className="py-12 text-center border-dashed">
                 <div className="flex flex-col items-center gap-3">
                   <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                     <FileText className="h-8 w-8 text-primary" />
                   </div>
                   <h3 className="text-lg font-medium mt-4">Upload Your First Document</h3>
                   <p className="text-sm text-muted-foreground max-w-md mx-auto">
                     To see your personalized tax dashboard, upload your Form 16 or a recent salary slip.
                     We'll automatically extract the details.
                   </p>
                   <Button className="mt-6 gap-2" onClick={() => navigate('/documents')}>
                     <Upload className="h-4 w-4" />
                     Upload Document
                   </Button>
                 </div>
               </Card>
           </DashboardLayout>
      )
  }

  // Only destructure and calculate if dashboardData is NOT null
  const { 
      estimatedAnnualGross,
      estimatedTaxOldRegime,
      estimatedTaxNewRegime,
      estimatedTaxSavings,
      recommendedRegime,
      financialYear,
      latestParsedSalaryData
  } = dashboardData;

  // Determine which tax liability to display (e.g., the recommended one, or new regime default)
  const displayedTaxLiability = recommendedRegime === 'old' ? estimatedTaxOldRegime : estimatedTaxNewRegime;
  const potentialSavings = estimatedTaxSavings; // Use directly from data if available
  const salaryBreakdownData = latestParsedSalaryData; // Assign directly

  // Normal Display (Data loaded without error AND data exists)
  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-1">Welcome back, {currentUser.name}!</h1>
        <p className="text-muted-foreground">
          Here's an overview of your tax situation {financialYear ? `for FY ${financialYear}` : ''}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <TaxSummaryCard 
          title="Total Income (Est. Annual)"
          amount={estimatedAnnualGross}
          variant="income"
          footer={
            <Button 
              variant="link"
              size="sm"
              className="p-0 h-auto text-xs text-muted-foreground hover:text-primary"
              onClick={() => setIsBreakdownModalOpen(true)} 
              disabled={!estimatedAnnualGross}
            >
               See Salary Breakdown
            </Button>
          }
        />
        <TaxSummaryCard 
          title="Est. Tax Liability"
          amount={displayedTaxLiability}
          variant="expense"
        />
        <TaxSummaryCard 
          title="Potential Savings (vs Other Regime)"
          amount={estimatedTaxSavings}
          variant="saving"
        />
      </div>

      <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Tax Regime Comparison</h2>
          <RegimeComparison 
            oldRegimeTax={estimatedTaxOldRegime}
            newRegimeTax={estimatedTaxNewRegime}
            savings={Math.abs(estimatedTaxSavings ?? 0)} 
            recommendedRegime={recommendedRegime}
          />
      </div>

      {/* Render the Modal */}
      <SalaryBreakdownModal 
        isOpen={isBreakdownModalOpen}
        setIsOpen={setIsBreakdownModalOpen}
        salaryData={salaryBreakdownData}
      />
    </DashboardLayout>
  );
}
