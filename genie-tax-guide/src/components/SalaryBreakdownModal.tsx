import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface SalaryBreakdownModalProps {
  trigger?: React.ReactNode; // Optional custom trigger
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  salaryData: Record<string, any> | null;
}

// Helper function to format currency (copied from Dashboard)
const formatCurrency = (value: number | null | undefined) => {
  if (value === null || value === undefined) return 'N/A';
  return `₹ ${value.toLocaleString('en-IN')}`;
};

export function SalaryBreakdownModal({ 
    trigger,
    isOpen,
    setIsOpen,
    salaryData 
}: SalaryBreakdownModalProps) {

  // Define which keys to display and their labels
  const displayFields = [
    { key: 'basic', label: 'Basic Salary' },
    { key: 'hra', label: 'HRA' },
    { key: 'specialAllowance', label: 'Special Allowance' },
    { key: 'otherAllowances', label: 'Other Allowances' },
    { key: 'grossEarnings', label: 'Gross Earnings' },
    { key: 'employeePf', label: 'Employee PF' },
    { key: 'professionalTax', label: 'Professional Tax' },
    { key: 'tds', label: 'TDS (Tax Deducted)' },
    { key: 'totalDeductions', label: 'Total Deductions' },
    { key: 'netSalary', label: 'Net Salary' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Salary Breakdown</DialogTitle>
          <DialogDescription>
            Details extracted from {salaryData?.fileName || 'the uploaded document'}. 
            Figures are assumed monthly unless specified otherwise.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {salaryData ? (
            <div className="space-y-2">
              {displayFields.map(field => (
                <div key={field.key} className="flex justify-between text-sm border-b pb-1 last:border-b-0">
                  <span className="text-muted-foreground">{field.label}:</span>
                  <span className="font-medium">
                    {formatCurrency(salaryData[field.key])}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">No salary data available.</p>
          )}
        </div>
        <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="outline">
                 Close
                </Button>
            </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 