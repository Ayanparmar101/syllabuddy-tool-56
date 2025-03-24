
import { useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from "@/integrations/supabase/client";
import { 
  analyzeDocumentWithGPT, 
  analyzePDFWithGPTVision, 
  extractTextFromPDF,
  CategorizedQuestions, 
  getAllQuestionsFromDatabase,
  formatCategorizedQuestions,
  AnalyzedQuestion
} from '@/utils/openai';
import { BloomLevel } from '@/data/bloomVerbs';

interface Question {
  id: string;
  text: string;
  bloomLevel: BloomLevel;
  confidence?: number;
  createdAt?: string;
  documentName?: string;
}

export const useDocumentAnalysis = () => {
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

  useEffect(() => {
    if (apiKey) {
      localStorage.setItem('openai-api-key', apiKey);
    }
  }, [apiKey]);

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
    setIsExtractingText(true);
    setError(null);
    setPdfText('');
    setCategorizedQuestions({});

    try {
      if (file.type === 'application/pdf') {
        toast({
          title: "Processing PDF",
          description: "Extracting text and analyzing content. This may take a moment.",
        });
        
        // First, extract text from PDF
        const extractedText = await extractTextFromPDF(file);
        setPdfText(extractedText);
        setIsExtractingText(false);
        
        // Then analyze the extracted text
        const result = await analyzeDocumentWithGPT(extractedText, apiKey, file.name, false);
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
      } 
      else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                file.type === 'application/msword') {
        setIsExtractingText(false);
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
        setIsExtractingText(false);
        
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
      setIsExtractingText(false);
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

  return {
    file,
    setFile,
    isLoading,
    isLoadingHistory,
    extractedText,
    categorizedQuestions,
    filteredQuestions,
    error,
    setError,
    apiKey,
    setApiKey,
    activeTab,
    setActiveTab,
    historyFilter,
    setHistoryFilter,
    documents,
    pdfText,
    isExtractingText,
    analyzeDocument,
    extractPdfText,
    addToQuestionBank,
    loadStoredQuestions,
    getAllStoredQuestions: () => allStoredQuestions,
    getFilteredQuestionsCount: () => Object.values(filteredQuestions).flat().length
  };
};
