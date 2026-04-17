import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi, rolesApi } from '../../api';
import {
  ArrowLeft,
  Shield,
  Mail,
  Phone,
  Calendar,
  Key,
  Lock,
  Unlock,
  Trash2,
  Save,
  CheckCircle,
  XCircle,
  X
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface AdminUser {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: string;
  roles?: Array<{ id: number; name: string }>;
  permissions?: string[];
  is_active: boolean;
  email_verified_at?: string;
  last_login_at?: string;
  password_changed_at?: string;
  created_at: string;
  updated_at: string;
}

interface Role {
  id: number;
  name: string;
  display_name: string;
}

const AdminUserDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [showResetModal, setShowResetModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', role_id: 0, is_active: true });

  const { data: userResponse, isLoading, refetch } = useQuery({
    queryKey: ['admin-user', id],
    queryFn: () => usersApi.getUser(Number(id)),
    enabled: !!id,
  });

  const { data: rolesResponse } = useQuery({
    queryKey: ['roles'],
    queryFn: rolesApi.getAll,
  });

  const user = userResponse?.user || userResponse?.data;
  const roles = rolesResponse?.roles || [];

  useEffect(() => {
    if (user) {
      const userRole = user.roles?.[0] || { id: 0 };
      setEditForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        role_id: userRole.id || 0,
        is_active: user.is_active ?? true,
      });
    }
  }, [user]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: typeof editForm) => usersApi.updateAdminUser(Number(id), data),
    onSuccess: () => {
      toast.success('User updated');
      queryClient.invalidateQueries({ queryKey: ['admin-user', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setShowEditModal(false);
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to update'),
  });

  // Toggle status
  const toggleMutation = useMutation({
    mutationFn: async (active: boolean) => usersApi.updateAdminUserStatus(Number(id), active),
    onSuccess: () => {
      toast.success('Status updated');
      refetch();
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to update status'),
  });

  // Reset password
  const resetPasswordMutation = useMutation({
    mutationFn: async (password: string) => usersApi.changeAdminPassword(Number(id), password),
    onSuccess: () => {
      toast.success('Password reset successfully');
      setShowResetModal(false);
      setNewPassword('');
      setConfirmPassword('');
      refetch();
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to reset password'),
  });

  // Delete
  const deleteMutation = useMutation({
    mutationFn: async () => usersApi.deleteAdminUser(Number(id)),
    onSuccess: () => {
      toast.success('User deleted');
      navigate('/users');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to delete'),
  });

  const handleResetPassword = () => {
    if (!newPassword || newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    resetPasswordMutation.mutate(newPassword);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'super-admin': return 'bg-purple-100 text-purple-800';
      case 'admin': return 'bg-blue-100 text-blue-800';
      case 'manager': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">User not found</p>
        <button onClick={() => navigate('/users')} className="mt-4 text-blue-600 hover:underline">Back to Admin Users</button>
      </div>
    );
  }

  const roleName = user.roles?.[0]?.name || user.role;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'permissions', label: 'Permissions' },
    { id: 'security', label: 'Security' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/users')} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-semibold">
              {user.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2)}
            </div>
            <div>
              <h1 className="text-2xl font-semibold">{user.name}</h1>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <span>{user.email}</span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(roleName)}`}>
                  <Shield className="h-3 w-3" />
                  {roleName}
                </span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowEditModal(true)}
            className="px-4 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100">
            Edit
          </button>
          {user.is_active ? (
            <button onClick={() => toggleMutation.mutate(false)} disabled={toggleMutation.isPending}
              className="px-4 py-2 text-sm text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100 flex items-center gap-1">
              <Lock className="h-4 w-4" /> Deactivate
            </button>
          ) : (
            <button onClick={() => toggleMutation.mutate(true)} disabled={toggleMutation.isPending}
              className="px-4 py-2 text-sm text-green-600 bg-green-50 rounded-lg hover:bg-green-100 flex items-center gap-1">
              <Unlock className="h-4 w-4" /> Activate
            </button>
          )}
          <button onClick={() => setShowResetModal(true)}
            className="px-4 py-2 text-sm text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 flex items-center gap-1">
            <Key className="h-4 w-4" /> Reset Password
          </button>
          {roleName !== 'super-admin' && (
            <button onClick={() => { if (window.confirm(`Delete "${user.name}"?`)) deleteMutation.mutate(); }} disabled={deleteMutation.isPending}
              className="px-4 py-2 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 flex items-center gap-1">
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-6 border-b-2 font-medium text-sm ${activeTab === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Contact Information</h3>
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-gray-500">Email</p>
                    <p className="text-gray-900">{user.email}</p>
                  </div>
                  {user.email_verified_at && <CheckCircle className="h-4 w-4 text-green-500" />}
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-gray-500">Phone</p>
                    <p className="text-gray-900">{user.phone || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-gray-500">Member Since</p>
                    <p className="text-gray-900">{new Date(user.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Account Status</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">Status</span>
                    <span className={user.is_active ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">Role</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(roleName)}`}>{roleName}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">Last Login</span>
                    <span>{user.last_login_at ? new Date(user.last_login_at).toLocaleString() : 'Never'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">Password Changed</span>
                    <span>{user.password_changed_at ? new Date(user.password_changed_at).toLocaleDateString() : 'Never'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'permissions' && (
            <div>
              <h3 className="font-medium text-gray-900 mb-4">Permissions ({user.permissions?.length || 0})</h3>
              {user.permissions && user.permissions.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {user.permissions.map((perm: string) => (
                    <span key={perm} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">{perm}</span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No permissions assigned</p>
              )}
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-4">Password</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Last changed: {user.password_changed_at ? new Date(user.password_changed_at).toLocaleDateString() : 'Never'}
                </p>
                <button onClick={() => setShowResetModal(true)}
                  className="px-4 py-2 text-sm text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 flex items-center gap-2">
                  <Key className="h-4 w-4" /> Reset Password
                </button>
              </div>
              <div className="border-t pt-6">
                <h3 className="font-medium text-gray-900 mb-2">Account Access</h3>
                <p className="text-sm text-gray-600 mb-3">
                  {user.is_active ? 'This user can log in and access the admin panel.' : 'This user is deactivated and cannot log in.'}
                </p>
                <button onClick={() => toggleMutation.mutate(!user.is_active)} disabled={toggleMutation.isPending}
                  className={`px-4 py-2 text-sm rounded-lg flex items-center gap-2 ${
                    user.is_active ? 'text-orange-600 bg-orange-50 hover:bg-orange-100' : 'text-green-600 bg-green-50 hover:bg-green-100'
                  }`}>
                  {user.is_active ? <><Lock className="h-4 w-4" /> Deactivate User</> : <><Unlock className="h-4 w-4" /> Activate User</>}
                </button>
              </div>
              {roleName !== 'super-admin' && (
                <div className="border-t pt-6">
                  <h3 className="font-medium text-red-600 mb-2">Danger Zone</h3>
                  <p className="text-sm text-gray-600 mb-3">Permanently delete this admin user. This action cannot be undone.</p>
                  <button onClick={() => { if (window.confirm(`Delete "${user.name}"?`)) deleteMutation.mutate(); }} disabled={deleteMutation.isPending}
                    className="px-4 py-2 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 flex items-center gap-2">
                    <Trash2 className="h-4 w-4" /> Delete User
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Edit Admin User</h3>
              <button onClick={() => setShowEditModal(false)} className="p-1 hover:bg-gray-100 rounded"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(editForm); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input type="text" value={editForm.name} onChange={(e) => setEditForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input type="email" value={editForm.email} onChange={(e) => setEditForm(p => ({ ...p, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input type="tel" value={editForm.phone} onChange={(e) => setEditForm(p => ({ ...p, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                <select value={editForm.role_id} onChange={(e) => setEditForm(p => ({ ...p, role_id: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" required>
                  <option value="">Select Role</option>
                  {roles.map((role: Role) => <option key={role.id} value={role.id}>{role.display_name}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={editForm.is_active} onChange={(e) => setEditForm(p => ({ ...p, is_active: e.target.checked }))}
                  className="rounded text-blue-600 focus:ring-blue-500" />
                <span className="text-sm text-gray-700">Active</span>
              </label>
              <div className="flex gap-2 pt-4">
                <button type="button" onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                <button type="submit" disabled={updateMutation.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  <Save className="h-4 w-4" /> {updateMutation.isPending ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Reset Password</h3>
              <button onClick={() => { setShowResetModal(false); setNewPassword(''); setConfirmPassword(''); }}
                className="p-1 hover:bg-gray-100 rounded"><X className="h-5 w-5" /></button>
            </div>
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                Resetting password for: <strong>{user.name}</strong> ({user.email})
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input type={showPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" placeholder="Minimum 8 characters" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" placeholder="Re-enter password" />
                {newPassword && confirmPassword && (
                  <p className={`text-xs mt-1 ${newPassword === confirmPassword ? 'text-green-600' : 'text-red-600'}`}>
                    {newPassword === confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                  </p>
                )}
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500" />
                <span className="text-sm text-gray-700">Show passwords</span>
              </label>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => { setShowResetModal(false); setNewPassword(''); setConfirmPassword(''); }}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
              <button onClick={handleResetPassword} disabled={resetPasswordMutation.isPending}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">
                {resetPasswordMutation.isPending ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserDetail;
