"use client";

import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, TooltipProps } from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { BarChart } from 'lucide-react';

type DailyCount = {
  date: string;
  count: number;
};

type CharacterData = {
  name: string;
  data: DailyCount[];
};

type MessageData = CharacterData[];

const colors = [
  "#6366f1", // Indigo
  "#06b6d4", // Cyan
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#ec4899", // Pink
  "#8b5cf6", // Purple
  "#14b8a6", // Teal
  "#f97316", // Orange
  "#06aff1", // Light Blue
  "#84cc16", // Lime
];

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
        <div className="space-y-1.5">
          {payload.map((entry, index) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                <span className="text-sm font-medium text-gray-300">{entry.name}</span>
              </div>
              <span className="text-sm font-mono text-gray-200">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export default function LineChartDashboard({ messageData }: { messageData: MessageData }) {
  const chartData = messageData[0].data.map(item => {
    const dataPoint: { [key: string]: string | number } = { date: item.date };
    messageData.forEach((character, index) => {
      const matchingData = character.data.find(d => d.date === item.date);
      dataPoint[character.name] = matchingData ? matchingData.count : 0;
    });
    return dataPoint;
  });

  return (
    <div className="bg-black rounded-xl shadow-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BarChart className="w-5 h-5 text-gray-400" />
          <h2 className="text-base font-semibold text-white">Message Analytics</h2>
        </div>
        <div className="text-xs text-gray-500">
          Last 30 Days
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart 
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <defs>
            {colors.map((color, index) => (
              <linearGradient key={`gradient-${index}`} id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.1}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            ))}
          </defs>
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
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ 
              paddingTop: '20px',
              paddingBottom: '10px'
            }}
            formatter={(value) => (
              <span className="text-sm text-gray-300">{value}</span>
            )}
          />
          {messageData.map((character, index) => (
            <Line 
              key={character.name}
              type="monotone"
              dataKey={character.name}
              stroke={colors[index % colors.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ 
                r: 4, 
                strokeWidth: 2, 
                stroke: colors[index % colors.length],
                fill: '#111827'
              }}
              fill={`url(#gradient-${index})`}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}