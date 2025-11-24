import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';
import type { ChannelStatus, ChannelHealth } from '../../types/notifications';
import {
  getChannelDisplayInfo,
  getHealthColor,
  getHealthLabel,
  getHealthStatusColor
} from '../../utils/notificationHelpers';

interface ChannelCardProps {
  channel: 'email' | 'sms' | 'whatsapp' | 'in_app';
  isSelected: boolean;
  channelStatus: ChannelStatus;
  onToggle: (channel: string) => void;
  disabled?: boolean;
}

const ChannelCard: React.FC<ChannelCardProps> = ({
  channel,
  isSelected,
  channelStatus,
  onToggle,
  disabled = false
}) => {
  const channelInfo = getChannelDisplayInfo(channel);
  const Icon = channelInfo.icon;
  const canSelect = channelStatus.configured && channelStatus.active;
  const isDisabled = disabled || !canSelect;

  const getHealthBgColor = (status: ChannelHealth['status']) => {
    const color = getHealthColor(status);
    const colorMap: Record<string, string> = {
      green: 'bg-green-50 border-green-200',
      yellow: 'bg-yellow-50 border-yellow-200',
      red: 'bg-red-50 border-red-200',
      gray: 'bg-gray-50 border-gray-200'
    };
    return colorMap[color] || colorMap.gray;
  };

  const getHealthTextColor = (status: ChannelHealth['status']) => {
    const color = getHealthColor(status);
    const colorMap: Record<string, string> = {
      green: 'text-green-700',
      yellow: 'text-yellow-700',
      red: 'text-red-700',
      gray: 'text-gray-700'
    };
    return colorMap[color] || colorMap.gray;
  };

  const getHealthDotColor = (status: ChannelHealth['status']) => {
    const color = getHealthColor(status);
    const colorMap: Record<string, string> = {
      green: 'bg-green-500',
      yellow: 'bg-yellow-500',
      red: 'bg-red-500',
      gray: 'bg-gray-400'
    };
    return colorMap[color] || colorMap.gray;
  };

  const getSuccessRateColor = (rate: number | null) => {
    if (rate === null) return 'text-gray-600';
    if (rate >= 95) return 'text-green-600';
    if (rate >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div
      className={`border-2 rounded-lg p-4 transition-all ${
        isSelected && canSelect
          ? 'border-blue-500 bg-blue-50 shadow-md'
          : !canSelect
          ? 'border-gray-300 bg-gray-50 opacity-80'
          : 'border-gray-300 bg-white hover:border-gray-400'
      }`}
    >
      {/* Header with checkbox */}
      <div className="flex items-start justify-between mb-3">
        <label
          className={`flex items-center gap-3 flex-1 ${
            isDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
          }`}
        >
          <input
            type="checkbox"
            checked={isSelected}
            disabled={isDisabled}
            onChange={() => onToggle(channel)}
            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Icon className="w-5 h-5 text-gray-700" />
              <span className="font-semibold text-lg text-gray-900">
                {channelInfo.name}
              </span>
              {canSelect && (
                <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">
                  ACTIVE ✓
                </span>
              )}
              {!channelStatus.configured && (
                <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 font-medium">
                  NOT CONFIGURED
                </span>
              )}
              {channelStatus.configured && !channelStatus.active && (
                <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 font-medium">
                  INACTIVE
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600">{channelInfo.description}</p>
          </div>
        </label>
      </div>

      {/* Provider info if configured */}
      {channelStatus.configured && channelStatus.provider && (
        <div className="mb-3 pl-8">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              Provider: <strong className="text-gray-900">{channelStatus.provider}</strong>
            </span>
            <Link
              to={channelStatus.providerLink || channelInfo.setupLink}
              className="text-blue-600 hover:text-blue-800 text-xs underline flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              View Config
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}

      {/* Health status if configured and active */}
      {canSelect && channelStatus.health && (
        <div
          className={`pl-8 p-3 rounded-md border ${getHealthBgColor(
            channelStatus.health.status
          )}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <div
              className={`w-2 h-2 rounded-full ${getHealthDotColor(
                channelStatus.health.status
              )}`}
            />
            <span
              className={`text-sm font-medium capitalize ${getHealthTextColor(
                channelStatus.health.status
              )}`}
            >
              {getHealthLabel(channelStatus.health.status)}
            </span>
            {channelStatus.health.success_rate !== null && (
              <span
                className={`text-sm font-bold ${getSuccessRateColor(
                  channelStatus.health.success_rate
                )}`}
              >
                {channelStatus.health.success_rate}% success rate
              </span>
            )}
          </div>

          {channelStatus.health.last_24h_sent !== undefined && (
            <div className="text-xs text-gray-600">
              Last 24h: {channelStatus.health.last_24h_sent} sent,{' '}
              {channelStatus.health.last_24h_delivered || 0} delivered
            </div>
          )}

          {channelStatus.health.status === 'degraded' && (
            <div className="mt-2 text-xs text-yellow-700 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Low success rate - check provider settings
            </div>
          )}

          {channelStatus.health.status === 'critical' && (
            <div className="mt-2 text-xs text-red-700 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Critical issues detected - immediate attention required
            </div>
          )}

          {channelStatus.health.last_error && (
            <div className="mt-2 text-xs text-gray-600 bg-white rounded px-2 py-1">
              Last error: {channelStatus.health.last_error}
            </div>
          )}
        </div>
      )}

      {/* Configuration needed */}
      {!channelStatus.configured && (
        <div className="pl-8 mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800">
              {channelInfo.name} provider is not configured yet.
            </span>
          </div>
          <p className="text-xs text-yellow-700 mb-3">
            Configure provider to enable this channel for notifications.
          </p>
          <Link
            to={channelInfo.setupLink}
            className="inline-flex items-center gap-1 text-sm px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            📋 Setup {channelInfo.name} Provider Now
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      )}

      {/* Inactive warning */}
      {channelStatus.configured && !channelStatus.active && (
        <div className="pl-8 mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800">
              {channelInfo.name} provider is configured but inactive.
            </span>
          </div>
          <p className="text-xs text-yellow-700 mb-3">
            Activate the provider to enable this channel.
          </p>
          <Link
            to={channelStatus.providerLink || channelInfo.setupLink}
            className="inline-flex items-center gap-1 text-sm px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            Activate Provider
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      )}

      {/* Benefits & Cost */}
      <div className="mt-3 pl-8 pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>
            Cost: <strong className="text-gray-800">{channelInfo.cost}</strong>
          </span>
          {canSelect && (
            <CheckCircle className="w-4 h-4 text-green-600" />
          )}
        </div>
      </div>
    </div>
  );
};

export default ChannelCard;
