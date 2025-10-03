import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shippingApi } from '../../api';
import {
  Plus,
  Search,
  Upload,
  Download,
  Edit,
  Trash2,
  Save,
  X,
  MapPin,
  Loader2,
  Filter,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface PincodeZone {
  id: number;
  pincode: string;
  zone: string;
  city?: string;
  state?: string;
  region?: string;
  is_metro: boolean;
  is_remote: boolean;
  cod_available: boolean;
  expected_delivery_days: number;
  zone_multiplier: number;
  created_at?: string;
}

interface PincodeForm {
  pincode: string;
  zone: string;
  city: string;
  state: string;
  region: string;
  is_metro: boolean;
  is_remote: boolean;
  cod_available: boolean;
  expected_delivery_days: number;
  zone_multiplier: number;
}

const PincodeZones: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterZone, setFilterZone] = useState('');
  const [filterState, setFilterState] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPincode, setEditingPincode] = useState<PincodeZone | null>(null);
  const [formData, setFormData] = useState<PincodeForm>({
    pincode: '',
    zone: 'D',
    city: '',
    state: '',
    region: '',
    is_metro: false,
    is_remote: false,
    cod_available: true,
    expected_delivery_days: 5,
    zone_multiplier: 1.0,
  });

  // Fetch pincode zones
  const { data: pincodesResponse, isLoading } = useQuery({
    queryKey: ['pincode-zones', searchTerm, filterZone, filterState],
    queryFn: () => shippingApi.getPincodes(),
  });

  const pincodes = (pincodesResponse as any)?.pincode_zones?.data || [];

  // Create mutation
  const createMutation = useMutation({
    mutationFn: shippingApi.createPincodeZone,
    onSuccess: () => {
      toast.success('Pincode zone created successfully');
      queryClient.invalidateQueries({ queryKey: ['pincode-zones'] });
      handleCloseModal();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create pincode zone');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: { id: number; pincode: PincodeForm }) =>
      shippingApi.updatePincodeZone(data.id, data.pincode),
    onSuccess: () => {
      toast.success('Pincode zone updated successfully');
      queryClient.invalidateQueries({ queryKey: ['pincode-zones'] });
      handleCloseModal();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update pincode zone');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: shippingApi.deletePincodeZone,
    onSuccess: () => {
      toast.success('Pincode zone deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['pincode-zones'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete pincode zone');
    },
  });

  const handleOpenModal = (pincode?: PincodeZone) => {
    if (pincode) {
      setEditingPincode(pincode);
      setFormData({
        pincode: pincode.pincode,
        zone: pincode.zone,
        city: pincode.city || '',
        state: pincode.state || '',
        region: pincode.region || '',
        is_metro: pincode.is_metro,
        is_remote: pincode.is_remote,
        cod_available: pincode.cod_available,
        expected_delivery_days: pincode.expected_delivery_days,
        zone_multiplier: pincode.zone_multiplier,
      });
    } else {
      setEditingPincode(null);
      setFormData({
        pincode: '',
        zone: 'D',
        city: '',
        state: '',
        region: '',
        is_metro: false,
        is_remote: false,
        cod_available: true,
        expected_delivery_days: 5,
        zone_multiplier: 1.0,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPincode(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPincode) {
      updateMutation.mutate({ id: editingPincode.id, pincode: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this pincode zone?')) {
      deleteMutation.mutate(id);
    }
  };

  const zones = ['A', 'B', 'C', 'D', 'E'];
  const states = [
    'Delhi', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Gujarat',
    'West Bengal', 'Uttar Pradesh', 'Rajasthan', 'Kerala', 'Telangana',
  ];

  const zoneColors: { [key: string]: string } = {
    A: 'bg-green-100 text-green-800 border-green-200',
    B: 'bg-blue-100 text-blue-800 border-blue-200',
    C: 'bg-purple-100 text-purple-800 border-purple-200',
    D: 'bg-orange-100 text-orange-800 border-orange-200',
    E: 'bg-red-100 text-red-800 border-red-200',
  };

  // Filter pincodes
  const filteredPincodes = pincodes.filter((p: PincodeZone) => {
    const matchesSearch = !searchTerm || 
      p.pincode.includes(searchTerm) || 
      p.city?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesZone = !filterZone || p.zone === filterZone;
    const matchesState = !filterState || p.state === filterState;
    return matchesSearch && matchesZone && matchesState;
  });

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
          <h2 className="text-lg font-semibold text-gray-900">Pincode Zones</h2>
          <p className="text-sm text-gray-600">Map pincodes to shipping zones</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <Upload className="h-4 w-4 mr-2" />
            Bulk Import
          </button>
          <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Pincode
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search pincode or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-3 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={filterZone}
            onChange={(e) => setFilterZone(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Zones</option>
            {zones.map((zone) => (
              <option key={zone} value={zone}>Zone {zone}</option>
            ))}
          </select>
          <select
            value={filterState}
            onChange={(e) => setFilterState(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All States</option>
            {states.map((state) => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
          <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <Filter className="h-4 w-4 mr-2" />
            More Filters
          </button>
        </div>
      </div>

      {/* Pincodes Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pincode
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Zone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Delivery Days
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Features
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredPincodes.map((pincode: PincodeZone) => (
              <tr key={pincode.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-900">{pincode.pincode}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded border ${zoneColors[pincode.zone]}`}>
                    Zone {pincode.zone}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{pincode.city || 'N/A'}</p>
                    <p className="text-xs text-gray-500">{pincode.state || 'N/A'}</p>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900">{pincode.expected_delivery_days} days</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    {pincode.cod_available ? (
                      <span className="flex items-center text-xs text-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        COD
                      </span>
                    ) : (
                      <span className="flex items-center text-xs text-gray-400">
                        <XCircle className="h-3 w-3 mr-1" />
                        No COD
                      </span>
                    )}
                    {pincode.is_metro && (
                      <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">Metro</span>
                    )}
                    {pincode.is_remote && (
                      <span className="px-1.5 py-0.5 text-xs bg-red-100 text-red-700 rounded">Remote</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleOpenModal(pincode)}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(pincode.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredPincodes.length === 0 && (
          <div className="text-center py-12">
            <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No pincodes found</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-30" onClick={handleCloseModal} />
            <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingPincode ? 'Edit Pincode Zone' : 'Add Pincode Zone'}
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pincode
                    </label>
                    <input
                      type="text"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      value={formData.pincode}
                      onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                      disabled={!!editingPincode}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Zone
                    </label>
                    <select
                      value={formData.zone}
                      onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      {zones.map((zone) => (
                        <option key={zone} value={zone}>Zone {zone}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expected Delivery Days
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={formData.expected_delivery_days}
                      onChange={(e) => setFormData({ ...formData, expected_delivery_days: parseInt(e.target.value) })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Zone Multiplier
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="5"
                      value={formData.zone_multiplier}
                      onChange={(e) => setFormData({ ...formData, zone_multiplier: parseFloat(e.target.value) })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.cod_available}
                      onChange={(e) => setFormData({ ...formData, cod_available: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">COD Available</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_metro}
                      onChange={(e) => setFormData({ ...formData, is_metro: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Metro City</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_remote}
                      onChange={(e) => setFormData({ ...formData, is_remote: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Remote Area</span>
                  </label>
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
                        {editingPincode ? 'Update' : 'Create'}
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

export default PincodeZones;