import React from 'react';
import {
  Target,
  TrendingUp,
  Users,
  ShoppingCart,
  Clock,
  MousePointer,
  Eye,
  AlertCircle,
  CheckCircle,
  XCircle,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  Brain,
  Calendar
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';

interface CartInsightsProps {
  cartId: number;
}

interface CartInsight {
  recoveryProbability: number;
  customerSegment: string;
  abandonmentReason: string;
  riskFactors: string[];
  recoveryScoreBreakdown: {
    timeFactor: number;
    valueFactor: number;
    behaviorFactor: number;
    historyFactor: number;
  };
  predictedRecoveryTime: string;
  recommendedActions: string[];
  similarCarts: {
    recovered: number;
    total: number;
    averageRecoveryTime: number;
  };
  behavioralMetrics: {
    sessionDuration: number;
    pageViews: number;
    scrollDepth: number;
    exitIntent: boolean;
    lastActivity: string;
  };
  productInsights: {
    mostViewedCategory: string;
    highValueItems: number;
    cartAdditions: number;
    priceSensitivity: string;
  };
}

const CartInsights: React.FC<CartInsightsProps> = ({ cartId }) => {
  const {
    data: insights,
    isLoading,
    error
  } = useQuery({
    queryKey: ['cart-insights', cartId],
    queryFn: async () => {
      const response = await fetch(`/api/v1/admin/abandoned-carts/${cartId}/insights`);
      if (!response.ok) {
        throw new Error('Failed to fetch cart insights');
      }
      return response.json() as Promise<{ success: boolean; data: CartInsight }>;
    },
    select: (result) => result.data,
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    if (score >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getSegmentIcon = (segment: string) => {
    switch (segment) {
      case 'vip':
        return <CheckCircle className="h-4 w-4" />;
      case 'high_value':
        return <TrendingUp className="h-4 w-4" />;
      case 'repeat':
        return <Users className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  const getSegmentColor = (segment: string) => {
    switch (segment) {
      case 'vip':
        return 'bg-purple-100 text-purple-800';
      case 'high_value':
        return 'bg-blue-100 text-blue-800';
      case 'repeat':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} minutes`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)} hours`;
    return `${Math.floor(minutes / 1440)} days`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading insights...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
        <p className="text-red-600">Failed to load cart insights</p>
        <p className="text-gray-500 text-sm mt-1">Please try again later</p>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="text-center py-12">
        <Target className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-500">No insights available</p>
        <p className="text-gray-400 text-sm mt-1">Insufficient data to generate insights</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Brain className="h-5 w-5 mr-2" />
          Cart Insights
        </h3>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Activity className="h-4 w-4" />
          <span>Last updated: {new Date().toLocaleString()}</span>
        </div>
      </div>

      {/* Recovery Score Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-gray-900">Recovery Score</h4>
          <div className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-blue-600" />
            <span className="text-2xl font-bold text-blue-900">
              {insights.recoveryProbability}%
            </span>
          </div>
        </div>

        <div className="mb-4">
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${getScoreColor(insights.recoveryProbability)}`}
              style={{ width: `${insights.recoveryProbability}%` }}
            ></div>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="text-center">
            <div className="text-sm text-gray-600">Time Factor</div>
            <div className="text-lg font-semibold text-gray-900">
              {insights.recoveryScoreBreakdown.timeFactor}%
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">Value Factor</div>
            <div className="text-lg font-semibold text-gray-900">
              {insights.recoveryScoreBreakdown.valueFactor}%
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">Behavior Factor</div>
            <div className="text-lg font-semibold text-gray-900">
              {insights.recoveryScoreBreakdown.behaviorFactor}%
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">History Factor</div>
            <div className="text-lg font-semibold text-gray-900">
              {insights.recoveryScoreBreakdown.historyFactor}%
            </div>
          </div>
        </div>
      </div>

      {/* Customer Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer Segment */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Users className="h-5 w-5 text-gray-600 mr-2" />
            <h4 className="font-semibold text-gray-900">Customer Segment</h4>
          </div>
          <div className="flex items-center justify-center py-8">
            <div className={`inline-flex items-center px-4 py-2 rounded-full text-lg font-medium ${getSegmentColor(insights.customerSegment)}`}>
              {getSegmentIcon(insights.customerSegment)}
              <span className="ml-2 capitalize">{insights.customerSegment.replace('_', ' ')}</span>
            </div>
          </div>
        </div>

        {/* Similar Carts Performance */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <BarChart3 className="h-5 w-5 text-gray-600 mr-2" />
            <h4 className="font-semibold text-gray-900">Similar Carts Performance</h4>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Recovery Rate</span>
              <span className="text-sm font-semibold text-green-600">
                {Math.round((insights.similarCarts.recovered / insights.similarCarts.total) * 100)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Recovered / Total</span>
              <span className="text-sm font-semibold text-gray-900">
                {insights.similarCarts.recovered} / {insights.similarCarts.total}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Avg Recovery Time</span>
              <span className="text-sm font-semibold text-blue-600">
                {formatTime(insights.similarCarts.averageRecoveryTime)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Behavioral Metrics */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <MousePointer className="h-5 w-5 text-gray-600 mr-2" />
          <h4 className="font-semibold text-gray-900">Behavioral Analysis</h4>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Clock className="h-8 w-8 mx-auto mb-2 text-gray-600" />
            <div className="text-sm text-gray-600">Session Duration</div>
            <div className="text-lg font-semibold text-gray-900">
              {formatTime(insights.behavioralMetrics.sessionDuration)}
            </div>
          </div>

          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Eye className="h-8 w-8 mx-auto mb-2 text-gray-600" />
            <div className="text-sm text-gray-600">Page Views</div>
            <div className="text-lg font-semibold text-gray-900">
              {insights.behavioralMetrics.pageViews}
            </div>
          </div>

          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <BarChart3 className="h-8 w-8 mx-auto mb-2 text-gray-600" />
            <div className="text-sm text-gray-600">Scroll Depth</div>
            <div className="text-lg font-semibold text-gray-900">
              {insights.behavioralMetrics.scrollDepth}%
            </div>
          </div>

          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-600" />
            <div className="text-sm text-gray-600">Exit Intent</div>
            <div className="text-lg font-semibold text-gray-900">
              {insights.behavioralMetrics.exitIntent ? 'Yes' : 'No'}
            </div>
          </div>

          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-600" />
            <div className="text-sm text-gray-600">Last Activity</div>
            <div className="text-lg font-semibold text-gray-900">
              {formatDistanceToNow(new Date(insights.behavioralMetrics.lastActivity), { addSuffix: true })}
            </div>
          </div>
        </div>
      </div>

      {/* Product Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <ShoppingCart className="h-5 w-5 text-gray-600 mr-2" />
            <h4 className="font-semibold text-gray-900">Product Analysis</h4>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Most Viewed Category</span>
              <span className="text-sm font-medium text-gray-900 capitalize">
                {insights.productInsights.mostViewedCategory}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">High-Value Items</span>
              <span className="text-sm font-medium text-gray-900">
                {insights.productInsights.highValueItems}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Cart Additions</span>
              <span className="text-sm font-medium text-gray-900">
                {insights.productInsights.cartAdditions}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Price Sensitivity</span>
              <span className="text-sm font-medium text-gray-900 capitalize">
                {insights.productInsights.priceSensitivity}
              </span>
            </div>
          </div>
        </div>

        {/* Risk Factors */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <XCircle className="h-5 w-5 text-gray-600 mr-2" />
            <h4 className="font-semibold text-gray-900">Risk Factors</h4>
          </div>

          {insights.riskFactors.length > 0 ? (
            <div className="space-y-2">
              {insights.riskFactors.map((factor, index) => (
                <div
                  key={index}
                  className="flex items-center p-3 bg-red-50 border border-red-200 rounded-md"
                >
                  <XCircle className="h-4 w-4 text-red-500 mr-2 flex-shrink-0" />
                  <span className="text-sm text-red-800">{factor}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">No significant risk factors identified</p>
            </div>
          )}
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Target className="h-5 w-5 text-gray-600 mr-2" />
          <h4 className="font-semibold text-gray-900">Recommended Actions</h4>
        </div>

        <div className="space-y-2">
          {insights.recommendedActions.length > 0 ? (
            insights.recommendedActions.map((action, index) => (
              <div
                key={index}
                className="flex items-start p-3 bg-blue-50 border border-blue-200 rounded-md"
              >
                <CheckCircle className="h-4 w-4 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-blue-800">{action}</span>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Target className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">No specific recommendations at this time</p>
            </div>
          )}
        </div>
      </div>

      {/* Prediction */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-gray-900">Recovery Prediction</h4>
          <div className="text-right">
            <div className="text-sm text-gray-600">Estimated Time to Recovery</div>
            <div className="text-lg font-semibold text-green-700">
              {formatDistanceToNow(new Date(insights.predictedRecoveryTime), { addSuffix: true })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartInsights;