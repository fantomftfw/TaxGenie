
import React from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface RegimeProps {
  oldRegimeTax: number;
  newRegimeTax: number;
  savings: number;
  recommendedRegime: "old" | "new";
}

export function RegimeComparison({ 
  oldRegimeTax, 
  newRegimeTax,
  savings,
  recommendedRegime
}: RegimeProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  const maxValue = Math.max(oldRegimeTax, newRegimeTax);
  const oldPercentage = (oldRegimeTax / maxValue) * 100;
  const newPercentage = (newRegimeTax / maxValue) * 100;
  
  return (
    <Card className="p-6">
      <h3 className="text-lg font-medium mb-4">Tax Regime Comparison</h3>
      
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Old Regime</span>
            <span className="text-sm font-semibold">{formatCurrency(oldRegimeTax)}</span>
          </div>
          <div className="relative w-full">
            <Progress value={oldPercentage} className="h-2 bg-secondary" />
            <div 
              className="absolute top-0 left-0 h-2 bg-tax-secondary rounded-full" 
              style={{ width: `${oldPercentage}%` }} 
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">New Regime</span>
            <span className="text-sm font-semibold">{formatCurrency(newRegimeTax)}</span>
          </div>
          <div className="relative w-full">
            <Progress value={newPercentage} className="h-2 bg-secondary" />
            <div 
              className="absolute top-0 left-0 h-2 bg-tax-primary rounded-full" 
              style={{ width: `${newPercentage}%` }} 
            />
          </div>
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-tax-lightgray rounded-lg">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-accent w-8 h-8 flex items-center justify-center text-white text-sm mt-1">
            <span>💡</span>
          </div>
          <div>
            <h4 className="font-medium text-sm">Recommended: {recommendedRegime === "old" ? "Old Regime" : "New Regime"}</h4>
            <p className="text-sm text-muted-foreground mt-1">
              You can save {formatCurrency(savings)} with the {recommendedRegime} regime.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
