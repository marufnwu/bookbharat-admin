/**
 * Conversion Funnel Analytics
 * Visualizes the recovery funnel: Recovery Sent → Link Clicked → Checkout Started → Payment Completed
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
    ResponsiveContainer,
    LabelList
} from 'recharts';
import {
    Send,
    MousePointerClick,
    ShoppingCart,
    CheckCircle,
    TrendingUp,
    Clock,
    DollarSign,
    Calendar,
    RefreshCw,
    Filter,
    ArrowDown
} from 'lucide-react';
import { format } from 'date-fns';
import { api } from '../../api/axios';
import { LoadingSpinner, Card, CardHeader, CardTitle, CardContent, Badge } from '../../components';

// API response types
interface FunnelStage {
    stage: string;
    stage_label: string;
    count: number;
    percentage: number;
    dropoff_from_previous: number;
    avg_time_to_stage?: number;
}

interface ConversionFunnelResponse {
    funnel: FunnelStage[];
    avg_time_to_convert_hours: number | null;
    total_conversion_value: number;
    period: string;
    channel_breakdown?: {
        channel: string;
        stages: FunnelStage[];
    }[];
}

interface DateRange {
    start: string;
    end: string;
}

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

// Format time in hours
const formatTime = (hours: number | undefined | null): string => {
    if (hours === undefined || hours === null) return '-';
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${hours.toFixed(1)}h`;
    return `${(hours / 24).toFixed(1)}d`;
};

// Stage icons mapping
const getStageIcon = (stage: string): React.ElementType => {
    switch (stage) {
        case 'recovery_sent':
            return Send;
        case 'link_clicked':
            return MousePointerClick;
        case 'checkout_started':
            return ShoppingCart;
        case 'payment_completed':
            return CheckCircle;
        default:
            return TrendingUp;
    }
};

// Stage colors mapping
const getStageColor = (stage: string): string => {
    switch (stage) {
        case 'recovery_sent':
            return 'bg-blue-500';
        case 'link_clicked':
            return 'bg-purple-500';
        case 'checkout_started':
            return 'bg-amber-500';
        case 'payment_completed':
            return 'bg-green-500';
        default:
            return 'bg-gray-500';
    }
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

// Visual Funnel Component
interface FunnelChartProps {
    stages: FunnelStage[];
    isLoading: boolean;
}

const FunnelChart: React.FC<FunnelChartProps> = ({ stages, isLoading }) => {
    if (isLoading) {
        return (
            <div className="flex justify-center py-16">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (!stages.length) {
        return (
            <div className="text-center py-16 text-gray-500">
                No funnel data available for the selected period.
            </div>
        );
    }

    // Calculate max width for funnel bars
    const maxCount = stages[0]?.count || 1;

    return (
        <div className="py-8">
            {stages.map((stage, index) => {
                const Icon = getStageIcon(stage.stage);
                const widthPercent = (stage.count / maxCount) * 100;
                const isFirst = index === 0;
                const prevStage = isFirst ? null : stages[index - 1];
                const dropoffRate = prevStage ? ((prevStage.count - stage.count) / prevStage.count) * 100 : 0;

                return (
                    <div key={stage.stage} className="mb-6">
                        {/* Stage header */}
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${getStageColor(stage.stage)}`}>
                                    <Icon className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-900">{stage.stage_label}</h3>
                                    <p className="text-xs text-gray-500">
                                        {formatPercent(stage.percentage)} of total
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-bold text-gray-900">{stage.count.toLocaleString()}</p>
                                <p className="text-xs text-gray-500">users</p>
                            </div>
                        </div>

                        {/* Funnel bar */}
                        <div className="relative">
                            <div className="h-12 bg-gray-100 rounded-lg overflow-hidden">
                                <div
                                    className={`h-full ${getStageColor(stage.stage)} transition-all duration-500`}
                                    style={{ width: `${widthPercent}%` }}
                                />
                            </div>
                            <div className="absolute inset-y-0 right-4 flex items-center">
                                <span className="text-sm font-medium text-white drop-shadow-lg">
                                    {stage.count.toLocaleString()}
                                </span>
                            </div>
                        </div>

                        {/* Dropoff indicator */}
                        {!isFirst && (
                            <div className="flex items-center justify-end mt-2">
                                <div className="flex items-center gap-1 text-red-500">
                                    <ArrowDown className="h-3 w-3" />
                                    <span className="text-xs font-medium">
                                        {dropoffRate.toFixed(1)}% drop-off
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Arrow to next stage */}
                        {index < stages.length - 1 && (
                            <div className="flex justify-center my-2">
                                <div className="text-gray-300">
                                    <ArrowDown className="h-5 w-5" />
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

// Funnel Table with conversion rates
interface FunnelTableProps {
    stages: FunnelStage[];
    isLoading: boolean;
}

const FunnelTable: React.FC<FunnelTableProps> = ({ stages, isLoading }) => {
    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (!stages.length) {
        return (
            <div className="text-center py-12 text-gray-500">
                No funnel data available for the selected period.
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Stage
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Users
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            % of Total
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Drop-off
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Avg Time
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {stages.map((stage, index) => {
                        const Icon = getStageIcon(stage.stage);
                        const prevStage = index > 0 ? stages[index - 1] : null;
                        const dropoffFromPrev = prevStage
                            ? ((prevStage.count - stage.count) / prevStage.count) * 100
                            : 0;

                        return (
                            <tr key={stage.stage} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <div className={`p-2 rounded-lg ${getStageColor(stage.stage)}`}>
                                            <Icon className="h-4 w-4 text-white" />
                                        </div>
                                        <span className="text-sm font-medium text-gray-900">
                                            {stage.stage_label}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-right text-sm text-gray-700">
                                    {stage.count.toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <span className="text-sm font-medium text-gray-900">
                                        {formatPercent(stage.percentage)}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    {index > 0 ? (
                                        <span className="text-sm font-medium text-red-600">
                                            -{formatPercent(dropoffFromPrev)}
                                        </span>
                                    ) : (
                                        <span className="text-sm text-gray-400">-</span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-right text-sm text-gray-500">
                                    {formatTime(stage.avg_time_to_stage)}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

// Conversion Rate Chart
interface ConversionChartProps {
    stages: FunnelStage[];
    isLoading: boolean;
}

const ConversionChart: React.FC<ConversionChartProps> = ({ stages, isLoading }) => {
    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (!stages.length) {
        return (
            <div className="text-center py-12 text-gray-500">
                No conversion data available.
            </div>
        );
    }

    // Calculate stage-to-stage conversion rates
    const conversionData = stages.map((stage, index) => {
        const prevStage = index > 0 ? stages[index - 1] : null;
        const convRate = prevStage ? (stage.count / prevStage.count) * 100 : 100;
        return {
            name: stage.stage_label,
            conversionRate: convRate,
            count: stage.count
        };
    });

    return (
        <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={conversionData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                        dataKey="name"
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                    />
                    <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value}%`}
                        domain={[0, 100]}
                    />
                    <Tooltip
                        formatter={(value: number) => [`${value.toFixed(1)}%`, 'Conversion Rate']}
                    />
                    <Legend />
                    <Bar
                        dataKey="conversionRate"
                        name="Stage Conversion Rate"
                        fill="#10b981"
                        radius={[4, 4, 0, 0]}
                    >
                        <LabelList dataKey="conversionRate" formatter={(val) => `${Number(val).toFixed(0)}%`} position="top" />
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

