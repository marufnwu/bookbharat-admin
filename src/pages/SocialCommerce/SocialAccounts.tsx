import React from 'react';
import { Users } from 'lucide-react';

const SocialAccounts: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Social Accounts</h1>
          <p className="mt-1 text-sm text-gray-500">
            Connect and manage social media accounts
          </p>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-12 text-center">
        <Users className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Social Account Management</h3>
        <p className="mt-1 text-sm text-gray-500">
          Connect Instagram, Facebook, and other social media accounts here.
        </p>
      </div>
    </div>
  );
};

export default SocialAccounts;