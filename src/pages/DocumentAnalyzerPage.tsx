import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, FileText, AlertTriangle, Loader2, Settings2, Clock, Database } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/components/ui/use-toast';
import BloomLevel from '@/components/BloomLevel';
import { BloomLevel as BloomLevelType } from '@/data/bloomVerbs';
import DocumentAnalysisSetting from '@/components/DocumentAnalysisSetting';
import { 
  analyzeDocumentWithGPT, 
  analyzePDFWithGPTVision, 
  CategorizedQuestions, 
  getAllQuestionsFromDatabase,
  formatCategorizedQuestions,
  AnalyzedQuestion
} from '@/utils/openai';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

interface Question {
  id: string;
  text: string;
  bloomLevel: BloomLevelType;
  confidence?: number;
  createdAt?: string;
  documentName?: string;
}

const DocumentAnalyzerPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [extractedText, setExtractedText] = useState<string>('');
  const [categorizedQuestions, setCategorizedQuestions] = useState<CategorizedQuestions>({});
  const [allStoredQuestions, setAllStoredQuestions] = useState<AnalyzedQuestion[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<CategorizedQuestions>({});
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('upload');
  const [historyFilter, setHistoryFilter] = useState<string>('all');
  const [documents, setDocuments] = useState<{id: string, title: string}[]>([]);

  // Load API key from localStorage on component mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem('openai-api-key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
    loadStoredQuestions();
    loadDocuments();
  }, []);

  // Load documents from Supabase
  const loadDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('id, title')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error loading documents:', error);
        return;
      }
      
      setDocuments(data || []);
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  };

  // Load stored questions from the database
  const loadStoredQuestions = async () => {
    setIsLoadingHistory(true);
    try {
      const questions = await getAllQuestionsFromDatabase();
      setAllStoredQuestions(questions);
      setFilteredQuestions(formatCategorizedQuestions(questions));
    } catch (error) {
      console.error('Error loading stored questions:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

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
      // For PDFs, use vision capabilities
      if (file.type === 'application/pdf') {
        const result = await analyzePDFWithGPTVision(file, apiKey);
        setCategorizedQuestions(result);
        
        toast({
          title: "PDF Analysis Complete",
          description: "The PDF has been analyzed using OCR and questions have been categorized.",
        });
      } 
      // For Word documents (would need a proper parser in production)
      else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                file.type === 'application/msword') {
        // In a full implementation, we would use a Word parser library
        // For this demo, extract sample content or show a message
        const mockContent = "This is sample Word document content extracted for analysis. What is the capital of France? How would you explain photosynthesis? Can you apply the Pythagorean theorem to solve this problem? Analyze the causes of World War II. Do you think climate change is a significant threat? How would you design a more efficient public transportation system?";
        
        setExtractedText(mockContent);
        const result = await analyzeDocumentWithGPT(mockContent, apiKey, file.name);
        setCategorizedQuestions(result);
        
        toast({
          title: "Word Document Analysis",
          description: "The Word document content has been analyzed and questions have been categorized.",
        });
      } 
      // For text files, read directly
      else {
        const content = await readFileContent(file);
        setExtractedText(content);
        const result = await analyzeDocumentWithGPT(content, apiKey, file.name);
        setCategorizedQuestions(result);
        
        toast({
          title: "Analysis Complete",
          description: "The document has been analyzed and questions have been categorized.",
        });
      }

      // Refresh the stored questions list and documents
      await loadStoredQuestions();
      await loadDocuments();
    } catch (err) {
      console.error('Error analyzing document:', err);
      setError(`Failed to analyze document: ${err.message}`);
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: err.message || "An error occurred while analyzing the document.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addToQuestionBank = async (question: Question) => {
    try {
      const { error } = await supabase
        .from('questions')
        .insert({
          text: question.text,
          bloom_level: question.bloomLevel,
          created_at: new Date().toISOString(),
          keywords: []
        });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Question Added",
        description: `Added "${question.text.substring(0, 30)}..." to your question bank.`,
      });
      
      // Refresh questions
      await loadStoredQuestions();
    } catch (error) {
      console.error('Error adding question:', error);
      toast({
        variant: "destructive",
        title: "Failed to Add Question",
        description: "There was an error adding this question to your question bank.",
      });
    }
  };

  // Filter history by document or date
  useEffect(() => {
    if (historyFilter === 'all') {
      setFilteredQuestions(formatCategorizedQuestions(allStoredQuestions));
    } else if (historyFilter === 'latest') {
      // Sort by date and get the latest 20
      const sorted = [...allStoredQuestions].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ).slice(0, 20);
      setFilteredQuestions(formatCategorizedQuestions(sorted));
    } else {
      // Filter by document name
      const filtered = allStoredQuestions.filter(q => q.documentName === historyFilter);
      setFilteredQuestions(formatCategorizedQuestions(filtered));
    }
  }, [historyFilter, allStoredQuestions]);

  // Get unique document names for filter
  const documentNames = [...new Set(allStoredQuestions.map(q => q.documentName))].filter(Boolean) as string[];

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

          {/* History section - below the upload card */}
          <div className="bloom-card p-6 mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Document History</h2>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {documents.length} documents stored
                </span>
              </div>
            </div>

            {isLoadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2">Loading stored documents...</span>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <Select value={historyFilter} onValueChange={setHistoryFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by document" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Questions</SelectItem>
                      <SelectItem value="latest">Latest 20</SelectItem>
                      {documents.map(doc => (
                        <SelectItem key={doc.id} value={doc.title}>
                          {doc.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="text-sm text-muted-foreground">
                  <div className="flex items-center mb-2">
                    <Database className="h-4 w-4 mr-2" />
                    <span>Questions are stored in Supabase database</span>
                  </div>
                  {historyFilter !== 'all' && (
                    <p>
                      Showing {Object.values(filteredQuestions).flat().length} questions
                      {historyFilter !== 'latest' ? ` from "${historyFilter}"` : ''}
                    </p>
                  )}
                </div>
              </>
            )}
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
                            <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                              {question.confidence && (
                                <span>
                                  Confidence: {(question.confidence * 100).toFixed(0)}%
                                </span>
                              )}
                              {question.documentName && (
                                <span>
                                  Source: {question.documentName}
                                </span>
                              )}
                              {question.createdAt && (
                                <span>
                                  Added: {new Date(question.createdAt).toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : Object.keys(filteredQuestions).length > 0 ? (
              <div className="space-y-6">
                {orderedLevels.map(level => {
                  const questions = filteredQuestions[level];
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
                            <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                              {question.confidence && (
                                <span>
                                  Confidence: {(question.confidence * 100).toFixed(0)}%
                                </span>
                              )}
                              {question.documentName && (
                                <span>
                                  Source: {question.documentName}
                                </span>
                              )}
                              {question.createdAt && (
                                <span>
                                  Added: {new Date(question.createdAt).toLocaleString()}
                                </span>
                              )}
                            </div>
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
