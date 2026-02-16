'use client';

import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import { useContainerMetrics } from '@/lib/hooks/use-api';

interface ResourceSparklineProps {
  containerId: string;
  type: 'cpu' | 'memory';
  color?: string;
  isRunning: boolean;
}

export function ResourceSparkline({ containerId, type, color = '#3b82f6', isRunning }: ResourceSparklineProps) {
  const { data: metrics, isLoading } = useContainerMetrics(containerId, isRunning);

  if (isLoading || !metrics || metrics.length < 2) {
    return <div className="w-full h-8 bg-muted/10 rounded animate-pulse" />;
  }

  return (
    <div className="w-full h-8">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={metrics}>
          <YAxis hide domain={['auto', 'auto']} />
          <Line 
            type="monotone" 
            dataKey={type} 
            stroke={color} 
            strokeWidth={1.5} 
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
