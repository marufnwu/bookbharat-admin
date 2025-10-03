import React, { useState, useEffect } from 'react';
import {
  Navigation,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  ChevronRight,
  Home,
  Menu,
  Layers
} from 'lucide-react';
import { api } from '../../api/axios';
import toast from 'react-hot-toast';

interface MenuItem {
  id: string;
  label: string;
  href: string;
  icon?: string;
  order?: number;
  children?: MenuItem[];
}

interface NavigationConfig {
  header: MenuItem[];
  footer: {
    menu: {
      title: string;
      links: MenuItem[];
    }[];
  };
}

export default function NavigationMenu() {
  const [navigationConfig, setNavigationConfig] = useState<NavigationConfig>({
    header: [],
    footer: { menu: [] }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingHeader, setEditingHeader] = useState(false);
  const [editingFooter, setEditingFooter] = useState(false);
  const [headerMenuItems, setHeaderMenuItems] = useState<MenuItem[]>([]);
  const [footerSections, setFooterSections] = useState<{ title: string; links: MenuItem[] }[]>([]);

  // Fetch navigation configuration
  const fetchNavigationConfig = async () => {
    try {
      setLoading(true);
      const response = await api.get('/configuration/navigation-config');
      const config = response.data.data;

      setNavigationConfig(config);
      setHeaderMenuItems(config.header || []);
      setFooterSections(config.footer?.menu || []);
    } catch (error) {
      console.error('Error fetching navigation config:', error);
      toast.error('Failed to load navigation configuration');

      // Set defaults on error
      setHeaderMenuItems([
        { id: '1', label: 'Home', href: '/' },
        { id: '2', label: 'All Books', href: '/products' },
        { id: '3', label: 'Categories', href: '/categories' },
        { id: '4', label: 'New Arrivals', href: '/products?sort=newest' },
        { id: '5', label: 'About', href: '/about' },
        { id: '6', label: 'Contact', href: '/contact' }
      ]);

      setFooterSections([
        {
          title: 'Shop',
          links: [
            { id: '1', label: 'All Books', href: '/products' },
            { id: '2', label: 'New Arrivals', href: '/products?sort=newest' },
            { id: '3', label: 'Bestsellers', href: '/products?sort=bestselling' },
            { id: '4', label: 'Categories', href: '/categories' },
          ]
        },
        {
          title: 'Customer Service',
          links: [
            { id: '1', label: 'Contact Us', href: '/contact' },
            { id: '2', label: 'Track Order', href: '/orders' },
            { id: '3', label: 'Returns & Refunds', href: '/returns' },
            { id: '4', label: 'Shipping Info', href: '/shipping' },
          ]
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNavigationConfig();
  }, []);

  // Save navigation configuration
  const handleSave = async (type: 'header' | 'footer') => {
    try {
      setSaving(true);

      const updatedConfig = {
        ...navigationConfig,
        header: type === 'header' ? headerMenuItems : navigationConfig.header,
        footer: type === 'footer' ? { menu: footerSections } : navigationConfig.footer
      };

      await api.put('/configuration/navigation-config', updatedConfig);

      setNavigationConfig(updatedConfig);

      if (type === 'header') {
        setEditingHeader(false);
      } else {
        setEditingFooter(false);
      }

      toast.success(`${type === 'header' ? 'Header' : 'Footer'} navigation saved successfully`);
    } catch (error) {
      console.error('Error saving navigation:', error);
      toast.error('Failed to save navigation configuration');
    } finally {
      setSaving(false);
    }
  };

  // Add menu item
  const addMenuItem = (type: 'header' | 'footer', sectionIndex?: number) => {
    const newItem: MenuItem = {
      id: Date.now().toString(),
      label: 'New Item',
      href: '/',
      order: 0
    };

    if (type === 'header') {
      setHeaderMenuItems([...headerMenuItems, newItem]);
    } else if (typeof sectionIndex === 'number') {
      const newSections = [...footerSections];
      newSections[sectionIndex].links.push(newItem);
      setFooterSections(newSections);
    }
  };

  // Add footer section
  const addFooterSection = () => {
    setFooterSections([
      ...footerSections,
      {
        title: 'New Section',
        links: []
      }
    ]);
  };

  // Update menu item
  const updateMenuItem = (type: 'header' | 'footer', itemId: string, updates: Partial<MenuItem>, sectionIndex?: number) => {
    if (type === 'header') {
      setHeaderMenuItems(
        headerMenuItems.map(item =>
          item.id === itemId ? { ...item, ...updates } : item
        )
      );
    } else if (typeof sectionIndex === 'number') {
      const newSections = [...footerSections];
      newSections[sectionIndex].links = newSections[sectionIndex].links.map(item =>
        item.id === itemId ? { ...item, ...updates } : item
      );
      setFooterSections(newSections);
    }
  };

  // Update footer section title
  const updateFooterSectionTitle = (index: number, title: string) => {
    const newSections = [...footerSections];
    newSections[index].title = title;
    setFooterSections(newSections);
  };

  // Delete menu item
  const deleteMenuItem = (type: 'header' | 'footer', itemId: string, sectionIndex?: number) => {
    if (type === 'header') {
      setHeaderMenuItems(headerMenuItems.filter(item => item.id !== itemId));
    } else if (typeof sectionIndex === 'number') {
      const newSections = [...footerSections];
      newSections[sectionIndex].links = newSections[sectionIndex].links.filter(item => item.id !== itemId);
      setFooterSections(newSections);
    }
  };

  // Delete footer section
  const deleteFooterSection = (index: number) => {
    setFooterSections(footerSections.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Navigation className="mr-2" />
          Navigation Menu Manager
        </h1>
        <p className="text-gray-600 mt-2">
          Configure header and footer navigation menus for your website
        </p>
      </div>

      {/* Header Navigation */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <Menu className="mr-2" />
            Header Navigation
          </h2>
          {!editingHeader ? (
            <button
              onClick={() => setEditingHeader(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <Edit2 className="inline mr-2" size={16} />
              Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => handleSave('header')}
                disabled={saving}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
              >
                <Save className="inline mr-2" size={16} />
                Save
              </button>
              <button
                onClick={() => {
                  setEditingHeader(false);
                  setHeaderMenuItems(navigationConfig.header);
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                <X className="inline mr-2" size={16} />
                Cancel
              </button>
            </div>
          )}
        </div>

        <div className="space-y-2">
          {headerMenuItems.map((item, index) => (
            <div key={item.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded">
              {editingHeader ? (
                <>
                  <input
                    type="text"
                    value={item.label}
                    onChange={(e) => updateMenuItem('header', item.id, { label: e.target.value })}
                    className="flex-1 px-3 py-1 border rounded"
                    placeholder="Label"
                  />
                  <input
                    type="text"
                    value={item.href}
                    onChange={(e) => updateMenuItem('header', item.id, { href: e.target.value })}
                    className="flex-1 px-3 py-1 border rounded"
                    placeholder="URL"
                  />
                  <button
                    onClick={() => deleteMenuItem('header', item.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 size={16} />
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 font-medium">{item.label}</span>
                  <span className="flex-1 text-gray-600">{item.href}</span>
                </>
              )}
            </div>
          ))}

          {editingHeader && (
            <button
              onClick={() => addMenuItem('header')}
              className="w-full p-3 border-2 border-dashed border-gray-300 rounded text-gray-600 hover:border-gray-400 hover:text-gray-700"
            >
              <Plus className="inline mr-2" size={16} />
              Add Menu Item
            </button>
          )}
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <Layers className="mr-2" />
            Footer Navigation
          </h2>
          {!editingFooter ? (
            <button
              onClick={() => setEditingFooter(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <Edit2 className="inline mr-2" size={16} />
              Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => handleSave('footer')}
                disabled={saving}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
              >
                <Save className="inline mr-2" size={16} />
                Save
              </button>
              <button
                onClick={() => {
                  setEditingFooter(false);
                  setFooterSections(navigationConfig.footer?.menu || []);
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                <X className="inline mr-2" size={16} />
                Cancel
              </button>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {footerSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="border rounded-lg p-4">
              {editingFooter ? (
                <div className="mb-3">
                  <input
                    type="text"
                    value={section.title}
                    onChange={(e) => updateFooterSectionTitle(sectionIndex, e.target.value)}
                    className="w-full px-3 py-1 border rounded font-semibold"
                    placeholder="Section Title"
                  />
                  <button
                    onClick={() => deleteFooterSection(sectionIndex)}
                    className="mt-2 text-red-600 text-sm hover:text-red-700"
                  >
                    Delete Section
                  </button>
                </div>
              ) : (
                <h3 className="font-semibold text-gray-800 mb-3">{section.title}</h3>
              )}

              <div className="space-y-2">
                {section.links.map((link) => (
                  <div key={link.id} className="text-sm">
                    {editingFooter ? (
                      <div className="flex gap-1">
                        <input
                          type="text"
                          value={link.label}
                          onChange={(e) => updateMenuItem('footer', link.id, { label: e.target.value }, sectionIndex)}
                          className="flex-1 px-2 py-1 border rounded text-xs"
                          placeholder="Label"
                        />
                        <input
                          type="text"
                          value={link.href}
                          onChange={(e) => updateMenuItem('footer', link.id, { href: e.target.value }, sectionIndex)}
                          className="flex-1 px-2 py-1 border rounded text-xs"
                          placeholder="URL"
                        />
                        <button
                          onClick={() => deleteMenuItem('footer', link.id, sectionIndex)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center text-gray-600">
                        <ChevronRight size={14} className="mr-1" />
                        {link.label}
                      </div>
                    )}
                  </div>
                ))}

                {editingFooter && (
                  <button
                    onClick={() => addMenuItem('footer', sectionIndex)}
                    className="w-full p-2 border border-dashed border-gray-300 rounded text-gray-600 text-xs hover:border-gray-400"
                  >
                    <Plus className="inline mr-1" size={12} />
                    Add Link
                  </button>
                )}
              </div>
            </div>
          ))}

          {editingFooter && (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-center">
              <button
                onClick={addFooterSection}
                className="text-gray-600 hover:text-gray-700"
              >
                <Plus className="block mx-auto mb-2" size={24} />
                Add Section
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}