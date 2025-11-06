import React from 'react';
import { Users } from 'lucide-react';

const SocialCommerce: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Social Commerce</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage social media integration and user-generated content
          </p>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-12 text-center">
        <Users className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Social Commerce Hub</h3>
        <p className="mt-1 text-sm text-gray-500">
          Social media management and commerce features will be implemented here.
        </p>
      </div>
    </div>
  );
};

export default SocialCommerce;