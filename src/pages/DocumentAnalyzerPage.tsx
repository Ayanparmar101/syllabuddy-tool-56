
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, FileText, AlertTriangle, Loader2, Settings2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/components/ui/use-toast';
import BloomLevel from '@/components/BloomLevel';
import { BloomLevel as BloomLevelType } from '@/data/bloomVerbs';
import DocumentAnalysisSetting from '@/components/DocumentAnalysisSetting';
import { analyzeDocumentWithGPT, CategorizedQuestions } from '@/utils/openai';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Question {
  id: string;
  text: string;
  bloomLevel: BloomLevelType;
  confidence?: number;
}

const DocumentAnalyzerPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [extractedText, setExtractedText] = useState<string>('');
  const [categorizedQuestions, setCategorizedQuestions] = useState<CategorizedQuestions>({});
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('upload');

  // Load API key from localStorage on component mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem('openai-api-key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  // Save API key to localStorage when it changes
  useEffect(() => {
    if (apiKey) {
      localStorage.setItem('openai-api-key', apiKey);
    }
  }, [apiKey]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    setFile(selectedFile);
    setError(null);
    setExtractedText('');
    setCategorizedQuestions({});
  };

  const readFileContent = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        resolve(event.target?.result as string || '');
      };
      reader.onerror = (error) => {
        reject(error);
      };
      reader.readAsText(file);
    });
  };

  const analyzeDocument = async () => {
    if (!file) {
      setError('Please select a file to analyze');
      return;
    }

    if (!apiKey) {
      setError('Please enter your OpenAI API key in the settings tab');
      setActiveTab('settings');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Read file content
      let content = '';
      if (file.type === 'application/pdf') {
        // For PDF, we would use a PDF parser library
        // For simplicity in this demo, we'll just show a message and use a mock text
        content = "This is a sample PDF content with questions. What is the capital of France? How would you explain photosynthesis? Can you apply the Pythagorean theorem to solve this problem? Analyze the causes of World War II. Do you think climate change is a significant threat? How would you design a more efficient public transportation system?";
        toast({
          title: "PDF Processing",
          description: "In a full implementation, we would use a PDF parser library. Using sample text for demonstration.",
        });
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                file.type === 'application/msword') {
        // For DOCX/DOC, we would use a Word parser library
        // For simplicity in this demo, we'll just show a message and use a mock text
        content = "This is a sample Word document content with questions. What is the capital of France? How would you explain photosynthesis? Can you apply the Pythagorean theorem to solve this problem? Analyze the causes of World War II. Do you think climate change is a significant threat? How would you design a more efficient public transportation system?";
        toast({
          title: "Word Document Processing",
          description: "In a full implementation, we would use a Word parser library. Using sample text for demonstration.",
        });
      } else {
        // For text files, read directly
        content = await readFileContent(file);
      }

      setExtractedText(content);

      // Call OpenAI API to analyze the content
      const result = await analyzeDocumentWithGPT(content, apiKey);
      setCategorizedQuestions(result);

      toast({
        title: "Analysis Complete",
        description: "Document has been analyzed and questions have been categorized.",
      });
    } catch (err) {
      console.error('Error analyzing document:', err);
      setError('Failed to analyze document. Please check your API key and try again.');
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: "An error occurred while analyzing the document.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addToQuestionBank = (question: Question) => {
    // In a real implementation, this would add the question to the question bank
    // For now, just show a toast notification
    toast({
      title: "Question Added",
      description: `Added "${question.text.substring(0, 30)}..." to your question bank.`,
    });
  };

  // Order levels from lower to higher order thinking
  const orderedLevels: BloomLevelType[] = [
    'remember', 
    'understand', 
    'apply', 
    'analyze', 
    'evaluate', 
    'create'
  ];

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-4">Document Analyzer</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Upload a document to extract and categorize questions based on Bloom's Taxonomy using OpenAI's GPT-4o
        </p>
      </div>

      <div className="grid md:grid-cols-12 gap-8">
        <div className="md:col-span-5">
          <div className="bloom-card">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upload">Upload</TabsTrigger>
                <TabsTrigger value="settings">
                  <Settings2 className="h-4 w-4 mr-2" />
                  Settings
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="upload" className="p-6">
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
                      </div>
                    )}
                  </div>
                  
                  <Button 
                    onClick={analyzeDocument}
                    className="bloom-btn-primary w-full"
                    disabled={!file || isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Analyze Document
                      </>
                    )}
                  </Button>
                  
                  {error && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="settings" className="p-6">
                <h2 className="text-xl font-semibold mb-6">API Settings</h2>
                <DocumentAnalysisSetting apiKey={apiKey} setApiKey={setApiKey} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
        
        <div className="md:col-span-7">
          <div className="bloom-card p-6">
            <h2 className="text-xl font-semibold mb-6">Categorized Questions</h2>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3">Analyzing document content with GPT-4o...</span>
              </div>
            ) : Object.keys(categorizedQuestions).length > 0 ? (
              <div className="space-y-6">
                {orderedLevels.map(level => {
                  const questions = categorizedQuestions[level];
                  if (!questions || questions.length === 0) return null;
                  
                  return (
                    <div key={level} className="space-y-3">
                      <div className="flex items-center">
                        <BloomLevel level={level} />
                        <span className="ml-2 text-sm text-muted-foreground">
                          {questions.length} questions
                        </span>
                      </div>
                      
                      <div className="space-y-3">
                        {questions.map(question => (
                          <div 
                            key={question.id} 
                            className="p-4 rounded-lg bg-background border border-border hover:border-primary/30 transition-all duration-200"
                          >
                            <div className="flex justify-between items-start">
                              <p className="font-medium">{question.text}</p>
                              <Button
                                variant="outline"
                                size="sm"
                                className="ml-2 whitespace-nowrap"
                                onClick={() => addToQuestionBank(question)}
                              >
                                Add to Bank
                              </Button>
                            </div>
                            {question.confidence && (
                              <div className="mt-2 text-xs text-muted-foreground">
                                Confidence: {(question.confidence * 100).toFixed(0)}%
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : extractedText ? (
              <div className="text-center p-8">
                <p className="text-muted-foreground">No questions found in the document.</p>
              </div>
            ) : (
              <div className="text-center p-8">
                <p className="text-muted-foreground">Upload a document to see categorized questions.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentAnalyzerPage;
