
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
import { FileDown, Settings, Eye } from 'lucide-react';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { downloadQuestionPaper } from '@/utils/docxGenerator';
import type { QuestionItem } from '@/hooks/useQuestionDatabase';
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";

interface QuestionPaperGeneratorProps {
  questions: QuestionItem[];
}

const QuestionPaperGenerator: React.FC<QuestionPaperGeneratorProps> = ({ questions }) => {
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [paperTitle, setPaperTitle] = useState('Question Paper');
  const [instructions, setInstructions] = useState('Answer all questions. Marks are indicated in brackets.');
  const [subjectName, setSubjectName] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [duration, setDuration] = useState('3 hours');
  const [showSettings, setShowSettings] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
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

  // Get selected questions data
  const selectedQuestionsData = questions.filter(q => 
    selectedQuestions.includes(q.id)
  );

  // Group questions by Bloom's level for the preview
  const questionsByBloomLevel = selectedQuestionsData.reduce((acc, question) => {
    const level = question.bloom_level || 'unknown';
    if (!acc[level]) {
      acc[level] = [];
    }
    acc[level].push(question);
    return acc;
  }, {} as Record<string, QuestionItem[]>);

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
                <label className="text-sm font-medium mb-2 block">Course Code</label>
                <Input
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                  placeholder="Enter course code"
                />
              </div>
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
        
        <ScrollArea className="h-[400px]">
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
        </ScrollArea>
      </div>

      <div className="flex space-x-4">
        <Button 
          className="flex-1 items-center justify-center"
          variant="outline"
          onClick={() => setShowPreview(!showPreview)}
          disabled={selectedQuestions.length === 0}
        >
          <Eye className="mr-2 h-4 w-4" />
          {showPreview ? "Hide Preview" : "Show Preview"}
        </Button>
        
        <Button 
          className="flex-1 items-center justify-center"
          onClick={handleGeneratePaper}
          disabled={selectedQuestions.length === 0}
        >
          <FileDown className="mr-2 h-4 w-4" />
          Generate and Download
        </Button>
      </div>

      {showPreview && selectedQuestions.length > 0 && (
        <Card className="mt-6 border-2">
          <CardContent className="p-0">
            <div className="p-6 space-y-6">
              {/* Header with logo */}
              <div className="flex items-center justify-center mb-6">
                <img 
                  src="/lovable-uploads/e77d7ec8-8fb7-4af7-afe8-d9e3f6d58b2e.png" 
                  alt="University Logo" 
                  className="h-20" 
                />
              </div>

              {/* Paper Header Table */}
              <div className="border border-black">
                <div className="text-center p-2 font-bold border-b border-black text-lg">
                  University Examinations – {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </div>
                
                <table className="w-full border-collapse">
                  <tbody>
                    <tr className="border-b border-black">
                      <td className="border-r border-black p-2 text-center font-medium" style={{ width: '30%' }}>Course Code</td>
                      <td className="border-r border-black p-2 text-center" style={{ width: '40%' }}>Course Title</td>
                      <td className="p-2 text-center font-medium" style={{ width: '30%' }}>MAX MARKS</td>
                    </tr>
                    <tr className="border-b border-black">
                      <td className="border-r border-black p-2 text-center">{courseCode || "XXXXXXXX"}</td>
                      <td className="border-r border-black p-2 text-center">{paperTitle}</td>
                      <td className="p-2 text-center">{totalMarks}</td>
                    </tr>
                    <tr>
                      <td className="border-r border-black p-2 text-center font-medium">Session</td>
                      <td className="border-r border-black p-2 text-center"></td>
                      <td className="p-2 text-center font-medium">
                        <div className="flex justify-between px-2">
                          <span>Duration</span>
                          <span>{duration}</span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Course Outcomes */}
              <div className="space-y-2">
                <div className="font-bold">COURSE OUTCOMES:</div>
                <ol className="list-decimal pl-6 space-y-1">
                  {instructions.split('\n').map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ol>
              </div>

              {/* Instructions */}
              <div className="space-y-2">
                <div className="font-bold">INSTRUCTION TO THE STUDENTS:</div>
                <ol className="list-decimal pl-6 space-y-1">
                  <li>Attempt all questions.</li>
                  <li>Make suitable assumptions wherever necessary.</li>
                  <li>Figures to the right indicate full marks.</li>
                </ol>
              </div>

              {/* Bloom's Taxonomy Table */}
              <div>
                <div className="font-bold mb-2">BLOOM'S TAXONOMY [BT]:</div>
                <table className="w-full border-collapse border border-black">
                  <tbody>
                    <tr className="border-b border-black">
                      <td className="border-r border-black p-2 text-center">Remember</td>
                      <td className="border-r border-black p-2 text-center">Understand</td>
                      <td className="border-r border-black p-2 text-center">Apply</td>
                      <td className="border-r border-black p-2 text-center">Analyze</td>
                      <td className="border-r border-black p-2 text-center">Evaluate</td>
                      <td className="p-2 text-center">Create</td>
                    </tr>
                    <tr>
                      <td className="border-r border-black p-2 text-center">R</td>
                      <td className="border-r border-black p-2 text-center">U</td>
                      <td className="border-r border-black p-2 text-center">A</td>
                      <td className="border-r border-black p-2 text-center">N</td>
                      <td className="border-r border-black p-2 text-center">E</td>
                      <td className="p-2 text-center">C</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Selected Questions */}
              <div className="space-y-4">
                <Separator />
                <div className="font-bold">Selected Questions:</div>
                
                <ScrollArea className="h-[400px] pr-4">
                  <ol className="list-decimal pl-6 space-y-4">
                    {selectedQuestionsData.map((q, index) => (
                      <li key={q.id} className="space-y-1">
                        <div className="flex justify-between">
                          <div className="flex-1">{q.text}</div>
                          <div className="ml-2 font-medium">[{q.marks} marks]</div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Bloom's Level: <span className="capitalize">{q.bloom_level}</span>
                        </div>
                      </li>
                    ))}
                  </ol>
                </ScrollArea>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QuestionPaperGenerator;
