
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import BloomLevelSelector from './BloomLevelSelector';
import VerbSelector from './VerbSelector';
import BloomLevel from './BloomLevel';
import { bloomVerbsData } from '@/data/bloomVerbs';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

type BloomLevelType = 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';

type QuestionBuilderProps = {
  onAddQuestion: (question: {
    id: string;
    text: string;
    bloomLevel: BloomLevelType;
    marks?: number;
  }) => void;
};

const QuestionBuilder: React.FC<QuestionBuilderProps> = ({ onAddQuestion }) => {
  const [selectedLevel, setSelectedLevel] = useState<BloomLevelType | null>(null);
  const [selectedVerbs, setSelectedVerbs] = useState<string[]>([]);
  const [questionText, setQuestionText] = useState('');
  const [marks, setMarks] = useState<number>(1);
  const [autoDetectedLevel, setAutoDetectedLevel] = useState<BloomLevelType | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'warning' | null;
    message: string;
  }>({ type: null, message: '' });

  // Reset the form when the level changes
  useEffect(() => {
    setSelectedVerbs([]);
    // Don't reset the question text to maintain context
  }, [selectedLevel]);

  // Auto-detect Bloom's level based on verbs in the question
  useEffect(() => {
    if (!questionText) {
      setAutoDetectedLevel(null);
      return;
    }

    // Extract words from the question
    const words = questionText.toLowerCase().match(/\b\w+\b/g) || [];
    
    // Check each word against the verb lists
    for (const level of Object.keys(bloomVerbsData) as BloomLevelType[]) {
      const levelVerbs = bloomVerbsData[level];
      const foundVerbs = words.filter(word => levelVerbs.includes(word));
      
      if (foundVerbs.length > 0) {
        setAutoDetectedLevel(level);
        return;
      }
    }
    
    setAutoDetectedLevel(null);
  }, [questionText]);

  const handleVerbSelect = (verb: string) => {
    if (selectedVerbs.includes(verb)) {
      setSelectedVerbs(selectedVerbs.filter(v => v !== verb));
    } else {
      setSelectedVerbs([...selectedVerbs, verb]);
    }
    
    // Add the verb to the question text if it's not already there
    if (!questionText.toLowerCase().includes(verb.toLowerCase())) {
      const updatedText = questionText ? `${questionText} ${verb}` : verb;
      setQuestionText(updatedText);
    }
  };

  const handleAddQuestion = () => {
    if (!questionText.trim()) {
      setNotification({
        type: 'warning',
        message: 'Please enter question text'
      });
      return;
    }
    
    if (!selectedLevel) {
      setNotification({
        type: 'warning',
        message: 'Please select a Bloom\'s Taxonomy level'
      });
      return;
    }
    
    onAddQuestion({
      id: Date.now().toString(),
      text: questionText.trim(),
      bloomLevel: selectedLevel,
      marks: marks
    });
    
    // Reset the form
    setQuestionText('');
    setSelectedVerbs([]);
    setSelectedLevel(null);
    setMarks(1);
    
    setNotification({
      type: 'success',
      message: 'Question added successfully'
    });
    
    // Clear the notification after 3 seconds
    setTimeout(() => {
      setNotification({ type: null, message: '' });
    }, 3000);
  };

  return (
    <div className="bloom-card animate-scale-in">
      <h2 className="text-xl font-semibold mb-6">Question Builder</h2>
      
      {notification.type && (
        <div className={`flex items-center p-3 mb-4 rounded-lg ${
          notification.type === 'success' 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-amber-50 text-amber-700 border border-amber-200'
        }`}>
          {notification.type === 'success' 
            ? <CheckCircle className="h-5 w-5 mr-2" /> 
            : <AlertCircle className="h-5 w-5 mr-2" />
          }
          <span>{notification.message}</span>
          <button 
            onClick={() => setNotification({ type: null, message: '' })}
            className="ml-auto"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Select Bloom's Level</label>
          <BloomLevelSelector 
            selectedLevel={selectedLevel} 
            onChange={setSelectedLevel} 
          />
          
          {autoDetectedLevel && !selectedLevel && (
            <div className="mt-2 text-sm text-muted-foreground flex items-center">
              <span>Detected level: </span>
              <BloomLevel level={autoDetectedLevel} className="ml-2" />
              <Button 
                variant="ghost" 
                size="sm" 
                className="ml-2 h-7 text-xs"
                onClick={() => setSelectedLevel(autoDetectedLevel)}
              >
                Use this
              </Button>
            </div>
          )}
        </div>
        
        {selectedLevel && (
          <div>
            <label className="block text-sm font-medium mb-2">
              Select Verbs for {selectedLevel.charAt(0).toUpperCase() + selectedLevel.slice(1)} Level
            </label>
            <VerbSelector 
              verbs={bloomVerbsData[selectedLevel]} 
              onSelect={handleVerbSelect}
              selectedVerbs={selectedVerbs}
            />
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium mb-2">Question Text</label>
          <Textarea 
            className="bloom-input"
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="Type your question here..."
            rows={3}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Marks</label>
          <Input 
            type="number" 
            min="1"
            max="100"
            className="bloom-input w-24"
            value={marks}
            onChange={(e) => setMarks(parseInt(e.target.value) || 1)}
          />
        </div>
        
        <Button 
          onClick={handleAddQuestion}
          className="bloom-btn-primary w-full"
        >
          Add Question
        </Button>
      </div>
    </div>
  );
};

export default QuestionBuilder;
