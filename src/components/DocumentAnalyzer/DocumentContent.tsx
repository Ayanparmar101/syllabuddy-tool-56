
import React from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BloomLevel from '@/components/BloomLevel';
import { BloomLevel as BloomLevelType } from '@/data/bloomVerbs';

interface Question {
  id: string;
  text: string;
  bloomLevel: BloomLevelType;
  confidence?: number;
  createdAt?: string;
  documentName?: string;
}

interface DocumentContentProps {
  isLoading: boolean;
  isExtractingText: boolean;
  pdfText: string;
  categorizedQuestions: Record<string, Question[]>;
  filteredQuestions: Record<string, Question[]>;
  extractedText: string;
  addToQuestionBank: (question: Question) => Promise<void>;
}

const DocumentContent: React.FC<DocumentContentProps> = ({
  isLoading,
  isExtractingText,
  pdfText,
  categorizedQuestions,
  filteredQuestions,
  extractedText,
  addToQuestionBank,
}) => {
  const orderedLevels: BloomLevelType[] = [
    'remember', 
    'understand', 
    'apply', 
    'analyze', 
    'evaluate', 
    'create'
  ];

  const renderQuestionList = (questions: Record<string, Question[]>) => (
    <div className="space-y-6">
      {orderedLevels.map(level => {
        const levelQuestions = questions[level];
        if (!levelQuestions || levelQuestions.length === 0) return null;
        
        return (
          <div key={level} className="space-y-3">
            <div className="flex items-center">
              <BloomLevel level={level} />
              <span className="ml-2 text-sm text-muted-foreground">
                {levelQuestions.length} questions
              </span>
            </div>
            
            <div className="space-y-3">
              {levelQuestions.map(question => (
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
  );

  const renderContent = () => {
    if (isLoading || isExtractingText) {
      return (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3">
            {isExtractingText ? 'Extracting text from PDF...' : 'Analyzing document content with GPT-4o...'}
          </span>
        </div>
      );
    }

    // Show categorized questions first if they exist
    if (Object.keys(categorizedQuestions).length > 0) {
      return renderQuestionList(categorizedQuestions);
    }

    // If viewing history questions
    if (Object.keys(filteredQuestions).length > 0) {
      return renderQuestionList(filteredQuestions);
    }

    // If PDF text was extracted but no questions were categorized
    if (pdfText) {
      return (
        <div>
          <p className="mb-4 text-muted-foreground">Extracted text from PDF:</p>
          <div className="border rounded-md p-4 bg-muted/30 overflow-auto max-h-[400px]">
            <pre className="whitespace-pre-wrap font-mono text-sm">{pdfText}</pre>
          </div>
        </div>
      );
    }

    if (extractedText) {
      return (
        <div className="text-center p-8">
          <p className="text-muted-foreground">No questions found in the document.</p>
        </div>
      );
    }

    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">Upload a document to see extracted text or categorized questions.</p>
      </div>
    );
  };

  return (
    <div className="bloom-card p-6">
      <h2 className="text-xl font-semibold mb-6">Document Content</h2>
      {renderContent()}
    </div>
  );
};

export default DocumentContent;
