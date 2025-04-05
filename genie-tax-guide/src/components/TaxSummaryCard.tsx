import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TaxSummaryCardProps {
  title: string;
  amount: number | null | undefined;
  previousAmount?: number;
  percentChange?: number;
  className?: string;
  variant?: "default" | "income" | "saving" | "expense";
  footer?: React.ReactNode;
}

export function TaxSummaryCard({
  title,
  amount,
  previousAmount,
  percentChange,
  className,
  variant = "default",
  footer,
}: TaxSummaryCardProps) {
  const isIncrease = percentChange !== undefined ? percentChange > 0 : undefined;
  const variants = {
    default: "",
    income: "",
    saving: "",
    expense: "",
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return 'N/A';
    if (!Number.isFinite(value)) return 'Invalid Number'; 
    return `₹ ${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <span className="text-2xl font-bold tracking-tight">
          {formatCurrency(amount)}
        </span>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="flex flex-col gap-2">
          {footer && <div className="mt-1 text-xs text-muted-foreground">{footer}</div>}
        </div>
      </CardContent>
    </Card>
  );
}
