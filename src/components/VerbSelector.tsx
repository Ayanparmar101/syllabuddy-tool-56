
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckIcon, PlusIcon } from 'lucide-react';

type VerbSelectorProps = {
  verbs: string[];
  onSelect: (verb: string) => void;
  selectedVerbs: string[];
};

const VerbSelector: React.FC<VerbSelectorProps> = ({ verbs, onSelect, selectedVerbs }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredVerbs = searchQuery
    ? verbs.filter(verb => verb.toLowerCase().includes(searchQuery.toLowerCase()))
    : verbs;

  return (
    <div className="space-y-4">
      <div className="relative">
        <input
          type="text"
          className="bloom-input w-full pl-10"
          placeholder="Search verbs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <svg
          className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">
        {filteredVerbs.map((verb) => {
          const isSelected = selectedVerbs.includes(verb);
          return (
            <Button
              key={verb}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              className={`rounded-full transition-all duration-200 ${
                isSelected ? 'bg-primary' : 'hover:bg-accent'
              }`}
              onClick={() => onSelect(verb)}
            >
              {verb}
              {isSelected ? (
                <CheckIcon className="ml-1 h-3 w-3" />
              ) : (
                <PlusIcon className="ml-1 h-3 w-3" />
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default VerbSelector;
