/**
 * UTM Performance Report
 * Shows UTM source/campaign performance with sortable table
 */

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency, formatPercent, formatNumber, daysAgoIso, toIsoDate } from '../../utils/format';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell
} from 'recharts';
import {
    TrendingUp,
    DollarSign,
    ShoppingCart,
    MousePointerClick,
    Search,
    Calendar,
    RefreshCw,
    ArrowUpDown,
    Filter,
    Download
} from 'lucide-react';
import { format } from 'date-fns';
import { api } from '../../api/axios';
import { LoadingSpinner, Card, CardHeader, CardTitle, CardContent, Badge } from '../../components';

// (type definitions moved below — see BackendUtmResponse)

interface DateRange {
    start: string;
    end: string;
}

// Sort field type
type SortField = 'utm_source' | 'utm_campaign' | 'sessions' | 'orders' | 'revenue' | 'conversion_rate';
type SortOrder = 'asc' | 'desc';

// Color palette for bar chart
const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16', '#f97316'];

// (formatters moved to ../../utils/format)

// Backend AnalyticsController::getUtmPerformance response:
//   { success, campaigns: [{utm_source, utm_campaign, sessions, orders,
//     revenue, conversion_rate}] }
// NB: backend `conversion_rate` is currently `orders / max(orders, 1) * 100`
// which is always 100% — display with a "— (backend bug)" caveat.
interface BackendUtmRow {
    utm_source: string;
    utm_campaign: string;
    sessions: number;
    orders: number;
    revenue: number;
    conversion_rate: number;
}

interface BackendUtmResponse {
    success: boolean;
    campaigns: BackendUtmRow[];
}

interface UtmMetrics {
    utm_source: string;
    utm_campaign: string;
    sessions: number;
    orders: number;
    revenue: number;
    conversion_rate: number;
}

// KPI Card Component
interface KPICardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, subtitle, icon: Icon, color, bgColor }) => (
    <div className="bg-white rounded-lg shadow p-5">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
                {subtitle && <p className="mt-1 text-xs text-gray-400">{subtitle}</p>}
            </div>
            <div className={`p-3 rounded-lg ${bgColor}`}>
                <Icon className={`h-6 w-6 ${color}`} />
            </div>
        </div>
    </div>
);

// Sortable Table Header
interface SortableHeaderProps {
    label: string;
    field: SortField;
    currentSort: SortField;
    sortOrder: SortOrder;
    onSort: (field: SortField) => void;
    align?: 'left' | 'right';
}

const SortableHeader: React.FC<SortableHeaderProps> = ({ label, field, currentSort, sortOrder, onSort, align = 'left' }) => (
    <th
        className={`px-4 py-3 text-${align} text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100`}
        onClick={() => onSort(field)}
    >
        <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : 'justify-start'}`}>
            {label}
            <ArrowUpDown className={`h-3 w-3 ${currentSort === field ? 'text-blue-500' : 'text-gray-400'}`} />
        </div>
    </th>
);

// Performance Table
interface PerformanceTableProps {
    data: UtmMetrics[];
    sortField: SortField;
    sortOrder: SortOrder;
    onSort: (field: SortField) => void;
    isLoading: boolean;
}

const PerformanceTable: React.FC<PerformanceTableProps> = ({ data, sortField, sortOrder, onSort, isLoading }) => {
    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (!data.length) {
        return (
            <div className="text-center py-12 text-gray-500">
                No UTM data available for the selected period.
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <SortableHeader label="UTM Source" field="utm_source" currentSort={sortField} sortOrder={sortOrder} onSort={onSort} />
                        {/* UTM Medium column removed — backend does not emit it. */}
                        <SortableHeader label="Campaign" field="utm_campaign" currentSort={sortField} sortOrder={sortOrder} onSort={onSort} />
                        <SortableHeader label="Sessions" field="sessions" currentSort={sortField} sortOrder={sortOrder} onSort={onSort} align="right" />
                        <SortableHeader label="Orders" field="orders" currentSort={sortField} sortOrder={sortOrder} onSort={onSort} align="right" />
                        <SortableHeader label="Revenue" field="revenue" currentSort={sortField} sortOrder={sortOrder} onSort={onSort} align="right" />
                        <SortableHeader label="Conv. Rate" field="conversion_rate" currentSort={sortField} sortOrder={sortOrder} onSort={onSort} align="right" />
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {data.map((row, index) => (
                        <tr key={`${row.utm_source}-${row.utm_campaign}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                    <Search className="h-4 w-4 text-gray-400" />
                                    <span className="text-sm font-medium text-gray-900">{row.utm_source || '-'}</span>
                                </div>
                            </td>
                            <td className="px-4 py-3">
                                <span className="text-sm text-gray-400">—</span>
                            </td>
                            <td className="px-4 py-3">
                                <span className="text-sm text-gray-700">{row.utm_campaign || '-'}</span>
                            </td>
                            <td className="px-4 py-3 text-right text-sm text-gray-700">
                                {formatNumber(row.sessions)}
                            </td>
                            <td className="px-4 py-3 text-right text-sm text-gray-700">
                                {formatNumber(row.orders)}
                            </td>
                            <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                                {formatCurrency(row.revenue)}
                            </td>
                            <td className="px-4 py-3 text-right">
                                <span className={`text-sm font-medium ${row.conversion_rate >= 5 ? 'text-green-600' :
                                    row.conversion_rate >= 2 ? 'text-yellow-600' : 'text-red-600'
                                    }`}>
                                    {formatPercent(row.conversion_rate)}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// Revenue by UTM Source Chart
