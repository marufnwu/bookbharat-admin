import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { usersApi, rolesApi } from '../../api';
import {
  Plus,
  Search,
  Shield,
  UserPlus,
  Save,
  X,
  Eye
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
  created_at: string;
}

interface Role {
  id: number;
  name: string;
  display_name: string;
}

interface AdminUserForm {
  name: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
  role_id: number;
  is_active: boolean;
  send_welcome_email: boolean;
}

const AdminUsers: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState<AdminUserForm>({
    name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
    role_id: 0,
    is_active: true,
    send_welcome_email: true,
  });

  const { data: usersResponse, isLoading } = useQuery({
    queryKey: ['admin-users', searchTerm, filterRole],
    queryFn: () => usersApi.getAdminUsers({ search: searchTerm, role: filterRole }),
  });

  const { data: rolesResponse } = useQuery({
    queryKey: ['roles'],
    queryFn: rolesApi.getAll,
  });

  const users = usersResponse?.users?.data || usersResponse?.users || [];
  const roles = rolesResponse?.roles || [];

  const createMutation = useMutation({
    mutationFn: async (data: AdminUserForm) => {
      return usersApi.createAdminUser(data);
    },
    onSuccess: () => {
      toast.success('Admin user created');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      handleCloseModal();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create user');
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.role_id) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (!formData.password || formData.password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }
    if (formData.password !== formData.password_confirmation) {
      toast.error('Passwords do not match');
      return;
    }
    createMutation.mutate(formData);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      password_confirmation: '',
      role_id: 0,
      is_active: true,
      send_welcome_email: true,
    });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'super-admin': return 'bg-purple-100 text-purple-800';
      case 'admin': return 'bg-blue-100 text-blue-800';
      case 'manager': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin Users</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <UserPlus className="h-4 w-4" />
          Add Admin User
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
            <Search className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Roles</option>
            {roles.map((role: Role) => (
              <option key={role.id} value={role.name}>
                {role.display_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : users.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Login</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user: AdminUser) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        {user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.roles?.[0]?.name || user.role)}`}>
                      <Shield className="h-3 w-3" />
                      {user.roles?.[0]?.name || user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <Link
                      to={`/users/${user.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No admin users found</p>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Add Admin User</h2>
              <button onClick={handleCloseModal} className="p-1 hover:bg-gray-100 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <input type="email" name="email" value={formData.email} onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
                <select name="role_id" value={formData.role_id} onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" required>
                  <option value="">Select Role</option>
                  {roles.map((role: Role) => (
                    <option key={role.id} value={role.id}>{role.display_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password *</label>
                <input type={showPassword ? 'text' : 'password'} name="password_confirmation" value={formData.password_confirmation} onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" required />
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleInputChange}
                  className="rounded text-blue-600 focus:ring-blue-500" />
                <span className="text-sm font-medium text-gray-700">Active</span>
              </label>
              <div className="flex gap-2 pt-4">
                <button type="button" onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                <button type="submit" disabled={createMutation.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  <Save className="h-4 w-4" />
                  {createMutation.isPending ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
