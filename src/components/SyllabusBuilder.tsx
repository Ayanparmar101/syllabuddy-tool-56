
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, FileDown } from 'lucide-react';

type SyllabusModule = {
  id: string;
  title: string;
  description: string;
  topics: string[];
};

type SyllabusBuilderProps = {
  onGenerateDocument: (syllabus: {
    title: string;
    description: string;
    modules: SyllabusModule[];
  }) => void;
};

const SyllabusBuilder: React.FC<SyllabusBuilderProps> = ({ onGenerateDocument }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [modules, setModules] = useState<SyllabusModule[]>([]);
  const [currentModule, setCurrentModule] = useState<SyllabusModule>({
    id: Date.now().toString(),
    title: '',
    description: '',
    topics: []
  });
  const [currentTopic, setCurrentTopic] = useState('');

  const handleAddTopic = () => {
    if (!currentTopic.trim()) return;
    
    setCurrentModule({
      ...currentModule,
      topics: [...currentModule.topics, currentTopic.trim()]
    });
    
    setCurrentTopic('');
  };

  const handleRemoveTopic = (index: number) => {
    setCurrentModule({
      ...currentModule,
      topics: currentModule.topics.filter((_, i) => i !== index)
    });
  };

  const handleAddModule = () => {
    if (!currentModule.title.trim()) return;
    
    setModules([...modules, currentModule]);
    
    setCurrentModule({
      id: Date.now().toString(),
      title: '',
      description: '',
      topics: []
    });
  };

  const handleRemoveModule = (id: string) => {
    setModules(modules.filter(module => module.id !== id));
  };

  const handleGenerateDocument = () => {
    if (!title.trim()) return;
    
    onGenerateDocument({
      title,
      description,
      modules
    });
  };

  return (
    <div className="bloom-card animate-scale-in">
      <h2 className="text-xl font-semibold mb-6">Syllabus Builder</h2>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Course Title</label>
          <Input 
            className="bloom-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Introduction to Computer Science"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Course Description</label>
          <Textarea 
            className="bloom-input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide a brief overview of the course..."
            rows={3}
          />
        </div>
        
        {/* Module Builder */}
        <div className="border border-border rounded-xl p-4">
          <h3 className="text-lg font-medium mb-4">Add Module</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Module Title</label>
              <Input 
                className="bloom-input"
                value={currentModule.title}
                onChange={(e) => setCurrentModule({...currentModule, title: e.target.value})}
                placeholder="e.g., Fundamentals of Programming"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Module Description</label>
              <Textarea 
                className="bloom-input"
                value={currentModule.description}
                onChange={(e) => setCurrentModule({...currentModule, description: e.target.value})}
                placeholder="Describe the module content and objectives..."
                rows={2}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Topics</label>
              <div className="flex">
                <Input 
                  className="bloom-input mr-2"
                  value={currentTopic}
                  onChange={(e) => setCurrentTopic(e.target.value)}
                  placeholder="e.g., Variables and Data Types"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTopic();
                    }
                  }}
                />
                <Button
                  onClick={handleAddTopic}
                  variant="outline"
                  size="icon"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {currentModule.topics.length > 0 && (
                <div className="mt-3 space-y-2">
                  {currentModule.topics.map((topic, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between bg-secondary rounded-lg p-2"
                    >
                      <span className="text-sm">{topic}</span>
                      <Button
                        onClick={() => handleRemoveTopic(index)}
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <Button 
              onClick={handleAddModule}
              className="bloom-btn-secondary w-full"
              disabled={!currentModule.title.trim()}
            >
              Add Module
            </Button>
          </div>
        </div>
        
        {/* Modules List */}
        {modules.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Modules</h3>
            
            {modules.map((module) => (
              <div 
                key={module.id} 
                className="border border-border rounded-lg p-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{module.title}</h4>
                    {module.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {module.description}
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={() => handleRemoveModule(module.id)}
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                {module.topics.length > 0 && (
                  <div className="mt-3">
                    <h5 className="text-sm font-medium mb-2">Topics:</h5>
                    <ul className="list-disc list-inside space-y-1">
                      {module.topics.map((topic, index) => (
                        <li key={index} className="text-sm">{topic}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        <Button 
          onClick={handleGenerateDocument}
          className="bloom-btn-primary w-full"
          disabled={!title.trim() || modules.length === 0}
        >
          <FileDown className="mr-2 h-4 w-4" />
          Generate Syllabus Document
        </Button>
      </div>
    </div>
  );
};

export default SyllabusBuilder;
