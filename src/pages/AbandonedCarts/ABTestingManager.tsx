import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Zap,
  TrendingUp,
  CheckCircle,
  Trophy,
  Loader,
  Plus,
  BarChart3,
  LineChart,
  Target,
  Search,
  Eye,
} from 'lucide-react';
import { api } from '../../api/axios';
import toast from 'react-hot-toast';
import {
  BarChart,
  Bar,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface Variant {
  id: number;
  variant_group_id: string;
  email_type: string;
  subject_line: string;
  discount_percentage: number;
  send_time_offset: number;
  weight: number;
  status: 'active' | 'inactive' | 'winner';
  total_sent: number;
  clicked: number;
  recovered: number;
  total_revenue: number;
  average_cart_value: number;
  click_rate: number;
  recovery_rate: number;
  roi: number;
  confidence_level: number | null;
  is_statistically_significant: boolean;
}

interface TestGroup {
  id: string;
  email_type: string;
  variants: Variant[];
  created_at: string;
}

const ABTestingManager: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedGroup, setSelectedGroup] = useState<TestGroup | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch test groups
  const { data: groupsData, isLoading } = useQuery({
    queryKey: ['ab-testing-groups'],
    queryFn: async () => {
      const response = await api.get('/ab-testing/groups');
      return response.data;
    },
  });

  // Fetch group details with variants
  const { data: groupDetailsData } = useQuery({
    queryKey: ['ab-testing-group', selectedGroup?.id],
    queryFn: async () => {
      if (!selectedGroup) return null;
      const response = await api.get(`/ab-testing/groups/${selectedGroup.id}`);
      return response.data;
    },
    enabled: !!selectedGroup,
  });

  // Fetch performance data
  const { data: performanceData } = useQuery({
    queryKey: ['ab-testing-performance', selectedGroup?.id],
    queryFn: async () => {
      if (!selectedGroup) return null;
      const response = await api.get(`/ab-testing/groups/${selectedGroup.id}/recommendations`);
      return response.data;
    },
    enabled: !!selectedGroup,
  });

  const selectWinnerMutation = useMutation({
    mutationFn: async (variantId: number) => {
      const response = await api.post(`/ab-testing/variants/${variantId}/winner`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Winner selected successfully');
      queryClient.invalidateQueries({ queryKey: ['ab-testing-group', selectedGroup?.id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to select winner');
    },
  });

  const groups: TestGroup[] = groupsData?.data || [];
  const variants: Variant[] = groupDetailsData?.data?.variants || [];
  const performance = performanceData?.data || {};

  const filteredGroups = groups.filter((group) =>
    group.email_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPerformanceColor = (rate: number) => {
    if (rate >= 70) return 'text-green-600';
    if (rate >= 50) return 'text-blue-600';
    if (rate >= 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'winner':
        return 'bg-gold-100 text-gold-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">A/B Testing Manager</h2>
          <p className="mt-1 text-sm text-gray-600">Optimize recovery emails with variant testing</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Test Groups List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">Test Groups</h3>
            </div>

            <div className="p-4 space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search groups..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader className="h-6 w-6 animate-spin text-blue-600" />
              </div>
            ) : (
              <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                {filteredGroups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => setSelectedGroup(group)}
                    className={`w-full text-left p-4 hover:bg-gray-50 transition ${
                      selectedGroup?.id === group.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                    }`}
                  >
                    <div className="font-medium text-gray-900">{group.email_type}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {group.variants.length} variant{group.variants.length !== 1 ? 's' : ''}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Details Panel */}
        <div className="lg:col-span-2 space-y-6">
          {selectedGroup ? (
            <>
              {/* Group Overview */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedGroup.email_type} Test
                  </h3>
                  <span className="text-xs text-gray-500">
                    Created {new Date(selectedGroup.created_at).toLocaleDateString()}
                  </span>
                </div>

                {/* Variants Comparison */}
                <div className="space-y-4">
                  {variants.map((variant) => (
                    <div
                      key={variant.id}
                      className={`p-4 rounded-lg border-2 ${
                        variant.status === 'winner'
                          ? 'border-yellow-300 bg-yellow-50'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium text-gray-900 text-sm">{variant.subject_line}</h4>
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getStatusBadge(
                                variant.status
                              )}`}
                            >
                              {variant.status === 'winner' && <Trophy className="h-3 w-3 mr-1" />}
                              {variant.status}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">
                            Discount: {variant.discount_percentage}% | Weight: {variant.weight}%
                          </p>
                        </div>
                        {variant.status === 'inactive' && (
                          <button
                            onClick={() => selectWinnerMutation.mutate(variant.id)}
                            className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Select Winner
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-5 gap-2 text-xs">
                        <div>
                          <span className="text-gray-500">Sent</span>
                          <p className="font-semibold text-gray-900">{variant.total_sent}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Clicks</span>
                          <p className={`font-semibold ${getPerformanceColor(variant.click_rate)}`}>
                            {variant.click_rate}%
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Recovery</span>
                          <p className={`font-semibold ${getPerformanceColor(variant.recovery_rate)}`}>
                            {variant.recovery_rate}%
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Revenue</span>
                          <p className="font-semibold text-gray-900">₹{variant.total_revenue}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">ROI</span>
                          <p className={`font-semibold ${getPerformanceColor(variant.roi)}`}>
                            {variant.roi}%
                          </p>
                        </div>
                      </div>

                      {variant.is_statistically_significant && (
                        <div className="mt-3 p-2 bg-green-50 rounded border border-green-200 text-xs text-green-700">
                          <CheckCircle className="h-3 w-3 inline mr-1" />
                          Statistically significant (confidence: {variant.confidence_level}%)
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Performance Chart */}
              {variants.length > 1 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Comparison</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={variants.map((v) => ({
                        name: v.subject_line.substring(0, 15) + '...',
                        'Click Rate': v.click_rate,
                        'Recovery Rate': v.recovery_rate,
                        'ROI': v.roi,
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Click Rate" fill="#3b82f6" />
                      <Bar dataKey="Recovery Rate" fill="#10b981" />
                      <Bar dataKey="ROI" fill="#f59e0b" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Recommendations */}
              {performance && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Target className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-blue-900">Recommendation</h4>
                      <p className="text-sm text-blue-700 mt-1">{performance.recommendation}</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900">No test selected</h3>
              <p className="text-gray-600 mt-1">Select a test group to view variant performance</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ABTestingManager;
