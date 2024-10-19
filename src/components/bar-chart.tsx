"use client";

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, TooltipProps } from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

interface MessageCount {
  date: string;
  count: number;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip bg-white text-gray-800 p-2 rounded shadow">
        <p className="label font-bold">{`Date: ${label}`}</p>
        <p className="intro">{`Active Users: ${payload[0].value}`}</p>
      </div>
    );
  }

  return null;
};

export default function BarChartDashboard({ userCountData }: { userCountData: MessageCount[] }) {
  return (
    <div className="">
      <h2 className="text-sm font-bold">Daily Active Users</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={userCountData}>
          <CartesianGrid 
            strokeDasharray="0" 
            horizontal={false} 
            vertical={false} 
          />
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tickFormatter={(value) => Math.round(value).toString()} // Ensure whole numbers
            allowDecimals={false} // Prevent decimal values on the axis
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="count" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}