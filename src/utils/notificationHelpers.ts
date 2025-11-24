import {
  Mail,
  Smartphone,
  MessageSquare,
  Bell,
  type LucideIcon
} from 'lucide-react';
import type { ChannelStatus, ChannelHealth } from '../types/notifications';

export interface ChannelDisplayInfo {
  icon: LucideIcon;
  name: string;
  description: string;
  cost: string;
  benefits: string[];
  setupLink: string;
}

export const getChannelIcon = (channel: string): LucideIcon => {
  switch (channel) {
    case 'email':
      return Mail;
    case 'sms':
      return Smartphone;
    case 'whatsapp':
      return MessageSquare;
    case 'in_app':
      return Bell;
    default:
      return Bell;
  }
};

export const getChannelDisplayInfo = (channel: string): ChannelDisplayInfo => {
  const channelMap: Record<string, ChannelDisplayInfo> = {
    email: {
      icon: Mail,
      name: 'Email',
      description: 'Reliable and detailed notifications with high deliverability',
      cost: 'Free',
      benefits: [
        'Always delivered',
        'Detailed content support',
        'No character limits',
        'Attachment support'
      ],
      setupLink: '/communication/email'
    },
    sms: {
      icon: Smartphone,
      name: 'SMS',
      description: 'Instant notifications with high open rates',
      cost: '~₹0.30/message',
      benefits: [
        'Instant delivery',
        '98% open rate',
        'Works without internet',
        'Universal support'
      ],
      setupLink: '/communication/sms'
    },
    whatsapp: {
      icon: MessageSquare,
      name: 'WhatsApp',
      description: 'Popular messaging platform with rich media support',
      cost: '~₹0.15/message',
      benefits: [
        'Cost-effective',
        'Rich media support',
        'High engagement',
        'Popular in India'
      ],
      setupLink: '/communication/whatsapp'
    },
    in_app: {
      icon: Bell,
      name: 'In-App Notification',
      description: 'Free instant notifications within the application',
      cost: 'Free',
      benefits: [
        'No cost',
        '100% delivery',
        'Instant',
        'Always available'
      ],
      setupLink: '/communication'
    }
  };

  return channelMap[channel] || channelMap.in_app;
};

export const getHealthColor = (status: ChannelHealth['status']): string => {
  switch (status) {
    case 'healthy':
      return 'green';
    case 'degraded':
      return 'yellow';
    case 'critical':
      return 'red';
    case 'inactive':
    default:
      return 'gray';
  }
};

export const getHealthLabel = (status: ChannelHealth['status']): string => {
  switch (status) {
    case 'healthy':
      return 'Healthy';
    case 'degraded':
      return 'Degraded';
    case 'critical':
      return 'Critical';
    case 'inactive':
    default:
      return 'Inactive';
  }
};

export const getHealthStatusColor = (successRate: number | null): string => {
  if (successRate === null) return 'gray';
  if (successRate >= 95) return 'green';
  if (successRate >= 80) return 'yellow';
  return 'red';
};

export const isChannelAvailable = (
  channel: string,
  channelStatus: Record<string, ChannelStatus>
): boolean => {
  const status = channelStatus[channel];
  return status?.configured && status?.active;
};

export const getChannelCommunicationLink = (channel: string): string => {
  const channelMap: Record<string, string> = {
    email: '/communication/email',
    sms: '/communication/sms',
    whatsapp: '/communication/whatsapp',
    in_app: '/communication'
  };
  return channelMap[channel] || '/communication';
};

