"use client";

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';

interface MessageCount {
  date: string;
  count: number;
}

// Define a color palette
const colors = [
  "#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#0088FE", "#00C49F", "#FFBB28", "#FF8042",
  "#a4de6c", "#d0ed57", "#ffc658", "#ff7300", "#8dd1e1", "#a4de6c", "#d0ed57", "#83a6ed"
];

export default function BarChartDashboard({ userCountData }: { userCountData: MessageCount[] }) {
  return (
      <div className="">
          <h2 className="text-sm font-bold">Daily Active Users</h2>
          <ResponsiveContainer width="100%" height={300}>
          <BarChart data={userCountData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8884d8" />
          </BarChart>
          </ResponsiveContainer>
      </div>
    );
}