import React, { useState } from 'react';
import { Search, Filter, Download, CheckCircle, Folder, FolderOpen } from 'lucide-react';
import { migrationApi } from '../../api/migration';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Badge from '../../components/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/Card';
import { Checkbox } from '../../components/Checkbox';
import { toast } from 'react-hot-toast';

interface LegacyCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  status: string;
  sort_order: number;
  is_featured: boolean;
  already_imported: boolean;
  v2_category_id?: number;
}

interface CategoryBrowserProps {
  onImportComplete?: (results: any) => void;
}

export const CategoryBrowser: React.FC<CategoryBrowserProps> = ({ onImportComplete }) => {
  const [categories, setCategories] = useState<LegacyCategory[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [summary, setSummary] = useState({
    total_found: 0,
    already_imported: 0,
    available_to_import: 0,
  });
  const [filters, setFilters] = useState({
    status: '',
    per_page: 50,
  });

  const fetchCategories = async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        search: searchTerm,
        page,
        ...filters,
      };

      const response = await migrationApi.searchLegacyCategories(params);

      if (response.success) {
        setCategories(response.data.data);
        setSummary(response.data.summary);
        setTotalPages(response.data.meta.last_page || 1);
        setCurrentPage(page);
      } else {
        toast.error('Failed to fetch categories');
      }
    } catch (error) {
      toast.error('Error fetching categories');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCategories(1);
  };

  const handleCategorySelect = (categoryId: number, checked: boolean) => {
    setSelectedCategories(prev =>
      checked
        ? [...prev, categoryId]
        : prev.filter(id => id !== categoryId)
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const availableCategories = categories
        .filter(c => !c.already_imported)
        .map(c => c.id);
      setSelectedCategories(availableCategories);
    } else {
      setSelectedCategories([]);
    }
  };

  const handleImport = async () => {
    if (selectedCategories.length === 0) {
      toast.error('Please select categories to import');
      return;
    }

    setLoading(true);
    try {
      const response = await migrationApi.importSelectedCategories({
        category_ids: selectedCategories,
        overwrite_existing: false,
      });

      if (response.success) {
        toast.success(
          `Imported ${response.data.imported} categories successfully. ` +
          `${response.data.skipped} skipped. ` +
          (response.data.failed > 0 ? `${response.data.failed} failed.` : '')
        );

        if (onImportComplete) {
          onImportComplete(response.data);
        }

        // Refresh the category list
        fetchCategories(currentPage);
        setSelectedCategories([]);
      } else {
        toast.error('Import failed');
      }
    } catch (error) {
      toast.error('Error importing categories');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variant = status === 'active' ? 'success' : 'secondary';
    return <Badge variant={variant}>{status}</Badge>;
  };

  const availableCategories = categories.filter(c => !c.already_imported);
  const allAvailableSelected = availableCategories.length > 0 &&
    selectedCategories.length === availableCategories.length;

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Folder className="w-5 h-5" />
            Browse Legacy Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-4">
              <Input
                placeholder="Search categories by name..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={loading}>
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </div>

            <div className="flex gap-4 flex-wrap">
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="px-3 py-2 border rounded-md"
              >
                <option value="">All Status</option>
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </select>

              <select
                value={filters.per_page}
                onChange={(e) => setFilters(prev => ({ ...prev, per_page: Number(e.target.value) }))}
                className="px-3 py-2 border rounded-md"
              >
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{summary.total_found}</div>
              <div className="text-sm text-gray-500">Total Found</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{summary.available_to_import}</div>
              <div className="text-sm text-gray-500">Available to Import</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{summary.already_imported}</div>
              <div className="text-sm text-gray-500">Already Imported</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      {availableCategories.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Checkbox
                  checked={allAvailableSelected}
                  onCheckedChange={handleSelectAll}
                />
                <span>Select all available ({availableCategories.length})</span>
                <span className="text-sm text-gray-500">
                  {selectedCategories.length} selected
                </span>
              </div>
              <Button
                onClick={handleImport}
                disabled={selectedCategories.length === 0 || loading}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Import Selected ({selectedCategories.length})
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Categories List */}
      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : categories.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No categories found. Try adjusting your search criteria.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className={`border rounded-lg p-4 ${
                    category.already_imported ? 'bg-gray-50 opacity-75' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedCategories.includes(category.id)}
                      disabled={category.already_imported}
                      onCheckedChange={(checked) => handleCategorySelect(category.id, checked)}
                      className="mt-1"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {category.already_imported ? (
                          <Folder className="w-4 h-4 text-gray-400" />
                        ) : (
                          <FolderOpen className="w-4 h-4 text-blue-500" />
                        )}
                        <h3 className="font-medium text-gray-900 truncate">
                          {category.name}
                        </h3>
                      </div>

                      <p className="text-sm text-gray-500 mb-2">
                        ID: {category.id}
                      </p>

                      {category.description && (
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {category.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusBadge(category.status)}
                          {category.is_featured && (
                            <Badge variant="outline" className="text-yellow-600">
                              Featured
                            </Badge>
                          )}
                        </div>

                        {category.already_imported && (
                          <Badge variant="outline" className="text-green-600">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Imported
                          </Badge>
                        )}
                      </div>

                      {category.sort_order > 0 && (
                        <p className="text-xs text-gray-400 mt-2">
                          Sort Order: {category.sort_order}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => fetchCategories(currentPage - 1)}
                disabled={currentPage === 1 || loading}
              >
                Previous
              </Button>
              <span className="flex items-center px-4">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => fetchCategories(currentPage + 1)}
                disabled={currentPage === totalPages || loading}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};