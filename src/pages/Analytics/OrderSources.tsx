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
    RefreshCw
} from 'lucide-react';
import { api } from '../../api/axios';
import { LoadingSpinner, Card, CardHeader, CardTitle, CardContent } from '../../components';
import {
    formatCurrency,
    formatNumber,
    daysAgoIso,
    toIsoDate
} from '../../utils/format';

// Backend AnalyticsController::getOrderSources shape.
// After 2026-07-14 fix: each row carries order_count/revenue/avg_order_value;
// no count/percentage/total_orders/total_revenue/top-level. Derived fields
// (label, percentage, totals) are computed client-side.
interface BackendSourceRow {
    source: string;
    order_count: number;
    revenue: number;
    avg_order_value: number;
}

interface BackendOrderSourcesResponse {
    success: boolean;
    sources: BackendSourceRow[];
}

interface DateRange {
    start: string;
    end: string;
}

// Color palette for pie chart
const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16'];

// Static (Tailwind JIT-safe) source presentation.
// Each entry maps a backend source string to icon, color, and human label.
// Add new sources by adding a row — never interpolate them into classnames.
type SourcePresentation = {
    label: string;
    icon: React.ElementType;
    badgeBg: string;
    badgeText: string;
};

const SOURCE_PRESENTATION: Record<string, SourcePresentation> = {
    direct: { label: 'Direct', icon: Globe, badgeBg: 'bg-blue-100', badgeText: 'text-blue-600' },
    whatsapp_recovery: { label: 'WhatsApp Recovery', icon: MessageCircle, badgeBg: 'bg-green-100', badgeText: 'text-green-600' },
    cart_whatsapp: { label: 'Cart WhatsApp', icon: MessageCircle, badgeBg: 'bg-green-100', badgeText: 'text-green-600' },
    order_whatsapp: { label: 'Order WhatsApp', icon: MessageCircle, badgeBg: 'bg-green-100', badgeText: 'text-green-600' },
    email_recovery: { label: 'Email Recovery', icon: Mail, badgeBg: 'bg-purple-100', badgeText: 'text-purple-600' },
    cart_email: { label: 'Cart Email', icon: Mail, badgeBg: 'bg-purple-100', badgeText: 'text-purple-600' },
    order_email: { label: 'Order Email', icon: Mail, badgeBg: 'bg-purple-100', badgeText: 'text-purple-600' },
    organic: { label: 'Organic', icon: Search, badgeBg: 'bg-yellow-100', badgeText: 'text-yellow-600' },
    utm: { label: 'UTM', icon: Tag, badgeBg: 'bg-amber-100', badgeText: 'text-amber-600' },
};

const DEFAULT_PRESENTATION: SourcePresentation = {
    label: 'Unknown',
    icon: ShoppingCart,
    badgeBg: 'bg-gray-100',
    badgeText: 'text-gray-600',
};

const getSourcePresentation = (source: string): SourcePresentation =>
    SOURCE_PRESENTATION[source] ?? DEFAULT_PRESENTATION;

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
    data: BackendSourceRow[];
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
        name: getSourcePresentation(item.source).label,
        value: item.order_count,
        revenue: item.revenue,
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
                        label={({ name, percent }: any) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                        labelLine={false}
                    >
                        {chartData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip
                        formatter={(value: number, name: string) => {
                            const item = chartData.find(d => d.name === name);
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
    data: BackendSourceRow[];
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
        name: getSourcePresentation(item.source).label,
        orders: item.order_count,
        revenue: item.revenue,
        aov: item.avg_order_value,
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
    sources: BackendSourceRow[];
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
                        const pres = getSourcePresentation(source.source);
                        const pct = totalOrders > 0
                            ? (source.order_count / totalOrders) * 100
                            : 0;
                        const rowAvg = source.order_count > 0
                            ? Number(source.revenue) / source.order_count
                            : 0;
                        const Icon = pres.icon;
                        return (
                            <tr key={source.source} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <div className={`p-2 rounded-lg ${pres.badgeBg}`}>
                                            <Icon className={`h-4 w-4 ${pres.badgeText}`} />
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">{pres.label}</div>
                                            <div className="text-xs text-gray-500">{source.source}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-right text-sm text-gray-700">
                                    {source.order_count.toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                                    {formatCurrency(source.revenue)}
                                </td>
                                <td className="px-4 py-3 text-right text-sm text-gray-700">
                                    {formatCurrency(rowAvg)}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <div className="w-16 bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-blue-500 h-2 rounded-full"
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                        <span className="text-sm font-medium text-gray-700 w-12">
                                            {pct.toFixed(1)}%
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
                            {formatNumber(totalOrders)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-900">
                            {formatCurrency(totalRevenue)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-900">
                            {formatCurrency(totalOrders > 0 ? totalRevenue / totalOrders : 0)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-900">100%</td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

const OrderSources: React.FC = () => {
    // Date range state — initialised from local-time helpers (no UTC off-by-one).
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

    // Backend AnalyticsController::getOrderSources returns `{success, sources}`.
    // Each source row carries {source, order_count, revenue, avg_order_value}.
    // We derive total_orders/total_revenue/percentage client-side.
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['order-sources', dateRange],
        queryFn: async () => {
            const response = await api.get<BackendOrderSourcesResponse>('/analytics/order-sources', {
                params: {
                    start_date: dateRange.start,
                    end_date: dateRange.end,
                },
            });
            const sources = response.data?.sources ?? [];
            const totalOrders = sources.reduce((sum, s) => sum + (s.order_count ?? 0), 0);
            const totalRevenue = sources.reduce((sum, s) => sum + Number(s.revenue ?? 0), 0);
            return { sources, totalOrders, totalRevenue };
        },
    });

    const sources = data?.sources ?? [];
    const totalOrders = data?.totalOrders ?? 0;
    const totalRevenue = data?.totalRevenue ?? 0;

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
                    value={formatNumber(totalOrders)}
                    subtitle="In selected period"
                    icon={ShoppingCart}
                    color="text-blue-600"
                    bgColor="bg-blue-100"
                />
                <KPICard
                    title="Total Revenue"
                    value={formatCurrency(totalRevenue)}
                    subtitle="From all sources"
                    icon={DollarSign}
                    color="text-green-600"
                    bgColor="bg-green-100"
                />
                <KPICard
                    title="Avg Order Value"
                    value={formatCurrency(totalOrders > 0 ? totalRevenue / totalOrders : 0)}
                    subtitle={`From ${sources.length} source${sources.length === 1 ? '' : 's'}`}
                    icon={DollarSign}
                    color="text-purple-600"
                    bgColor="bg-purple-100"
                />
                <KPICard
                    title="Sources Tracked"
                    value={formatNumber(sources.length)}
                    subtitle="Different channels"
                    icon={TrendingUp}
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
                        <SourcePieChart data={sources} isLoading={isLoading} />
                    </CardContent>
                </Card>

                {/* Bar Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Revenue by Source</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <RevenueBarChart data={sources} isLoading={isLoading} />
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
                        sources={sources}
                        totalOrders={totalOrders}
                        totalRevenue={totalRevenue}
                        isLoading={isLoading}
                    />
                </CardContent>
            </Card>
        </div>
    );
};

export default OrderSources;