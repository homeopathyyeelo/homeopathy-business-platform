'use client';

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CategoryStat } from '@/hooks/useGmbAnalytics';

interface CategoryChartProps {
    data: CategoryStat[];
}

export default function CategoryChart({ data }: CategoryChartProps) {
    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

    if (!data || data.length === 0) {
        return (
            <div className="h-64 flex items-center justify-center text-gray-400">
                No category data available
            </div>
        );
    }

    return (
        <div className="w-full" style={{ height: '350px' }}>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry: any) => {
                            const percent = entry.percent || 0;
                            return `${entry.category}: ${(percent * 100).toFixed(0)}%`;
                        }}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="count"
                        nameKey="category"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                    <Legend
                        verticalAlign="bottom"
                        height={60}
                        wrapperStyle={{ paddingTop: '20px' }}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
