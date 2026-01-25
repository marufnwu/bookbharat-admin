import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { packagingApi } from '../../api';
import { Table, Button, Badge } from '../../components';
import { useNotificationStore } from '../../store/notificationStore';
import { PackagingFormModal } from './PackagingFormModal';

const PackagingList: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOption, setEditingOption] = useState<any | null>(null);

  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotificationStore();

  // Queries
  const { data: packagingResponse, isLoading } = useQuery({
    queryKey: ['packaging-options'],
    queryFn: () => packagingApi.getAll(),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: packagingApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packaging-options'] });
      showSuccess('Packaging option created');
      setIsModalOpen(false);
    },
    onError: (err: any) => showError('Failed to create', err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => packagingApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packaging-options'] });
      showSuccess('Packaging option updated');
      setIsModalOpen(false);
      setEditingOption(null);
    },
    onError: (err: any) => showError('Failed to update', err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: packagingApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packaging-options'] });
      showSuccess('Packaging option deleted');
    },
    onError: (err: any) => showError('Failed to delete', err.message),
  });

  const handleEdit = (option: any) => {
    setEditingOption(option);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Delete this packaging option?')) {
        deleteMutation.mutate(id);
    }
  };

  const handleFormSubmit = async (data: any) => {
    if (editingOption) {
      await updateMutation.mutateAsync({ id: editingOption.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const columns = [
    {
       key: 'icon_url',
       title: 'Icon',
       render: (val: string) => val ? <img src={val} alt="icon" className="w-8 h-8 object-contain" /> : <span className="text-gray-400">-</span>
    },
    {
      key: 'name',
      title: 'Name',
      sortable: true,
      render: (val: string, record: any) => (
             <div>
                <div className="font-medium text-gray-900">{val}</div>
                <div className="text-xs text-gray-500">{record.code}</div>
             </div>
      )
    },
    {
      key: 'price',
      title: 'Price',
      sortable: true,
      render: (val: number) => <span className="font-semibold">₹{val}</span>
    },
    {
      key: 'is_active',
      title: 'Status',
      render: (val: boolean) => val ? <Badge variant="success">Active</Badge> : <Badge variant="warning">Inactive</Badge>
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_: any, record: any) => (
        <div className="flex items-center gap-2">
           <Button variant="ghost" size="sm" onClick={() => handleEdit(record)}>
             <PencilIcon className="w-4 h-4 text-blue-600" />
           </Button>
           <Button variant="ghost" size="sm" onClick={() => handleDelete(record.id)}>
             <TrashIcon className="w-4 h-4 text-red-600" />
           </Button>
        </div>
      )
    }
  ];

  const data = packagingResponse?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-2xl font-semibold text-gray-900">Packaging Options</h1>
           <p className="mt-1 text-sm text-gray-600">Manage order packaging types</p>
        </div>
        <Button onClick={() => { setEditingOption(null); setIsModalOpen(true); }}>
          <PlusIcon className="w-4 h-4 mr-2" />
          Add Option
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow">
         <Table 
            data={data}
            columns={columns}
            loading={isLoading}
            pagination={{ 
              current: 1, 
              total: data.length, 
              pageSize: 100, 
              onChange: () => {} 
            }}
         />
      </div>

      {isModalOpen && (
        <PackagingFormModal
           initialData={editingOption}
           onClose={() => setIsModalOpen(false)}
           onSubmit={handleFormSubmit}
        />
      )}
    </div>
  );
};

export default PackagingList;
