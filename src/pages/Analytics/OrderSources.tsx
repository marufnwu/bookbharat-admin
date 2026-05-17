/**
 * Order Sources Analytics
 * Shows breakdown of orders by source (direct, whatsapp_recovery, email_recovery, organic, utm)
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import {
    Globe,
    MessageCircle,
    Mail,
    Search,
    Tag,
    DollarSign,
    ShoppingCart,
    TrendingUp,
    Calendar,
    RefreshCw,
    Percent
} from 'lucide-react';
import { format } from 'date-fns';
import { api } from '../../api/axios';
import { LoadingSpinner, Card, CardHeader, CardTitle, CardContent, Badge } from '../../components';

// API response types
interface SourceMetrics {
    source: string;
    source_label: string;
    count: number;
    revenue: number;
    avg_order_value: number;
    percentage: number;
}

interface OrderSourcesResponse {
    data: SourceMetrics[];
    period: string;
    total_orders: number;
    total_revenue: number;
}

interface DateRange {
    start: string;
    end: string;
}

// Color palette for pie chart
const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16'];

// Source icon mapping
const getSourceIcon = (source: string): React.ElementType => {
    switch (source) {
        case 'direct':
            return Globe;
        case 'whatsapp_recovery':
        case 'cart_whatsapp':
        case 'order_whatsapp':
            return MessageCircle;
        case 'email_recovery':
        case 'cart_email':
        case 'order_email':
            return Mail;
        case 'organic':
            return Search;
        case 'utm':
            return Utm;
        default:
            return ShoppingCart;
    }
};

// Source badge color
const getSourceBadgeVariant = (source: string): string => {
    switch (source) {
        case 'direct':
            return 'blue';
        case 'whatsapp_recovery':
        case 'cart_whatsapp':
        case 'order_whatsapp':
            return 'green';
        case 'email_recovery':
        case 'cart_email':
        case 'order_email':
            return 'purple';
        case 'organic':
            return 'yellow';
        case 'utm':
            return 'amber';
        default:
            return 'gray';
    }
};

// Format currency
const formatCurrency = (value: number | undefined | null): string => {
    if (value === undefined || value === null) return '₹0';
    return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

// Format percentage
const formatPercent = (value: number | undefined | null): string => {
    if (value === undefined || value === null) return '0%';
    return `${value.toFixed(1)}%`;
};

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

// Pie Chart with custom label
interface PieChartProps {
    data: SourceMetrics[];
    isLoading: boolean;
}

const SourcePieChart: React.FC<PieChartProps> = ({ data, isLoading }) => {
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
                No source data available for the selected period.
            </div>
        );
    }

    const chartData = data.map(item => ({
        name: item.source_label || item.source,
        value: item.count,
        revenue: item.revenue
    }));

    return (
        <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        labelLine={false}
                    >
                        {chartData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip
                        formatter={(value: number, name: string, props: any) => {
                            const item = data.find(d => (d.source_label || d.source) === name);
                            return [
                                <div key={name} className="text-left">
                                    <div className="font-medium">{value} orders</div>
                                    <div className="text-sm text-gray-500">{formatCurrency(item?.revenue)} revenue</div>
                                </div>,
                                name
                            ];
                        }}
                    />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

// Bar Chart for revenue comparison
interface RevenueBarChartProps {
    data: SourceMetrics[];
    isLoading: boolean;
}

const RevenueBarChart: React.FC<RevenueBarChartProps> = ({ data, isLoading }) => {
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
        orders: item.count,
        revenue: item.revenue,
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
                        yAxisId="left"
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                    />
                    <YAxis
                        yAxisId="right"
                        orientation="right"
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value}`}
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
                    <Bar yAxisId="left" dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="right" dataKey="aov" name="Avg Order Value" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

// Sources Table
interface SourcesTableProps {
    sources: SourceMetrics[];
    totalOrders: number;
    totalRevenue: number;
    isLoading: boolean;
}

const SourcesTable: React.FC<SourcesTableProps> = ({ sources, totalOrders, totalRevenue, isLoading }) => {
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
                    {sources.map((source, index) => {
                        const Icon = getSourceIcon(source.source);
                        return (
                            <tr key={source.source} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <div className={`p-2 rounded-lg bg-${getSourceBadgeVariant(source.source)}-100`}>
                                            <Icon className={`h-4 w-4 text-${getSourceBadgeVariant(source.source)}-600`} />
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">
                                                {source.source_label || source.source}
                                            </div>
                                            <div className="text-xs text-gray-500">{source.source}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-right text-sm text-gray-700">
                                    {source.count.toLocaleString()}
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
                                            {formatPercent(source.percentage)}
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                    {/* Total row */}
                    <tr className="bg-gray-100 font-semibold">
                        <td className="px-4 py-3 text-sm text-gray-900">Total</td>
                        <td className="px-4 py-3 text-right text-sm text-gray-900">
                            {totalOrders.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-900">
                            {formatCurrency(totalRevenue)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-900">
                            {formatCurrency(totalRevenue / totalOrders)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-900">100%</td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

const OrderSources: React.FC = () => {
    // Date range state
    const [dateRange, setDateRange] = useState<DateRange>({
        start: format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
        end: format(new Date(), 'yyyy-MM-dd')
    });

    // Quick date range options
    const quickRanges = [
        { label: '7 Days', days: 7 },
        { label: '30 Days', days: 30 },
        { label: '90 Days', days: 90 },
    ];

    const handleQuickRange = (days: number) => {
        setDateRange({
            start: format(new Date(Date.now() - days * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
            end: format(new Date(), 'yyyy-MM-dd')
        });
    };

    // Fetch order sources data
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['order-sources', dateRange],
        queryFn: async () => {
            const response = await api.get<OrderSourcesResponse>('/analytics/order-sources', {
                params: {
                    start_date: dateRange.start,
                    end_date: dateRange.end
                }
            });
            return response.data;
        }
    });

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Order Sources</h1>
                    <p className="text-gray-500 mt-1">Analyze where your orders are coming from</p>
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
                    title="Total Orders"
                    value={data?.total_orders.toLocaleString() || '0'}
                    subtitle="In selected period"
                    icon={ShoppingCart}
                    color="text-blue-600"
                    bgColor="bg-blue-100"
                />
                <KPICard
                    title="Total Revenue"
                    value={formatCurrency(data?.total_revenue) || '₹0'}
                    subtitle="From all sources"
                    icon={DollarSign}
                    color="text-green-600"
                    bgColor="bg-green-100"
                />
                <KPICard
                    title="Avg Order Value"
                    value={formatCurrency(
                        data?.total_orders ? data.total_revenue / data.total_orders : 0
                    ) || '₹0'}
                    subtitle="Across all sources"
                    icon={TrendingUp}
                    color="text-purple-600"
                    bgColor="bg-purple-100"
                />
                <KPICard
                    title="Sources Tracked"
                    value={data?.data.length.toString() || '0'}
                    subtitle="Different channels"
                    icon={Percent}
                    color="text-amber-600"
                    bgColor="bg-amber-100"
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pie Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Orders by Source</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <SourcePieChart data={data?.data || []} isLoading={isLoading} />
                    </CardContent>
                </Card>

                {/* Bar Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Revenue by Source</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <RevenueBarChart data={data?.data || []} isLoading={isLoading} />
                    </CardContent>
                </Card>
            </div>

            {/* Sources Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Source Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <SourcesTable
                        sources={data?.data || []}
                        totalOrders={data?.total_orders || 0}
                        totalRevenue={data?.total_revenue || 0}
                        isLoading={isLoading}
                    />
                </CardContent>
            </Card>
        </div>
    );
};

export default OrderSources;