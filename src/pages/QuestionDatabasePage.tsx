import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { 
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { FileDown, PlusCircle, Trash2, Edit, FileText } from 'lucide-react';
import BloomLevelSelector from '@/components/BloomLevelSelector';
import { useQuestionDatabase } from '@/hooks/useQuestionDatabase';
import QuestionPaperGenerator from '@/components/QuestionPaperGenerator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Pagination,
  PaginationContent,
  PaginationItem, 
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination';

const QuestionDatabasePage = () => {
  const { 
    questions, 
    loading, 
    error, 
    addQuestion, 
    deleteQuestion, 
    updateQuestion,
    fetchQuestions
  } = useQuestionDatabase();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  
  const [questionText, setQuestionText] = useState('');
  const [bloomLevel, setBloomLevel] = useState<any>(null);
  const [marks, setMarks] = useState(1);

  const [currentPage, setCurrentPage] = useState(1);
  const questionsPerPage = 10;
  
  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleSaveQuestion = async () => {
    if (!questionText.trim()) {
      toast({
        title: "Error",
        description: "Question text cannot be empty",
        variant: "destructive"
      });
      return;
    }

    if (!bloomLevel) {
      toast({
        title: "Error",
        description: "Please select a Bloom's level",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingQuestion) {
        await updateQuestion({
          id: editingQuestion.id,
          text: questionText,
          bloom_level: bloomLevel,
          marks: marks
        });
        toast({
          title: "Success",
          description: "Question updated successfully"
        });
      } else {
        await addQuestion({
          text: questionText,
          bloom_level: bloomLevel,
          marks: marks
        });
        toast({
          title: "Success",
          description: "Question added to database"
        });
      }
      
      setQuestionText('');
      setBloomLevel(null);
      setMarks(1);
      setEditingQuestion(null);
      setIsAddDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save question",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (question: any) => {
    setEditingQuestion(question);
    setQuestionText(question.text);
    setBloomLevel(question.bloom_level);
    setMarks(question.marks || 1);
    setIsAddDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      try {
        await deleteQuestion(id);
        toast({
          title: "Success",
          description: "Question deleted successfully"
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete question",
          variant: "destructive"
        });
      }
    }
  };

  const indexOfLastQuestion = currentPage * questionsPerPage;
  const indexOfFirstQuestion = indexOfLastQuestion - questionsPerPage;
  const currentQuestions = questions.slice(indexOfFirstQuestion, indexOfLastQuestion);
  const totalPages = Math.ceil(questions.length / questionsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-4">Question Database</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Manage your question bank and generate question papers
        </p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Question
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>{editingQuestion ? 'Edit Question' : 'Add New Question'}</DialogTitle>
              <DialogDescription>
                Enter the question details below
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Question Text</label>
                <Textarea 
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="Enter your question here..."
                  className="min-h-[100px]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Bloom's Taxonomy Level</label>
                <BloomLevelSelector
                  selectedLevel={bloomLevel}
                  onChange={setBloomLevel}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Marks</label>
                <Input
                  type="number"
                  min="1"
                  value={marks}
                  onChange={(e) => setMarks(parseInt(e.target.value) || 1)}
                  className="w-24"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => {
                setIsAddDialogOpen(false);
                setEditingQuestion(null);
                setQuestionText('');
                setBloomLevel(null);
                setMarks(1);
              }}>
                Cancel
              </Button>
              <Button onClick={handleSaveQuestion}>
                {editingQuestion ? 'Update' : 'Save'} Question
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Drawer open={isGeneratorOpen} onOpenChange={setIsGeneratorOpen}>
          <DrawerTrigger asChild>
            <Button variant="outline" className="flex items-center">
              <FileText className="mr-2 h-4 w-4" />
              Generate Question Paper
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <div className="mx-auto w-full max-w-4xl">
              <DrawerHeader>
                <DrawerTitle>Generate Question Paper</DrawerTitle>
                <DrawerDescription>
                  Select questions and customize your question paper
                </DrawerDescription>
              </DrawerHeader>
              <div className="p-4">
                <QuestionPaperGenerator questions={questions} />
              </div>
              <DrawerFooter>
                <DrawerClose asChild>
                  <Button variant="outline">Close</Button>
                </DrawerClose>
              </DrawerFooter>
            </div>
          </DrawerContent>
        </Drawer>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading questions...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">
          Error loading questions. Please try again.
        </div>
      ) : (
        <div className="bg-white rounded-md shadow">
          <ScrollArea className="h-[500px] rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Question</TableHead>
                  <TableHead>Bloom's Level</TableHead>
                  <TableHead>Marks</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {questions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No questions added yet. Click "Add Question" to create one.
                    </TableCell>
                  </TableRow>
                ) : (
                  currentQuestions.map((question) => (
                    <TableRow key={question.id}>
                      <TableCell className="font-medium">{question.text}</TableCell>
                      <TableCell className="capitalize">{question.bloom_level}</TableCell>
                      <TableCell>{question.marks}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(question)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(question.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
          
          {questions.length > questionsPerPage && (
            <div className="mt-4 flex justify-center">
              <Pagination>
                <PaginationContent>
                  {currentPage > 1 && (
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => handlePageChange(currentPage - 1)} 
                      />
                    </PaginationItem>
                  )}
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink 
                        isActive={currentPage === page}
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  
                  {currentPage < totalPages && (
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => handlePageChange(currentPage + 1)} 
                      />
                    </PaginationItem>
                  )}
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuestionDatabasePage;
