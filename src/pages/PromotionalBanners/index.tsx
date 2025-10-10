import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { api } from '../../api/axios';
import toast from 'react-hot-toast';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  GripVertical,
  Save,
  X,
  Truck,
  Shield,
  Headphones,
  Package,
  Award,
  Clock,
} from 'lucide-react';

interface PromotionalBanner {
  id: number;
  title: string;
  description?: string;
  icon: string;
  icon_color: string;
  background_color?: string;
  link_url?: string;
  link_text?: string;
  is_active: boolean;
  order: number;
  created_at: string;
  updated_at: string;
}

// Sortable Banner Item Component
function SortableBanner({ banner, onEdit, onToggle, onDelete }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: banner.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getIconComponent = (iconName: string) => {
    const icons: Record<string, any> = {
      truck: Truck,
      shield: Shield,
      headphones: Headphones,
      package: Package,
      award: Award,
      clock: Clock,
    };
    return icons[iconName] || Package;
  };

  const IconComponent = getIconComponent(banner.icon);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-lg border border-gray-200 p-4 ${isDragging ? 'shadow-lg' : 'shadow-sm'}`}
    >
      <div className="flex items-center gap-4">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
        >
          <GripVertical className="h-5 w-5" />
        </button>

        <div
          className="p-3 rounded-lg flex-shrink-0"
          style={{ backgroundColor: banner.background_color || '#F3F4F6', color: banner.icon_color }}
        >
          <IconComponent className="h-6 w-6" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{banner.title}</h3>
          {banner.description && (
            <p className="text-sm text-gray-600 truncate">{banner.description}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggle(banner)}
            className={`p-2 rounded-lg ${
              banner.is_active
                ? 'bg-green-100 text-green-600 hover:bg-green-200'
                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
            }`}
            title={banner.is_active ? 'Active' : 'Inactive'}
          >
            {banner.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </button>

          <button
            onClick={() => onEdit(banner)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
            title="Edit"
          >
            <Edit className="h-4 w-4" />
          </button>

          <button
            onClick={() => onDelete(banner)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PromotionalBanners() {
  const [banners, setBanners] = useState<PromotionalBanner[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<PromotionalBanner | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    icon: 'package',
    icon_color: '#3B82F6',
    background_color: '#F3F4F6',
    link_url: '',
    link_text: '',
    is_active: true,
  });

  const queryClient = useQueryClient();

  // Setup drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch banners
  const { isLoading } = useQuery({
    queryKey: ['promotional-banners'],
    queryFn: async () => {
      const response = await api.get('/promotional-banners');
      setBanners(response.data.data || []);
      return response.data;
    },
  });

  // Update order mutation
  const updateOrderMutation = useMutation({
    mutationFn: async (orderedBanners: PromotionalBanner[]) => {
      const bannersWithOrder = orderedBanners.map((banner, index) => ({
        id: banner.id,
        order: index + 1,
      }));
      await api.post('/promotional-banners/update-order', {
        banners: bannersWithOrder,
      });
    },
    onSuccess: () => {
      toast.success('Banner order updated');
      queryClient.invalidateQueries({ queryKey: ['promotional-banners'] });
    },
    onError: () => {
      toast.error('Failed to update banner order');
    },
  });

  // Toggle banner mutation
  const toggleMutation = useMutation({
    mutationFn: async (banner: PromotionalBanner) => {
      await api.post(`/promotional-banners/${banner.id}/toggle`);
    },
    onSuccess: () => {
      toast.success('Banner status updated');
      queryClient.invalidateQueries({ queryKey: ['promotional-banners'] });
    },
    onError: () => {
      toast.error('Failed to toggle banner');
    },
  });

  // Save mutation (create/update)
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingBanner) {
        await api.put(`/promotional-banners/${editingBanner.id}`, data);
      } else {
        await api.post('/promotional-banners', data);
      }
    },
    onSuccess: () => {
      toast.success(editingBanner ? 'Banner updated successfully' : 'Banner created successfully');
      queryClient.invalidateQueries({ queryKey: ['promotional-banners'] });
      handleCloseModal();
    },
    onError: () => {
      toast.error('Failed to save banner');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/promotional-banners/${id}`);
    },
    onSuccess: () => {
      toast.success('Banner deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['promotional-banners'] });
    },
    onError: () => {
      toast.error('Failed to delete banner');
    },
  });

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = banners.findIndex((b) => b.id === active.id);
      const newIndex = banners.findIndex((b) => b.id === over.id);

      const newBanners = arrayMove(banners, oldIndex, newIndex);
      setBanners(newBanners);
      updateOrderMutation.mutate(newBanners);
    }
  };

  const handleEdit = (banner: PromotionalBanner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      description: banner.description || '',
      icon: banner.icon,
      icon_color: banner.icon_color,
      background_color: banner.background_color || '#F3F4F6',
      link_url: banner.link_url || '',
      link_text: banner.link_text || '',
      is_active: banner.is_active,
    });
    setShowModal(true);
  };

  const handleDelete = (banner: PromotionalBanner) => {
    if (window.confirm(`Are you sure you want to delete "${banner.title}"?`)) {
      deleteMutation.mutate(banner.id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingBanner(null);
    setFormData({
      title: '',
      description: '',
      icon: 'package',
      icon_color: '#3B82F6',
      background_color: '#F3F4F6',
      link_url: '',
      link_text: '',
      is_active: true,
    });
  };

  const iconOptions = [
    { value: 'truck', label: 'Truck (Shipping)' },
    { value: 'shield', label: 'Shield (Security)' },
    { value: 'headphones', label: 'Headphones (Support)' },
    { value: 'package', label: 'Package (Delivery)' },
    { value: 'award', label: 'Award (Quality)' },
    { value: 'clock', label: 'Clock (Time)' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Promotional Banners</h1>
          <p className="text-gray-600 mt-1">Manage feature banners displayed on your homepage</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add Banner
        </button>
      </div>

      {/* Drag and Drop List */}
      <div className="bg-gray-50 rounded-lg p-6">
        {banners.length > 0 ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={banners.map(b => b.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {banners.map((banner) => (
                  <SortableBanner
                    key={banner.id}
                    banner={banner}
                    onEdit={handleEdit}
                    onToggle={toggleMutation.mutate}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No promotional banners found. Create one to get started!</p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {editingBanner ? 'Edit Promotional Banner' : 'Create Promotional Banner'}
              </h3>
              <button onClick={handleCloseModal} className="p-1 hover:bg-gray-100 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Free Shipping"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="On orders over $50"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Icon <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  >
                    {iconOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Icon Color</label>
                  <input
                    type="color"
                    value={formData.icon_color}
                    onChange={(e) => setFormData({ ...formData, icon_color: e.target.value })}
                    className="w-full h-10 px-1 py-1 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Background Color
                  </label>
                  <input
                    type="color"
                    value={formData.background_color}
                    onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                    className="w-full h-10 px-1 py-1 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Link URL</label>
                  <input
                    type="text"
                    value={formData.link_url}
                    onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="/shipping-info"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Link Text</label>
                  <input
                    type="text"
                    value={formData.link_text}
                    onChange={(e) => setFormData({ ...formData, link_text: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Learn More"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                  Active
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {saveMutation.isPending ? 'Saving...' : editingBanner ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

