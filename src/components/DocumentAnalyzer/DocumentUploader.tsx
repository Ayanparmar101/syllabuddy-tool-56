
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, FileText, Loader2, FileTextIcon } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface DocumentUploaderProps {
  file: File | null;
  setFile: (file: File | null) => void;
  error: string | null;
  setError: (error: string | null) => void;
  onExtractPdfText: () => Promise<void>;
  onAnalyzeDocument: () => Promise<void>;
  isLoading: boolean;
  isExtractingText: boolean;
}

const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  file,
  setFile,
  error,
  setError,
  onExtractPdfText,
  onAnalyzeDocument,
  isLoading,
  isExtractingText
}) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    setFile(selectedFile);
    setError(null);
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-6">Upload Document</h2>
      
      <div className="space-y-6">
        <div className="flex flex-col space-y-2">
          <label className="text-sm font-medium">Select a PDF, Word, or text document</label>
          <Input 
            type="file" 
            accept=".pdf,.docx,.doc,.txt" 
            onChange={handleFileChange}
            className="cursor-pointer"
          />
          {file && (
            <div className="flex items-center text-sm">
              <FileText className="h-4 w-4 mr-2" />
              <span>{file.name} ({(file.size / 1024).toFixed(2)} KB)</span>
              {file.type === 'application/pdf' && (
                <span className="ml-2 text-blue-500 text-xs">
                  Multi-page support enabled
                </span>
              )}
            </div>
          )}
          {file && file.type === 'application/pdf' && (
            <p className="text-xs text-muted-foreground">
              PDF analysis will process up to 10 pages. For best results, ensure your PDF is clear and text-based.
            </p>
          )}
        </div>
        
        <div className="flex flex-col gap-2">
          {file && file.type === 'application/pdf' && (
            <Button 
              onClick={onExtractPdfText}
              className="w-full"
              disabled={!file || isExtractingText}
              variant="outline"
            >
              {isExtractingText ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Extracting Text...
                </>
              ) : (
                <>
                  <FileTextIcon className="mr-2 h-4 w-4" />
                  Extract Text from PDF
                </>
              )}
            </Button>
          )}
          
          <Button 
            onClick={onAnalyzeDocument}
            className="bloom-btn-primary w-full"
            disabled={!file || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {file && file.type === 'application/pdf' ? 'Analyzing PDF pages...' : 'Analyzing...'}
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Analyze Document
              </>
            )}
          </Button>
        </div>
        
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
};

export default DocumentUploader;
