import { useState, useRef } from "react";
import { Upload, Check, File, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

interface FileUploadCardProps {
  title: string;
  description: string;
  acceptedFiles?: string;
  onFileUpload?: (file: File) => void;
  className?: string;
  disabled?: boolean;
}

export function FileUploadCard({
  title,
  description,
  acceptedFiles = "application/pdf,image/jpeg,image/png",
  onFileUpload,
  className,
  disabled,
}: FileUploadCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processFile(file);
      e.dataTransfer.clearData();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const processFile = (file: File | null) => {
    if (file && onFileUpload && !disabled) {
      setFileName(file.name);
      setIsUploading(true);
      setIsComplete(false);
      setTimeout(() => {
        onFileUpload(file);
        setIsUploading(false);
        setIsComplete(true);
        setTimeout(() => setIsComplete(false), 2000);
      }, 1000);
    } else {
      setFileName(null);
    }
  };

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const getFileIcon = () => {
    if (fileName?.toLowerCase().endsWith('.pdf')) {
      return <FileText className="h-6 w-6 text-red-500" />;
    }
    if (fileName?.toLowerCase().match(/\.(jpe?g|png|gif)$/)) {
      return <FileText className="h-6 w-6 text-blue-500" />;
    }
    return <File className="h-6 w-6 text-gray-500" />;
  };

  const reset = () => {
    setIsUploading(false);
    setUploadProgress(0);
    setIsComplete(false);
    setFileName(null);
  };

  return (
    <Card 
      className={cn(
        "border-2 border-dashed p-6 text-center transition-colors duration-200 ease-in-out", 
        isDragging ? "border-primary bg-primary/10" : "border-border hover:border-primary/50",
        disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
        className
      )}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        accept={acceptedFiles}
        disabled={disabled}
      />
      <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full">
        {!isUploading && !isComplete ? (
          <>
            <div className={cn("w-16 h-16 rounded-full flex items-center justify-center mb-4", disabled ? "bg-muted" : "bg-primary/10")}>
              <Upload className={cn("h-8 w-8", disabled ? "text-muted-foreground" : "text-primary")} />
            </div>
            <h3 className="font-medium text-lg mb-1">{title}</h3>
            <p className="text-sm text-muted-foreground mb-6">{description}</p>
            <Button variant="outline" size="sm" disabled={disabled} onClick={(e) => e.stopPropagation()}>
              Choose File
            </Button>
          </>
        ) : (
          <div className="w-full">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center mr-4">
                {isComplete ? (
                  <Check className="h-6 w-6 text-accent" />
                ) : (
                  getFileIcon()
                )}
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium truncate max-w-[200px]">{fileName || 'Processing file'}</p>
                <p className="text-sm text-muted-foreground">
                  {isComplete ? "Upload complete" : "Uploading..."}
                </p>
              </div>
            </div>
            
            {isUploading && (
              <>
                <Progress value={uploadProgress} className="h-1.5 mb-1" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{uploadProgress}%</span>
                  <span>{Math.round(uploadProgress * 1.8)} KB / {Math.round(100 * 1.8)} KB</span>
                </div>
              </>
            )}
            
            {isComplete && (
              <div className="mt-6 text-center">
                <p className="text-sm text-green-600 mb-4">File uploaded successfully!</p>
                <button
                  onClick={reset}
                  className="text-sm px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors"
                >
                  Upload another file
                </button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
