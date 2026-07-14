/**
 * Recovery Campaigns Analytics
 * Tracks performance of order recovery campaigns
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import {
    Send,
    MousePointerClick,
    ShoppingCart,
    CheckCircle,
    TrendingUp,
    DollarSign,
    Calendar,
    RefreshCw
} from 'lucide-react';
import { api } from '../../api/axios';
import { LoadingSpinner, Card, CardHeader, CardTitle, CardContent, Badge } from '../../components';
import { formatCurrency, formatPercent, formatNumber, daysAgoIso, toIsoDate } from '../../utils/format';

// Backend AnalyticsController::getRecoveryCampaigns response:
//   { success: bool, campaigns: [{id, name, channel, sent_count, clicked_count,
//     converted_count, conversion_rate, revenue}] }
// We compute summary metrics client-side (the controller currently does not
// emit total_* aggregates; see controller comment for fallback row).
interface BackendCampaignRow {
    id: number | string | null;
    name: string;
    channel: string;
    sent_count: number;
    clicked_count: number;
    converted_count: number;
    conversion_rate: number;
    revenue: number;
}

interface BackendRecoveryCampaignsResponse {
    success: boolean;
    campaigns: BackendCampaignRow[];
}

interface DateRange {
    start: string;
    end: string;
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

// Table component for campaign data
interface CampaignTableProps {
    campaigns: BackendCampaignRow[];
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
                            Sent
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Clicked
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Converted
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Conv. Rate
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Revenue
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {campaigns.map((campaign, index) => (
                        <tr key={String(campaign.id ?? index)} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-4 py-3">
                                <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
                                <div className="text-xs text-gray-500">ID #{String(campaign.id ?? '—')}</div>
                            </td>
                            <td className="px-4 py-3">
                                <Badge variant={campaign.channel === 'whatsapp' ? 'default' : 'secondary'}>
                                    {campaign.channel}
                                </Badge>
                            </td>
                            <td className="px-4 py-3 text-right text-sm text-gray-700">
                                {formatNumber(campaign.sent_count)}
                            </td>
                            <td className="px-4 py-3 text-right text-sm text-gray-700">
                                {formatNumber(campaign.clicked_count)}
                            </td>
                            <td className="px-4 py-3 text-right text-sm text-gray-700">
                                {formatNumber(campaign.converted_count)}
                            </td>
                            <td className="px-4 py-3 text-right">
                                <span className={`text-sm font-medium ${campaign.conversion_rate >= 10 ? 'text-green-600' :
                                    campaign.conversion_rate >= 5 ? 'text-yellow-600' : 'text-red-600'
                                    }`}>
                                    {formatPercent(campaign.conversion_rate)}
                                </span>
                            </td>
                            <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                                {formatCurrency(campaign.revenue)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const RecoveryCampaigns: React.FC = () => {
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

    // Fetch recovery campaigns data. The backend returns per-row metrics
    // but no top-level aggregates, so the summary cards are derived from
    // the same `campaigns` array on the client.
    const { data: campaigns, isLoading, refetch } = useQuery({
        queryKey: ['recovery-campaigns', dateRange],
        queryFn: async () => {
            const response = await api.get<BackendRecoveryCampaignsResponse>(
                '/analytics/recovery-campaigns',
                { params: { start_date: dateRange.start, end_date: dateRange.end } },
            );
            return response.data?.campaigns ?? [];
        },
    });

    const rows = campaigns ?? [];
    const totalSent = rows.reduce((s, c) => s + (c.sent_count ?? 0), 0);
    const totalClicked = rows.reduce((s, c) => s + (c.clicked_count ?? 0), 0);
    const totalConverted = rows.reduce((s, c) => s + (c.converted_count ?? 0), 0);
    const totalRevenue = rows.reduce((s, c) => s + Number(c.revenue ?? 0), 0);
    const overallConversionRate = totalSent > 0
        ? (totalConverted / totalSent) * 100
        : 0;

    // Prepare chart data - per-campaign funnel for the bar chart.
    const chartData = rows.map((campaign) => ({
        name: campaign.name.length > 15
            ? campaign.name.substring(0, 15) + '...'
            : campaign.name,
        sent: campaign.sent_count,
        clicked: campaign.clicked_count,
        converted: campaign.converted_count,
        rate: campaign.conversion_rate,
    }));

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Recovery Campaigns</h1>
                    <p className="text-gray-500 mt-1">Track performance of order and cart recovery campaigns</p>
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
                    title="Total Sent"
                    value={formatNumber(totalSent)}
                    subtitle="Recovery messages"
                    icon={Send}
                    color="text-blue-600"
                    bgColor="bg-blue-100"
                />
                <KPICard
                    title="Total Clicked"
                    value={formatNumber(totalClicked)}
                    subtitle="Link clicks"
                    icon={MousePointerClick}
                    color="text-purple-600"
                    bgColor="bg-purple-100"
                />
                <KPICard
                    title="Overall Conversion"
                    value={formatPercent(overallConversionRate)}
                    subtitle="Payments completed"
                    icon={CheckCircle}
                    color="text-green-600"
                    bgColor="bg-green-100"
                />
                <KPICard
                    title="Attributed Revenue"
                    value={formatCurrency(totalRevenue)}
                    subtitle="From recovery campaigns"
                    icon={DollarSign}
                    color="text-amber-600"
                    bgColor="bg-amber-100"
                />
            </div>

            {/* Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Campaign Performance Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <LoadingSpinner size="lg" />
                        </div>
                    ) : chartData.length > 0 ? (
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
                                    />
                                    <YAxis
                                        yAxisId="right"
                                        orientation="right"
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `${value}%`}
                                    />
                                    <Tooltip
                                        formatter={(value: number, name: string) => {
                                            if (name === 'rate') return [`${value.toFixed(1)}%`, 'Conv. Rate'];
                                            return [value.toLocaleString(), name.charAt(0).toUpperCase() + name.slice(1)];
                                        }}
                                    />
                                    <Legend />
                                    <Bar yAxisId="left" dataKey="sent" name="Sent" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                    <Bar yAxisId="left" dataKey="clicked" name="Clicked" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                    <Bar yAxisId="left" dataKey="converted" name="Converted" fill="#10b981" radius={[4, 4, 0, 0]} />
                                    <Line yAxisId="right" type="monotone" dataKey="rate" name="Conv. Rate" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b' }} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            No campaign data available
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Campaign Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Campaign Details</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <CampaignTable campaigns={rows} isLoading={isLoading} />
                </CardContent>
            </Card>
        </div>
    );
};

export default RecoveryCampaigns;