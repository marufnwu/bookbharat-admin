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
  Layout,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  GripVertical,
  Save,
  Settings,
  X,
  Check,
  Layers,
  Grid3X3,
  Image as ImageIcon,
  Mail,
  Star,
  Package,
  MessageSquare,
  Megaphone,
  Badge,
} from 'lucide-react';

interface HomepageSection {
  id: number;
  section_id: string;
  section_type: string;
  title: string;
  subtitle?: string;
  enabled: boolean;
  order: number;
  settings?: any;
  styles?: any;
}

interface SectionTemplate {
  section_type: string;
  title: string;
  description: string;
  icon: string;
  default_settings: any;
}

// Sortable Section Item Component
function SortableSection({ section, onEdit, onToggle, onDelete }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getIcon = (sectionType: string) => {
    const icons: Record<string, any> = {
      hero: Star,
      'featured-products': Package,
      categories: Grid3X3,
      'category-products': Layers,
      'promotional-banners': Badge,
      newsletter: Mail,
      testimonials: MessageSquare,
      'cta-banner': Megaphone,
    };
    return icons[sectionType] || Layout;
  };

  const Icon = getIcon(section.section_type);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-lg border-2 ${
        section.enabled ? 'border-gray-200' : 'border-gray-100 bg-gray-50'
      } p-4 mb-3 hover:border-blue-300 transition-all`}
    >
      <div className="flex items-center gap-3">
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600"
        >
          <GripVertical className="h-5 w-5" />
        </button>

        {/* Section Icon */}
        <div
          className={`p-2 rounded-lg ${
            section.enabled ? 'bg-blue-100' : 'bg-gray-100'
          }`}
        >
          <Icon
            className={`h-5 w-5 ${
              section.enabled ? 'text-blue-600' : 'text-gray-400'
            }`}
          />
        </div>

        {/* Section Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3
              className={`font-semibold ${
                section.enabled ? 'text-gray-900' : 'text-gray-400'
              }`}
            >
              {section.title}
            </h3>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                section.enabled
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {section.enabled ? 'Visible' : 'Hidden'}
            </span>
          </div>
          <p className="text-sm text-gray-500 truncate">{section.subtitle}</p>
          <p className="text-xs text-gray-400 mt-1">
            Type: {section.section_type} • Order: {section.order}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onToggle(section)}
            className={`p-2 rounded hover:bg-gray-100 ${
              section.enabled ? 'text-green-600' : 'text-gray-400'
            }`}
            title={section.enabled ? 'Hide section' : 'Show section'}
          >
            {section.enabled ? (
              <Eye className="h-4 w-4" />
            ) : (
              <EyeOff className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={() => onEdit(section)}
            className="p-2 text-blue-600 rounded hover:bg-blue-50"
            title="Edit section"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(section)}
            className="p-2 text-red-600 rounded hover:bg-red-50"
            title="Delete section"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HomepageLayout() {
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingSection, setEditingSection] = useState<HomepageSection | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    enabled: true,
    settings: {},
  });

  const queryClient = useQueryClient();

  // Setup drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch sections
  const { isLoading } = useQuery({
    queryKey: ['homepage-sections'],
    queryFn: async () => {
      const response = await api.get('/homepage-layout/sections');
      setSections(response.data.data || []);
      return response.data;
    },
  });

  // Fetch section templates
  const { data: templatesData } = useQuery({
    queryKey: ['section-templates'],
    queryFn: async () => {
      const response = await api.get('/homepage-layout/section-templates');
      return response.data;
    },
  });

  const templates: SectionTemplate[] = templatesData?.data || [];

  // Update section order mutation
  const updateOrderMutation = useMutation({
    mutationFn: async (orderedSections: HomepageSection[]) => {
      const sectionsWithOrder = orderedSections.map((section, index) => ({
        id: section.id,
        order: index + 1,
      }));
      await api.post('/homepage-layout/sections/update-order', {
        sections: sectionsWithOrder,
      });
    },
    onSuccess: () => {
      toast.success('Section order updated');
      queryClient.invalidateQueries({ queryKey: ['homepage-sections'] });
    },
    onError: () => {
      toast.error('Failed to update section order');
    },
  });

  // Toggle section mutation
  const toggleMutation = useMutation({
    mutationFn: async (section: HomepageSection) => {
      await api.post(`/homepage-layout/sections/${section.id}/toggle`);
    },
    onSuccess: () => {
      toast.success('Section visibility updated');
      queryClient.invalidateQueries({ queryKey: ['homepage-sections'] });
    },
    onError: () => {
      toast.error('Failed to toggle section');
    },
  });

  // Update section mutation
  const updateMutation = useMutation({
    mutationFn: async (data: { id: number; updates: any }) => {
      await api.put(`/homepage-layout/sections/${data.id}`, data.updates);
    },
    onSuccess: () => {
      toast.success('Section updated successfully');
      queryClient.invalidateQueries({ queryKey: ['homepage-sections'] });
      handleCloseModal();
    },
    onError: () => {
      toast.error('Failed to update section');
    },
  });

  // Create section from template
  const createMutation = useMutation({
    mutationFn: async (template: SectionTemplate) => {
      const sectionId = `${template.section_type}-${Date.now()}`;
      await api.post('/homepage-layout/sections', {
        section_id: sectionId,
        section_type: template.section_type,
        title: template.title,
        subtitle: template.description,
        enabled: true,
        order: sections.length + 1,
        settings: template.default_settings,
      });
    },
    onSuccess: () => {
      toast.success('Section added successfully');
      queryClient.invalidateQueries({ queryKey: ['homepage-sections'] });
      setShowTemplateModal(false);
    },
    onError: () => {
      toast.error('Failed to add section');
    },
  });

  // Delete section mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/homepage-layout/sections/${id}`);
    },
    onSuccess: () => {
      toast.success('Section deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['homepage-sections'] });
    },
    onError: () => {
      toast.error('Failed to delete section');
    },
  });

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sections.findIndex((s) => s.id === active.id);
      const newIndex = sections.findIndex((s) => s.id === over.id);

      const newSections = arrayMove(sections, oldIndex, newIndex);
      setSections(newSections);
      updateOrderMutation.mutate(newSections);
    }
  };

  const handleEdit = (section: HomepageSection) => {
    setEditingSection(section);
    setFormData({
      title: section.title,
      subtitle: section.subtitle || '',
      enabled: section.enabled,
      settings: section.settings || {},
    });
    setShowEditModal(true);
  };

  const handleDelete = (section: HomepageSection) => {
    if (window.confirm(`Are you sure you want to delete "${section.title}"?`)) {
      deleteMutation.mutate(section.id);
    }
  };

  const handleSave = () => {
    if (!editingSection) return;

    updateMutation.mutate({
      id: editingSection.id,
      updates: formData,
    });
  };

  const handleCloseModal = () => {
    setShowEditModal(false);
    setEditingSection(null);
    setFormData({
      title: '',
      subtitle: '',
      enabled: true,
      settings: {},
    });
  };

  const getTemplateIcon = (iconName: string) => {
    const icons: Record<string, any> = {
      star: Star,
      package: Package,
      grid: Grid3X3,
      layers: Layers,
      badge: Badge,
      mail: Mail,
      'message-square': MessageSquare,
      megaphone: Megaphone,
    };
    return icons[iconName] || Layout;
  };

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
          <h1 className="text-2xl font-bold text-gray-800">Homepage Layout</h1>
          <p className="text-gray-600 mt-1">
            Drag and drop to reorder sections, toggle visibility, or edit content
          </p>
        </div>
        <button
          onClick={() => setShowTemplateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add Section
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Sections</p>
              <p className="text-2xl font-bold text-gray-900">{sections.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Layout className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Visible Sections</p>
              <p className="text-2xl font-bold text-gray-900">
                {sections.filter((s) => s.enabled).length}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Eye className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Hidden Sections</p>
              <p className="text-2xl font-bold text-gray-900">
                {sections.filter((s) => !s.enabled).length}
              </p>
            </div>
            <div className="p-3 bg-gray-100 rounded-lg">
              <EyeOff className="h-6 w-6 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Drag and Drop Section List */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Section Order</h2>
        
        {sections.length === 0 ? (
          <div className="text-center py-12">
            <Layout className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No sections added yet</p>
            <p className="text-sm text-gray-400 mt-1">Click "Add Section" to get started</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sections.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              {sections.map((section) => (
                <SortableSection
                  key={section.id}
                  section={section}
                  onEdit={handleEdit}
                  onToggle={() => toggleMutation.mutate(section)}
                  onDelete={handleDelete}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Add Section Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add New Section</h3>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template) => {
                const Icon = getTemplateIcon(template.icon);
                return (
                  <button
                    key={template.section_type}
                    onClick={() => createMutation.mutate(template)}
                    disabled={createMutation.isPending}
                    className="text-left p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all disabled:opacity-50"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Icon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{template.title}</h4>
                        <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Edit Section Modal */}
      {showEditModal && editingSection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Edit Section</h3>
              <button onClick={handleCloseModal} className="p-1 hover:bg-gray-100 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Section Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subtitle (Optional)
                </label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={formData.enabled}
                  onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="enabled" className="ml-2 text-sm font-medium text-gray-700">
                  Section Visible
                </label>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Advanced settings (layout, limits, etc.) can be
                  configured through the API or will be added in future updates.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {updateMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
