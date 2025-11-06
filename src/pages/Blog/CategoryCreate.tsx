import React from 'react';
import { Plus } from 'lucide-react';

const CategoryCreate: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Create Category</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create a new blog category
          </p>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-12 text-center">
        <Plus className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Category Form</h3>
        <p className="mt-1 text-sm text-gray-500">
          Category creation form will be implemented here.
        </p>
      </div>
    </div>
  );
};

export default CategoryCreate;