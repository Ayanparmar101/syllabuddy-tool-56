
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface DocumentAnalysisSettingProps {
  apiKey: string;
  setApiKey: (key: string) => void;
}

const DocumentAnalysisSetting: React.FC<DocumentAnalysisSettingProps> = ({ 
  apiKey, 
  setApiKey 
}) => {
  const [showApiKey, setShowApiKey] = useState(false);

  return (
    <div className="space-y-4">
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
    </div>
  );
};

export default DocumentAnalysisSetting;
