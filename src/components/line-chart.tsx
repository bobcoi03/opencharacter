"use client"

import React, { useState, useMemo } from 'react';
import { 
  AreaChart, Area,
  BarChart as RechartsBarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer 
} from 'recharts';
import { BarChart, Check } from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type DailyCount = {
  date: string;
  count: number;
};

type CharacterData = {
  name: string;
  data: DailyCount[];
};

type MessageData = CharacterData[];

type ChartType = 'area' | 'stackedArea' | 'bar';

const COLORS = [
  '#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', 
  '#8b5cf6', '#14b8a6', '#f97316', '#06aff1', '#84cc16',
  '#ef4444', '#3b82f6', '#a855f7', '#f43f5e', '#22c55e',
  '#64748b', '#eab308', '#06b6d4', '#0ea5e9', '#6366f1',
  '#8b5cf6', '#d946ef', '#ec4899', '#f43f5e', '#ef4444',
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;

  const date = new Date(label).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="bg-black/90 p-3 rounded-lg border border-gray-800 shadow-xl max-h-[300px] overflow-y-auto">
      <p className="text-gray-400 text-xs mb-2 sticky top-0 bg-black/90 pb-2">{date}</p>
      <div className="space-y-1">
        {payload.map((item: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div 
                className="w-2 h-2 rounded-full flex-shrink-0" 
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-gray-300 truncate">{item.name}</span>
            </div>
            <span className="text-sm font-mono text-gray-200">
              {item.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function MessageAnalytics({ messageData }: { messageData: MessageData }) {
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [selectedCharacters, setSelectedCharacters] = useState(
    () => new Set(messageData.map(char => char.name))
  );

  // Calculate total messages for each character
  const characterStats = useMemo(() => 
    messageData.map(char => ({
      name: char.name,
      totalMessages: char.data.reduce((sum, day) => sum + day.count, 0),
      data: char.data
    })).sort((a, b) => b.totalMessages - a.totalMessages)
  , [messageData]);

  // Prepare chart data
  const chartData = useMemo(() => {
    const dates = messageData[0].data.map(d => d.date);
    return dates.map(date => {
      const point: any = { date };
      characterStats.forEach(({ name, data }) => {
        if (selectedCharacters.has(name)) {
          const dayData = data.find(d => d.date === date);
          point[name] = dayData?.count || 0;
        }
      });
      return point;
    });
  }, [messageData, characterStats, selectedCharacters]);

  const toggleCharacter = (name: string) => {
    const newSelected = new Set(selectedCharacters);
    if (newSelected.has(name)) {
      newSelected.delete(name);
    } else {
      newSelected.add(name);
    }
    setSelectedCharacters(newSelected);
  };

  const toggleAll = () => {
    if (selectedCharacters.size === characterStats.length) {
      setSelectedCharacters(new Set());
    } else {
      setSelectedCharacters(new Set(characterStats.map(char => char.name)));
    }
  };

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 10, right: 30, left: 10, bottom: 0 }
    };

    const commonAxisProps = {
      xAxis: {
        dataKey: "date",
        stroke: "#4B5563",
        tick: { fill: '#9CA3AF', fontSize: 12 },
        tickFormatter: (date: string) => new Date(date).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        })
      },
      yAxis: {
        stroke: "#4B5563",
        tick: { fill: '#9CA3AF', fontSize: 12 },
        tickFormatter: (value: number) => value.toLocaleString()
      }
    };

    switch (chartType) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <XAxis {...commonAxisProps.xAxis} />
            <YAxis {...commonAxisProps.yAxis} />
            <Tooltip content={<CustomTooltip />} />
            {characterStats.map((char, index) => 
              selectedCharacters.has(char.name) && (
                <Area
                  key={char.name}
                  type="monotone"
                  dataKey={char.name}
                  stroke={COLORS[index % COLORS.length]}
                  fill={COLORS[index % COLORS.length]}
                  fillOpacity={0.1}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{
                    r: 4,
                    strokeWidth: 2,
                    fill: '#111827'
                  }}
                />
              )
            )}
          </AreaChart>
        );

      case 'stackedArea':
        return (
          <AreaChart {...commonProps}>
            <XAxis {...commonAxisProps.xAxis} />
            <YAxis {...commonAxisProps.yAxis} />
            <Tooltip content={<CustomTooltip />} />
            {characterStats.map((char, index) => 
              selectedCharacters.has(char.name) && (
                <Area
                  key={char.name}
                  type="monotone"
                  dataKey={char.name}
                  stroke={COLORS[index % COLORS.length]}
                  fill={COLORS[index % COLORS.length]}
                  stackId="1"
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
              )
            )}
          </AreaChart>
        );

      case 'bar':
        return (
          <RechartsBarChart {...commonProps}>
            <XAxis {...commonAxisProps.xAxis} />
            <YAxis {...commonAxisProps.yAxis} />
            <Tooltip content={<CustomTooltip />} />
            {characterStats.map((char, index) => 
              selectedCharacters.has(char.name) && (
                <Bar
                  key={char.name}
                  dataKey={char.name}
                  fill={COLORS[index % COLORS.length]}
                  fillOpacity={0.7}
                  stackId="stack"
                />
              )
            )}
          </RechartsBarChart>
        );
    }
  };

  const CharacterButton = ({ char, index }: { char: (typeof characterStats)[0], index: number }) => (
    <button
      onClick={() => toggleCharacter(char.name)}
      className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-900 border border-gray-800 hover:bg-gray-800/50 transition-colors min-w-fit"
    >
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded border border-gray-700 flex items-center justify-center">
          {selectedCharacters.has(char.name) && (
            <Check className="w-3 h-3 text-white" />
          )}
        </div>
        <div 
          className="w-2 h-2 rounded-full" 
          style={{ backgroundColor: COLORS[index % COLORS.length] }}
        />
      </div>
      <span className="text-sm text-gray-300">
        {char.name}
      </span>
      <span className="text-xs text-gray-500 ml-2">
        ({char.totalMessages.toLocaleString()})
      </span>
    </button>
  );

  return (
    <div className="bg-black rounded-xl shadow-2xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <BarChart className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-white">Message Analytics</h2>
          <span className="text-sm text-gray-500 ml-2">
            {selectedCharacters.size} of {characterStats.length} selected
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={toggleAll}
            className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors rounded-lg bg-gray-900 border border-gray-800"
          >
            {selectedCharacters.size === characterStats.length ? 'Deselect All' : 'Select All'}
          </button>
          <Select 
            value={chartType}
            onValueChange={(value) => setChartType(value as ChartType)}
          >
            <SelectTrigger className="w-40 bg-gray-900 border-gray-800">
              <SelectValue placeholder="Select chart type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bar">Stacked Bar</SelectItem>
              <SelectItem value="stackedArea">Stacked Area</SelectItem>
              <SelectItem value="area">Area Chart</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Character List */}
      <div className="overflow-x-auto">
        <div className="flex flex-wrap gap-2 min-w-min max-h-[88px]">
          {characterStats.map((char, index) => (
            <CharacterButton key={char.name} char={char} index={index} />
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
}