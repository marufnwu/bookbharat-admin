import React from 'react';
import DynamicSettings from '../../components/settings/DynamicSettings';

const AuthSettings: React.FC = () => {
  return (
    <DynamicSettings
      group="authentication"
      title="Authentication Settings"
      description="Configure how users log in to their accounts"
    />
  );
};

export default AuthSettings;
