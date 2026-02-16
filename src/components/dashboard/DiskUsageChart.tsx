'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DiskUsage } from '@/domain/entities';

interface DiskUsageChartProps {
  data: DiskUsage[];
}

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#64748b'];

export function DiskUsageChart({ data }: DiskUsageChartProps) {
  const chartData = data
    .slice(0, 8)
    .map(item => ({
      name: item.path.length > 15 ? item.path.slice(-15) : item.path,
      fullPath: item.path,
      size: Math.round(item.size / (1024 * 1024)),
    }));

  return (
    <Card className="col-span-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Uso de Disco</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 20 }}>
              <XAxis type="number" hide />
              <YAxis 
                type="category" 
                dataKey="name" 
                tick={{ fill: '#71717a', fontSize: 11 }} 
                width={100}
              />
              <Tooltip
                contentStyle={{ 
                  backgroundColor: '#18181b', 
                  border: '1px solid #27272a',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                formatter={(value) => [`${value} MB`, 'Tamanho']}
                labelFormatter={(label) => chartData.find(d => d.name === label)?.fullPath || String(label)}
              />
              <Bar dataKey="size" radius={[0, 4, 4, 0]}>
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
