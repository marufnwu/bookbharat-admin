import React, { useState } from 'react';
import {
  BookOpen, Star, Users, TrendingUp, Award, Truck, Shield, Heart,
  ShoppingBag, Gift, Zap, Eye, Phone, Calendar, Check, X, Search,
  Package, DollarSign, Clock, Target, Sparkles, Crown, BadgeCheck
} from 'lucide-react';

// Icon mapping
const icons: Record<string, { component: React.ComponentType<any>; label: string }> = {
  'book': { component: BookOpen, label: 'Book' },
  'star': { component: Star, label: 'Star' },
  'users': { component: Users, label: 'Users' },
  'trending': { component: TrendingUp, label: 'Trending' },
  'award': { component: Award, label: 'Award' },
  'truck': { component: Truck, label: 'Truck' },
  'shield': { component: Shield, label: 'Shield' },
  'heart': { component: Heart, label: 'Heart' },
  'shopping-bag': { component: ShoppingBag, label: 'Shopping Bag' },
  'gift': { component: Gift, label: 'Gift' },
  'zap': { component: Zap, label: 'Lightning' },
  'eye': { component: Eye, label: 'Eye' },
  'phone': { component: Phone, label: 'Phone' },
  'calendar': { component: Calendar, label: 'Calendar' },
  'check': { component: Check, label: 'Check' },
  'package': { component: Package, label: 'Package' },
  'dollar': { component: DollarSign, label: 'Dollar' },
  'clock': { component: Clock, label: 'Clock' },
  'target': { component: Target, label: 'Target' },
  'sparkles': { component: Sparkles, label: 'Sparkles' },
  'crown': { component: Crown, label: 'Crown' },
  'badge': { component: BadgeCheck, label: 'Badge' },
};

interface IconPickerProps {
  value: string;
  onChange: (iconName: string) => void;
  label?: string;
  className?: string;
}

const IconPicker: React.FC<IconPickerProps> = ({
  value,
  onChange,
  label = 'Icon',
  className = '',
}) => {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredIcons = Object.entries(icons).filter(([key, icon]) =>
    icon.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    key.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedIcon = icons[value];
  const SelectedIconComponent = selectedIcon?.component || BookOpen;

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      {/* Selected Icon Display */}
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="w-full flex items-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
      >
        <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
          <SelectedIconComponent className="h-5 w-5 text-gray-700" />
        </div>
        <div className="flex-1 text-left">
          <div className="text-sm font-medium text-gray-900">
            {selectedIcon?.label || 'Select Icon'}
          </div>
          <div className="text-xs text-gray-500">{value || 'Click to choose'}</div>
        </div>
        <Search className="h-4 w-4 text-gray-400" />
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Select Icon</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search icons..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                />
              </div>
            </div>

            {/* Icons Grid */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                {filteredIcons.map(([key, icon]) => {
                  const IconComponent = icon.component;
                  const isSelected = value === key;

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        onChange(key);
                        setShowModal(false);
                      }}
                      className={`
                        flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all
                        ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }
                      `}
                    >
                      <IconComponent className={`h-6 w-6 ${isSelected ? 'text-blue-600' : 'text-gray-700'}`} />
                      <span className="text-xs text-gray-600 text-center line-clamp-1">
                        {icon.label}
                      </span>
                      {isSelected && (
                        <div className="absolute top-1 right-1 bg-blue-600 rounded-full p-0.5">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {filteredIcons.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Search className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>No icons found for "{searchTerm}"</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end p-4 border-t bg-gray-50">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IconPicker;

