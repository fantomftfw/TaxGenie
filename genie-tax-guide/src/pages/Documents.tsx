import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileUploadCard } from "@/components/FileUploadCard";
import { Eye, Download, Trash2, FileText, UploadCloud, Camera, AlertCircle, Smartphone } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useDashboard } from "@/contexts/DashboardContext";

// Define type for fetched document data
interface UserDocument {
  id: number;
  user_id: number;
  original_filename: string;
  upload_timestamp: string;
  identified_type: string | null;
  parsed_data_json?: string; // Keep original string if needed
  parsed_data: Record<string, any> | null; // Parsed JSON object
  parseError?: string;
}

// Define API_BASE_URL using the same pattern
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export default function Documents() {
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { authState } = useAuth();
  const isMobile = useIsMobile();
  const { updateDashboardData } = useDashboard();
  
  const fetchDocuments = useCallback(async () => {
    if (!authState.token) {
      setError("Authentication token not found.");
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/documents`, {
        headers: {
          'Authorization': `Bearer ${authState.token}`,
        }
      });

      const contentType = response.headers.get("content-type");
      if (!response.ok) {
        let errorMsg = `HTTP error! status: ${response.status} ${response.statusText}`;
        if (contentType && contentType.indexOf("application/json") !== -1) {
          try {
            const errorData = await response.json();
            errorMsg = errorData.error || errorMsg;
          } catch (jsonError) { /* Ignore */ }
        }
        throw new Error(errorMsg);
      }
      if (!contentType || contentType.indexOf("application/json") === -1) {
        throw new Error(`Received non-JSON response from server. Content-Type: ${contentType}`);
      }

      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (error: any) {
      console.error("Error fetching documents:", error);
      setError(error.message || "Failed to load documents.");
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [authState.token]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);
  
  const handleFileUpload = async (file: File) => {
    if (!authState.token) {
      toast({ title: "Error", description: "Authentication token not found. Please log in again.", variant: "destructive" });
      return;
    }
    if (file.type !== 'application/pdf') {
        toast({ title: "Invalid File Type", description: "Please upload PDF documents only.", variant: "destructive" });
        return;
    }

    setUploading(true);
    console.log("Starting upload from Documents page:", file.name);

    const formData = new FormData();
    formData.append('document', file);

    try {
       const response = await fetch(`${API_BASE_URL}/documents/upload`, {
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
           updateDashboardData({ 
               estimatedAnnualGross: result.parsedData.estimatedAnnualGross, 
               estimatedTaxOldRegime: result.parsedData.taxOldRegime,
               estimatedTaxNewRegime: result.parsedData.taxNewRegime,
               estimatedTaxSavings: result.parsedData.taxSavings,
               recommendedRegime: result.parsedData.recommendedRegime,
               financialYear: result.parsedData.financialYear,
               latestParsedSalaryData: result.parsedData 
           });
            await fetchDocuments();
       } else {
           console.warn("Parsed data not found in upload response.");
       }

       toast({
         title: "Upload Successful",
         description: `${file.name} processed. Dashboard updated.`,
       });

    } catch (error: any) {
      console.error("Upload failed:", error);
      toast({
        title: "Upload Failed",
        description: error.message || "An unknown error occurred during upload.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };
  
  const handleDeleteDocument = async (id: number) => {
    console.log("Attempting to delete doc ID (needs backend):", id);
    try {
      setDocuments(documents.filter(doc => doc.id !== id));
      
      toast({
        title: 'Document deleted (UI only)',
        description: 'The document has been removed from the list.',
      });
    } catch (error: any) { 
      console.error('Error deleting document:', error);
      toast({
        title: 'Error deleting document',
        description: error.message || "An unknown error occurred",
        variant: 'destructive',
      });
    } 
  };
  
  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-1">Document Vault</h1>
        <p className="text-muted-foreground">
          Upload your tax documents and let us do the heavy lifting
        </p>
      </div>

      <Tabs defaultValue="all" className="w-full mb-6">
        <div className="border-b pb-2 overflow-x-auto scrollbar-hide">
          <TabsList className="w-auto">
            <TabsTrigger value="all">All Documents</TabsTrigger>
            <TabsTrigger value="income">Income Proof</TabsTrigger>
            <TabsTrigger value="investment">Investments</TabsTrigger>
            <TabsTrigger value="deduction">Deductions</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="all" className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <FileUploadCard
              title="Upload Documents"
              description="Drag and drop your documents or click to browse"
              className="bg-gradient-to-br from-background to-accent/10 hover:shadow-lg transition-all"
              onFileUpload={handleFileUpload}
            />
            
            <Card className="flex flex-col p-6 bg-gradient-to-br from-background to-primary/10 hover:shadow-lg transition-all cursor-pointer">
              <div className="text-center flex-1 flex flex-col items-center justify-center">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 mb-4">
                  <Camera className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-medium mb-1">Scan a Document</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Use your camera to capture documents
                </p>
                <Button>Scan Document</Button>
              </div>
            </Card>
            
            <Card className="flex flex-col p-6 bg-gradient-to-br from-background to-orange-500/10 hover:shadow-lg transition-all cursor-pointer">
              <div className="text-center flex-1 flex flex-col items-center justify-center">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/20 mb-4">
                  <Smartphone className="h-6 w-6 text-orange-500" />
                </div>
                <h3 className="text-lg font-medium mb-1">Import from Email</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Import documents directly from your email
                </p>
                <Button>Connect Email</Button>
              </div>
            </Card>
          </div>
          
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Your Documents</h2>
              <Button variant="outline" size="sm" className="hidden sm:flex gap-2">
                <UploadCloud className="h-4 w-4" />
                <span>Upload</span>
              </Button>
            </div>
            
            {loading && (
              <div className="py-12 text-center">
                <div className="animate-pulse">Loading documents...</div>
              </div>
            )}
            {error && !loading && (
                <Card className="py-12 text-center border-destructive bg-destructive/10">
                 <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center">
                        <AlertCircle className="h-8 w-8 text-destructive" />
                    </div>
                    <h3 className="text-lg font-medium text-destructive">Error Loading Documents</h3>
                    <p className="text-sm text-destructive/80 max-w-md mx-auto">{error}</p>
                    <Button variant="destructive" onClick={fetchDocuments} className="mt-4">Retry</Button>
                 </div>
                </Card>
            )}
            {!loading && !error && documents.length > 0 && (
              <div className="rounded-lg overflow-hidden bg-card">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Name</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Type</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Date Added</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documents.map((doc) => (
                        <tr key={doc.id} className="border-t hover:bg-muted/20 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                                <FileText className="h-4 w-4 text-accent" />
                              </div>
                              <span className="font-medium truncate max-w-[150px] md:max-w-xs">
                                {doc.original_filename}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 capitalize">
                                {doc.identified_type?.replace('_', ' ') || 'Unknown'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">
                            {new Date(doc.upload_timestamp).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="icon" className="text-muted-foreground" title="View Details (Not Implemented)">
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">View</span>
                              </Button>
                              <Button variant="ghost" size="icon" className="text-muted-foreground" title="Download (Not Implemented)">
                                <Download className="h-4 w-4" />
                                <span className="sr-only">Download</span>
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-destructive"
                                onClick={() => handleDeleteDocument(doc.id)}
                                title="Delete (Requires Backend)"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
             {!loading && !error && documents.length === 0 && (
              <Card className="py-12 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium">No documents yet</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Upload your tax documents like Form 16, salary slips, investment proofs, etc.
                    to automatically extract tax information.
                  </p>
                  <Button className="mt-4 gap-2">
                    <UploadCloud className="h-4 w-4" />
                    Upload Your First Document
                  </Button>
                </div>
              </Card>
            )}
          </div>
          
          {documents.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Processing Status</h2>
              </div>
              
              <Card className="p-6 bg-muted/20">
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2">
                        <h3 className="font-medium">Form 16 (2023-24).pdf</h3>
                        <p className="text-sm bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">In Progress</p>
                      </div>
                      <div className="mb-2">
                        <Progress value={65} className="h-2" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Extracting tax information. This may take a few minutes.
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="income" className="pt-6">
          <h2 className="text-xl font-semibold mb-4">Upload Income Proof</h2>
          <p className="text-muted-foreground mb-6">Upload monthly salary slips or Form 16 (PDF format only).</p>
          <FileUploadCard
              title="Upload Salary Slip / Form 16"
              description="Drag and drop your PDF document or click to browse"
              onFileUpload={handleFileUpload}
              disabled={uploading}
              acceptedFiles=".pdf"
            />
        </TabsContent>
        
        <TabsContent value="investment" className="pt-6">
          <div className="text-center py-12">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-medium mb-2">No Investment Documents</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Upload your investment proofs like PPF, ELSS, mutual fund statements to 
              automatically extract investment details
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="gap-2">
                <UploadCloud className="h-4 w-4" />
                Upload Investment Documents
              </Button>
              <Button variant="outline">Learn More</Button>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="deduction" className="pt-6">
          <div className="text-center py-12">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-medium mb-2">No Deduction Documents</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Upload your housing loan statements, medical bills, etc. to automatically extract 
              deduction details
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="gap-2">
                <UploadCloud className="h-4 w-4" />
                Upload Deduction Documents
              </Button>
              <Button variant="outline">Learn More</Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
