
import React from 'react';
import { cn } from '@/lib/utils';

type BloomLevelProps = {
  level: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';
  onClick?: () => void;
  active?: boolean;
  className?: string;
};

const levelColors = {
  remember: 'bg-blue-100 text-blue-800 border-blue-200',
  understand: 'bg-green-100 text-green-800 border-green-200',
  apply: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  analyze: 'bg-purple-100 text-purple-800 border-purple-200',
  evaluate: 'bg-pink-100 text-pink-800 border-pink-200',
  create: 'bg-red-100 text-red-800 border-red-200',
};

const levelActiveColors = {
  remember: 'bg-blue-600 text-white border-blue-700',
  understand: 'bg-green-600 text-white border-green-700',
  apply: 'bg-yellow-600 text-white border-yellow-700',
  analyze: 'bg-purple-600 text-white border-purple-700',
  evaluate: 'bg-pink-600 text-white border-pink-700',
  create: 'bg-red-600 text-white border-red-700',
};

const levelLabels = {
  remember: 'Remember',
  understand: 'Understand',
  apply: 'Apply',
  analyze: 'Analyze',
  evaluate: 'Evaluate',
  create: 'Create',
};

const BloomLevel: React.FC<BloomLevelProps> = ({ 
  level, 
  onClick, 
  active = false,
  className
}) => {
  return (
    <button
      className={cn(
        'bloom-tag border transition-all duration-200 hover:shadow-sm',
        active ? levelActiveColors[level] : levelColors[level],
        onClick ? 'cursor-pointer' : 'cursor-default',
        className
      )}
      onClick={onClick}
      type={onClick ? 'button' : undefined}
    >
      {levelLabels[level]}
    </button>
  );
};

export default BloomLevel;
