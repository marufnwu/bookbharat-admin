import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rolesApi } from '../../api';
import {
  Shield,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Users,
  Key,
} from 'lucide-react';
import { toast } from '../../utils/toast';

interface Role {
  id: number;
  name: string;
  display_name: string;
  permissions: string[];
  users_count: number;
}

interface Permission {
  id: number;
  name: string;
  display_name: string;
  guard_name: string;
}

const RolesPermissions: React.FC = () => {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({ name: '', permissions: [] as string[] });

  const { data: rolesResponse, isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: rolesApi.getAll,
  });

  const roles = rolesResponse?.roles || [];
  const allPermissions: Permission[] = (rolesResponse?.permissions || []) as Permission[];

  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => rolesApi.create(data),
    onSuccess: () => {
      toast.success('Role created');
      setFormErrors({});
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      handleCloseModal();
    },
    onError: (error: any) => {
      const errs = error.response?.data?.errors || {};
      setFormErrors(errs);
      toast.error(error.response?.data?.message || 'Failed to create role');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof formData }) => rolesApi.update(id, data),
    onSuccess: () => {
      toast.success('Role updated');
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      handleCloseModal();
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to update role'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => rolesApi.delete(id),
    onSuccess: () => {
      toast.success('Role deleted');
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to delete role'),
  });

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setFormData({ name: role.name, permissions: role.permissions || [] });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingRole(null);
    setFormData({ name: '', permissions: [] });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('Role name is required');
      return;
    }
    if (editingRole) {
      updateMutation.mutate({ id: editingRole.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const togglePermission = (perm: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter(p => p !== perm)
        : [...prev.permissions, perm],
    }));
  };

  const isSystemRole = (name: string) => ['super-admin', 'admin', 'customer'].includes(name);

  // Group permissions by prefix
  const groupedPermissions = allPermissions.reduce((acc: Record<string, Permission[]>, perm: Permission) => {
    const prefix = perm.name.split(' ').slice(0, -1).join(' ') || 'other';
    if (!acc[prefix]) acc[prefix] = [];
    acc[prefix].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Roles & Permissions</h1>
          <p className="text-sm text-gray-500 mt-1">Manage roles and their permissions</p>
        </div>
        <button
          onClick={() => { setFormData({ name: '', permissions: [] }); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Create Role
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg"><Shield className="h-5 w-5 text-blue-600" /></div>
            <div>
              <p className="text-sm text-gray-500">Total Roles</p>
              <p className="text-2xl font-semibold">{roles.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg"><Key className="h-5 w-5 text-green-600" /></div>
            <div>
              <p className="text-sm text-gray-500">Permissions</p>
              <p className="text-2xl font-semibold">{allPermissions.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg"><Users className="h-5 w-5 text-purple-600" /></div>
            <div>
              <p className="text-sm text-gray-500">Admin Users</p>
              <p className="text-2xl font-semibold">{rolesResponse?.stats?.total_admin_users || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Roles Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Permissions</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Users</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {roles.map((role: Role) => (
              <tr key={role.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <p className="font-medium text-gray-900">{role.display_name}</p>
                    <p className="text-xs text-gray-500">{role.name}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600">{role.permissions?.length || 0} permissions</span>
                  {role.name === 'super-admin' && (
                    <span className="ml-2 text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">All access</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {role.users_count || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => handleEdit(role)}
                      className="px-3 py-1.5 text-sm text-blue-600 bg-blue-50 rounded hover:bg-blue-100 flex items-center gap-1">
                      <Edit className="h-3.5 w-3.5" /> Edit
                    </button>
                    {!isSystemRole(role.name) && (
                      <button onClick={() => { if (window.confirm(`Delete role "${role.display_name}"?`)) deleteMutation.mutate(role.id); }}
                        className="px-3 py-1.5 text-sm text-red-600 bg-red-50 rounded hover:bg-red-100 flex items-center gap-1">
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{editingRole ? 'Edit Role' : 'Create Role'}</h3>
              <button onClick={handleCloseModal} className="p-1 hover:bg-gray-100 rounded"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g. content-manager"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Permissions ({formData.permissions.length} selected)
                </label>
                {editingRole?.name === 'super-admin' ? (
                  <p className="text-sm text-gray-500">Super admin has all permissions automatically.</p>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(groupedPermissions).map(([group, perms]: [string, Permission[]]) => (
                      <div key={group} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium text-gray-700 capitalize">{group}</h4>
                          <button
                            type="button"
                            onClick={() => {
                              const allNames: string[] = perms.map((p: Permission) => p.name);
                              const allSelected = allNames.every((p: string) => formData.permissions.includes(p));
                              setFormData(prev => ({
                                ...prev,
                                permissions: allSelected
                                  ? prev.permissions.filter((p: string) => !allNames.includes(p))
                                  : Array.from(new Set([...prev.permissions, ...allNames])),
                              }));
                            }}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            {perms.every((p: Permission) => formData.permissions.includes(p.name)) ? 'Deselect all' : 'Select all'}
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {perms.map((perm: Permission) => (
                            <label key={perm.name} className="flex items-center gap-1.5 text-sm">
                              <input
                                type="checkbox"
                                checked={formData.permissions.includes(perm.name)}
                                onChange={() => togglePermission(perm.name)}
                                className="rounded text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-gray-700">{perm.display_name || perm.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <button type="button" onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                <button type="submit" disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  <Save className="h-4 w-4" />
                  {(createMutation.isPending || updateMutation.isPending) ? 'Saving...' : editingRole ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RolesPermissions;
