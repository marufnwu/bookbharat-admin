import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taxConfigurationsApi } from '../../api/extended';
import toast from 'react-hot-toast';
import {
  Plus,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Save,
  X,
  Percent,
  Info,
} from 'lucide-react';

interface TaxConfiguration {
  id: number;
  name: string;
  code: string;
  tax_type: 'gst' | 'igst' | 'cgst_sgst' | 'vat' | 'sales_tax' | 'custom';
  rate: number;
  is_enabled: boolean;
  apply_on: 'subtotal' | 'subtotal_with_charges' | 'subtotal_with_shipping';
  conditions: any;
  is_inclusive: boolean;
  priority: number;
  description: string;
  display_label: string;
}

const TaxConfigurations: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTax, setEditingTax] = useState<TaxConfiguration | null>(null);
  const [formData, setFormData] = useState<Partial<TaxConfiguration>>({
    name: '',
    code: '',
    tax_type: 'gst',
    rate: 0,
    is_enabled: true,
    apply_on: 'subtotal',
    conditions: null,
    is_inclusive: false,
    priority: 0,
    description: '',
    display_label: '',
  });

  // Fetch tax configurations
  const { data: taxesData, isLoading } = useQuery({
    queryKey: ['tax-configurations'],
    queryFn: taxConfigurationsApi.getAll,
  });

  const taxes = taxesData?.taxes || [];

  // Create mutation
  const createMutation = useMutation({
    mutationFn: taxConfigurationsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-configurations'] });
      toast.success('Tax configuration created successfully');
      closeModal();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create tax configuration');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => taxConfigurationsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-configurations'] });
      toast.success('Tax configuration updated successfully');
      closeModal();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update tax configuration');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: taxConfigurationsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-configurations'] });
      toast.success('Tax configuration deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete tax configuration');
    },
  });

  // Toggle status mutation
  const toggleMutation = useMutation({
    mutationFn: taxConfigurationsApi.toggleStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-configurations'] });
      toast.success('Tax status updated');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to toggle status');
    },
  });

  const openModal = (tax?: TaxConfiguration) => {
    if (tax) {
      setEditingTax(tax);
      setFormData(tax);
    } else {
      setEditingTax(null);
      setFormData({
        name: '',
        code: '',
        tax_type: 'gst',
        rate: 0,
        is_enabled: true,
        apply_on: 'subtotal',
        conditions: null,
        is_inclusive: false,
        priority: taxes.length,
        description: '',
        display_label: '',
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTax(null);
    setFormData({
      name: '',
      code: '',
      tax_type: 'gst',
      rate: 0,
      is_enabled: true,
      apply_on: 'subtotal',
      conditions: null,
      is_inclusive: false,
      priority: 0,
      description: '',
      display_label: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingTax) {
      updateMutation.mutate({ id: editingTax.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this tax configuration?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Tax Configurations</h2>
          <p className="mt-1 text-sm text-gray-600">
            Manage tax settings for GST, IGST, VAT, and other tax types
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Tax Configuration
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start">
        <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
        <div className="text-sm text-blue-800">
          <p className="font-medium">Tax Configuration Tips:</p>
          <ul className="mt-2 list-disc list-inside space-y-1">
            <li>GST/IGST: For Indian tax compliance</li>
            <li>Inclusive tax means tax is already included in product prices</li>
            <li>Exclusive tax will be added on top of the price</li>
            <li>Priority determines the order of tax calculation</li>
          </ul>
        </div>
      </div>

      {/* Tax List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rate
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Apply On
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mode
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {taxes.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  No tax configurations yet. Click "Add Tax Configuration" to create one.
                </td>
              </tr>
            ) : (
              taxes.map((tax: TaxConfiguration) => (
                <tr key={tax.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{tax.name}</div>
                    <div className="text-sm text-gray-500">{tax.display_label}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                      {tax.tax_type.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <Percent className="h-4 w-4 mr-1 text-gray-400" />
                      {tax.rate}%
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {tax.apply_on.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        tax.is_inclusive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}
                    >
                      {tax.is_inclusive ? 'Inclusive' : 'Exclusive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleMutation.mutate(tax.id)}
                      className="focus:outline-none"
                    >
                      {tax.is_enabled ? (
                        <ToggleRight className="h-6 w-6 text-green-600" />
                      ) : (
                        <ToggleLeft className="h-6 w-6 text-gray-400" />
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openModal(tax)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(tax.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={closeModal}></div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {editingTax ? 'Edit Tax Configuration' : 'Add New Tax Configuration'}
                    </h3>
                    <button type="button" onClick={closeModal} className="text-gray-400 hover:text-gray-500">
                      <X className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Name and Code */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="e.g., GST (18%)"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                        <input
                          type="text"
                          required
                          value={formData.code}
                          onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                          placeholder="e.g., gst_18"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Display Label */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Display Label *</label>
                      <input
                        type="text"
                        required
                        value={formData.display_label}
                        onChange={(e) => setFormData({ ...formData, display_label: e.target.value })}
                        placeholder="What customers will see"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Tax Type and Rate */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tax Type *</label>
                        <select
                          value={formData.tax_type}
                          onChange={(e) => setFormData({ ...formData, tax_type: e.target.value as any })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="gst">GST (Goods & Services Tax)</option>
                          <option value="igst">IGST (Integrated GST)</option>
                          <option value="cgst_sgst">CGST + SGST</option>
                          <option value="vat">VAT (Value Added Tax)</option>
                          <option value="sales_tax">Sales Tax</option>
                          <option value="custom">Custom Tax</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Rate (%) *</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={formData.rate}
                          onChange={(e) => setFormData({ ...formData, rate: parseFloat(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Apply On */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Apply Tax On *</label>
                      <select
                        value={formData.apply_on}
                        onChange={(e) => setFormData({ ...formData, apply_on: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="subtotal">Subtotal Only</option>
                        <option value="subtotal_with_charges">Subtotal + Charges</option>
                        <option value="subtotal_with_shipping">Subtotal + Shipping</option>
                      </select>
                      <p className="mt-1 text-xs text-gray-500">
                        Determines the base amount on which tax will be calculated
                      </p>
                    </div>

                    {/* Priority */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                      <input
                        type="number"
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Lower number = higher priority (calculated first)
                      </p>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={2}
                        placeholder="Internal notes about this tax configuration"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Checkboxes */}
                    <div className="space-y-3 pt-2">
                      <label className="flex items-start">
                        <input
                          type="checkbox"
                          checked={formData.is_inclusive}
                          onChange={(e) => setFormData({ ...formData, is_inclusive: e.target.checked })}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5"
                        />
                        <div className="ml-3">
                          <span className="text-sm font-medium text-gray-700">Inclusive Tax</span>
                          <p className="text-xs text-gray-500">
                            Tax is already included in product prices (won't add to total)
                          </p>
                        </div>
                      </label>
                      <label className="flex items-start">
                        <input
                          type="checkbox"
                          checked={formData.is_enabled}
                          onChange={(e) => setFormData({ ...formData, is_enabled: e.target.checked })}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5"
                        />
                        <div className="ml-3">
                          <span className="text-sm font-medium text-gray-700">Enabled</span>
                          <p className="text-xs text-gray-500">
                            Tax will be active and applied to orders
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    <Save className="h-5 w-5 mr-2" />
                    {editingTax ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaxConfigurations;
