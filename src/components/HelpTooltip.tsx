import React from 'react';
import { HelpCircle } from 'lucide-react';

interface HelpTooltipProps {
  text: string;
  className?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const HelpTooltip: React.FC<HelpTooltipProps> = ({ 
  text, 
  className = '', 
  position = 'top' 
}) => {
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  };

  return (
    <div className={`relative inline-flex items-center group ${className}`}>
      <HelpCircle className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help" />
      <div 
        className={`
          absolute z-50 w-64 p-2 text-xs text-white bg-gray-800 rounded shadow-lg 
          opacity-0 invisible group-hover:opacity-100 group-hover:visible 
          transition-all duration-200 pointer-events-none
          ${positionClasses[position]}
        `}
      >
        {text}
        {/* Triangle arrow */}
        <div className={`
          absolute w-2 h-2 bg-gray-800 transform rotate-45
          ${position === 'top' ? 'bottom-[-4px] left-1/2 -translate-x-1/2' : ''}
          ${position === 'bottom' ? 'top-[-4px] left-1/2 -translate-x-1/2' : ''}
          ${position === 'left' ? 'right-[-4px] top-1/2 -translate-y-1/2' : ''}
          ${position === 'right' ? 'left-[-4px] top-1/2 -translate-y-1/2' : ''}
        `} />
      </div>
    </div>
  );
};

export default HelpTooltip;
