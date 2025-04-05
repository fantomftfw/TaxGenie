import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Check, ArrowRight, Upload, FileText, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [parsedSalaryData, setParsedSalaryData] = useState<Record<string, any> | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { authState, profile, updateProfile } = useAuth();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const completeOnboarding = async () => {
    setLoading(true);
    try {
      await updateProfile({ onboarding_completed: true });
      
      toast({
        title: "Welcome to TaxGenie!",
        description: "You're all set to start saving time on your taxes.",
      });
      
      navigate("/");
    } catch (error: any) {
      console.error("Error completing onboarding:", error);
      toast({
        title: "Error",
        description: "Failed to complete onboarding. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log("File selected:", file);
      setSelectedFile(file);
      setUploadError(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleTriggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleUpload = async (): Promise<boolean> => {
    if (!selectedFile) {
      setUploadError("Please select a file first.");
      return false;
    }
    if (!authState.token) {
        setUploadError("Authentication error. Please log in again.");
        return false;
    }

    setIsUploading(true);
    setUploadError(null);
    console.log("Starting upload for:", selectedFile.name);

    const formData = new FormData();
    formData.append('document', selectedFile);

    try {
       const response = await fetch('/api/documents/upload', {
         method: 'POST',
         body: formData,
         headers: {
             'Authorization': `Bearer ${authState.token}`,
         }
       });

       const result = await response.json();
       if (!response.ok) {
           throw new Error(result.error || `Upload failed with status: ${response.status}`);
       }

       console.log("Upload successful, Backend Response:", result);
       if (result.parsedData) {
           setParsedSalaryData(result.parsedData);
       }
       toast({
         title: "Upload Successful",
         description: `${selectedFile.name} uploaded and basic text extracted.`,
       });
       setIsUploading(false);
       return true;

    } catch (error: any) {
      console.error("Upload failed:", error);
      const errorMessage = error.message || "An unknown error occurred during upload.";
      setUploadError(errorMessage);
      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive",
      });
      setIsUploading(false);
      return false;
    }
  };
  
  const getStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6 text-center">
            <div className="mx-auto bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center">
              <FileText className="h-10 w-10 text-primary" />
            </div>
            
            <div>
              <h1 className="text-2xl font-bold">Upload instead of typing</h1>
              <p className="text-muted-foreground mt-3 max-w-sm mx-auto">
                TaxGenie can automatically extract tax information from your documents 
                so you don't have to enter data manually.
              </p>
            </div>
            
            <div className="flex flex-col gap-4">
              <div className="border border-border rounded-lg p-4 bg-card">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Check className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-medium">Form 16</h3>
                    <p className="text-sm text-muted-foreground">We extract all tax details automatically</p>
                  </div>
                </div>
              </div>
              
              <div className="border border-border rounded-lg p-4 bg-card">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Check className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-medium">Salary Slips</h3>
                    <p className="text-sm text-muted-foreground">Monthly income details are captured instantly</p>
                  </div>
                </div>
              </div>
              
              <div className="border border-border rounded-lg p-4 bg-card">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Check className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-medium">Investment Proofs</h3>
                    <p className="text-sm text-muted-foreground">We detect eligible tax savings automatically</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-6 text-center">
            <div className="mx-auto bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center">
              <Upload className="h-10 w-10 text-primary" />
            </div>
            
            <div>
              <h1 className="text-2xl font-bold">Upload your first document</h1>
              <p className="text-muted-foreground mt-3 max-w-sm mx-auto">
                Start by uploading your Form 16 or any salary slip to immediately
                see how much tax you can save.
              </p>
            </div>
            
            <div
              className={`border-2 border-dashed border-border rounded-lg p-8 bg-card/50 ${!isUploading ? 'cursor-pointer hover:bg-card/80' : 'opacity-70'} transition-colors`}
              onClick={!isUploading ? handleTriggerFileInput : undefined}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".pdf,.jpg,.jpeg,.png"
                style={{ display: 'none' }}
                disabled={isUploading}
              />

              {!selectedFile && !isUploading && (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <Upload className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-medium">Drag & drop your document here</h3>
                    <p className="text-sm text-muted-foreground">or click to browse files</p>
                    <Button variant="outline" className="mt-2" onClick={handleTriggerFileInput}>
                      Choose file
                    </Button>
                  </div>
              )}

              {selectedFile && !isUploading && (
                 <div className="flex flex-col items-center gap-3">
                     <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                       <FileText className="h-8 w-8 text-green-700" />
                     </div>
                     <h3 className="font-medium truncate max-w-xs">{selectedFile.name}</h3>
                     <p className="text-sm text-muted-foreground">Ready to upload</p>
                     <div className="flex gap-2 mt-2">
                         <Button variant="outline" size="sm" onClick={handleTriggerFileInput}>Change file</Button>
                         <Button variant="ghost" size="sm" onClick={() => {setSelectedFile(null); setUploadError(null);}}><X className="h-4 w-4 mr-1"/>Clear</Button>
                     </div>
                 </div>
              )}

              {isUploading && (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                      <Upload className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-medium">Uploading...</h3>
                    <p className="text-sm text-muted-foreground truncate max-w-xs">{selectedFile?.name}</p>
                  </div>
              )}
            </div>

            {uploadError && (
                <p className="text-sm text-red-600">Error: {uploadError}</p>
            )}

            <p className="text-sm text-muted-foreground">
              You can also do this later from your dashboard
            </p>
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-6 text-center">
            {parsedSalaryData && (
              <div className="mb-6 p-4 border rounded-lg bg-muted/50 text-left">
                <h4 className="font-semibold mb-2 text-center">Extracted Data from: {parsedSalaryData.fileName}</h4>
                <div className="space-y-1 text-sm">
                    <div className="flex justify-between"><span>Basic:</span> <span>{parsedSalaryData.basic ? `₹ ${parsedSalaryData.basic.toLocaleString('en-IN')}` : 'N/A'} (Monthly)</span></div>
                    <div className="flex justify-between"><span>HRA:</span> <span>{parsedSalaryData.hra ? `₹ ${parsedSalaryData.hra.toLocaleString('en-IN')}` : 'N/A'} (Monthly)</span></div>
                    <div className="flex justify-between"><span>Special Allowance:</span> <span>{parsedSalaryData.specialAllowance ? `₹ ${parsedSalaryData.specialAllowance.toLocaleString('en-IN')}` : 'N/A'} (Monthly)</span></div>
                    <div className="flex justify-between"><span>Gross Earnings:</span> <span>{parsedSalaryData.grossEarnings ? `₹ ${parsedSalaryData.grossEarnings.toLocaleString('en-IN')}` : 'N/A'} (Monthly)</span></div>
                    <div className="flex justify-between font-medium mt-2"><span>Est. Annual Gross:</span> <span>{parsedSalaryData.estimatedAnnualGross ? `₹ ${parsedSalaryData.estimatedAnnualGross.toLocaleString('en-IN')}` : 'N/A'}</span></div>
                </div>
              </div>
            )}

            <div className="mx-auto bg-green-100 w-20 h-20 rounded-full flex items-center justify-center">
              <Check className="h-10 w-10 text-green-600" />
            </div>
            
            <div>
              <h1 className="text-2xl font-bold">You're all set!</h1>
              <p className="text-muted-foreground mt-3 max-w-sm mx-auto">
                Welcome to TaxGenie. We're here to make tax filing simple
                and help you maximize your savings.
              </p>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-medium">What you can do now:</h3>
              
              <div className="flex flex-col gap-3">
                <div className="border border-border rounded-lg p-4 bg-card flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                    <Upload className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-medium">Upload tax documents</h3>
                    <p className="text-sm text-muted-foreground">Let us extract and organize your tax data</p>
                  </div>
                </div>
                
                <div className="border border-border rounded-lg p-4 bg-card flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-medium">View tax insights</h3>
                    <p className="text-sm text-muted-foreground">See personalized recommendations to save taxes</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/5">
      <div className="container px-4 py-16 sm:px-6 sm:py-24 lg:px-8 flex flex-col justify-center min-h-screen">
        <div className="bg-background/70 backdrop-blur-lg w-full max-w-md mx-auto rounded-2xl shadow-lg p-6 sm:p-8 border border-border/40">
          {/* Progress bar */}
          <div className="mb-8">
            <Progress value={(step / 3) * 100} className="h-1.5" />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>Welcome</span>
              <span>Upload</span>
              <span>Done</span>
            </div>
          </div>
          
          {/* Content */}
          <div className="my-6">
            {getStepContent()}
          </div>
          
          {/* Navigation */}
          <div className="flex justify-between mt-8 gap-4">
            {step > 1 ? (
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                disabled={loading || isUploading}
              >
                Back
              </Button>
            ) : (
              <div></div> 
            )}
            
            <Button
              variant="default"
              onClick={async () => {
                if (step === 3) {
                  completeOnboarding();
                } else if (step === 2) {
                  if (selectedFile) {
                     const uploadSuccess = await handleUpload();
                     if (uploadSuccess) {
                        setStep(step + 1);
                     }
                  } else {
                     setStep(step + 1);
                  }
                } else {
                   setStep(step + 1);
                }
              }}
              disabled={loading || isUploading}
              className={cn(
                "flex-1"
              )}
            >
              {step === 3 
                ? (loading ? 'Finishing...' : 'Go to Dashboard')
                : (step === 2 && isUploading) 
                  ? 'Uploading...'
                  : (step === 2 && selectedFile)
                    ? 'Upload & Continue'
                    : 'Continue'}
              {step < 3 && !isUploading && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
