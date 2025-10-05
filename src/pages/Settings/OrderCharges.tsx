import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderChargesApi } from '../../api/extended';
import toast from 'react-hot-toast';
import {
  Plus,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Save,
  X,
  GripVertical,
  AlertCircle,
} from 'lucide-react';

interface OrderCharge {
  id: number;
  name: string;
  code: string;
  type: 'fixed' | 'percentage' | 'tiered';
  amount: number;
  percentage: number;
  tiers: Array<{ min: number; max: number; charge: string | number }> | null;
  is_enabled: boolean;
  apply_to: 'all' | 'cod_only' | 'online_only' | 'specific_payment_methods' | 'conditional';
  payment_methods: string[] | null;
  conditions: any;
  priority: number;
  description: string;
  display_label: string;
  is_taxable: boolean;
  apply_after_discount: boolean;
  is_refundable: boolean;
}

const OrderCharges: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCharge, setEditingCharge] = useState<OrderCharge | null>(null);
  const [formData, setFormData] = useState<Partial<OrderCharge>>({
    name: '',
    code: '',
    type: 'fixed',
    amount: 0,
    percentage: 0,
    tiers: null,
    is_enabled: true,
    apply_to: 'all',
    payment_methods: null,
    conditions: null,
    priority: 0,
    description: '',
    display_label: '',
    is_taxable: false,
    apply_after_discount: true,
    is_refundable: true,
  });

  // Fetch charges
  const { data: chargesData, isLoading } = useQuery({
    queryKey: ['order-charges'],
    queryFn: orderChargesApi.getAll,
  });

  const charges = chargesData?.charges || [];

  // Create mutation
  const createMutation = useMutation({
    mutationFn: orderChargesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-charges'] });
      toast.success('Charge created successfully');
      closeModal();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create charge');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => orderChargesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-charges'] });
      toast.success('Charge updated successfully');
      closeModal();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update charge');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: orderChargesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-charges'] });
      toast.success('Charge deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete charge');
    },
  });

  // Toggle status mutation
  const toggleMutation = useMutation({
    mutationFn: orderChargesApi.toggleStatus,
    onSuccess: (data) => {
      console.log('Toggle success:', data);
      queryClient.invalidateQueries({ queryKey: ['order-charges'] });
      toast.success('Charge status updated');
    },
    onError: (error: any) => {
      console.error('Toggle error:', error);
      console.error('Error response:', error.response);
      const message = error.response?.data?.message || error.message || 'Failed to toggle status';
      toast.error(message);
    },
  });

  const openModal = (charge?: OrderCharge) => {
    if (charge) {
      setEditingCharge(charge);
      setFormData(charge);
    } else {
      setEditingCharge(null);
      setFormData({
        name: '',
        code: '',
        type: 'fixed',
        amount: 0,
        percentage: 0,
        tiers: null,
        is_enabled: true,
        apply_to: 'all',
        payment_methods: null,
        conditions: null,
        priority: charges.length,
        description: '',
        display_label: '',
        is_taxable: false,
        apply_after_discount: true,
        is_refundable: true,
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCharge(null);
    setFormData({
      name: '',
      code: '',
      type: 'fixed',
      amount: 0,
      percentage: 0,
      tiers: null,
      is_enabled: true,
      apply_to: 'all',
      payment_methods: null,
      conditions: null,
      priority: 0,
      description: '',
      display_label: '',
      is_taxable: false,
      apply_after_discount: true,
      is_refundable: true,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingCharge) {
      updateMutation.mutate({ id: editingCharge.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this charge?')) {
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
          <h2 className="text-xl font-semibold text-gray-900">Order Charges</h2>
          <p className="mt-1 text-sm text-gray-600">
            Manage additional charges like COD fees, handling fees, etc.
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Charge
        </button>
      </div>

      {/* Charges List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Priority
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Value
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Apply To
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
            {charges.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  No charges configured yet. Click "Add Charge" to create one.
                </td>
              </tr>
            ) : (
              charges.map((charge: OrderCharge) => (
                <tr key={charge.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-gray-400">
                      <GripVertical className="h-5 w-5 mr-2" />
                      <span className="text-sm text-gray-900">{charge.priority}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{charge.name}</div>
                    <div className="text-sm text-gray-500">{charge.display_label}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {charge.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {charge.type === 'fixed' && `₹${charge.amount}`}
                    {charge.type === 'percentage' && `${charge.percentage}%`}
                    {charge.type === 'tiered' && 'Tiered'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {charge.apply_to.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleMutation.mutate(charge.id)}
                      className="focus:outline-none"
                    >
                      {charge.is_enabled ? (
                        <ToggleRight className="h-6 w-6 text-green-600" />
                      ) : (
                        <ToggleLeft className="h-6 w-6 text-gray-400" />
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openModal(charge)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(charge.id)}
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
                      {editingCharge ? 'Edit Charge' : 'Add New Charge'}
                    </h3>
                    <button type="button" onClick={closeModal} className="text-gray-400 hover:text-gray-500">
                      <X className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Name */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Type and Value */}
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                        <select
                          value={formData.type}
                          onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="fixed">Fixed</option>
                          <option value="percentage">Percentage</option>
                          <option value="tiered">Tiered</option>
                        </select>
                      </div>
                      {formData.type === 'fixed' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      )}
                      {formData.type === 'percentage' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Percentage (%)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.percentage}
                            onChange={(e) => setFormData({ ...formData, percentage: parseFloat(e.target.value) })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                        <input
                          type="number"
                          value={formData.priority}
                          onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Apply To */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Apply To *</label>
                      <select
                        value={formData.apply_to}
                        onChange={(e) => setFormData({ ...formData, apply_to: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">All Orders</option>
                        <option value="cod_only">COD Only</option>
                        <option value="online_only">Online Payment Only</option>
                        <option value="specific_payment_methods">Specific Payment Methods</option>
                        <option value="conditional">Conditional</option>
                      </select>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Checkboxes */}
                    <div className="grid grid-cols-2 gap-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.is_taxable}
                          onChange={(e) => setFormData({ ...formData, is_taxable: e.target.checked })}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Is Taxable</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.apply_after_discount}
                          onChange={(e) => setFormData({ ...formData, apply_after_discount: e.target.checked })}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Apply After Discount</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.is_refundable}
                          onChange={(e) => setFormData({ ...formData, is_refundable: e.target.checked })}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Is Refundable</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.is_enabled}
                          onChange={(e) => setFormData({ ...formData, is_enabled: e.target.checked })}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Enabled</span>
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
                    {editingCharge ? 'Update' : 'Create'}
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

export default OrderCharges;
