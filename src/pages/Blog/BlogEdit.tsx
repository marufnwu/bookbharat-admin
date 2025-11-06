import React from 'react';
import { Edit } from 'lucide-react';

const BlogEdit: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Edit Blog Post</h1>
          <p className="mt-1 text-sm text-gray-500">
            Update and modify existing blog post
          </p>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-12 text-center">
        <Edit className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Blog Post Editor</h3>
        <p className="mt-1 text-sm text-gray-500">
          Rich text editor for editing blog posts will be implemented here.
        </p>
      </div>
    </div>
  );
};

export default BlogEdit;