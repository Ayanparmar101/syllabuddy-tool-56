
import React from 'react';
import { Card } from '@/components/ui/card';
import BloomLevel from '@/components/BloomLevel';

const AboutPage = () => {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-4">About BloomBuddy</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Your companion for creating educational content using Bloom's Taxonomy
        </p>
      </div>
      
      <Card className="bloom-card mb-10">
        <h2 className="text-2xl font-semibold mb-4">Understanding Bloom's Taxonomy</h2>
        <p className="mb-6">
          Bloom's Taxonomy is a hierarchical framework for categorizing educational learning objectives into levels of complexity and specificity. Originally created in 1956 by Benjamin Bloom and collaborators, it was revised in 2001 by Anderson and Krathwohl.
        </p>
        
        <div className="space-y-6">
          <div>
            <div className="flex items-center mb-2">
              <BloomLevel level="remember" />
              <h3 className="ml-3 font-medium">Remember</h3>
            </div>
            <p className="text-muted-foreground text-sm">
              Recall facts and basic concepts. Example verbs: define, identify, list, name, recall.
            </p>
          </div>
          
          <div>
            <div className="flex items-center mb-2">
              <BloomLevel level="understand" />
              <h3 className="ml-3 font-medium">Understand</h3>
            </div>
            <p className="text-muted-foreground text-sm">
              Explain ideas or concepts. Example verbs: explain, interpret, summarize, classify, compare.
            </p>
          </div>
          
          <div>
            <div className="flex items-center mb-2">
              <BloomLevel level="apply" />
              <h3 className="ml-3 font-medium">Apply</h3>
            </div>
            <p className="text-muted-foreground text-sm">
              Use information in new situations. Example verbs: apply, demonstrate, solve, use, implement.
            </p>
          </div>
          
          <div>
            <div className="flex items-center mb-2">
              <BloomLevel level="analyze" />
              <h3 className="ml-3 font-medium">Analyze</h3>
            </div>
            <p className="text-muted-foreground text-sm">
              Draw connections among ideas. Example verbs: analyze, examine, compare, differentiate, organize.
            </p>
          </div>
          
          <div>
            <div className="flex items-center mb-2">
              <BloomLevel level="evaluate" />
              <h3 className="ml-3 font-medium">Evaluate</h3>
            </div>
            <p className="text-muted-foreground text-sm">
              Justify a stand or decision. Example verbs: evaluate, assess, critique, judge, justify.
            </p>
          </div>
          
          <div>
            <div className="flex items-center mb-2">
              <BloomLevel level="create" />
              <h3 className="ml-3 font-medium">Create</h3>
            </div>
            <p className="text-muted-foreground text-sm">
              Produce new or original work. Example verbs: create, design, develop, formulate, construct.
            </p>
          </div>
        </div>
      </Card>
      
      <Card className="bloom-card mb-10">
        <h2 className="text-2xl font-semibold mb-4">How BloomBuddy Helps Educators</h2>
        <div className="space-y-4">
          <p>
            BloomBuddy is designed to support faculty members in creating educational content that intentionally addresses different cognitive levels of learning according to Bloom's Taxonomy.
          </p>
          
          <div className="space-y-2">
            <h3 className="font-medium">For Syllabus Creation:</h3>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Organize course content into coherent modules and topics</li>
              <li>Ensure learning objectives cover appropriate cognitive levels</li>
              <li>Generate well-structured syllabus documents for distribution</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium">For Assessment Questions:</h3>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Create questions that target specific cognitive levels</li>
              <li>Access appropriate verbs for each Bloom's level</li>
              <li>Ensure balanced assessment across different thinking skills</li>
              <li>Generate question papers with appropriate difficulty distribution</li>
            </ul>
          </div>
        </div>
      </Card>
      
      <Card className="bloom-card">
        <h2 className="text-2xl font-semibold mb-4">About the Project</h2>
        <p className="mb-4">
          BloomBuddy was created to assist educators in implementing Bloom's Taxonomy in their teaching materials. The tool helps faculty design syllabi and question papers that effectively address different cognitive levels of learning.
        </p>
        <p className="text-muted-foreground">
          For questions, suggestions, or feedback, please contact us at support@bloombuddy.edu
        </p>
      </Card>
    </div>
  );
};

export default AboutPage;
