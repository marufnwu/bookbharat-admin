import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { categoriesApi } from '../api';
import { X, Search, FolderOpen, Check } from 'lucide-react';
import { LoadingSpinner } from './';

interface Category {
  id: number;
  name: string;
  slug: string;
  image_url?: string;
  parent_id?: number;
  children?: Category[];
}

interface CategoryPickerProps {
  selected: Array<{ id: string; name: string; image: string; href: string }>;
  onChange: (categories: Array<{ id: string; name: string; image: string; href: string }>) => void;
  max?: number;
  label?: string;
}

const CategoryPicker: React.FC<CategoryPickerProps> = ({
  selected = [],
  onChange,
  max = 8,
  label = 'Categories',
}) => {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [tempSelected, setTempSelected] = useState(selected);

  // Fetch categories tree
  const { data: categoriesResponse, isLoading } = useQuery({
    queryKey: ['categories-tree'],
    queryFn: categoriesApi.getCategoryTree,
    enabled: showModal,
  });

  const categories: Category[] = categoriesResponse?.categories || categoriesResponse?.data || [];

  // Flatten category tree for easier searching
  const flattenCategories = (cats: Category[], level = 0): Array<Category & { level: number }> => {
    let result: Array<Category & { level: number }> = [];
    cats.forEach(cat => {
      result.push({ ...cat, level });
      if (cat.children && cat.children.length > 0) {
        result = result.concat(flattenCategories(cat.children, level + 1));
      }
    });
    return result;
  };

  const flatCategories = flattenCategories(categories);
  const filteredCategories = searchTerm
    ? flatCategories.filter(cat =>
        cat.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : flatCategories;

  const handleToggleCategory = (category: Category & { level: number }) => {
    const categoryData = {
      id: category.id.toString(),
      name: category.name,
      image: category.image_url || '',
      href: `/categories/${category.slug}`,
    };

    setTempSelected(prev => {
      const exists = prev.find(c => c.id === categoryData.id);
      if (exists) {
        return prev.filter(c => c.id !== categoryData.id);
      } else {
        if (prev.length >= max) {
          return prev;
        }
        return [...prev, categoryData];
      }
    });
  };

  const handleSave = () => {
    onChange(tempSelected);
    setShowModal(false);
  };

  const handleCancel = () => {
    setTempSelected(selected);
    setShowModal(false);
  };

  const handleOpen = () => {
    setTempSelected(selected);
    setShowModal(true);
  };

  const handleRemoveSelected = (categoryId: string) => {
    onChange(selected.filter(c => c.id !== categoryId));
  };

  const isSelected = (categoryId: number) => {
    return tempSelected.some(c => c.id === categoryId.toString());
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      {/* Selected Categories Display */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {selected.map((category) => (
            <div
              key={category.id}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-sm"
            >
              <FolderOpen className="h-4 w-4 text-blue-600" />
              <span className="text-gray-900">{category.name}</span>
              <button
                type="button"
                onClick={() => handleRemoveSelected(category.id)}
                className="text-gray-500 hover:text-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Categories Button */}
      <button
        type="button"
        onClick={handleOpen}
        className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
      >
        <FolderOpen className="h-4 w-4" />
        {selected.length > 0
          ? `${selected.length} categor${selected.length > 1 ? 'ies' : 'y'} selected (click to change)`
          : 'Select Categories'}
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Select Categories ({tempSelected.length}/{max})
              </h3>
              <button
                onClick={handleCancel}
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
                  placeholder="Search categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Categories List */}
            <div className="flex-1 overflow-y-auto p-4">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <LoadingSpinner size="lg" />
                </div>
              ) : filteredCategories.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FolderOpen className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>No categories found</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredCategories.map((category) => {
                    const selected = isSelected(category.id);
                    const disabled = !selected && tempSelected.length >= max;
                    const indent = category.level * 20;

                    return (
                      <div
                        key={category.id}
                        onClick={() => !disabled && handleToggleCategory(category)}
                        style={{ paddingLeft: `${indent}px` }}
                        className={`
                          flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all
                          ${selected ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'}
                          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                      >
                        {category.level > 0 && (
                          <span className="text-gray-400 text-xs">└─</span>
                        )}
                        <FolderOpen className={`h-4 w-4 ${selected ? 'text-blue-600' : 'text-gray-500'}`} />
                        <div className="flex-1 text-sm font-medium text-gray-900">
                          {category.name}
                        </div>
                        <div
                          className={`
                            w-5 h-5 rounded border-2 flex items-center justify-center
                            ${selected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}
                          `}
                        >
                          {selected && <Check className="h-3 w-3 text-white" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-4 border-t bg-gray-50">
              <div className="text-sm text-gray-600">
                {tempSelected.length} of {max} categories selected
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  Select {tempSelected.length} Categor{tempSelected.length !== 1 ? 'ies' : 'y'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryPicker;

