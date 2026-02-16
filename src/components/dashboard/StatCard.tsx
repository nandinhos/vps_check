'use client';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    positive: boolean;
  };
  variant?: 'default' | 'success' | 'warning' | 'danger';
  className?: string;
}

const variantStyles = {
  default: 'text-foreground',
  success: 'text-green-500',
  warning: 'text-yellow-500',
  danger: 'text-destructive',
};

const iconVariants = {
  default: 'bg-secondary',
  success: 'bg-green-500/10',
  warning: 'bg-yellow-500/10',
  danger: 'bg-destructive/10',
};

export function StatCard({ title, value, icon: Icon, trend, variant = 'default', className }: StatCardProps) {
  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{title}</p>
            <p className={cn('text-2xl font-bold mt-1', variantStyles[variant])}>{value}</p>
            {trend && (
              <p className={cn('text-xs mt-1', trend.positive ? 'text-green-500' : 'text-destructive')}>
                {trend.positive ? '+' : ''}{trend.value}% vs última verificação
              </p>
            )}
          </div>
          <div className={cn('p-3 rounded-lg', iconVariants[variant])}>
            <Icon className={cn('w-5 h-5', variantStyles[variant])} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
