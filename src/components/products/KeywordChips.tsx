import React, { useState, useRef } from 'react';
import { X } from 'lucide-react';

interface KeywordChipsProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const KeywordChips: React.FC<KeywordChipsProps> = ({
  value,
  onChange,
  placeholder = 'Type keyword and press Enter or comma',
  className = '',
}) => {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const keywords = value
    ? value.split(',').map((k) => k.trim()).filter((k) => k.length > 0)
    : [];

  const addKeyword = (keyword: string) => {
    const trimmed = keyword.trim();
    if (trimmed && !keywords.includes(trimmed)) {
      const newKeywords = [...keywords, trimmed];
      onChange(newKeywords.join(', '));
    }
    setInputValue('');
  };

  const removeKeyword = (index: number) => {
    const newKeywords = keywords.filter((_, i) => i !== index);
    onChange(newKeywords.join(', '));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addKeyword(inputValue);
    } else if (e.key === 'Backspace' && inputValue === '' && keywords.length > 0) {
      removeKeyword(keywords.length - 1);
    }
  };

  const handleBlur = () => {
    if (inputValue.trim()) {
      addKeyword(inputValue);
    }
  };

  return (
    <div
      className={`flex flex-wrap gap-1.5 p-2 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 min-h-[42px] cursor-text ${className}`}
      onClick={() => inputRef.current?.focus()}
    >
      {keywords.map((keyword, index) => (
        <span
          key={index}
          className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-100 text-indigo-800 text-sm font-medium rounded-full"
        >
          {keyword}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              removeKeyword(index);
            }}
            className="hover:text-indigo-600 hover:bg-indigo-200 rounded-full p-0.5 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={keywords.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[120px] outline-none border-none focus-visible:ring-0 focus-visible:outline-none text-sm bg-transparent py-1"
      />
    </div>
  );
};

export default KeywordChips;
