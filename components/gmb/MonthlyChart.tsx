'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MonthStat } from '@/hooks/useGmbAnalytics';

interface MonthlyChartProps {
    data: MonthStat[];
}

export default function MonthlyChart({ data }: MonthlyChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="h-64 flex items-center justify-center text-gray-400">
                No monthly data available
            </div>
        );
    }

    // Sort data chronologically if needed, but backend already sorts by date desc
    // We might want to reverse it for the chart to show left-to-right time progression
    const chartData = [...data].reverse().map(item => ({
        name: `${item.month.substring(0, 3)} ${item.year}`,
        posts: item.count
    }));

    return (
        <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={chartData}
                    margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="posts" fill="#8884d8" name="Posts Published" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
