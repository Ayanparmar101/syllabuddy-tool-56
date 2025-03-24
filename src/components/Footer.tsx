
import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Mail, Twitter } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white/80 backdrop-blur-lg border-t border-border py-8 px-6">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-6 md:mb-0">
            <Link to="/" className="flex items-center">
              <span className="font-bold text-xl text-primary">BloomBuddy</span>
            </Link>
            <p className="text-sm text-muted-foreground mt-2">
              Empowering educators with Bloom's Taxonomy tools
            </p>
          </div>
          
          <div className="flex space-x-8">
            <div>
              <h3 className="font-medium mb-2">Pages</h3>
              <ul className="space-y-1">
                <li>
                  <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link to="/syllabus" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Syllabus Builder
                  </Link>
                </li>
                <li>
                  <Link to="/questions" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Question Builder
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    About
                  </Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Resources</h3>
              <ul className="space-y-1">
                <li>
                  <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Bloom's Taxonomy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Support
                  </a>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 md:mt-0">
            <h3 className="font-medium mb-2 text-center md:text-right">Connect</h3>
            <div className="flex space-x-4 justify-center md:justify-end">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Github className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-4 border-t border-border text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} BloomBuddy. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
