import React from 'react';
import { MessageSquare } from 'lucide-react';

const BlogComments: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Blog Comments</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage and moderate blog comments
          </p>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-12 text-center">
        <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Comments Management</h3>
        <p className="mt-1 text-sm text-gray-500">
          Full comment moderation functionality will be implemented here.
        </p>
      </div>
    </div>
  );
};

export default BlogComments;