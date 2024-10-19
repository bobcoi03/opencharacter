"use client";

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

type MessageData = {
  name: string;
  messageCount: number;
}[];

// Define a color palette
const colors = [
  "#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#0088FE", "#00C49F", "#FFBB28", "#FF8042",
  "#a4de6c", "#d0ed57", "#ffc658", "#ff7300", "#8dd1e1", "#a4de6c", "#d0ed57", "#83a6ed"
];

export default function BarChartDashboard({ messageData }: { messageData: MessageData }) {
  return (
    <div className="">
      <h2 className="text-sm font-semibold mb-2 text-white">Today Message Count by Character</h2>
      <ResponsiveContainer width="60%" height={250}>
        <BarChart data={messageData}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="messageCount">
            {messageData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}