interface SourceChartProps {
    data: UtmMetrics[];
    isLoading: boolean;
}

const SourceChart: React.FC<SourceChartProps> = ({ data, isLoading }) => {
    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (!data.length) {
        return (
            <div className="text-center py-12 text-gray-500">
                No UTM data available for the selected period.
            </div>
        );
    }

    // Aggregate by UTM source
    const sourceData = data.reduce((acc, row) => {
        const source = row.utm_source || 'Unknown';
        if (!acc[source]) {
            acc[source] = { sessions: 0, orders: 0, revenue: 0 };
        }
        acc[source].sessions += row.sessions;
        acc[source].orders += row.orders;
        acc[source].revenue += row.revenue;
        return acc;
    }, {} as Record<string, { sessions: number; orders: number; revenue: number }>);

    const chartData = Object.entries(sourceData)
        .map(([name, values]) => ({
            name: name.length > 15 ? name.substring(0, 15) + '...' : name,
            fullName: name,
            revenue: values.revenue,
            orders: values.orders,
            sessions: values.sessions,
            conversionRate: values.sessions > 0 ? (values.orders / values.sessions) * 100 : 0
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10); // Top 10

    return (
        <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                        dataKey="name"
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                    />
                    <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                        formatter={(value: number, name: string) => {
                            if (name === 'revenue') return [formatCurrency(value), 'Revenue'];
                            if (name === 'orders') return [value.toLocaleString(), 'Orders'];
                            if (name === 'sessions') return [value.toLocaleString(), 'Sessions'];
                            if (name === 'conversionRate') return [formatPercent(value), 'Conv. Rate'];
                            return [value, name];
                        }}
                        labelFormatter={(label, payload) => {
                            if (payload && payload[0]) {
                                return payload[0].payload.fullName || label;
                            }
                            return label;
                        }}
                    />
                    <Legend />
                    <Bar
                        dataKey="revenue"
                        name="Revenue"
                        fill="#3b82f6"
                        radius={[4, 4, 0, 0]}
                    >
                        {chartData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

// Search/Filter Component
interface SearchFilterProps {
    searchTerm: string;
    onSearchChange: (term: string) => void;
    selectedSource: string;
    onSourceChange: (source: string) => void;
    sources: string[];
}

const SearchFilter: React.FC<SearchFilterProps> = ({
    searchTerm,
    onSearchChange,
    selectedSource,
    onSourceChange,
    sources
}) => (
    <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px]">
            <input
                type="text"
                placeholder="Search by source or campaign..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg text-sm"
            />
        </div>
        <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
                value={selectedSource}
                onChange={(e) => onSourceChange(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm"
            >
                <option value="">All Sources</option>
                {sources.map(source => (
                    <option key={source} value={source}>{source || '(none)'}</option>
                ))}
            </select>
        </div>
    </div>
);

const UtmPerformance: React.FC = () => {
    // Date range state — local-time helpers.
    const [dateRange, setDateRange] = useState<DateRange>({
        start: daysAgoIso(30),
        end: toIsoDate(new Date()),
    });

    // Sort state
    const [sortField, setSortField] = useState<SortField>('revenue');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

    // Filter state
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSource, setSelectedSource] = useState('');

    // Quick date range options
    const quickRanges = [
        { label: '7 Days', days: 7 },
        { label: '30 Days', days: 30 },
        { label: '90 Days', days: 90 },
    ];

    const handleQuickRange = (days: number) => {
        setDateRange({
            start: daysAgoIso(days),
            end: toIsoDate(new Date()),
        });
    };

    // Handle sort
    const handleSort = (field: SortField) => {
        if (field === sortField) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('desc');
        }
    };

    // Fetch UTM performance data. Backend returns a flat `campaigns[]` array;
    // there is no `summary` block — we aggregate sessions/orders/revenue
    // client-side for the KPI cards.
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['utm-performance', dateRange],
        queryFn: async () => {
            const response = await api.get<BackendUtmResponse>('/analytics/utm-performance', {
                params: { start_date: dateRange.start, end_date: dateRange.end },
            });
            return response.data;
        },
    });

    // Get unique sources for the source filter dropdown.
    const uniqueSources = useMemo(() => {
        if (!data?.campaigns) return [];
        return Array.from(new Set(data.campaigns.map(row => row.utm_source).filter(Boolean)));
    }, [data]);

    // Derive summary metrics + the working dataset used by the table/chart.
    const rows: UtmMetrics[] = data?.campaigns ?? [];
    const totalSessions = rows.reduce((s, r) => s + (r.sessions ?? 0), 0);
    const totalOrdersUtm = rows.reduce((s, r) => s + (r.orders ?? 0), 0);
    const totalRevenueUtm = rows.reduce((s, r) => s + Number(r.revenue ?? 0), 0);

    // Filter and sort data
    const filteredAndSortedData = useMemo(() => {
        if (!data?.campaigns) return [];

        let filtered = [...data.campaigns];

        // Apply source filter
        if (selectedSource) {
            filtered = filtered.filter(row => row.utm_source === selectedSource);
        }

        // Apply search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(row =>
                (row.utm_source?.toLowerCase().includes(term)) ||
                (row.utm_campaign?.toLowerCase().includes(term)) ||
                (row.utm_campaign?.toLowerCase().includes(term))
            );
        }

        // Sort
        filtered.sort((a, b) => {
            const aVal = a[sortField] ?? '';
            const bVal = b[sortField] ?? '';

            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
            }

            const aStr = String(aVal).toLowerCase();
            const bStr = String(bVal).toLowerCase();
            if (sortOrder === 'asc') {
                return aStr.localeCompare(bStr);
            }
            return bStr.localeCompare(aStr);
        });

        return filtered;
    }, [data, searchTerm, selectedSource, sortField, sortOrder]);

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">UTM Performance</h1>
                    <p className="text-gray-500 mt-1">Track UTM source and campaign performance</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => refetch()}
                        className="p-2 bg-white border rounded-lg hover:bg-gray-50 text-gray-600"
                        title="Refresh Data"
                    >
                        <RefreshCw className="h-5 w-5" />
                    </button>
                    <button
                        className="p-2 bg-white border rounded-lg hover:bg-gray-50 text-gray-600"
                        title="Export"
                    >
                        <Download className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Date Range Filter */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-600">Date Range:</span>
                        </div>

                        {/* Quick range buttons */}
                        <div className="flex gap-2">
                            {quickRanges.map(range => (
                                <button
                                    key={range.days}
                                    onClick={() => handleQuickRange(range.days)}
                                    className="px-3 py-1 text-sm border rounded hover:bg-gray-50 transition-colors"
                                >
                                    {range.label}
                                </button>
                            ))}
                        </div>

                        {/* Custom date inputs */}
                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                value={dateRange.start}
                                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                className="px-3 py-1 border rounded text-sm"
                            />
                            <span className="text-gray-400">to</span>
                            <input
                                type="date"
                                value={dateRange.end}
                                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                className="px-3 py-1 border rounded text-sm"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                    title="Total Sessions"
                    value={formatNumber(totalSessions)}
                    subtitle="Tracked sessions"
                    icon={MousePointerClick}
                    color="text-blue-600"
                    bgColor="bg-blue-100"
                />
                <KPICard
                    title="Total Orders"
                    value={formatNumber(totalOrdersUtm)}
                    subtitle="From UTM traffic"
                    icon={ShoppingCart}
                    color="text-green-600"
                    bgColor="bg-green-100"
                />
                <KPICard
                    title="UTM Revenue"
                    value={formatCurrency(totalRevenueUtm)}
                    subtitle="Attributed revenue"
                    icon={DollarSign}
                    color="text-purple-600"
                    bgColor="bg-purple-100"
                />
                <KPICard
                    title="Avg Conv. Rate"
                    /* backend conversion_rate is a known-bug constant — show "—" */
                    value={'—'}
                    subtitle="backend metric unreliable"
                    icon={TrendingUp}
                    color="text-amber-600"
                    bgColor="bg-amber-100"
                />
            </div>

            {/* Revenue by UTM Source Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Revenue by UTM Source</CardTitle>
                </CardHeader>
                <CardContent>
                    <SourceChart data={rows} isLoading={isLoading} />
                </CardContent>
            </Card>

            {/* Search and Filter */}
            <Card>
                <CardContent className="p-4">
                    <SearchFilter
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                        selectedSource={selectedSource}
                        onSourceChange={setSelectedSource}
                        sources={uniqueSources}
                    />
                </CardContent>
            </Card>

            {/* Performance Table */}
            <Card>
                <CardHeader>
                    <CardTitle>UTM Performance Details</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <PerformanceTable
                        data={filteredAndSortedData}
                        sortField={sortField}
                        sortOrder={sortOrder}
                        onSort={handleSort}
                        isLoading={isLoading}
                    />
                </CardContent>
            </Card>
        </div>
    );
};

export default UtmPerformance;