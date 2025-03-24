
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FileText, Home, BookOpen, HelpCircle, FileQuestion } from 'lucide-react';

const Navbar = () => {
  return (
    <header className="bg-background border-b border-border sticky top-0 z-40">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <BookOpen className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold text-foreground">BloomBuddy</span>
          </div>
          
          <nav className="hidden md:flex items-center space-x-1">
            <NavLink 
              to="/" 
              className={({ isActive }) => 
                `px-3 py-2 rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors ${
                  isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
                }`
              }
            >
              <div className="flex items-center">
                <Home className="w-4 h-4 mr-1" />
                Home
              </div>
            </NavLink>
            
            <NavLink 
              to="/questions" 
              className={({ isActive }) => 
                `px-3 py-2 rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors ${
                  isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
                }`
              }
            >
              <div className="flex items-center">
                <FileQuestion className="w-4 h-4 mr-1" />
                Questions
              </div>
            </NavLink>
            
            <NavLink 
              to="/syllabus" 
              className={({ isActive }) => 
                `px-3 py-2 rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors ${
                  isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
                }`
              }
            >
              <div className="flex items-center">
                <BookOpen className="w-4 h-4 mr-1" />
                Syllabus
              </div>
            </NavLink>
            
            <NavLink 
              to="/document-analyzer" 
              className={({ isActive }) => 
                `px-3 py-2 rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors ${
                  isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
                }`
              }
            >
              <div className="flex items-center">
                <FileText className="w-4 h-4 mr-1" />
                Document Analyzer
              </div>
            </NavLink>
            
            <NavLink 
              to="/about" 
              className={({ isActive }) => 
                `px-3 py-2 rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors ${
                  isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
                }`
              }
            >
              <div className="flex items-center">
                <HelpCircle className="w-4 h-4 mr-1" />
                About
              </div>
            </NavLink>
          </nav>
          
          <div className="flex items-center space-x-4">
            <Button variant="default">Sign In</Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
