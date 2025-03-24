
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, FileText, AlertTriangle, Loader2, Settings2, Clock, Database, FileTextIcon } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/components/ui/use-toast';
import BloomLevel from '@/components/BloomLevel';
import { BloomLevel as BloomLevelType } from '@/data/bloomVerbs';
import DocumentAnalysisSetting from '@/components/DocumentAnalysisSetting';
import { 
  analyzeDocumentWithGPT, 
  analyzePDFWithGPTVision, 
  extractTextFromPDF,
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
  const [pdfText, setPdfText] = useState<string>('');
  const [isExtractingText, setIsExtractingText] = useState(false);

  useEffect(() => {
    const savedApiKey = localStorage.getItem('openai-api-key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
    loadStoredQuestions();
    loadDocuments();
  }, []);

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
    setPdfText('');
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

  const extractPdfText = async () => {
    if (!file || file.type !== 'application/pdf') {
      setError('Please select a PDF file');
      return;
    }

    setIsExtractingText(true);
    setPdfText('');
    
    try {
      const text = await extractTextFromPDF(file);
      setPdfText(text);
      toast({
        title: "Text Extracted",
        description: "Successfully extracted text from PDF document.",
      });
    } catch (err) {
      console.error('PDF text extraction error:', err);
      setError(`Failed to extract text: ${err.message}`);
      toast({
        variant: "destructive",
        title: "Extraction Failed",
        description: err.message || "An error occurred while extracting text from the PDF.",
      });
    } finally {
      setIsExtractingText(false);
    }
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
      if (file.type === 'application/pdf') {
        // If we have extracted PDF text, use that for analysis instead of the PDF Vision API
        if (pdfText) {
          toast({
            title: "Analyzing Extracted Text",
            description: "Analyzing the extracted PDF text with GPT-4o. This may take a moment.",
          });
          
          // Remove the await storeQuestionsInSupabase call from the analyzeDocumentWithGPT function
          const result = await analyzeDocumentWithGPT(pdfText, apiKey, file.name, false);
          setCategorizedQuestions(result);
          
          const totalQuestions = Object.values(result).flat().length;
          
          if (totalQuestions === 0) {
            toast({
              title: "No Questions Found",
              description: "Could not detect questions in your PDF. Generated sample questions based on content.",
              variant: "destructive"
            });
          } else {
            toast({
              title: "PDF Analysis Complete",
              description: `Successfully analyzed PDF text and found ${totalQuestions} questions.`,
            });
          }
        } else {
          // If no text has been extracted yet, use the PDF Vision API
          toast({
            title: "Processing PDF",
            description: "Analyzing all pages of your PDF. This may take a moment for multi-page documents.",
          });
          
          try {
            // Pass false to skip automatic database storage
            const result = await analyzePDFWithGPTVision(file, apiKey, false);
            setCategorizedQuestions(result);
            
            const totalQuestions = Object.values(result).flat().length;
            
            if (totalQuestions === 0) {
              toast({
                title: "No Questions Found",
                description: "Could not detect questions in your PDF. Generated sample questions based on content.",
                variant: "destructive"
              });
            } else {
              toast({
                title: "PDF Analysis Complete",
                description: `Successfully analyzed PDF and found ${totalQuestions} questions across all pages.`,
              });
            }
          } catch (err) {
            console.error('PDF processing error:', err);
            setError(`PDF analysis failed: ${err.message}`);
            toast({
              variant: "destructive",
              title: "PDF Analysis Failed",
              description: err.message || "An error occurred while analyzing the PDF.",
            });
          }
        }
      } 
      else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                file.type === 'application/msword') {
        const mockContent = "This is sample Word document content extracted for analysis. What is the capital of France? How would you explain photosynthesis? Can you apply the Pythagorean theorem to solve this problem? Analyze the causes of World War II. Do you think climate change is a significant threat? How would you design a more efficient public transportation system?";
        
        setExtractedText(mockContent);
        // Pass false to skip automatic database storage
        const result = await analyzeDocumentWithGPT(mockContent, apiKey, file.name, false);
        setCategorizedQuestions(result);
        
        toast({
          title: "Word Document Analysis",
          description: "The Word document content has been analyzed and questions have been categorized.",
        });
      } 
      else {
        const content = await readFileContent(file);
        setExtractedText(content);
        // Pass false to skip automatic database storage
        const result = await analyzeDocumentWithGPT(content, apiKey, file.name, false);
        setCategorizedQuestions(result);
        
        const totalQuestions = Object.values(result).flat().length;
          
        if (totalQuestions === 0) {
          toast({
            title: "No Questions Found",
            description: "Could not detect questions in your document. Generated sample questions based on content.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Analysis Complete",
            description: `Successfully analyzed document and found ${totalQuestions} questions.`,
          });
        }
      }

      // Save the document information to Supabase (without saving questions)
      await saveDocumentToSupabase(file.name, file.type);
      
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

  // Add a function to save document information to Supabase
  const saveDocumentToSupabase = async (fileName: string, fileType: string): Promise<string> => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .insert({
          title: fileName,
          file_type: fileType,
          file_url: 'local',
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();
      
      if (error) {
        console.error('Error saving document to Supabase:', error);
        return '';
      }
      
      return data.id;
    } catch (error) {
      console.error('Supabase error:', error);
      return '';
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
          keywords: [],
          document_id: null // We don't have document ID here, but could be added
        });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Question Added",
        description: `Added "${question.text.substring(0, 30)}..." to your question bank.`,
      });
      
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

  useEffect(() => {
    if (historyFilter === 'all') {
      setFilteredQuestions(formatCategorizedQuestions(allStoredQuestions));
    } else if (historyFilter === 'latest') {
      const sorted = [...allStoredQuestions].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ).slice(0, 20);
      setFilteredQuestions(formatCategorizedQuestions(sorted));
    } else {
      const filtered = allStoredQuestions.filter(q => q.documentName === historyFilter);
      setFilteredQuestions(formatCategorizedQuestions(filtered));
    }
  }, [historyFilter, allStoredQuestions]);

  const documentNames = [...new Set(allStoredQuestions.map(q => q.documentName))].filter(Boolean) as string[];

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
          Upload a document to extract text and categorize questions based on Bloom's Taxonomy using OpenAI's GPT-4o
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
                        onClick={extractPdfText}
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
                      onClick={analyzeDocument}
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
              </TabsContent>
              
              <TabsContent value="settings" className="p-6">
                <h2 className="text-xl font-semibold mb-6">API Settings</h2>
                <DocumentAnalysisSetting apiKey={apiKey} setApiKey={setApiKey} />
              </TabsContent>
            </Tabs>
          </div>

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
            <h2 className="text-xl font-semibold mb-6">Document Content</h2>
            
            {isLoading || isExtractingText ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3">
                  {isExtractingText ? 'Extracting text from PDF...' : 'Analyzing document content with GPT-4o...'}
                </span>
              </div>
            ) : pdfText ? (
              <div className="border rounded-md p-4 bg-muted/30 overflow-auto max-h-[400px]">
                <pre className="whitespace-pre-wrap font-mono text-sm">{pdfText}</pre>
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
                <p className="text-muted-foreground">Upload a document to see extracted text or categorized questions.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentAnalyzerPage;
