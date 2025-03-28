
import React from 'react';
import BloomLevel from './BloomLevel';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2, Image } from 'lucide-react';

type BloomLevelType = 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';

type Question = {
  id: string;
  text: string;
  bloomLevel: BloomLevelType;
  marks?: number;
  imageUrl?: string | null;
};

type QuestionBankProps = {
  questions: Question[];
  onDeleteQuestion: (id: string) => void;
  onEditQuestion: (question: Question) => void;
};

const QuestionBank: React.FC<QuestionBankProps> = ({ 
  questions, 
  onDeleteQuestion,
  onEditQuestion 
}) => {
  // Group questions by Bloom's level
  const groupedQuestions = questions.reduce((acc, question) => {
    if (!acc[question.bloomLevel]) {
      acc[question.bloomLevel] = [];
    }
    acc[question.bloomLevel].push(question);
    return acc;
  }, {} as Record<BloomLevelType, Question[]>);

  // Order levels from lower to higher order thinking
  const orderedLevels: BloomLevelType[] = [
    'remember', 
    'understand', 
    'apply', 
    'analyze', 
    'evaluate', 
    'create'
  ];
  
  if (questions.length === 0) {
    return (
      <div className="bloom-card text-center p-8 animate-scale-in">
        <div className="text-muted-foreground mb-4">
          No questions added yet. Use the Question Builder to create questions.
        </div>
        <div className="flex justify-center">
          <div className="bloom-tag bg-blue-100 text-blue-800 mx-1">Remember</div>
          <div className="bloom-tag bg-green-100 text-green-800 mx-1">Understand</div>
          <div className="bloom-tag bg-yellow-100 text-yellow-800 mx-1">Apply</div>
        </div>
      </div>
    );
  }

  const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 1), 0);

  return (
    <div className="bloom-card animate-scale-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Question Bank</h2>
        <div className="bloom-tag bg-secondary text-foreground">
          Total: {questions.length} questions ({totalMarks} marks)
        </div>
      </div>
      
      <div className="space-y-6">
        {orderedLevels.map(level => {
          const levelQuestions = groupedQuestions[level];
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
                    <div className="flex justify-between">
                      <div className="flex-1 mr-4">
                        <p className="font-medium">{question.text}</p>
                        {question.imageUrl && (
                          <div className="mt-3 relative rounded-md overflow-hidden border border-border">
                            <img 
                              src={question.imageUrl}
                              alt="Question image" 
                              className="max-h-48 max-w-full object-contain"
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex items-start space-x-2">
                        <div className="flex items-center space-x-2">
                          {question.imageUrl && (
                            <Image className="h-4 w-4 text-blue-500" />
                          )}
                          <div className="bloom-tag bg-secondary text-foreground">
                            {question.marks || 1} {(question.marks || 1) === 1 ? 'mark' : 'marks'}
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => onEditQuestion(question)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => onDeleteQuestion(question.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default QuestionBank;
