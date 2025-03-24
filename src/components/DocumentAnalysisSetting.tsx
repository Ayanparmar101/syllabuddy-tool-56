import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Trash2, Info } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";

interface DocumentAnalysisSettingProps {
  apiKey: string;
  setApiKey: (key: string) => void;
}

const DocumentAnalysisSetting: React.FC<DocumentAnalysisSettingProps> = ({ 
  apiKey, 
  setApiKey 
}) => {
  const [showApiKey, setShowApiKey] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [clearQuestions, setClearQuestions] = useState(true);
  const [clearDocuments, setClearDocuments] = useState(true);
  const [isValidatingKey, setIsValidatingKey] = useState(false);

  const handleDeleteData = async () => {
    try {
      if (clearQuestions) {
        const { error: questionsError } = await supabase
          .from('questions')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');
        
        if (questionsError) {
          throw questionsError;
        }
      }
      
      if (clearDocuments) {
        const { error: documentsError } = await supabase
          .from('documents')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');
        
        if (documentsError) {
          throw documentsError;
        }
      }
      
      const request = indexedDB.deleteDatabase('bloombuddy-db');
      
      request.onsuccess = () => {
        toast({
          title: "Data Cleared",
          description: "All analyzed questions and documents have been deleted.",
        });
      };
      
      request.onerror = () => {
        console.error("Error clearing IndexedDB");
      };
      
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error clearing data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to clear database data.",
      });
    }
  };

  const isValidApiKeyFormat = (key: string) => {
    return key && key.trim().length >= 20;
  };

  const validateApiKey = async () => {
    if (!apiKey || !isValidApiKeyFormat(apiKey)) {
      return false;
    }

    setIsValidatingKey(true);
    
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (response.ok) {
        const hasGpt4o = result.data && result.data.some(model => 
          model.id.includes('gpt-4o') || model.id.includes('gpt-4-o')
        );
        
        if (hasGpt4o) {
          toast({
            title: "API Key Valid",
            description: "Your OpenAI API key has been verified and has access to GPT-4o.",
          });
          return true;
        } else {
          toast({
            variant: "destructive",
            title: "API Key Valid, but Limited Access",
            description: "Your API key is valid but may not have access to GPT-4o models required for PDF analysis.",
          });
          return false;
        }
      } else {
        if (response.status === 401) {
          toast({
            variant: "destructive",
            title: "Invalid API Key",
            description: "The provided API key is not valid.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "API Validation Error",
            description: result.error?.message || "Could not validate the API key.",
          });
        }
        return false;
      }
    } catch (error) {
      console.error("Error validating API key:", error);
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Could not connect to OpenAI API to validate the key.",
      });
      return false;
    } finally {
      setIsValidatingKey(false);
    }
  };

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newKey = e.target.value;
    setApiKey(newKey);
  };

  const handleSaveApiKey = async () => {
    if (isValidApiKeyFormat(apiKey)) {
      const isValid = await validateApiKey();
      if (isValid) {
        localStorage.setItem('openai-api-key', apiKey);
      }
    } else {
      toast({
        variant: "destructive",
        title: "Invalid API Key Format",
        description: "Please provide a valid API key with at least 20 characters.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="api-key">OpenAI API Key</Label>
        <div className="flex gap-2">
          <div className="relative flex-grow">
            <Input
              id="api-key"
              type={showApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={handleApiKeyChange}
              placeholder="Enter your OpenAI API key"
              className={`font-mono pr-10 ${apiKey && !isValidApiKeyFormat(apiKey) ? 'border-red-500' : ''}`}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full"
              onClick={() => setShowApiKey(!showApiKey)}
            >
              {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          <Button 
            onClick={handleSaveApiKey} 
            disabled={!apiKey || isValidatingKey || !isValidApiKeyFormat(apiKey)}
          >
            {isValidatingKey ? 'Validating...' : 'Validate & Save'}
          </Button>
        </div>
        {apiKey && !isValidApiKeyFormat(apiKey) && (
          <p className="text-sm text-red-500 mt-1">
            Please enter a valid API key with at least 20 characters.
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          Your API key is required to analyze documents. It is stored in your browser and never sent to our servers.
        </p>

        <Alert className="mt-4 bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-500" />
          <AlertDescription className="text-sm text-blue-600">
            <p className="font-medium">Document Analysis Requirements:</p>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>PDFs are processed using GPT-4o's advanced vision capabilities</li>
              <li>PDF processing now supports multiple pages (up to 10 pages per document)</li>
              <li>Your OpenAI API key <strong>must have access</strong> to the GPT-4o model</li>
              <li>Paid OpenAI account required (Free trial credits may not work)</li>
              <li>Processing multi-page PDFs may take longer and use more API credits</li>
            </ul>
          </AlertDescription>
        </Alert>
      </div>

      <div className="pt-4 border-t">
        <h3 className="text-lg font-medium mb-2">Data Management</h3>
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive" className="w-full">
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Stored Data
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Clear Data</DialogTitle>
              <DialogDescription>
                This action will delete all stored data from your database. This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center space-x-2 my-4">
              <Switch
                id="clear-questions"
                checked={clearQuestions}
                onCheckedChange={setClearQuestions}
              />
              <Label htmlFor="clear-questions">Clear analyzed questions</Label>
            </div>
            <div className="flex items-center space-x-2 my-4">
              <Switch
                id="clear-documents"
                checked={clearDocuments}
                onCheckedChange={setClearDocuments}
              />
              <Label htmlFor="clear-documents">Clear document records</Label>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteData}>
                Delete Data
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <p className="text-sm text-muted-foreground mt-2">
          All data is stored in your Supabase database. You can clear it at any time.
        </p>
      </div>
    </div>
  );
};

export default DocumentAnalysisSetting;
