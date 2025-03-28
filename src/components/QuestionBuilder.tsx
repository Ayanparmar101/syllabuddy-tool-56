
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import BloomLevelSelector from './BloomLevelSelector';
import VerbSelector from './VerbSelector';
import BloomLevel from './BloomLevel';
import { bloomVerbsData } from '@/data/bloomVerbs';
import { X, CheckCircle, AlertCircle, Image, Upload, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

type BloomLevelType = 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';

type QuestionBuilderProps = {
  onAddQuestion: (question: {
    id: string;
    text: string;
    bloomLevel: BloomLevelType;
    marks?: number;
    imageUrl?: string;
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
  
  // Image upload related states
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImagePreview(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setImageUrl(null);
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!selectedImage) return null;
    
    setUploadingImage(true);
    try {
      const fileExt = selectedImage.name.split('.').pop();
      const filePath = `${uuidv4()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('question_images')
        .upload(filePath, selectedImage);
      
      if (error) {
        throw error;
      }
      
      // Get the public URL
      const { data: publicUrlData } = supabase.storage
        .from('question_images')
        .getPublicUrl(filePath);
      
      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      setNotification({
        type: 'warning',
        message: 'Failed to upload image. Please try again.'
      });
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddQuestion = async () => {
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
    
    // First upload image if one is selected
    let uploadedImageUrl = null;
    if (selectedImage) {
      uploadedImageUrl = await uploadImage();
      if (!uploadedImageUrl && selectedImage) {
        // Image upload failed but was required
        return;
      }
    }
    
    onAddQuestion({
      id: Date.now().toString(),
      text: questionText.trim(),
      bloomLevel: selectedLevel,
      marks: marks,
      imageUrl: uploadedImageUrl || undefined
    });
    
    // Reset the form
    setQuestionText('');
    setSelectedVerbs([]);
    setSelectedLevel(null);
    setMarks(1);
    setSelectedImage(null);
    setImagePreview(null);
    setImageUrl(null);
    
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
          <label className="block text-sm font-medium mb-2">Add Image (Optional)</label>
          <div className="flex items-center space-x-2">
            <Input
              type="file"
              id="questionImage"
              className="hidden"
              onChange={handleImageChange}
              accept="image/*"
            />
            <label htmlFor="questionImage" className="cursor-pointer flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              <Image className="h-4 w-4 mr-2" />
              Choose Image
            </label>
            {imagePreview && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-red-500 hover:text-red-700"
                onClick={removeSelectedImage}
              >
                <X className="h-4 w-4 mr-1" /> Remove
              </Button>
            )}
          </div>
          
          {imagePreview && (
            <div className="mt-3 relative rounded-md overflow-hidden border border-border">
              <img 
                src={imagePreview}
                alt="Question preview" 
                className="max-h-48 max-w-full object-contain mx-auto"
              />
            </div>
          )}
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
          disabled={uploadingImage}
        >
          {uploadingImage ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading Image...
            </>
          ) : (
            'Add Question'
          )}
        </Button>
      </div>
    </div>
  );
};

export default QuestionBuilder;
