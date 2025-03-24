
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Trash2 } from 'lucide-react';
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

  const handleDeleteData = () => {
    // Clear IndexedDB data
    if (clearQuestions) {
      const request = indexedDB.deleteDatabase('bloombuddy-db');
      
      request.onsuccess = () => {
        toast({
          title: "Data Cleared",
          description: "All analyzed questions have been deleted.",
        });
      };
      
      request.onerror = () => {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to clear database.",
        });
      };
    }
    
    setIsDeleteDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="api-key">OpenAI API Key</Label>
        <div className="flex">
          <Input
            id="api-key"
            type={showApiKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your OpenAI API key"
            className="font-mono pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="ml-[-40px]"
            onClick={() => setShowApiKey(!showApiKey)}
          >
            {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Your API key is required to analyze documents. It is only stored in your browser and never sent to our servers.
        </p>
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
                This action will delete all stored data from your browser. This cannot be undone.
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
          All data is stored locally in your browser. You can clear it at any time.
        </p>
      </div>
    </div>
  );
};

export default DocumentAnalysisSetting;
