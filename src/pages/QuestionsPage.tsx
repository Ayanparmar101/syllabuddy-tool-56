
import React, { useState } from 'react';
import QuestionBuilder from '@/components/QuestionBuilder';
import QuestionBank from '@/components/QuestionBank';
import { Button } from '@/components/ui/button';
import { FileDown, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/components/ui/use-toast';

type BloomLevelType = 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';

type Question = {
  id: string;
  text: string;
  bloomLevel: BloomLevelType;
  marks?: number;
};

const QuestionsPage = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  const handleAddQuestion = (question: Question) => {
    if (editingQuestion) {
      // Update existing question
      setQuestions(
        questions.map(q => (q.id === editingQuestion.id ? question : q))
      );
      setEditingQuestion(null);
      toast({
        title: "Question updated",
        description: "The question has been successfully updated."
      });
    } else {
      // Add new question
      setQuestions([...questions, question]);
      toast({
        title: "Question added",
        description: "The question has been added to your question bank."
      });
    }
  };

  const handleDeleteQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
    toast({
      title: "Question deleted",
      description: "The question has been removed from your question bank."
    });
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGenerateDocument = () => {
    if (questions.length === 0) {
      toast({
        variant: "destructive",
        title: "No questions available",
        description: "Please add at least one question before generating a document."
      });
      return;
    }
    
    // In a real implementation, this would generate and download a document
    // For demonstration, we'll just show a success message
    toast({
      title: "Document generated",
      description: "Your question paper has been generated and is ready for download."
    });
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-4">Question Builder</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Create assessment questions aligned with Bloom's Taxonomy cognitive levels
        </p>
      </div>
      
      <div className="grid md:grid-cols-12 gap-8">
        <div className="md:col-span-5">
          <QuestionBuilder onAddQuestion={handleAddQuestion} />
        </div>
        
        <div className="md:col-span-7">
          <QuestionBank 
            questions={questions} 
            onDeleteQuestion={handleDeleteQuestion}
            onEditQuestion={handleEditQuestion}
          />
          
          {questions.length > 0 && (
            <div className="mt-6">
              <Button 
                onClick={handleGenerateDocument}
                className="bloom-btn-primary w-full"
              >
                <FileDown className="mr-2 h-4 w-4" />
                Generate Question Paper
              </Button>
            </div>
          )}
          
          {questions.length === 0 && (
            <div className="mt-6">
              <Alert>
                <AlertTriangle className="h-4 w-4 mr-2" />
                <AlertDescription>
                  Start by creating questions using the Question Builder. They will appear in your Question Bank.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionsPage;