export const formatEventName = (eventType: string): string => {
  return eventType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const getRecommendedChannelsForEvent = (eventType: string): string[] => {
  const recommendations: Record<string, string[]> = {
    order_placed: ['email', 'in_app'],
    order_confirmed: ['email', 'in_app'],
    order_shipped: ['email', 'sms', 'whatsapp'],
    order_delivered: ['email', 'sms', 'in_app'],
    order_cancelled: ['email', 'sms'],
    payment_success: ['email', 'in_app'],
    payment_failed: ['email', 'sms'],
    password_reset: ['email'],
    welcome_email: ['email', 'in_app'],
    abandoned_cart: ['email', 'sms', 'whatsapp'],
    review_request: ['email'],
    return_requested: ['email', 'in_app'],
    return_approved: ['email', 'sms'],
    return_completed: ['email', 'in_app']
  };

  return recommendations[eventType] || ['email', 'in_app'];
};

export const estimateCostPerNotification = (
  channels: string[],
  channelStatus: Record<string, ChannelStatus>
): number => {
  let cost = 0;

  channels.forEach(channel => {
    if (!isChannelAvailable(channel, channelStatus)) return;

    switch (channel) {
      case 'sms':
        cost += 0.30;
        break;
      case 'whatsapp':
        cost += 0.15;
        break;
      case 'email':
      case 'in_app':
      default:
        // Free channels
        break;
    }
  });

  return cost;
};

export const getChannelRecommendation = (
  eventType: string,
  importance: 'critical' | 'high' | 'medium' | 'low'
): {
  recommended: string[];
  reason: string;
} => {
  const criticalEvents = ['password_reset', 'payment_failed', 'order_cancelled'];
  const urgentEvents = ['order_shipped', 'payment_success'];
  const marketingEvents = ['abandoned_cart', 'review_request'];

  if (criticalEvents.includes(eventType)) {
    return {
      recommended: ['email', 'sms'],
      reason: 'Critical notifications should use both Email and SMS for guaranteed delivery'
    };
  }

  if (urgentEvents.includes(eventType)) {
    return {
      recommended: ['email', 'sms', 'whatsapp', 'in_app'],
      reason: 'Urgent updates benefit from multi-channel delivery for maximum reach'
    };
  }

  if (marketingEvents.includes(eventType)) {
    return {
      recommended: ['email', 'whatsapp'],
      reason: 'Marketing messages are cost-effective via Email and WhatsApp'
    };
  }

  return {
    recommended: ['email', 'in_app'],
    reason: 'Standard notifications work well with Email and In-App channels'
  };
};

export const getInsightsFromStats = (
  eventType: string,
  stats: any,
  channelStatus: Record<string, ChannelStatus>
): Array<{
  type: 'success' | 'warning' | 'error' | 'info';
  message: string;
  action?: {
    label: string;
    link: string;
  };
}> => {
  const insights: Array<{
    type: 'success' | 'warning' | 'error' | 'info';
    message: string;
    action?: { label: string; link: string };
  }> = [];

  // Check overall success rate
  if (stats?.total?.success_rate !== undefined) {
    if (stats.total.success_rate >= 95) {
      insights.push({
        type: 'success',
        message: `Excellent delivery rate (${stats.total.success_rate}%) - no action needed`
      });
    } else if (stats.total.success_rate >= 80) {
      insights.push({
        type: 'warning',
        message: `Success rate is ${stats.total.success_rate}% - consider investigating failures`,
        action: {
          label: 'View Failed Notifications',
          link: `/notifications/history?event=${eventType}&status=failed`
        }
      });
    } else {
      insights.push({
        type: 'error',
        message: `Low success rate (${stats.total.success_rate}%) - immediate action required`,
        action: {
          label: 'View Error Logs',
          link: `/notifications/history?event=${eventType}&status=failed`
        }
      });
    }
  }

  // Check channel-specific issues
  if (stats?.channels) {
    Object.entries(stats.channels).forEach(([channel, channelStats]: [string, any]) => {
      if (channelStats.success_rate < 90) {
        const channelInfo = getChannelDisplayInfo(channel);
        insights.push({
          type: 'warning',
          message: `${channelInfo.name} success rate is below 90% (${channelStats.success_rate}%)`,
          action: {
            label: `Check ${channelInfo.name} Provider`,
            link: channelInfo.setupLink
          }
        });
      }
    });
  }

  // Check for unconfigured channels
  const unconfiguredChannels = Object.entries(channelStatus)
    .filter(([_, status]) => !status.configured)
    .map(([channel, _]) => channel);

  if (unconfiguredChannels.length > 0) {
    const channelNames = unconfiguredChannels
      .map(ch => getChannelDisplayInfo(ch).name)
      .join(', ');

    insights.push({
      type: 'info',
      message: `${channelNames} not configured - potential reach increase`,
      action: {
        label: 'Configure Providers',
        link: '/communication'
      }
    });
  }

  return insights;
};
