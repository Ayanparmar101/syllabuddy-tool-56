
import React, { useState, useEffect } from 'react';
import { useQuestionDatabase } from '@/hooks/useQuestionDatabase';
import QuestionBuilder from '@/components/QuestionBuilder';
import QuestionBank from '@/components/QuestionBank';
import QuestionPaperGenerator from '@/components/QuestionPaperGenerator';
import { Button } from '@/components/ui/button';
import { FileDown, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';

type BloomLevelType = 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';

const QuestionsPage = () => {
  const { 
    questions, 
    loading, 
    error, 
    fetchQuestions, 
    addQuestion, 
    updateQuestion, 
    deleteQuestion 
  } = useQuestionDatabase();
  
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleAddQuestion = (question: {
    id: string;
    text: string;
    bloomLevel: BloomLevelType;
    marks?: number;
    imageUrl?: string;
  }) => {
    if (editingQuestion) {
      // Update existing question
      updateQuestion({
        id: editingQuestion.id,
        text: question.text,
        bloom_level: question.bloomLevel,
        marks: question.marks,
        image_url: question.imageUrl
      }).then(() => {
        setEditingQuestion(null);
        toast({
          title: "Question updated",
          description: "The question has been successfully updated."
        });
      }).catch(err => {
        console.error('Error updating question:', err);
        toast({
          title: "Error",
          description: "Failed to update question",
          variant: "destructive"
        });
      });
    } else {
      // Add new question
      addQuestion({
        text: question.text,
        bloom_level: question.bloomLevel,
        marks: question.marks,
        image_url: question.imageUrl
      }).then(() => {
        toast({
          title: "Question added",
          description: "The question has been added to your question bank."
        });
      }).catch(err => {
        console.error('Error adding question:', err);
        toast({
          title: "Error",
          description: "Failed to add question",
          variant: "destructive"
        });
      });
    }
  };

  const handleDeleteQuestion = (id: string) => {
    deleteQuestion(id).then(() => {
      toast({
        title: "Question deleted",
        description: "The question has been removed from your question bank."
      });
    }).catch(err => {
      console.error('Error deleting question:', err);
      toast({
        title: "Error",
        description: "Failed to delete question",
        variant: "destructive"
      });
    });
  };

  const handleEditQuestion = (question: any) => {
    // Convert from database format to component format
    setEditingQuestion({
      id: question.id,
      text: question.text,
      bloomLevel: question.bloomLevel,
      marks: question.marks,
      imageUrl: question.imageUrl
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
            questions={questions.map(q => ({
              id: q.id,
              text: q.text,
              bloomLevel: q.bloom_level as BloomLevelType,
              marks: q.marks,
              imageUrl: q.image_url
            }))} 
            onDeleteQuestion={handleDeleteQuestion}
            onEditQuestion={handleEditQuestion}
          />
          
          {!loading && questions.length > 0 && (
            <div className="mt-6">
              <Dialog open={isGeneratorOpen} onOpenChange={setIsGeneratorOpen}>
                <DialogTrigger asChild>
                  <Button 
                    className="bloom-btn-primary w-full"
                  >
                    <FileDown className="mr-2 h-4 w-4" />
                    Generate Question Paper
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogTitle>Generate Question Paper</DialogTitle>
                  <DialogDescription>
                    Select questions and customize your question paper
                  </DialogDescription>
                  <QuestionPaperGenerator questions={questions} />
                </DialogContent>
              </Dialog>
            </div>
          )}
          
          {!loading && questions.length === 0 && (
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
