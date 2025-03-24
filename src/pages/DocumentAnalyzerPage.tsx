
import React from 'react';
import { Settings2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DocumentAnalysisSetting from '@/components/DocumentAnalysisSetting';
import DocumentUploader from '@/components/DocumentAnalyzer/DocumentUploader';
import DocumentHistory from '@/components/DocumentAnalyzer/DocumentHistory';
import DocumentContent from '@/components/DocumentAnalyzer/DocumentContent';
import { useDocumentAnalysis } from '@/hooks/useDocumentAnalysis';

const DocumentAnalyzerPage = () => {
  const {
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
    getFilteredQuestionsCount
  } = useDocumentAnalysis();

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
              
              <TabsContent value="upload">
                <DocumentUploader 
                  file={file}
                  setFile={setFile}
                  error={error}
                  setError={setError}
                  onExtractPdfText={extractPdfText}
                  onAnalyzeDocument={analyzeDocument}
                  isLoading={isLoading}
                  isExtractingText={isExtractingText}
                />
              </TabsContent>
              
              <TabsContent value="settings" className="p-6">
                <h2 className="text-xl font-semibold mb-6">API Settings</h2>
                <DocumentAnalysisSetting apiKey={apiKey} setApiKey={setApiKey} />
              </TabsContent>
            </Tabs>
          </div>

          <DocumentHistory 
            documents={documents}
            historyFilter={historyFilter}
            setHistoryFilter={setHistoryFilter}
            isLoadingHistory={isLoadingHistory}
            filteredQuestionsCount={getFilteredQuestionsCount()}
          />
        </div>
        
        <div className="md:col-span-7">
          <DocumentContent 
            isLoading={isLoading}
            isExtractingText={isExtractingText}
            pdfText={pdfText}
            categorizedQuestions={categorizedQuestions}
            filteredQuestions={filteredQuestions}
            extractedText={extractedText}
            addToQuestionBank={addToQuestionBank}
          />
        </div>
      </div>
    </div>
  );
};

export default DocumentAnalyzerPage;
