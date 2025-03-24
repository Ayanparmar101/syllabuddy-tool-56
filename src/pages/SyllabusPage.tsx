
import React from 'react';
import SyllabusBuilder from '@/components/SyllabusBuilder';
import { toast } from '@/components/ui/use-toast';

type SyllabusModule = {
  id: string;
  title: string;
  description: string;
  topics: string[];
};

const SyllabusPage = () => {
  const handleGenerateDocument = (syllabus: {
    title: string;
    description: string;
    modules: SyllabusModule[];
  }) => {
    // In a real implementation, this would generate and download a document
    // For demonstration, we'll just show a success message
    toast({
      title: "Syllabus generated",
      description: "Your syllabus has been generated and is ready for download.",
    });
    
    console.log('Generated syllabus:', syllabus);
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-4">Syllabus Builder</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Create comprehensive syllabi with modules and topics, organized to achieve learning objectives
        </p>
      </div>
      
      <SyllabusBuilder onGenerateDocument={handleGenerateDocument} />
    </div>
  );
};

export default SyllabusPage;
