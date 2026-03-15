import React from 'react';
import { cn } from '../utils/cn';

// Skeleton variants
type SkeletonVariant = 'text' | 'circle' | 'rect' | 'rounded';

export interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  className?: string;
  animate?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  className,
  animate = true,
}) => {
  const variantClasses = {
    text: 'h-4 rounded',
    circle: 'rounded-full',
    rect: 'rounded-lg',
    rounded: 'rounded-xl',
  };

  const style: React.CSSProperties = {
    width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
    height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
  };

  // For circle variant, ensure equal width and height if not specified
  if (variant === 'circle') {
    if (!style.width && !style.height) {
      style.width = '40px';
      style.height = '40px';
    } else if (style.width && !style.height) {
      style.height = style.width;
    } else if (style.height && !style.width) {
      style.width = style.height;
    }
  }

  return (
    <div
      className={cn(
        'bg-gray-200',
        animate && 'animate-pulse',
        variantClasses[variant],
        className
      )}
      style={style}
    />
  );
};

// Skeleton Text - multiple lines of text
export interface SkeletonTextProps {
  lines?: number;
  lastLineWidth?: string;
  className?: string;
  animate?: boolean;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({
  lines = 3,
  lastLineWidth = '60%',
  className,
  animate = true,
}) => {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          variant="text"
          width={index === lines - 1 ? lastLineWidth : '100%'}
          animate={animate}
        />
      ))}
    </div>
  );
};

// Skeleton Avatar
export interface SkeletonAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  animate?: boolean;
}

export const SkeletonAvatar: React.FC<SkeletonAvatarProps> = ({
  size = 'md',
  className,
  animate = true,
}) => {
  const sizes = {
    sm: 32,
    md: 40,
    lg: 48,
    xl: 64,
  };

  return (
    <Skeleton
      variant="circle"
      width={sizes[size]}
      height={sizes[size]}
      className={className}
      animate={animate}
    />
  );
};

// Skeleton Card
export interface SkeletonCardProps {
  showImage?: boolean;
  showHeader?: boolean;
  showFooter?: boolean;
  lines?: number;
  className?: string;
  animate?: boolean;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  showImage = false,
  showHeader = true,
  showFooter = false,
  lines = 3,
  className,
  animate = true,
}) => {
  return (
    <div className={cn('bg-white rounded-xl shadow-card overflow-hidden', className)}>
      {showImage && (
        <Skeleton variant="rect" height={160} animate={animate} />
      )}
      <div className="p-6">
        {showHeader && (
          <div className="flex items-center gap-4 mb-4">
            <SkeletonAvatar animate={animate} />
            <div className="flex-1 space-y-2">
              <Skeleton variant="text" width="60%" animate={animate} />
              <Skeleton variant="text" width="40%" animate={animate} />
            </div>
          </div>
        )}
        <SkeletonText lines={lines} animate={animate} />
      </div>
      {showFooter && (
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <Skeleton variant="rect" width={80} height={36} animate={animate} />
          <Skeleton variant="rect" width={80} height={36} animate={animate} />
        </div>
      )}
    </div>
  );
};

// Skeleton Table
export interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  className?: string;
  animate?: boolean;
}

export const SkeletonTable: React.FC<SkeletonTableProps> = ({
  rows = 5,
  columns = 4,
  showHeader = true,
  className,
  animate = true,
}) => {
  return (
    <div className={cn('bg-white rounded-xl border border-gray-200 overflow-hidden', className)}>
      <table className="min-w-full">
        {showHeader && (
          <thead className="bg-gray-50">
            <tr>
              {Array.from({ length: columns }).map((_, index) => (
                <th key={index} className="px-6 py-3">
                  <Skeleton variant="text" width="60%" animate={animate} />
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex} className="border-t border-gray-100">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex} className="px-6 py-4">
                  <Skeleton
                    variant="text"
                    width={colIndex === 0 ? '70%' : '50%'}
                    animate={animate}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Skeleton Stat Card
export interface SkeletonStatCardProps {
  className?: string;
  animate?: boolean;
}

export const SkeletonStatCard: React.FC<SkeletonStatCardProps> = ({
  className,
  animate = true,
}) => {
  return (
    <div className={cn('bg-white rounded-xl shadow-card p-6', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-3">
          <Skeleton variant="text" width="40%" animate={animate} />
          <Skeleton variant="text" width="60%" height={28} animate={animate} />
          <div className="flex items-center gap-2">
            <Skeleton variant="rect" width={60} height={20} animate={animate} />
            <Skeleton variant="text" width="30%" animate={animate} />
          </div>
        </div>
        <Skeleton variant="rect" width={48} height={48} className="rounded-xl" animate={animate} />
      </div>
    </div>
  );
};

// Skeleton List
export interface SkeletonListProps {
  items?: number;
  showAvatar?: boolean;
  className?: string;
  animate?: boolean;
}

export const SkeletonList: React.FC<SkeletonListProps> = ({
  items = 5,
  showAvatar = true,
  className,
  animate = true,
}) => {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex items-center gap-4">
          {showAvatar && <SkeletonAvatar animate={animate} />}
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="60%" animate={animate} />
            <Skeleton variant="text" width="40%" animate={animate} />
          </div>
        </div>
      ))}
    </div>
  );
};

// Page Loading Skeleton
export interface PageSkeletonProps {
  type?: 'dashboard' | 'list' | 'detail' | 'form';
  className?: string;
}

export const PageSkeleton: React.FC<PageSkeletonProps> = ({
  type = 'list',
  className,
}) => {
  if (type === 'dashboard') {
    return (
      <div className={cn('space-y-6', className)}>
        {/* Page header */}
        <div className="space-y-2">
          <Skeleton variant="text" width="30%" height={28} />
          <Skeleton variant="text" width="50%" />
        </div>
        
        {/* Stats row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonStatCard key={i} />
          ))}
        </div>
        
        {/* Chart/Table */}
        <SkeletonCard showHeader lines={5} />
      </div>
    );
  }

  if (type === 'detail') {
    return (
      <div className={cn('space-y-6', className)}>
        {/* Page header */}
        <div className="flex items-center gap-4">
          <Skeleton variant="rect" width={100} height={36} />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="40%" height={28} />
            <Skeleton variant="text" width="60%" />
          </div>
        </div>
        
        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SkeletonCard showImage showHeader lines={6} />
          </div>
          <div className="space-y-4">
            <SkeletonCard showHeader lines={3} />
            <SkeletonCard showHeader lines={3} />
          </div>
        </div>
      </div>
    );
  }

  if (type === 'form') {
    return (
      <div className={cn('space-y-6', className)}>
        {/* Page header */}
        <div className="space-y-2">
          <Skeleton variant="text" width="30%" height={28} />
          <Skeleton variant="text" width="50%" />
        </div>
        
        {/* Form */}
        <div className="bg-white rounded-xl shadow-card p-6">
          <div className="space-y-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton variant="text" width="20%" />
                <Skeleton variant="rect" height={40} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Default: list page
  return (
    <div className={cn('space-y-6', className)}>
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton variant="text" width="30%" height={28} />
          <Skeleton variant="text" width="50%" />
        </div>
        <Skeleton variant="rect" width={120} height={40} />
      </div>
      
      {/* Filters */}
      <div className="flex gap-4">
        <Skeleton variant="rect" width={200} height={40} />
        <Skeleton variant="rect" width={150} height={40} />
        <Skeleton variant="rect" width={100} height={40} />
      </div>
      
      {/* Table */}
      <SkeletonTable rows={8} columns={5} />
    </div>
  );
};

export default Skeleton;