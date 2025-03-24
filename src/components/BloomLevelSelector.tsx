
import React from 'react';
import BloomLevel from './BloomLevel';

type BloomLevelType = 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';

type BloomLevelSelectorProps = {
  selectedLevel: BloomLevelType | null;
  onChange: (level: BloomLevelType) => void;
  className?: string;
};

const BloomLevelSelector: React.FC<BloomLevelSelectorProps> = ({ 
  selectedLevel, 
  onChange,
  className 
}) => {
  const levels: BloomLevelType[] = ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'];

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 ${className}`}>
      {levels.map((level) => (
        <BloomLevel
          key={level}
          level={level}
          active={selectedLevel === level}
          onClick={() => onChange(level)}
        />
      ))}
    </div>
  );
};

export default BloomLevelSelector;
