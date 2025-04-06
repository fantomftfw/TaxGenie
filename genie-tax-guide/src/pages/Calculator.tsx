import React, { useState, useCallback, useEffect, useRef } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RegimeComparison } from "@/components/RegimeComparison";
import { Loader2, ArrowRight, ArrowLeft, UploadCloud, Info, CheckCircle2, AlertTriangle, Calculator as CalculatorIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";

// Define API_BASE_URL using the same pattern
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Interface for the expected backend calculation response structure
interface CalculationResult {
  grossTotalIncome: number;
  netTaxableIncomeOld: number;
  netTaxableIncomeNew: number;
  taxPayableOld: number;
  taxPayableNew: number;
  recommendedRegime: 'old' | 'new' | 'either';
  taxSavingsNewVsOld: number; // Positive if new is better, negative if old is better
  // Add any other relevant fields from your backend
}

// Interface for data parsed from document upload
interface ParsedIncomeData {
  basic?: number | string;
  hra?: number | string;
  special?: number | string;
  lta?: number | string;
  otherIncome?: number | string;
  epfContribution?: number | string; // Employer or Employee? Assuming Employee for 80C
  professionalTax?: number | string;
  // Add other relevant income fields parsed from documents
}

type WizardStep = "income" | "deductions" | "result";

export default function Calculator() {
  const [currentStep, setCurrentStep] = useState<WizardStep>("income");
  const [assessmentYear, setAssessmentYear] = useState("2025-26"); // Default AY
  const [parsedData, setParsedData] = useState<ParsedIncomeData | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const { authState } = useAuth();

  // Consolidated state for all form inputs
  const [formData, setFormData] = useState({
    // Income
    basic: "",
    hra: "",
    special: "",
    lta: "",
    otherIncome: "",
    epfContribution: "", // Might be employer's or total, clarify. Assuming Employee contribution here.
    professionalTax: "",
    // Deductions 80C
    deduction80C_epf: "", // Will be auto-filled from epfContribution
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
    // HRA Exemption related
    rentPaid: "",
    isMetroCity: false,
    // Home Loan Interest
    homeLoanInterest: "", // Section 24b
  });

  // State for calculation results, loading, and errors
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const isCalculatingRef = useRef(isCalculating); // Ref to track calculating status

  // Update ref whenever isCalculating changes
  useEffect(() => {
    isCalculatingRef.current = isCalculating;
  }, [isCalculating]);

  // --- Handlers ---
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const checkedValue = isCheckbox ? (e.target as HTMLInputElement).checked : undefined;

    setFormData(prevData => {
      const updatedValue = isCheckbox ? checkedValue : value;
      const updatedData = { ...prevData, [name]: updatedValue };

      // Auto-update 80C EPF if EPF contribution changes
      if (name === 'epfContribution' && !isCheckbox) {
        updatedData.deduction80C_epf = value;
      }

      return updatedData;
    });
  }, []);

  const handleCheckboxChange = useCallback((name: keyof typeof formData, checked: boolean) => {
      setFormData(prevData => ({
          ...prevData,
          [name]: checked
      }));
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // REMOVE token check
    /*
    const token = authState.token;
    if (!token) {
        setUploadError("Authentication error. Please log in again.");
        return;
    }
    */

    setIsUploading(true);
    setUploadError(null);
    setFileName(file.name);
    setParsedData(null);
    const uploadFormData = new FormData();
    uploadFormData.append('file', file); 
    try {
      const response = await fetch(`${API_BASE_URL}/api/parse-income-document`, { 
          method: 'POST', 
          // REMOVE headers section
          /* 
          headers: {
              'Authorization': `Bearer ${token}` 
          },
          */
          body: uploadFormData 
      });

      if (!response.ok) {
        let errorMsg = `Upload failed: ${response.status}`;
        let detailedError = ''; // Variable to hold the detailed error text
        try {
            detailedError = await response.text(); // Get raw text first
            try {
                const jsonData = JSON.parse(detailedError); // Try parsing the detailed error
                errorMsg = jsonData.error || jsonData.message || errorMsg; // Use JSON error if available
            } catch (jsonErr) {
                errorMsg = detailedError || errorMsg; // Use text error if not JSON
            }
        } catch (readErr) { /* Ignore if reading text fails */ }
        // Throw the potentially improved error message
        throw new Error(errorMsg);
      }

      const result: ParsedIncomeData = await response.json();
      setParsedData(result);
      setFormData(prev => ({
          ...prev,
          basic: String(result.basic ?? prev.basic ?? ""),
          hra: String(result.hra ?? prev.hra ?? ""),
          special: String(result.special ?? prev.special ?? ""),
          lta: String(result.lta ?? prev.lta ?? ""),
          otherIncome: String(result.otherIncome ?? prev.otherIncome ?? ""), // Ensure backend provides this if needed
          epfContribution: String(result.epfContribution ?? prev.epfContribution ?? ""),
          professionalTax: String(result.professionalTax ?? prev.professionalTax ?? ""),
          deduction80C_epf: String(result.epfContribution ?? prev.deduction80C_epf ?? ""), // Auto-fill 80C
      }));
      setUploadError(null);
      setIsUploadModalOpen(false);

    } catch (err: any) {
        console.error("File Upload/Parse failed:", err);
        setUploadError(err.message || 'Failed to upload or parse document.');
        setFileName(null); // Clear file name on error
        setParsedData(null);
        // Keep modal open on error? Or close?
    } finally {
        setIsUploading(false);
        event.target.value = ''; // Reset file input
    }
  };

  const handleCalculate = useCallback(async () => {
    if (isCalculatingRef.current) return; // Use ref here too for consistency

    // Check basic salary validity for manual click
    if (!formData.basic || isNaN(parseFloat(formData.basic))) {
        setCalculationError("Valid Basic Salary is required.");
        setCalculationResult(null);
        return;
    }

    setIsCalculating(true);
    setCalculationError(null);

    const payload = Object.fromEntries(
      Object.entries(formData).map(([key, value]) => {
        if (typeof value === 'string' && !isNaN(parseFloat(value)) && value.trim() !== '') {
          return [key, parseFloat(value)];
        }
        if (typeof value === 'boolean') { return [key, value]; }
        return [key, 0];
      })
    );
    payload.assessmentYear = assessmentYear;

    try {
        const response = await fetch(`${API_BASE_URL}/api/calculate-tax`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(errorData || `Calculation failed: ${response.status}`);
        }
        const result: CalculationResult = await response.json();
        setCalculationResult(result);
        setCalculationError(null);
    } catch (error: any) {
        console.error('Auto-Calculation API error:', error);
        setCalculationError(error.message || 'An unexpected error occurred.');
        setCalculationResult(null);
    } finally {
        setIsCalculating(false);
    }
  }, [formData, assessmentYear]); // Keep dependencies for manual calculation context

  // --- Auto-calculation Effect ---
  useEffect(() => {
    const isBasicValid = formData.basic && formData.basic.trim() !== '' && !isNaN(parseFloat(formData.basic));

    if (isBasicValid) {
      // Define the async calculation function *inside* the effect
      const calculateAutomatically = async () => {
        // Prevent concurrent runs using the ref
        if (isCalculatingRef.current) return;

        setIsCalculating(true);
        setCalculationError(null);

        const payload = Object.fromEntries(
          Object.entries(formData).map(([key, value]) => {
            if (typeof value === 'string' && !isNaN(parseFloat(value)) && value.trim() !== '') {
              return [key, parseFloat(value)];
            }
            if (typeof value === 'boolean') { return [key, value]; }
            return [key, 0];
          })
        );
        payload.assessmentYear = assessmentYear;

        try {
            const response = await fetch(`${API_BASE_URL}/api/calculate-tax`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(errorData || `Calculation failed: ${response.status}`);
            }
            const result: CalculationResult = await response.json();
            setCalculationResult(result);
            setCalculationError(null);
        } catch (error: any) {
            console.error('Auto-Calculation API error:', error);
            setCalculationError(error.message || 'An unexpected error occurred.');
            setCalculationResult(null);
        } finally {
            setIsCalculating(false);
        }
      };

      // Debounce the execution
      const timerId = setTimeout(() => {
        calculateAutomatically();
      }, 750); 

      return () => clearTimeout(timerId); // Cleanup timeout
    } else {
      // Clear results if basic salary becomes invalid/empty
      setCalculationResult(null);
      setCalculationError(null);
    }
    // Effect only depends on the data that should trigger it
  }, [formData, assessmentYear]); 

  const formatCurrency = (value: number | undefined | null) => {
    if (value === undefined || value === null || isNaN(value)) return "₹ --";
    return `₹ ${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
  };

  // Mobile navigation handlers
  const handleNextMobile = () => {
    if (currentStep === "income") setCurrentStep("deductions");
    else if (currentStep === "deductions") {
        handleCalculate().then(() => {
            setCalculationError(currentError => {
                if (!currentError) {
                    setCurrentStep("result");
                }
                return currentError;
            });
        });
    }
  };

  const handleBackMobile = () => {
    if (currentStep === "result") setCurrentStep("deductions");
    else if (currentStep === "deductions") setCurrentStep("income");
  };

  const handleRemoveFile = () => {
      setFileName(null);
      setParsedData(null);
      setUploadError(null);
  };

  const truncateFileName = (name: string | null, maxLength = 20) => {
      if (!name) return "";
      if (name.length <= maxLength) return name;
      return name.substring(0, maxLength - 3) + "...";
  };

  // --- Render Sections ---
  const renderFileUploadContent = () => (
        <div className="p-4 text-center space-y-3">
              <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
              <Label htmlFor="file-upload-modal" className={cn(
                  "font-semibold text-primary cursor-pointer hover:underline text-lg",
                  isUploading && "cursor-not-allowed opacity-50"
              )}>
                  {isUploading ? "Uploading..." : (fileName ? `Selected: ${fileName}` : "Click or Drag File Here")}
              </Label>
              <Input
                  id="file-upload-modal"
                  name="file-upload-modal"
                  type="file"
                  className="sr-only"
                  onChange={handleFileUpload}
                  accept=".pdf,.jpg,.jpeg,.png"
                  disabled={isUploading}
              />
              <p className="text-sm text-muted-foreground">PDF, JPG, PNG (Max 5MB). We'll try to pre-fill the form.</p>
              {uploadError && (
                  <Alert variant="destructive" className="mt-4 text-left">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Upload Failed</AlertTitle>
                      <AlertDescription>{uploadError}</AlertDescription>
                  </Alert>
              )}
              {parsedData && !uploadError && (
                  <Alert variant="default" className="mt-4 text-left bg-primary/10 border-primary/20">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <AlertTitle className="text-primary">Parsed!</AlertTitle>
                      <AlertDescription className="text-primary/80">Form fields pre-filled. Please review.</AlertDescription>
                  </Alert>
              )}
          </div>
  );

  const renderIncomeFields = () => (
     <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
             <div className="space-y-1"><Label htmlFor="basic" className="text-xs">Basic Salary *</Label><Input required id="basic" name="basic" type="number" placeholder="Annual Amount" value={formData.basic} onChange={handleInputChange} className="bg-background border-border h-9 text-sm"/></div>
             <div className="space-y-1"><Label htmlFor="hra" className="text-xs">HRA Received</Label><Input id="hra" name="hra" type="number" placeholder="Annual Amount" value={formData.hra} onChange={handleInputChange} className="bg-background border-border h-9 text-sm"/></div>
             <div className="space-y-1"><Label htmlFor="special" className="text-xs">Special Allowance</Label><Input id="special" name="special" type="number" placeholder="Annual Amount" value={formData.special} onChange={handleInputChange} className="bg-background border-border h-9 text-sm"/></div>
             <div className="space-y-1"><Label htmlFor="lta" className="text-xs">Leave Travel Allowance</Label><Input id="lta" name="lta" type="number" placeholder="Annual Amount" value={formData.lta} onChange={handleInputChange} className="bg-background border-border h-9 text-sm"/></div>
             <div className="space-y-1"><Label htmlFor="otherIncome" className="text-xs">Other Income</Label><Input id="otherIncome" name="otherIncome" type="number" placeholder="Interest, etc." value={formData.otherIncome} onChange={handleInputChange} className="bg-background border-border h-9 text-sm"/></div>
             <div className="space-y-1"><Label htmlFor="epfContribution" className="text-xs">Employee EPF</Label><Input id="epfContribution" name="epfContribution" type="number" placeholder="Annual Amount" value={formData.epfContribution} onChange={handleInputChange} className="bg-background border-border h-9 text-sm"/><p className="text-xs text-muted-foreground -mt-1">Used for 80C</p></div>
             <div className="space-y-1"><Label htmlFor="professionalTax" className="text-xs">Professional Tax</Label><Input id="professionalTax" name="professionalTax" type="number" placeholder="Annual Amount" value={formData.professionalTax} onChange={handleInputChange} className="bg-background border-border h-9 text-sm"/></div>
        </div>
         <Card className="bg-muted/30 border-border">
             <CardHeader className="p-3">
                 <CardTitle className="text-sm font-medium flex items-center text-foreground">
                     <Info className="h-4 w-4 mr-1 text-primary"/> HRA Exemption Helper
                 </CardTitle>
             </CardHeader>
             <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 p-3">
                 <div className="space-y-1">
                     <Label htmlFor="rentPaid" className="text-xs">Rent Paid (Annual)</Label>
                     <Input id="rentPaid" name="rentPaid" type="number" placeholder="If applicable" value={formData.rentPaid} onChange={handleInputChange} className="bg-background border-border h-9 text-sm"/>
                 </div>
                 <div className="flex items-center space-x-2 pt-4 sm:pt-0 sm:items-end sm:pb-1">
                 <Checkbox id="isMetroCity" name="isMetroCity" checked={formData.isMetroCity} onCheckedChange={(checked) => handleCheckboxChange('isMetroCity', !!checked)}/>
                 <Label htmlFor="isMetroCity" className="text-xs font-medium leading-none">Living in Metro City?</Label>
                 </div>
             </CardContent>
         </Card>
     </div>
  );

  const renderDeductionsFields = () => (
     <div className="space-y-4">
         <Card className="bg-muted/30 border-border">
             <CardHeader className="p-3"><CardTitle className="text-sm font-medium text-foreground">Section 80C (Max: ₹1.5 Lakh)</CardTitle></CardHeader>
             <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 p-3">
                <div className="space-y-1"><Label htmlFor="deduction80C_epf" className="text-xs">EPF (Auto)</Label><Input id="deduction80C_epf" name="deduction80C_epf" type="number" value={formData.deduction80C_epf} onChange={handleInputChange} disabled className="bg-muted border-border h-9 text-sm"/></div>
                <div className="space-y-1"><Label htmlFor="deduction80C_ppf" className="text-xs">PPF</Label><Input id="deduction80C_ppf" name="deduction80C_ppf" type="number" placeholder="Annual" value={formData.deduction80C_ppf} onChange={handleInputChange} className="bg-background border-border h-9 text-sm"/></div>
                <div className="space-y-1"><Label htmlFor="deduction80C_elss" className="text-xs">ELSS</Label><Input id="deduction80C_elss" name="deduction80C_elss" type="number" placeholder="Annual" value={formData.deduction80C_elss} onChange={handleInputChange} className="bg-background border-border h-9 text-sm"/></div>
                <div className="space-y-1"><Label htmlFor="deduction80C_insurance" className="text-xs">Life Insurance</Label><Input id="deduction80C_insurance" name="deduction80C_insurance" type="number" placeholder="Premium" value={formData.deduction80C_insurance} onChange={handleInputChange} className="bg-background border-border h-9 text-sm"/></div>
                <div className="space-y-1"><Label htmlFor="deduction80C_tuition" className="text-xs">Tuition Fees</Label><Input id="deduction80C_tuition" name="deduction80C_tuition" type="number" placeholder="Max 2 children" value={formData.deduction80C_tuition} onChange={handleInputChange} className="bg-background border-border h-9 text-sm"/></div>
                <div className="space-y-1"><Label htmlFor="deduction80C_housingLoanPrincipal" className="text-xs">Housing Loan Principal</Label><Input id="deduction80C_housingLoanPrincipal" name="deduction80C_housingLoanPrincipal" type="number" placeholder="Annual" value={formData.deduction80C_housingLoanPrincipal} onChange={handleInputChange} className="bg-background border-border h-9 text-sm"/></div>
            </CardContent>
         </Card>
         <Card className="bg-muted/30 border-border">
             <CardHeader className="p-3"><CardTitle className="text-sm font-medium text-foreground">Other Common Deductions</CardTitle></CardHeader>
             <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 p-3">
                <div className="space-y-1"><Label htmlFor="deduction80D_selfFamily" className="text-xs">80D: Health Ins. (Self)</Label><Input id="deduction80D_selfFamily" name="deduction80D_selfFamily" type="number" placeholder="Max ₹25k/₹50k" value={formData.deduction80D_selfFamily} onChange={handleInputChange} className="bg-background border-border h-9 text-sm"/></div>
                <div className="space-y-1"><Label htmlFor="deduction80D_parents" className="text-xs">80D: Health Ins. (Parents)</Label><Input id="deduction80D_parents" name="deduction80D_parents" type="number" placeholder="Max ₹25k/₹50k" value={formData.deduction80D_parents} onChange={handleInputChange} className="bg-background border-border h-9 text-sm"/></div>
                <div className="space-y-1"><Label htmlFor="deduction80CCD1B_nps" className="text-xs">80CCD(1B): NPS</Label><Input id="deduction80CCD1B_nps" name="deduction80CCD1B_nps" type="number" placeholder="Max ₹50k" value={formData.deduction80CCD1B_nps} onChange={handleInputChange} className="bg-background border-border h-9 text-sm"/></div>
                <div className="space-y-1"><Label htmlFor="deduction80TTA_savingsInterest" className="text-xs">80TTA: Savings Interest</Label><Input id="deduction80TTA_savingsInterest" name="deduction80TTA_savingsInterest" type="number" placeholder="Max ₹10k" value={formData.deduction80TTA_savingsInterest} onChange={handleInputChange} className="bg-background border-border h-9 text-sm"/></div>
                <div className="space-y-1"><Label htmlFor="homeLoanInterest" className="text-xs">Sec 24(b): Home Loan Int.</Label><Input id="homeLoanInterest" name="homeLoanInterest" type="number" placeholder="Max ₹2Lakh" value={formData.homeLoanInterest} onChange={handleInputChange} className="bg-background border-border h-9 text-sm"/></div>
            </CardContent>
         </Card>
     </div>
  );

  const renderCalculationResult = () => (
      <div className="md:sticky md:top-20"> {/* Sticky wrapper for desktop */}
          <Card>
              <CardHeader>
                 <CardTitle className="text-lg font-semibold text-foreground">Calculation Result</CardTitle>
                 <CardDescription className="text-sm text-muted-foreground">Comparison: Old vs New Regime.</CardDescription>
             </CardHeader>
             <CardContent>
                 {isCalculating && ( <div className="flex items-center justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary mr-2" /><p className="text-sm text-muted-foreground">Calculating...</p></div> )}
                 {calculationError && !isCalculating && ( <Alert variant="destructive" className="mb-4"><AlertTriangle className="h-4 w-4" /><AlertTitle>Calculation Error</AlertTitle><AlertDescription>{calculationError}</AlertDescription></Alert> )}
                 {calculationResult && !isCalculating && ( <RegimeComparison result={calculationResult} formatCurrency={formatCurrency} /> )}
                 {!calculationResult && !isCalculating && !calculationError && (
                      <div className="text-center text-muted-foreground py-10 px-4 border border-dashed rounded-lg bg-muted/30">
                        <CalculatorIcon className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3"/>
                        <p className="text-sm">Results will appear here.</p>
                     </div>
                 )}
             </CardContent>
          </Card>
      </div>
  );

  // Mobile upload section (unchanged)
  const renderMobileFileUploadSection = () => (
      <Card className="border-dashed border-2 border-border hover:border-primary/50 transition-colors duration-200 bg-card">
           {/* ... content from previous renderFileUploadSection ... */} 
           <CardHeader className="pb-2 pt-4">
             <CardTitle className="text-base font-medium flex items-center text-foreground">
                <UploadCloud className="h-4 w-4 mr-2 text-primary"/> Upload Document (Optional)
            </CardTitle>
             <CardDescription className="text-xs">Upload Form 16/Salary Slip to pre-fill.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 text-center">
              <Label htmlFor="file-upload" className={cn( "font-semibold text-primary cursor-pointer hover:underline", isUploading && "cursor-not-allowed opacity-50" )}>
                  {isUploading ? "Uploading..." : (fileName ? `Selected: ${fileName}` : "Click to Upload")}
              </Label>
              <Input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileUpload} accept=".pdf,.jpg,.jpeg,.png" disabled={isUploading} />
              <p className="mt-1 text-xs text-muted-foreground">PDF, JPG, PNG (Max 5MB)</p>
              {uploadError && (<Alert variant="destructive" className="mt-2 text-left text-xs"><AlertTriangle className="h-3 w-3" /><AlertTitle className="text-sm">Failed</AlertTitle><AlertDescription>{uploadError}</AlertDescription></Alert>)}
              {parsedData && !uploadError && (<Alert variant="default" className="mt-2 text-left text-xs bg-primary/10 border-primary/20"><CheckCircle2 className="h-3 w-3 text-primary" /><AlertTitle className="text-sm text-primary">Parsed!</AlertTitle><AlertDescription className="text-primary/80">Fields pre-filled.</AlertDescription></Alert>)}
          </CardContent>
      </Card>
  );

  // --- JSX Return ---
  return (
    <div className="flex flex-col min-h-screen bg-background overflow-x-hidden">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8 md:py-12">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4 md:gap-8">
            {/* Title and Upload Button/Badge */} 
            <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                    Tax Calculator
                </h1>
                {/* Desktop Upload UI: Button or Badge */} 
                <div className="hidden md:flex items-center gap-2">
                    <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
                        {fileName ? (
                            // Show Badge and Replace/Remove actions if file is uploaded
                            <div className="flex items-center gap-2">
                                 <Badge variant="secondary" className="whitespace-nowrap">
                                    {truncateFileName(fileName)}
                                 </Badge>
                                 <DialogTrigger asChild>
                                     <Button variant="link" size="sm" className="text-xs h-auto p-0">Replace</Button>
                                 </DialogTrigger>
                                 <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={handleRemoveFile}>
                                     <X className="h-4 w-4" />
                                     <span className="sr-only">Remove File</span>
                                 </Button>
                            </div>
                        ) : (
                             // Show Upload Button if no file is uploaded
                            <DialogTrigger asChild>
                                <Button variant="secondary" size="sm" className="items-center gap-1.5">
                                <UploadCloud className="h-4 w-4"/> Upload Document
                                </Button>
                            </DialogTrigger>
                        )}
                        {/* Modal Content remains the same */}
                         <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                            <DialogTitle>Upload Income Document</DialogTitle>
                            <DialogDescription>
                                Upload your Form 16 or Salary Slip (PDF, JPG, PNG) to automatically fill in income details.
                            </DialogDescription>
                            </DialogHeader>
                            {renderFileUploadContent()}
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
            
            {/* AY Selector */}
            <div className="flex items-center space-x-2 w-full md:w-auto">
                 <Label htmlFor="assessmentYear" className="text-base font-medium text-muted-foreground shrink-0">Assessment Year:</Label>
                 <Select value={assessmentYear} onValueChange={setAssessmentYear}>
                    <SelectTrigger id="assessmentYear" className="w-full md:w-[150px] bg-card border-border h-11 text-base font-semibold"> <SelectValue placeholder="Select AY" /> </SelectTrigger>
                    <SelectContent><SelectItem value="2025-26" className="text-base">2025-26 (FY 2024-25)</SelectItem> <SelectItem value="2024-25" className="text-base">2024-25 (FY 2023-24)</SelectItem></SelectContent>
                </Select>
            </div>
         </div>

         {/* Main Layout Grid */}
         <div className="md:grid md:grid-cols-5 lg:grid-cols-3 md:gap-8">
             {/* --- Left Column (Inputs) --- */}
             <div className="md:col-span-3 lg:col-span-2">
                 {/* Mobile File Upload Card - Render only if NOT on result step */}
                 <div className="md:hidden space-y-6">
                     {currentStep !== 'result' && renderMobileFileUploadSection()} 
                 </div>

                 {/* --- Mobile Stepped View --- */}
                 <div className="md:hidden space-y-6">
                     {currentStep !== 'result' && (
                         <Card>
                             <CardHeader>
                                 <CardTitle className="text-base">Step {currentStep === 'income' ? 1 : 2}: {currentStep === 'income' ? 'Income' : 'Deductions'}</CardTitle>
                             </CardHeader>
                             {currentStep === 'income' && <CardContent className="pt-0">{renderIncomeFields()}</CardContent>}
                             {currentStep === 'deductions' && <CardContent className="pt-0">{renderDeductionsFields()}</CardContent>}
                         </Card>
                     )}
                     {/* Mobile Result View */}
                     {currentStep === 'result' && ( 
                         <div className="space-y-4">
                              {renderCalculationResult()}
                         </div> 
                     )}
                 </div>
                 
                  {/* --- Desktop View (Tabs for Income/Deductions) --- */}
                  <div className="hidden md:block">
                      <Tabs value={currentStep} onValueChange={(value) => setCurrentStep(value as WizardStep)} className="w-full">
                          {/* Apply margin bottom to TabsList to create space before content */}
                          <TabsList className="grid w-full grid-cols-2 mb-4">
                              <TabsTrigger value="income">Income Details</TabsTrigger>
                              <TabsTrigger value="deductions">Deductions</TabsTrigger>
                          </TabsList>
                          <TabsContent value="income">
                              <Card>
                                  <CardContent className="pt-6">{renderIncomeFields()}</CardContent>
                              </Card>
                          </TabsContent>
                          <TabsContent value="deductions">
                              <Card>
                                  <CardContent className="pt-6">{renderDeductionsFields()}</CardContent>
                              </Card>
                          </TabsContent>
                      </Tabs>
                       
                       <div className="flex justify-end pt-6">
                           <Button size="lg" onClick={handleCalculate} disabled={isCalculating || !formData.basic}>
                               {isCalculating ? (<Loader2 className="h-4 w-4 mr-2 animate-spin" />) : (<CalculatorIcon className="h-4 w-4 mr-2" />)}
                               {isCalculating ? "Calculating..." : "Calculate Tax"}
                           </Button>
                       </div>
                  </div>
             </div> {/* End Left Column */}

             {/* --- Right Column (Results/Preview) --- */}
             <div className="md:col-span-2 lg:col-span-1 mt-8 md:mt-0">
                  <div className="hidden md:block"> 
                    {renderCalculationResult()} 
                 </div>
             </div> 

         </div> {/* End Grid */}
      </main>
      
       {/* --- Mobile Sticky Footer Bar --- */}
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 p-4 md:hidden">
            {/* Container to keep buttons centered */}
             <div className="container mx-auto flex items-center justify-between gap-4">
                 {/* Conditional Back Button */}
                 <Button 
                    variant="outline" 
                    onClick={handleBackMobile} 
                    disabled={currentStep === "income"}
                    className={cn("w-1/2", currentStep === "income" && "invisible")} // Takes half width, hidden on first step
                >
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back
                </Button>
                
                 {/* Conditional Next/Calculate Button */}
                 {currentStep !== 'result' && (
                     <Button 
                        variant="default" 
                        onClick={handleNextMobile} 
                        disabled={isCalculating || (currentStep === "deductions" && !formData.basic)}
                        className="w-1/2" // Takes half width
                    >
                        {isCalculating && currentStep === 'deductions' ? (<Loader2 className="h-4 w-4 mr-2 animate-spin" />) : (currentStep === "deductions" ? <CalculatorIcon className="h-4 w-4 mr-2" /> : null)}
                        {currentStep === "income" ? "Next" : (isCalculating ? "Calculating..." : "Calculate")} 
                        {currentStep === "income" && <ArrowRight className="h-4 w-4 ml-2" />}
                    </Button>
                 )}
                 {/* Show something else on result step? Or just Back button? Keeping it simple for now */}
            </div>
        </div>

    </div>
  );
}

