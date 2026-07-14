/**
 * Revenue Attribution Report
 * Shows revenue breakdown by source, UTM source, and UTM campaign
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency, formatNumber, daysAgoIso, toIsoDate } from '../../utils/format';
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
    DollarSign,
    TrendingUp,
    ShoppingCart,
    Tag,
    Calendar,
    RefreshCw,
    Percent,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';
import { format } from 'date-fns';
import { api } from '../../api/axios';
import { LoadingSpinner, Card, CardHeader, CardTitle, CardContent, Badge } from '../../components';

// Backend AnalyticsController::getRevenue response:
//   { success, revenue_by_source: {<source>: {revenue, order_count, source, avg_order_value}},
//     total_revenue }
// The controller does NOT emit by_campaign or recovery_roi — those legacy
// fields from the old frontend type are impossible to compute from this
// payload alone, so the UI degrades gracefully (cards show "—").
interface BackendRevenueSourceRow {
    source: string;
    revenue: number;
    order_count: number;
    avg_order_value: number;
}

interface BackendRevenueResponse {
    success: boolean;
    revenue_by_source: Record<string, BackendRevenueSourceRow>;
    total_revenue: number;
}

interface RevenueBySource {
    source: string;
    source_label: string;
    revenue: number;
    orders: number;
    avg_order_value: number;
    percentage: number;
}

interface DateRange {
    start: string;
    end: string;
}

// Color palette for bar chart
const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16', '#f97316'];

// Format percentage
const formatPercent = (value: number | undefined | null, withSign: boolean = false): string => {
    if (value === undefined || value === null) return '0%';
    const sign = withSign && value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
};

// KPI Card Component
interface KPICardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
    trend?: 'up' | 'down' | null;
    trendValue?: string;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, subtitle, icon: Icon, color, bgColor, trend, trendValue }) => (
    <div className="bg-white rounded-lg shadow p-5">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
                {subtitle && <p className="mt-1 text-xs text-gray-400">{subtitle}</p>}
                {trend && trendValue && (
                    <div className={`mt-1 flex items-center gap-1 text-xs ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                        {trend === 'up' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        <span>{trendValue}</span>
                    </div>
                )}
            </div>
            <div className={`p-3 rounded-lg ${bgColor}`}>
                <Icon className={`h-6 w-6 ${color}`} />
            </div>
        </div>
    </div>
);

// Revenue by Source Bar Chart
interface SourceChartProps {
    data: RevenueBySource[];
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
                No revenue data available for the selected period.
            </div>
        );
    }

    const chartData = data.map(item => ({
        name: item.source_label || item.source,
        revenue: item.revenue,
        orders: item.orders,
        aov: item.avg_order_value
    }));

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
                            if (name === 'aov') return [formatCurrency(value), 'Avg Order Value'];
                            return [value, name];
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

// Source Breakdown Table
interface SourceTableProps {
    sources: RevenueBySource[];
    totalRevenue: number;
    isLoading: boolean;
}

const SourceTable: React.FC<SourceTableProps> = ({ sources, totalRevenue, isLoading }) => {
    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (!sources.length) {
        return (
            <div className="text-center py-12 text-gray-500">
                No source data available for the selected period.
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Source
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Orders
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Revenue
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Avg Order Value
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            % of Total
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {sources.map((source, index) => (
                        <tr key={source.source} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-4 py-3">
                                <div className="text-sm font-medium text-gray-900">
                                    {source.source_label || source.source}
                                </div>
                            </td>
                            <td className="px-4 py-3 text-right text-sm text-gray-700">
                                {source.orders.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                                {formatCurrency(source.revenue)}
                            </td>
                            <td className="px-4 py-3 text-right text-sm text-gray-700">
                                {formatCurrency(source.avg_order_value)}
                            </td>
                            <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <div className="w-16 bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-blue-500 h-2 rounded-full"
                                            style={{ width: `${source.percentage}%` }}
                                        />
                                    </div>
                                    <span className="text-sm font-medium text-gray-700 w-12">
                                        {formatPercent(source.percentage).replace('+', '')}
                                    </span>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {/* Total row */}
                    <tr className="bg-gray-100 font-semibold">
                        <td className="px-4 py-3 text-sm text-gray-900">Total</td>
                        <td className="px-4 py-3 text-right text-sm text-gray-900">
                            {sources.reduce((sum, s) => sum + s.orders, 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-900">
                            {formatCurrency(totalRevenue)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-900">
                            {formatCurrency(totalRevenue / sources.reduce((sum, s) => sum + s.orders, 0))}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-900">100%</td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

// Campaign-level + recovery_roi widgets removed — the live backend
// (AnalyticsController::getRevenue) does not emit `by_campaign` or
// `recovery_roi`. Once those land server-side, reintroduce the components
// here.

const RevenueAttribution: React.FC = () => {
    // Date range state — local-time helpers avoid the date-fns UTC off-by-one.
    const [dateRange, setDateRange] = useState<DateRange>({
        start: daysAgoIso(30),
        end: toIsoDate(new Date()),
    });

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

    // Fetch revenue attribution data. Backend returns
    // {revenue_by_source: {<source>: {...}}, total_revenue}.
    // by_source is an indexed map keyed by source name; we derive
    // percentages and a flat array for the chart/table client-side.
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['revenue-attribution', dateRange],
        queryFn: async () => {
            const response = await api.get<BackendRevenueResponse>('/analytics/revenue', {
                params: {
                    start_date: dateRange.start,
                    end_date: dateRange.end
                }
            });
            return response.data;
        }
    });

    // Transform backend's `revenue_by_source` map into a flat array that the
    // chart and table components can consume directly. Percentages are derived
    // against `total_revenue` from the same payload.
    const sourceRows: RevenueBySource[] = React.useMemo(() => {
        const map = data?.revenue_by_source ?? {};
        const total = Number(data?.total_revenue ?? 0);
        return Object.entries(map).map(([key, row]) => ({
            source: row.source ?? key,
            source_label: key,
            revenue: Number(row.revenue ?? 0),
            orders: row.order_count ?? 0,
            avg_order_value: Number(row.avg_order_value ?? 0),
            percentage: total > 0 ? (Number(row.revenue ?? 0) / total) * 100 : 0,
        }));
    }, [data]);

    const totalRevenue = Number(data?.total_revenue ?? 0);
    const totalOrders = sourceRows.reduce((s, r) => s + r.orders, 0);

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Revenue Attribution</h1>
                    <p className="text-gray-500 mt-1">Analyze revenue by source and campaign</p>
                </div>
                <button
                    onClick={() => refetch()}
                    className="p-2 bg-white border rounded-lg hover:bg-gray-50 text-gray-600"
                    title="Refresh Data"
                >
                    <RefreshCw className="h-5 w-5" />
                </button>
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
                    title="Total Revenue"
                    value={formatCurrency(totalRevenue)}
                    subtitle="In selected period"
                    icon={DollarSign}
                    color="text-green-600"
                    bgColor="bg-green-100"
                />
                <KPICard
                    title="Total Orders"
                    value={formatNumber(totalOrders)}
                    subtitle="Across all sources"
                    icon={ShoppingCart}
                    color="text-purple-600"
                    bgColor="bg-purple-100"
                />
                <KPICard
                    title="Sources Tracked"
                    value={formatNumber(sourceRows.length)}
                    subtitle="Different channels"
                    icon={Tag}
                    color="text-blue-600"
                    bgColor="bg-blue-100"
                />
            </div>

            {/* Revenue by Source Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Revenue by Source</CardTitle>
                </CardHeader>
                <CardContent>
                    <SourceChart data={sourceRows} isLoading={isLoading} />
                </CardContent>
            </Card>

            {/* Source Breakdown Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Revenue by Source</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <SourceTable
                        sources={sourceRows}
                        totalRevenue={totalRevenue}
                        isLoading={isLoading}
                    />
                </CardContent>
            </Card>

            {/* Campaign and recovery_ROI widgets removed — see comment above
                the component definition for why. */}
        </div>
    );
};

export default RevenueAttribution;