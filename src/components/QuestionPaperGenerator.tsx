
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { FileDown, Settings } from 'lucide-react';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { downloadQuestionPaper } from '@/utils/docxGenerator';
import type { QuestionItem } from '@/hooks/useQuestionDatabase';

interface QuestionPaperGeneratorProps {
  questions: QuestionItem[];
}

const QuestionPaperGenerator: React.FC<QuestionPaperGeneratorProps> = ({ questions }) => {
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [paperTitle, setPaperTitle] = useState('Question Paper');
  const [instructions, setInstructions] = useState('Answer all questions. Marks are indicated in brackets.');
  const [subjectName, setSubjectName] = useState('');
  const [duration, setDuration] = useState('3 hours');
  const [showSettings, setShowSettings] = useState(false);
  const [totalMarks, setTotalMarks] = useState(0);

  useEffect(() => {
    // Calculate total marks when selected questions change
    const total = questions
      .filter(q => selectedQuestions.includes(q.id))
      .reduce((sum, q) => sum + (q.marks || 0), 0);
    
    setTotalMarks(total);
  }, [selectedQuestions, questions]);

  const handleSelectQuestion = (id: string) => {
    setSelectedQuestions(prev => 
      prev.includes(id)
        ? prev.filter(qId => qId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedQuestions.length === questions.length) {
      setSelectedQuestions([]);
    } else {
      setSelectedQuestions(questions.map(q => q.id));
    }
  };

  const handleGeneratePaper = async () => {
    if (selectedQuestions.length === 0) {
      toast({
        title: "No questions selected",
        description: "Please select at least one question to generate a paper",
        variant: "destructive"
      });
      return;
    }

    try {
      const selectedQuestionsData = questions.filter(q => 
        selectedQuestions.includes(q.id)
      );

      await downloadQuestionPaper({
        title: paperTitle,
        subject: subjectName,
        duration: duration,
        instructions: instructions,
        questions: selectedQuestionsData,
        totalMarks: totalMarks
      });

      toast({
        title: "Success",
        description: "Question paper generated and downloaded successfully"
      });
    } catch (error) {
      console.error('Error generating question paper:', error);
      toast({
        title: "Error",
        description: "Failed to generate question paper",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Input
          value={paperTitle}
          onChange={(e) => setPaperTitle(e.target.value)}
          placeholder="Question Paper Title"
          className="text-lg font-bold"
        />
        
        <div className="grid grid-cols-2 gap-4">
          <Input
            value={subjectName}
            onChange={(e) => setSubjectName(e.target.value)}
            placeholder="Subject Name"
          />
          <Input
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="Duration (e.g., 3 hours)"
          />
        </div>
        
        <Collapsible open={showSettings} onOpenChange={setShowSettings}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full flex justify-between">
              <span>Paper Settings</span> 
              <Settings className="h-4 w-4" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Instructions</label>
                <Textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Enter instructions for students..."
                  className="min-h-[100px]"
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      <div className="rounded-md border">
        <div className="p-3 flex items-center justify-between bg-muted/50">
          <div className="flex items-center">
            <Checkbox 
              id="selectAll" 
              checked={selectedQuestions.length === questions.length && questions.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <label htmlFor="selectAll" className="ml-2 text-sm font-medium">
              Select All Questions
            </label>
          </div>
          <div className="text-sm font-medium">
            Selected: {selectedQuestions.length} questions ({totalMarks} marks)
          </div>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Question</TableHead>
              <TableHead>Bloom's Level</TableHead>
              <TableHead className="w-[100px]">Marks</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {questions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                  No questions available in the database
                </TableCell>
              </TableRow>
            ) : (
              questions.map((question) => (
                <TableRow key={question.id}>
                  <TableCell>
                    <Checkbox 
                      checked={selectedQuestions.includes(question.id)}
                      onCheckedChange={() => handleSelectQuestion(question.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{question.text}</TableCell>
                  <TableCell className="capitalize">{question.bloom_level}</TableCell>
                  <TableCell>{question.marks}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Button 
        className="w-full flex items-center justify-center"
        onClick={handleGeneratePaper}
        disabled={selectedQuestions.length === 0}
      >
        <FileDown className="mr-2 h-4 w-4" />
        Generate and Download
      </Button>
    </div>
  );
};

export default QuestionPaperGenerator;
