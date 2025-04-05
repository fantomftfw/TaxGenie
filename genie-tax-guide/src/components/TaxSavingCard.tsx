
import { ArrowRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface TaxSavingCardProps {
  title: string;
  description: string;
  section: string;
  maxAmount: number;
  usedAmount: number;
  potentialSaving: number;
  onClick: () => void;
}

export function TaxSavingCard({
  title,
  description,
  section,
  maxAmount,
  usedAmount,
  potentialSaving,
  onClick,
}: TaxSavingCardProps) {
  const percentage = Math.min(100, (usedAmount / maxAmount) * 100);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card className="overflow-hidden border-tax-light">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-medium text-base">{title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
          <span className="px-2 py-1 bg-tax-light text-tax-primary text-xs rounded-md">
            {section}
          </span>
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium">
              {formatCurrency(usedAmount)} of {formatCurrency(maxAmount)}
            </span>
            <span className="text-muted-foreground">{Math.round(percentage)}%</span>
          </div>
          <Progress value={percentage} className="h-2" />
        </div>

        <div className="mt-4 p-3 bg-accent/10 rounded-lg">
          <p className="text-sm">
            <span className="font-medium text-accent">Potential saving: </span>
            <span>{formatCurrency(potentialSaving)}</span>
          </p>
        </div>
      </CardContent>

      <CardFooter className="p-0">
        <Button
          onClick={onClick}
          variant="ghost"
          className="w-full rounded-none py-3 text-tax-primary hover:bg-tax-light hover:text-tax-primary"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Investment
        </Button>
      </CardFooter>
    </Card>
  );
}
