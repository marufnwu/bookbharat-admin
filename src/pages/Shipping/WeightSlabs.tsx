import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shippingApi } from '../../api';
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Package,
  Weight,
  Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface WeightSlab {
  id: number;
  courier_name: string;
  base_weight: number;
  created_at?: string;
  updated_at?: string;
}

interface WeightSlabForm {
  courier_name: string;
  base_weight: number;
}

const WeightSlabs: React.FC = () => {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingSlab, setEditingSlab] = useState<WeightSlab | null>(null);
  const [formData, setFormData] = useState<WeightSlabForm>({
    courier_name: 'Standard',
    base_weight: 0.5,
  });

  // Fetch weight slabs
  const { data: slabsResponse, isLoading } = useQuery({
    queryKey: ['weight-slabs'],
    queryFn: shippingApi.getWeightSlabs,
  });

  const weightSlabs = (slabsResponse as any)?.weight_slabs?.data || [];

  // Create mutation
  const createMutation = useMutation({
    mutationFn: shippingApi.createWeightSlab,
    onSuccess: () => {
      toast.success('Weight slab created successfully');
      queryClient.invalidateQueries({ queryKey: ['weight-slabs'] });
      handleCloseModal();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create weight slab');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: { id: number; slab: WeightSlabForm }) =>
      shippingApi.updateWeightSlab(data.id, data.slab),
    onSuccess: () => {
      toast.success('Weight slab updated successfully');
      queryClient.invalidateQueries({ queryKey: ['weight-slabs'] });
      handleCloseModal();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update weight slab');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: shippingApi.deleteWeightSlab,
    onSuccess: () => {
      toast.success('Weight slab deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['weight-slabs'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete weight slab');
    },
  });

  const handleOpenModal = (slab?: WeightSlab) => {
    if (slab) {
      setEditingSlab(slab);
      setFormData({
        courier_name: slab.courier_name,
        base_weight: slab.base_weight,
      });
    } else {
      setEditingSlab(null);
      setFormData({
        courier_name: 'Standard',
        base_weight: 0.5,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSlab(null);
    setFormData({
      courier_name: 'Standard',
      base_weight: 0.5,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSlab) {
      updateMutation.mutate({ id: editingSlab.id, slab: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this weight slab?')) {
      deleteMutation.mutate(id);
    }
  };

  const courierOptions = [
    'Standard',
    'Express',
    'Priority',
    'Economy',
    'Same Day',
    'Next Day',
  ];

  const commonWeights = [0.5, 1.0, 2.0, 3.0, 5.0, 10.0, 15.0, 20.0];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Weight Slabs</h2>
          <p className="text-sm text-gray-600">Define weight brackets for shipping calculation</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Weight Slab
        </button>
      </div>


      {/* Existing Slabs Table */}
      {weightSlabs.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900">All Weight Slabs</h3>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Courier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Base Weight
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {weightSlabs.map((slab: WeightSlab) => (
                <tr key={slab.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Package className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900">
                        {slab.courier_name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{slab.base_weight} kg</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {slab.created_at
                      ? new Date(slab.created_at).toLocaleDateString()
                      : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleOpenModal(slab)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(slab.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-30" onClick={handleCloseModal} />
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingSlab ? 'Edit Weight Slab' : 'Add Weight Slab'}
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Courier Name
                  </label>
                  <select
                    value={formData.courier_name}
                    onChange={(e) => setFormData({ ...formData, courier_name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    {courierOptions.map((courier) => (
                      <option key={courier} value={courier}>
                        {courier}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Base Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={formData.base_weight}
                    onChange={(e) =>
                      setFormData({ ...formData, base_weight: parseFloat(e.target.value) })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Common weights: 0.5, 1, 2, 5, 10, 15, 20 kg
                  </p>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    {createMutation.isPending || updateMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        {editingSlab ? 'Update' : 'Create'}
                      </>
                    )}
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

export default WeightSlabs;