
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FileText, HelpCircle } from 'lucide-react';
import BloomLevel from '@/components/BloomLevel';

const Index = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent to-background -z-10"></div>
        
        <div className="container px-4 mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 md:pr-12 mb-10 md:mb-0">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 animate-fade-in">
                Design Better Educational Content with <span className="text-primary">Bloom's Taxonomy</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                BloomBuddy helps educators create effective assessment questions 
                guided by cognitive learning levels.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                <Link to="/questions">
                  <Button size="lg" className="bloom-btn-primary">
                    Create Questions
                  </Button>
                </Link>
                <Link to="/document-analyzer">
                  <Button size="lg" variant="outline" className="bloom-btn-secondary">
                    Analyze Documents
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="md:w-1/2 animate-fade-in" style={{ animationDelay: '0.6s' }}>
              <div className="relative">
                <div className="glass-panel rounded-2xl p-8 shadow-xl">
                  <div className="flex flex-wrap gap-3 mb-6">
                    <BloomLevel level="remember" />
                    <BloomLevel level="understand" />
                    <BloomLevel level="apply" />
                    <BloomLevel level="analyze" />
                    <BloomLevel level="evaluate" />
                    <BloomLevel level="create" />
                  </div>
                  
                  <div className="space-y-4">
                    <div className="p-3 rounded-lg bg-white/70 border border-border">
                      <h3 className="font-medium">Question Example:</h3>
                      <p className="text-sm mt-1">Evaluate the effectiveness of different sorting algorithms for large datasets.</p>
                      <div className="mt-2">
                        <BloomLevel level="evaluate" className="text-xs" />
                      </div>
                    </div>
                    
                    <div className="p-3 rounded-lg bg-white/70 border border-border">
                      <h3 className="font-medium">Suggested Verbs:</h3>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {['evaluate', 'appraise', 'assess', 'judge', 'compare'].map(verb => (
                          <span key={verb} className="text-xs px-2 py-1 rounded-full bg-secondary">
                            {verb}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="absolute -z-10 -bottom-6 -right-6 h-full w-full rounded-2xl border border-border bg-accent/30"></div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container px-4 mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Key Features</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              BloomBuddy provides tools to enhance your teaching material using cognitive learning principles
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="bloom-card">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Question Creator</h3>
              <p className="text-muted-foreground">
                Design assessment questions aligned with specific cognitive levels of Bloom's Taxonomy.
              </p>
            </Card>
            
            <Card className="bloom-card">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <HelpCircle className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Taxonomy Guide</h3>
              <p className="text-muted-foreground">
                Access a comprehensive library of verbs categorized by Bloom's cognitive levels.
              </p>
            </Card>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 bg-accent">
        <div className="container px-4 mx-auto max-w-6xl text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Enhance Your Educational Materials?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            Start creating assessment questions aligned with Bloom's Taxonomy today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/questions">
              <Button size="lg" className="bloom-btn-primary">
                Create Questions
              </Button>
            </Link>
            <Link to="/document-analyzer">
              <Button size="lg" variant="outline" className="bloom-btn-secondary">
                Analyze Documents
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
