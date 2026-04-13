import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MagnifyingGlassIcon, ClockIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '../../utils/cn';

interface RecentSearch {
  query: string;
  timestamp: number;
}

interface OrderSearchWithSuggestionsProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const RECENT_SEARCHES_KEY = 'order_recent_searches';
const MAX_RECENT = 5;

const quickFilters = [
  { label: "Today's Orders", value: 'today' },
  { label: 'COD Orders', value: 'cod' },
  { label: 'High Value (>₹5K)', value: 'high_value' },
];

export const OrderSearchWithSuggestions: React.FC<OrderSearchWithSuggestionsProps> = ({
  value,
  onChange,
  placeholder = 'Search orders by #, customer, email...',
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch {}
  }, []);

  // Save search to recent
  const saveRecentSearch = useCallback((query: string) => {
    if (!query.trim()) return;
    setRecentSearches(prev => {
      const filtered = prev.filter(s => s.query !== query.trim());
      const updated = [{ query: query.trim(), timestamp: Date.now() }, ...filtered].slice(0, MAX_RECENT);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      saveRecentSearch(value);
    }
    setIsFocused(false);
    inputRef.current?.blur();
  };

  const handleSelectRecent = (query: string) => {
    onChange(query);
    setIsFocused(false);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {}
  };

  const showDropdown = isFocused && !value;

  return (
    <div ref={containerRef} className="relative flex-1 max-w-md">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
          />
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>

      {/* Dropdown - Recent searches and quick filters */}
      {showDropdown && (
        <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          {/* Quick Filters */}
          <div className="p-3 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Quick Filters</p>
            <div className="flex flex-wrap gap-2">
              {quickFilters.map(filter => (
                <button
                  key={filter.value}
                  onClick={() => {
                    onChange(filter.value);
                    setIsFocused(false);
                  }}
                  className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors"
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div className="p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Recent</p>
                <button
                  onClick={clearRecentSearches}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  Clear
                </button>
              </div>
              <div className="space-y-1">
                {recentSearches.map((search) => (
                  <button
                    key={search.query}
                    onClick={() => handleSelectRecent(search.query)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors"
                  >
                    <ClockIcon className="w-3.5 h-3.5 text-gray-400" />
                    <span className="truncate">{search.query}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
