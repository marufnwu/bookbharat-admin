/**
 * Cart Filters Component
 * Filter controls for abandoned cart list
 */

import React from 'react';
import { Search, Filter, X } from 'lucide-react';
import type { CartFilters, FilterOptions } from '../types';

interface CartFiltersProps {
  filters: Partial<CartFilters>;
  filterOptions?: FilterOptions;
  onFilterChange: (key: keyof CartFilters, value: string) => void;
  onReset: () => void;
}

const CartFiltersComponent: React.FC<CartFiltersProps> = ({
  filters,
  filterOptions,
  onFilterChange,
  onReset,
}) => {
  const hasActiveFilters = Object.values(filters).some((v) => v && v !== '');

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-500" />
          <h3 className="font-medium text-gray-900">Filters</h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1"
          >
            <X className="h-4 w-4" />
            Reset
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {/* Search */}
        <div className="lg:col-span-2">
          <label className="block text-sm text-gray-600 mb-1">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) => onFilterChange('search', e.target.value)}
              placeholder="Email, name, or session..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm text-gray-600 mb-1">Status</label>
          <select
            value={filters.status || ''}
            onChange={(e) => onFilterChange('status', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            {filterOptions?.statuses?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Segment */}
        <div>
          <label className="block text-sm text-gray-600 mb-1">Segment</label>
          <select
            value={filters.segment || ''}
            onChange={(e) => onFilterChange('segment', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Segments</option>
            {filterOptions?.customer_segments?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Device */}
        <div>
          <label className="block text-sm text-gray-600 mb-1">Device</label>
          <select
            value={filters.device_type || ''}
            onChange={(e) => onFilterChange('device_type', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Devices</option>
            {filterOptions?.device_types?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <div>
          <label className="block text-sm text-gray-600 mb-1">Sort By</label>
          <select
            value={filters.sort_by || ''}
            onChange={(e) => onFilterChange('sort_by', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Default</option>
            {filterOptions?.sort_options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default CartFiltersComponent;
