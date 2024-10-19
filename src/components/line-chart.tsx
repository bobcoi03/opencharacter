"use client";

import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, TooltipProps } from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

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
  "#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#0088FE", "#00C49F", "#FFBB28", "#FF8042",
  "#a4de6c", "#d0ed57", "#ffc658", "#ff7300", "#8dd1e1", "#a4de6c", "#d0ed57", "#83a6ed"
];

const CustomTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
  if (active && payload && payload.length) {
    // Convert the label (which is the date string) to a more readable format
    const date = new Date(label);
    const formattedDate = date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return (
      <div className="custom-tooltip bg-gray-800 p-3 rounded shadow-lg border border-gray-700">
        <p className="label text-sm font-semibold mb-2">{formattedDate}</p>
        {payload.map((entry, index) => (
          <p key={`item-${index}`} className="text-sm" style={{ color: entry.color }}>
            {`${entry.name}: ${entry.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function LineChartDashboard({ messageData }: { messageData: MessageData }) {
  // Prepare data for the chart
  const chartData = messageData[0].data.map(item => {
    const dataPoint: { [key: string]: string | number } = { date: item.date };
    messageData.forEach((character, index) => {
      const matchingData = character.data.find(d => d.date === item.date);
      dataPoint[character.name] = matchingData ? matchingData.count : 0;
    });
    return dataPoint;
  });

  return (
    <div className="">
      <h2 className="text-sm font-semibold mb-2 text-white">Daily Message Count by Character Last 30 days</h2>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {messageData.map((character, index) => (
            <Line 
              key={character.name}
              type="monotone"
              dataKey={character.name}
              stroke={colors[index % colors.length]}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}