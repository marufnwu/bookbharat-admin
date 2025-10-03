import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { authApi } from '../../api';
import { useAuthStore } from '../../store/authStore';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  Lock,
  Camera,
  Save,
  Activity,
  Settings,
  Bell,
  Key,
  Globe,
  Moon,
  Sun,
  Monitor,
  CheckCircle,
  AlertCircle,
  Edit,
  X
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  birthday?: string;
  bio?: string;
  avatar?: File;
  avatar_url?: string;
}

interface SecurityData {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}

interface PreferencesData {
  language: string;
  timezone: string;
  date_format: string;
  theme: 'light' | 'dark' | 'system';
  email_notifications: boolean;
  push_notifications: boolean;
  marketing_emails: boolean;
  two_factor_enabled: boolean;
}

interface ActivityLog {
  id: number;
  description: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

const Profile: React.FC = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('general');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    email: '',
    phone: '',
    birthday: '',
    bio: '',
  });

  const [securityData, setSecurityData] = useState<SecurityData>({
    current_password: '',
    new_password: '',
    new_password_confirmation: '',
  });

  const [preferencesData, setPreferencesData] = useState<PreferencesData>({
    language: 'en',
    timezone: 'Asia/Kolkata',
    date_format: 'DD/MM/YYYY',
    theme: 'light',
    email_notifications: true,
    push_notifications: false,
    marketing_emails: false,
    two_factor_enabled: false,
  });

  // Fetch profile data
  const { data: profileResponse, refetch } = useQuery({
    queryKey: ['profile'],
    queryFn: authApi.getProfile,
  });

  // Fetch activity logs
  const { data: activityResponse } = useQuery({
    queryKey: ['activity-logs'],
    queryFn: authApi.getActivityLogs,
  });

  const profile = profileResponse?.user || user;
  const activities = activityResponse?.activities || [];

  // Load profile data when available
  useEffect(() => {
    if (profile) {
      setProfileData({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        birthday: profile.birthday || '',
        bio: profile.bio || '',
        avatar_url: profile.avatar_url,
      });
      setAvatarPreview(profile.avatar_url || null);

      // Load preferences if available
      if (profile.preferences) {
        setPreferencesData({
          ...preferencesData,
          ...profile.preferences,
        });
      }
    }
  }, [profile]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return authApi.updateProfile(data);
    },
    onSuccess: () => {
      toast.success('Profile updated successfully');
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: SecurityData) => {
      return authApi.changePassword(data);
    },
    onSuccess: () => {
      toast.success('Password changed successfully');
      setShowPasswordModal(false);
      setSecurityData({
        current_password: '',
        new_password: '',
        new_password_confirmation: '',
      });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to change password');
    },
  });

  // Update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: async (data: PreferencesData) => {
      return authApi.updatePreferences(data);
    },
    onSuccess: () => {
      toast.success('Preferences updated successfully');

      // Apply theme change
      if (preferencesData.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update preferences');
    },
  });

  const handleProfileInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleSecurityInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSecurityData(prev => ({ ...prev, [name]: value }));
  };

  const handlePreferencesInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setPreferencesData(prev => ({ ...prev, [name]: checked }));
    } else {
      setPreferencesData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
        toast.error('Please select a valid image file');
        return;
      }

      setProfileData(prev => ({ ...prev, avatar: file }));

      // Generate preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('name', profileData.name);
    formData.append('email', profileData.email);
    formData.append('phone', profileData.phone || '');
    formData.append('birthday', profileData.birthday || '');
    formData.append('bio', profileData.bio || '');

    if (profileData.avatar) {
      formData.append('avatar', profileData.avatar);
    }

    updateProfileMutation.mutate(formData);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!securityData.current_password || !securityData.new_password) {
      toast.error('Please fill in all fields');
      return;
    }

    if (securityData.new_password.length < 8) {
      toast.error('New password must be at least 8 characters long');
      return;
    }

    if (securityData.new_password !== securityData.new_password_confirmation) {
      toast.error('Passwords do not match');
      return;
    }

    changePasswordMutation.mutate(securityData);
  };

  const handlePreferencesSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updatePreferencesMutation.mutate(preferencesData);
  };

  const tabs = [
    { id: 'general', label: 'General', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'preferences', label: 'Preferences', icon: Settings },
    { id: 'activity', label: 'Activity', icon: Activity },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">My Profile</h1>
        <p className="text-gray-500">Manage your account settings and preferences</p>
      </div>

      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-6">
          <div className="relative">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-semibold">
                {profile?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2)}
              </div>
            )}
            <label className="absolute bottom-0 right-0 p-1 bg-blue-600 text-white rounded-full cursor-pointer hover:bg-blue-700">
              <Camera className="h-4 w-4" />
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </label>
          </div>

          <div className="flex-1">
            <h2 className="text-xl font-semibold">{profile?.name}</h2>
            <p className="text-gray-500">{profile?.email}</p>
            <div className="flex items-center gap-4 mt-2">
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                profile?.role === 'super-admin'
                  ? 'bg-purple-100 text-purple-800'
                  : profile?.role === 'admin'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                <Shield className="h-3 w-3" />
                {profile?.role}
              </span>
              {profile?.email_verified_at && (
                <span className="inline-flex items-center gap-1 text-xs text-green-600">
                  <CheckCircle className="h-3 w-3" />
                  Verified
                </span>
              )}
            </div>
          </div>

          <div className="text-right">
            <p className="text-sm text-gray-500">Member since</p>
            <p className="font-medium">
              {profile?.created_at && new Date(profile.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-6 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'general' && (
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={profileData.name}
                    onChange={handleProfileInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      name="email"
                      value={profileData.email}
                      onChange={handleProfileInputChange}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                    <Mail className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      name="phone"
                      value={profileData.phone}
                      onChange={handleProfileInputChange}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                    <Phone className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      name="birthday"
                      value={profileData.birthday || ''}
                      onChange={handleProfileInputChange}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                    <Calendar className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    value={profileData.bio || ''}
                    onChange={handleProfileInputChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Tell us about yourself..."
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Password</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Last changed: {profile?.password_changed_at
                    ? new Date(profile.password_changed_at).toLocaleDateString()
                    : 'Never'}
                </p>
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Key className="h-4 w-4" />
                  Change Password
                </button>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4">Two-Factor Authentication</h3>
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">
                      Add an extra layer of security to your account by requiring a verification code in addition to your password.
                    </p>
                  </div>
                  <button
                    onClick={() => toast('2FA setup coming soon', { icon: 'ℹ️' })}
                    className={`px-4 py-2 rounded-lg ${
                      preferencesData.two_factor_enabled
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {preferencesData.two_factor_enabled ? 'Disable 2FA' : 'Enable 2FA'}
                  </button>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4">Active Sessions</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Monitor className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="font-medium">Current Session</p>
                        <p className="text-sm text-gray-500">Windows • Chrome • Mumbai, India</p>
                      </div>
                    </div>
                    <span className="text-xs text-green-600">Active now</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <form onSubmit={handlePreferencesSubmit} className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Appearance</h3>
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <Sun className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="font-medium">Light</p>
                        <p className="text-sm text-gray-500">Default light theme</p>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="theme"
                      value="light"
                      checked={preferencesData.theme === 'light'}
                      onChange={handlePreferencesInputChange}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <Moon className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="font-medium">Dark</p>
                        <p className="text-sm text-gray-500">Dark theme for low light</p>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="theme"
                      value="dark"
                      checked={preferencesData.theme === 'dark'}
                      onChange={handlePreferencesInputChange}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <Monitor className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="font-medium">System</p>
                        <p className="text-sm text-gray-500">Match system settings</p>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="theme"
                      value="system"
                      checked={preferencesData.theme === 'system'}
                      onChange={handlePreferencesInputChange}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                  </label>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4">Notifications</h3>
                <div className="space-y-3">
                  <label className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-gray-500">Receive notifications via email</p>
                    </div>
                    <input
                      type="checkbox"
                      name="email_notifications"
                      checked={preferencesData.email_notifications}
                      onChange={handlePreferencesInputChange}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                  </label>

                  <label className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Push Notifications</p>
                      <p className="text-sm text-gray-500">Receive push notifications in browser</p>
                    </div>
                    <input
                      type="checkbox"
                      name="push_notifications"
                      checked={preferencesData.push_notifications}
                      onChange={handlePreferencesInputChange}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                  </label>

                  <label className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Marketing Emails</p>
                      <p className="text-sm text-gray-500">Receive promotional and marketing emails</p>
                    </div>
                    <input
                      type="checkbox"
                      name="marketing_emails"
                      checked={preferencesData.marketing_emails}
                      onChange={handlePreferencesInputChange}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                  </label>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4">Localization</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Language
                    </label>
                    <select
                      name="language"
                      value={preferencesData.language}
                      onChange={handlePreferencesInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="en">English</option>
                      <option value="hi">Hindi</option>
                      <option value="ta">Tamil</option>
                      <option value="te">Telugu</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Timezone
                    </label>
                    <select
                      name="timezone"
                      value={preferencesData.timezone}
                      onChange={handlePreferencesInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Asia/Kolkata">India (IST)</option>
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">Eastern Time</option>
                      <option value="America/Los_Angeles">Pacific Time</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={updatePreferencesMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {updatePreferencesMutation.isPending ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Recent Activity</h3>
                <button className="text-sm text-blue-600 hover:underline">
                  Download Activity Log
                </button>
              </div>

              {activities.length > 0 ? (
                <div className="space-y-3">
                  {activities.map((activity: ActivityLog) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <Activity className="h-5 w-5 text-gray-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.description}</p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                          <span>{new Date(activity.created_at).toLocaleString()}</span>
                          <span>IP: {activity.ip_address}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No recent activity</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Change Password</h3>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setSecurityData({
                    current_password: '',
                    new_password: '',
                    new_password_confirmation: '',
                  });
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="current_password"
                  value={securityData.current_password}
                  onChange={handleSecurityInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="new_password"
                  value={securityData.new_password}
                  onChange={handleSecurityInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Must be at least 8 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="new_password_confirmation"
                  value={securityData.new_password_confirmation}
                  onChange={handleSecurityInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                {securityData.new_password && securityData.new_password_confirmation && (
                  <p className={`text-xs mt-1 ${
                    securityData.new_password === securityData.new_password_confirmation
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}>
                    {securityData.new_password === securityData.new_password_confirmation
                      ? '✓ Passwords match'
                      : '✗ Passwords do not match'}
                  </p>
                )}
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showPassword}
                    onChange={(e) => setShowPassword(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Show passwords</span>
                </label>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setSecurityData({
                      current_password: '',
                      new_password: '',
                      new_password_confirmation: '',
                    });
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={changePasswordMutation.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;