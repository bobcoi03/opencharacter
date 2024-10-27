"use client";

import React from 'react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, TooltipProps } from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { Users } from 'lucide-react';

interface MessageCount {
  date: string;
  count: number;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
  if (active && payload && payload.length) {
    const date = new Date(label);
    const formattedDate = date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return (
      <div className="bg-gray-900/95 backdrop-blur-sm p-4 rounded-lg border border-gray-800 shadow-xl">
        <p className="text-gray-400 text-xs mb-2">{formattedDate}</p>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span className="text-sm font-medium text-gray-300">Active Users</span>
          </div>
          <span className="text-sm font-mono text-gray-200">
            {payload[0].value?.toLocaleString()}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export default function BarChartDashboard({ userCountData }: { userCountData: MessageCount[] }) {
  // Calculate the maximum value for better bar height distribution
  const maxCount = Math.max(...userCountData.map(d => d.count));
  const yAxisMax = Math.ceil(maxCount * 1.2); // Add 20% padding to the top

  return (
    <div className="bg-black rounded-xl shadow-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-gray-400" />
          <h2 className="text-base font-semibold text-white">Daily Active Users</h2>
        </div>
        <div className="text-xs text-gray-500">
          Last 30 Days
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <RechartsBarChart
          data={userCountData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          barSize={24}
        >
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0.3} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#374151"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            axisLine={{ stroke: '#374151' }}
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
            tickLine={{ stroke: '#374151' }}
          />
          <YAxis
            axisLine={{ stroke: '#374151' }}
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
            tickLine={{ stroke: '#374151' }}
            tickFormatter={(value) => value.toLocaleString()}
            domain={[0, yAxisMax]}
            allowDecimals={false}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: 'rgba(107, 114, 128, 0.1)' }}
          />
          <Bar
            dataKey="count"
            fill="url(#barGradient)"
            radius={[4, 4, 0, 0]}
            maxBarSize={50}
          />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}