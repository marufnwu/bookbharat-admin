import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/axios';
import toast from 'react-hot-toast';
import {
  FileText,
  Edit,
  Save,
  X,
  Globe,
  Mail,
  Phone,
  MapPin,
  Info,
  Shield,
  ScrollText,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Code,
  Type,
  Bold,
  Italic,
  Underline,
  List,
  Link,
  Image,
  AlignLeft,
  AlignCenter,
  AlignRight
} from 'lucide-react';

interface ContentPage {
  slug: string;
  title: string;
  content: string;
  meta_title: string;
  meta_description: string;
  is_published?: boolean;
  custom?: boolean;
}

const DEFAULT_PAGES = [
  { slug: 'about', label: 'About Us', icon: Info, custom: false },
  { slug: 'contact', label: 'Contact Us', icon: Phone, custom: false },
  { slug: 'privacy', label: 'Privacy Policy', icon: Shield, custom: false },
  { slug: 'terms', label: 'Terms of Service', icon: ScrollText, custom: false },
];

const ContentPages: React.FC = () => {
  const [selectedPage, setSelectedPage] = useState<string>('about');
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [pages, setPages] = useState(DEFAULT_PAGES);
  const [editorMode, setEditorMode] = useState<'visual' | 'html'>('visual');
  const editorRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState<ContentPage>({
    slug: '',
    title: '',
    content: '',
    meta_title: '',
    meta_description: '',
    is_published: true
  });

  const queryClient = useQueryClient();

  // Fetch all pages list
  const { data: pagesList } = useQuery({
    queryKey: ['content-pages-list'],
    queryFn: async () => {
      try {
        const response = await api.get('/content/pages');
        return response.data.data;
      } catch (error) {
        return [];
      }
    }
  });

  // Update pages list when data is fetched
  useEffect(() => {
    if (pagesList && Array.isArray(pagesList)) {
      const customPages = pagesList
        .filter((page: any) => !DEFAULT_PAGES.find(p => p.slug === page.slug))
        .map((page: any) => ({
          slug: page.slug,
          label: page.title || page.slug,
          icon: FileText,
          custom: true
        }));

      setPages([...DEFAULT_PAGES, ...customPages]);
    }
  }, [pagesList]);

  // Fetch page content
  const { data: pageData, isLoading } = useQuery({
    queryKey: ['content-page', selectedPage],
    queryFn: async () => {
      try {
        const response = await api.get(`/content/pages/${selectedPage}`);
        return response.data.data;
      } catch (error) {
        console.error('Error fetching page:', error);
        return null;
      }
    },
    enabled: !!selectedPage && !isCreating
  });

  // Update form data when page data is fetched
  useEffect(() => {
    if (pageData) {
      setFormData({
        slug: pageData.slug || selectedPage,
        title: pageData.title || '',
        content: pageData.content || '',
        meta_title: pageData.meta_title || '',
        meta_description: pageData.meta_description || '',
        is_published: pageData.is_published !== false
      });

      // Update editor content
      if (editorRef.current && editorMode === 'visual') {
        editorRef.current.innerHTML = pageData.content || '';
      }
    }
  }, [pageData, editorMode]);

  // Save page mutation
  const saveMutation = useMutation({
    mutationFn: async (data: ContentPage) => {
      if (isCreating) {
        return api.post('/content/pages', data);
      } else {
        return api.put(`/content/pages/${data.slug}`, data);
      }
    },
    onSuccess: () => {
      toast.success(isCreating ? 'Page created successfully' : 'Page updated successfully');
      queryClient.invalidateQueries({ queryKey: ['content-pages-list'] });
      queryClient.invalidateQueries({ queryKey: ['content-page', formData.slug] });
      setIsEditing(false);
      setIsCreating(false);
      if (isCreating) {
        setSelectedPage(formData.slug);
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to save page');
    }
  });

  // Delete page mutation
  const deleteMutation = useMutation({
    mutationFn: async (slug: string) => {
      return api.delete(`/content/pages/${slug}`);
    },
    onSuccess: () => {
      toast.success('Page deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['content-pages-list'] });
      setSelectedPage('about');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete page');
    }
  });

  // Editor command handler
  const execCommand = (command: string, value?: string) => {
    if (editorMode === 'visual') {
      document.execCommand(command, false, value);
      editorRef.current?.focus();
    }
  };

  // Handle save
  const handleSave = () => {
    let content = formData.content;

    if (editorMode === 'visual' && editorRef.current) {
      content = editorRef.current.innerHTML;
    }

    const dataToSave = {
      ...formData,
      content
    };

    saveMutation.mutate(dataToSave);
  };

  // Handle create new page
  const handleCreateNew = () => {
    setIsCreating(true);
    setIsEditing(true);
    setFormData({
      slug: '',
      title: '',
      content: '',
      meta_title: '',
      meta_description: '',
      is_published: true
    });
    if (editorRef.current) {
      editorRef.current.innerHTML = '';
    }
  };

  // Handle delete page
  const handleDelete = (slug: string) => {
    if (window.confirm('Are you sure you want to delete this page?')) {
      deleteMutation.mutate(slug);
    }
  };

  if (isLoading && !isCreating) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <FileText className="mr-2" />
            Content Pages
          </h1>
          <p className="text-gray-600 mt-2">
            Manage static content pages for your website
          </p>
        </div>
        <button
          onClick={handleCreateNew}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create New Page
        </button>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-64 bg-white rounded-lg shadow-md p-4">
          <h3 className="font-semibold text-gray-800 mb-4">Pages</h3>
          <div className="space-y-2">
            {pages.map((page) => {
              const Icon = page.icon;
              return (
                <div
                  key={page.slug}
                  className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                    selectedPage === page.slug && !isCreating
                      ? 'bg-blue-50 text-blue-600'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <button
                    onClick={() => {
                      setSelectedPage(page.slug);
                      setIsEditing(false);
                      setIsCreating(false);
                    }}
                    className="flex items-center flex-1"
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    <span className="text-sm">{page.label}</span>
                  </button>
                  {page.custom && (
                    <button
                      onClick={() => handleDelete(page.slug)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-white rounded-lg shadow-md p-6">
          {isCreating ? (
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Create New Page</h2>
              <p className="text-gray-600">Fill in the details for your new page</p>
            </div>
          ) : (
            <div className="mb-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  {pages.find(p => p.slug === selectedPage)?.label || selectedPage}
                </h2>
                <p className="text-gray-600">Slug: {selectedPage}</p>
              </div>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Page
                </button>
              )}
            </div>
          )}

          {isEditing || isCreating ? (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isCreating && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Page Slug (URL)
                    </label>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., shipping-policy"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      URL: /pages/{formData.slug || 'your-page-slug'}
                    </p>
                  </div>
                )}
                <div className={isCreating ? '' : 'md:col-span-2'}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Page Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter page title"
                  />
                </div>
              </div>

              {/* Editor Mode Toggle */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Page Content
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditorMode('visual')}
                      className={`px-3 py-1 text-sm rounded ${
                        editorMode === 'visual'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      <Type className="inline h-3 w-3 mr-1" />
                      Visual
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditorMode('html')}
                      className={`px-3 py-1 text-sm rounded ${
                        editorMode === 'html'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      <Code className="inline h-3 w-3 mr-1" />
                      HTML
                    </button>
                  </div>
                </div>

                {/* Editor Toolbar (Visual Mode) */}
                {editorMode === 'visual' && (
                  <div className="border border-gray-300 rounded-t-lg p-2 bg-gray-50 flex flex-wrap gap-1">
                    <button
                      type="button"
                      onClick={() => execCommand('bold')}
                      className="p-2 hover:bg-gray-200 rounded"
                      title="Bold"
                    >
                      <Bold className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => execCommand('italic')}
                      className="p-2 hover:bg-gray-200 rounded"
                      title="Italic"
                    >
                      <Italic className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => execCommand('underline')}
                      className="p-2 hover:bg-gray-200 rounded"
                      title="Underline"
                    >
                      <Underline className="h-4 w-4" />
                    </button>
                    <div className="w-px bg-gray-300 mx-1" />
                    <button
                      type="button"
                      onClick={() => execCommand('insertUnorderedList')}
                      className="p-2 hover:bg-gray-200 rounded"
                      title="Bullet List"
                    >
                      <List className="h-4 w-4" />
                    </button>
                    <div className="w-px bg-gray-300 mx-1" />
                    <button
                      type="button"
                      onClick={() => execCommand('justifyLeft')}
                      className="p-2 hover:bg-gray-200 rounded"
                      title="Align Left"
                    >
                      <AlignLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => execCommand('justifyCenter')}
                      className="p-2 hover:bg-gray-200 rounded"
                      title="Align Center"
                    >
                      <AlignCenter className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => execCommand('justifyRight')}
                      className="p-2 hover:bg-gray-200 rounded"
                      title="Align Right"
                    >
                      <AlignRight className="h-4 w-4" />
                    </button>
                    <div className="w-px bg-gray-300 mx-1" />
                    <button
                      type="button"
                      onClick={() => {
                        const url = prompt('Enter URL:');
                        if (url) execCommand('createLink', url);
                      }}
                      className="p-2 hover:bg-gray-200 rounded"
                      title="Insert Link"
                    >
                      <Link className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const url = prompt('Enter image URL:');
                        if (url) execCommand('insertImage', url);
                      }}
                      className="p-2 hover:bg-gray-200 rounded"
                      title="Insert Image"
                    >
                      <Image className="h-4 w-4" />
                    </button>
                    <div className="w-px bg-gray-300 mx-1" />
                    <select
                      onChange={(e) => execCommand('formatBlock', e.target.value)}
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                    >
                      <option value="p">Paragraph</option>
                      <option value="h1">Heading 1</option>
                      <option value="h2">Heading 2</option>
                      <option value="h3">Heading 3</option>
                      <option value="h4">Heading 4</option>
                    </select>
                  </div>
                )}

                {/* Editor Content */}
                {editorMode === 'visual' ? (
                  <div
                    ref={editorRef}
                    contentEditable
                    className="w-full min-h-[400px] px-4 py-3 border border-gray-300 rounded-b-lg focus:ring-blue-500 focus:border-blue-500 prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: formData.content }}
                    onInput={(e) => {
                      const target = e.target as HTMLDivElement;
                      setFormData({ ...formData, content: target.innerHTML });
                    }}
                  />
                ) : (
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full min-h-[400px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                    placeholder="Enter HTML content..."
                  />
                )}
              </div>

              {/* SEO Settings */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-800 mb-4">SEO Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meta Title
                    </label>
                    <input
                      type="text"
                      value={formData.meta_title}
                      onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter meta title for SEO"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meta Description
                    </label>
                    <textarea
                      value={formData.meta_description}
                      onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter meta description for SEO"
                    />
                  </div>
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.is_published}
                        onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                        className="mr-2 rounded"
                      />
                      <span className="text-sm font-medium text-gray-700">Publish this page</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setIsCreating(false);
                    if (pageData) {
                      setFormData({
                        slug: pageData.slug || selectedPage,
                        title: pageData.title || '',
                        content: pageData.content || '',
                        meta_title: pageData.meta_title || '',
                        meta_description: pageData.meta_description || '',
                        is_published: pageData.is_published !== false
                      });
                    }
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center"
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saveMutation.isPending || (isCreating && !formData.slug)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 flex items-center"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {saveMutation.isPending ? 'Saving...' : (isCreating ? 'Create Page' : 'Save Changes')}
                </button>
              </div>
            </div>
          ) : (
            <div className="prose max-w-none">
              <h1>{formData.title || 'No title'}</h1>
              <div dangerouslySetInnerHTML={{ __html: formData.content || '<p>No content available</p>' }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ContentPages;