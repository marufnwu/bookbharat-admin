import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shippingApi } from '../../api';
import {
  Edit,
  Save,
  X,
  Loader2,
  DollarSign,
  Globe,
  TrendingUp,
  Info,
  Trash2,
  Plus
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ZoneRate {
  id: number;
  shipping_weight_slab_id: number;
  zone: string;
  fwd_rate: number;
  rto_rate: number;
  aw_rate: number;
  cod_charges: number;
  cod_percentage: number;
  weight_slab?: {
    courier_name: string;
    base_weight: number;
  };
}

interface ZoneRateForm {
  shipping_weight_slab_id: number;
  zone: string;
  fwd_rate: number;
  rto_rate: number;
  aw_rate: number;
  cod_charges: number;
  cod_percentage: number;
}

const ZoneRates: React.FC = () => {
  const queryClient = useQueryClient();
  const [editingRate, setEditingRate] = useState<number | null>(null);
  const [formData, setFormData] = useState<{ [key: number]: ZoneRateForm }>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newZoneData, setNewZoneData] = useState<{
    weightSlabId: number;
    zone: string;
    weightSlabName: string;
  } | null>(null);
  const [createFormData, setCreateFormData] = useState<ZoneRateForm>({
    shipping_weight_slab_id: 0,
    zone: '',
    fwd_rate: 50,
    rto_rate: 40,
    aw_rate: 30,
    cod_charges: 20,
    cod_percentage: 2,
  });

  // Fetch weight slabs
  const { data: slabsResponse } = useQuery({
    queryKey: ['weight-slabs'],
    queryFn: shippingApi.getWeightSlabs,
  });

  const weightSlabs = (slabsResponse as any)?.weight_slabs?.data || [];

  // Fetch zone rates
  const { data: zonesResponse, isLoading } = useQuery({
    queryKey: ['zone-rates'],
    queryFn: shippingApi.getZones,
  });

  const zoneRates = (zonesResponse as any)?.zones || [];

  // Create mutation
  const createMutation = useMutation({
    mutationFn: shippingApi.createZone,
    onSuccess: () => {
      toast.success('Zone rate created successfully');
      queryClient.invalidateQueries({ queryKey: ['zone-rates'] });
      queryClient.invalidateQueries({ queryKey: ['weight-slabs'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create zone rate');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: { id: number; rate: Partial<ZoneRateForm> }) =>
      shippingApi.updateZone(data.id, data.rate),
    onSuccess: () => {
      toast.success('Zone rate updated successfully');
      queryClient.invalidateQueries({ queryKey: ['zone-rates'] });
      queryClient.invalidateQueries({ queryKey: ['weight-slabs'] });
      setEditingRate(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update zone rate');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: shippingApi.deleteZone,
    onSuccess: () => {
      toast.success('Zone rate deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['zone-rates'] });
      queryClient.invalidateQueries({ queryKey: ['weight-slabs'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete zone rate');
    },
  });

  const zones = ['A', 'B', 'C', 'D', 'E'];
  const zoneInfo: { [key: string]: { name: string; color: string; description: string } } = {
    A: { name: 'Same City', color: 'green', description: 'Delivery within the same city' },
    B: { name: 'Same State', color: 'blue', description: 'Delivery within the same state' },
    C: { name: 'Metro to Metro', color: 'purple', description: 'Between metropolitan cities' },
    D: { name: 'Rest of India', color: 'orange', description: 'Standard nationwide delivery' },
    E: { name: 'Northeast/J&K', color: 'red', description: 'Remote and special areas' },
  };

  const handleEdit = (rate: ZoneRate) => {
    setEditingRate(rate.id);
    setFormData({
      ...formData,
      [rate.id]: {
        shipping_weight_slab_id: rate.shipping_weight_slab_id,
        zone: rate.zone,
        fwd_rate: rate.fwd_rate,
        rto_rate: rate.rto_rate,
        aw_rate: rate.aw_rate,
        cod_charges: rate.cod_charges,
        cod_percentage: rate.cod_percentage,
      },
    });
  };

  const handleSave = (rate: ZoneRate) => {
    const data = formData[rate.id];
    if (data) {
      updateMutation.mutate({ id: rate.id, rate: data });
    }
  };

  const handleCancel = () => {
    setEditingRate(null);
    setFormData({});
  };

  const handleInputChange = (rateId: number, field: keyof ZoneRateForm, value: any) => {
    setFormData({
      ...formData,
      [rateId]: {
        ...formData[rateId],
        [field]: parseFloat(value) || 0,
      },
    });
  };

  const handleCreate = (weightSlabId: number, zone: string) => {
    const weightSlab = weightSlabs.find((slab: any) => slab.id === weightSlabId);
    setNewZoneData({
      weightSlabId,
      zone,
      weightSlabName: weightSlab?.courier_name || 'Unknown'
    });
    setCreateFormData({
      shipping_weight_slab_id: weightSlabId,
      zone: zone,
      fwd_rate: 50,
      rto_rate: 40,
      aw_rate: 30,
      cod_charges: 20,
      cod_percentage: 2,
    });
    setShowCreateModal(true);
  };

  const handleCreateSubmit = () => {
    createMutation.mutate(createFormData, {
      onSuccess: () => {
        setShowCreateModal(false);
        setNewZoneData(null);
      }
    });
  };

  const handleCreateCancel = () => {
    setShowCreateModal(false);
    setNewZoneData(null);
  };

  const handleDelete = (rateId: number) => {
    if (window.confirm('Are you sure you want to delete this zone rate?')) {
      deleteMutation.mutate(rateId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Group rates by weight slab
  const ratesByWeightSlab: { [key: number]: ZoneRate[] } = {};
  zoneRates.forEach((rate: ZoneRate) => {
    if (!ratesByWeightSlab[rate.shipping_weight_slab_id]) {
      ratesByWeightSlab[rate.shipping_weight_slab_id] = [];
    }
    ratesByWeightSlab[rate.shipping_weight_slab_id].push(rate);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Zone Rates</h2>
          <p className="text-sm text-gray-600">Configure shipping rates for each zone and weight slab</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
          <div className="flex items-center text-sm text-blue-800">
            <Info className="h-4 w-4 mr-2" />
            <span>Rates are in INR (₹)</span>
          </div>
        </div>
      </div>

      {/* Zone Legends */}
      <div className="grid grid-cols-5 gap-3">
        {zones.map((zone) => (
          <div key={zone} className={`bg-${zoneInfo[zone].color}-50 border border-${zoneInfo[zone].color}-200 rounded-lg p-3`}>
            <div className="flex items-center justify-between">
              <Globe className={`h-4 w-4 text-${zoneInfo[zone].color}-500`} />
              <span className={`text-xs font-semibold text-${zoneInfo[zone].color}-700`}>Zone {zone}</span>
            </div>
            <p className="text-sm font-medium text-gray-900 mt-1">{zoneInfo[zone].name}</p>
            <p className="text-xs text-gray-600 mt-1">{zoneInfo[zone].description}</p>
          </div>
        ))}
      </div>

      {/* Rates by Weight Slab */}
      {weightSlabs.map((slab: any) => {
        const slabRates = ratesByWeightSlab[slab.id] || [];

        return (
          <div key={slab.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    {slab.courier_name} - {slab.base_weight} kg
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Configure rates for this weight slab across all zones
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                    {slabRates.length} zones configured
                  </span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Zone
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Forward Rate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        RTO Rate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Add. Weight
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        COD Charges
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        COD %
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {zones.map((zone) => {
                      const rate = slabRates.find((r: ZoneRate) => r.zone === zone);
                      if (!rate) {
                        return (
                          <tr key={zone} className="bg-gray-50">
                            <td className="px-6 py-4">
                              <span className="text-sm font-medium text-gray-900">Zone {zone}</span>
                              <span className="block text-xs text-gray-500">{zoneInfo[zone].name}</span>
                            </td>
                            <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                              Not configured
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => handleCreate(slab.id, zone)}
                                disabled={createMutation.isPending}
                                className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 border border-blue-200 rounded hover:bg-blue-50"
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Add Rate
                              </button>
                            </td>
                          </tr>
                        );
                      }

                      const isEditing = editingRate === rate.id;
                      const currentData = formData[rate.id] || rate;

                      return (
                        <tr key={rate.id}>
                          <td className="px-6 py-4">
                            <span className="text-sm font-medium text-gray-900">Zone {rate.zone}</span>
                            <span className="block text-xs text-gray-500">{zoneInfo[rate.zone].name}</span>
                          </td>
                          <td className="px-6 py-4">
                            {isEditing ? (
                              <input
                                type="number"
                                value={currentData.fwd_rate}
                                onChange={(e) => handleInputChange(rate.id, 'fwd_rate', e.target.value)}
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                            ) : (
                              <span className="text-sm text-gray-900">₹{rate.fwd_rate}</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {isEditing ? (
                              <input
                                type="number"
                                value={currentData.rto_rate}
                                onChange={(e) => handleInputChange(rate.id, 'rto_rate', e.target.value)}
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                            ) : (
                              <span className="text-sm text-gray-900">₹{rate.rto_rate}</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {isEditing ? (
                              <input
                                type="number"
                                value={currentData.aw_rate}
                                onChange={(e) => handleInputChange(rate.id, 'aw_rate', e.target.value)}
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                            ) : (
                              <span className="text-sm text-gray-900">₹{rate.aw_rate}/kg</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {isEditing ? (
                              <input
                                type="number"
                                value={currentData.cod_charges}
                                onChange={(e) => handleInputChange(rate.id, 'cod_charges', e.target.value)}
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                            ) : (
                              <span className="text-sm text-gray-900">₹{rate.cod_charges}</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {isEditing ? (
                              <input
                                type="number"
                                step="0.1"
                                value={currentData.cod_percentage}
                                onChange={(e) => handleInputChange(rate.id, 'cod_percentage', e.target.value)}
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                            ) : (
                              <span className="text-sm text-gray-900">{rate.cod_percentage}%</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {isEditing ? (
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  onClick={() => handleSave(rate)}
                                  disabled={updateMutation.isPending}
                                  className="p-1 text-green-600 hover:text-green-700"
                                >
                                  <Save className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={handleCancel}
                                  className="p-1 text-gray-400 hover:text-gray-500"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  onClick={() => handleEdit(rate)}
                                  className="p-1 text-blue-600 hover:text-blue-700"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(rate.id)}
                                  disabled={deleteMutation.isPending}
                                  className="p-1 text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
          </div>
        );
      })}

      {weightSlabs.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <TrendingUp className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
          <p className="text-sm text-yellow-800 font-medium">No weight slabs configured</p>
          <p className="text-xs text-yellow-700 mt-1">
            Please configure weight slabs first to set up zone rates
          </p>
        </div>
      )}

      {/* Create Zone Rate Modal */}
      {showCreateModal && newZoneData && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Add Zone Rate
              </h3>
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Weight Slab:</strong> {newZoneData.weightSlabName}
                </p>
                <p className="text-sm text-blue-800">
                  <strong>Zone:</strong> {newZoneData.zone} - {zoneInfo[newZoneData.zone]?.name}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Forward Rate (₹)</label>
                  <input
                    type="number"
                    value={createFormData.fwd_rate}
                    onChange={(e) => setCreateFormData({...createFormData, fwd_rate: parseFloat(e.target.value) || 0})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">RTO Rate (₹)</label>
                  <input
                    type="number"
                    value={createFormData.rto_rate}
                    onChange={(e) => setCreateFormData({...createFormData, rto_rate: parseFloat(e.target.value) || 0})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Additional Weight Rate (₹/kg)</label>
                  <input
                    type="number"
                    value={createFormData.aw_rate}
                    onChange={(e) => setCreateFormData({...createFormData, aw_rate: parseFloat(e.target.value) || 0})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">COD Charges (₹)</label>
                  <input
                    type="number"
                    value={createFormData.cod_charges}
                    onChange={(e) => setCreateFormData({...createFormData, cod_charges: parseFloat(e.target.value) || 0})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">COD Percentage (%)</label>
                  <input
                    type="number"
                    value={createFormData.cod_percentage}
                    onChange={(e) => setCreateFormData({...createFormData, cod_percentage: parseFloat(e.target.value) || 0})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={handleCreateCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateSubmit}
                  disabled={createMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {createMutation.isPending ? (
                    <div className="flex items-center">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Creating...
                    </div>
                  ) : (
                    'Create Zone Rate'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ZoneRates;