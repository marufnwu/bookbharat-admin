import React from 'react';
import { Image } from 'lucide-react';

const SocialContent: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Social Content</h1>
          <p className="mt-1 text-sm text-gray-500">
            Moderate and manage user-generated content
          </p>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-12 text-center">
        <Image className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Content Moderation</h3>
        <p className="mt-1 text-sm text-gray-500">
          Review and moderate user-generated social content here.
        </p>
      </div>
    </div>
  );
};

export default SocialContent;