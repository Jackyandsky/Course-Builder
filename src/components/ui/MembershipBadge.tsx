'use client';

import { Crown, Star, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

export type MembershipLevel = 'basic' | 'standard' | 'premium';

interface MembershipBadgeProps {
  level: MembershipLevel;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const MEMBERSHIP_CONFIG = {
  basic: {
    label: 'Basic',
    icon: Star,
    bgColor: 'bg-gray-100',
    iconColor: 'text-gray-600',
    borderColor: 'border-gray-300',
    gradientFrom: 'from-gray-100',
    gradientTo: 'to-gray-200'
  },
  standard: {
    label: 'Standard',
    icon: Award,
    bgColor: 'bg-blue-100',
    iconColor: 'text-blue-600',
    borderColor: 'border-blue-300',
    gradientFrom: 'from-blue-100',
    gradientTo: 'to-blue-200'
  },
  premium: {
    label: 'Premium',
    icon: Crown,
    bgColor: 'bg-gradient-to-br from-yellow-100 to-yellow-200',
    iconColor: 'text-yellow-700',
    borderColor: 'border-yellow-400',
    gradientFrom: 'from-yellow-100',
    gradientTo: 'to-amber-200'
  }
};

const SIZE_CONFIG = {
  sm: {
    container: 'h-6 w-6',
    icon: 'h-3 w-3',
    text: 'text-xs',
    padding: 'px-1.5 py-0.5'
  },
  md: {
    container: 'h-8 w-8',
    icon: 'h-4 w-4',
    text: 'text-sm',
    padding: 'px-2 py-1'
  },
  lg: {
    container: 'h-10 w-10',
    icon: 'h-5 w-5',
    text: 'text-base',
    padding: 'px-3 py-1.5'
  }
};

export function MembershipBadge({ 
  level, 
  size = 'md', 
  showLabel = false,
  className 
}: MembershipBadgeProps) {
  const config = MEMBERSHIP_CONFIG[level];
  const sizeConfig = SIZE_CONFIG[size];
  const Icon = config.icon;

  if (showLabel) {
    return (
      <div className={cn(
        'inline-flex items-center gap-1 rounded-full border',
        config.bgColor,
        config.borderColor,
        sizeConfig.padding,
        className
      )}>
        <Icon className={cn(sizeConfig.icon, config.iconColor)} />
        <span className={cn(
          'font-medium',
          sizeConfig.text,
          config.iconColor
        )}>
          {config.label}
        </span>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        'relative inline-flex items-center justify-center rounded-full border-2',
        config.bgColor,
        config.borderColor,
        sizeConfig.container,
        className
      )}
      title={`${config.label} Member`}
    >
      <Icon className={cn(sizeConfig.icon, config.iconColor)} />
      {level === 'premium' && (
        // Add shimmer effect for premium
        <div className="absolute inset-0 rounded-full overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-300/20 to-transparent animate-shimmer" />
        </div>
      )}
    </div>
  );
}

// Compact version for avatar overlay
export function MembershipAvatarBadge({ level }: { level: MembershipLevel }) {
  const config = MEMBERSHIP_CONFIG[level];
  const Icon = config.icon;
  
  // Only show badge for standard and premium members
  if (level === 'basic') return null;
  
  return (
    <div className={cn(
      'absolute -bottom-1 -right-1 rounded-full border-2 border-white',
      'h-6 w-6 flex items-center justify-center shadow-sm',
      level === 'premium' 
        ? 'bg-gradient-to-br from-yellow-300 to-amber-400' 
        : 'bg-gradient-to-br from-blue-400 to-blue-500'
    )}>
      <Icon className="h-3.5 w-3.5 text-white" />
    </div>
  );
}