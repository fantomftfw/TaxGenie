import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle, TrendingUp, TrendingDown, Scale } from 'lucide-react';
import { cn } from "@/lib/utils";

// Re-define or import the CalculationResult interface if not globally available
interface CalculationResult {
  grossTotalIncome: number;
  netTaxableIncomeOld: number;
  netTaxableIncomeNew: number;
  taxPayableOld: number;
  taxPayableNew: number;
  recommendedRegime: 'old' | 'new' | 'either';
  taxSavingsNewVsOld: number; // Positive if new is better, negative if old is better
}

// Define the props for the component
export interface RegimeComparisonProps { // Export the interface
  result: CalculationResult;
  formatCurrency: (value: number | undefined | null) => string;
}

export function RegimeComparison({ result, formatCurrency }: RegimeComparisonProps) {
  // Add safeguard check for the result prop
  if (!result) {
    console.error("RegimeComparison rendered with invalid result prop:", result);
    // Optionally return a placeholder or null
    return <div className="text-center text-muted-foreground p-4">Calculating results or encountered an issue...</div>;
  }

  const { 
    taxPayableOld, 
    taxPayableNew, 
    recommendedRegime, 
    taxSavingsNewVsOld, 
    netTaxableIncomeOld,
    netTaxableIncomeNew,
    grossTotalIncome // Included for potential future use
  } = result;

  const isNewRegimeBetter = recommendedRegime === 'new';
  const isOldRegimeBetter = recommendedRegime === 'old';
  const savingsAmount = Math.abs(taxSavingsNewVsOld);
  const savingsText = isNewRegimeBetter 
    ? `Save ${formatCurrency(savingsAmount)} with New Regime`
    : isOldRegimeBetter
    ? `Save ${formatCurrency(savingsAmount)} with Old Regime`
    : "Tax liability is the same under both regimes.";

  return (
    <div className="space-y-6">
      {/* Recommendation Banner */}
      <div 
        className={cn(
          "p-4 rounded-lg flex items-center gap-3 border",
          isNewRegimeBetter ? "bg-primary/10 border-primary/30 text-primary" :
          isOldRegimeBetter ? "bg-muted border-border text-muted-foreground" :
          "bg-muted/50 border-border text-muted-foreground"
        )}
      >
        {isNewRegimeBetter || isOldRegimeBetter ? <CheckCircle className="h-5 w-5 flex-shrink-0" /> : <Scale className="h-5 w-5 flex-shrink-0" />}
        <span className="text-sm font-medium">{savingsText}</span>
      </div>

      {/* Comparison Table/Cards */}
      <div className="flex flex-col gap-6">
        {/* Old Regime Card */}
        <Card className={cn(
            "relative border-border transition-all",
             isOldRegimeBetter && "border-2 border-foreground shadow-lg scale-[1.02]"
        )}>
          {isOldRegimeBetter && (
            <span className="absolute top-2 right-2 bg-foreground text-background text-xs font-semibold px-2 py-0.5 rounded-full z-10">Recommended</span>
          )}
          <CardHeader>
            <CardTitle className="text-foreground">Old Tax Regime</CardTitle>
            <CardDescription>Based on your deductions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Taxable Income:</span> <span className="font-medium">{formatCurrency(netTaxableIncomeOld)}</span></div>
            <div className="flex justify-between border-t pt-2 mt-2"><span>Estimated Tax:</span> <span className="font-bold text-lg text-foreground">{formatCurrency(taxPayableOld)}</span></div>
          </CardContent>
        </Card>

        {/* New Regime Card */}
        <Card className={cn("relative border-primary/40 transition-all", isNewRegimeBetter && "border-2 border-primary shadow-lg scale-[1.02]")}>
           {isNewRegimeBetter && (
            <span className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs font-semibold px-2 py-0.5 rounded-full z-10">Recommended</span>
          )}
          <CardHeader>
            <CardTitle className="text-primary">New Tax Regime</CardTitle>
            <CardDescription>(Default)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
             <div className="flex justify-between"><span>Taxable Income:</span> <span className="font-medium">{formatCurrency(netTaxableIncomeNew)}</span></div>
             <div className="flex justify-between border-t pt-2 mt-2"><span>Estimated Tax:</span> <span className="font-bold text-lg text-primary">{formatCurrency(taxPayableNew)}</span></div>
          </CardContent>
        </Card>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-muted-foreground text-center pt-4">
        * This calculation is an estimate based on the information provided and standard deductions/exemptions applicable under each regime for FY 2024-25. Consult a tax professional for precise advice.
      </p>
    </div>
  );
}
