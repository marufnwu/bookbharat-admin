/**
 * Stats Cards Component
 * Displays recovery statistics on the dashboard
 */

import React from 'react';
import {
  ShoppingCart,
  CheckCircle,
  XCircle,
  TrendingUp,
  DollarSign,
  Mail,
  Clock,
} from 'lucide-react';
import type { RecoveryStats } from '../types';

interface StatsCardsProps {
  stats: RecoveryStats | undefined;
  isLoading: boolean;
}

const StatsCards: React.FC<StatsCardsProps> = ({ stats, isLoading }) => {
  const formatCurrency = (value: number | undefined) => {
    if (!value) return '₹0';
    return `₹${value.toLocaleString()}`;
  };

  const formatPercent = (value: number | undefined) => {
    if (!value) return '0%';
    return `${value.toFixed(1)}%`;
  };

  const cards = [
    {
      title: 'Total Abandoned',
      value: stats?.total_abandoned || 0,
      subtext: `${stats?.week_abandoned || 0} this week`,
      icon: ShoppingCart,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
    {
      title: 'Recovered',
      value: stats?.total_recovered || 0,
      subtext: `${stats?.week_recovered || 0} this week`,
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      title: 'Recovery Rate',
      value: formatPercent(stats?.recovery_rate),
      subtext: 'Overall success',
      icon: TrendingUp,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      isText: true,
    },
    {
      title: 'Abandoned Value',
      value: formatCurrency(stats?.abandoned_value),
      subtext: 'Potential revenue',
      icon: DollarSign,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      isText: true,
    },
    {
      title: 'Recovered Value',
      value: formatCurrency(stats?.recovered_value),
      subtext: `${formatPercent(stats?.value_recovery_rate)} of total`,
      icon: DollarSign,
      color: 'text-green-600',
      bg: 'bg-green-50',
      isText: true,
    },
    {
      title: 'Emails Sent',
      value: stats?.emails_sent || 0,
      subtext: 'Recovery attempts',
      icon: Mail,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-16 mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-24"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card) => (
        <div key={card.title} className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">{card.title}</span>
            <div className={`p-2 rounded-lg ${card.bg}`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </div>
          <p className={`text-2xl font-bold ${card.color}`}>
            {card.isText ? card.value : card.value.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">{card.subtext}</p>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