const ConversionFunnel: React.FC = () => {
    // Date range state
    const [dateRange, setDateRange] = useState<DateRange>({
        start: format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
        end: format(new Date(), 'yyyy-MM-dd')
    });

    // Channel filter
    const [channelFilter, setChannelFilter] = useState<string>('');

    // Quick date range options
    const quickRanges = [
        { label: '7 Days', days: 7 },
        { label: '30 Days', days: 30 },
        { label: '90 Days', days: 90 },
    ];

    // Channel options
    const channels = [
        { value: '', label: 'All Channels' },
        { value: 'whatsapp', label: 'WhatsApp' },
        { value: 'email', label: 'Email' },
        { value: 'sms', label: 'SMS' },
    ];

    const handleQuickRange = (days: number) => {
        setDateRange({
            start: format(new Date(Date.now() - days * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
            end: format(new Date(), 'yyyy-MM-dd')
        });
    };

    // Fetch conversion funnel data
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['conversion-funnel', dateRange, channelFilter],
        queryFn: async () => {
            const response = await api.get<ConversionFunnelResponse>('/analytics/conversion-funnel', {
                params: {
                    start_date: dateRange.start,
                    end_date: dateRange.end,
                    channel: channelFilter || undefined
                }
            });
            return response.data;
        }
    });

    // Calculate overall conversion rate (recovery_sent to payment_completed)
    const overallConversionRate = React.useMemo(() => {
        if (!data?.funnel || data.funnel.length < 2) return 0;
        const sent = data.funnel.find(s => s.stage === 'recovery_sent')?.count || 0;
        const completed = data.funnel.find(s => s.stage === 'payment_completed')?.count || 0;
        return sent > 0 ? (completed / sent) * 100 : 0;
    }, [data]);

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Conversion Funnel</h1>
                    <p className="text-gray-500 mt-1">Analyze recovery funnel performance</p>
                </div>
                <button
                    onClick={() => refetch()}
                    className="p-2 bg-white border rounded-lg hover:bg-gray-50 text-gray-600"
                    title="Refresh Data"
                >
                    <RefreshCw className="h-5 w-5" />
                </button>
            </div>

            {/* Filters */}
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

                        {/* Channel filter */}
                        <div className="flex items-center gap-2 ml-4">
                            <Filter className="h-4 w-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-600">Channel:</span>
                            <select
                                value={channelFilter}
                                onChange={(e) => setChannelFilter(e.target.value)}
                                className="px-3 py-1 border rounded text-sm"
                            >
                                {channels.map(ch => (
                                    <option key={ch.value} value={ch.value}>{ch.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                    title="Messages Sent"
                    value={data?.funnel.find(s => s.stage === 'recovery_sent')?.count.toLocaleString() || '0'}
                    subtitle="Recovery messages"
                    icon={Send}
                    color="text-blue-600"
                    bgColor="bg-blue-100"
                />
                <KPICard
                    title="Link Clicks"
                    value={data?.funnel.find(s => s.stage === 'link_clicked')?.count.toLocaleString() || '0'}
                    subtitle="Click-through rate"
                    icon={MousePointerClick}
                    color="text-purple-600"
                    bgColor="bg-purple-100"
                />
                <KPICard
                    title="Conversions"
                    value={data?.funnel.find(s => s.stage === 'payment_completed')?.count.toLocaleString() || '0'}
                    subtitle="Payment completed"
                    icon={CheckCircle}
                    color="text-green-600"
                    bgColor="bg-green-100"
                />
                <KPICard
                    title="Avg Time to Convert"
                    value={formatTime(data?.avg_time_to_convert_hours) || '-'}
                    subtitle="From send to payment"
                    icon={Clock}
                    color="text-amber-600"
                    bgColor="bg-amber-100"
                />
            </div>

            {/* Overall Conversion Rate */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-medium text-gray-900">Overall Conversion Rate</h3>
                            <p className="text-sm text-gray-500">Recovery sent to payment completed</p>
                        </div>
                        <div className="text-right">
                            <p className="text-4xl font-bold text-green-600">{formatPercent(overallConversionRate)}</p>
                            <p className="text-sm text-gray-500">
                                {formatCurrency(data?.total_conversion_value)} revenue
                            </p>
                        </div>
                    </div>
                    {/* Progress bar */}
                    <div className="mt-4">
                        <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-green-500 transition-all duration-500"
                                style={{ width: `${overallConversionRate}%` }}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Visual Funnel */}
            <Card>
                <CardHeader>
                    <CardTitle>Visual Funnel</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <FunnelChart stages={data?.funnel || []} isLoading={isLoading} />
                </CardContent>
            </Card>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Stage Conversion Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Stage-to-Stage Conversion Rates</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ConversionChart stages={data?.funnel || []} isLoading={isLoading} />
                    </CardContent>
                </Card>

                {/* Funnel Details Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Funnel Metrics</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <FunnelTable stages={data?.funnel || []} isLoading={isLoading} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ConversionFunnel;