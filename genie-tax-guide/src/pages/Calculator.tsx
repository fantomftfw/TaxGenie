import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowRight, Loader2 } from "lucide-react";
import { RegimeComparison } from "@/components/RegimeComparison";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Interface for the expected backend response structure (adjust as needed)
interface CalculationResult {
  grossTotalIncome?: number;
  totalDeductions?: number;
  taxableIncome?: number;
  taxPayable?: number;
  // Add other fields returned by the backend if necessary
}

export default function Calculator() {
  const [activeTab, setActiveTab] = useState("income");
  // Consolidated state for all form inputs
  const [formData, setFormData] = useState({
    // Income
    basic: "",
    hra: "", // Renamed from hraReceived for consistency if backend expects 'hra'
    special: "",
    lta: "",
    otherIncome: "", // Renamed from 'other'
    epfContribution: "", // Renamed from 'epf' - this might be employer's or total, clarify
    professionalTax: "",
    // Deductions 80C
    deduction80C_epf: "", // Use epfContribution value?
    deduction80C_elss: "",
    deduction80C_insurance: "",
    deduction80C_ppf: "",
    deduction80C_tuition: "",
    deduction80C_housingLoanPrincipal: "",
    // Other Deductions
    deduction80D_selfFamily: "",
    deduction80D_parents: "",
    deduction80CCD1B_nps: "",
    deduction80TTA_savingsInterest: "",
    // Add other necessary deduction fields here (e.g., 80E, 80G, HRA Exemption details, Home Loan Interest Sec 24b)
    rentPaid: "", // For HRA calculation
    isMetroCity: false, // For HRA calculation
    homeLoanInterest: "" // For Sec 24b
  });

  // State for results, loading, and errors
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const inputValue = type === 'checkbox' ? checked : value;

    setFormData(prevData => {
      const updatedData = {
        ...prevData,
        [name]: inputValue // Update the changed input
      };

      // If the epfContribution input changed, update the corresponding 80C field
      // Ensure we use the string 'value', not the potentially boolean 'inputValue'
      if (name === 'epfContribution') {
        updatedData.deduction80C_epf = value;
      }

      return updatedData;
    });
  };

  const handleCalculate = async () => {
    setIsLoading(true);
    setError(null);
    setCalculationResult(null); // Clear previous results

    // Basic validation example (expand as needed)
    if (!formData.basic) {
        setError("Basic Salary is required.");
        setIsLoading(false);
        setActiveTab("income"); // Go back to income tab
        return;
    }

    console.log("Sending data to backend:", formData); // Log data being sent

    try {
      const response = await fetch('http://localhost:3001/api/calculate-tax', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

      const result = await response.json();
      console.log("Received response from backend:", result); // Log received data

      if (!response.ok) {
        // Throw error with message from backend if available, else generic message
        throw new Error(result.message || `HTTP error! status: ${response.status}`);
      }

      // Assuming backend returns data structure like { message: "...", calculatedTaxDetails: {...} }
      if (result.calculatedTaxDetails) {
         setCalculationResult(result.calculatedTaxDetails);
         setActiveTab("result"); // Move to result tab on success
      } else {
         throw new Error("Invalid response structure received from backend.");
      }

    } catch (err: any) {
        console.error("API Call failed:", err);
        setError(err.message || 'Failed to calculate tax. Please check your inputs and try again.');
        // Don't switch tab if there's an error
    } finally {
        setIsLoading(false);
    }
  };


  const handleNext = () => {
    if (activeTab === "income") {
      setActiveTab("deductions");
    } else if (activeTab === "deductions") {
      // Instead of directly setting tab, trigger calculation
      handleCalculate();
    }
  };

  const handleBack = () => {
    if (activeTab === "deductions") {
      setActiveTab("income");
    } else if (activeTab === "result") {
      setActiveTab("deductions");
    }
  };

  // Helper to format numbers as currency (optional)
  const formatCurrency = (value: number | undefined | null) => {
    if (value === undefined || value === null) return 'N/A';
    return `₹ ${value.toLocaleString('en-IN')}`;
  }

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-1">Tax Calculator</h1>
        <p className="text-muted-foreground">
          Calculate your tax liability under both old and new tax regimes
        </p>
      </div>

      <Card className="max-w-3xl mx-auto">
        <CardHeader className="border-b">
          <CardTitle>FY 2024-25 Tax Calculation</CardTitle>
          <CardDescription>
            Enter your income and deduction details to calculate your tax
          </CardDescription>
        </CardHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-6 pt-6">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="income">Income Details</TabsTrigger>
              <TabsTrigger value="deductions">Deductions</TabsTrigger>
              <TabsTrigger value="result">Result</TabsTrigger>
            </TabsList>
          </div>
          
          <CardContent className="pt-6 min-h-[300px]">
            <TabsContent value="income" className="space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="basic">Basic Salary *</Label>
                    <div className="input-field flex">
                      <span className="text-muted-foreground mr-2">₹</span>
                      <Input
                        id="basic"
                        name="basic"
                        placeholder="600,000"
                        className="border-0 p-0 focus-visible:ring-0"
                        type="number"
                        value={formData.basic}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="hra">HRA Received</Label>
                    <div className="input-field flex">
                      <span className="text-muted-foreground mr-2">₹</span>
                      <Input
                        id="hra"
                        name="hra"
                        placeholder="240,000"
                        className="border-0 p-0 focus-visible:ring-0"
                        type="number"
                        value={formData.hra}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="special">Special Allowance</Label>
                    <div className="input-field flex">
                      <span className="text-muted-foreground mr-2">₹</span>
                      <Input
                        id="special"
                        name="special"
                        placeholder="300,000"
                        className="border-0 p-0 focus-visible:ring-0"
                        type="number"
                        value={formData.special}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lta">LTA</Label>
                    <div className="input-field flex">
                      <span className="text-muted-foreground mr-2">₹</span>
                      <Input
                        id="lta"
                        name="lta"
                        placeholder="50,000"
                        className="border-0 p-0 focus-visible:ring-0"
                        type="number"
                        value={formData.lta}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="epfContribution">EPF Contribution (e.g., 12% of Basic)</Label>
                    <div className="input-field flex">
                      <span className="text-muted-foreground mr-2">₹</span>
                      <Input
                        id="epfContribution"
                        name="epfContribution"
                        placeholder="72,000"
                        className="border-0 p-0 focus-visible:ring-0"
                        type="number"
                        value={formData.epfContribution}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="professionalTax">Professional Tax</Label>
                    <div className="input-field flex">
                      <span className="text-muted-foreground mr-2">₹</span>
                      <Input
                        id="professionalTax"
                        name="professionalTax"
                        placeholder="2,400"
                        className="border-0 p-0 focus-visible:ring-0"
                        type="number"
                        value={formData.professionalTax}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="otherIncome">Other Income (Interest, etc.)</Label>
                    <div className="input-field flex">
                      <span className="text-muted-foreground mr-2">₹</span>
                      <Input
                        id="otherIncome"
                        name="otherIncome"
                        placeholder="10,000"
                        className="border-0 p-0 focus-visible:ring-0"
                        type="number"
                        value={formData.otherIncome}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="deductions" className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium">Section 80C (Limit: ₹1,50,000)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="deduction80C_epf">EPF Contribution</Label>
                    <div className="input-field flex">
                      <span className="text-muted-foreground mr-2">₹</span>
                      <Input
                        id="deduction80C_epf"
                        name="deduction80C_epf"
                        placeholder="72,000"
                        className="border-0 p-0 focus-visible:ring-0 bg-muted"
                        type="number"
                        value={formData.deduction80C_epf}
                        readOnly
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="deduction80C_elss">ELSS Investment</Label>
                    <div className="input-field flex">
                      <span className="text-muted-foreground mr-2">₹</span>
                      <Input
                        id="deduction80C_elss"
                        name="deduction80C_elss"
                        placeholder="50,000"
                        className="border-0 p-0 focus-visible:ring-0"
                        type="number"
                        value={formData.deduction80C_elss}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="deduction80C_insurance">Life Insurance Premium</Label>
                    <div className="input-field flex">
                      <span className="text-muted-foreground mr-2">₹</span>
                      <Input
                        id="deduction80C_insurance"
                        name="deduction80C_insurance"
                        placeholder="25,000"
                        className="border-0 p-0 focus-visible:ring-0"
                        type="number"
                        value={formData.deduction80C_insurance}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="deduction80C_ppf">PPF Contribution</Label>
                    <div className="input-field flex">
                      <span className="text-muted-foreground mr-2">₹</span>
                      <Input
                        id="deduction80C_ppf"
                        name="deduction80C_ppf"
                        placeholder="0"
                        className="border-0 p-0 focus-visible:ring-0"
                        type="number"
                        value={formData.deduction80C_ppf}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="deduction80C_tuition">Children's Tuition Fees</Label>
                    <div className="input-field flex">
                      <span className="text-muted-foreground mr-2">₹</span>
                      <Input
                        id="deduction80C_tuition"
                        name="deduction80C_tuition"
                        placeholder="0"
                        className="border-0 p-0 focus-visible:ring-0"
                        type="number"
                        value={formData.deduction80C_tuition}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="deduction80C_housingLoanPrincipal">Housing Loan Principal</Label>
                    <div className="input-field flex">
                      <span className="text-muted-foreground mr-2">₹</span>
                      <Input
                        id="deduction80C_housingLoanPrincipal"
                        name="deduction80C_housingLoanPrincipal"
                        placeholder="0"
                        className="border-0 p-0 focus-visible:ring-0"
                        type="number"
                        value={formData.deduction80C_housingLoanPrincipal}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>

                <h3 className="font-medium pt-4">Section 80D (Health Insurance)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="deduction80D_selfFamily">Self & Family Premium</Label>
                    <div className="input-field flex">
                      <span className="text-muted-foreground mr-2">₹</span>
                      <Input
                        id="deduction80D_selfFamily"
                        name="deduction80D_selfFamily"
                        placeholder="25,000"
                        className="border-0 p-0 focus-visible:ring-0"
                        type="number"
                        value={formData.deduction80D_selfFamily}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="deduction80D_parents">Parents Premium</Label>
                    <div className="input-field flex">
                      <span className="text-muted-foreground mr-2">₹</span>
                      <Input
                        id="deduction80D_parents"
                        name="deduction80D_parents"
                        placeholder="50,000"
                        className="border-0 p-0 focus-visible:ring-0"
                        type="number"
                        value={formData.deduction80D_parents}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>

                <h3 className="font-medium pt-4">Other Deductions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="deduction80CCD1B_nps">NPS (Sec 80CCD(1B))</Label>
                    <div className="input-field flex">
                      <span className="text-muted-foreground mr-2">₹</span>
                      <Input
                        id="deduction80CCD1B_nps"
                        name="deduction80CCD1B_nps"
                        placeholder="50,000"
                        className="border-0 p-0 focus-visible:ring-0"
                        type="number"
                        value={formData.deduction80CCD1B_nps}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deduction80TTA_savingsInterest">Interest on Savings Ac (Sec 80TTA)</Label>
                    <div className="input-field flex">
                      <span className="text-muted-foreground mr-2">₹</span>
                      <Input
                        id="deduction80TTA_savingsInterest"
                        name="deduction80TTA_savingsInterest"
                        placeholder="10,000"
                        className="border-0 p-0 focus-visible:ring-0"
                        type="number"
                        value={formData.deduction80TTA_savingsInterest}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>

                <h3 className="font-medium pt-4">HRA Exemption & Home Loan Interest</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rentPaid">Actual Rent Paid (Annual)</Label>
                    <div className="input-field flex">
                      <span className="text-muted-foreground mr-2">₹</span>
                      <Input
                        id="rentPaid"
                        name="rentPaid"
                        placeholder="180,000"
                        className="border-0 p-0 focus-visible:ring-0"
                        type="number"
                        value={formData.rentPaid}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="homeLoanInterest">Interest on Home Loan (Sec 24b)</Label>
                    <div className="input-field flex">
                      <span className="text-muted-foreground mr-2">₹</span>
                      <Input
                        id="homeLoanInterest"
                        name="homeLoanInterest"
                        placeholder="200,000"
                        className="border-0 p-0 focus-visible:ring-0"
                        type="number"
                        value={formData.homeLoanInterest}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="result" className="space-y-6">
              {isLoading && (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-3 text-muted-foreground">Calculating tax...</span>
                </div>
              )}

              {error && !isLoading && (
                <Alert variant="destructive">
                  <AlertTitle>Calculation Failed</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {!isLoading && !error && calculationResult && (
                <div>
                   <h3 className="text-lg font-semibold mb-4">Calculation Summary</h3>
                   <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span>Gross Total Income:</span> <span>{formatCurrency(calculationResult.grossTotalIncome)}</span></div>
                      <div className="flex justify-between"><span>Total Deductions:</span> <span>{formatCurrency(calculationResult.totalDeductions)}</span></div>
                      <div className="flex justify-between"><span>Taxable Income:</span> <span className="font-medium">{formatCurrency(calculationResult.taxableIncome)}</span></div>
                      <div className="flex justify-between"><span>Estimated Tax Payable:</span> <span className="font-bold text-primary">{formatCurrency(calculationResult.taxPayable)}</span></div>
                   </div>

                   <div className="mt-6">
                     <h4 className="font-medium mb-2">Regime Comparison (Placeholder)</h4>
                     <p className="text-muted-foreground text-sm">
                       Detailed comparison between Old and New Regimes will be shown here.
                       Currently showing placeholder tax payable based on simplified backend logic.
                     </p>
                     <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                       {JSON.stringify(calculationResult, null, 2)}
                     </pre>
                   </div>
                </div>
              )}

              {!isLoading && !error && !calculationResult && (
                 <div className="text-center text-muted-foreground py-10">
                    <p>Please fill in your income and deduction details and click "Calculate Tax" to see the results.</p>
                 </div>
              )}
            </TabsContent>
          </CardContent>
          
          <CardFooter className="flex justify-between border-t px-6 py-4">
            <Button variant="outline" onClick={handleBack} disabled={activeTab === 'income' || isLoading}>
              Back
            </Button>
            {activeTab !== 'result' && (
              <Button onClick={handleNext} disabled={isLoading}>
                 {isLoading && activeTab === 'deductions' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                 ) : null}
                 {activeTab === 'income' ? 'Next' : 'Calculate Tax'}
                 {activeTab === 'income' && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            )}
          </CardFooter>
        </Tabs>
      </Card>
    </DashboardLayout>
  );
}
