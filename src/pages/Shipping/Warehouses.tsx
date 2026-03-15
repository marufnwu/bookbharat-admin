import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shippingApi } from '../../api';
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  MapPin,
  Building,
  Star,
  StarOff,
  Phone,
  Mail
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button, Card, CardContent, StatusBadge, Modal, PageSkeleton } from '../../components';

interface Warehouse {
  id: number;
  name: string;
  code: string;
  type: 'warehouse' | 'store' | 'supplier';
  address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  contact_person?: string;
  contact_phone?: string;
  contact_email?: string;
  is_active: boolean;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
}

interface WarehouseForm {
  name: string;
  code: string;
  type: 'warehouse' | 'store' | 'supplier';
  address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  contact_person: string;
  contact_phone: string;
  contact_email: string;
  is_active: boolean;
  is_default: boolean;
}

const Warehouses: React.FC = () => {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [formData, setFormData] = useState<WarehouseForm>({
    name: '',
    code: '',
    type: 'warehouse',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'India',
    contact_person: '',
    contact_phone: '',
    contact_email: '',
    is_active: true,
    is_default: false,
  });

  // Fetch warehouses
  const { data: warehousesResponse, isLoading } = useQuery({
    queryKey: ['warehouses'],
    queryFn: shippingApi.getWarehouses,
  });

  // Backend returns { success: true, data: { data: [...], ... } } (paginated)
  const warehouses = (warehousesResponse as any)?.data?.data || (warehousesResponse as any)?.data || [];

  // Create mutation
  const createMutation = useMutation({
    mutationFn: shippingApi.createWarehouse,
    onSuccess: () => {
      toast.success('Warehouse created successfully');
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      handleCloseModal();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create warehouse');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: { id: number; warehouse: WarehouseForm }) =>
      shippingApi.updateWarehouse(data.id, data.warehouse),
    onSuccess: () => {
      toast.success('Warehouse updated successfully');
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      handleCloseModal();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update warehouse');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: shippingApi.deleteWarehouse,
    onSuccess: () => {
      toast.success('Warehouse deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete warehouse');
    },
  });

  // Set default mutation
  const setDefaultMutation = useMutation({
    mutationFn: shippingApi.setDefaultWarehouse,
    onSuccess: () => {
      toast.success('Default warehouse updated successfully');
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to set default warehouse');
    },
  });

  const handleOpenModal = (warehouse?: Warehouse) => {
    if (warehouse) {
      setEditingWarehouse(warehouse);
      setFormData({
        name: warehouse.name,
        code: warehouse.code,
        type: warehouse.type,
        address: warehouse.address,
        city: warehouse.city,
        state: warehouse.state,
        postal_code: warehouse.postal_code,
        country: warehouse.country,
        contact_person: warehouse.contact_person || '',
        contact_phone: warehouse.contact_phone || '',
        contact_email: warehouse.contact_email || '',
        is_active: warehouse.is_active,
        is_default: warehouse.is_default,
      });
    } else {
      setEditingWarehouse(null);
      setFormData({
        name: '',
        code: '',
        type: 'warehouse',
        address: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'India',
        contact_person: '',
        contact_phone: '',
        contact_email: '',
        is_active: true,
        is_default: false,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingWarehouse(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingWarehouse) {
      updateMutation.mutate({ id: editingWarehouse.id, warehouse: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this warehouse?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSetDefault = (id: number) => {
    setDefaultMutation.mutate(id);
  };

  const warehouseTypes = [
    { value: 'warehouse', label: 'Warehouse' },
    { value: 'store', label: 'Store' },
    { value: 'supplier', label: 'Supplier' },
  ];

  if (isLoading) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Warehouses</h1>
          <p className="text-sm text-gray-600">Manage pickup locations and shipping origins</p>
        </div>
        <Button
          onClick={() => handleOpenModal()}
          className="w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Warehouse
        </Button>
      </div>

      {/* Warehouses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {warehouses.map((warehouse: Warehouse) => (
          <Card
            key={warehouse.id}
            className={`relative ${
              warehouse.is_default ? 'border-primary-500 ring-2 ring-primary-100' : ''
            }`}
          >
            {/* Default Badge */}
            {warehouse.is_default && (
              <div className="absolute -top-2 -right-2 z-10">
                <StatusBadge status="info" size="sm">
                  <Star className="h-3 w-3 mr-1" />
                  Default
                </StatusBadge>
              </div>
            )}

            <CardContent className="p-4 sm:p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mr-3">
                    <Building className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">{warehouse.name}</h3>
                    <p className="text-sm text-gray-500">{warehouse.code}</p>
                  </div>
                </div>
                <StatusBadge status={warehouse.is_active ? 'active' : 'inactive'} size="sm" />
              </div>

            {/* Address */}
            <div className="mb-4">
              <div className="flex items-start">
                <MapPin className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                <div className="text-sm text-gray-600">
                  <p>{warehouse.address}</p>
                  <p>{warehouse.city}, {warehouse.state} {warehouse.postal_code}</p>
                  <p>{warehouse.country}</p>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            {(warehouse.contact_person || warehouse.contact_phone || warehouse.contact_email) && (
              <div className="mb-4 space-y-1">
                {warehouse.contact_person && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Contact:</span> {warehouse.contact_person}
                  </p>
                )}
                {warehouse.contact_phone && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="h-3 w-3 mr-1" />
                    {warehouse.contact_phone}
                  </div>
                )}
                {warehouse.contact_email && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="h-3 w-3 mr-1" />
                    {warehouse.contact_email}
                  </div>
                )}
              </div>
            )}

            {/* Type */}
            <div className="mb-4">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                {warehouse.type}
              </span>
            </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenModal(warehouse)}
                    className="p-1.5"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(warehouse.id)}
                    disabled={warehouse.is_default}
                    className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {!warehouse.is_default && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSetDefault(warehouse.id)}
                    loading={setDefaultMutation.isPending}
                  >
                    <StarOff className="h-3 w-3 mr-1" />
                    Set Default
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {warehouses.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No warehouses found</h3>
            <p className="text-gray-600 mb-4">Get started by adding your first warehouse location.</p>
            <Button onClick={() => handleOpenModal()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Warehouse
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-30" onClick={handleCloseModal} />
            <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingWarehouse ? 'Edit Warehouse' : 'Add Warehouse'}
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Warehouse Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Code *
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="WH001"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    {warehouseTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address *
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State *
                    </label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pincode *
                    </label>
                    <input
                      type="text"
                      value={formData.postal_code}
                      onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      maxLength={6}
                      pattern="[0-9]{6}"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country *
                  </label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                {/* Contact Info */}
                <div className="border-t pt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Contact Information</h4>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contact Person
                      </label>
                      <input
                        type="text"
                        value={formData.contact_person}
                        onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Contact Phone
                        </label>
                        <input
                          type="tel"
                          value={formData.contact_phone}
                          onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Contact Email
                        </label>
                        <input
                          type="email"
                          value={formData.contact_email}
                          onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Options */}
                <div className="border-t pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="is_active"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                        Active
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="is_default"
                        checked={formData.is_default}
                        onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="is_default" className="ml-2 block text-sm text-gray-700">
                        Set as default pickup location
                      </label>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row sm:justify-end gap-2 pt-6 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseModal}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    loading={createMutation.isPending || updateMutation.isPending}
                    className="w-full sm:w-auto"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {editingWarehouse ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Warehouses;