/**
 * Revenue Attribution Report
 * Shows revenue breakdown by source, UTM source, and UTM campaign
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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

// API response types
interface RevenueBySource {
    source: string;
    source_label: string;
    revenue: number;
    orders: number;
    avg_order_value: number;
    percentage: number;
}

interface RevenueByCampaign {
    campaign_id: number;
    campaign_name: string;
    channel: string;
    attributed_revenue: number;
    conversions: number;
    roi_percentage?: number;
}

interface RecoveryROI {
    total_spent: number;
    attributed_revenue: number;
    roi_percentage: number;
}

interface RevenueAttributionResponse {
    by_source: RevenueBySource[];
    by_campaign: RevenueByCampaign[];
    recovery_roi: RecoveryROI;
    period: string;
    total_revenue: number;
    previous_period_revenue?: number;
    revenue_change_percentage?: number;
}

interface DateRange {
    start: string;
    end: string;
}

// Color palette for bar chart
const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16', '#f97316'];

// Format currency
const formatCurrency = (value: number | undefined | null): string => {
    if (value === undefined || value === null) return '₹0';
    return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

// Format percentage
const formatPercent = (value: number | undefined | null): string => {
    if (value === undefined || value === null) return '0%';
    const sign = value >= 0 ? '+' : '';
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

// Campaign Table
interface CampaignTableProps {
    campaigns: RevenueByCampaign[];
    isLoading: boolean;
}

const CampaignTable: React.FC<CampaignTableProps> = ({ campaigns, isLoading }) => {
    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (!campaigns.length) {
        return (
            <div className="text-center py-12 text-gray-500">
                No campaign data available for the selected period.
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Campaign
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Channel
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Conversions
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Attributed Revenue
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            ROI
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {campaigns.map((campaign, index) => (
                        <tr key={campaign.campaign_id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-4 py-3">
                                <div className="text-sm font-medium text-gray-900">{campaign.campaign_name}</div>
                            </td>
                            <td className="px-4 py-3">
                                <Badge variant={campaign.channel === 'whatsapp' ? 'green' : 'blue'}>
                                    {campaign.channel}
                                </Badge>
                            </td>
                            <td className="px-4 py-3 text-right text-sm text-gray-700">
                                {campaign.conversions.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                                {formatCurrency(campaign.attributed_revenue)}
                            </td>
                            <td className="px-4 py-3 text-right">
                                {campaign.roi_percentage !== undefined ? (
                                    <span className={`text-sm font-medium ${campaign.roi_percentage >= 100 ? 'text-green-600' :
                                            campaign.roi_percentage >= 50 ? 'text-yellow-600' : 'text-red-600'
                                        }`}>
                                        {formatPercent(campaign.roi_percentage)}
                                    </span>
                                ) : (
                                    <span className="text-sm text-gray-400">-</span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// Recovery ROI Card
interface ROICardProps {
    roi: RecoveryROI;
    isLoading: boolean;
}

const ROICard: React.FC<ROICardProps> = ({ roi, isLoading }) => {
    if (isLoading) {
        return (
            <div className="flex justify-center py-8">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    const isPositive = roi.roi_percentage >= 100;

    return (
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recovery Campaign ROI</h3>
                <div className={`p-2 rounded-lg ${isPositive ? 'bg-green-200' : 'bg-red-200'}`}>
                    <TrendingUp className={`h-5 w-5 ${isPositive ? 'text-green-700' : 'text-red-700'}`} />
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div>
                    <p className="text-sm text-gray-600">Total Spent</p>
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(roi.total_spent)}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-600">Revenue Generated</p>
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(roi.attributed_revenue)}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-600">ROI</p>
                    <p className={`text-xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPercent(roi.roi_percentage).replace('+', '')}
                    </p>
                </div>
            </div>
        </div>
    );
};

const RevenueAttribution: React.FC = () => {
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

    // Fetch revenue attribution data
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['revenue-attribution', dateRange],
        queryFn: async () => {
            const response = await api.get<RevenueAttributionResponse>('/analytics/revenue', {
                params: {
                    start_date: dateRange.start,
                    end_date: dateRange.end
                }
            });
            return response.data;
        }
    });

    // Determine trend direction for total revenue
    const revenueTrend = data?.revenue_change_percentage !== undefined
        ? data.revenue_change_percentage >= 0 ? 'up' : 'down'
        : null;

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
                    value={formatCurrency(data?.total_revenue) || '₹0'}
                    subtitle="In selected period"
                    icon={DollarSign}
                    color="text-green-600"
                    bgColor="bg-green-100"
                    trend={revenueTrend}
                    trendValue={revenueTrend ? formatPercent(data?.revenue_change_percentage) : undefined}
                />
                <KPICard
                    title="Recovery Revenue"
                    value={formatCurrency(data?.recovery_roi.attributed_revenue) || '₹0'}
                    subtitle="From recovery campaigns"
                    icon={TrendingUp}
                    color="text-blue-600"
                    bgColor="bg-blue-100"
                />
                <KPICard
                    title="Total Orders"
                    value={data?.by_source.reduce((sum, s) => sum + s.orders, 0).toLocaleString() || '0'}
                    subtitle="Across all sources"
                    icon={ShoppingCart}
                    color="text-purple-600"
                    bgColor="bg-purple-100"
                />
                <KPICard
                    title="Recovery ROI"
                    value={formatPercent(data?.recovery_roi.roi_percentage) || '0%'}
                    subtitle="Campaign performance"
                    icon={Percent}
                    color={data?.recovery_roi.roi_percentage && data.recovery_roi.roi_percentage >= 100 ? 'text-green-600' : 'text-red-600'}
                    bgColor={data?.recovery_roi.roi_percentage && data.recovery_roi.roi_percentage >= 100 ? 'bg-green-100' : 'bg-red-100'}
                />
            </div>

            {/* Revenue by Source Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Revenue by Source</CardTitle>
                </CardHeader>
                <CardContent>
                    <SourceChart data={data?.by_source || []} isLoading={isLoading} />
                </CardContent>
            </Card>

            {/* ROI Card */}
            <ROICard roi={data?.recovery_roi || { total_spent: 0, attributed_revenue: 0, roi_percentage: 0 }} isLoading={isLoading} />

            {/* Tables Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Source Breakdown Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Revenue by Source</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <SourceTable
                            sources={data?.by_source || []}
                            totalRevenue={data?.total_revenue || 0}
                            isLoading={isLoading}
                        />
                    </CardContent>
                </Card>

                {/* Campaign Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Revenue by Campaign</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <CampaignTable
                            campaigns={data?.by_campaign || []}
                            isLoading={isLoading}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default RevenueAttribution;